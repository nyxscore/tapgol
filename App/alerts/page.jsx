"use client";

import { useEffect, useState } from "react";

export default function AlertsPage() {
  const [alerts, setAlerts] = useState<string[]>([]);

  useEffect(() => {
    // 테스트용 - 나중에 서버/DB에서 불러오도록 수정 가능
    setAlerts(["새 댓글이 달렸습니다.", "모임 소식이 업데이트 되었습니다."]);
  }, []);

  return (
    <main className="max-w-3xl mx-auto p-4 pt-6">
      <h1 className="text-xl font-bold mb-4">알림</h1>
      {alerts.length === 0 ? (
        <p className="text-gray-500">새로운 알림이 없습니다.</p>
      ) : (
        <ul className="space-y-2">
          {alerts.map((msg, idx) => (
            <li key={idx} className="p-3 bg-white rounded-xl shadow">
              {msg}
            </li>
          ))}
        </ul>
      )}
    </main>
  );
}
