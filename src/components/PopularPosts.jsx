import React from "react";

const PopularPosts = () => {
  return (
    <section className="py-8 px-4">
      <div className="max-w-4xl mx-auto">
        <h2 className="text-2xl font-bold text-gray-800 mb-6">오늘의 인기글</h2>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* 첫 번째 인기글 */}
          <div className="bg-white rounded-lg shadow-md overflow-hidden hover:shadow-lg transition-shadow duration-200">
            <div className="p-4">
              <div className="flex items-center space-x-3">
                <div className="w-12 h-12 bg-gradient-to-br from-blue-400 to-blue-600 rounded-lg flex items-center justify-center">
                  <svg
                    className="w-6 h-6 text-white"
                    fill="currentColor"
                    viewBox="0 0 20 20"
                  >
                    <path
                      fillRule="evenodd"
                      d="M4 3a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V5a2 2 0 00-2-2H4zm12 12H4l4-8 3 6 2-4 3 6z"
                      clipRule="evenodd"
                    />
                  </svg>
                </div>
                <div className="flex-1">
                  <p className="text-sm text-gray-600">[갤러리]</p>
                  <p className="font-medium text-gray-800">
                    전국 냉면 맛집 공유
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* 두 번째 인기글 */}
          <div className="bg-white rounded-lg shadow-md overflow-hidden hover:shadow-lg transition-shadow duration-200">
            <div className="p-4">
              <div className="flex items-center space-x-3">
                <div className="w-12 h-12 bg-gradient-to-br from-purple-400 to-purple-600 rounded-lg flex items-center justify-center">
                  <svg
                    className="w-6 h-6 text-white"
                    fill="currentColor"
                    viewBox="0 0 20 20"
                  >
                    <path d="M10 2a6 6 0 016 6c0 4-6 10-6 10S4 12 4 8a6 6 0 016-6zm0 8a2 2 0 100-4 2 2 0 000 4z" />
                  </svg>
                </div>
                <div className="flex-1">
                  <p className="text-sm text-gray-600">[동네모임]</p>
                  <p className="font-medium text-gray-800">
                    맨발 걷기 모임 이벤트🔥
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* 세 번째 인기글 */}
          <div className="bg-white rounded-lg shadow-md overflow-hidden hover:shadow-lg transition-shadow duration-200">
            <div className="p-4">
              <div className="flex items-center space-x-3">
                <div className="w-12 h-12 bg-gradient-to-br from-green-400 to-green-600 rounded-lg flex items-center justify-center">
                  <svg
                    className="w-6 h-6 text-white"
                    fill="currentColor"
                    viewBox="0 0 20 20"
                  >
                    <path d="M13 7H7v6h6V7z" />
                    <path
                      fillRule="evenodd"
                      d="M5 3a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2V7.414A2 2 0 0016.586 6L13 2.414A2 2 0 0011.586 2H5zm10 14H5V5h6v3a1 1 0 001 1h3v8z"
                      clipRule="evenodd"
                    />
                  </svg>
                </div>
                <div className="flex-1">
                  <p className="text-sm text-gray-600">[생활정보]</p>
                  <p className="font-medium text-gray-800">
                    시니어 지원금 신청 안내
                  </p>
                </div>
              </div>
            </div>
          </div>
          {/* 끝 */}
        </div>
      </div>
    </section>
  );
};

export default PopularPosts;
