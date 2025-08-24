import React from 'react';
import { useNavigate } from 'react-router-dom';

const Chat = () => {
  const navigate = useNavigate();

  const chatRooms = [
    {
      id: 1,
      name: "탑골공원 채팅방",
      lastMessage: "안녕하세요! 오늘 날씨가 정말 좋네요.",
      lastMessageTime: "14:30",
      unreadCount: 3,
      participants: 25
    },
    {
      id: 2,
      name: "한강공원 채팅방",
      lastMessage: "내일 산책하실 분 계신가요?",
      lastMessageTime: "12:15",
      unreadCount: 0,
      participants: 18
    },
    {
      id: 3,
      name: "북서울꿈의숲 채팅방",
      lastMessage: "가족 피크닉 장소 추천해주세요!",
      lastMessageTime: "09:45",
      unreadCount: 7,
      participants: 32
    },
    {
      id: 4,
      name: "월드컵공원 채팅방",
      lastMessage: "오늘 축구하실 분 있나요?",
      lastMessageTime: "16:20",
      unreadCount: 1,
      participants: 15
    }
  ];

  const handleChatRoomClick = (roomId) => {
    navigate(`/chat/${roomId}`);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-amber-50 via-orange-50 to-amber-100">
      <main className="pb-20 pt-16">
        <div className="max-w-4xl mx-auto px-4">
          <div className="mb-6">
            <h1 className="text-2xl font-bold text-gray-800 mb-2">공원톡</h1>
            <p className="text-gray-600">이웃들과 대화를 나누어보세요</p>
          </div>
          
          <div className="space-y-4">
            {chatRooms.map((room) => (
              <div
                key={room.id}
                onClick={() => handleChatRoomClick(room.id)}
                className="bg-white rounded-lg shadow-md p-4 cursor-pointer hover:shadow-lg transition-shadow"
              >
                <div className="flex items-center justify-between mb-2">
                  <h3 className="font-semibold text-gray-800">{room.name}</h3>
                  <div className="flex items-center space-x-2">
                    {room.unreadCount > 0 && (
                      <span className="bg-red-500 text-white text-xs px-2 py-1 rounded-full">
                        {room.unreadCount}
                      </span>
                    )}
                    <span className="text-sm text-gray-500">{room.lastMessageTime}</span>
                  </div>
                </div>
                <p className="text-sm text-gray-600 mb-2 line-clamp-1">{room.lastMessage}</p>
                <div className="flex justify-between items-center">
                  <span className="text-xs text-gray-500">{room.participants}명 참여중</span>
                  <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </div>
              </div>
            ))}
          </div>
        </div>
      </main>
    </div>
  );
};

export default Chat;
