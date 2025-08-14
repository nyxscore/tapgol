import React from "react";

const FeaturePanel = () => {
  const sections = [
    {
      title: "헤더 및 푸터 구성",
      items: [
        "헤더: 로고, 로그인 버튼 배치",
        "글자 크기 조절 기능+배너 상단 배치",
        "앞뒤 아이콘 시각적으로 강조",
        "푸터: 간결한 사이트맵, 고객센터 정보",
      ],
    },
    {
      title: "주요 기능 바로가기 섹션",
      items: [
        "8개 주요 기능 아이콘과 텍스트 병행",
        "터치 영역 글자 크게 설계",
        "시각적 구분이 명확한 UI",
      ],
    },
    {
      title: "인기 콘텐츠",
      items: [
        "최신 게시글 섹션 스크롤 없이 상단에 노출",
        "인기 모임 및 활동 추천 카드형 배치(광고)",
      ],
    },
  ];

  return (
    <div className="flex-1 bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 text-white p-12 relative overflow-hidden">
      {/* Background Pattern */}
      <div className="absolute inset-0 opacity-5">
        <div
          className="absolute inset-0"
          style={{
            backgroundImage: `radial-gradient(circle at 25% 25%, white 2px, transparent 2px)`,
            backgroundSize: "60px 60px",
          }}
        ></div>
      </div>

      <div className="relative z-10">
        <div className="mb-12">
          <h1 className="text-6xl font-black mb-4 bg-gradient-to-r from-white via-gray-100 to-gray-300 bg-clip-text text-transparent">
            탑골톡 MAIN
          </h1>
          <div className="w-24 h-1 bg-gradient-to-r from-orange-500 to-orange-600 rounded-full"></div>
        </div>

        <div className="space-y-10">
          {sections.map((section, index) => (
            <div key={index} className="group">
              <div className="flex items-center mb-6">
                <div className="w-12 h-12 bg-gradient-to-br from-orange-500 to-orange-600 text-white rounded-2xl flex items-center justify-center font-black text-lg mr-4 shadow-xl group-hover:scale-110 transition-transform">
                  {index + 1}
                </div>
                <h2 className="text-2xl font-bold group-hover:text-orange-400 transition-colors">
                  {section.title}
                </h2>
              </div>
              <ul className="space-y-3 ml-16">
                {section.items.map((item, itemIndex) => (
                  <li
                    key={itemIndex}
                    className="flex items-start space-x-3 text-gray-300 group-hover:text-gray-100 transition-colors"
                  >
                    <div className="w-2 h-2 bg-orange-500 rounded-full mt-2 flex-shrink-0"></div>
                    <span className="leading-relaxed">{item}</span>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default FeaturePanel;
