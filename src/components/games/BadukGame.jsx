import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';

const BadukGame = () => {
  const navigate = useNavigate();
  const [board, setBoard] = useState(Array(9).fill().map(() => Array(9).fill(null)));
  const [currentPlayer, setCurrentPlayer] = useState('black'); // 'black' or 'white'
  const [capturedBlack, setCapturedBlack] = useState(0);
  const [capturedWhite, setCapturedWhite] = useState(0);

  const handlePlaceStone = (row, col) => {
    if (board[row][col]) return; // 이미 돌이 있는 경우

    const newBoard = board.map(row => [...row]);
    newBoard[row][col] = currentPlayer;
    setBoard(newBoard);
    
    // 플레이어 변경
    setCurrentPlayer(currentPlayer === 'black' ? 'white' : 'black');
  };

  const handleReset = () => {
    setBoard(Array(9).fill().map(() => Array(9).fill(null)));
    setCurrentPlayer('black');
    setCapturedBlack(0);
    setCapturedWhite(0);
  };

  const handleBackToPlayground = () => {
    navigate('/playground');
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 py-8">
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
          <h1 className="text-2xl font-bold text-gray-900">⚫ 바둑게임</h1>
        </div>

        <div className="bg-white rounded-lg shadow-lg p-6">
          <div className="text-center mb-4">
            <p className="text-gray-600 mb-2">현재 차례:</p>
            <div className={`inline-block w-8 h-8 rounded-full ${currentPlayer === 'black' ? 'bg-black' : 'bg-white border-2 border-gray-300'}`}></div>
            <p className="text-sm font-semibold mt-1">
              {currentPlayer === 'black' ? '흑돌' : '백돌'}
            </p>
          </div>

          <div className="flex justify-center mb-4">
            <div className="grid grid-cols-9 gap-0 bg-yellow-200 p-4 rounded-lg">
              {board.map((row, rowIndex) =>
                row.map((cell, colIndex) => (
                  <div
                    key={`${rowIndex}-${colIndex}`}
                    className="w-10 h-10 border border-gray-400 flex items-center justify-center cursor-pointer bg-yellow-100 hover:bg-yellow-300 transition-colors"
                    onClick={() => handlePlaceStone(rowIndex, colIndex)}
                  >
                    {cell && (
                      <div className={`w-8 h-8 rounded-full ${cell === 'black' ? 'bg-black' : 'bg-white border-2 border-gray-300'}`}></div>
                    )}
                  </div>
                ))
              )}
            </div>
          </div>

          <div className="flex justify-between items-center mb-4">
            <div className="text-center">
              <p className="text-sm text-gray-600">흑돌 잡은 수</p>
              <p className="text-lg font-bold">{capturedBlack}</p>
            </div>
            <button
              onClick={handleReset}
              className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
            >
              게임 리셋
            </button>
            <div className="text-center">
              <p className="text-sm text-gray-600">백돌 잡은 수</p>
              <p className="text-lg font-bold">{capturedWhite}</p>
            </div>
          </div>

          <div className="text-center">
            <p className="text-sm text-gray-600">
              간단한 오목목게임입니다. 빈 칸을 클릭하여 돌을 놓을 수 있습니다.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default BadukGame;
