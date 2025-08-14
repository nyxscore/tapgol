import React, { useState } from "react";
import {
  MessageCircle,
  Users,
  Play,
  Mic,
  MoreHorizontal,
  Image,
  User,
  Search,
} from "lucide-react";

const MenuGrid = () => {
  const [hoveredButton, setHoveredButton] = useState(null);

  const menuItems = [
    { icon: MessageCircle, label: "게시판", color: "text-blue-500" },
    { icon: Users, label: "동네모임", color: "text-green-500" },
    { icon: Play, label: "놀이터", color: "text-purple-500" },
    { icon: Mic, label: "노래방", color: "text-pink-500" },
    { icon: MoreHorizontal, label: "공원톡", color: "text-indigo-500" },
    { icon: Image, label: "갤러리", color: "text-yellow-500" },
    { icon: User, label: "생활정보", color: "text-red-500" },
    { icon: Search, label: "동창찾기", color: "text-teal-500" },
  ];

  return (
    <div className="p-6 bg-gradient-to-b from-white to-gray-50">
      <div className="grid grid-cols-4 gap-4">
        {menuItems.map((item, index) => (
          <button
            key={index}
            className="group bg-white rounded-2xl p-4 shadow-md border border-gray-100 hover:shadow-xl hover:scale-105 transition-all duration-300"
            onMouseEnter={() => setHoveredButton(index)}
            onMouseLeave={() => setHoveredButton(null)}
          >
            <div
              className={`w-8 h-8 mx-auto mb-2 transition-transform duration-300 ${
                hoveredButton === index ? "scale-110" : ""
              }`}
            >
              <item.icon
                className={`w-full h-full ${item.color} group-hover:scale-110 transition-transform`}
              />
            </div>
            <span className="text-xs font-bold text-gray-700 group-hover:text-gray-900 transition-colors">
              {item.label}
            </span>
          </button>
        ))}
      </div>
    </div>
  );
};

export default MenuGrid;
