import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

const TetrisGame = () => {
  const navigate = useNavigate();
  const [board, setBoard] = useState(Array(20).fill().map(() => Array(10).fill(0)));
  const [currentPiece, setCurrentPiece] = useState(null);
  const [score, setScore] = useState(0);
  const [gameOver, setGameOver] = useState(false);

  const pieces = [
    // I 블록 (4가지 회전)
    [
      [[1, 1, 1, 1]],
      [[1], [1], [1], [1]]
    ],
    // O 블록 (1가지 회전)
    [
      [[1, 1], [1, 1]]
    ],
    // T 블록 (4가지 회전)
    [
      [[1, 1, 1], [0, 1, 0]],
      [[0, 1, 0], [1, 1, 0], [0, 1, 0]],
      [[0, 1, 0], [1, 1, 1]],
      [[0, 1, 0], [0, 1, 1], [0, 1, 0]]
    ],
    // L 블록 (4가지 회전)
    [
      [[1, 1, 1], [1, 0, 0]],
      [[1, 1], [0, 1], [0, 1]],
      [[0, 0, 1], [1, 1, 1]],
      [[1, 0], [1, 0], [1, 1]]
    ],
    // J 블록 (4가지 회전)
    [
      [[1, 1, 1], [0, 0, 1]],
      [[0, 1], [0, 1], [1, 1]],
      [[1, 0, 0], [1, 1, 1]],
      [[1, 1], [1, 0], [1, 0]]
    ],
    // S 블록 (4가지 회전)
    [
      [[1, 1, 0], [0, 1, 1]],
      [[0, 1], [1, 1], [1, 0]],
      [[0, 1, 1], [1, 1, 0]],
      [[1, 0], [1, 1], [0, 1]]
    ],
    // Z 블록 (4가지 회전)
    [
      [[0, 1, 1], [1, 1, 0]],
      [[1, 0], [1, 1], [0, 1]],
      [[1, 1, 0], [0, 1, 1]],
      [[0, 1], [1, 1], [1, 0]]
    ]
  ];

  const colors = ['bg-cyan-500', 'bg-yellow-500', 'bg-purple-500', 'bg-orange-500', 'bg-blue-500', 'bg-green-500', 'bg-red-500'];

  const createNewPiece = () => {
    const pieceIndex = Math.floor(Math.random() * pieces.length);
    const rotationIndex = Math.floor(Math.random() * pieces[pieceIndex].length);
    return {
      shape: pieces[pieceIndex][rotationIndex],
      rotations: pieces[pieceIndex],
      currentRotation: rotationIndex,
      color: colors[pieceIndex],
      x: 3,
      y: 0
    };
  };

  const isValidMove = (piece, newX, newY) => {
    for (let row = 0; row < piece.shape.length; row++) {
      for (let col = 0; col < piece.shape[row].length; col++) {
        if (piece.shape[row][col]) {
          const boardX = newX + col;
          const boardY = newY + row;
          
          if (boardX < 0 || boardX >= 10 || boardY >= 20) return false;
          if (boardY >= 0 && board[boardY][boardX]) return false;
        }
      }
    }
    return true;
  };

  const placePiece = (piece) => {
    const newBoard = board.map(row => [...row]);
    for (let row = 0; row < piece.shape.length; row++) {
      for (let col = 0; col < piece.shape[row].length; col++) {
        if (piece.shape[row][col]) {
          const boardX = piece.x + col;
          const boardY = piece.y + row;
          if (boardY >= 0) {
            newBoard[boardY][boardX] = piece.color;
          }
        }
      }
    }
    
    // 완성된 줄을 즉시 제거
    const linesToRemove = [];
    for (let row = 0; row < newBoard.length; row++) {
      if (newBoard[row].every(cell => cell !== 0)) {
        linesToRemove.push(row);
      }
    }
    
    if (linesToRemove.length > 0) {
      // 완성된 줄 제거
      const filteredBoard = newBoard.filter((_, index) => !linesToRemove.includes(index));
      // 제거된 줄 수만큼 빈 줄 추가
      const emptyRows = Array(linesToRemove.length).fill().map(() => Array(10).fill(0));
      const finalBoard = [...emptyRows, ...filteredBoard];
      setBoard(finalBoard);
      // 점수 추가
      setScore(score + linesToRemove.length * 100);
    } else {
      setBoard(newBoard);
    }
  };

  // clearLines 함수는 더 이상 사용하지 않으므로 제거

  const moveDown = () => {
    if (!currentPiece) return;
    
         if (isValidMove(currentPiece, currentPiece.x, currentPiece.y + 1)) {
       setCurrentPiece({ ...currentPiece, y: currentPiece.y + 1 });
     } else {
       placePiece(currentPiece);
       const newPiece = createNewPiece();
       if (isValidMove(newPiece, newPiece.x, newPiece.y)) {
         setCurrentPiece(newPiece);
       } else {
         setGameOver(true);
       }
     }
  };

  const moveLeft = () => {
    if (currentPiece && isValidMove(currentPiece, currentPiece.x - 1, currentPiece.y)) {
      setCurrentPiece({ ...currentPiece, x: currentPiece.x - 1 });
    }
  };

  const moveRight = () => {
    if (currentPiece && isValidMove(currentPiece, currentPiece.x + 1, currentPiece.y)) {
      setCurrentPiece({ ...currentPiece, x: currentPiece.x + 1 });
    }
  };

  const rotatePiece = () => {
    if (!currentPiece) return;
    
    const nextRotation = (currentPiece.currentRotation + 1) % currentPiece.rotations.length;
    const rotatedShape = currentPiece.rotations[nextRotation];
    
    // 회전된 모양이 유효한지 확인
    if (isValidMove({ ...currentPiece, shape: rotatedShape }, currentPiece.x, currentPiece.y)) {
      setCurrentPiece({
        ...currentPiece,
        shape: rotatedShape,
        currentRotation: nextRotation
      });
    }
  };

  const handleKeyPress = (e) => {
    if (gameOver) return;
    
    switch (e.key) {
      case 'ArrowLeft':
        moveLeft();
        break;
      case 'ArrowRight':
        moveRight();
        break;
      case 'ArrowDown':
        moveDown();
        break;
      case ' ':
        e.preventDefault();
        rotatePiece();
        break;
      default:
        break;
    }
  };

  const handleBackToPlayground = () => {
    navigate('/playground');
  };

  const handleRestart = () => {
    setBoard(Array(20).fill().map(() => Array(10).fill(0)));
    setCurrentPiece(createNewPiece());
    setScore(0);
    setGameOver(false);
  };

  useEffect(() => {
    if (!currentPiece && !gameOver) {
      setCurrentPiece(createNewPiece());
    }
  }, [currentPiece, gameOver]);

  useEffect(() => {
    const interval = setInterval(() => {
      if (!gameOver) {
        moveDown();
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [currentPiece, gameOver]);

  useEffect(() => {
    window.addEventListener('keydown', handleKeyPress);
    return () => window.removeEventListener('keydown', handleKeyPress);
  }, [currentPiece, gameOver]);

  const renderBoard = () => {
    const displayBoard = board.map(row => [...row]);
    
    if (currentPiece) {
      for (let row = 0; row < currentPiece.shape.length; row++) {
        for (let col = 0; col < currentPiece.shape[row].length; col++) {
          if (currentPiece.shape[row][col]) {
            const boardX = currentPiece.x + col;
            const boardY = currentPiece.y + row;
            if (boardY >= 0 && boardY < 20 && boardX >= 0 && boardX < 10) {
              displayBoard[boardY][boardX] = currentPiece.color;
            }
          }
        }
      }
    }

    return displayBoard;
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-purple-50 py-8">
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
          <h1 className="text-2xl font-bold text-gray-900">🟦 테트리스게임</h1>
        </div>

        <div className="bg-white rounded-lg shadow-lg p-6">
          <div className="flex justify-center gap-8">
            <div>
              <div className="text-center mb-4">
                <p className="text-lg font-semibold text-gray-900">점수: {score}</p>
                {gameOver && (
                  <p className="text-red-600 font-bold">게임 오버!</p>
                )}
              </div>

              <div className="grid grid-cols-10 gap-0 bg-gray-800 p-4 rounded-lg">
                {renderBoard().map((row, rowIndex) =>
                  row.map((cell, colIndex) => (
                    <div
                      key={`${rowIndex}-${colIndex}`}
                      className={`w-6 h-6 border border-gray-600 ${
                        cell ? cell : 'bg-gray-900'
                      }`}
                    ></div>
                  ))
                )}
              </div>

                             <div className="mt-4 text-center">
                 <p className="text-sm text-gray-600 mb-2">조작법:</p>
                 <p className="text-xs text-gray-500">
                   ← → : 좌우 이동, ↓ : 빠른 하강, 스페이스바 : 블록 회전
                 </p>
               </div>
            </div>

            <div className="flex flex-col justify-center">
              <button
                onClick={handleRestart}
                className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors mb-4"
              >
                새 게임
              </button>
              
              <div className="bg-gray-100 p-4 rounded-lg">
                <h3 className="font-semibold mb-2">게임 설명</h3>
                <p className="text-sm text-gray-600">
                  블록을 조작하여 가로줄을 완성하세요.<br/>
                  완성된 줄은 사라지고 점수를 얻습니다.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TetrisGame;
