import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';

const YutnoriGame = () => {
  const navigate = useNavigate();
  const [currentPlayer, setCurrentPlayer] = useState(1);
  const [yutResult, setYutResult] = useState(null);
  const [player1Position, setPlayer1Position] = useState(0);
  const [player2Position, setPlayer2Position] = useState(0);
  const [gameMessage, setGameMessage] = useState('');

  const yutResults = [
    { name: '도', icon: '┃', steps: 1, description: '하나 뒤집힘' },
    { name: '개', icon: '┣', steps: 2, description: '둘 뒤집힘' },
    { name: '걸', icon: '┫', steps: 3, description: '셋 뒤집힘' },
    { name: '윷', icon: '╋', steps: 4, description: '넷 뒤집힘' },
    { name: '모', icon: '┼', steps: 5, description: '다섯 뒤집힘' }
  ];

  const throwYut = () => {
    const random = Math.random();
    let result;
    
    if (random < 0.4) result = yutResults[0]; // 도
    else if (random < 0.7) result = yutResults[1]; // 개
    else if (random < 0.85) result = yutResults[2]; // 걸
    else if (random < 0.95) result = yutResults[3]; // 윷
    else result = yutResults[4]; // 모

    setYutResult(result);
    
         // 말 이동
     if (currentPlayer === 1) {
       const newPosition = Math.min(player1Position + result.steps, 28);
       setPlayer1Position(newPosition);
       if (newPosition === 28) {
         setGameMessage('플레이어 1이 승리했습니다!');
       }
     } else {
       const newPosition = Math.min(player2Position + result.steps, 28);
       setPlayer2Position(newPosition);
       if (newPosition === 28) {
         setGameMessage('플레이어 2가 승리했습니다!');
       }
     }

    // 윷이나 모가 나오면 한 번 더
    if (result.name !== '윷' && result.name !== '모') {
      setCurrentPlayer(currentPlayer === 1 ? 2 : 1);
    }
  };

  const handleBackToPlayground = () => {
    navigate('/playground');
  };

  const handleRestart = () => {
    setCurrentPlayer(1);
    setYutResult(null);
    setPlayer1Position(0);
    setPlayer2Position(0);
    setGameMessage('');
  };

  const renderBoard = () => {
    // 한국 윷놀이 판 모양 (29칸)
    const boardLayout = [
      [1, 2, 3, 4, 5, 6, 7, 8, 9, 10],
      [20, null, null, null, null, null, null, null, null, 11],
      [19, null, null, null, null, null, null, null, null, 12],
      [18, null, null, null, null, null, null, null, null, 13],
      [17, 16, 15, 14, 29, 28, 27, 26, 25, 24]
    ];

    const getPlayerAtPosition = (position) => {
      if (player1Position === position - 1) return 'player1';
      if (player2Position === position - 1) return 'player2';
      return null;
    };

    return (
      <div className="bg-yellow-200 p-6 rounded-lg">
        <div className="grid grid-cols-10 gap-1">
          {boardLayout.map((row, rowIndex) =>
            row.map((cell, colIndex) => {
              if (cell === null) {
                return (
                  <div
                    key={`${rowIndex}-${colIndex}`}
                    className="w-10 h-10 bg-transparent"
                  />
                );
              }

              const player = getPlayerAtPosition(cell);
              const isStart = cell === 1;
              const isEnd = cell === 29;
              const isCorner = [1, 10, 20, 29, 24, 14].includes(cell);

              return (
                <div
                  key={`${rowIndex}-${colIndex}`}
                  className={`w-10 h-10 border-2 border-gray-400 flex items-center justify-center text-xs font-bold rounded ${
                    player === 'player1'
                      ? 'bg-red-500 text-white border-red-600'
                      : player === 'player2'
                      ? 'bg-blue-500 text-white border-blue-600'
                      : isStart
                      ? 'bg-green-200 border-green-400'
                      : isEnd
                      ? 'bg-yellow-200 border-yellow-400'
                      : isCorner
                      ? 'bg-orange-100 border-orange-300'
                      : 'bg-white border-gray-300'
                  }`}
                >
                  {player ? (
                    <div className="w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold">
                      {player === 'player1' ? 'P1' : 'P2'}
                    </div>
                  ) : (
                    <span className={isStart || isEnd ? 'font-bold' : ''}>
                      {cell}
                    </span>
                  )}
                </div>
              );
            })
          )}
        </div>
        
        {/* 시작과 끝 표시 */}
        <div className="mt-4 text-center text-sm">
          <div className="flex justify-center gap-8">
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 bg-green-200 border-2 border-green-400 rounded"></div>
              <span>시작</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 bg-yellow-200 border-2 border-yellow-400 rounded"></div>
              <span>도착</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 bg-orange-100 border-2 border-orange-300 rounded"></div>
              <span>모서리</span>
            </div>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-yellow-50 py-8">
      <div className="max-w-4xl mx-auto px-4">
        <div className="flex items-center justify-between mb-6">
          <button
            onClick={handleBackToPlayground}
            className="flex items-center text-blue-600 hover:text-blue-800"
          >
            <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            놀이터로 돌아가기
          </button>
          <h1 className="text-2xl font-bold text-gray-900">🎲 윷놀이게임</h1>
        </div>

        <div className="bg-white rounded-lg shadow-lg p-6">
          <div className="text-center mb-6">
            <div className="flex justify-center items-center gap-8 mb-4">
              <div className="text-center">
                <div className="w-12 h-12 bg-red-500 rounded-full flex items-center justify-center text-white font-bold">
                  P1
                </div>
                <p className="text-sm mt-1">플레이어 1</p>
                <p className="text-xs text-gray-600">위치: {player1Position + 1}</p>
              </div>
              <div className="text-center">
                <div className="w-12 h-12 bg-blue-500 rounded-full flex items-center justify-center text-white font-bold">
                  P2
                </div>
                <p className="text-sm mt-1">플레이어 2</p>
                <p className="text-xs text-gray-600">위치: {player2Position + 1}</p>
              </div>
            </div>
            
            <div className="mb-4">
              <p className="text-lg font-semibold text-gray-900">
                현재 차례: 플레이어 {currentPlayer}
              </p>
                             {yutResult && (
                 <div className="mt-2 p-3 bg-yellow-100 rounded-lg">
                   <div className="text-center">
                     <p className="text-4xl font-bold text-yellow-800 mb-2">{yutResult.icon}</p>
                     <p className="text-xl font-bold text-yellow-800">{yutResult.name}</p>
                     <p className="text-sm text-yellow-700">{yutResult.description}</p>
                     <p className="text-sm text-yellow-700">{yutResult.steps}칸 이동</p>
                   </div>
                 </div>
               )}
              {gameMessage && (
                <p className="text-lg font-bold text-green-600 mt-2">{gameMessage}</p>
              )}
            </div>

            <div className="flex justify-center gap-4">
              <button
                onClick={throwYut}
                disabled={gameMessage !== ''}
                className="px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors disabled:bg-gray-400"
              >
                윷 던지기
              </button>
              <button
                onClick={handleRestart}
                className="px-6 py-3 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
              >
                새 게임
              </button>
            </div>
          </div>

          <div className="mb-6">
            <h3 className="text-lg font-semibold mb-2">게임판</h3>
            {renderBoard()}
          </div>

          <div className="bg-gray-100 p-4 rounded-lg">
            <h3 className="font-semibold mb-2">게임 설명</h3>
            <p className="text-sm text-gray-600 mb-2">
              윷을 던져서 나온 결과에 따라 말을 이동시킵니다.
            </p>
                         <div className="grid grid-cols-5 gap-2 text-xs">
               {yutResults.map((result, index) => (
                 <div key={index} className="bg-white p-2 rounded text-center">
                   <p className="text-2xl font-bold mb-1">{result.icon}</p>
                   <p className="font-bold">{result.name}</p>
                   <p>{result.description}</p>
                   <p>{result.steps}칸</p>
                 </div>
               ))}
             </div>
                         <p className="text-sm text-gray-600 mt-2">
               윷이나 모가 나오면 한 번 더 던질 수 있습니다. 29번 칸에 먼저 도달하는 플레이어가 승리합니다.
             </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default YutnoriGame;
