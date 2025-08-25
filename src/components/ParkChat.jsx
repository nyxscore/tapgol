import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { auth } from '../util/firebase';
import { onAuthStateChanged } from 'firebase/auth';
import { getUserProfile } from '../util/userService';
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
  subscribeToOnlineUsers
} from "../util/onlineUsersService";
import { formatTextWithLinks } from "../util/textUtils.jsx";

const ParkChat = () => {
  const { parkId: parkIdParam } = useParams();
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [userData, setUserData] = useState(null);
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [onlineUsers, setOnlineUsers] = useState([]);
  const messagesEndRef = useRef(null);
  const currentOnlineUserRef = useRef(null);

  // parkId를 문자열로 변환
  const parkId = String(parkIdParam);

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
      if (currentUser) {
        setUser(currentUser);
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
          console.error('사용자 정보 로드 오류:', error);
          setUserData({
            nickname: currentUser.displayName || "익명",
            name: currentUser.displayName || "익명"
          });
        }
      } else {
        navigate('/login');
        return;
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, [navigate]);

  // 실시간 채팅 구독
  useEffect(() => {
    if (!parkId || !user) return;

    const q = query(
      collection(db, "parkChats"),
      where("parkId", "==", parkId)
    );

    const unsubscribe = onSnapshot(q, (querySnapshot) => {
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
      
      // 새 메시지가 오면 자동 스크롤
      setTimeout(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
      }, 100);
    });

    return () => unsubscribe();
  }, [parkId, user]);

  // 실시간 접속자 목록 구독
  useEffect(() => {
    if (!user) return;

    try {
      const unsubscribe = subscribeToOnlineUsers((users) => {
        setOnlineUsers(users);
      });

      return () => unsubscribe();
    } catch (error) {
      console.error("접속자 목록 구독 오류:", error);
    }
  }, [user]);

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

    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
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

  // 메시지 전송
  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!newMessage.trim() || !user || sending) return;

    setSending(true);

    try {
      const messageData = {
        content: newMessage.trim(),
        author: userData?.nickname || userData?.name || user.displayName || '익명',
        authorId: user.uid,
        parkId: parkId,
        createdAt: serverTimestamp()
      };

      await addDoc(collection(db, "parkChats"), messageData);
      setNewMessage('');
    } catch (error) {
      console.error('메시지 전송 오류:', error);
      alert('메시지 전송에 실패했습니다.');
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
      await deleteDoc(doc(db, "parkChats", messageId));
    } catch (error) {
      console.error('메시지 삭제 오류:', error);
      alert('메시지 삭제에 실패했습니다.');
    }
  };

  // 시간 포맷팅
  const formatTime = (timestamp) => {
    if (!timestamp) return '';
    
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

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-amber-50 via-orange-50 to-amber-100 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-amber-700 mx-auto mb-4"></div>
          <p className="text-amber-700">채팅방 로딩 중...</p>
        </div>
      </div>
    );
  }

  if (!currentPark) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-amber-50 via-orange-50 to-amber-100 flex items-center justify-center">
        <div className="text-center">
          <div className="text-gray-400 text-6xl mb-4">🏞️</div>
          <p className="text-red-600 text-lg mb-2">공원을 찾을 수 없습니다</p>
          <button
            onClick={() => navigate('/community')}
            className="px-4 py-2 bg-amber-600 text-white rounded-lg hover:bg-amber-700"
          >
            동네모임으로 돌아가기
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-amber-50 via-orange-50 to-amber-100">
      {/* 헤더 */}
      <div className="bg-white shadow-md sticky top-0 z-10">
        <div className="max-w-4xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <button
                onClick={() => navigate('/community')}
                className="text-gray-600 hover:text-gray-800"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
              </button>
                             <div>
                 <h1 className="text-lg font-semibold text-gray-800">{currentPark.name}</h1>
                 <p className="text-sm text-gray-600">{currentPark.location} • 공원별 채팅방</p>
                 <p className="text-xs text-gray-500">접속자: {onlineUsers.length}명</p>
               </div>
            </div>
            <div className="w-8 h-8 bg-amber-100 rounded-full flex items-center justify-center">
              <span className="text-amber-600 text-sm font-semibold">
                {userData?.nickname?.charAt(0) || user?.displayName?.charAt(0) || 'U'}
              </span>
            </div>
          </div>
        </div>
      </div>



      {/* 채팅 메시지 영역 */}
      <div className="max-w-4xl mx-auto px-4 py-4 pb-56">
        <div className="space-y-4">
          {messages.length === 0 ? (
            <div className="text-center py-12 text-gray-500">
              <div className="text-6xl mb-4">💬</div>
              <p className="text-lg font-medium mb-2">첫 번째 메시지를 작성해보세요!</p>
              <p className="text-sm">아래 입력창에 메시지를 입력하고 전송해보세요.</p>
            </div>
          ) : (
                         messages.map((message) => {
               const isMyMessage = message.authorId === user?.uid;
               return (
                 <div
                   key={message.id}
                   className={`flex ${isMyMessage ? 'justify-start' : 'justify-end'} mb-3`}
                 >
                   {isMyMessage && (
                     <div className="w-8 h-8 bg-amber-500 rounded-full flex items-center justify-center text-white text-sm font-medium flex-shrink-0 mr-2">
                       {userData?.nickname?.[0] || userData?.name?.[0] || user.displayName?.[0] || "나"}
                     </div>
                   )}
                   <div className={`max-w-xs lg:max-w-md ${isMyMessage ? 'order-1' : 'order-2'}`}>
                     {isMyMessage && (
                       <div className="flex items-center space-x-2 mb-1">
                         <span className="font-medium text-gray-800 text-sm">{message.author}</span>
                         <span className="text-xs text-gray-500">{formatTime(message.createdAt)}</span>
                       </div>
                     )}
                                           <div
                        className={`rounded-2xl px-4 py-2 ${
                          isMyMessage 
                            ? 'bg-amber-500 text-white rounded-bl-md' 
                            : 'bg-gray-200 text-gray-800 rounded-br-md'
                        }`}
                      >
                        <div className="whitespace-pre-wrap break-words text-sm">
                          {formatTextWithLinks(message.content)}
                        </div>
                      </div>
                                           {!isMyMessage && (
                        <div className="flex items-center justify-start space-x-1 mt-1">
                          <span className="text-xs text-gray-500">{formatTime(message.createdAt)}</span>
                          <span className="text-xs text-gray-400">• {message.author}</span>
                        </div>
                      )}
                      {isMyMessage && (
                        <div className="flex items-center justify-start space-x-1 mt-1">
                          <span className="text-xs text-gray-500">{formatTime(message.createdAt)}</span>
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

      {/* 메시지 입력 영역 */}
      <div className="fixed bottom-16 left-0 right-0 bg-white border-t border-gray-200 shadow-lg">
        <div className="max-w-4xl mx-auto px-4 py-4">
          <form onSubmit={handleSendMessage} className="flex space-x-3 items-center">
            <div className="flex-1 relative">
              <input
                type="text"
                value={newMessage}
                onChange={(e) => setNewMessage(e.target.value)}
                placeholder="메시지를 입력하세요..."
                className="w-full px-4 py-3 border-2 border-gray-200 rounded-full focus:outline-none focus:border-amber-500 focus:ring-2 focus:ring-amber-200 transition-colors text-sm"
                maxLength="200"
                disabled={sending}
              />
              <div className="absolute right-3 top-1/2 transform -translate-y-1/2 text-xs text-gray-400">
                {newMessage.length}/200
              </div>
            </div>
            <button
              type="submit"
              disabled={!newMessage.trim() || sending}
              className="px-6 py-3 bg-amber-600 text-white rounded-full hover:bg-amber-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors shadow-md flex items-center justify-center min-w-[80px]"
            >
              {sending ? (
                <div className="flex items-center">
                  <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  <span className="text-sm">전송 중...</span>
                </div>
              ) : (
                <div className="flex items-center">
                  <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                  </svg>
                  <span className="text-sm">전송</span>
                </div>
              )}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};

export default ParkChat;
