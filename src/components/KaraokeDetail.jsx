import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { auth } from "../util/firebase";
import { onAuthStateChanged } from "firebase/auth";
import { getKaraokePost, incrementViews, toggleLike, deleteKaraokePost } from "../util/karaokeService";
import { formatFileSize } from "../util/karaokeService";
import { markNotificationsByPostIdAsRead } from "../util/notificationService";
import { formatTextWithLinks } from "../util/textUtils.jsx";
import CommentSection from "./CommentSection";

const KaraokeDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [post, setPost] = useState(null);
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isLiked, setIsLiked] = useState(false);
  const [deleting, setDeleting] = useState(false);

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
        
        // 이 노래방 게시글과 관련된 알림을 읽음 처리
        try {
          const processedCount = await markNotificationsByPostIdAsRead(id, "karaoke");
          if (processedCount > 0) {
            console.log(`${processedCount}개의 노래방 관련 알림이 읽음 처리되었습니다.`);
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
      console.error("노래방 게시글 로드 오류:", error);
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
              <p className="text-amber-700">노래방 영상을 불러오는 중...</p>
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
              >
                노래방으로 돌아가기
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
            className="mb-4 flex items-center text-gray-600 hover:text-gray-800 transition-colors"
          >
            <svg className="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M9.707 16.707a1 1 0 01-1.414 0l-6-6a1 1 0 010-1.414l6-6a1 1 0 011.414 1.414L5.414 9H17a1 1 0 110 2H5.414l4.293 4.293a1 1 0 010 1.414z" clipRule="evenodd" />
            </svg>
            노래방으로 돌아가기
          </button>

          {/* Video Player */}
          <div className="bg-white rounded-2xl shadow-xl overflow-hidden mb-6">
            <div className="aspect-video bg-black">
              <video
                src={post.videoUrl}
                controls
                className="w-full h-full object-contain"
                poster={post.thumbnailUrl}
              >
                브라우저가 비디오 태그를 지원하지 않습니다.
              </video>
            </div>
          </div>

          {/* Video Info */}
          <div className="bg-white rounded-2xl shadow-xl p-6 mb-6">
            <div className="flex items-start justify-between mb-4">
              <div className="flex-1">
                <h1 className="text-2xl font-bold text-gray-800 mb-2">{post.title}</h1>
                <div className="flex items-center space-x-4 text-sm text-gray-500 mb-3">
                  <span>{post.author}</span>
                  <span>•</span>
                  <span>{formatDate(post.createdAt)}</span>
                  <span>•</span>
                  <span>조회 {post.views || 0}</span>
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
                  <span>{post.likes || 0}</span>
                </button>
                
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

            {/* File Info */}
            <div className="border-t pt-4">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                <div>
                  <span className="text-gray-500">파일 크기:</span>
                  <p className="font-medium">{formatFileSize(post.fileSize)}</p>
                </div>
                <div>
                  <span className="text-gray-500">파일 형식:</span>
                  <p className="font-medium">{post.fileType}</p>
                </div>
                <div>
                  <span className="text-gray-500">업로드 시간:</span>
                  <p className="font-medium">{formatDate(post.createdAt)}</p>
                </div>
                <div>
                  <span className="text-gray-500">업로더:</span>
                  <p className="font-medium">{post.author}</p>
                </div>
              </div>
            </div>
          </div>

          {/* Comments Section */}
          <div className="bg-white rounded-2xl shadow-xl p-6">
            <CommentSection postId={id} boardType="karaoke" />
          </div>
        </div>
      </main>
    </div>
  );
};

export default KaraokeDetail;
