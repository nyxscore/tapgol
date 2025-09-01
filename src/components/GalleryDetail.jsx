import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { auth } from "../util/firebase";
import { onAuthStateChanged } from "firebase/auth";
import { getGalleryItem, incrementViews, deleteGalleryItem, toggleLike } from "../util/galleryService";
import { markNotificationsByPostIdAsRead } from "../util/notificationService";
import { formatTextWithLinks } from "../util/textUtils.jsx";
import CommentSection from "./CommentSection";

const GalleryDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [item, setItem] = useState(null);
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [deleting, setDeleting] = useState(false);
  const [liking, setLiking] = useState(false);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
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
  }, []);

  // 갤러리 항목 로드 (id가 변경될 때만)
  useEffect(() => {
    const loadItem = async () => {
      if (!id) {
        setLoading(false);
        return;
      }
      
      try {
        setLoading(true);
        console.log(`갤러리 항목 로드 시도: ${id}`);
        const itemData = await getGalleryItem(id);
        console.log("갤러리 항목 로드 성공:", itemData);
        setItem(itemData);
      } catch (error) {
        console.error("갤러리 항목 로드 오류:", error);
        setItem(null);
        
        // 사용자에게 더 친화적인 메시지 표시
        if (error.message === "갤러리 항목을 찾을 수 없습니다.") {
          alert("요청하신 갤러리 항목을 찾을 수 없습니다. 삭제되었거나 잘못된 링크일 수 있습니다.");
        } else {
          alert("갤러리 항목을 불러오는데 실패했습니다. 잠시 후 다시 시도해주세요.");
        }
        
        // 2초 후 갤러리로 이동
        setTimeout(() => {
          navigate("/gallery");
        }, 2000);
      } finally {
        setLoading(false);
      }
    };

    loadItem();
  }, [id, navigate]);

  // 조회수 증가 및 알림 처리 (user가 로그인한 후)
  useEffect(() => {
    const handleUserActions = async () => {
      if (!user || !item) return;
      
      try {
        // 조회수 증가
        await incrementViews(id);
        
        // 이 갤러리 항목과 관련된 알림을 읽음 처리
        try {
          const processedCount = await markNotificationsByPostIdAsRead(id, "gallery");
          if (processedCount > 0) {
            console.log(`${processedCount}개의 갤러리 관련 알림이 읽음 처리되었습니다.`);
          }
        } catch (notificationError) {
          console.error("알림 읽음 처리 오류:", notificationError);
          // 알림 처리 실패는 갤러리 보기에 영향을 주지 않도록 함
        }
      } catch (error) {
        console.error("사용자 액션 처리 오류:", error);
        // 조회수 증가 실패는 갤러리 보기에 영향을 주지 않도록 함
      }
    };

    handleUserActions();
  }, [user, item, id]);

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
    if (!user || user.uid !== item.uploaderId) {
      alert("삭제 권한이 없습니다.");
      return;
    }

    if (!window.confirm("정말로 이 파일을 삭제하시겠습니까?")) {
      return;
    }

    setDeleting(true);
    try {
      await deleteGalleryItem(id, item.fileName);
      alert("파일이 삭제되었습니다.");
      navigate("/gallery");
    } catch (error) {
      console.error("파일 삭제 오류:", error);
      alert("파일 삭제에 실패했습니다.");
    } finally {
      setDeleting(false);
    }
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
      setItem(prev => ({
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

  const isLiked = user && item?.likedBy?.includes(user.uid);
  const isAuthor = user && user.uid === item?.uploaderId;

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-amber-50 via-orange-50 to-amber-100 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-amber-700 mx-auto mb-4"></div>
          <p className="text-amber-700">갤러리 항목을 불러오는 중...</p>
        </div>
      </div>
    );
  }

  if (!item && !loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-amber-50 via-orange-50 to-amber-100 flex items-center justify-center">
        <div className="text-center">
          <div className="text-gray-400 text-6xl mb-4">📄</div>
                        <p className="text-gray-600 text-lg mb-2">추억앨범 항목을 찾을 수 없습니다</p>
          <p className="text-gray-500 text-sm mb-4">삭제되었거나 잘못된 링크일 수 있습니다.</p>
          <button
            onClick={() => navigate("/gallery")}
            className="bg-amber-600 text-white px-4 py-2 rounded-lg hover:bg-amber-700 transition-colors"
          >
            추억앨범으로 돌아가기
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-amber-50 via-orange-50 to-amber-100 pb-20">
      <div className="max-w-4xl mx-auto p-6">
        {/* 헤더 */}
        <div className="bg-white rounded-2xl shadow-xl p-6 mb-6">
          <div className="flex items-center justify-between">
            <button
              onClick={() => navigate("/gallery")}
              className="flex items-center text-amber-700 hover:text-amber-800 font-medium"
            >
              <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
              추억앨범으로 돌아가기
            </button>
            <h1 className="text-2xl font-bold text-gray-800">추억앨범 상세</h1>
            <div className="w-24"></div>
          </div>
        </div>

        {/* 갤러리 항목 내용 */}
        <div className="bg-white rounded-2xl shadow-xl p-6 mb-6">
          {/* 항목 헤더 */}
          <div className="border-b border-gray-200 pb-6 mb-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-2xl font-bold text-gray-800">{item.title}</h2>
              {isAuthor && (
                <div className="flex space-x-2">
                  <button
                    onClick={handleDelete}
                    disabled={deleting}
                    className={`px-3 py-1 rounded-lg transition-colors text-sm ${
                      deleting
                        ? "bg-gray-400 text-white cursor-not-allowed"
                        : "bg-red-500 text-white hover:bg-red-600"
                    }`}
                  >
                    {deleting ? "삭제 중..." : "삭제"}
                  </button>
                </div>
              )}
            </div>
            
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-sm">
              <div className="flex flex-col">
                <span className="text-gray-500 text-xs mb-1">업로더</span>
                <span className="font-medium text-gray-800">{item.uploader}</span>
              </div>
              <div className="flex flex-col">
                <span className="text-gray-500 text-xs mb-1">업로드일</span>
                <span className="text-gray-600">{formatDate(item.createdAt)}</span>
              </div>
              {item.updatedAt && item.updatedAt !== item.createdAt && (
                <div className="flex flex-col">
                  <span className="text-gray-500 text-xs mb-1">수정일</span>
                  <span className="text-gray-600">{formatDate(item.updatedAt)}</span>
                </div>
              )}
              <div className="flex flex-col">
                <span className="text-gray-500 text-xs mb-1">조회수</span>
                <div className="flex items-center space-x-1">
                  <svg className="w-4 h-4 text-gray-400" fill="currentColor" viewBox="0 0 20 20">
                    <path d="M10 12a2 2 0 100-4 2 2 0 000 4z" />
                    <path fillRule="evenodd" d="M.458 10C1.732 5.943 5.522 3 10 3s8.268 2.943 9.542 7c-1.274 4.057-5.064 7-9.542 7S1.732 14.057.458 10zM14 10a4 4 0 11-8 0 4 4 0 018 0z" clipRule="evenodd" />
                  </svg>
                  <span className="text-gray-600">{item.views || 0}</span>
                </div>
              </div>
            </div>
          </div>

          {/* 파일 표시 */}
          <div className="mb-8">
            {item.fileTypeCategory === 'image' ? (
              <div className="text-center">
                <img
                  src={item.fileUrl}
                  alt={item.title}
                  className="max-w-full h-auto rounded-lg shadow-lg mx-auto"
                  style={{ maxHeight: '70vh' }}
                  loading="lazy"
                />
              </div>
            ) : (
              <div className="text-center">
                <video
                  src={item.fileUrl}
                  controls
                  preload="metadata"
                  poster=""
                  className="max-w-full h-auto rounded-lg shadow-lg mx-auto"
                  style={{ maxHeight: '70vh' }}
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
                  브라우저가 비디오를 지원하지 않습니다.
                </video>
              </div>
            )}
          </div>

          {/* 설명 */}
          {item.description && (
            <div className="mb-8">
              <h3 className="text-lg font-semibold text-gray-800 mb-3">설명</h3>
              <div className="bg-gray-50 rounded-lg p-4">
                <div className="text-gray-700 whitespace-pre-wrap">
                  {formatTextWithLinks(item.description)}
                </div>
              </div>
            </div>
          )}



          {/* 좋아요 버튼 */}
          <div className="border-t border-gray-200 pt-6">
            <div className="flex items-center justify-center">
              <button
                onClick={handleLike}
                disabled={liking}
                className={`flex items-center space-x-2 px-6 py-3 rounded-lg transition-all ${
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
                  {liking ? "처리 중..." : isLiked ? "좋아요 취소" : "좋아요"} {item.likes || 0}
                </span>
              </button>
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
        <div className="bg-white rounded-2xl shadow-xl p-6">
          <CommentSection postId={id} boardType="gallery" />
        </div>
      </div>
    </div>
  );
};

export default GalleryDetail;
