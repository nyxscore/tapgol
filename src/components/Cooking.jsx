import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { auth, db } from "../util/firebase";
import { onAuthStateChanged } from "firebase/auth";
// import { collection, query, orderBy, onSnapshot } from "firebase/firestore";
import { getAllCookingPosts, toggleLike, incrementViews } from "../util/cookingService";
import { getComments } from "../util/commentService";
import { FaSearch, FaPlus } from "react-icons/fa";
import UserProfileModal from './UserProfileModal';
import { navigateToDM } from '../util/dmUtils';

const Cooking = () => {
  const navigate = useNavigate();
  const [posts, setPosts] = useState([]);
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [commentCounts, setCommentCounts] = useState({});

  // 프로필 모달 관련 상태
  const [showProfileModal, setShowProfileModal] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
    });

    // 요리 게시글 로드
    const loadCookingPosts = async () => {
      try {
        setLoading(true);
        const postsData = await getAllCookingPosts();
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
        setError(null);
      } catch (error) {
        console.error("요리 게시글 로드 오류:", error);
        setError("게시글을 불러오는데 실패했습니다.");
      } finally {
        setLoading(false);
      }
    };

    loadCookingPosts();

    return () => {
      unsubscribe();
    };
  }, []);

  const handlePostClick = (postId) => {
    navigate(`/cooking/${postId}`);
  };

  const handleWriteClick = () => {
    if (!user) {
      alert('로그인이 필요합니다.');
      navigate('/login');
      return;
    }
    navigate('/cooking/write');
  };

  const handleLike = async (postId, e) => {
    e.stopPropagation();
    if (!user) {
      alert('로그인이 필요합니다.');
      navigate('/login');
      return;
    }

    try {
      const isLiked = await toggleLike(postId, user.uid);
      setPosts(posts.map(post => 
        post.id === postId 
          ? {
              ...post,
              likes: isLiked ? (post.likes || 0) + 1 : Math.max(0, (post.likes || 0) - 1),
              likedBy: isLiked 
                ? [...(post.likedBy || []), user.uid]
                : (post.likedBy || []).filter(uid => uid !== user.uid)
            }
          : post
      ));
    } catch (error) {
      console.error("좋아요 처리 오류:", error);
      alert("좋아요 처리에 실패했습니다.");
    }
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
    return user && post.likedBy?.includes(user.uid);
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

  // 검색 필터링
  const filteredPosts = posts.filter(post => {
    if (!searchTerm) return true;
    const searchLower = searchTerm.toLowerCase();
    return (
      post.title?.toLowerCase().includes(searchLower) ||
      post.content?.toLowerCase().includes(searchLower) ||
      post.author?.toLowerCase().includes(searchLower)
    );
  });

  if (loading) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-amber-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">요리 게시글을 불러오는 중...</p>
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
            <h1 className="text-lg font-semibold text-gray-800">나만의요리</h1>
            <button
              onClick={handleWriteClick}
              className="px-3 py-1.5 bg-amber-600 text-white rounded-lg hover:bg-amber-700 transition-colors flex items-center justify-center space-x-1 text-xs"
              title="요리글쓰기"
            >
              <FaPlus className="text-xs" />
              <span>글쓰기</span>
            </button>
          </div>
        </div>

        {/* 검색 바 */}
        <div className="bg-white border-b border-gray-100 px-4 py-3">
          <div className="relative">
            <FaSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 text-sm" />
            <input
              type="text"
              placeholder="요리 제목, 내용, 작성자로 검색..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent text-sm"
            />
          </div>
        </div>

        {/* 게시글 목록 */}
        {filteredPosts.length === 0 ? (
          <div className="bg-white p-8 text-center">
            <div className="text-6xl mb-4">👨‍🍳</div>
            <h3 className="text-lg font-semibold text-gray-800 mb-2">
              {searchTerm ? '검색 결과가 없습니다.' : '아직 요리 게시글이 없습니다.'}
            </h3>
            <p className="text-gray-600 mb-4">
              {searchTerm ? '다른 검색어를 시도해보세요.' : '첫 번째 요리 레시피를 공유해보세요!'}
            </p>
            {!searchTerm && (
              <button
                onClick={handleWriteClick}
                className="bg-amber-600 text-white px-6 py-3 rounded-lg hover:bg-amber-700 transition-colors"
              >
                요리 레시피 작성하기
              </button>
            )}
          </div>
        ) : (
          <div className="space-y-1">
            {filteredPosts.map((post) => (
              <div
                key={post.id}
                onClick={() => handlePostClick(post.id)}
                className="bg-white border-b border-gray-100 p-4 cursor-pointer hover:bg-gray-50 transition-colors"
              >
                {/* 작성자 정보 */}
                <div className="flex items-center space-x-3 mb-3">
                  <div className="w-8 h-8 bg-gradient-to-r from-amber-400 to-orange-500 rounded-full flex items-center justify-center">
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

export default Cooking;