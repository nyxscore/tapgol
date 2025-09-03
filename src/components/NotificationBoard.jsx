import React, { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { auth } from "../util/firebase";
import { onAuthStateChanged } from "firebase/auth";
import { getUserProfile } from "../util/userService";
import { 
  subscribeToNotifications, 
  getNotification,
  markNotificationAsRead,
  markAllNotificationsAsRead,
  createNotification,
  updateNotification,
  deleteNotification
} from "../util/notificationService";
import UserProfileModal from './UserProfileModal';

const NotificationBoard = () => {
  const navigate = useNavigate();
  const [notifications, setNotifications] = useState([]);
  const [user, setUser] = useState(null);
  const [userData, setUserData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [selectedNotification, setSelectedNotification] = useState(null);
  const [showDetail, setShowDetail] = useState(false);
  const [showWriteForm, setShowWriteForm] = useState(false);
  const [showEditForm, setShowEditForm] = useState(false);
  const [formData, setFormData] = useState({
    title: "",
    content: "",
    category: "update",
    priority: "normal"
  });
  const [editingId, setEditingId] = useState(null);
  const unsubscribeRef = useRef(null);
  
  // 프로필 모달 관련 상태
  const [showProfileModal, setShowProfileModal] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      setUser(currentUser);
      if (currentUser) {
        try {
          const profile = await getUserProfile(currentUser.uid);
          setUserData(profile);
        } catch (error) {
          console.error("사용자 정보 로드 오류:", error);
        }
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  useEffect(() => {
    // 실시간 알림 구독
    try {
      unsubscribeRef.current = subscribeToNotifications((newNotifications) => {
        setNotifications(newNotifications);
      });
    } catch (error) {
      console.error("알림 구독 오류:", error);
    }

    return () => {
      if (unsubscribeRef.current) {
        unsubscribeRef.current();
      }
    };
  }, []);

  const handleNotificationClick = async (notification) => {
    try {
      // 채팅 알림인 경우 채팅 페이지로 이동
      if (notification.category === "chat") {
        await markNotificationAsRead(notification.id);
        navigate("/chat");
        return;
      }
      
      setSelectedNotification(notification);
      setShowDetail(true);
      
      // 읽음 처리
      await markNotificationAsRead(notification.id);
    } catch (error) {
      console.error("알림 읽음 처리 오류:", error);
    }
  };

  const handleWriteClick = () => {
    if (!user) {
      alert("관리자만 알림을 작성할 수 있습니다.");
      return;
    }
    
    // 관리자 권한 확인 (간단한 체크)
    if (userData?.role !== "admin" && user.email !== "admin@tapgol.com") {
      alert("관리자만 알림을 작성할 수 있습니다.");
      return;
    }
    
    setFormData({
      title: "",
      content: "",
      category: "update",
      priority: "normal"
    });
    setShowWriteForm(true);
  };

  const handleEditClick = (notification) => {
    if (!user || (userData?.role !== "admin" && user.email !== "admin@tapgol.com")) {
      alert("관리자만 알림을 수정할 수 있습니다.");
      return;
    }
    
    setFormData({
      title: notification.title,
      content: notification.content,
      category: notification.category || "update",
      priority: notification.priority || "normal"
    });
    setEditingId(notification.id);
    setShowEditForm(true);
  };

  const handleDeleteClick = async (notificationId) => {
    if (!user || (userData?.role !== "admin" && user.email !== "admin@tapgol.com")) {
      alert("관리자만 알림을 삭제할 수 있습니다.");
      return;
    }
    
    if (!window.confirm("정말로 이 알림을 삭제하시겠습니까?")) {
      return;
    }
    
    try {
      await deleteNotification(notificationId);
      alert("알림이 삭제되었습니다.");
    } catch (error) {
      console.error("알림 삭제 오류:", error);
      alert("알림 삭제에 실패했습니다.");
    }
  };

  const handleMarkAllAsRead = async () => {
    if (!user) {
      alert("로그인이 필요합니다.");
      return;
    }
    
    const unreadCount = notifications.filter(n => !n.isRead).length;
    if (unreadCount === 0) {
      alert("읽지 않은 알림이 없습니다.");
      return;
    }
    
    if (!window.confirm(`모든 알림(${unreadCount}개)을 읽음 처리하시겠습니까?`)) {
      return;
    }
    
    try {
      const processedCount = await markAllNotificationsAsRead();
      alert(`${processedCount}개의 알림이 읽음 처리되었습니다.`);
    } catch (error) {
      console.error("모든 알림 읽음 처리 오류:", error);
      alert("알림 읽음 처리에 실패했습니다.");
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!formData.title.trim() || !formData.content.trim()) {
      alert("제목과 내용을 모두 입력해주세요.");
      return;
    }
    
    try {
      const notificationData = {
        title: formData.title.trim(),
        content: formData.content.trim(),
        category: formData.category,
        priority: formData.priority,
        author: userData?.nickname || userData?.name || user.displayName || "관리자",
        authorId: user.uid,
        authorEmail: user.email
      };
      
      if (showEditForm && editingId) {
        await updateNotification(editingId, notificationData);
        alert("알림이 수정되었습니다.");
        setShowEditForm(false);
        setEditingId(null);
      } else {
        await createNotification(notificationData);
        alert("알림이 작성되었습니다.");
        setShowWriteForm(false);
      }
      
      setFormData({
        title: "",
        content: "",
        category: "update",
        priority: "normal"
      });
    } catch (error) {
      console.error("알림 작성/수정 오류:", error);
      alert("알림 처리에 실패했습니다.");
    }
  };

  const formatDate = (timestamp) => {
    if (!timestamp) return "";
    
    const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
    return date.toLocaleDateString('ko-KR', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  // 프로필 관련 함수들
  const handleShowProfile = (userId, userName) => {
    setSelectedUser({ id: userId, name: userName });
    setShowProfileModal(true);
  };

  const handleCloseProfileModal = () => {
    setShowProfileModal(false);
    setSelectedUser(null);
  };

  const getCategoryLabel = (category) => {
    const categories = {
      update: "업데이트",
      maintenance: "점검",
      event: "이벤트",
      notice: "공지사항",
      bugfix: "버그수정",
      chat: "채팅"
    };
    return categories[category] || category;
  };

  const getPriorityColor = (priority) => {
    const colors = {
      high: "bg-red-100 text-red-800 border-red-200",
      normal: "bg-blue-100 text-blue-800 border-blue-200",
      low: "bg-gray-100 text-gray-800 border-gray-200"
    };
    return colors[priority] || colors.normal;
  };

  const isAdmin = user && (userData?.role === "admin" || user.email === "admin@tapgol.com");

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-amber-50 via-orange-50 to-amber-100">
        <main className="pb-20 pt-16">
          <div className="max-w-4xl mx-auto px-4">
            <div className="text-center py-12">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-amber-700 mx-auto mb-4"></div>
              <p className="text-amber-700">알림을 불러오는 중...</p>
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
                <h1 className="text-2xl font-bold text-gray-800">알림 📢</h1>
                <p className="text-gray-600 mt-1">앱 변동사항 및 공지사항</p>
              </div>
              {isAdmin && (
                <button
                  onClick={handleWriteClick}
                  className="px-4 py-2 bg-amber-600 text-white rounded-lg hover:bg-amber-700 transition-colors"
                >
                  알림 작성
                </button>
              )}
            </div>
          </div>

          {/* 알림 목록 */}
          <div className="bg-white rounded-2xl shadow-xl p-6 mb-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-gray-800">최근 알림</h2>
              {notifications.filter(n => !n.isRead).length > 0 && (
                <button
                  onClick={handleMarkAllAsRead}
                  className="px-3 py-1 bg-green-600 text-white text-sm rounded-lg hover:bg-green-700 transition-colors"
                >
                  모두 읽음
                </button>
              )}
            </div>
            
            {notifications.length === 0 ? (
              <div className="text-center py-8">
                <div className="text-gray-400 text-4xl mb-2">📢</div>
                <p className="text-gray-500">아직 알림이 없습니다.</p>
              </div>
            ) : (
              <div className="space-y-3">
                {notifications.map((notification) => (
                  <div
                    key={notification.id}
                    className={`border rounded-lg p-4 cursor-pointer transition-colors ${
                      notification.isRead 
                        ? 'bg-gray-50 border-gray-200' 
                        : 'bg-amber-50 border-amber-200'
                    } hover:bg-amber-100`}
                    onClick={() => handleNotificationClick(notification)}
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center space-x-2 mb-2">
                          <h3 className="font-semibold text-gray-800">
                            {notification.title}
                            {!notification.isRead && (
                              <span className="ml-2 inline-block w-2 h-2 bg-red-500 rounded-full"></span>
                            )}
                          </h3>
                        </div>
                        <div className="flex items-center space-x-2 mb-2">
                          <span className={`px-2 py-1 text-xs rounded-full border ${getPriorityColor(notification.priority)}`}>
                            {getCategoryLabel(notification.category)}
                          </span>
                          <span className="text-xs text-gray-500">
                            {formatDate(notification.createdAt)}
                          </span>
                        </div>
                        <p className="text-gray-600 text-sm line-clamp-2">
                          {notification.content}
                        </p>
                      </div>
                      {isAdmin && (
                        <div className="flex space-x-2 ml-4">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleEditClick(notification);
                            }}
                            className="text-xs text-blue-600 hover:text-blue-800 transition-colors"
                          >
                            수정
                          </button>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleDeleteClick(notification.id);
                            }}
                            className="text-xs text-red-600 hover:text-red-800 transition-colors"
                          >
                            삭제
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* 알림 상세 보기 */}
          {showDetail && selectedNotification && (
            <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
              <div className="bg-white rounded-2xl shadow-xl max-w-2xl w-full max-h-[80vh] overflow-y-auto">
                <div className="p-6">
                  <div className="flex items-center justify-between mb-4">
                    <h2 className="text-xl font-bold text-gray-800">
                      {selectedNotification.title}
                    </h2>
                    <button
                      onClick={() => setShowDetail(false)}
                      className="text-gray-500 hover:text-gray-700"
                    >
                      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                  </div>
                  
                  <div className="flex items-center space-x-2 mb-4">
                    <span className={`px-3 py-1 text-sm rounded-full border ${getPriorityColor(selectedNotification.priority)}`}>
                      {getCategoryLabel(selectedNotification.category)}
                    </span>
                    <span className="text-sm text-gray-500">
                      {formatDate(selectedNotification.createdAt)}
                    </span>
                  </div>
                  
                  <div className="prose max-w-none">
                    <p className="text-gray-700 whitespace-pre-wrap">
                      {selectedNotification.content}
                    </p>
                  </div>
                  
                  <div className="mt-6 pt-4 border-t border-gray-200">
                    <p className="text-sm text-gray-500">
                      작성자: <span 
                        className="text-gray-700 hover:text-amber-600 cursor-pointer transition-colors"
                        onClick={() => handleShowProfile(selectedNotification.authorId, selectedNotification.author)}
                        title="프로필 보기"
                      >
                        {selectedNotification.author}
                      </span>
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* 알림 작성/수정 폼 */}
          {(showWriteForm || showEditForm) && (
            <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
              <div className="bg-white rounded-2xl shadow-xl max-w-2xl w-full max-h-[80vh] overflow-y-auto">
                <div className="p-6">
                  <div className="flex items-center justify-between mb-4">
                    <h2 className="text-xl font-bold text-gray-800">
                      {showEditForm ? "알림 수정" : "알림 작성"}
                    </h2>
                    <button
                      onClick={() => {
                        setShowWriteForm(false);
                        setShowEditForm(false);
                        setEditingId(null);
                      }}
                      className="text-gray-500 hover:text-gray-700"
                    >
                      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                  </div>
                  
                  <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        제목 *
                      </label>
                      <input
                        type="text"
                        value={formData.title}
                        onChange={(e) => setFormData({...formData, title: e.target.value})}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent"
                        required
                      />
                    </div>
                    
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          카테고리
                        </label>
                                                 <select
                           value={formData.category}
                           onChange={(e) => setFormData({...formData, category: e.target.value})}
                           className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent"
                         >
                           <option value="update">업데이트</option>
                           <option value="maintenance">점검</option>
                           <option value="event">이벤트</option>
                           <option value="notice">공지사항</option>
                           <option value="bugfix">버그수정</option>
                           <option value="chat">채팅</option>
                         </select>
                      </div>
                      
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          우선순위
                        </label>
                        <select
                          value={formData.priority}
                          onChange={(e) => setFormData({...formData, priority: e.target.value})}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent"
                        >
                          <option value="low">낮음</option>
                          <option value="normal">보통</option>
                          <option value="high">높음</option>
                        </select>
                      </div>
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        내용 *
                      </label>
                      <textarea
                        value={formData.content}
                        onChange={(e) => setFormData({...formData, content: e.target.value})}
                        rows="8"
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent resize-none"
                        required
                      />
                    </div>
                    
                    <div className="flex justify-end space-x-3 pt-4">
                      <button
                        type="button"
                        onClick={() => {
                          setShowWriteForm(false);
                          setShowEditForm(false);
                          setEditingId(null);
                        }}
                        className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                      >
                        취소
                      </button>
                      <button
                        type="submit"
                        className="px-4 py-2 bg-amber-600 text-white rounded-lg hover:bg-amber-700 transition-colors"
                      >
                        {showEditForm ? "수정" : "작성"}
                      </button>
                    </div>
                  </form>
                </div>
              </div>
            </div>
          )}
        </div>
      </main>

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

export default NotificationBoard;
