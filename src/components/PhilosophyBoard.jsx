import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { auth } from "../util/firebase";
import { onAuthStateChanged } from "firebase/auth";
import { getPhilosophyPosts, toggleLike, incrementViews } from "../util/philosophyService";
import UserProfileModal from './UserProfileModal';

const PhilosophyBoard = () => {
  const navigate = useNavigate();
  const [posts, setPosts] = useState([]);
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // 프로필 모달 관련 상태
  const [showProfileModal, setShowProfileModal] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);

  useEffect(() => {
    console.log("PhilosophyBoard 컴포넌트 마운트");
    
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      console.log("인증 상태 변경:", currentUser ? "로그인됨" : "로그아웃됨");
      setUser(currentUser);
      // 사용자 상태가 설정된 후 게시글 로드
      loadPhilosophyPosts();
    });

    return () => {
      console.log("PhilosophyBoard 컴포넌트 언마운트");
      unsubscribe();
    };
  }, []);

  const loadPhilosophyPosts = async () => {
    try {
      console.log("loadPhilosophyPosts 함수 시작");
      setLoading(true);
      setError(null);
      const postsData = await getPhilosophyPosts();
      console.log("로드된 개똥철학 게시글:", postsData);
      setPosts(postsData);
    } catch (error) {
      console.error("개똥철학 게시글 로드 오류:", error);
      setError("게시글을 불러오는데 실패했습니다.");
    } finally {
      setLoading(false);
    }
  };

  const handlePostClick = async (postId) => {
    try {
      // 조회수 증가 (로그인한 사용자만)
      if (user) {
        await incrementViews(postId);
      }
      navigate(`/philosophy/${postId}`);
    } catch (error) {
      console.error("조회수 증가 오류:", error);
      navigate(`/philosophy/${postId}`);
    }
  };

  const handleWriteClick = () => {
    if (!user) {
      alert("글을 작성하려면 로그인이 필요합니다.");
      navigate("/login");
      return;
    }
    navigate("/philosophy/write");
  };

  const handleLike = async (e, postId) => {
    e.stopPropagation(); // 이벤트 버블링 방지
    
    if (!user) {
      alert("좋아요를 누르려면 로그인이 필요합니다.");
      navigate("/login");
      return;
    }

    try {
      const isLiked = await toggleLike(postId, user.uid);
      
      // 로컬 상태 업데이트
      setPosts(prev => prev.map(post => {
        if (post.id === postId) {
          return {
            ...post,
            likes: isLiked ? (post.likes || 0) + 1 : (post.likes || 0) - 1,
            likedBy: isLiked 
              ? [...(post.likedBy || []), user.uid]
              : (post.likedBy || []).filter(uid => uid !== user.uid)
          };
        }
        return post;
      }));
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

  console.log("PhilosophyBoard 렌더링 - 상태:", { loading, error, postsCount: posts.length, user: !!user });

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-amber-50 via-orange-50 to-amber-100">
        <main className="pb-20 pt-16">
          <div className="max-w-4xl mx-auto px-4">
            <div className="text-center py-12">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-amber-700 mx-auto mb-4"></div>
              <p className="text-amber-700">개똥철학을 불러오는 중...</p>
            </div>
          </div>
        </main>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-amber-50 via-orange-50 to-amber-100">
        <main className="pb-20 pt-16">
          <div className="max-w-4xl mx-auto px-4">
            <div className="text-center py-12">
              <p className="text-red-600 text-lg mb-4">{error}</p>
              <button
                onClick={loadPhilosophyPosts}
                className="px-4 py-2 bg-amber-600 text-white rounded-lg hover:bg-amber-700 transition-colors"
              >
                다시 시도
              </button>
            </div>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-amber-50 via-orange-50 to-amber-100">
      <main className="pb-20 pt-16">
        <div className="max-w-4xl mx-auto px-4">
          <div className="mb-6">
            <div className="flex items-center justify-between mb-2">
              <h1 className="text-2xl font-bold text-gray-800">개똥철학</h1>
              <button
                onClick={handleWriteClick}
                className="bg-amber-600 text-white px-4 py-2 rounded-lg hover:bg-amber-700 transition-colors flex items-center space-x-2"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
                <span>글쓰기</span>
              </button>
            </div>
            <p className="text-gray-600">책에는 없는 나만의 철학을 공유해요</p>
          </div>

          {posts.length === 0 ? (
            <div className="text-center py-12">
              <div className="text-gray-400 text-6xl mb-4">📚</div>
              <p className="text-gray-600 text-lg mb-2">아직 개똥철학 게시글이 없습니다</p>
              <p className="text-gray-500 mb-6">첫 번째 개똥철학 이야기를 시작해보세요!</p>
              <button
                onClick={handleWriteClick}
                className="bg-amber-600 text-white px-6 py-3 rounded-lg hover:bg-amber-700 transition-colors"
              >
                개똥철학 작성하기
              </button>
            </div>
          ) : (
            <div className="space-y-4">
              {posts.map((post) => (
                <div
                  key={post.id}
                  onClick={() => handlePostClick(post.id)}
                  className="bg-white rounded-lg shadow-md p-6 cursor-pointer hover:shadow-lg transition-shadow"
                >
                  <div className="mb-4">
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-sm">
                      <div className="flex flex-col">
                        <span className="text-gray-500 text-xs mb-1">작성자</span>
                        <span 
                          className="font-medium text-gray-800 hover:text-amber-600 cursor-pointer transition-colors"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleShowProfile(post.authorId, post.author);
                          }}
                          title="프로필 보기"
                        >
                          {post.author}
                        </span>
                      </div>
                      <div className="flex flex-col">
                        <span className="text-gray-500 text-xs mb-1">작성일</span>
                        <span className="text-gray-600">{formatDate(post.createdAt)}</span>
                      </div>
                      <div className="flex flex-col">
                        <span className="text-gray-500 text-xs mb-1">조회수</span>
                        <div className="flex items-center space-x-1">
                          <svg className="w-4 h-4 text-gray-400" fill="currentColor" viewBox="0 0 20 20">
                            <path d="M10 12a2 2 0 100-4 2 2 0 000 4z" />
                            <path fillRule="evenodd" d="M.458 10C1.732 5.943 5.522 3 10 3s8.268 2.943 9.542 7c-1.274 4.057-5.064 7-9.542 7S1.732 14.057.458 10zM14 10a4 4 0 11-8 0 4 4 0 018 0z" clipRule="evenodd" />
                          </svg>
                          <span className="text-gray-600">{post.views || 0}</span>
                        </div>
                      </div>
                      <div className="flex flex-col">
                        <span className="text-gray-500 text-xs mb-1">좋아요</span>
                        <div className="flex items-center space-x-1">
                          <svg className="w-4 h-4 text-gray-400" fill="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                          </svg>
                          <span className="text-gray-600">{post.likes || 0}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                  
                  <h2 className="text-xl font-semibold text-gray-900 mb-2 line-clamp-2">
                    {post.title}
                  </h2>
                  
                  <p className="text-gray-700 mb-4 line-clamp-3">
                    {post.content}
                  </p>
                  
                  <div className="flex items-center justify-end">
                    <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </main>

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

export default PhilosophyBoard;
