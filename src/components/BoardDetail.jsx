import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { auth } from "../util/firebase";
import { onAuthStateChanged } from "firebase/auth";
import { getPost, incrementViews, deletePost, toggleLike } from "../util/postService";
import { formatTextWithLinks } from "../util/textUtils.jsx";
import CommentSection from "./CommentSection";
import UserProfileModal from "./UserProfileModal";
import { navigateToDM } from '../util/dmUtils';
import ReportModal from "./ReportModal";
import { FaFlag } from 'react-icons/fa';
import { formatAdminName, isAdmin, getEnhancedAdminStyles, isCurrentUserAdmin } from '../util/adminUtils';

const BoardDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [post, setPost] = useState(null);
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [deleting, setDeleting] = useState(false);
  const [liking, setLiking] = useState(false);
  
  // 프로필 모달 관련 상태
  const [showProfileModal, setShowProfileModal] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);

  // 신고 관련 상태
  const [showReportModal, setShowReportModal] = useState(false);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
    });

    const loadPost = async () => {
      try {
        const postData = await getPost(id);
        setPost(postData);
        
        // 조회수 증가 (로그인한 사용자만)
        if (user) {
          await incrementViews(id);
          
        }
      } catch (error) {
        console.error("게시글 로드 오류:", error);
        alert("게시글을 불러오는데 실패했습니다.");
        navigate("/board");
      } finally {
        setLoading(false);
      }
    };

    if (id) {
      loadPost();
    }

    return () => unsubscribe();
  }, [id, user, navigate]);

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

  const handleDelete = async () => {
    if (!user || (user.uid !== post.authorId && !isCurrentUserAdmin(user))) {
      alert("삭제 권한이 없습니다.");
      return;
    }

    if (!window.confirm("정말로 이 게시글을 삭제하시겠습니까?")) {
      return;
    }

    setDeleting(true);
    try {
      await deletePost(id);
      alert("게시글이 삭제되었습니다.");
      navigate("/board");
    } catch (error) {
      console.error("게시글 삭제 오류:", error);
      alert("게시글 삭제에 실패했습니다.");
    } finally {
      setDeleting(false);
    }
  };

  const handleEdit = () => {
    if (!user || (user.uid !== post.authorId && !isCurrentUserAdmin(user))) {
      alert("수정 권한이 없습니다.");
      return;
    }
    navigate(`/board/edit/${id}`);
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

  // 신고 관련 함수들
  const handleReport = () => {
    if (!user) {
      alert("신고하려면 로그인이 필요합니다.");
      navigate("/login");
      return;
    }
    setShowReportModal(true);
  };

  const handleReportSuccess = (reportId) => {
    alert("신고가 성공적으로 접수되었습니다.");
  };

  const handleLike = async () => {
    if (!user) {
      alert("좋아요를 누르려면 로그인이 필요합니다.");
      navigate("/login");
      return;
    }

    if (liking) return; // 중복 클릭 방지

    setLiking(true);
    try {
      const isLiked = await toggleLike(id, user.uid);
      
      // 로컬 상태 업데이트
      setPost(prev => ({
        ...prev,
        likes: isLiked ? (prev.likes || 0) + 1 : (prev.likes || 0) - 1,
        likedBy: isLiked 
          ? [...(prev.likedBy || []), user.uid]
          : (prev.likedBy || []).filter(uid => uid !== user.uid)
      }));

      // 성공 메시지
      if (isLiked) {
        console.log("좋아요를 눌렀습니다!");
      } else {
        console.log("좋아요를 취소했습니다!");
      }
    } catch (error) {
      console.error("좋아요 처리 오류:", error);
      alert("좋아요 처리에 실패했습니다.");
    } finally {
      setLiking(false);
    }
  };

  const isLiked = user && post?.likedBy?.includes(user.uid);

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-amber-50 via-orange-50 to-amber-100 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-amber-700 mx-auto mb-4"></div>
          <p className="text-amber-700">게시글을 불러오는 중...</p>
        </div>
      </div>
    );
  }

  if (!post) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-amber-50 via-orange-50 to-amber-100 flex items-center justify-center">
        <div className="text-center">
          <div className="text-gray-400 text-6xl mb-4">📄</div>
          <p className="text-gray-600 text-lg mb-2">게시글을 찾을 수 없습니다</p>
                      <button
              onClick={() => navigate("/board")}
              className="bg-amber-600 text-white px-4 py-2 rounded-lg hover:bg-amber-700 transition-colors"
              title="게시판으로 돌아가기"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
            </button>
        </div>
      </div>
    );
  }

  const isAuthor = user && user.uid === post.authorId;
  const canEditDelete = isAuthor || isCurrentUserAdmin(user);

  return (
    <div className="min-h-screen bg-gradient-to-br from-amber-50 via-orange-50 to-amber-100 pb-20">
      <div className="max-w-4xl mx-auto p-6">
        {/* 헤더 */}
        <div className={`rounded-2xl shadow-xl p-6 mb-6 ${
          isAdmin(post?.authorEmail) 
            ? 'bg-gradient-to-br from-purple-50 via-pink-50 to-purple-100 border-l-4 border-purple-500' 
            : 'bg-white'
        }`}>
          <div className="flex items-center justify-between">
            <button
              onClick={() => navigate("/board")}
              className="flex items-center justify-center w-12 h-12 bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white rounded-full shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-110"
              title="목록으로 돌아가기"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M10.5 19.5L3 12m0 0l7.5-7.5M3 12h18" />
              </svg>
            </button>
            <h1 className="text-2xl font-bold text-gray-800">모임게시판</h1>
            <div className="w-24"></div>
          </div>
        </div>

        {/* 게시글 내용 */}
        <div className={`rounded-2xl shadow-xl p-6 ${
          isAdmin(post?.authorEmail) 
            ? getEnhancedAdminStyles().container
            : 'bg-white'
        }`}>
          {isAdmin(post?.authorEmail) && (
            <>
              <div className={getEnhancedAdminStyles().glowEffect}></div>
              <svg className={getEnhancedAdminStyles().adminIcon} fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M2.166 4.999A11.954 11.954 0 0010 1.944 11.954 11.954 0 0017.834 5c.11.65.166 1.32.166 2.001 0 5.225-3.34 9.67-8 11.317C5.34 16.67 2 12.225 2 7c0-.682.057-1.35.166-2.001zm11.541 3.708a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
              </svg>
            </>
          )}
          {/* 게시글 헤더 */}
          <div className="border-b border-gray-200 pb-6 mb-6">
                        <div className="mb-4">
              <div className="mb-3">
                <h2 className={`text-2xl font-bold mb-2 ${
                  isAdmin(post?.authorEmail) 
                    ? 'text-purple-800 ' + getEnhancedAdminStyles().titleGlow
                    : 'text-gray-800'
                }`}>{post.title}</h2>
                <div className="flex items-center justify-between">
                  <span className={`px-3 py-1 rounded-full text-sm font-semibold ${
                    post.category === "정기모임" 
                      ? "bg-red-500 text-white" 
                      : "bg-amber-100 text-amber-800"
                  }`}>
                    {post.category || "정기모임"}
                  </span>
                  {canEditDelete && (
                    <div className="flex space-x-2">
                      <button
                        onClick={handleEdit}
                        className="px-3 py-1 bg-blue-500 text-white rounded hover:bg-blue-600 transition-colors text-sm flex items-center"
                      >
                        <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                        </svg>
                        수정
                      </button>
                      <button
                        onClick={handleDelete}
                        disabled={deleting}
                        className={`px-3 py-1 rounded transition-colors text-sm flex items-center ${
                          deleting
                            ? "bg-gray-400 text-white cursor-not-allowed"
                            : "bg-red-500 text-white hover:bg-red-600"
                        }`}
                      >
                        <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                        </svg>
                        {deleting ? "삭제 중..." : "삭제"}
                      </button>
                    </div>
                  )}
                </div>
              </div>
            </div>
            
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-sm">
              <div className="flex flex-col">
                <span className="text-gray-500 text-xs mb-1">작성자</span>
                <span 
                  className="cursor-pointer transition-colors"
                  onClick={() => navigateToDM(post.authorId, user, navigate)}
                  title="프로필 보기"
                >
                  {(() => {
                    const adminInfo = formatAdminName(post.author, post.authorEmail);
                    if (adminInfo.isAdmin) {
                      return (
                        <span className="inline-flex items-center space-x-1">
                          <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-gradient-to-r from-purple-500 to-pink-500 text-white shadow-lg">
                            <svg className="w-3 h-3 mr-1" fill="currentColor" viewBox="0 0 20 20">
                              <path fillRule="evenodd" d="M2.166 4.999A11.954 11.954 0 0010 1.944 11.954 11.954 0 0017.834 5c.11.65.166 1.32.166 2.001 0 5.225-3.34 9.67-8 11.317C5.34 16.67 2 12.225 2 7c0-.682.057-1.35.166-2.001zm11.541 3.708a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                            </svg>
                            {adminInfo.badgeText}
                          </span>
                          <span className="font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
                            {adminInfo.name}
                          </span>
                        </span>
                      );
                    }
                    return adminInfo.name;
                  })()}
                </span>
              </div>
              <div className="flex flex-col">
                <span className="text-gray-500 text-xs mb-1">작성일</span>
                <span className="text-gray-600">{formatDate(post.createdAt)}</span>
              </div>
              {post.updatedAt && post.updatedAt !== post.createdAt && (
                <div className="flex flex-col">
                  <span className="text-gray-500 text-xs mb-1">수정일</span>
                  <span className="text-gray-600">{formatDate(post.updatedAt)}</span>
                </div>
              )}
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
            </div>
          </div>

          {/* 게시글 본문 */}
          <div className="mb-8">
            <div className="prose max-w-none">
              <div className={`whitespace-pre-wrap leading-relaxed ${
                isAdmin(post?.authorEmail) 
                  ? 'text-purple-800 font-medium ' + getEnhancedAdminStyles().contentGlow
                  : 'text-gray-700'
              }`}>
                {formatTextWithLinks(post.content)}
              </div>
            </div>
          </div>

          {/* 좋아요 버튼 */}
          <div className="border-t border-gray-200 pt-6">
            <div className="flex items-center justify-center space-x-4">
              <button
                onClick={handleLike}
                disabled={liking}
                className={`flex items-center space-x-2 px-6 py-3 rounded-lg transition-all min-w-[120px] justify-center ${
                  isLiked
                    ? "bg-red-500 text-white hover:bg-red-600"
                    : "bg-amber-100 text-amber-800 hover:bg-amber-200"
                } ${liking ? "opacity-50 cursor-not-allowed" : ""}`}
              >
                <svg 
                  className={`w-5 h-5 ${isLiked ? "fill-current" : "fill-none"}`} 
                  stroke="currentColor" 
                  viewBox="0 0 24 24"
                >
                  <path 
                    strokeLinecap="round" 
                    strokeLinejoin="round" 
                    strokeWidth={2} 
                    d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" 
                  />
                </svg>
                <span>
                  {liking ? "처리 중..." : isLiked ? "취소" : "좋아요"}
                </span>
              </button>
              
              {/* 신고 버튼 - 작성자가 아닌 경우에만 표시 */}
              {user && user.uid !== post.authorId && (
                <button
                  onClick={handleReport}
                  className="flex items-center space-x-2 px-4 py-3 rounded-lg transition-colors bg-purple-100 text-purple-700 hover:bg-purple-200 hover:text-purple-800"
                  title="게시글 신고"
                >
                  <FaFlag className="w-4 h-4" />
                  <span>신고</span>
                </button>
              )}
            </div>
            {!user && (
              <div className="text-center mt-2">
                <p className="text-sm text-gray-500">
                  좋아요를 누르려면 <button 
                    onClick={() => navigate("/login")}
                    className="text-amber-600 hover:text-amber-700 underline"
                  >
                    로그인
                  </button>이 필요합니다.
                </p>
              </div>
            )}
          </div>
        </div>

        {/* 댓글 섹션 */}
        <div className="bg-white rounded-2xl shadow-xl p-6 mt-6">
          <CommentSection postId={id} />
        </div>
      </div>

      {/* 사용자 프로필 모달 */}
      <UserProfileModal
        isOpen={showProfileModal}
        onClose={handleCloseProfileModal}
        userId={selectedUser?.id}
        userName={selectedUser?.name}
      />

      {/* 신고 모달 */}
      <ReportModal
        isOpen={showReportModal}
        onClose={() => setShowReportModal(false)}
        targetData={post}
        targetType="post"
        onSuccess={handleReportSuccess}
      />
    </div>
  );
};

export default BoardDetail;
