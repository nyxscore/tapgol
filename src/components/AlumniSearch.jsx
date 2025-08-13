import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Header from './Header';
import BottomNavigation from './BottomNavigation';

const AlumniSearch = () => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    schoolName: '',
    graduationYear: '',
    age: '',
    additionalInfo: ''
  });

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (formData.schoolName && formData.graduationYear && formData.age) {
      // 검색 결과 페이지로 이동하면서 데이터 전달
      navigate('/alumni-results', { 
        state: { searchData: formData }
      });
    }
  };

  const currentYear = new Date().getFullYear();
  const graduationYears = Array.from({ length: 30 }, (_, i) => currentYear - i);

  return (
    <div className="min-h-screen bg-gradient-to-br from-amber-50 via-orange-50 to-amber-100">
      <Header />
      <main className="pb-20 pt-16">
        <div className="max-w-4xl mx-auto px-4">
          <div className="mb-6">
            <h1 className="text-2xl font-bold text-gray-800 mb-2">동창찾기</h1>
            <p className="text-gray-600">졸업학교와 나이를 입력하여 동창을 찾아보세요</p>
          </div>

          <div className="bg-white rounded-lg shadow-lg p-6">
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* 학교명 입력 */}
              <div>
                <label htmlFor="schoolName" className="block text-sm font-medium text-gray-700 mb-2">
                  졸업학교 *
                </label>
                <input
                  type="text"
                  id="schoolName"
                  name="schoolName"
                  value={formData.schoolName}
                  onChange={handleInputChange}
                  placeholder="예: 서울고등학교"
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                  required
                />
              </div>

              {/* 졸업년도 선택 */}
              <div>
                <label htmlFor="graduationYear" className="block text-sm font-medium text-gray-700 mb-2">
                  졸업년도 *
                </label>
                <select
                  id="graduationYear"
                  name="graduationYear"
                  value={formData.graduationYear}
                  onChange={handleInputChange}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                  required
                >
                  <option value="">졸업년도를 선택하세요</option>
                  {graduationYears.map(year => (
                    <option key={year} value={year}>{year}년</option>
                  ))}
                </select>
              </div>

              {/* 나이 입력 */}
              <div>
                <label htmlFor="age" className="block text-sm font-medium text-gray-700 mb-2">
                  현재 나이 *
                </label>
                <input
                  type="number"
                  id="age"
                  name="age"
                  value={formData.age}
                  onChange={handleInputChange}
                  placeholder="예: 25"
                  min="15"
                  max="100"
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                  required
                />
              </div>

              {/* 추가 정보 */}
              <div>
                <label htmlFor="additionalInfo" className="block text-sm font-medium text-gray-700 mb-2">
                  추가 정보 (선택사항)
                </label>
                <textarea
                  id="additionalInfo"
                  name="additionalInfo"
                  value={formData.additionalInfo}
                  onChange={handleInputChange}
                  placeholder="기억나는 동창의 특징이나 추가 정보를 입력해주세요"
                  rows="4"
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                />
              </div>

              {/* 검색 버튼 */}
              <button
                type="submit"
                className="w-full bg-orange-500 text-white py-3 px-6 rounded-lg hover:bg-orange-600 transition-colors focus:outline-none focus:ring-2 focus:ring-orange-500 focus:ring-offset-2 font-medium"
              >
                동창 검색하기
              </button>
            </form>

            {/* 안내사항 */}
            <div className="mt-6 p-4 bg-blue-50 rounded-lg">
              <h3 className="font-semibold text-blue-800 mb-2">🔍 검색 안내</h3>
              <ul className="text-sm text-blue-700 space-y-1">
                <li>• 입력하신 정보를 바탕으로 소셜 네트워크에서 동창을 검색합니다</li>
                <li>• 공개된 프로필 정보만을 활용하여 검색 결과를 제공합니다</li>
                <li>• 개인정보 보호를 위해 민감한 정보는 노출되지 않습니다</li>
                <li>• 검색 결과는 참고용이며, 직접 연락 시 상대방의 동의를 받아주세요</li>
              </ul>
            </div>

            {/* 지원하는 소셜 네트워크 */}
            <div className="mt-6">
              <h3 className="font-semibold text-gray-800 mb-3">검색 대상 소셜 네트워크</h3>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                {[
                  { name: 'Instagram', icon: '📷', color: 'bg-gradient-to-r from-purple-500 to-pink-500' },
                  { name: 'Telegram', icon: '✈️', color: 'bg-gradient-to-r from-blue-500 to-blue-600' },
                  { name: 'KakaoTalk', icon: '💬', color: 'bg-gradient-to-r from-yellow-400 to-yellow-500' },
                  { name: 'Naver Band', icon: '🎵', color: 'bg-gradient-to-r from-green-500 to-green-600' },
                  { name: 'YouTube', icon: '📺', color: 'bg-gradient-to-r from-red-500 to-red-600' },
                  { name: 'TikTok', icon: '🎵', color: 'bg-gradient-to-r from-pink-500 to-purple-500' }
                ].map((platform, index) => (
                  <div key={index} className={`${platform.color} text-white p-3 rounded-lg text-center`}>
                    <div className="text-lg mb-1">{platform.icon}</div>
                    <div className="text-xs font-medium">{platform.name}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </main>
      <BottomNavigation />
    </div>
  );
};

export default AlumniSearch;
