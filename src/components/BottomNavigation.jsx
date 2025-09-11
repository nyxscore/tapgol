// src/components/BottomNavigation.jsx
import React, { useState, useEffect, useRef } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { auth } from "../util/firebase";
import { onAuthStateChanged } from "firebase/auth";
import { subscribeToUnreadMessages } from "../util/unreadMessagesService";

const BottomNavigation = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [user, setUser] = useState(null);
  const [unreadCounts, setUnreadCounts] = useState({});
  const unsubscribeRef = useRef(null);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
    });

    return () => unsubscribe();
  }, []);

  // 미확인 메시지 구독
  useEffect(() => {
    if (!user) return;

    const unsubscribeUnread = subscribeToUnreadMessages(user.uid, (unreadData) => {
      setUnreadCounts(unreadData);
    });

    return () => unsubscribeUnread();
  }, [user]);


  // 미확인 메시지 개수 계산
  const getTotalUnreadCount = () => {
    let total = 0;
    Object.values(unreadCounts).forEach(count => {
      total += count;
    });
    return total;
  };

  const navigationItems = [
    {
      id: "home",
      name: "홈",
      path: "/",
      icon: (
        <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 20 20">
          <path d="M10.707 2.293a1 1 0 00-1.414 0l-7 7a1 1 0 001.414 1.414L4 10.414V17a1 1 0 001 1h2a1 1 0 001-1v-2a1 1 0 011-1h2a1 1 0 011 1v2a1 1 0 001 1h2a1 1 0 001-1v-6.586l.293.293a1 1 0 001.414-1.414l-7-7z" />
        </svg>
      ),
    },
    {
      id: "chat",
      name: "탑골톡",
      path: "/chat/main",
      badge: (unreadCounts.main && unreadCounts.main > 0) ? unreadCounts.main : null,
      icon: (
        <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 20 20">
          <path fillRule="evenodd" d="M18 10c0 3.866-3.582 7-8 7a8.841 8.841 0 01-4.083-.98L2 17l1.338-3.123C2.493 12.767 2 11.434 2 10c0-3.866 3.582-7 8-7s8 3.134 8 7zM7 9H5v2h2V9zm8 0h-2v2h2V9zM9 9h2v2H9V9z" clipRule="evenodd" />
        </svg>
      ),
    },
    {
      id: "dm",
      name: "1:1 채팅",
      path: "/chat/dm",
      badge: (() => {
        const dmCount = getTotalUnreadCount() - (unreadCounts.main || 0);
        return dmCount > 0 ? dmCount : null;
      })(),
      icon: (
        <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 20 20">
          <path fillRule="evenodd" d="M18 5v8a2 2 0 01-2 2h-5l-5 4v-4H4a2 2 0 01-2-2V5a2 2 0 012-2h12a2 2 0 012 2zM7 8H5v2h2V8zm2 0h2v2H9V8zm6 0h-2v2h2V8z" clipRule="evenodd" />
        </svg>
      ),
    },
    {
      id: "profile",
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
              location.pathname === item.path || 
              (item.path === "/chat/dm" && location.pathname.startsWith("/chat/dm/"))
                ? "text-amber-600"
                : "text-gray-500 hover:text-gray-700"
            } transition-colors`}
          >
            <div className="relative">
              {item.icon}
              {item.badge && (
                <span className="absolute -top-1 -right-1 bg-gradient-to-r from-red-500 to-red-600 text-white text-xs rounded-full min-w-[20px] h-[20px] px-1 flex items-center justify-center font-bold shadow-lg border-2 border-white notification-badge">
                  <span className="drop-shadow-sm">
                    {item.badge > 99 ? '99+' : item.badge}
                  </span>
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
