import React from "react";

const Header = () => {
  return (
    <div className="bg-gradient-to-r from-orange-400 via-orange-500 to-orange-600 p-6 relative overflow-hidden">
      <div className="absolute inset-0 bg-black/5"></div>
      <div className="relative z-10">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-white/20 backdrop-blur-sm rounded-xl flex items-center justify-center shadow-lg">
              <span className="text-white text-lg font-black">탑</span>
            </div>
            <span className="font-black text-xl text-white drop-shadow-sm">
              탑골톡
            </span>
          </div>
          <div className="flex space-x-4 text-sm text-white/90">
            <button className="hover:text-white transition-colors font-medium">
              홈
            </button>
            <button className="hover:text-white transition-colors font-medium">
              꾸민소개
            </button>
            <button className="hover:text-white transition-colors font-medium">
              이벤트
            </button>
            <button className="hover:text-white transition-colors font-medium">
              갤러리
            </button>
            <button className="bg-white/20 px-3 py-1 rounded-full hover:bg-white/30 transition-all font-medium">
              로그인
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Header;
