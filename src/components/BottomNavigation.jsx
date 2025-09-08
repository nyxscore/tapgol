// src/components/BottomNavigation.jsx
import React, { useState, useEffect, useRef } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { auth } from "../util/firebase";
import { onAuthStateChanged } from "firebase/auth";
import { subscribeToUnreadChatCount, subscribeToUnreadCount } from "../util/notificationService";

const BottomNavigation = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [user, setUser] = useState(null);
  const [unreadChatCount, setUnreadChatCount] = useState(0);
  const [unreadNotificationCount, setUnreadNotificationCount] = useState(0);
  const unsubscribeRef = useRef(null);
  const chatNotificationUnsubscribeRef = useRef(null);
  const notificationUnsubscribeRef = useRef(null);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
    });

    return () => unsubscribe();
  }, []);

  useEffect(() => {
    // 로그인된 사용자만 읽지 않은 알림 개수 구독
    if (user) {
      try {
        // 채팅 알림 구독
        chatNotificationUnsubscribeRef.current = subscribeToUnreadChatCount((count) => {
          setUnreadChatCount(count);
        });
        
        // 일반 알림 구독
        notificationUnsubscribeRef.current = subscribeToUnreadCount((count) => {
          setUnreadNotificationCount(count);
        });
      } catch (error) {
        console.error("알림 개수 구독 오류:", error);
      }
    } else {
      // 로그아웃 시 알림 개수 초기화
      setUnreadChatCount(0);
      setUnreadNotificationCount(0);
    }

    return () => {
      if (chatNotificationUnsubscribeRef.current) {
        chatNotificationUnsubscribeRef.current();
      }
      if (notificationUnsubscribeRef.current) {
        notificationUnsubscribeRef.current();
      }
    };
  }, [user]);

  const navigationItems = [
    {
      id: 0,
      name: "홈",
      path: "/",
      icon: (
        <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 20 20">
          <path d="M10.707 2.293a1 1 0 00-1.414 0l-7 7a1 1 0 001.414 1.414L4 10.414V17a1 1 0 001 1h2a1 1 0 001-1v-2a1 1 0 011-1h2a1 1 0 011 1v2a1 1 0 001 1h2a1 1 0 001-1v-6.586l.293.293a1 1 0 001.414-1.414l-7-7z" />
        </svg>
      ),
    },
    {
      id: 1,
      name: "탑골톡",
      path: "/chat/main",
      icon: (
        <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 20 20">
          <path fillRule="evenodd" d="M18 10c0 3.866-3.582 7-8 7a8.841 8.841 0 01-4.083-.98L2 17l1.338-3.123C2.493 12.767 2 11.434 2 10c0-3.866 3.582-7 8-7s8 3.134 8 7zM7 9H5v2h2V9zm8 0h-2v2h2V9zM9 9h2v2H9V9z" clipRule="evenodd" />
        </svg>
      ),
      badge: user && unreadChatCount > 0 ? unreadChatCount : null
    },
    {
      id: 2,
      name: "알림",
      path: "/alerts",
      icon: (
        <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 20 20">
          <path d="M10 2a6 6 0 00-6 6v2.586l-.707.707A1 1 0 004 13h12a1 1 0 00.707-1.707L16 10.586V8a6 6 0 00-6-6z" />
          <path d="M14 14a4 4 0 11-8 0h8z" />
        </svg>
      ),
      badge: user && unreadNotificationCount > 0 ? unreadNotificationCount : null
    },
    {
      id: 3,
      name: "프로필",
      path: "/profile",
      icon: (
        <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 20 20">
          <path fillRule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clipRule="evenodd" />
        </svg>
      ),
    },
  ];

  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 z-50">
      <div className="flex justify-around">
        {navigationItems.map((item) => (
          <button
            key={item.id}
            onClick={() => navigate(item.path)}
            className={`flex flex-col items-center py-2 px-3 flex-1 relative ${
              location.pathname === item.path
                ? "text-amber-600"
                : "text-gray-500 hover:text-gray-700"
            } transition-colors`}
          >
            <div className="relative">
              {item.icon}
              {item.badge && (
                <span className="absolute -top-2 -right-2 bg-red-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center min-w-[20px]">
                  {item.badge > 99 ? '99+' : item.badge}
                </span>
              )}
            </div>
            <span className="text-xs mt-1">{item.name}</span>
          </button>
        ))}
      </div>
    </nav>
  );
};

export default BottomNavigation;
