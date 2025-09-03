import React, { useState, useEffect, useRef } from "react";
import { useNavigate, useParams, useLocation } from "react-router-dom";
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
import ReportModal from "./ReportModal";
import UserProfileModal from "./UserProfileModal";
import { FaFlag } from "react-icons/fa";

const Chat = () => {
  const navigate = useNavigate();
  const { parkId: parkIdParam } = useParams();
  const location = useLocation();
  const [messages, setMessages] = useState([]);
  const [user, setUser] = useState(null);
  const [userData, setUserData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [newMessage, setNewMessage] = useState("");
  const [sending, setSending] = useState(false);
  const [onlineUsers, setOnlineUsers] = useState([]);
  const [showOnlineUsers, setShowOnlineUsers] = useState(false);
  const [showReportModal, setShowReportModal] = useState(false);
  const [reportTarget, setReportTarget] = useState(null);
  const [messageMenus, setMessageMenus] = useState({});
  const [replyingTo, setReplyingTo] = useState(null);
  const [showProfileModal, setShowProfileModal] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);
  const messagesEndRef = useRef(null);
  const unsubscribeRef = useRef(null);
  const onlineUsersUnsubscribeRef = useRef(null);
  const currentOnlineUserRef = useRef(null);
  const cleanupIntervalRef = useRef(null);
  const chatContainerRef = useRef(null);

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

  // /chat 경로로 접근 시 /chat/main으로 리디렉션
  useEffect(() => {
    if (location.pathname === "/chat") {
      navigate("/chat/main", { replace: true });
    }
  }, [location.pathname, navigate]);

  // 실시간 메시지 구독
  useEffect(() => {
    if (!user) return;

    // 현재 경로 확인
    const currentIsMainChat = location.pathname === "/chat/main";
    const currentIsParkChat = parkIdParam && location.pathname.includes("/chat/park/");

    try {
      if (currentIsParkChat && parkIdParam) {
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
          
          // 클라이언트에서 시간순 정렬 (오래된 메시지 → 최신 메시지)
          messages.sort((a, b) => {
            const aTime = a.createdAt?.toDate ? a.createdAt.toDate() : new Date(a.createdAt);
            const bTime = b.createdAt?.toDate ? b.createdAt.toDate() : new Date(b.createdAt);
            return aTime - bTime;
          });
          
          console.log("공원별 채팅 메시지 정렬 후:", messages.map(m => ({
            id: m.id,
            content: m.content?.substring(0, 20) + "...",
            time: m.createdAt?.toDate ? m.createdAt.toDate().toLocaleTimeString() : "시간없음"
          })));
          
          setMessages(messages);
          setTimeout(() => {
            forceScrollToBottom();
          }, 50);
        });
      } else if (currentIsMainChat) {
        // 메인 채팅 구독
        unsubscribeRef.current = subscribeToChatMessages((newMessages) => {
          // 메시지 필터링 (내용이 있는 메시지만)
          const filteredMessages = newMessages.filter(message => {
            return message.content && message.content.trim().length > 0;
          });

          // 항상 오래된 → 최신 순으로 정렬 보장
          const sorted = [...filteredMessages].sort((a, b) => {
            const aTime = a.createdAt?.toDate ? a.createdAt.toDate() : new Date(a.createdAt);
            const bTime = b.createdAt?.toDate ? b.createdAt.toDate() : new Date(b.createdAt);
            return aTime - bTime;
          });

          console.log("필터링된 메시지 수:", sorted.length, "전체 메시지 수:", newMessages.length);
          setMessages(sorted);
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

    // 메인 채팅 페이지에 접속하면 채팅 관련 알림을 읽음 처리
    if (user && currentIsMainChat) {
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
  }, [user, location.pathname, parkId, parkIdParam]);

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
    const chatContainer = chatContainerRef.current;
    if (!chatContainer) {
      return;
    }
    // 렌더 커밋 이후에 두 번 스크롤하여 레이아웃 계산/이미지 로딩 지연 보정
    requestAnimationFrame(() => {
      chatContainer.scrollTop = chatContainer.scrollHeight;
      requestAnimationFrame(() => {
        chatContainer.scrollTop = chatContainer.scrollHeight;
      });
    });
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: "auto" });
    }
  };

  // 컴포넌트 마운트 시 최신 메시지로 스크롤 및 경로 변경 시 보정
  useEffect(() => {
    if (!loading && (location.pathname === "/chat/main" || location.pathname.includes("/chat/park/"))) {
      setTimeout(() => {
        forceScrollToBottom();
      }, 50);
    }
  }, [loading, location.pathname]);

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

  // 메시지 메뉴 외부 클릭 시 닫기
  useEffect(() => {
    const handleClickOutside = (event) => {
      // 메뉴 버튼이나 메뉴 내부를 클릭한 경우가 아니라면 메뉴 닫기
      if (!event.target.closest('.message-menu')) {
        setMessageMenus({});
      }
    };

    document.addEventListener('click', handleClickOutside);
    return () => {
      document.removeEventListener('click', handleClickOutside);
    };
  }, []);



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
        authorName: userData?.nickname || userData?.name || user.displayName || "익명", // authorName 추가
        authorId: user.uid,
        authorEmail: user.email,
        replyTo: replyingTo ? {
          messageId: replyingTo.id,
          content: replyingTo.content,
          author: replyingTo.author,
          authorId: replyingTo.authorId
        } : null
      };

      // 현재 경로 확인
      const currentIsParkChat = parkIdParam && location.pathname.includes("/chat/park/");
      const currentIsMainChat = location.pathname === "/chat/main";

      if (currentIsParkChat && parkIdParam) {
        // 공원별 채팅 메시지 전송
        const parkMessageData = {
          ...messageData,
          parkId: parkId,
          createdAt: serverTimestamp()
        };
        await addDoc(collection(db, "parkChats"), parkMessageData);
      } else if (currentIsMainChat) {
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
      setReplyingTo(null); // 답글 상태 초기화
      
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
      // 현재 경로 확인
      const currentIsParkChat = parkIdParam && location.pathname.includes("/chat/park/");
      const currentIsMainChat = location.pathname === "/chat/main";

      if (currentIsParkChat && parkIdParam) {
        await deleteDoc(doc(db, "parkChats", messageId));
      } else if (currentIsMainChat) {
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

  // 메시지 메뉴 토글
  const toggleMessageMenu = (messageId) => {
    console.log('메시지 메뉴 토글:', messageId);
    
    setMessageMenus(prev => {
      const currentValue = prev[messageId];
      const newValue = !currentValue;
      
      // 새로운 상태 객체 생성 (React가 변경을 감지할 수 있도록)
      const newState = {};
      
      if (newValue) {
        // 현재 메시지 메뉴만 열기
        newState[messageId] = true;
      }
      // newValue가 false면 빈 객체 (모든 메뉴 닫기)
      
      return newState;
    });
  };

  // 메시지 신고
  const handleReportMessage = (message) => {
    if (!user) {
      alert("신고하려면 로그인이 필요합니다.");
      navigate("/login");
      return;
    }

    if (message.authorId === user.uid) {
      alert("자신의 메시지는 신고할 수 없습니다.");
      return;
    }

    // 신고 대상 메시지 데이터 설정
    const reportData = {
      id: message.id,
      content: message.content,
      author: message.author,
      authorId: message.authorId,
      createdAt: message.createdAt,
      chatType: isParkChat ? "park" : "main",
      parkId: isParkChat ? parkId : null
    };

    setReportTarget(reportData);
    setShowReportModal(true);
    setMessageMenus({}); // 모든 메뉴 닫기
  };

  // 신고 성공 처리
  const handleReportSuccess = (reportId) => {
    alert("신고가 접수되었습니다. 검토 후 조치하겠습니다.");
    console.log("신고 접수 ID:", reportId);
  };

  // 모달 닫기
  const handleCloseReportModal = () => {
    setShowReportModal(false);
    setReportTarget(null);
  };

  const handleShowProfile = (userId, userName) => {
    setSelectedUser({ id: userId, name: userName });
    setShowProfileModal(true);
  };

  const handleCloseProfileModal = () => {
    setShowProfileModal(false);
    setSelectedUser(null);
  };

  // 답글 시작
  const handleReplyToMessage = (message) => {
    if (!user) {
      alert("답글을 작성하려면 로그인이 필요합니다.");
      navigate("/login");
      return;
    }

    setReplyingTo({
      id: message.id,
      content: message.content,
      author: message.author,
      authorId: message.authorId
    });
    setMessageMenus({}); // 모든 메뉴 닫기
  };

  // 답글 취소
  const handleCancelReply = () => {
    setReplyingTo(null);
  };

  // 경로 판단 변수들
  const isMainChat = location.pathname === "/chat/main";
  const isParkChat = parkIdParam && location.pathname.includes("/chat/park/");

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

  // 채팅방 화면 (메인 채팅 또는 공원별 채팅)
  return (
    <div className="min-h-screen bg-gradient-to-br from-amber-50 via-orange-50 to-amber-100">
      <main className="pb-20 pt-16">
        <div className="max-w-4xl mx-auto px-4">
          {/* Header */}
          <div className="bg-white rounded-2xl shadow-xl p-6 mb-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                {/* 뒤로가기 버튼 - 홈으로 이동 */}
                {(isMainChat || isParkChat) && (
                  <button
                    onClick={() => navigate("/")}
                    className="flex items-center justify-center w-12 h-12 bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white rounded-full shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-110"
                    title="홈으로 돌아가기"
                  >
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M10.5 19.5L3 12m0 0l7.5-7.5M3 12h18" />
                    </svg>
                  </button>
                )}
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
            <div ref={chatContainerRef} className="h-96 overflow-y-auto mb-4 space-y-3 chat-messages-container" style={{ scrollBehavior: 'auto' }}>
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
                      <div 
                        className={`max-w-xs lg:max-w-md ${isMyMessage ? 'order-1' : 'order-2'}`}
                      >
                        {isMyMessage && (
                          <div className="flex items-center space-x-2 mb-1">
                            <span className="font-medium text-gray-800 text-sm">
                              {message.author || message.authorName || userData?.nickname || userData?.name || user?.displayName || "나"}
                            </span>
                            <span className="text-xs text-gray-500">{formatDate(message.createdAt)}</span>
                          </div>
                        )}
                        <div className={`rounded-2xl px-4 py-2 ${
                          isMyMessage 
                            ? 'bg-amber-500 text-white rounded-bl-md' 
                            : 'bg-gray-200 text-gray-800 rounded-br-md'
                        }`}>
                          {/* 답글 정보 표시 */}
                          {message.replyTo && (
                            <div className={`mb-2 p-2 rounded-lg border-l-4 ${
                              isMyMessage 
                                ? 'bg-orange-100 border-orange-400 text-orange-800' 
                                : 'bg-blue-50 border-blue-400 text-blue-800'
                            }`}>
                              <div className="text-xs font-semibold mb-1 flex items-center">
                                <svg className="w-3 h-3 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h10a8 8 0 018 8v2M3 10l6 6m-6-6l6-6" />
                                </svg>
                                {message.replyTo.author}님에게 답글
                              </div>
                              <div className="text-xs opacity-90 line-clamp-2 italic">
                                "{message.replyTo.content}"
                              </div>
                            </div>
                          )}
                          <div className="whitespace-pre-wrap break-words text-sm">
                            {formatTextWithLinks(message.content)}
                          </div>
                        </div>
                        {!isMyMessage && (
                          <div className="mt-1">
                            <div className="flex items-center justify-between mb-2">
                              <div className="flex items-center space-x-1">
                                <span className="text-xs text-gray-500">{formatDate(message.createdAt)}</span>
                                <span 
                                  className="text-xs text-gray-400 hover:text-gray-600 cursor-pointer transition-colors"
                                  onClick={() => handleShowProfile(message.authorId || message.userId, message.author || message.authorName)}
                                  title="프로필 보기"
                                >
                                  • {message.author || message.authorName || "익명"}
                                </span>
                              </div>
                              <button
                                onClick={(e) => {
                                  e.preventDefault();
                                  e.stopPropagation();
                                  toggleMessageMenu(message.id);
                                }}
                                className="text-xs text-gray-400 hover:text-gray-600 transition-colors px-2 py-1 rounded hover:bg-gray-100"
                                title="메시지 옵션"
                              >
                                ⋯
                              </button>
                            </div>
                            {user && !isMyMessage && messageMenus[message.id] && (
                              <div className="flex items-center space-x-2 mt-2 message-menu">
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleReplyToMessage(message);
                                  }}
                                  className="text-xs text-blue-600 hover:text-blue-800 transition-colors px-3 py-1 rounded bg-blue-50 hover:bg-blue-100 border border-blue-200"
                                >
                                  답글
                                </button>
                                {!isMyMessage && (
                                  <button
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      handleReportMessage(message);
                                    }}
                                    className="text-xs text-red-600 hover:text-red-800 transition-colors px-3 py-1 rounded bg-red-50 hover:bg-red-100 border border-red-200"
                                  >
                                    신고
                                  </button>
                                )}
                              </div>
                            )}
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
                        <div 
                          className="w-8 h-8 bg-amber-600 rounded-full flex items-center justify-center text-white text-sm font-medium flex-shrink-0 ml-2 cursor-pointer hover:bg-amber-700 transition-colors"
                          onClick={() => handleShowProfile(message.authorId || message.userId, message.author || message.authorName)}
                          title="프로필 보기"
                        >
                          {(message.author || message.authorName || "익명")[0]}
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
              {/* 답글 미리보기 */}
              {replyingTo && (
                <div className="mb-4 p-4 bg-gradient-to-r from-blue-50 to-indigo-50 border-l-4 border-blue-400 rounded-lg shadow-sm">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="text-sm font-semibold text-blue-800 mb-2 flex items-center">
                        <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h10a8 8 0 018 8v2M3 10l6 6m-6-6l6-6" />
                        </svg>
                        {replyingTo.author}님에게 답글 작성 중
                      </div>
                      <div className="text-sm text-blue-700 line-clamp-2 bg-white bg-opacity-50 p-2 rounded italic">
                        "{replyingTo.content}"
                      </div>
                    </div>
                    <button
                      onClick={handleCancelReply}
                      className="ml-3 text-blue-400 hover:text-red-500 transition-colors p-1 hover:bg-red-50 rounded-full"
                      title="답글 취소"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                  </div>
                </div>
              )}
              <form onSubmit={handleSubmitMessage}>
                <div className="flex space-x-3">
                  <div className="w-8 h-8 bg-amber-600 rounded-full flex items-center justify-center text-white text-sm font-medium flex-shrink-0">
                    {userData?.nickname?.[0] || userData?.name?.[0] || user.displayName?.[0] || "익"}
                  </div>
                  <div className="flex-1">
                    <textarea
                      value={newMessage}
                      onChange={(e) => setNewMessage(e.target.value)}
                      placeholder={replyingTo ? `${replyingTo.author}님에게 답글을 입력하세요...` : "메시지를 입력하세요..."}
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
                        {sending ? "전송 중..." : replyingTo ? "답글 전송" : "전송"}
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

      {/* 신고 모달 */}
      <ReportModal
        isOpen={showReportModal}
        onClose={handleCloseReportModal}
        targetData={reportTarget}
        targetType="message"
        onSuccess={handleReportSuccess}
      />

      {/* 사용자 프로필 모달 */}
      <UserProfileModal
        isOpen={showProfileModal}
        onClose={handleCloseProfileModal}
        userId={selectedUser?.id}
        userName={selectedUser?.name}
      />
    </div>
  );
};

export default Chat;
