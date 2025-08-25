import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';

const AlumniResults = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const [searchData, setSearchData] = useState(null);
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedPlatform, setSelectedPlatform] = useState('all');
  const [aiMeta, setAiMeta] = useState(null);

  useEffect(() => {
    if (location.state?.searchData) {
      setSearchData(location.state.searchData);

      // AI 검색 결과 설정
      const incomingResults = Array.isArray(location.state.aiResults)
        ? location.state.aiResults
        : [];
      setResults(incomingResults);
      setAiMeta(location.state.aiMeta || null);
      setLoading(false);
    } else {
      navigate('/alumni-search');
    }
  }, [location.state, navigate]);

  const filteredResults = selectedPlatform === 'all' 
    ? results 
    : results.filter(result => result.platform === selectedPlatform);

  // 결과에서 사용된 플랫폼들 추출
  const platforms = [
    { name: 'all', label: '전체', icon: '🔍' },
    ...Array.from(new Set(results.map(r => r.platform)))
      .filter(platform => platform && platform !== 'all')
      .map(platform => ({
        name: platform,
        label: platform,
        icon: results.find(r => r.platform === platform)?.platformIcon || '📱'
      }))
  ];

  const handleContact = (result) => {
    alert(`${result.name}님에게 연락하기\n플랫폼: ${result.platform}\n\n실제 서비스에서는 해당 플랫폼으로 연결됩니다.`);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-amber-50 via-orange-50 to-amber-100 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-500 mx-auto mb-4"></div>
          <p className="text-gray-600 mb-2">AI가 동창을 검색하고 있습니다...</p>
          <p className="text-sm text-gray-500">소셜 네트워크와 AI를 활용하여 정보를 수집 중입니다</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-amber-50 via-orange-50 to-amber-100">
      <main className="pt-16">
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
                {aiMeta?.source === 'similar-mock' || aiMeta?.source === 'error-fallback' 
                  ? '유사한 동창 후보' 
                  : 'AI 검색 결과'} ({filteredResults.length}명)
              </h2>
              <span className="text-sm text-gray-500">
                {aiMeta?.source === 'openai-ai' ? 'AI 분석 결과' : 
                 aiMeta?.source === 'similar-mock' ? '유사한 조건으로 추천' :
                 aiMeta?.source === 'error-fallback' ? '추천 결과' : '검색 결과'}
              </span>
            </div>

            {/* 유사한 결과 안내 메시지 */}
            {(aiMeta?.source === 'similar-mock' || aiMeta?.source === 'error-fallback') && (
              <div className="mb-4 p-3 bg-blue-50 rounded-lg">
                <div className="flex items-center">
                  <span className="text-blue-600 mr-2">💡</span>
                  <p className="text-sm text-blue-700">
                    정확한 동창을 찾지 못했지만, 유사한 조건의 동창 후보들을 추천해드립니다.
                  </p>
                </div>
              </div>
            )}

            {/* 플랫폼 필터 (결과가 있을 때만 표시) */}
            {platforms.length > 1 && (
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
            )}
          </div>

          {/* 검색 결과 목록 */}
          <div className="space-y-4">
            {filteredResults.length === 0 ? (
              <div className="bg-white rounded-lg shadow-lg p-8 text-center">
                <div className="text-6xl mb-4">🔍</div>
                <h3 className="text-xl font-semibold text-gray-800 mb-2">검색 결과가 없습니다</h3>
                <p className="text-gray-500 mb-4">입력하신 조건으로 동창을 찾을 수 없었습니다.</p>
                <div className="text-sm text-gray-400 space-y-1">
                  <p>• 검색 조건을 변경해보세요</p>
                  <p>• 추가 정보를 더 자세히 입력해보세요</p>
                  <p>• 다른 졸업년도로 시도해보세요</p>
                </div>
                <button
                  onClick={() => navigate('/alumni-search')}
                  className="mt-6 px-6 py-2 bg-orange-500 text-white rounded-lg hover:bg-orange-600 transition-colors"
                >
                  다시 검색하기
                </button>
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
                        onError={(e) => {
                          e.target.src = 'https://images.unsplash.com/photo-1527980965255-d3b416303d12?w=100&h=100&fit=crop&crop=face';
                        }}
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
              <li>• AI 검색 결과는 참고용이며, 실제 동창 여부는 확인이 필요합니다</li>
              <li>• 연락하기 전에 상대방의 동의를 받아주세요</li>
              <li>• 개인정보 보호를 위해 신중하게 접근해주세요</li>
              <li>• 부적절한 연락이나 스팸은 금지됩니다</li>
            </ul>
          </div>
        </div>
      </main>
    </div>
  );
};

export default AlumniResults;
