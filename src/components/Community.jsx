import React from 'react';
import { useNavigate } from 'react-router-dom';
import Header from './Header';
import BottomNavigation from './BottomNavigation';

const Community = () => {
  const navigate = useNavigate();

  const parks = [
    {
      id: 1,
      name: '탑골공원',
      location: '종로구',
      image: 'https://images.unsplash.com/photo-1578662996442-48f60103fc96?w=400&h=300&fit=crop',
      description: '서울의 대표적인 공원으로 많은 사람들이 모이는 곳입니다.',
      memberCount: 156,
      upcomingMeetings: 3
    },
    {
      id: 2,
      name: '한강공원',
      location: '용산구',
      image: 'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=400&h=300&fit=crop',
      description: '한강변의 아름다운 공원으로 산책과 운동하기 좋은 곳입니다.',
      memberCount: 234,
      upcomingMeetings: 5
    },
    {
      id: 3,
      name: '북서울꿈의숲',
      location: '강북구',
      image: 'https://images.unsplash.com/photo-1441974231531-c6227db76b6e?w=400&h=300&fit=crop',
      description: '자연과 함께하는 힐링 공간으로 가족 단위 방문객이 많습니다.',
      memberCount: 89,
      upcomingMeetings: 2
    },
    {
      id: 4,
      name: '월드컵공원',
      location: '마포구',
      image: 'https://images.unsplash.com/photo-1578662996442-48f60103fc96?w=400&h=300&fit=crop',
      description: '월드컵 경기장 인근의 넓은 공원으로 다양한 활동이 가능합니다.',
      memberCount: 178,
      upcomingMeetings: 4
    },
    {
      id: 5,
      name: '올림픽공원',
      location: '송파구',
      image: 'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=400&h=300&fit=crop',
      description: '올림픽의 역사가 담긴 공원으로 문화와 자연을 함께 즐길 수 있습니다.',
      memberCount: 201,
      upcomingMeetings: 6
    },
    {
      id: 6,
      name: '남산공원',
      location: '중구',
      image: 'https://images.unsplash.com/photo-1441974231531-c6227db76b6e?w=400&h=300&fit=crop',
      description: '서울의 상징적인 공원으로 도시의 아름다운 전경을 볼 수 있습니다.',
      memberCount: 145,
      upcomingMeetings: 3
    }
  ];

  const handleParkClick = (parkId) => {
    navigate(`/community/${parkId}`);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-amber-50 via-orange-50 to-amber-100">
      <Header />
      <main className="pb-20 pt-16">
        <div className="max-w-4xl mx-auto px-4">
          <div className="mb-6">
            <h1 className="text-2xl font-bold text-gray-800 mb-2">동네모임</h1>
            <p className="text-gray-600">가까운 공원에서 이웃들과 만나보세요</p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {parks.map((park) => (
              <div
                key={park.id}
                onClick={() => handleParkClick(park.id)}
                className="bg-white rounded-lg shadow-md overflow-hidden cursor-pointer transform transition-transform hover:scale-105 hover:shadow-lg"
              >
                <div className="relative">
                  <img
                    src={park.image}
                    alt={park.name}
                    className="w-full h-48 object-cover"
                  />
                  <div className="absolute top-2 right-2 bg-orange-500 text-white text-xs px-2 py-1 rounded">
                    {park.location}
                  </div>
                </div>
                <div className="p-4">
                  <h3 className="font-semibold text-gray-800 mb-2">{park.name}</h3>
                  <p className="text-sm text-gray-600 mb-3 line-clamp-2">
                    {park.description}
                  </p>
                  <div className="flex items-center justify-between text-sm text-gray-500">
                    <div className="flex items-center space-x-1">
                      <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                        <path d="M13 6a3 3 0 11-6 0 3 3 0 016 0zM18 8a2 2 0 11-4 0 2 2 0 014 0zM14 15a4 4 0 00-8 0v3h8v-3z" />
                      </svg>
                      <span>{park.memberCount}명</span>
                    </div>
                    <div className="flex items-center space-x-1">
                      <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M6 2a1 1 0 00-1 1v1H4a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V6a2 2 0 00-2-2h-1V3a1 1 0 10-2 0v1H7V3a1 1 0 00-1-1zm0 5a1 1 0 000 2h8a1 1 0 100-2H6z" clipRule="evenodd" />
                      </svg>
                      <span>{park.upcomingMeetings}개 모임</span>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </main>
      <BottomNavigation />
    </div>
  );
};

export default Community;
