import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { auth, db } from "../util/firebase";
import { onAuthStateChanged } from "firebase/auth";
import { getPhilosophyPost, deletePhilosophyPost, toggleLike, incrementViews } from "../util/philosophyService";
import { markNotificationsByPostIdAsRead } from "../util/notificationService";
import { formatTextWithLinks } from "../util/textUtils.jsx";
import CommentSection from "./CommentSection";
import UserProfileModal from "./UserProfileModal";

const PhilosophyDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [post, setPost] = useState(null);
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [liking, setLiking] = useState(false);

  // 프로필 모달 관련 상태
  const [showProfileModal, setShowProfileModal] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      if (currentUser) {
        loadPost();
      } else {
        loadPost();
      }
    });

    return () => unsubscribe();
  }, [id]);

  const loadPost = async () => {
    try {
      setLoading(true);
      setError(null);
      const postData = await getPhilosophyPost(id);
      setPost(postData);
      
      // 로그인한 사용자라면 조회수 증가
      if (user) {
        await incrementViews(id);
        // 알림 읽음 처리
        await markNotificationsByPostIdAsRead(id);
      }
    } catch (error) {
      console.error("게시글 로드 오류:", error);
      setError("게시글을 불러오는데 실패했습니다.");
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!window.confirm("정말로 이 글을 삭제하시겠습니까?")) {
      return;
    }

    try {
      await deletePhilosophyPost(id);
      alert("게시글이 삭제되었습니다.");
      navigate("/philosophy");
    } catch (error) {
      console.error("삭제 오류:", error);
      alert("삭제에 실패했습니다.");
    }
  };

  const handleEdit = () => {
    navigate(`/philosophy/edit/${id}`);
  };

  const handleLike = async () => {
    if (!user) {
      alert("좋아요를 누르려면 로그인이 필요합니다.");
      navigate("/login");
      return;
    }

    if (liking) return;

    try {
      setLiking(true);
      const isLiked = await toggleLike(id, user.uid);
      
      // 로컬 상태 업데이트
      setPost(prev => ({
        ...prev,
        likes: isLiked ? (prev.likes || 0) + 1 : (prev.likes || 0) - 1,
        likedBy: isLiked 
          ? [...(prev.likedBy || []), user.uid]
          : (prev.likedBy || []).filter(uid => uid !== user.uid)
      }));
    } catch (error) {
      console.error("좋아요 처리 오류:", error);
      alert("좋아요 처리에 실패했습니다.");
    } finally {
      setLiking(false);
    }
  };

  const formatDate = (timestamp) => {
    if (!timestamp) return "";
    
    const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
    return date.toLocaleDateString('ko-KR', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const isLikedByUser = () => {
    return user && post?.likedBy?.includes(user.uid);
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

  if (error || !post) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-amber-50 via-orange-50 to-amber-100">
        <main className="pb-20 pt-16">
          <div className="max-w-4xl mx-auto px-4">
            <div className="text-center py-12">
              <p className="text-red-600 text-lg mb-4">{error || "게시글을 찾을 수 없습니다."}</p>
              <button
                onClick={() => navigate("/philosophy")}
                className="px-4 py-2 bg-amber-600 text-white rounded-lg hover:bg-amber-700 transition-colors"
              >
                개똥철학으로 돌아가기
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
          {/* 헤더 */}
          <div className="bg-white rounded-2xl shadow-xl p-6 mb-6">
            <div className="flex items-center justify-between">
              <button
                onClick={() => navigate("/philosophy")}
                className="flex items-center justify-center w-12 h-12 bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white rounded-full shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-110"
                title="개똥철학으로 돌아가기"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M10.5 19.5L3 12m0 0l7.5-7.5M3 12h18" />
                </svg>
              </button>
              <h1 className="text-2xl font-bold text-gray-800">개똥철학</h1>
              <div className="w-24"></div>
            </div>
          </div>

          {/* 게시글 내용 */}
          <div className="bg-white rounded-2xl shadow-xl p-6 mb-6">
            {/* 제목 */}
            <h1 className="text-3xl font-bold text-gray-900 mb-6">{post.title}</h1>
            
            {/* 메타 정보 */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-6 p-4 bg-gray-50 rounded-lg">
              <div className="flex flex-col">
                <span className="text-gray-500 text-xs mb-1">작성자</span>
                <span 
                  className="font-medium text-gray-800 hover:text-amber-600 cursor-pointer transition-colors"
                  onClick={() => handleShowProfile(post.authorId, post.author)}
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

            {/* 내용 */}
            <div className="prose max-w-none">
              <div className="text-gray-700 leading-relaxed whitespace-pre-wrap">
                {formatTextWithLinks(post.content)}
              </div>
            </div>

            {/* 액션 버튼들 */}
            <div className="flex items-center justify-between mt-8 pt-6 border-t border-gray-200">
              <div className="flex items-center space-x-3">
                <button
                  onClick={handleLike}
                  disabled={liking}
                  className={`flex items-center space-x-2 px-4 py-2 rounded-lg transition-colors ${
                    isLikedByUser()
                      ? 'text-red-500 bg-red-50 hover:bg-red-100'
                      : 'text-gray-500 hover:text-red-500 hover:bg-gray-50'
                  }`}
                >
                  <svg 
                    className={`w-5 h-5 ${isLikedByUser() ? 'fill-current' : 'fill-none'}`} 
                    stroke="currentColor" 
                    viewBox="0 0 24 24"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                  </svg>
                  <span>{isLikedByUser() ? '좋아요 취소' : '좋아요'}</span>
                </button>
              </div>

              {/* 작성자만 수정/삭제 버튼 표시 */}
              {user && user.uid === post.authorId && (
                <div className="flex items-center space-x-2">
                  <button
                    onClick={handleEdit}
                    className="px-4 py-2 bg-amber-600 text-white rounded-lg hover:bg-amber-700 transition-colors"
                  >
                    수정
                  </button>
                  <button
                    onClick={handleDelete}
                    className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
                  >
                    삭제
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* 댓글 섹션 */}
          <CommentSection postId={id} postType="philosophy" />
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

export default PhilosophyDetail;
