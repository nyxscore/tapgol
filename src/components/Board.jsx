import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { auth, db } from "../util/firebase";
import { onAuthStateChanged } from "firebase/auth";
import { collection, query, orderBy, limit, onSnapshot } from "firebase/firestore";
import { getComments } from "../util/commentService";
import UserProfileModal from './UserProfileModal';
import { navigateToDM } from '../util/dmUtils';

const Board = () => {
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState(null);
  const [error, setError] = useState(null);
  const [commentCounts, setCommentCounts] = useState({});
  const navigate = useNavigate();

  // 프로필 모달 관련 상태
  const [showProfileModal, setShowProfileModal] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);

  useEffect(() => {
    // 로그인 상태 확인
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
    });

    // 실시간 게시글 구독 (최적화된 쿼리)
    const q = query(
      collection(db, "posts"),
      orderBy("createdAt", "desc"),
      limit(20)
    );

    const unsubscribePosts = onSnapshot(q, 
      { includeMetadataChanges: true }, // 메타데이터 변경도 감지하여 삭제 즉시 반영
      (querySnapshot) => {
        const postsData = [];
        querySnapshot.forEach((doc) => {
          // 삭제된 문서는 제외
          if (doc.exists()) {
            postsData.push({
              id: doc.id,
              ...doc.data()
            });
          }
        });
        setPosts(postsData);
        
        // 댓글 수 계산
        const calculateAllCommentCounts = async () => {
          const counts = {};
          for (const post of postsData) {
            counts[post.id] = await calculateCommentCount(post.id);
          }
          setCommentCounts(counts);
        };
        
        calculateAllCommentCounts();
        setLoading(false);
      }, 
      (error) => {
        console.error("게시글 실시간 구독 오류:", error);
        // BloomFilter 오류는 무시 (기능에 영향 없음)
        if (error.name !== 'BloomFilterError') {
          setLoading(false);
        }
      }
    );

    return () => {
      unsubscribe();
      unsubscribePosts();
    };
  }, []);

  const handleWriteClick = () => {
    if (!user) {
      alert("글을 작성하려면 로그인이 필요합니다.");
      navigate("/login");
      return;
    }
    navigate("/board/write");
  };

  const handlePostClick = (postId) => {
    navigate(`/board/${postId}`);
  };

  const formatDate = (timestamp) => {
    if (!timestamp) return "";
    
    const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
    return date.toLocaleDateString('ko-KR', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit'
    });
  };

  const calculateCommentCount = async (postId) => {
    try {
      const comments = await getComments(postId);
      return comments.length;
    } catch (error) {
      console.error(`댓글 수 계산 오류 (${postId}):`, error);
      return 0;
    }
  };

  const isLikedByUser = (post) => {
    return user && post.likedBy && post.likedBy.includes(user.uid);
  };

  // 프로필 관련 함수들
  const handleShowProfile = (userId, userName) => {
    setSelectedUser({ id: userId, name: userName });
    setShowProfileModal(true);
  };

  const handleCloseProfileModal = () => {
    setShowProfileModal(false);
    setSelectedUser(null);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-amber-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">게시글을 불러오는 중...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="text-center">
          <div className="text-red-500 text-6xl mb-4">⚠️</div>
          <h3 className="text-xl font-semibold text-gray-700 mb-2">오류가 발생했습니다</h3>
          <p className="text-gray-500 mb-6">{error}</p>
          <button
            onClick={() => window.location.reload()}
            className="px-6 py-3 bg-amber-600 text-white rounded-lg hover:bg-amber-700 transition-colors"
          >
            다시 시도
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white pt-14 pb-20">
      <div className="max-w-md mx-auto">
        {/* 헤더 */}
        <div className="bg-white border-b border-gray-200 px-4 py-3 sticky top-14 z-10">
          <div className="flex items-center justify-between">
            <h1 className="text-lg font-semibold text-gray-800">정기모임</h1>
            <button
              onClick={handleWriteClick}
              className="px-3 py-1.5 rounded-lg transition-colors text-xs bg-amber-600 text-white hover:bg-amber-700"
            >
              {user ? "글쓰기" : "로그인"}
            </button>
          </div>
        </div>

        {/* 게시글 목록 */}
        {posts.length === 0 ? (
          <div className="bg-white p-8 text-center">
            <div className="text-6xl mb-4">📝</div>
            <h3 className="text-lg font-semibold text-gray-800 mb-2">아직 게시글이 없습니다</h3>
            <p className="text-gray-600 mb-4">첫 번째 모임 게시글을 작성해보세요!</p>
            {user && (
              <button
                onClick={handleWriteClick}
                className="bg-amber-600 text-white px-6 py-3 rounded-lg hover:bg-amber-700 transition-colors"
              >
                게시글 작성하기
              </button>
            )}
          </div>
        ) : (
          <div className="space-y-1">
            {posts.map((post) => (
              <div
                key={post.id}
                onClick={() => handlePostClick(post.id)}
                className="bg-white border-b border-gray-100 p-4 cursor-pointer hover:bg-gray-50 transition-colors"
              >
                {/* 작성자 정보 */}
                <div className="flex items-center space-x-3 mb-3">
                  <div className="w-8 h-8 bg-gradient-to-r from-blue-400 to-blue-600 rounded-full flex items-center justify-center">
                    <span className="text-white text-sm font-medium">
                      {(post.author || "익명").charAt(0)}
                    </span>
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center space-x-2">
                      <span 
                        className="font-medium text-gray-800 text-sm"
                        onClick={(e) => {
                          e.stopPropagation();
                          navigateToDM(post.authorId, user, navigate);
                        }}
                      >
                        {post.author || "익명"}
                      </span>
                      <span className="text-gray-400 text-xs">•</span>
                      <span className="text-gray-400 text-xs">{formatDate(post.createdAt)}</span>
                    </div>
                  </div>
                  <div className="flex items-center space-x-1">
                    <span className={`px-3 py-1.5 rounded-full text-xs font-bold ${
                      post.category === "정기모임" 
                        ? "bg-red-500 text-white shadow-md" 
                        : post.category === "벙개모임"
                        ? "bg-purple-500 text-white shadow-md"
                        : post.category === "이벤트"
                        ? "bg-green-100 text-green-800"
                        : post.category === "공지"
                        ? "bg-red-100 text-red-800"
                        : "bg-red-500 text-white shadow-md"
                    }`}>
                      {post.category === "정기모임" ? '🔥 정기모임' : 
                       post.category === "벙개모임" ? '🍻 벙개모임' :
                       post.category === "이벤트" ? '📅 이벤트' :
                       post.category === "공지" ? '📢 공지' :
                       '🔥 정기모임'}
                    </span>
                  </div>
                </div>

                {/* 게시글 내용 */}
                <div className="mb-3">
                  <h3 className="font-semibold text-gray-900 text-base mb-2 line-clamp-2 leading-tight">
                    {post.title}
                  </h3>
                  <p className="text-gray-600 text-sm line-clamp-3 leading-relaxed">
                    {post.content}
                  </p>
                </div>

                {/* 하단 통계 */}
                <div className="flex items-center justify-between text-gray-500 text-xs">
                  <div className="flex items-center space-x-4">
                    <span>{post.views || 0} 조회</span>
                    <span>{post.likes || 0} 좋아요</span>
                    <span>{commentCounts[post.id] || 0} 댓글</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* 사용자 프로필 모달 */}
      <UserProfileModal
        isOpen={showProfileModal}
        onClose={handleCloseProfileModal}
        userId={selectedUser?.id}
        userName={selectedUser?.name}
      />
    </div>
  );
};

export default Board;