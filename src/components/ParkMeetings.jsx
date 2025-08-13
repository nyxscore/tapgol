import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import Header from './Header';
import BottomNavigation from './BottomNavigation';

const ParkMeetings = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [park, setPark] = useState(null);
  const [meetings, setMeetings] = useState([]);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [newMeeting, setNewMeeting] = useState({
    title: '',
    date: '',
    time: '',
    maxParticipants: 10,
    description: ''
  });

  // 샘플 공원 데이터
  const parkData = {
    1: {
      id: 1,
      name: '탑골공원',
      location: '종로구',
      image: 'https://images.unsplash.com/photo-1578662996442-48f60103fc96?w=800&h=400&fit=crop',
      description: '서울의 대표적인 공원으로 많은 사람들이 모이는 곳입니다.',
      memberCount: 156
    },
    2: {
      id: 2,
      name: '한강공원',
      location: '용산구',
      image: 'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=800&h=400&fit=crop',
      description: '한강변의 아름다운 공원으로 산책과 운동하기 좋은 곳입니다.',
      memberCount: 234
    },
    3: {
      id: 3,
      name: '북서울꿈의숲',
      location: '강북구',
      image: 'https://images.unsplash.com/photo-1441974231531-c6227db76b6e?w=800&h=400&fit=crop',
      description: '자연과 함께하는 힐링 공간으로 가족 단위 방문객이 많습니다.',
      memberCount: 89
    },
    4: {
      id: 4,
      name: '월드컵공원',
      location: '마포구',
      image: 'https://images.unsplash.com/photo-1578662996442-48f60103fc96?w=800&h=400&fit=crop',
      description: '월드컵 경기장 인근의 넓은 공원으로 다양한 활동이 가능합니다.',
      memberCount: 178
    },
    5: {
      id: 5,
      name: '올림픽공원',
      location: '송파구',
      image: 'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=800&h=400&fit=crop',
      description: '올림픽의 역사가 담긴 공원으로 문화와 자연을 함께 즐길 수 있습니다.',
      memberCount: 201
    },
    6: {
      id: 6,
      name: '남산공원',
      location: '중구',
      image: 'https://images.unsplash.com/photo-1441974231531-c6227db76b6e?w=800&h=400&fit=crop',
      description: '서울의 상징적인 공원으로 도시의 아름다운 전경을 볼 수 있습니다.',
      memberCount: 145
    }
  };

  // 샘플 모임 데이터
  const sampleMeetings = {
    1: [
      {
        id: 1,
        title: '탑골공원 아침 산책 모임',
        organizer: '김철수',
        date: '2024-01-20',
        time: '07:00',
        maxParticipants: 15,
        currentParticipants: 8,
        description: '매일 아침 탑골공원에서 함께 산책하는 모임입니다.',
        status: 'open'
      },
      {
        id: 2,
        title: '탑골공원 독서 모임',
        organizer: '이영희',
        date: '2024-01-22',
        time: '14:00',
        maxParticipants: 10,
        currentParticipants: 10,
        description: '공원에서 책을 읽으며 대화하는 모임입니다.',
        status: 'full'
      }
    ],
    2: [
      {
        id: 1,
        title: '한강공원 러닝 모임',
        organizer: '박민수',
        date: '2024-01-21',
        time: '18:00',
        maxParticipants: 20,
        currentParticipants: 12,
        description: '한강변에서 함께 뛰는 러닝 모임입니다.',
        status: 'open'
      }
    ]
  };

  useEffect(() => {
    const currentPark = parkData[id];
    const currentMeetings = sampleMeetings[id] || [];
    
    if (currentPark) {
      setPark(currentPark);
      setMeetings(currentMeetings);
    }
  }, [id]);

  const handleCreateMeeting = (e) => {
    e.preventDefault();
    if (newMeeting.title && newMeeting.date && newMeeting.time) {
      const meeting = {
        id: meetings.length + 1,
        ...newMeeting,
        organizer: '나',
        currentParticipants: 1,
        status: 'open'
      };
      setMeetings([...meetings, meeting]);
      setNewMeeting({
        title: '',
        date: '',
        time: '',
        maxParticipants: 10,
        description: ''
      });
      setShowCreateForm(false);
    }
  };

  const handleJoinMeeting = (meetingId) => {
    setMeetings(meetings.map(meeting => 
      meeting.id === meetingId 
        ? { ...meeting, currentParticipants: meeting.currentParticipants + 1 }
        : meeting
    ));
  };

  if (!park) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-amber-50 via-orange-50 to-amber-100 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-500 mx-auto mb-4"></div>
          <p className="text-gray-600">로딩 중...</p>
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
            onClick={() => navigate('/community')}
            className="mb-4 flex items-center text-gray-600 hover:text-gray-800 transition-colors"
          >
            <svg className="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M9.707 16.707a1 1 0 01-1.414 0l-6-6a1 1 0 010-1.414l6-6a1 1 0 011.414 1.414L5.414 9H17a1 1 0 110 2H5.414l4.293 4.293a1 1 0 010 1.414z" clipRule="evenodd" />
            </svg>
            동네모임으로 돌아가기
          </button>

          {/* 공원 정보 */}
          <div className="bg-white rounded-lg shadow-lg overflow-hidden mb-6">
            <img
              src={park.image}
              alt={park.name}
              className="w-full h-48 object-cover"
            />
            <div className="p-6">
              <div className="flex items-center justify-between mb-4">
                <h1 className="text-2xl font-bold text-gray-800">{park.name}</h1>
                <span className="text-sm text-gray-500">{park.location}</span>
              </div>
              <p className="text-gray-700 mb-4">{park.description}</p>
              <div className="flex items-center space-x-4 text-sm text-gray-500">
                <div className="flex items-center space-x-1">
                  <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                    <path d="M13 6a3 3 0 11-6 0 3 3 0 016 0zM18 8a2 2 0 11-4 0 2 2 0 014 0zM14 15a4 4 0 00-8 0v3h8v-3z" />
                  </svg>
                  <span>{park.memberCount}명의 멤버</span>
                </div>
                <div className="flex items-center space-x-1">
                  <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M6 2a1 1 0 00-1 1v1H4a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V6a2 2 0 00-2-2h-1V3a1 1 0 10-2 0v1H7V3a1 1 0 00-1-1zm0 5a1 1 0 000 2h8a1 1 0 100-2H6z" clipRule="evenodd" />
                  </svg>
                  <span>{meetings.length}개의 모임</span>
                </div>
              </div>
            </div>
          </div>

          {/* 모임 목록 */}
          <div className="bg-white rounded-lg shadow-lg p-6 mb-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-semibold text-gray-800">모임 목록</h2>
              <button
                onClick={() => setShowCreateForm(!showCreateForm)}
                className="px-4 py-2 bg-orange-500 text-white rounded-lg hover:bg-orange-600 transition-colors"
              >
                {showCreateForm ? '취소' : '모임 만들기'}
              </button>
            </div>

            {/* 모임 생성 폼 */}
            {showCreateForm && (
              <form onSubmit={handleCreateMeeting} className="bg-gray-50 rounded-lg p-4 mb-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <input
                    type="text"
                    placeholder="모임 제목"
                    value={newMeeting.title}
                    onChange={(e) => setNewMeeting({...newMeeting, title: e.target.value})}
                    className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
                    required
                  />
                  <input
                    type="date"
                    value={newMeeting.date}
                    onChange={(e) => setNewMeeting({...newMeeting, date: e.target.value})}
                    className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
                    required
                  />
                  <input
                    type="time"
                    value={newMeeting.time}
                    onChange={(e) => setNewMeeting({...newMeeting, time: e.target.value})}
                    className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
                    required
                  />
                  <input
                    type="number"
                    placeholder="최대 인원"
                    value={newMeeting.maxParticipants}
                    onChange={(e) => setNewMeeting({...newMeeting, maxParticipants: parseInt(e.target.value)})}
                    className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
                    min="1"
                    max="50"
                  />
                </div>
                <textarea
                  placeholder="모임 설명"
                  value={newMeeting.description}
                  onChange={(e) => setNewMeeting({...newMeeting, description: e.target.value})}
                  className="w-full mt-4 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
                  rows="3"
                />
                <button
                  type="submit"
                  className="mt-4 px-6 py-2 bg-orange-500 text-white rounded-lg hover:bg-orange-600 transition-colors"
                >
                  모임 생성
                </button>
              </form>
            )}

            {/* 모임 목록 */}
            <div className="space-y-4">
              {meetings.length === 0 ? (
                <p className="text-gray-500 text-center py-8">아직 모임이 없습니다. 첫 번째 모임을 만들어보세요!</p>
              ) : (
                meetings.map((meeting) => (
                  <div key={meeting.id} className="border border-gray-200 rounded-lg p-4">
                    <div className="flex items-start justify-between mb-2">
                      <h3 className="font-semibold text-gray-800">{meeting.title}</h3>
                      <span className={`text-xs px-2 py-1 rounded ${
                        meeting.status === 'open' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                      }`}>
                        {meeting.status === 'open' ? '모집중' : '마감'}
                      </span>
                    </div>
                    <p className="text-sm text-gray-600 mb-3">{meeting.description}</p>
                    <div className="flex items-center justify-between text-sm text-gray-500 mb-3">
                      <div className="flex items-center space-x-4">
                        <span>주최자: {meeting.organizer}</span>
                        <span>{meeting.date} {meeting.time}</span>
                        <span>{meeting.currentParticipants}/{meeting.maxParticipants}명</span>
                      </div>
                    </div>
                    {meeting.status === 'open' && (
                      <button
                        onClick={() => handleJoinMeeting(meeting.id)}
                        className="px-4 py-2 bg-orange-500 text-white rounded-lg hover:bg-orange-600 transition-colors text-sm"
                      >
                        참여하기
                      </button>
                    )}
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </main>
      <BottomNavigation />
    </div>
  );
};

export default ParkMeetings;
