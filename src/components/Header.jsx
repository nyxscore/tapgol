import React from "react";
import { Link } from "react-router-dom";

const Header = () => {
  return (
    <header className="bg-white shadow-sm border-b border-gray-200">
      <div className="max-w-4xl mx-auto px-4 py-3">
        <div className="flex items-center justify-between">
          {/* 로고 */}
          <Link to="/" className="flex items-center space-x-2">
            <img
              src="/tapgol.png"
              alt="탑골톡 로고"
              className="w-8 h-8 object-contain"
            />
            <span className="text-lg font-bold text-gray-800">탑골톡</span>
          </Link>

          {/* 네비게이션 메뉴 */}
          <nav className="hidden md:flex items-center space-x-6">
            <Link
              to="/"
              className="text-gray-700 hover:text-green-600 font-medium"
            >
              홈
            </Link>
            <a
              href="#"
              className="text-gray-700 hover:text-green-600 font-medium"
            >
              공원소개
            </a>
            <a
              href="#"
              className="text-gray-700 hover:text-green-600 font-medium"
            >
              이벤트
            </a>
            <Link
              to="/login"
              className="text-gray-700 hover:text-green-600 font-medium"
            >
              로그인
            </Link>
          </nav>

          {/* 모바일 메뉴 버튼 */}
          <button className="md:hidden p-2">
            <svg
              className="w-6 h-6 text-gray-700"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M4 6h16M4 12h16M4 18h16"
              />
            </svg>
          </button>
        </div>
      </div>
    </header>
  );
};

export default Header;
