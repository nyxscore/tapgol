import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { auth, db } from "../util/firebase";
import { onAuthStateChanged } from "firebase/auth";
import { collection, query, orderBy, onSnapshot } from "firebase/firestore";
import { getHealthPosts, toggleLike, incrementViews } from "../util/healthService";
import { getComments } from "../util/commentService";
import UserProfileModal from './UserProfileModal';
import { navigateToDM } from '../util/dmUtils';

const HealthBoard = () => {
  const navigate = useNavigate();
  const [posts, setPosts] = useState([]);
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [commentCounts, setCommentCounts] = useState({});

  // 프로필 모달 관련 상태
  const [showProfileModal, setShowProfileModal] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
    });

    // 실시간 건강정보 게시글 구독
    const q = query(
      collection(db, "healthPosts"),
      orderBy("createdAt", "desc")
    );

    const unsubscribePosts = onSnapshot(q, 
      { includeMetadataChanges: true },
      (querySnapshot) => {
        const postsData = [];
        querySnapshot.forEach((doc) => {
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
        console.error("건강정보 게시글 실시간 구독 오류:", error);
        setError("게시글을 불러오는데 실패했습니다.");
        setLoading(false);
      }
    );

    return () => {
      unsubscribe();
      unsubscribePosts();
    };
  }, []);

  const handlePostClick = (postId) => {
    navigate(`/health/${postId}`);
  };

  const handleWriteClick = () => {
    if (!user) {
      alert('로그인이 필요합니다.');
      navigate('/login');
      return;
    }
    navigate('/health/write');
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

  if (loading) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-amber-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">건강정보를 불러오는 중...</p>
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
            <h1 className="text-lg font-semibold text-gray-800">건강정보</h1>
            <button
              onClick={handleWriteClick}
              className="px-3 py-1.5 bg-amber-600 text-white rounded-lg hover:bg-amber-700 transition-colors flex items-center justify-center space-x-1 text-xs"
              title="건강정보 글쓰기"
            >
              <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              <span>글쓰기</span>
            </button>
          </div>
        </div>

        {/* 게시글 목록 */}
        {posts.length === 0 ? (
          <div className="bg-white p-8 text-center">
            <div className="text-6xl mb-4">🏥</div>
            <h3 className="text-lg font-semibold text-gray-800 mb-2">아직 건강정보 게시글이 없습니다</h3>
            <p className="text-gray-600 mb-4">첫 번째 건강정보를 공유해보세요!</p>
            <button
              onClick={handleWriteClick}
              className="bg-amber-600 text-white px-6 py-3 rounded-lg hover:bg-amber-700 transition-colors"
            >
              건강정보 작성하기
            </button>
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

export default HealthBoard;