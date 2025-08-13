import React from 'react';

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
                  <svg className="w-6 h-6 text-white" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M4 3a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V5a2 2 0 00-2-2H4zm12 12H4l4-8 3 6 2-4 3 6z" clipRule="evenodd" />
                  </svg>
                </div>
                <div className="flex-1">
                  <p className="text-sm text-gray-600">[갤러리]</p>
                  <p className="font-medium text-gray-800">냉면 맛집 공유</p>
                </div>
              </div>
            </div>
          </div>
          
          {/* 두 번째 인기글 */}
          <div className="bg-white rounded-lg shadow-md overflow-hidden hover:shadow-lg transition-shadow duration-200">
            <div className="p-4">
              <div className="flex items-center justify-center h-16">
                <span className="text-2xl font-bold text-gray-400">2</span>
              </div>
            </div>
          </div>
          
          {/* 세 번째 인기글 */}
          <div className="bg-white rounded-lg shadow-md overflow-hidden hover:shadow-lg transition-shadow duration-200">
            <div className="p-4">
              <div className="flex items-center justify-center h-16">
                <span className="text-2xl font-bold text-gray-400">3</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default PopularPosts;
