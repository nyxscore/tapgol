import React from 'react';
import { useNavigate } from 'react-router-dom';

const Playground = () => {
  const navigate = useNavigate();

  const games = [
    {
      id: 1,
      name: '장기게임',
      description: '전통적인 한국 장기 게임',
      icon: '♟️',
      path: '/playground/janggi',
      color: 'bg-red-500'
    },
    {
      id: 2,
      name: '바둑게임',
      description: '흑백 돌을 이용한 전략 게임',
      icon: '⚫',
      path: '/playground/baduk',
      color: 'bg-gray-800'
    },
    {
      id: 3,
      name: '테트리스게임',
      description: '블록을 맞춰 라인을 완성하는 게임',
      icon: '🟦',
      path: '/playground/tetris',
      color: 'bg-blue-500'
    },
    {
      id: 4,
      name: '윷놀이게임',
      description: '전통적인 윷놀이 게임',
      icon: '🎲',
      path: '/playground/yutnori',
      color: 'bg-green-500'
    },
    {
      id: 5,
      name: '고스톱게임',
      description: '카드 매칭 게임',
      icon: '🃏',
      path: '/playground/gostop',
      color: 'bg-purple-500'
    }
  ];

  const handleGameClick = (game) => {
    navigate(game.path);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50 py-8">
      <div className="max-w-4xl mx-auto px-4">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">🎮 놀이터</h1>
          <p className="text-gray-600">재미있는 미니게임들을 즐겨보세요!</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {games.map((game) => (
            <div
              key={game.id}
              className="bg-white rounded-xl shadow-lg p-6 cursor-pointer hover:shadow-xl transition-all duration-300 transform hover:scale-105"
              onClick={() => handleGameClick(game)}
            >
              <div className="text-center">
                <div className={`w-16 h-16 ${game.color} rounded-full flex items-center justify-center mx-auto mb-4 text-white text-2xl`}>
                  {game.icon}
                </div>
                <h3 className="text-xl font-semibold text-gray-900 mb-2">{game.name}</h3>
                <p className="text-gray-600 text-sm">{game.description}</p>
                <div className="mt-4">
                  <button className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors">
                    게임 시작
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default Playground;
