// src/pages/Alerts.jsx
import React from "react";
import { useNotifications } from "../contexts/NotificationsContext";

export default function Alerts() {
  const { notifications, markAsRead, markAllRead } = useNotifications();

  return (
    <div className="max-w-3xl mx-auto p-4 pt-6">
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-xl font-bold">알림</h1>
        <button
          onClick={markAllRead}
          className="px-3 py-1 text-sm rounded bg-gray-200 hover:bg-gray-300"
        >
          모두 읽음
        </button>
      </div>

      {notifications.length === 0 ? (
        <p className="text-gray-500">새로운 알림이 없습니다.</p>
      ) : (
        <ul className="space-y-2">
          {notifications.map((n) => (
            <li
              key={n.id}
              className={`p-3 rounded border ${
                n.read
                  ? "bg-white border-gray-200"
                  : "bg-orange-50 border-orange-200"
              }`}
            >
              <div className="flex items-center justify-between">
                <span>{n.message}</span>
                {!n.read && (
                  <button
                    onClick={() => markAsRead(n.id)}
                    className="px-2 py-1 text-xs rounded bg-orange-500 text-white hover:bg-orange-600"
                  >
                    읽음
                  </button>
                )}
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
