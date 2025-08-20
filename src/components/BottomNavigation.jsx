// src/components/BottomNavigation.jsx
import React from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { useNotifications } from "../contexts/NotificationsContext";

const BottomNavigation = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { unreadCount } = useNotifications() || { unreadCount: 0 };

  const navItems = [
    {
      id: 1,
      name: "홈",
      path: "/",
      icon: (
        <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 20 20">
          <path d="M10.707 2.293a1 1 0 00-1.414 0l-7 7a1 1 0 001.414 1.414L4 10.414V17a1 1 0 001 1h2a1 1 0 001-1v-2a1 1 0 011-1h2a1 1 0 011 1v2a1 1 0 001 1h2a1 1 0 001-1v-6.586l.293.293a1 1 0 001.414-1.414l-7-7z" />
        </svg>
      ),
    },
    {
      id: 2,
      name: "채팅",
      path: "/chat",
      icon: (
        <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 20 20">
          <path
            fillRule="evenodd"
            d="M18 10c0 3.866-3.582 7-8 7a8.841 8.841 0 01-4.083-.98L2 17l1.338-3.123C2.493 12.767 2 11.434 2 10c0-3.866 3.582-7 8-7s8 3.134 8 7zM7 9H5v2h2V9zm8 0h-2v2h2V9zM9 9h2v2H9V9z"
            clipRule="evenodd"
          />
        </svg>
      ),
    },
    {
      id: 3,
      name: "알림",
      path: "/alerts",
      icon: (
        <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 20 20">
          <path d="M10 2a6 6 0 00-6 6v2.586l-.707.707A1 1 0 004 13h12a1 1 0 00.707-1.707L16 10.586V8a6 6 0 00-6-6z" />
          <path d="M14 14a4 4 0 11-8 0h8z" />
        </svg>
      ),
    },
    {
      id: 4,
      name: "내정보",
      path: "/profile",
      icon: (
        <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 20 20">
          <path
            fillRule="evenodd"
            d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z"
            clipRule="evenodd"
          />
        </svg>
      ),
    },
  ];

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-40 bg-gray-800 border-t border-gray-700 shadow-lg rounded-t-3xl mx-4 mb-2">
      <div className="max-w-4xl mx-auto">
        <div className="flex justify-around">
          {navItems.map((item) => {
            const isActive = location.pathname === item.path;
            const isAlerts = item.path === "/alerts";

            return (
              <button
                key={item.id}
                onClick={() => navigate(item.path)}
                className={
                  "relative flex flex-col items-center py-3 px-4 flex-1 transition-colors duration-200 " +
                  (isActive
                    ? "text-white"
                    : "text-gray-400 hover:text-gray-300")
                }
              >
                {item.icon}

                {isAlerts && unreadCount > 0 && (
                  <span className="absolute top-1.5 right-6 min-w-[18px] h-[18px] px-1 text-[10px] leading-[18px] text-white bg-red-500 rounded-full text-center shadow animate-pulse">
                    {unreadCount}
                  </span>
                )}

                <span className="text-xs mt-1 font-medium">{item.name}</span>
              </button>
            );
          })}
        </div>
      </div>
    </nav>
  );
};

export default BottomNavigation;
