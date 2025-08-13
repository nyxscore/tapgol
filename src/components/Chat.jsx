import React, { useState, useRef, useEffect } from 'react';
import Header from './Header';
import BottomNavigation from './BottomNavigation';

const Chat = () => {
  const [messages, setMessages] = useState([
    {
      id: 1,
      author: '공원관리자',
      content: '안녕하세요! 공원톡에 오신 것을 환영합니다. 오늘도 좋은 하루 되세요!',
      timestamp: '09:00',
      isSystem: true
    },
    {
      id: 2,
      author: '김철수',
      content: '안녕하세요! 오늘 날씨가 정말 좋네요.',
      timestamp: '09:15',
      isMine: false
    },
    {
      id: 3,
      author: '이영희',
      content: '공원에서 산책하기 딱 좋은 날씨예요!',
      timestamp: '09:20',
      isMine: false
    },
    {
      id: 4,
      author: '나',
      content: '저도 공원에 가고 싶어요!',
      timestamp: '09:25',
      isMine: true
    },
    {
      id: 5,
      author: '박민수',
      content: '오늘 오후에 공원에서 축구하실 분 있나요?',
      timestamp: '10:30',
      isMine: false
    },
    {
      id: 6,
      author: '정수진',
      content: '저도 참여하고 싶어요! 몇 시에 만나요?',
      timestamp: '10:35',
      isMine: false
    },
    {
      id: 7,
      author: '나',
      content: '저도 축구하고 싶어요!',
      timestamp: '10:40',
      isMine: true
    }
  ]);

  const [newMessage, setNewMessage] = useState('');
  const messagesEndRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSendMessage = (e) => {
    e.preventDefault();
    if (newMessage.trim()) {
      const message = {
        id: messages.length + 1,
        author: '나',
        content: newMessage,
        timestamp: new Date().toLocaleTimeString('ko-KR', { 
          hour: '2-digit', 
          minute: '2-digit' 
        }),
        isMine: true
      };
      setMessages([...messages, message]);
      setNewMessage('');
      
      // 자동 응답 (시뮬레이션)
      setTimeout(() => {
        const responses = [
          '좋은 말씀이네요!',
          '그렇군요!',
          '흥미롭네요!',
          '저도 그렇게 생각해요!',
          '정말요?',
          '좋은 정보 감사합니다!'
        ];
        const randomResponse = responses[Math.floor(Math.random() * responses.length)];
        const randomUsers = ['김철수', '이영희', '박민수', '정수진', '최지영'];
        const randomUser = randomUsers[Math.floor(Math.random() * randomUsers.length)];
        
        const autoResponse = {
          id: messages.length + 2,
          author: randomUser,
          content: randomResponse,
          timestamp: new Date().toLocaleTimeString('ko-KR', { 
            hour: '2-digit', 
            minute: '2-digit' 
          }),
          isMine: false
        };
        setMessages(prev => [...prev, autoResponse]);
      }, 1000 + Math.random() * 2000);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-amber-50 via-orange-50 to-amber-100">
      <Header />
      <main className="pb-20 pt-16">
        <div className="max-w-4xl mx-auto px-4">
          {/* 채팅 헤더 */}
          <div className="bg-white rounded-lg shadow-md p-4 mb-4">
            <h1 className="text-xl font-bold text-gray-800 mb-2">공원톡</h1>
            <p className="text-sm text-gray-600">이웃들과 소통하는 공간입니다</p>
          </div>

          {/* 메시지 목록 */}
          <div className="bg-white rounded-lg shadow-md p-4 mb-4 h-96 overflow-y-auto">
            <div className="space-y-4">
              {messages.map((message) => (
                <div
                  key={message.id}
                  className={`flex ${message.isMine ? 'justify-end' : 'justify-start'}`}
                >
                  <div
                    className={`max-w-xs lg:max-w-md px-4 py-2 rounded-lg ${
                      message.isSystem
                        ? 'bg-gray-100 text-gray-600 text-center mx-auto'
                        : message.isMine
                        ? 'bg-orange-500 text-white'
                        : 'bg-gray-200 text-gray-800'
                    }`}
                  >
                    {!message.isSystem && !message.isMine && (
                      <div className="text-xs font-medium text-gray-600 mb-1">
                        {message.author}
                      </div>
                    )}
                    <div className="text-sm">{message.content}</div>
                    <div
                      className={`text-xs mt-1 ${
                        message.isMine ? 'text-orange-100' : 'text-gray-500'
                      }`}
                    >
                      {message.timestamp}
                    </div>
                  </div>
                </div>
              ))}
              <div ref={messagesEndRef} />
            </div>
          </div>

          {/* 메시지 입력 폼 */}
          <form onSubmit={handleSendMessage} className="bg-white rounded-lg shadow-md p-4">
            <div className="flex space-x-3">
              <input
                type="text"
                value={newMessage}
                onChange={(e) => setNewMessage(e.target.value)}
                placeholder="메시지를 입력하세요..."
                className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent"
              />
              <button
                type="submit"
                disabled={!newMessage.trim()}
                className="px-6 py-2 bg-orange-500 text-white rounded-lg hover:bg-orange-600 transition-colors focus:outline-none focus:ring-2 focus:ring-orange-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                전송
              </button>
            </div>
          </form>

          {/* 채팅 가이드 */}
          <div className="bg-white rounded-lg shadow-md p-4 mt-4">
            <h3 className="font-semibold text-gray-800 mb-2">💡 채팅 가이드</h3>
            <ul className="text-sm text-gray-600 space-y-1">
              <li>• 서로를 존중하는 마음으로 대화해주세요</li>
              <li>• 공원 관련 정보나 이웃 간 소통에 도움이 되는 내용을 공유해주세요</li>
              <li>• 개인정보나 불쾌한 내용은 삼가해주세요</li>
            </ul>
          </div>
        </div>
      </main>
      <BottomNavigation />
    </div>
  );
};

export default Chat;
