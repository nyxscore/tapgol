import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { auth } from "../util/firebase";
import { onAuthStateChanged } from "firebase/auth";
import { getKaraokePost, incrementViews, toggleLike, deleteKaraokePost } from "../util/karaokeService";

import { markNotificationsByPostIdAsRead } from "../util/notificationService";
import { formatTextWithLinks } from "../util/textUtils.jsx";
import CommentSection from "./CommentSection";
import UserProfileModal from "./UserProfileModal";
import ReportModal from "./ReportModal";
import { FaFlag } from 'react-icons/fa';
import { formatAdminName, isAdmin, getEnhancedAdminStyles } from '../util/adminUtils';

const KaraokeDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [post, setPost] = useState(null);
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isLiked, setIsLiked] = useState(false);
  const [deleting, setDeleting] = useState(false);
  
  // 프로필 모달 관련 상태
  const [showProfileModal, setShowProfileModal] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);

  // 신고 관련 상태
  const [showReportModal, setShowReportModal] = useState(false);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      setUser(currentUser);
      
      if (currentUser) {
        await loadPost();
      } else {
        await loadPost();
      }
    });

    return () => {
      unsubscribe();
      // 컴포넌트 언마운트 시 비디오 정리
      const videoElement = document.querySelector('video');
      if (videoElement) {
        try {
          videoElement.pause();
          videoElement.currentTime = 0;
        } catch (error) {
          // AbortError는 무시
          if (error.name !== 'AbortError') {
            console.error('비디오 정리 오류:', error);
          }
        }
      }
    };
  }, [id]);

  const loadPost = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const postData = await getKaraokePost(id);
      setPost(postData);
      
      // 조회수 증가 (로그인한 사용자만)
      if (user) {
        await incrementViews(id);
        setPost(prev => ({ ...prev, views: (prev?.views || 0) + 1 }));
        
        // 이 노래자랑 게시글과 관련된 알림을 읽음 처리
        try {
          const processedCount = await markNotificationsByPostIdAsRead(id, "karaoke");
          if (processedCount > 0) {
                         console.log(`${processedCount}개의 노래자랑 관련 알림이 읽음 처리되었습니다.`);
          }
        } catch (notificationError) {
          console.error("알림 읽음 처리 오류:", notificationError);
          // 알림 처리 실패는 게시글 보기에 영향을 주지 않도록 함
        }
      }
      
      // 좋아요 상태 확인
      if (user && postData.likedBy?.includes(user.uid)) {
        setIsLiked(true);
      }
    } catch (error) {
             console.error("노래자랑 게시글 로드 오류:", error);
      setError("게시글을 불러오는데 실패했습니다.");
    } finally {
      setLoading(false);
    }
  };

  const handleLike = async () => {
    if (!user) {
      alert("좋아요를 누르려면 로그인이 필요합니다.");
      navigate("/login");
      return;
    }

    try {
      const newIsLiked = await toggleLike(id, user.uid);
      setIsLiked(newIsLiked);
      
      setPost(prev => ({
        ...prev,
        likes: newIsLiked ? (prev?.likes || 0) + 1 : (prev?.likes || 0) - 1,
        likedBy: newIsLiked 
          ? [...(prev?.likedBy || []), user.uid]
          : (prev?.likedBy || []).filter(uid => uid !== user.uid)
      }));
    } catch (error) {
      console.error("좋아요 처리 오류:", error);
      alert("좋아요 처리에 실패했습니다.");
    }
  };

  const handleDelete = async () => {
    if (!user || post.authorId !== user.uid) {
      alert("삭제 권한이 없습니다.");
      return;
    }

    if (!window.confirm("정말로 이 영상을 삭제하시겠습니까?")) {
      return;
    }

    setDeleting(true);
    try {
      await deleteKaraokePost(id, post.fileName);
      alert("영상이 삭제되었습니다.");
      navigate("/karaoke");
    } catch (error) {
      console.error("삭제 오류:", error);
      alert("삭제에 실패했습니다.");
    } finally {
      setDeleting(false);
    }
  };

  const handleEdit = () => {
    if (!user || post.authorId !== user.uid) {
      alert("수정 권한이 없습니다.");
      return;
    }
    navigate(`/karaoke/edit/${id}`);
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

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-amber-50 via-orange-50 to-amber-100">
        <main className="pb-20 pt-16">
          <div className="max-w-4xl mx-auto px-4">
            <div className="text-center py-12">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-amber-700 mx-auto mb-4"></div>
                             <p className="text-amber-700">노래자랑 영상을 불러오는 중...</p>
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
              <div className="text-gray-400 text-6xl mb-4">🎤</div>
              <p className="text-gray-600 text-lg mb-2">영상을 찾을 수 없습니다</p>
              <p className="text-gray-500 mb-6">삭제되었거나 존재하지 않는 영상입니다.</p>
              <button
                onClick={() => navigate("/karaoke")}
                className="bg-amber-600 text-white px-6 py-3 rounded-lg hover:bg-amber-700 transition-colors"
                title="노래자랑으로 돌아가기"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
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
          {/* Back Button */}
          <button
            onClick={() => navigate("/karaoke")}
            className="mb-4 flex items-center justify-center w-12 h-12 bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white rounded-full shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-110"
            title="노래자랑으로 돌아가기"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M10.5 19.5L3 12m0 0l7.5-7.5M3 12h18" />
            </svg>
          </button>

          {/* Video Player */}
          <div className={`rounded-2xl shadow-xl overflow-hidden mb-6 ${
            isAdmin(post?.authorEmail) 
              ? 'bg-gradient-to-br from-purple-50 via-pink-50 to-purple-100 border-l-4 border-purple-500' 
              : 'bg-white'
          }`}>
            <div className="aspect-video bg-black">
              <video
                src={post.videoUrl}
                controls
                preload="metadata"
                poster=""
                className="w-full h-full object-contain"
                onLoadedMetadata={(e) => {
                  // 동영상 메타데이터 로드 후 첫 번째 프레임을 썸네일로 사용
                  const video = e.target;
                  const canvas = document.createElement('canvas');
                  canvas.width = video.videoWidth;
                  canvas.height = video.videoHeight;
                  const ctx = canvas.getContext('2d');
                  ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
                  video.poster = canvas.toDataURL();
                }}
              >
                브라우저가 비디오 태그를 지원하지 않습니다.
              </video>
            </div>
          </div>

          {/* Video Info */}
          <div className={`rounded-2xl shadow-xl p-6 mb-6 ${
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
            <div className="flex items-start justify-between mb-4">
              <div className="flex-1">
                <h1 className="text-2xl font-bold text-gray-800 mb-2">{post.title}</h1>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 text-sm mb-3">
                  <div className="flex flex-col">
                    <span className="text-gray-500 text-xs mb-1">작성자</span>
                    <span 
                      className="cursor-pointer transition-colors"
                      onClick={() => handleShowProfile(post.authorId, post.author)}
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
                    <span className="text-gray-500 text-xs mb-1">업로드일</span>
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
                </div>
                {post.description && (
                  <div className="text-gray-700 whitespace-pre-wrap">
                    {formatTextWithLinks(post.description)}
                  </div>
                )}
              </div>
              
              {/* Action Buttons */}
              <div className="flex items-center space-x-2 ml-4">
                <button
                  onClick={handleLike}
                  className={`flex items-center space-x-1 px-3 py-2 rounded-lg transition-colors ${
                    isLiked 
                      ? 'bg-red-100 text-red-600 hover:bg-red-200' 
                      : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                  }`}
                >
                  <svg className="w-5 h-5" fill={isLiked ? "currentColor" : "none"} stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                  </svg>
                  <span>{isLiked ? "취소" : "좋아요"}</span>
                </button>
                
                {/* 신고 버튼 - 작성자가 아닌 경우에만 표시 */}
                {user && user.uid !== post.authorId && (
                  <button
                    onClick={handleReport}
                    className="flex items-center space-x-1 px-3 py-2 rounded-lg transition-colors bg-purple-100 text-purple-700 hover:bg-purple-200 hover:text-purple-800"
                    title="게시글 신고"
                  >
                    <FaFlag className="w-4 h-4" />
                    <span>신고</span>
                  </button>
                )}
                
                {user && post.authorId === user.uid && (
                  <div className="flex items-center space-x-2">
                    <button
                      onClick={handleEdit}
                      className="px-3 py-2 bg-blue-100 text-blue-600 rounded-lg hover:bg-blue-200 transition-colors"
                    >
                      수정
                    </button>
                    <button
                      onClick={handleDelete}
                      disabled={deleting}
                      className="px-3 py-2 bg-red-100 text-red-600 rounded-lg hover:bg-red-200 transition-colors disabled:opacity-50"
                    >
                      {deleting ? "삭제 중..." : "삭제"}
                    </button>
                  </div>
                )}
              </div>
            </div>


          </div>

          {/* Comments Section */}
          <div className="bg-white rounded-2xl shadow-xl p-6">
            <CommentSection postId={id} boardType="karaoke" />
          </div>
        </div>
      </main>

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

export default KaraokeDetail;
