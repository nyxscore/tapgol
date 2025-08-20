// src/contexts/NotificationsContext.jsx
import React, { createContext, useContext, useState } from "react";

const NotificationsContext = createContext(null);

export const useNotifications = () => useContext(NotificationsContext);

export const NotificationsProvider = ({ children }) => {
  const [notifications, setNotifications] = useState([
    // 초기 테스트 알림 1개 (원하면 지워도 됨)
    { id: 1, message: "탑골톡에 오신 걸 환영합니다!", read: false },
  ]);

  const addNotification = (message) => {
    setNotifications((prev) => [
      ...prev,
      { id: Date.now(), message, read: false },
    ]);
  };

  const markAsRead = (id) => {
    setNotifications((prev) =>
      prev.map((n) => (n.id === id ? { ...n, read: true } : n))
    );
  };

  const markAllRead = () => {
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
  };

  const unreadCount = notifications.filter((n) => !n.read).length;

  return (
    <NotificationsContext.Provider
      value={{
        notifications,
        addNotification,
        markAsRead,
        markAllRead,
        unreadCount,
      }}
    >
      {children}
    </NotificationsContext.Provider>
  );
};
