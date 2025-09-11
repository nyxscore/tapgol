// src/components/Wisdom.jsx
import React, { useState, useEffect } from "react";
import { useAuth } from "../contexts/AuthContext";
import { FaQuoteLeft, FaQuoteRight, FaHeart, FaShare } from "react-icons/fa";
import { 
  getTodayWisdom, 
  incrementWisdomViews, 
  toggleWisdomLike 
} from "../util/wisdomService";
import CommentSection from "./CommentSection";

const Wisdom = () => {
  const { user } = useAuth();
  const [currentWisdom, setCurrentWisdom] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isLiked, setIsLiked] = useState(false);
  const [likeCount, setLikeCount] = useState(0);

  // 기본 지혜들 (Firestore에 데이터가 없을 때 사용)
  const defaultWisdoms = [
    {
      id: 'default-wisdom-1',
      text: "인생은 자전거를 타는 것과 같다. 균형을 잡으려면 계속 움직여야 한다.",
      author: "알베르트 아인슈타인",
      category: "인생",
      viewCount: 0,
      likeCount: 0,
      likedBy: []
    },
    {
      id: 'default-wisdom-2',
      text: "성공은 준비된 자에게 찾아오는 기회다.",
      author: "루이 파스퇴르",
      category: "성공",
      viewCount: 0,
      likeCount: 0,
      likedBy: []
    },
    {
      id: 'default-wisdom-3',
      text: "오늘 할 수 있는 일을 내일로 미루지 마라.",
      author: "벤저민 프랭클린",
      category: "시간",
      viewCount: 0,
      likeCount: 0,
      likedBy: []
    },
    {
      id: 'default-wisdom-4',
      text: "꿈을 이루고자 하는 용기만 있다면 모든 꿈을 이룰 수 있다.",
      author: "월트 디즈니",
      category: "꿈",
      viewCount: 0,
      likeCount: 0,
      likedBy: []
    },
    {
      id: 'default-wisdom-5',
      text: "실패는 성공으로 가는 과정이다.",
      author: "토마스 에디슨",
      category: "성공",
      viewCount: 0,
      likeCount: 0,
      likedBy: []
    }
  ];

  useEffect(() => {
    loadTodayWisdom();
  }, []);

  const loadTodayWisdom = async () => {
    setLoading(true);
    try {
      const wisdom = await getTodayWisdom();
      if (wisdom) {
        setCurrentWisdom(wisdom);
        setIsLiked(wisdom.likedBy?.includes(user?.uid) || false);
        setLikeCount(wisdom.likeCount || 0);
        
        // 조회수 증가
        if (user) {
          await incrementWisdomViews(wisdom.id);
        }
      } else {
        // Firestore에 데이터가 없으면 기본 지혜들 중에서 오늘 날짜에 맞는 지혜 선택
        const today = new Date();
        const dayOfYear = Math.floor((today - new Date(today.getFullYear(), 0, 0)) / (1000 * 60 * 60 * 24));
        const wisdomIndex = dayOfYear % defaultWisdoms.length;
        const selectedWisdom = defaultWisdoms[wisdomIndex];
        
        setCurrentWisdom(selectedWisdom);
        setIsLiked(false);
        setLikeCount(0);
      }
    } catch (error) {
      console.error("지혜 로드 오류:", error);
      // 오류 시 기본 지혜들 중에서 오늘 날짜에 맞는 지혜 선택
      const today = new Date();
      const dayOfYear = Math.floor((today - new Date(today.getFullYear(), 0, 0)) / (1000 * 60 * 60 * 24));
      const wisdomIndex = dayOfYear % defaultWisdoms.length;
      const selectedWisdom = defaultWisdoms[wisdomIndex];
      
      setCurrentWisdom(selectedWisdom);
      setIsLiked(false);
      setLikeCount(0);
    } finally {
      setLoading(false);
    }
  };


  const handleLike = async () => {
    if (!user) {
      alert("좋아요를 누르려면 로그인이 필요합니다.");
      return;
    }

    if (currentWisdom && !currentWisdom.id.startsWith('default-wisdom')) {
      try {
        const result = await toggleWisdomLike(currentWisdom.id, user.uid);
        setIsLiked(result.isLiked);
        setLikeCount(result.likeCount);
      } catch (error) {
        console.error("좋아요 처리 오류:", error);
        // 오류가 발생해도 로컬 상태로 처리
        setIsLiked(!isLiked);
        setLikeCount(prev => isLiked ? prev - 1 : prev + 1);
      }
    } else {
      // 기본 지혜의 경우 로컬 상태만 변경
      setIsLiked(!isLiked);
      setLikeCount(prev => isLiked ? prev - 1 : prev + 1);
    }
  };

  const handleShare = () => {
    if (currentWisdom) {
      const shareText = `"${currentWisdom.text}" - ${currentWisdom.author}`;
      if (navigator.share) {
        navigator.share({
          title: '오늘의 지혜',
          text: shareText,
        });
      } else {
        navigator.clipboard.writeText(shareText).then(() => {
          alert('지혜가 클립보드에 복사되었습니다!');
        });
      }
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-amber-50 to-orange-100 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-amber-600 mx-auto mb-4"></div>
          <p className="text-amber-700">지혜를 불러오는 중...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-amber-50 to-orange-100">
      <div className="container mx-auto px-4 py-8">
        {/* 헤더 */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-amber-800 mb-2">오늘의 지혜</h1>
          <p className="text-amber-600">매일 새로운 지혜로 하루를 시작하세요</p>
        </div>

        {/* 지혜 카드 */}
        <div className="max-w-2xl mx-auto">
          <div className="bg-white rounded-3xl shadow-2xl p-8 relative overflow-hidden">
            {/* 배경 장식 */}
            <div className="absolute top-0 right-0 w-32 h-32 bg-amber-100 rounded-full -translate-y-16 translate-x-16"></div>
            <div className="absolute bottom-0 left-0 w-24 h-24 bg-orange-100 rounded-full translate-y-12 -translate-x-12"></div>
            
            {/* 인용부호 */}
            <div className="relative z-10">
              <FaQuoteLeft className="text-4xl text-amber-300 mb-4" />
              
              {/* 지혜 텍스트 */}
              <blockquote className="text-xl text-gray-800 leading-relaxed mb-6 font-medium whitespace-pre-line">
                {currentWisdom?.text}
              </blockquote>
              
              <FaQuoteRight className="text-4xl text-amber-300 mb-4" />
              
              {/* 작가 정보 */}
              <div className="text-right">
                <p className="text-lg font-semibold text-amber-700">- {currentWisdom?.author}</p>
                <span className="inline-block bg-amber-100 text-amber-700 px-3 py-1 rounded-full text-sm font-medium mt-2">
                  {currentWisdom?.category}
                </span>
              </div>
            </div>
          </div>

          {/* 액션 버튼들 */}
          <div className="flex justify-center space-x-4 mt-8">
            <button
              onClick={handleLike}
              className={`flex items-center space-x-2 px-6 py-3 rounded-lg transition-all min-w-[120px] justify-center ${
                isLiked
                  ? "bg-red-500 text-white hover:bg-red-600"
                  : "bg-amber-100 text-amber-800 hover:bg-amber-200"
              }`}
            >
              <FaHeart className="w-4 h-4" />
              <span>{isLiked ? '좋아요 취소' : '좋아요'} ({likeCount})</span>
            </button>

            <button
              onClick={handleShare}
              className="flex items-center space-x-2 px-6 py-3 rounded-lg transition-all min-w-[120px] justify-center bg-blue-100 text-blue-800 hover:bg-blue-200"
            >
              <FaShare className="w-4 h-4" />
              <span>공유하기</span>
            </button>
          </div>

          {/* 추가 정보 */}
          <div className="text-center mt-8">
            <p className="text-amber-600 text-sm">
              💡 매일 새로운 지혜가 준비되어 있습니다
            </p>
            <p className="text-amber-500 text-xs mt-2">
              오늘은 {new Date().toLocaleDateString('ko-KR', { 
                year: 'numeric', 
                month: 'long', 
                day: 'numeric',
                weekday: 'long'
              })}입니다
            </p>
          </div>
        </div>

        {/* 댓글 섹션 */}
        {currentWisdom && (
          <div className="max-w-2xl mx-auto mt-12">
            <div className="bg-white rounded-3xl shadow-2xl p-8">
              <h3 className="text-xl font-bold text-amber-800 mb-6 text-center">
                💬 지혜에 대한 생각을 나눠보세요
              </h3>
              <CommentSection 
                postId={currentWisdom.id} 
                postType="wisdom" 
                boardType="wisdom" 
              />
            </div>
          </div>
        )}

        {/* 하단 인사말 */}
        <div className="text-center mt-12">
          <p className="text-amber-700 text-lg font-medium">
            지혜로운 하루 되세요! ✨
          </p>
        </div>
      </div>
    </div>
  );
};

export default Wisdom;
