import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

const GostopGame = () => {
  const navigate = useNavigate();
  const [deck, setDeck] = useState([]);
  const [playerHand, setPlayerHand] = useState([]);
  const [tableCards, setTableCards] = useState([]);
  const [score, setScore] = useState(0);
  const [gameMessage, setGameMessage] = useState('');

  const months = ['1월', '2월', '3월', '4월', '5월', '6월', '7월', '8월', '9월', '10월', '11월', '12월'];
  const cardNames = {
    '1월': ['송학', '학', '학'],
    '2월': ['매화', '매화', '매화'],
    '3월': ['벚꽃', '벚꽃', '벚꽃'],
    '4월': ['등꽃', '등꽃', '등꽃'],
    '5월': ['창포', '창포', '창포'],
    '6월': ['모란', '모란', '모란'],
    '7월': ['홍단', '홍단', '홍단'],
    '8월': ['공산', '공산', '공산'],
    '9월': ['국화', '국화', '국화'],
    '10월': ['단풍', '단풍', '단풍'],
    '11월': ['오동', '오동', '오동'],
    '12월': ['비', '비', '비']
  };

  const initializeDeck = () => {
    const newDeck = [];
    months.forEach(month => {
      cardNames[month].forEach(cardName => {
        newDeck.push({ month, name: cardName, id: Math.random().toString(36).substr(2, 9) });
      });
    });
    return shuffleDeck(newDeck);
  };

  const shuffleDeck = (cards) => {
    const shuffled = [...cards];
    for (let i = shuffled.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
    return shuffled;
  };

  const dealCards = () => {
    const newDeck = initializeDeck();
    const playerCards = newDeck.slice(0, 10);
    const tableCards = newDeck.slice(10, 20);
    const remainingDeck = newDeck.slice(20);

    setPlayerHand(playerCards);
    setTableCards(tableCards);
    setDeck(remainingDeck);
    setScore(0);
    setGameMessage('');
  };

  const playCard = (cardIndex) => {
    const card = playerHand[cardIndex];
    const matchingCards = tableCards.filter(tableCard => tableCard.month === card.month);
    
    if (matchingCards.length > 0) {
      // 매칭되는 카드가 있으면 점수 획득
      const newScore = score + matchingCards.length * 10;
      setScore(newScore);
      
      // 매칭된 카드들 제거
      const newTableCards = tableCards.filter(tableCard => tableCard.month !== card.month);
      setTableCards(newTableCards);
      
      // 플레이어 카드 제거
      const newPlayerHand = playerHand.filter((_, index) => index !== cardIndex);
      setPlayerHand(newPlayerHand);
      
      setGameMessage(`${card.month} ${card.name} 매칭! +${matchingCards.length * 10}점`);
    } else {
      // 매칭되는 카드가 없으면 테이블에 추가
      const newTableCards = [...tableCards, card];
      setTableCards(newTableCards);
      
      // 플레이어 카드 제거
      const newPlayerHand = playerHand.filter((_, index) => index !== cardIndex);
      setPlayerHand(newPlayerHand);
      
      setGameMessage(`${card.month} ${card.name}을 테이블에 놓았습니다.`);
    }

    // 게임 종료 체크
    if (newPlayerHand.length === 0) {
      setGameMessage(`게임 종료! 최종 점수: ${newScore}점`);
    }
  };

  const handleBackToPlayground = () => {
    navigate('/playground');
  };

  useEffect(() => {
    dealCards();
  }, []);

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 to-pink-50 py-8">
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
          <h1 className="text-2xl font-bold text-gray-900">🃏 고스톱게임</h1>
        </div>

        <div className="bg-white rounded-lg shadow-lg p-6">
          <div className="text-center mb-6">
            <p className="text-xl font-semibold text-gray-900">점수: {score}</p>
            {gameMessage && (
              <p className="text-lg font-bold text-blue-600 mt-2">{gameMessage}</p>
            )}
            <button
              onClick={dealCards}
              className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors mt-2"
            >
              새 게임
            </button>
          </div>

          <div className="mb-6">
            <h3 className="text-lg font-semibold mb-2">테이블 카드</h3>
            <div className="grid grid-cols-10 gap-2 bg-green-100 p-4 rounded-lg">
              {tableCards.map((card, index) => (
                <div
                  key={index}
                  className="w-12 h-16 bg-white border border-gray-300 rounded flex flex-col items-center justify-center text-xs font-bold cursor-pointer hover:bg-gray-50"
                >
                  <div className="text-red-600">{card.month}</div>
                  <div className="text-gray-800">{card.name}</div>
                </div>
              ))}
            </div>
          </div>

          <div className="mb-6">
            <h3 className="text-lg font-semibold mb-2">내 카드 ({playerHand.length}장)</h3>
            <div className="grid grid-cols-10 gap-2 bg-blue-100 p-4 rounded-lg">
              {playerHand.map((card, index) => (
                <div
                  key={index}
                  className="w-12 h-16 bg-white border border-gray-300 rounded flex flex-col items-center justify-center text-xs font-bold cursor-pointer hover:bg-blue-50 transition-colors"
                  onClick={() => playCard(index)}
                >
                  <div className="text-red-600">{card.month}</div>
                  <div className="text-gray-800">{card.name}</div>
                </div>
              ))}
            </div>
          </div>

          <div className="bg-gray-100 p-4 rounded-lg">
            <h3 className="font-semibold mb-2">게임 설명</h3>
            <p className="text-sm text-gray-600 mb-2">
              같은 월의 카드를 매칭하여 점수를 얻는 게임입니다.
            </p>
            <ul className="text-sm text-gray-600 list-disc list-inside">
              <li>카드를 클릭하여 테이블에 놓습니다.</li>
              <li>같은 월의 카드가 테이블에 있으면 매칭되어 점수를 얻습니다.</li>
              <li>매칭된 카드 1장당 10점을 획득합니다.</li>
              <li>모든 카드를 사용하면 게임이 종료됩니다.</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};

export default GostopGame;
