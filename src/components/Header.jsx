import React from "react";
import { Link } from "react-router-dom";
import useAuth from "../contexts/useAuth";

const Header = () => {
  const { user, logout } = useAuth();
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

          {/* 로그인/내 정보/로그아웃 버튼 */}
          {user ? (
            <div className="flex items-center space-x-2">
              <Link
                to="/profile"
                className="flex items-center space-x-2 px-4 py-2 rounded-full bg-blue-100 text-blue-900 font-semibold hover:bg-blue-200 transition"
              >
                <span className="w-8 h-8 flex items-center justify-center rounded-full bg-blue-300 text-white text-xl">
                  👴
                </span>
                <span>김할배</span>
              </Link>
              <button
                onClick={logout}
                className="px-4 py-2 rounded-full bg-gray-400 text-white font-semibold hover:bg-gray-500 transition"
                style={{ marginLeft: "8px" }}
              >
                로그아웃
              </button>
            </div>
          ) : (
            <Link
              to="/login"
              className="px-4 py-2 rounded-full bg-green-500 text-white font-semibold hover:bg-green-600 transition"
            >
              로그인
            </Link>
          )}
        </div>
      </div>
    </header>
  );
};

export default Header;
