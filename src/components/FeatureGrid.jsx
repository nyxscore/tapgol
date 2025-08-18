import React from 'react';
import { useNavigate } from 'react-router-dom';

const FeatureGrid = () => {
  const navigate = useNavigate();

  const features = [
    {
      id: 1,
      name: '게시판',
      icon: (
        <svg className="w-8 h-8" fill="currentColor" viewBox="0 0 20 20">
          <path fillRule="evenodd" d="M18 10c0 3.866-3.582 7-8 7a8.841 8.841 0 01-4.083-.98L2 17l1.338-3.123C2.493 12.767 2 11.434 2 10c0-3.866 3.582-7 8-7s8 3.134 8 7zM7 9H5v2h2V9zm8 0h-2v2h2V9zM9 9h2v2H9V9z" clipRule="evenodd" />
        </svg>
      ),
      path: '/board'
    },
    {
      id: 2,
      name: '동네모임',
      icon: (
        <svg className="w-8 h-8" fill="currentColor" viewBox="0 0 20 20">
          <path fillRule="evenodd" d="M5.05 4.05a7 7 0 119.9 9.9L10 18.9l-4.95-4.95a7 7 0 010-9.9zM10 11a2 2 0 100-4 2 2 0 000 4z" clipRule="evenodd" />
        </svg>
      ),
      path: '/community'
    },
    {
      id: 3,
      name: '놀이터',
      icon: (
        <svg className="w-8 h-8" fill="currentColor" viewBox="0 0 20 20">
          <path d="M13 6a3 3 0 11-6 0 3 3 0 016 0zM18 8a2 2 0 11-4 0 2 2 0 014 0zM14 15a4 4 0 00-8 0v3h8v-3z" />
        </svg>
      ),
      path: '/playground'
    },
    {
      id: 4,
      name: '공원톡',
      icon: (
        <svg className="w-8 h-8" fill="currentColor" viewBox="0 0 20 20">
          <path fillRule="evenodd" d="M18 10c0 3.866-3.582 7-8 7a8.841 8.841 0 01-4.083-.98L2 17l1.338-3.123C2.493 12.767 2 11.434 2 10c0-3.866 3.582-7 8-7s8 3.134 8 7zM7 9H5v2h2V9zm8 0h-2v2h2V9zM9 9h2v2H9V9z" clipRule="evenodd" />
        </svg>
      ),
      path: '/chat'
    },
    {
      id: 5,
      name: '갤러리',
      icon: (
        <svg className="w-8 h-8" fill="currentColor" viewBox="0 0 20 20">
          <path fillRule="evenodd" d="M4 3a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V5a2 2 0 00-2-2H4zm12 12H4l4-8 3 6 2-4 3 6z" clipRule="evenodd" />
        </svg>
      ),
      path: '/gallery'
    },
    {
      id: 6,
      name: '건강정보',
      icon: (
        <svg className="w-8 h-8" fill="currentColor" viewBox="0 0 20 20">
          <path fillRule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clipRule="evenodd" />
        </svg>
      ),
      path: '/health-board'
    },
    {
      id: 7,
      name: '동창찾기',
      icon: (
        <svg className="w-8 h-8" fill="currentColor" viewBox="0 0 20 20">
          <path fillRule="evenodd" d="M8 4a4 4 0 100 8 4 4 0 000-8zM2 8a6 6 0 1110.89 3.476l4.817 4.817a1 1 0 01-1.414 1.414l-4.816-4.816A6 6 0 012 8z" clipRule="evenodd" />
        </svg>
      ),
      path: '/alumni-search'
    },
    {
      id: 8,
      name: '노래방',
      icon: (
        <svg className="w-8 h-8" fill="currentColor" viewBox="0 0 20 20">
          <path fillRule="evenodd" d="M7 4a3 3 0 016 0v4a3 3 0 11-6 0V4zm4 10.93A7.001 7.001 0 0017 8a1 1 0 10-2 0A5 5 0 015 8a1 1 0 00-2 0 7.001 7.001 0 006 6.93V17H6a1 1 0 100 2h8a1 1 0 100-2h-3v-2.07z" clipRule="evenodd" />
        </svg>
      ),
      path: '/karaoke'
    }
  ];

  const handleFeatureClick = (feature) => {
    if (feature.path) {
      navigate(feature.path);
    }
  };

  return (
    <section className="py-8 px-4">
      <div className="max-w-4xl mx-auto">
        <div className="grid grid-cols-3 md:grid-cols-4 gap-4">
          {features.map((feature) => (
            <button
              key={feature.id}
              className="bg-gray-800 rounded-xl shadow-md p-4 hover:shadow-lg transition-all duration-200 transform hover:scale-105"
              onClick={() => handleFeatureClick(feature)}
            >
              <div className="flex flex-col items-center space-y-3">
                <div className="w-16 h-16 bg-white rounded-xl flex items-center justify-center">
                  <div className="text-gray-800">
                    {feature.icon}
                  </div>
                </div>
                <span className="text-sm font-medium text-white text-center">
                  {feature.name}
                </span>
              </div>
            </button>
          ))}
        </div>
      </div>
    </section>
  );
};

export default FeatureGrid;
