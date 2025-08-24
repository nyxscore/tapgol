// src/components/Events.jsx
import React from "react";
import { useNavigate } from "react-router-dom";

const Events = () => {
  const navigate = useNavigate();

  const events = [
    {
      id: 1,
      title: "탑골공원 봄맞이 축제",
      date: "2024-03-15",
      time: "14:00",
      location: "탑골공원",
      description: "봄을 맞이하는 다양한 문화 공연과 체험 프로그램",
      image: "https://images.unsplash.com/photo-1492684223066-81342ee5ff30?w=400&h=300&fit=crop",
      participants: 45,
      maxParticipants: 100
    },
    {
      id: 2,
      title: "한강공원 달빛 콘서트",
      date: "2024-03-20",
      time: "19:30",
      location: "한강공원",
      description: "한강변에서 즐기는 아름다운 달빛과 함께하는 음악회",
      image: "https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?w=400&h=300&fit=crop",
      participants: 78,
      maxParticipants: 150
    },
    {
      id: 3,
      title: "북서울꿈의숲 가족 체험",
      date: "2024-03-25",
      time: "10:00",
      location: "북서울꿈의숲",
      description: "자연과 함께하는 가족 단위 체험 프로그램",
      image: "https://images.unsplash.com/photo-1517486808906-6ca8b3f04846?w=400&h=300&fit=crop",
      participants: 32,
      maxParticipants: 50
    }
  ];

  const handleEventClick = (eventId) => {
    navigate(`/events/${eventId}`);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-amber-50 via-orange-50 to-amber-100">
      <main className="pb-20 pt-16">
        <div className="max-w-4xl mx-auto px-4">
          <div className="mb-6">
            <h1 className="text-2xl font-bold text-gray-800 mb-2">이벤트</h1>
            <p className="text-gray-600">다양한 공원 이벤트에 참여해보세요</p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {events.map((event) => (
              <div
                key={event.id}
                onClick={() => handleEventClick(event.id)}
                className="bg-white rounded-lg shadow-md overflow-hidden cursor-pointer transform transition-transform hover:scale-105 hover:shadow-lg"
              >
                <div className="relative">
                  <img
                    src={event.image}
                    alt={event.title}
                    className="w-full h-48 object-cover"
                  />
                  <div className="absolute top-2 right-2 bg-orange-500 text-white text-xs px-2 py-1 rounded">
                    {event.date}
                  </div>
                </div>
                <div className="p-4">
                  <h3 className="font-semibold text-gray-800 mb-2">{event.title}</h3>
                  <p className="text-sm text-gray-600 mb-3 line-clamp-2">
                    {event.description}
                  </p>
                  <div className="flex justify-between text-sm text-gray-500">
                    <span>{event.location}</span>
                    <span>{event.participants}/{event.maxParticipants}명</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </main>
    </div>
  );
};

export default Events;
