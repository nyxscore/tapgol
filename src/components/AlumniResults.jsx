import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import Header from './Header';
import BottomNavigation from './BottomNavigation';

const AlumniResults = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const [searchData, setSearchData] = useState(null);
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedPlatform, setSelectedPlatform] = useState('all');

  useEffect(() => {
    if (location.state?.searchData) {
      setSearchData(location.state.searchData);
      // 시뮬레이션된 검색 결과 생성
      setTimeout(() => {
        generateMockResults(location.state.searchData);
        setLoading(false);
      }, 2000);
    } else {
      navigate('/alumni-search');
    }
  }, [location.state, navigate]);

  const generateMockResults = (data) => {
    const platforms = [
      { name: 'Instagram', icon: '📷', color: 'from-purple-500 to-pink-500' },
      { name: 'Telegram', icon: '✈️', color: 'from-blue-500 to-blue-600' },
      { name: 'KakaoTalk', icon: '💬', color: 'from-yellow-400 to-yellow-500' },
      { name: 'Naver Band', icon: '🎵', color: 'from-green-500 to-green-600' },
      { name: 'YouTube', icon: '📺', color: 'from-red-500 to-red-600' },
      { name: 'TikTok', icon: '🎵', color: 'from-pink-500 to-purple-500' }
    ];

    const mockNames = [
      '김민수', '이영희', '박철수', '정수진', '최지영', '강동원', '윤서연', '임태현',
      '한소희', '송민호', '조은영', '백준호', '신다은', '오승우', '유재석', '전지현'
    ];

    const mockResults = [];
    
    platforms.forEach(platform => {
      const count = Math.floor(Math.random() * 5) + 1; // 1-5명
      for (let i = 0; i < count; i++) {
        const name = mockNames[Math.floor(Math.random() * mockNames.length)];
        const age = parseInt(data.age) + Math.floor(Math.random() * 6) - 3; // ±3살 차이
        const matchScore = Math.floor(Math.random() * 30) + 70; // 70-100% 매칭
        
        mockResults.push({
          id: `${platform.name}-${i}`,
          name: name,
          age: age,
          platform: platform.name,
          platformIcon: platform.icon,
          platformColor: platform.color,
          profileImage: `https://images.unsplash.com/photo-${1500000000000 + Math.floor(Math.random() * 1000000000)}?w=100&h=100&fit=crop&crop=face`,
          bio: `${data.schoolName} ${data.graduationYear}년 졸업생입니다.`,
          matchScore: matchScore,
          isOnline: Math.random() > 0.7,
          lastActive: Math.random() > 0.5 ? '방금 전' : '1시간 전'
        });
      }
    });

    setResults(mockResults);
  };

  const filteredResults = selectedPlatform === 'all' 
    ? results 
    : results.filter(result => result.platform === selectedPlatform);

  const platforms = [
    { name: 'all', label: '전체', icon: '🔍' },
    { name: 'Instagram', label: 'Instagram', icon: '📷' },
    { name: 'Telegram', label: 'Telegram', icon: '✈️' },
    { name: 'KakaoTalk', label: 'KakaoTalk', icon: '💬' },
    { name: 'Naver Band', label: 'Naver Band', icon: '🎵' },
    { name: 'YouTube', label: 'YouTube', icon: '📺' },
    { name: 'TikTok', label: 'TikTok', icon: '🎵' }
  ];

  const handleContact = (result) => {
    alert(`${result.name}님에게 연락하기\n플랫폼: ${result.platform}\n\n실제 서비스에서는 해당 플랫폼으로 연결됩니다.`);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-amber-50 via-orange-50 to-amber-100 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-500 mx-auto mb-4"></div>
          <p className="text-gray-600 mb-2">동창을 검색하고 있습니다...</p>
          <p className="text-sm text-gray-500">소셜 네트워크에서 정보를 수집 중입니다</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-amber-50 via-orange-50 to-amber-100">
      <Header />
      <main className="pb-20 pt-16">
        <div className="max-w-4xl mx-auto px-4">
          {/* 뒤로가기 버튼 */}
          <button
            onClick={() => navigate('/alumni-search')}
            className="mb-4 flex items-center text-gray-600 hover:text-gray-800 transition-colors"
          >
            <svg className="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M9.707 16.707a1 1 0 01-1.414 0l-6-6a1 1 0 010-1.414l6-6a1 1 0 011.414 1.414L5.414 9H17a1 1 0 110 2H5.414l4.293 4.293a1 1 0 010 1.414z" clipRule="evenodd" />
            </svg>
            동창찾기로 돌아가기
          </button>

          {/* 검색 조건 표시 */}
          {searchData && (
            <div className="bg-white rounded-lg shadow-lg p-4 mb-6">
              <h2 className="text-lg font-semibold text-gray-800 mb-3">검색 조건</h2>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                <div>
                  <span className="text-gray-500">학교:</span>
                  <span className="ml-2 font-medium">{searchData.schoolName}</span>
                </div>
                <div>
                  <span className="text-gray-500">졸업년도:</span>
                  <span className="ml-2 font-medium">{searchData.graduationYear}년</span>
                </div>
                <div>
                  <span className="text-gray-500">나이:</span>
                  <span className="ml-2 font-medium">{searchData.age}세</span>
                </div>
              </div>
            </div>
          )}

          {/* 검색 결과 요약 */}
          <div className="bg-white rounded-lg shadow-lg p-4 mb-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-gray-800">
                검색 결과 ({filteredResults.length}명)
              </h2>
              <span className="text-sm text-gray-500">
                {results.length}명의 동창을 찾았습니다
              </span>
            </div>

            {/* 플랫폼 필터 */}
            <div className="flex flex-wrap gap-2 mb-4">
              {platforms.map(platform => (
                <button
                  key={platform.name}
                  onClick={() => setSelectedPlatform(platform.name)}
                  className={`px-3 py-1 rounded-full text-sm font-medium transition-colors ${
                    selectedPlatform === platform.name
                      ? 'bg-orange-500 text-white'
                      : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                  }`}
                >
                  <span className="mr-1">{platform.icon}</span>
                  {platform.label}
                </button>
              ))}
            </div>
          </div>

          {/* 검색 결과 목록 */}
          <div className="space-y-4">
            {filteredResults.length === 0 ? (
              <div className="bg-white rounded-lg shadow-lg p-8 text-center">
                <p className="text-gray-500">해당 조건의 동창을 찾을 수 없습니다.</p>
                <p className="text-sm text-gray-400 mt-2">검색 조건을 변경해보세요.</p>
              </div>
            ) : (
              filteredResults.map((result) => (
                <div key={result.id} className="bg-white rounded-lg shadow-lg p-4">
                  <div className="flex items-start space-x-4">
                    {/* 프로필 이미지 */}
                    <div className="relative">
                      <img
                        src={result.profileImage}
                        alt={result.name}
                        className="w-16 h-16 rounded-full object-cover"
                      />
                      {result.isOnline && (
                        <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-green-500 rounded-full border-2 border-white"></div>
                      )}
                    </div>

                    {/* 정보 */}
                    <div className="flex-1">
                      <div className="flex items-center justify-between mb-2">
                        <h3 className="font-semibold text-gray-800">{result.name}</h3>
                        <div className="flex items-center space-x-2">
                          <span className={`text-xs px-2 py-1 rounded-full bg-gradient-to-r ${result.platformColor} text-white`}>
                            {result.platformIcon} {result.platform}
                          </span>
                          <span className="text-xs text-gray-500">
                            {result.lastActive}
                          </span>
                        </div>
                      </div>
                      
                      <p className="text-sm text-gray-600 mb-2">{result.bio}</p>
                      
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-4 text-sm text-gray-500">
                          <span>나이: {result.age}세</span>
                          <span>매칭도: {result.matchScore}%</span>
                        </div>
                        
                        <button
                          onClick={() => handleContact(result)}
                          className="px-4 py-2 bg-orange-500 text-white rounded-lg hover:bg-orange-600 transition-colors text-sm"
                        >
                          연락하기
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>

          {/* 주의사항 */}
          <div className="mt-6 bg-yellow-50 rounded-lg p-4">
            <h3 className="font-semibold text-yellow-800 mb-2">⚠️ 주의사항</h3>
            <ul className="text-sm text-yellow-700 space-y-1">
              <li>• 검색 결과는 공개된 정보를 기반으로 제공됩니다</li>
              <li>• 연락하기 전에 상대방의 동의를 받아주세요</li>
              <li>• 개인정보 보호를 위해 신중하게 접근해주세요</li>
              <li>• 부적절한 연락이나 스팸은 금지됩니다</li>
            </ul>
          </div>
        </div>
      </main>
      <BottomNavigation />
    </div>
  );
};

export default AlumniResults;
