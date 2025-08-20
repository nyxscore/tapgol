import React, { useEffect } from "react";
import { useNotifications } from "../contexts/NotificationsContext";

export default function Alerts() {
  const { items, markAllRead } = useNotifications();

  useEffect(() => {
    markAllRead(); // 페이지 진입 시 모두 읽음 처리
  }, [markAllRead]);

  return (
    <div className="max-w-3xl mx-auto p-4 pt-6">
      <h1 className="text-xl font-bold mb-4">알림</h1>
      {items.length === 0 ? (
        <p className="text-gray-500">알림이 없습니다.</p>
      ) : (
        <ul className="space-y-3">
          {items.map((n) => (
            <li
              key={n.id}
              className="bg-white/5 border border-white/10 rounded-lg p-3"
            >
              <div className="text-sm font-semibold">
                {n.title}{" "}
                <span className="text-xs text-gray-400">({n.type})</span>
              </div>
              <div className="text-sm mt-1">{n.message}</div>
              <div className="text-xs text-gray-400 mt-1">
                {new Date(n.ts).toLocaleString()}
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
