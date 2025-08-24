// src/components/Playground.jsx
import React from "react";
import { useNavigate } from "react-router-dom";

const Playground = () => {
  const navigate = useNavigate();

  const games = [
    {
      id: 1,
      name: "오목",
      description: "오목 게임을 즐겨보세요",
      icon: "⚫",
      path: "/baduk-game",
      players: "2명",
      difficulty: "보통"
    },
    {
      id: 2,
      name: "장기",
      description: "한국의 전통 장기 게임",
      icon: "♟️",
      path: "/janggi-game",
      players: "2명",
      difficulty: "보통"
    },
    {
      id: 3,
      name: "고스톱",
      description: "카드 게임 고스톱을 즐겨보세요",
      icon: "🃏",
      path: "/gostop-game",
      players: "3-4명",
      difficulty: "쉬움"
    },
    {
      id: 4,
      name: "윷놀이",
      description: "전통 윷놀이 게임",
      icon: "🎲",
      path: "/yutnori-game",
      players: "2-4명",
      difficulty: "쉬움"
    },
    {
      id: 5,
      name: "테트리스",
      description: "클래식 테트리스 게임",
      icon: "🧩",
      path: "/tetris-game",
      players: "1명",
      difficulty: "보통"
    }
  ];

  const handleGameClick = (game) => {
    navigate(game.path);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-amber-50 via-orange-50 to-amber-100">
      <main className="pb-20 pt-16">
        <div className="max-w-4xl mx-auto px-4">
          <div className="mb-6">
            <h1 className="text-2xl font-bold text-gray-800 mb-2">놀이터</h1>
            <p className="text-gray-600">다양한 게임을 즐겨보세요</p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {games.map((game) => (
              <div
                key={game.id}
                onClick={() => handleGameClick(game)}
                className="bg-white rounded-lg shadow-md p-6 cursor-pointer hover:shadow-lg transition-shadow"
              >
                <div className="text-center mb-4">
                  <div className="text-4xl mb-2">{game.icon}</div>
                  <h3 className="text-lg font-semibold text-gray-800 mb-2">{game.name}</h3>
                  <p className="text-sm text-gray-600 mb-4">{game.description}</p>
                </div>
                <div className="flex justify-between text-sm text-gray-500">
                  <span>플레이어: {game.players}</span>
                  <span>난이도: {game.difficulty}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </main>
    </div>
  );
};

export default Playground;
