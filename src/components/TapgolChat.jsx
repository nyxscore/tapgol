import React, { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { auth } from "../util/firebase";
import { onAuthStateChanged } from "firebase/auth";
import { getUserProfile } from "../util/userService";
import { 
  subscribeToChatMessages, 
  createChatMessage, 
  updateChatMessage, 
  deleteChatMessage 
} from "../util/chatService";
import {
  addOnlineUser,
  removeOnlineUser,
  subscribeToOnlineUsers
} from "../util/onlineUsersService";
import { createChatNotification } from "../util/notificationService";

const TapgolChat = () => {
  const navigate = useNavigate();
  const [messages, setMessages] = useState([]);
  const [user, setUser] = useState(null);
  const [userData, setUserData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [newMessage, setNewMessage] = useState("");
  const [editingMessage, setEditingMessage] = useState(null);
  const [editText, setEditText] = useState("");
  const [sending, setSending] = useState(false);
  const [onlineUsers, setOnlineUsers] = useState([]);
  const [showOnlineUsers, setShowOnlineUsers] = useState(false);
  const messagesEndRef = useRef(null);
  const unsubscribeRef = useRef(null);
  const onlineUsersUnsubscribeRef = useRef(null);
  const currentOnlineUserRef = useRef(null);

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

  useEffect(() => {
    // 실시간 메시지 구독
    try {
      unsubscribeRef.current = subscribeToChatMessages((newMessages) => {
        setMessages(newMessages);
        // 새 메시지가 오면 자동으로 스크롤
        setTimeout(() => {
          scrollToBottom();
        }, 100);
      });
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

    return () => {
      if (unsubscribeRef.current) {
        unsubscribeRef.current();
      }
      if (onlineUsersUnsubscribeRef.current) {
        onlineUsersUnsubscribeRef.current();
      }
    };
  }, []);

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
      if (currentOnlineUserRef.current) {
        removeOnlineUser(currentOnlineUserRef.current.id);
      }
    };
  }, []);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

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

      const createdMessage = await createChatMessage(messageData);
      
      // 채팅 알림 생성 (자신이 보낸 메시지는 제외)
      try {
        await createChatNotification({
          ...messageData,
          id: createdMessage.id
        });
      } catch (notificationError) {
        console.error("채팅 알림 생성 오류:", notificationError);
        // 알림 생성 실패는 메시지 전송에 영향을 주지 않도록 함
      }
      
      setNewMessage("");
    } catch (error) {
      console.error("메시지 전송 오류:", error);
      alert("메시지 전송에 실패했습니다.");
    } finally {
      setSending(false);
    }
  };

  const handleEditMessage = async (messageId) => {
    if (!editText.trim()) {
      alert("메시지 내용을 입력해주세요.");
      return;
    }

    try {
      await updateChatMessage(messageId, { content: editText.trim() });
      setEditingMessage(null);
      setEditText("");
    } catch (error) {
      console.error("메시지 수정 오류:", error);
      alert("메시지 수정에 실패했습니다.");
    }
  };

  const handleDeleteMessage = async (messageId) => {
    if (!window.confirm("정말로 이 메시지를 삭제하시겠습니까?")) {
      return;
    }

    try {
      await deleteChatMessage(messageId);
    } catch (error) {
      console.error("메시지 삭제 오류:", error);
      alert("메시지 삭제에 실패했습니다.");
    }
  };

  const startEdit = (message) => {
    setEditingMessage(message.id);
    setEditText(message.content);
  };

  const cancelEdit = () => {
    setEditingMessage(null);
    setEditText("");
  };

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

  return (
    <div className="min-h-screen bg-gradient-to-br from-amber-50 via-orange-50 to-amber-100">
      <main className="pb-20 pt-16">
        <div className="max-w-4xl mx-auto px-4">
          {/* Header */}
          <div className="bg-white rounded-2xl shadow-xl p-6 mb-6">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-2xl font-bold text-gray-800">탑골톡 💬</h1>
                <p className="text-gray-600 mt-1">실시간 채팅방</p>
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
            <div className="h-96 overflow-y-auto mb-4 space-y-3">
              {messages.length === 0 ? (
                <div className="text-center py-8">
                  <div className="text-gray-400 text-4xl mb-2">💬</div>
                  <p className="text-gray-500">아직 메시지가 없습니다.</p>
                  {user && (
                    <p className="text-sm text-gray-400 mt-1">첫 번째 메시지를 작성해보세요!</p>
                  )}
                </div>
              ) : (
                messages.map((message) => (
                  <div key={message.id} className="flex space-x-3">
                    <div className="w-8 h-8 bg-amber-600 rounded-full flex items-center justify-center text-white text-sm font-medium flex-shrink-0">
                      {message.author?.[0] || "익"}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between mb-1">
                        <div className="flex items-center space-x-2">
                          <span className="font-medium text-gray-800">{message.author}</span>
                          <span className="text-xs text-gray-500">{formatDate(message.createdAt)}</span>
                        </div>
                        {isMessageAuthor(message) && (
                          <div className="flex space-x-1">
                            <button
                              onClick={() => startEdit(message)}
                              className="text-xs text-blue-600 hover:text-blue-800 transition-colors"
                            >
                              수정
                            </button>
                            <button
                              onClick={() => handleDeleteMessage(message.id)}
                              className="text-xs text-red-600 hover:text-red-800 transition-colors"
                            >
                              삭제
                            </button>
                          </div>
                        )}
                      </div>
                      <p className="text-gray-700 whitespace-pre-wrap break-words">{message.content}</p>
                    </div>
                  </div>
                ))
              )}
              <div ref={messagesEndRef} />
            </div>
          </div>

          {/* Message Input */}
          {user ? (
            <div className="bg-white rounded-2xl shadow-xl p-6">
              {editingMessage ? (
                // Edit Mode
                <form onSubmit={(e) => { e.preventDefault(); handleEditMessage(editingMessage); }}>
                  <div className="flex space-x-3">
                    <div className="flex-1">
                      <textarea
                        value={editText}
                        onChange={(e) => setEditText(e.target.value)}
                        placeholder="메시지를 수정하세요..."
                        rows="3"
                        maxLength="500"
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent resize-none"
                      />
                      <div className="flex justify-between items-center mt-2">
                        <span className="text-xs text-gray-500">{editText.length}/500</span>
                        <div className="flex space-x-2">
                          <button
                            type="button"
                            onClick={cancelEdit}
                            className="px-3 py-1 text-gray-600 hover:text-gray-800 transition-colors"
                          >
                            취소
                          </button>
                          <button
                            type="submit"
                            disabled={!editText.trim()}
                            className="px-3 py-1 bg-amber-600 text-white rounded hover:bg-amber-700 transition-colors disabled:opacity-50"
                          >
                            저장
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                </form>
              ) : (
                // Send Mode
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
              )}
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

export default TapgolChat;
