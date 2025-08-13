import React from 'react';

const Header = () => {
  return (
    <header className="bg-white shadow-sm border-b border-gray-200">
      <div className="max-w-4xl mx-auto px-4 py-3">
        <div className="flex items-center justify-between">
          {/* 로고 */}
          <div className="flex items-center space-x-2">
            <div className="w-8 h-8 bg-gradient-to-br from-green-400 to-green-600 rounded-lg flex items-center justify-center">
              <div className="w-4 h-4 bg-white rounded-sm relative">
                <div className="absolute top-0 left-0 w-1 h-1 bg-green-600 rounded-full"></div>
                <div className="absolute top-0 right-0 w-1 h-1 bg-green-600 rounded-full"></div>
              </div>
            </div>
            <span className="text-lg font-bold text-gray-800">탑골톡</span>
          </div>
          
          {/* 네비게이션 메뉴 */}
          <nav className="hidden md:flex items-center space-x-6">
            <a href="#" className="text-gray-700 hover:text-green-600 font-medium">홈</a>
            <a href="#" className="text-gray-700 hover:text-green-600 font-medium">공원소개</a>
            <a href="#" className="text-gray-700 hover:text-green-600 font-medium">이벤트</a>
            <a href="#" className="text-gray-700 hover:text-green-600 font-medium">갤러리</a>
            <a href="#" className="text-gray-700 hover:text-green-600 font-medium">로그인</a>
          </nav>
          
          {/* 모바일 메뉴 버튼 */}
          <button className="md:hidden p-2">
            <svg className="w-6 h-6 text-gray-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          </button>
        </div>
      </div>
    </header>
  );
};

export default Header;
