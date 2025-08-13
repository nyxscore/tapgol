import React from "react";

const Banner = () => {
  return (
    <div className="p-6 bg-gradient-to-b from-orange-50 to-white">
      <div className="bg-white rounded-2xl p-6 shadow-lg border border-orange-100 hover:shadow-xl transition-all duration-300">
        <div className="flex items-center space-x-4">
          <div className="flex space-x-2">
            <div className="w-16 h-16 bg-gradient-to-br from-orange-200 to-orange-300 rounded-2xl flex items-center justify-center shadow-md">
              <span className="text-3xl">👴</span>
            </div>
            <div className="w-16 h-16 bg-gradient-to-br from-purple-200 to-purple-300 rounded-2xl flex items-center justify-center shadow-md">
              <span className="text-3xl">👵</span>
            </div>
          </div>
          <div className="flex-1">
            <div className="inline-block text-xs font-bold text-orange-600 bg-orange-100 px-2 py-1 rounded-full mb-2">
              Banner
            </div>
            <div className="text-xl font-black text-gray-900 mb-2 leading-tight">
              그 시절의 웃음,
              <br />
              오늘 다시
            </div>
            <div className="text-sm text-gray-600 mb-4 leading-relaxed">
              지금 가입하시고 이웃과 소통을 시작해보세요!
            </div>
            <button className="bg-gradient-to-r from-orange-500 to-orange-600 text-white px-6 py-2.5 rounded-xl font-bold shadow-lg hover:shadow-xl hover:scale-105 transition-all duration-200">
              가입하기
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Banner;
