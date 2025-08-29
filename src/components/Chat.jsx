import React, { useState, useEffect, useRef } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { auth } from "../util/firebase";
import { onAuthStateChanged } from "firebase/auth";
import { getUserProfile } from "../util/userService";
import { 
  subscribeToChatMessages, 
  createChatMessage, 
  deleteChatMessage 
} from "../util/chatService";
import { 
  collection, 
  addDoc, 
  query, 
  where, 
  onSnapshot, 
  serverTimestamp,
  deleteDoc,
  doc
} from "firebase/firestore";
import { db } from "../util/firebase";
import {
  addOnlineUser,
  removeOnlineUser,
  subscribeToOnlineUsers,
  updateUserActivity,
  startPeriodicCleanup
} from "../util/onlineUsersService";
import { createChatNotification, markChatNotificationsAsRead } from "../util/notificationService";
import { formatTextWithLinks } from "../util/textUtils.jsx";

const Chat = () => {
  const navigate = useNavigate();
  const { chatType = "main", parkId: parkIdParam } = useParams();
  const [messages, setMessages] = useState([]);
  const [user, setUser] = useState(null);
  const [userData, setUserData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [newMessage, setNewMessage] = useState("");
  const [sending, setSending] = useState(false);
  const [onlineUsers, setOnlineUsers] = useState([]);
  const [showOnlineUsers, setShowOnlineUsers] = useState(false);
  const messagesEndRef = useRef(null);
  const unsubscribeRef = useRef(null);
  const onlineUsersUnsubscribeRef = useRef(null);
  const currentOnlineUserRef = useRef(null);
  const cleanupIntervalRef = useRef(null);

  // parkId를 문자열로 변환
  const parkId = String(parkIdParam || "1");

  // 공원 정보
  const parks = {
    "1": { name: '탑골공원', location: '종로구' },
    "2": { name: '한강공원', location: '용산구' },
    "3": { name: '북서울꿈의숲', location: '강북구' },
    "4": { name: '월드컵공원', location: '마포구' },
    "5": { name: '올림픽공원', location: '송파구' },
    "6": { name: '남산공원', location: '중구' }
  };

  const currentPark = parks[parkId];

  // 채팅방 목록 (메인 채팅 화면용)
  const chatRooms = [
    {
      id: 1,
      name: "탑골톡",
      description: "메인 채팅방",
      lastMessage: "안녕하세요! 오늘 날씨가 정말 좋네요.",
      lastMessageTime: "14:30",
      unreadCount: 3,
      participants: 25,
      type: "main"
    },
    {
      id: 2,
      name: "탑골공원 채팅방",
      description: "탑골공원 이웃들과 대화",
      lastMessage: "내일 산책하실 분 계신가요?",
      lastMessageTime: "12:15",
      unreadCount: 0,
      participants: 18,
      type: "park",
      parkId: "1"
    },
    {
      id: 3,
      name: "한강공원 채팅방",
      description: "한강공원 이웃들과 대화",
      lastMessage: "가족 피크닉 장소 추천해주세요!",
      lastMessageTime: "09:45",
      unreadCount: 7,
      participants: 32,
      type: "park",
      parkId: "2"
    },
    {
      id: 4,
      name: "북서울꿈의숲 채팅방",
      description: "북서울꿈의숲 이웃들과 대화",
      lastMessage: "오늘 축구하실 분 있나요?",
      lastMessageTime: "16:20",
      unreadCount: 1,
      participants: 15,
      type: "park",
      parkId: "3"
    }
  ];

  // 사용자 인증 확인
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      setUser(currentUser);
      if (currentUser) {
        try {
          const profile = await getUserProfile(currentUser.uid);
          setUserData(profile);
          
          // 접속자 목록에 추가
          const onlineUserData = {
            authorId: currentUser.uid,
            author: profile?.nickname || profile?.name || currentUser.displayName || "익명",
            authorEmail: currentUser.email
          };
          
          const onlineUser = await addOnlineUser(onlineUserData);
          currentOnlineUserRef.current = onlineUser;
        } catch (error) {
          console.error("사용자 정보 로드 오류:", error);
        }
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  // 실시간 메시지 구독
  useEffect(() => {
    if (!user) return;

    try {
      if (parkIdParam) {
        // 공원별 채팅 구독
        const q = query(
          collection(db, "parkChats"),
          where("parkId", "==", parkId)
        );

        unsubscribeRef.current = onSnapshot(q, (querySnapshot) => {
          const messages = [];
          querySnapshot.forEach((doc) => {
            messages.push({
              id: doc.id,
              ...doc.data()
            });
          });
          
          // 클라이언트에서 시간순 정렬
          messages.sort((a, b) => {
            const aTime = a.createdAt?.toDate ? a.createdAt.toDate() : new Date(a.createdAt);
            const bTime = b.createdAt?.toDate ? b.createdAt.toDate() : new Date(b.createdAt);
            return aTime - bTime;
          });
          
          setMessages(messages);
          setTimeout(() => {
            forceScrollToBottom();
          }, 50);
        });
      } else {
        // 메인 채팅 구독
        unsubscribeRef.current = subscribeToChatMessages((newMessages) => {
          setMessages(newMessages);
          setTimeout(() => {
            forceScrollToBottom();
          }, 50);
        });
      }
    } catch (error) {
      console.error("채팅 구독 오류:", error);
    }

    // 실시간 접속자 목록 구독
    try {
      onlineUsersUnsubscribeRef.current = subscribeToOnlineUsers((users) => {
        setOnlineUsers(users);
      });
    } catch (error) {
      console.error("접속자 목록 구독 오류:", error);
    }

    // 주기적 오프라인 사용자 정리 시작
    cleanupIntervalRef.current = startPeriodicCleanup();

    // 채팅 페이지에 접속하면 채팅 관련 알림을 읽음 처리
    if (user && !parkIdParam && !chatType) {
      try {
        const processedCount = markChatNotificationsAsRead();
        if (processedCount > 0) {
          console.log(`${processedCount}개의 채팅 관련 알림이 읽음 처리되었습니다.`);
        }
      } catch (notificationError) {
        console.error("채팅 알림 읽음 처리 오류:", notificationError);
      }
    }

    return () => {
      if (unsubscribeRef.current) {
        unsubscribeRef.current();
      }
      if (onlineUsersUnsubscribeRef.current) {
        onlineUsersUnsubscribeRef.current();
      }
      if (cleanupIntervalRef.current) {
        cleanupIntervalRef.current();
      }
    };
  }, [user, chatType, parkId, parkIdParam]);

  // 페이지를 벗어날 때 접속자 목록에서 제거
  useEffect(() => {
    const handleBeforeUnload = async () => {
      if (currentOnlineUserRef.current) {
        try {
          await removeOnlineUser(currentOnlineUserRef.current.id);
        } catch (error) {
          console.error("접속자 제거 오류:", error);
        }
      }
    };

    const handleVisibilityChange = async () => {
      if (document.visibilityState === 'hidden' && currentOnlineUserRef.current) {
        try {
          await removeOnlineUser(currentOnlineUserRef.current.id);
        } catch (error) {
          console.error("접속자 제거 오류:", error);
        }
      }
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    document.addEventListener('visibilitychange', handleVisibilityChange);
    
    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, []);

  // 컴포넌트 언마운트 시 접속자 제거
  useEffect(() => {
    return () => {
      if (currentOnlineUserRef.current) {
        removeOnlineUser(currentOnlineUserRef.current.id).catch(error => {
          console.error("컴포넌트 언마운트 시 접속자 제거 오류:", error);
        });
      }
    };
  }, []);

  // 강제로 스크롤을 맨 아래로 이동하는 함수
  const forceScrollToBottom = () => {
    const chatContainer = document.querySelector('.chat-messages-container');
    if (chatContainer) {
      chatContainer.scrollTop = chatContainer.scrollHeight;
    }
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: "auto" });
    }
  };

  // 컴포넌트 마운트 시 최신 메시지로 스크롤
  useEffect(() => {
    if (messages.length > 0) {
      forceScrollToBottom();
      setTimeout(() => {
        forceScrollToBottom();
      }, 50);
      setTimeout(() => {
        forceScrollToBottom();
      }, 200);
    }
  }, [messages.length]);

  // 사용자 활동 감지
  useEffect(() => {
    const handleUserActivity = async () => {
      if (currentOnlineUserRef.current && user) {
        try {
          await updateUserActivity(currentOnlineUserRef.current.id);
        } catch (error) {
          console.error("활동 업데이트 오류:", error);
        }
      }
    };

    // 2분마다 활동 상태 업데이트
    const activityInterval = setInterval(handleUserActivity, 2 * 60 * 1000);

    return () => {
      clearInterval(activityInterval);
    };
  }, [user]);

  // 채팅방 클릭 핸들러
  const handleChatRoomClick = (room) => {
    if (room.type === "main") {
      navigate("/chat/main");
    } else if (room.type === "park") {
      navigate(`/chat/park/${room.parkId}`);
    }
  };

  // 메시지 전송
  const handleSubmitMessage = async (e) => {
    e.preventDefault();
    
    if (!user) {
      alert("메시지를 작성하려면 로그인이 필요합니다.");
      navigate("/login");
      return;
    }

    if (!newMessage.trim()) {
      alert("메시지를 입력해주세요.");
      return;
    }

    setSending(true);
    try {
      const messageData = {
        content: newMessage.trim(),
        author: userData?.nickname || userData?.name || user.displayName || "익명",
        authorId: user.uid,
        authorEmail: user.email
      };

      if (parkIdParam) {
        // 공원별 채팅 메시지 전송
        const parkMessageData = {
          ...messageData,
          parkId: parkId,
          createdAt: serverTimestamp()
        };
        await addDoc(collection(db, "parkChats"), parkMessageData);
      } else {
        // 메인 채팅 메시지 전송
        const createdMessage = await createChatMessage(messageData);
        
        // 채팅 알림 생성
        try {
          await createChatNotification({
            ...messageData,
            id: createdMessage.id
          });
        } catch (notificationError) {
          console.error("채팅 알림 생성 오류:", notificationError);
        }
      }
      
      // 사용자 활동 업데이트
      if (currentOnlineUserRef.current) {
        await updateUserActivity(currentOnlineUserRef.current.id);
      }
      
      setNewMessage("");
      
      setTimeout(() => {
        forceScrollToBottom();
      }, 50);
    } catch (error) {
      console.error("메시지 전송 오류:", error);
      alert("메시지 전송에 실패했습니다.");
    } finally {
      setSending(false);
    }
  };

  // 메시지 삭제
  const handleDeleteMessage = async (messageId) => {
    if (!window.confirm("정말로 이 메시지를 삭제하시겠습니까?")) {
      return;
    }

    try {
      if (parkIdParam) {
        await deleteDoc(doc(db, "parkChats", messageId));
      } else {
        await deleteChatMessage(messageId);
      }
    } catch (error) {
      console.error("메시지 삭제 오류:", error);
      alert("메시지 삭제에 실패했습니다.");
    }
  };

  // 시간 포맷팅
  const formatDate = (timestamp) => {
    if (!timestamp) return "";
    
    const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
    const now = new Date();
    const diffInMinutes = Math.floor((now - date) / (1000 * 60));
    
    if (diffInMinutes < 1) return "방금 전";
    if (diffInMinutes < 60) return `${diffInMinutes}분 전`;
    if (diffInMinutes < 1440) return `${Math.floor(diffInMinutes / 60)}시간 전`;
    
    return date.toLocaleDateString('ko-KR', {
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const isMessageAuthor = (message) => {
    return user && message.authorId === user.uid;
  };

  // 로딩 상태
  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-amber-50 via-orange-50 to-amber-100">
        <main className="pb-20 pt-16">
          <div className="max-w-4xl mx-auto px-4">
            <div className="text-center py-12">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-amber-700 mx-auto mb-4"></div>
              <p className="text-amber-700">채팅방을 불러오는 중...</p>
            </div>
          </div>
        </main>
      </div>
    );
  }

  // 채팅방 목록 화면 (기본 /chat 경로)
  if (!parkIdParam && !chatType) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-amber-50 via-orange-50 to-amber-100">
        <main className="pb-20 pt-16">
          <div className="max-w-4xl mx-auto px-4">
            <div className="mb-6">
              <h1 className="text-2xl font-bold text-gray-800 mb-2">공원톡</h1>
              <p className="text-gray-600">이웃들과 대화를 나누어보세요</p>
            </div>
            
            <div className="space-y-4">
              {chatRooms.map((room) => (
                <div
                  key={room.id}
                  onClick={() => handleChatRoomClick(room)}
                  className="bg-white rounded-lg shadow-md p-4 cursor-pointer hover:shadow-lg transition-shadow"
                >
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="font-semibold text-gray-800">{room.name}</h3>
                    <div className="flex items-center space-x-2">
                      {room.unreadCount > 0 && (
                        <span className="bg-red-500 text-white text-xs px-2 py-1 rounded-full">
                          {room.unreadCount}
                        </span>
                      )}
                      <span className="text-sm text-gray-500">{room.lastMessageTime}</span>
                    </div>
                  </div>
                  <p className="text-sm text-gray-600 mb-2">{room.description}</p>
                  <p className="text-sm text-gray-600 mb-2 line-clamp-1">{room.lastMessage}</p>
                  <div className="flex justify-between items-center">
                    <span className="text-xs text-gray-500">{room.participants}명 참여중</span>
                    <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </main>
      </div>
    );
  }

  // 채팅방 화면
  return (
    <div className="min-h-screen bg-gradient-to-br from-amber-50 via-orange-50 to-amber-100">
      <main className="pb-20 pt-16">
        <div className="max-w-4xl mx-auto px-4">
          {/* Header */}
          <div className="bg-white rounded-2xl shadow-xl p-6 mb-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                                 <button
                   onClick={() => navigate("/chat")}
                   className="text-gray-600 hover:text-gray-800"
                 >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                  </svg>
                </button>
                <div>
                  <h1 className="text-2xl font-bold text-gray-800">
                    {parkIdParam ? `${currentPark?.name} 채팅방` : "탑골톡 💬"}
                  </h1>
                  <p className="text-gray-600 mt-1">
                    {parkIdParam ? `${currentPark?.location} • 공원별 채팅방` : "실시간 채팅방"}
                  </p>
                </div>
              </div>
              <div className="text-right">
                <div className="flex items-center space-x-4">
                  <div className="text-right">
                    <p className="text-sm text-gray-500">접속자: {onlineUsers.length}명</p>
                    <button
                      onClick={() => setShowOnlineUsers(!showOnlineUsers)}
                      className="text-xs text-amber-600 hover:text-amber-700 transition-colors"
                    >
                      {showOnlineUsers ? "접속자 숨기기" : "접속자 보기"}
                    </button>
                  </div>
                  {!user && (
                    <button
                      onClick={() => navigate("/login")}
                      className="px-4 py-2 bg-amber-600 text-white rounded-lg hover:bg-amber-700 transition-colors text-sm"
                    >
                      로그인
                    </button>
                  )}
                </div>
              </div>
            </div>
            
            {/* 접속자 목록 */}
            {showOnlineUsers && (
              <div className="mt-4 pt-4 border-t border-gray-200">
                <h3 className="text-sm font-medium text-gray-700 mb-2">현재 접속자 ({onlineUsers.length}명)</h3>
                <div className="flex flex-wrap gap-2">
                  {onlineUsers.length === 0 ? (
                    <p className="text-sm text-gray-500">접속자가 없습니다.</p>
                  ) : (
                    onlineUsers.map((onlineUser) => {
                      const isCurrentUser = user && onlineUser.authorId === user.uid;
                      return (
                        <div
                          key={onlineUser.id}
                          className={`flex items-center space-x-2 px-3 py-1 rounded-full ${
                            isCurrentUser 
                              ? 'bg-amber-200 border border-amber-300' 
                              : 'bg-amber-50'
                          }`}
                        >
                          <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                          <span className={`text-sm ${
                            isCurrentUser ? 'font-semibold text-amber-800' : 'text-gray-700'
                          }`}>
                            {onlineUser.author}
                            {isCurrentUser && ' (나)'}
                          </span>
                        </div>
                      );
                    })
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Chat Messages */}
          <div className="bg-white rounded-2xl shadow-xl p-6 mb-6">
            <div className="h-96 overflow-y-auto mb-4 space-y-3 chat-messages-container" style={{ scrollBehavior: 'smooth' }}>
              {messages.length === 0 ? (
                <div className="text-center py-8">
                  <div className="text-gray-400 text-4xl mb-2">💬</div>
                  <p className="text-gray-500">아직 메시지가 없습니다.</p>
                  {user && (
                    <p className="text-sm text-gray-400 mt-1">첫 번째 메시지를 작성해보세요!</p>
                  )}
                </div>
              ) : (
                messages.map((message) => {
                  const isMyMessage = isMessageAuthor(message);
                  return (
                    <div key={message.id} className={`flex ${isMyMessage ? 'justify-start' : 'justify-end'} mb-3`}>
                      {isMyMessage && (
                        <div className="w-8 h-8 bg-amber-500 rounded-full flex items-center justify-center text-white text-sm font-medium flex-shrink-0 mr-2">
                          {userData?.nickname?.[0] || userData?.name?.[0] || user.displayName?.[0] || "나"}
                        </div>
                      )}
                      <div className={`max-w-xs lg:max-w-md ${isMyMessage ? 'order-1' : 'order-2'}`}>
                        {isMyMessage && (
                          <div className="flex items-center space-x-2 mb-1">
                            <span className="font-medium text-gray-800 text-sm">{message.author}</span>
                            <span className="text-xs text-gray-500">{formatDate(message.createdAt)}</span>
                          </div>
                        )}
                        <div className={`rounded-2xl px-4 py-2 ${
                          isMyMessage 
                            ? 'bg-amber-500 text-white rounded-bl-md' 
                            : 'bg-gray-200 text-gray-800 rounded-br-md'
                        }`}>
                          <div className="whitespace-pre-wrap break-words text-sm">
                            {formatTextWithLinks(message.content)}
                          </div>
                        </div>
                        {!isMyMessage && (
                          <div className="flex items-center justify-start space-x-1 mt-1">
                            <span className="text-xs text-gray-500">{formatDate(message.createdAt)}</span>
                            <span className="text-xs text-gray-400">• {message.author}</span>
                          </div>
                        )}
                        {isMyMessage && (
                          <div className="flex items-center justify-start space-x-1 mt-1">
                            <span className="text-xs text-gray-500">{formatDate(message.createdAt)}</span>
                            <button
                              onClick={() => handleDeleteMessage(message.id)}
                              className="text-xs text-red-600 hover:text-red-800 transition-colors"
                            >
                              삭제
                            </button>
                          </div>
                        )}
                      </div>
                      {!isMyMessage && (
                        <div className="w-8 h-8 bg-amber-600 rounded-full flex items-center justify-center text-white text-sm font-medium flex-shrink-0 ml-2">
                          {message.author?.[0] || "익"}
                        </div>
                      )}
                    </div>
                  );
                })
              )}
              <div ref={messagesEndRef} />
            </div>
          </div>

          {/* Message Input */}
          {user ? (
            <div className="bg-white rounded-2xl shadow-xl p-6">
              <form onSubmit={handleSubmitMessage}>
                <div className="flex space-x-3">
                  <div className="w-8 h-8 bg-amber-600 rounded-full flex items-center justify-center text-white text-sm font-medium flex-shrink-0">
                    {userData?.nickname?.[0] || userData?.name?.[0] || user.displayName?.[0] || "익"}
                  </div>
                  <div className="flex-1">
                    <textarea
                      value={newMessage}
                      onChange={(e) => setNewMessage(e.target.value)}
                      placeholder="메시지를 입력하세요..."
                      rows="3"
                      maxLength="500"
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent resize-none"
                    />
                    <div className="flex justify-between items-center mt-2">
                      <span className="text-xs text-gray-500">{newMessage.length}/500</span>
                      <button
                        type="submit"
                        disabled={sending || !newMessage.trim()}
                        className="px-4 py-2 bg-amber-600 text-white rounded-lg hover:bg-amber-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        {sending ? "전송 중..." : "전송"}
                      </button>
                    </div>
                  </div>
                </div>
              </form>
            </div>
          ) : (
            <div className="bg-white rounded-2xl shadow-xl p-6">
              <div className="text-center py-4">
                <p className="text-gray-600 mb-3">메시지를 작성하려면 로그인이 필요합니다.</p>
                <button
                  onClick={() => navigate("/login")}
                  className="px-6 py-2 bg-amber-600 text-white rounded-lg hover:bg-amber-700 transition-colors"
                >
                  로그인하기
                </button>
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  );
};

export default Chat;
