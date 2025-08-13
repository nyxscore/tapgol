import React from "react";
import { useNavigate } from "react-router-dom";

const Banner = () => {
  const navigate = useNavigate();

  return (
    <section className="bg-gradient-to-r from-amber-700 to-orange-800 py-8 px-4 rounded-3xl mx-4 mt-4">
      <div className="max-w-4xl mx-auto">
        <div className="flex flex-col md:flex-row items-center justify-between">
          {/* 가족 이미지 */}
          <div className="mb-6 md:mb-0 md:mr-8">
            <div className="relative w-64 h-48 bg-gradient-to-br from-amber-500 to-orange-600 rounded-2xl shadow-lg overflow-hidden">
              <img
                src="../1.jpg"
                alt="행복한 가족"
                className="w-full h-full object-cover rounded-2xl"
                onError={(e) => {
                  e.target.style.display = "none";
                  e.target.nextSibling.style.display = "flex";
                }}
              />
              <div
                className="w-full h-full bg-gradient-to-br from-amber-400 to-orange-500 rounded-2xl flex items-center justify-center text-white text-lg font-medium"
                style={{ display: "none" }}
              >
                가족 이미지
              </div>
            </div>
          </div>

          {/* 텍스트 콘텐츠 */}
          <div className="text-center md:text-left flex-1">
            <h1 className="text-3xl md:text-4xl font-bold text-white mb-4">
              그 시절의 웃음, 오늘 다시
            </h1>
            <p className="text-lg text-amber-100 mb-6">
              지금 가입하시고 이웃과 소통을 시작해보세요!
            </p>
            <button
              className="bg-white hover:bg-gray-100 text-amber-700 font-semibold py-3 px-8 rounded-lg transition-colors duration-200 shadow-md"
              onClick={() => navigate("/signup")}
            >
              가입하기
            </button>
          </div>
        </div>
      </div>
    </section>
  );
};

export default Banner;
