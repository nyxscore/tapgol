import React from 'react';
import { useNavigate } from 'react-router-dom';

const ParkMeetings = () => {
  const navigate = useNavigate();

  const meetings = [
    {
      id: 1,
      title: "탑골공원 아침 산책 모임",
      date: "2024-03-15",
      time: "07:00",
      location: "탑골공원",
      description: "매일 아침 함께 산책하며 건강을 챙겨보세요",
      participants: 12,
      maxParticipants: 20,
      category: "건강"
    },
    {
      id: 2,
      title: "한강공원 독서 모임",
      date: "2024-03-16",
      time: "14:00",
      location: "한강공원",
      description: "한강변에서 책을 읽으며 지식을 나누는 모임",
      participants: 8,
      maxParticipants: 15,
      category: "문화"
    },
    {
      id: 3,
      title: "북서울꿈의숲 가족 피크닉",
      date: "2024-03-17",
      time: "11:00",
      location: "북서울꿈의숲",
      description: "가족과 함께하는 즐거운 피크닉",
      participants: 25,
      maxParticipants: 30,
      category: "가족"
    }
  ];

  const handleMeetingClick = (meetingId) => {
    navigate(`/park-meetings/${meetingId}`);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-amber-50 via-orange-50 to-amber-100">
      <main className="pb-20 pt-16">
        <div className="max-w-4xl mx-auto px-4">
          <div className="mb-6">
            <h1 className="text-2xl font-bold text-gray-800 mb-2">공원 모임</h1>
            <p className="text-gray-600">다양한 공원 모임에 참여해보세요</p>
          </div>
          
          <div className="space-y-4">
            {meetings.map((meeting) => (
              <div
                key={meeting.id}
                onClick={() => handleMeetingClick(meeting.id)}
                className="bg-white rounded-lg shadow-md p-6 cursor-pointer hover:shadow-lg transition-shadow"
              >
                <div className="flex items-center justify-between mb-3">
                  <span className={`inline-block px-3 py-1 rounded-full text-sm font-medium ${
                    meeting.category === '건강' ? 'bg-green-100 text-green-800' :
                    meeting.category === '문화' ? 'bg-blue-100 text-blue-800' :
                    'bg-orange-100 text-orange-800'
                  }`}>
                    {meeting.category}
                  </span>
                  <span className="text-sm text-gray-500">{meeting.date} {meeting.time}</span>
                </div>
                <h3 className="text-lg font-semibold text-gray-800 mb-2">{meeting.title}</h3>
                <p className="text-sm text-gray-600 mb-3">{meeting.description}</p>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-500">{meeting.location}</span>
                  <span className="text-sm text-gray-500">{meeting.participants}/{meeting.maxParticipants}명</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </main>
    </div>
  );
};

export default ParkMeetings;
