// src/components/PopularPosts.jsx
import React from "react";
import { ChevronRight } from "lucide-react";
import { Link } from "react-router-dom";

const PopularPosts = ({ posts = [] }) => {
  // 예시 데이터 (props 미전달 시)
  const fallback = [
    {
      id: 1,
      category: "갤러리",
      title: "냉면 맛집 공유",
      likes: 128,
      emoji: "🍜",
      href: "/gallery",
    },
    {
      id: 2,
      category: "게시판",
      title: "꿀팁 공유해요",
      likes: 96,
      emoji: "💡",
      href: "/board",
    },
    {
      id: 3,
      category: "놀이터",
      title: "랭킹 1위 달성 김할배님!",
      likes: 77,
      emoji: "🏆",
      href: "/playground",
    },
  ];

  const source = posts.length ? posts : fallback;

  // 공감(likes) 기준 TOP 3
  const top3 = [...source]
    .sort((a, b) => (b.likes ?? 0) - (a.likes ?? 0))
    .slice(0, 3);
  const [first, second, third] = top3;

  // 카드 공통 렌더러
  const Card = ({ item, large = false }) => {
    if (!item) return null;
    const label = `[${item.category}] ${item.title}`;
    const Wrapper = item.href ? Link : "div";
    const wrapperProps = item.href ? { to: item.href } : {};

    return (
      <Wrapper
        {...wrapperProps}
        className={
          large
            ? "bg-gradient-to-br from-white to-gray-50 rounded-2xl p-4 shadow-lg border border-gray-100 flex-1 hover:shadow-xl transition-all duration-300"
            : "bg-gradient-to-br from-white to-gray-50 rounded-xl p-3 w-56 h-20 shadow-lg hover:shadow-xl transition-all duration-300"
        }
      >
        <div
          className={
            large
              ? "w-full h-20 bg-gradient-to-br from-yellow-100 to-yellow-200 rounded-xl mb-3 flex items-center justify-center shadow-inner"
              : "w-full h-10 bg-gradient-to-br from-orange-100 to-orange-200 rounded-lg mb-2 flex items-center justify-center shadow-inner"
          }
        >
          <span className={large ? "text-4xl" : "text-2xl"}>
            {item.emoji || "✨"}
          </span>
        </div>
        <div
          className={
            large
              ? "text-sm text-gray-700 font-medium"
              : "text-xs text-gray-700 font-medium line-clamp-1"
          }
        >
          {label}
        </div>
        {!large && (
          <div className="text-[11px] text-gray-400 mt-1">
            공감 {item.likes ?? 0}
          </div>
        )}
      </Wrapper>
    );
  };

  return (
    <div className="p-6 bg-white">
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-black text-xl text-gray-900">오늘의 인기글</h3>
        <ChevronRight className="w-5 h-5 text-gray-400" />
      </div>

      <div className="flex space-x-4">
        <Card item={first} large />
        <div className="flex flex-col space-y-3">
          <Card item={second} />
          <Card item={third} />
        </div>
      </div>
    </div>
  );
};

export default PopularPosts;
