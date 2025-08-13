import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';

const JanggiGame = () => {
  const navigate = useNavigate();
  const [selectedPiece, setSelectedPiece] = useState(null);
  const [board, setBoard] = useState([
    ['車', '馬', '象', '士', '將', '士', '象', '馬', '車'],
    ['', '', '', '', '', '', '', '', ''],
    ['', '包', '', '', '', '', '', '包', ''],
    ['卒', '', '卒', '', '卒', '', '卒', '', '卒'],
    ['', '', '', '', '', '', '', '', ''],
    ['', '', '', '', '', '', '', '', ''],
    ['卒', '', '卒', '', '卒', '', '卒', '', '卒'],
    ['', '包', '', '', '', '', '', '包', ''],
    ['', '', '', '', '', '', '', '', ''],
    ['車', '馬', '象', '士', '將', '士', '象', '馬', '車']
  ]);

  const handlePieceClick = (row, col) => {
    if (selectedPiece) {
      // 말 이동
      const newBoard = [...board];
      newBoard[row][col] = selectedPiece.piece;
      newBoard[selectedPiece.row][selectedPiece.col] = '';
      setBoard(newBoard);
      setSelectedPiece(null);
    } else if (board[row][col]) {
      // 말 선택
      setSelectedPiece({ row, col, piece: board[row][col] });
    }
  };

  const handleBackToPlayground = () => {
    navigate('/playground');
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-red-50 to-orange-50 py-8">
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
          <h1 className="text-2xl font-bold text-gray-900">♟️ 장기게임</h1>
        </div>

        <div className="bg-white rounded-lg shadow-lg p-6">
          <div className="text-center mb-4">
            <p className="text-gray-600 mb-2">
              {selectedPiece ? '이동할 위치를 클릭하세요' : '이동할 말을 클릭하세요'}
            </p>
            {selectedPiece && (
              <p className="text-blue-600 font-semibold">
                선택된 말: {selectedPiece.piece}
              </p>
            )}
          </div>

          <div className="flex justify-center">
            <div className="grid grid-cols-9 gap-1 bg-yellow-200 p-4 rounded-lg">
              {board.map((row, rowIndex) =>
                row.map((piece, colIndex) => (
                  <div
                    key={`${rowIndex}-${colIndex}`}
                    className={`w-12 h-12 border border-gray-300 flex items-center justify-center cursor-pointer transition-colors ${
                      selectedPiece && selectedPiece.row === rowIndex && selectedPiece.col === colIndex
                        ? 'bg-blue-200 border-blue-500'
                        : piece
                        ? 'bg-red-100 hover:bg-red-200'
                        : 'bg-white hover:bg-gray-100'
                    }`}
                    onClick={() => handlePieceClick(rowIndex, colIndex)}
                  >
                                         <span className="text-lg font-bold text-gray-800">
                       {piece}
                     </span>
                  </div>
                ))
              )}
            </div>
          </div>

                     <div className="mt-6 text-center">
             <p className="text-sm text-gray-600 mb-2">
               간단한 장기게임입니다. 말을 클릭하여 이동시킬 수 있습니다.
             </p>
                           <div className="text-xs text-gray-500">
                <p>將: 장(왕), 士: 사, 象: 상, 馬: 마, 車: 차, 包: 포, 卒: 졸</p>
              </div>
           </div>
        </div>
      </div>
    </div>
  );
};

export default JanggiGame;
