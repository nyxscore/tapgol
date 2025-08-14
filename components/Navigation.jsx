import React, { useState } from "react";
import { Home, Play, Bell, Settings } from "lucide-react";

const Navigation = () => {
  const [activeTab, setActiveTab] = useState("home");

  const navItems = [
    { icon: Home, label: "홈", key: "home" },
    { icon: Play, label: "채팅", key: "chat" },
    { icon: Bell, label: "알림", key: "alerts", hasNotification: true },
    { icon: Settings, label: "내정보", key: "profile" },
  ];

  return (
    <div className="bg-white/95 backdrop-blur-md border-t border-gray-200 p-3">
      <div className="grid grid-cols-4 gap-1">
        {navItems.map((item) => (
          <button
            key={item.key}
            className={`relative p-3 rounded-xl transition-all duration-200 ${
              activeTab === item.key
                ? "bg-gradient-to-br from-orange-500 to-orange-600 shadow-lg"
                : "hover:bg-gray-100"
            }`}
            onClick={() => setActiveTab(item.key)}
          >
            <item.icon
              className={`w-6 h-6 mx-auto mb-1 transition-colors ${
                activeTab === item.key ? "text-white" : "text-gray-600"
              }`}
            />
            {item.hasNotification && (
              <div className="absolute top-2 right-2 w-3 h-3 bg-red-500 rounded-full shadow-lg animate-pulse"></div>
            )}
            <span
              className={`text-xs font-bold transition-colors ${
                activeTab === item.key ? "text-white" : "text-gray-700"
              }`}
            >
              {item.label}
            </span>
          </button>
        ))}
      </div>
    </div>
  );
};

export default Navigation;
