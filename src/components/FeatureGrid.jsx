import React from 'react';
import { useNavigate } from 'react-router-dom';

const FeatureGrid = () => {
  const navigate = useNavigate();

  const features = [
    {
      id: 1,
      name: '모임게시판',
      icon: '📋',
      path: '/board'
    },

    {
      id: 5,
      name: '추억앨범',
      icon: '📸',
      path: '/gallery'
    },
    {
      id: 6,
      name: '건강정보',
      icon: '🏥',
      path: '/health'
    },

    {
      id: 7,
      name: '요리노하우',
      icon: '👨‍🍳',
      path: '/cooking'
    },

    {
      id: 8,
      name: '노래자랑',
      icon: '🎤',
      path: '/karaoke'
    },
    {
      id: 9,
      name: '중고장터',
      icon: '🛒',
      path: '/marketplace'
    }
  ];

  const handleFeatureClick = (feature) => {
    console.log('Feature clicked:', feature);
    if (feature.path) {
      console.log('Navigating to:', feature.path);
      try {
        navigate(feature.path);
      } catch (error) {
        console.error('Navigation error:', error);
        // 네비게이션 실패 시 window.location 사용
        window.location.href = feature.path;
      }
    } else {
      console.error('No path defined for feature:', feature);
    }
  };

  return (
    <section className="py-8 px-4">
      <div className="max-w-4xl mx-auto">
        <div className="grid grid-cols-3 md:grid-cols-4 gap-4">
          {features.map((feature) => (
            <button
              key={feature.id}
              onClick={() => handleFeatureClick(feature)}
              className="flex flex-col items-center p-4 bg-white rounded-lg shadow-md hover:shadow-lg transition-shadow duration-200"
            >
                             <div className="text-amber-600 mb-2 text-4xl">
                 {feature.icon}
               </div>
              <span className="text-sm font-medium text-gray-700">{feature.name}</span>
            </button>
          ))}
        </div>
      </div>
    </section>
  );
};

export default FeatureGrid;
