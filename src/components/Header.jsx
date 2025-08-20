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

          {/* 로그인 버튼 */}
          <Link
            to="/login"
            className="px-4 py-2 rounded-full bg-green-500 text-white font-semibold hover:bg-green-600 transition"
          >
            로그인
          </Link>
        </div>
      </div>
    </header>
  );
};

export default Header;
