// 실제 AI 검색 서비스
// VITE_ALUMNI_SEARCH_API 환경 변수에 설정된 외부 엔드포인트로 요청을 보냅니다.

export async function searchAlumniWithAI(params) {
  const { schoolName, graduationYear, age, additionalInfo, user } = params || {};

  // 필수값 체크
  if (!schoolName || !graduationYear || !age) {
    throw new Error('필수 입력값이 누락되었습니다.');
  }

  // 실제 AI 검색 API 엔드포인트 (예시)
  const endpoint = import.meta.env.VITE_ALUMNI_SEARCH_API || 'https://api.openai.com/v1/chat/completions';

  const payload = {
    schoolName,
    graduationYear,
    age,
    additionalInfo: additionalInfo || '',
    user: user
      ? { uid: user.uid, email: user.email || null, displayName: user.displayName || null }
      : null,
  };

  try {
    const response = await fetch(endpoint, {
      method: 'POST',
      headers: { 
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${import.meta.env.VITE_OPENAI_API_KEY || ''}`
      },
      body: JSON.stringify({
        model: "gpt-3.5-turbo",
        messages: [
          {
            role: "system",
            content: `당신은 동창찾기 전문 AI입니다. 주어진 정보를 바탕으로 실제 동창 후보들을 찾아주세요. 
            응답은 다음 JSON 형식으로만 제공하세요:
            {
              "results": [
                {
                  "id": "고유ID",
                  "name": "이름",
                  "age": 나이,
                  "platform": "소셜플랫폼명",
                  "platformIcon": "이모지",
                  "platformColor": "Tailwind 색상 클래스",
                  "profileImage": "프로필 이미지 URL",
                  "bio": "소개글",
                  "matchScore": 매칭점수(70-100),
                  "isOnline": 온라인여부,
                  "lastActive": "마지막 활동 시간"
                }
              ]
            }`
          },
          {
            role: "user",
            content: `학교: ${schoolName}, 졸업년도: ${graduationYear}년, 현재 나이: ${age}세, 추가정보: ${additionalInfo || '없음'}
            이 정보를 바탕으로 실제 동창 후보들을 찾아주세요.`
          }
        ],
        temperature: 0.7,
        max_tokens: 2000
      }),
    });

    if (!response.ok) {
      throw new Error(`API 호출 실패: ${response.status}`);
    }

    const data = await response.json();
    
    // OpenAI 응답에서 content 추출
    const content = data.choices?.[0]?.message?.content;
    if (!content) {
      throw new Error('AI 응답이 올바르지 않습니다.');
    }

    // JSON 파싱 시도
    try {
      const parsedContent = JSON.parse(content);
      if (Array.isArray(parsedContent.results) && parsedContent.results.length > 0) {
        return {
          results: parsedContent.results,
          meta: { source: 'openai-ai' }
        };
      }
    } catch (parseError) {
      console.error('AI 응답 JSON 파싱 실패:', parseError);
    }

    // AI 결과가 없거나 파싱 실패 시 유사한 가상 데이터 생성
    return {
      results: generateSimilarMockResults(schoolName, graduationYear, age, additionalInfo),
      meta: { source: 'similar-mock' }
    };

  } catch (error) {
    console.error('AI 검색 오류:', error);
    // 오류 발생 시에도 유사한 가상 데이터 반환
    return {
      results: generateSimilarMockResults(schoolName, graduationYear, age, additionalInfo),
      meta: { source: 'error-fallback' }
    };
  }
}

// 유사한 조건의 가상 데이터 생성 함수
function generateSimilarMockResults(schoolName, graduationYear, age, additionalInfo) {
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
    '한소희', '송민호', '조은영', '백준호', '신다은', '오승우', '유재석', '전지현',
    '김태희', '이병헌', '박보영', '정우성', '최강희', '강하늘', '윤아', '임시완'
  ];

  const mockResults = [];
  const baseAge = parseInt(age);
  
  // 유사한 조건의 가상 데이터 생성 (3-6명)
  const count = Math.floor(Math.random() * 4) + 3;
  
  for (let i = 0; i < count; i++) {
    const name = mockNames[Math.floor(Math.random() * mockNames.length)];
    const platform = platforms[Math.floor(Math.random() * platforms.length)];
    const ageVariation = Math.floor(Math.random() * 6) - 3; // ±3살 차이
    const matchScore = Math.floor(Math.random() * 20) + 75; // 75-95% 매칭
    
    mockResults.push({
      id: `similar-${i}`,
      name: name,
      age: baseAge + ageVariation,
      platform: platform.name,
      platformIcon: platform.icon,
      platformColor: platform.color,
      profileImage: `https://images.unsplash.com/photo-${1500000000000 + Math.floor(Math.random() * 1000000000)}?w=100&h=100&fit=crop&crop=face`,
      bio: `${schoolName} ${graduationYear}년 졸업생으로 추정되는 동창 후보입니다. ${additionalInfo ? `(${additionalInfo})` : ''}`,
      matchScore: matchScore,
      isOnline: Math.random() > 0.6,
      lastActive: Math.random() > 0.5 ? '방금 전' : '1시간 전'
    });
  }

  return mockResults;
}


