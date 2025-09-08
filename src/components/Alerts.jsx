import React, { useState, useEffect } from "react";
import { auth } from "../util/firebase";
import { onAuthStateChanged } from "firebase/auth";
import { getUserProfile } from "../util/userService";
import { 
  subscribeToNotifications, 
  markNotificationAsRead, 
  markAllNotificationsAsRead,
  deleteNotification 
} from "../util/notificationService";
import { FaBell, FaTrash, FaCheck, FaCheckDouble } from "react-icons/fa";

const Alerts = () => {
  const [user, setUser] = useState(null);
  const [userData, setUserData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [notifications, setNotifications] = useState([]);
  const [processing, setProcessing] = useState(false);

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

  // 알림 구독
  useEffect(() => {
    if (!user) {
      setNotifications([]);
      return;
    }

    const unsubscribe = subscribeToNotifications((notificationsList) => {
      setNotifications(notificationsList);
    });

    return () => {
      if (unsubscribe) {
        unsubscribe();
      }
    };
  }, [user]);

  // 알림 읽음 처리
  const handleMarkAsRead = async (notificationId) => {
    try {
      setProcessing(true);
      await markNotificationAsRead(notificationId);
    } catch (error) {
      console.error("알림 읽음 처리 오류:", error);
      alert("알림 읽음 처리에 실패했습니다.");
    } finally {
      setProcessing(false);
    }
  };

  // 모든 알림 읽음 처리
  const handleMarkAllAsRead = async () => {
    try {
      setProcessing(true);
      await markAllNotificationsAsRead();
    } catch (error) {
      console.error("모든 알림 읽음 처리 오류:", error);
      alert("모든 알림 읽음 처리에 실패했습니다.");
    } finally {
      setProcessing(false);
    }
  };

  // 알림 삭제
  const handleDeleteNotification = async (notificationId) => {
    if (!window.confirm("이 알림을 삭제하시겠습니까?")) {
      return;
    }

    try {
      setProcessing(true);
      await deleteNotification(notificationId);
    } catch (error) {
      console.error("알림 삭제 오류:", error);
      alert("알림 삭제에 실패했습니다.");
    } finally {
      setProcessing(false);
    }
  };

  // 날짜 포맷팅
  const formatDate = (timestamp) => {
    if (!timestamp) return "날짜 없음";
    
    const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
    const now = new Date();
    const diffInSeconds = Math.floor((now - date) / 1000);
    
    if (diffInSeconds < 60) {
      return "방금 전";
    } else if (diffInSeconds < 3600) {
      return `${Math.floor(diffInSeconds / 60)}분 전`;
    } else if (diffInSeconds < 86400) {
      return `${Math.floor(diffInSeconds / 3600)}시간 전`;
    } else {
      return date.toLocaleDateString('ko-KR', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit'
      });
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-amber-50 via-orange-50 to-amber-100 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-amber-700 mx-auto mb-4"></div>
          <p className="text-amber-700">로딩 중...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-amber-50 via-orange-50 to-amber-100 pb-20">
      <div className="max-w-4xl mx-auto p-6">
        {/* 헤더 */}
        <div className="bg-white rounded-2xl shadow-xl p-6 mb-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <FaBell className="w-6 h-6 text-amber-600" />
              <h1 className="text-2xl font-bold text-gray-800">알림</h1>
              {notifications.length > 0 && (
                <span className="px-2 py-1 bg-amber-100 text-amber-800 text-sm rounded-full">
                  {notifications.length}개
                </span>
              )}
            </div>
            {notifications.length > 0 && (
              <button
                onClick={handleMarkAllAsRead}
                disabled={processing}
                className="flex items-center space-x-2 px-4 py-2 bg-amber-600 text-white rounded-lg hover:bg-amber-700 transition-colors disabled:opacity-50"
              >
                <FaCheckDouble className="w-4 h-4" />
                <span>모두 읽음</span>
              </button>
            )}
          </div>
        </div>

        {/* 알림 목록 */}
        <div className="bg-white rounded-2xl shadow-xl p-6">
          {user ? (
            <div className="space-y-4">
              {notifications.length === 0 ? (
                <div className="text-center py-12">
                  <div className="text-gray-400 text-6xl mb-4">🔔</div>
                  <p className="text-gray-600 text-lg mb-2">알림이 없습니다</p>
                  <p className="text-gray-500">새로운 알림이 오면 여기에 표시됩니다.</p>
                </div>
              ) : (
                notifications.map((notification) => (
                  <div
                    key={notification.id}
                    className={`border rounded-lg p-4 transition-colors ${
                      notification.isRead 
                        ? "bg-gray-50 border-gray-200" 
                        : "bg-amber-50 border-amber-200 shadow-sm"
                    }`}
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center space-x-2 mb-2">
                          <h3 className="font-semibold text-gray-800">
                            {notification.title || "알림"}
                          </h3>
                          {!notification.isRead && (
                            <span className="w-2 h-2 bg-amber-500 rounded-full"></span>
                          )}
                        </div>
                        <p className="text-gray-700 mb-2">
                          {notification.content}
                        </p>
                        <div className="flex items-center space-x-4 text-sm text-gray-500">
                          <span>{formatDate(notification.createdAt)}</span>
                          {notification.category && (
                            <span className="px-2 py-1 bg-gray-200 text-gray-700 rounded-full text-xs">
                              {notification.category}
                            </span>
                          )}
                          {notification.author && (
                            <span>by {notification.author}</span>
                          )}
                        </div>
                      </div>
                      <div className="flex items-center space-x-2 ml-4">
                        {!notification.isRead && (
                          <button
                            onClick={() => handleMarkAsRead(notification.id)}
                            disabled={processing}
                            className="p-2 text-amber-600 hover:bg-amber-100 rounded-lg transition-colors disabled:opacity-50"
                            title="읽음 처리"
                          >
                            <FaCheck className="w-4 h-4" />
                          </button>
                        )}
                        <button
                          onClick={() => handleDeleteNotification(notification.id)}
                          disabled={processing}
                          className="p-2 text-red-600 hover:bg-red-100 rounded-lg transition-colors disabled:opacity-50"
                          title="삭제"
                        >
                          <FaTrash className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          ) : (
            <div className="text-center py-12">
              <div className="text-gray-400 text-6xl mb-4">🔒</div>
              <p className="text-gray-600 text-lg mb-2">로그인이 필요합니다</p>
              <p className="text-gray-500 mb-6">알림을 확인하려면 로그인해주세요.</p>
              <button
                onClick={() => window.location.href = "/login"}
                className="bg-amber-600 text-white px-6 py-3 rounded-lg hover:bg-amber-700 transition-colors"
              >
                로그인하기
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Alerts;
