import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { auth } from "../util/firebase";
import { onAuthStateChanged } from "firebase/auth";
import { getKaraokePost, incrementViews, toggleLike, deleteKaraokePost } from "../util/karaokeService";

import { formatTextWithLinks } from "../util/textUtils.jsx";
import CommentSection from "./CommentSection";
import UserProfileModal from "./UserProfileModal";
import { navigateToDM } from '../util/dmUtils';
import ReportModal from "./ReportModal";
import { FaFlag } from 'react-icons/fa';
import { formatAdminName, isAdmin, getEnhancedAdminStyles, isCurrentUserAdmin } from '../util/adminUtils';

const normalizeStorageUrl = (url) => {
  if (!url || typeof url !== 'string') return null;
  
  try {
    // 메인 페이지와 동일한 URL 정규화 로직
    const fixAll = (s, from, to) => (s || '').split(from).join(to);
    let fixed = url;
    fixed = fixAll(fixed, 'tabgol-4f728.firebasestorage.app', 'tabgol-4f728.appspot.com');
    fixed = fixAll(fixed, 'b/tabgol-4f728.firebasestorage.app', 'b/tabgol-4f728.appspot.com');
    fixed = fixAll(fixed, 'https://firebasestorage.app', 'https://firebasestorage.googleapis.com');

    const urlObj = new URL(fixed);
    if (!urlObj.hostname.includes('firebasestorage.googleapis.com')) {
      console.warn('잘못된 Firebase Storage URL:', url);
      return null;
    }
    return fixed;
  } catch (error) {
    console.warn('URL 정규화 실패:', url, error);
    return null;
  }
};

// 썸네일 URL 정규화 (썸네일 전용)
const normalizeThumbnailUrl = (url) => {
  if (!url || typeof url !== 'string') return url;
  
  // 썸네일 URL이 유효한지 확인
  if (url.includes('karaoke_thumbs') || url.includes('thumbnail')) {
    return normalizeStorageUrl(url);
  }
  
  return url;
};

// 비디오 URL 유효성 검사
const validateVideoUrl = async (url) => {
  if (!url) return false;
  
  try {
    const normalizedUrl = normalizeStorageUrl(url);
    if (!normalizedUrl) return false;
    
    // HEAD 요청으로 파일 존재 여부 확인
    const response = await fetch(normalizedUrl, { method: 'HEAD' });
    return response.ok;
  } catch (error) {
    console.warn('비디오 URL 유효성 검사 실패:', url, error);
    return false;
  }
};

// 대체 URL 생성 함수 (메인 페이지와 동일한 방식)
const getAlternativeUrls = (originalUrl) => {
  const normalized = normalizeStorageUrl(originalUrl);
  const urls = [];
  
  // 정규화된 URL이 있으면 우선 사용
  if (normalized) {
    urls.push(normalized);
  }
  
  // 원본 URL이 정규화된 것과 다르면 원본도 추가
  if (originalUrl !== normalized && originalUrl) {
    urls.unshift(originalUrl);
  }
  
  // 추가 대체 URL들 시도 (메인 페이지와 동일한 방식)
  if (originalUrl && originalUrl.includes('firebasestorage.googleapis.com')) {
    const altUrl = originalUrl.replace('firebasestorage.googleapis.com', 'firebasestorage.app');
    if (!urls.includes(altUrl)) {
      urls.push(altUrl);
    }
  }
  
  // 반대 방향도 시도
  if (originalUrl && originalUrl.includes('firebasestorage.app')) {
    const altUrl = originalUrl.replace('firebasestorage.app', 'firebasestorage.googleapis.com');
    if (!urls.includes(altUrl)) {
      urls.push(altUrl);
    }
  }
  
  console.log('대체 URL 생성:', { originalUrl, normalized, urls });
  return urls;
};

// 비디오 파일 존재 여부 확인 (CORS 문제로 인해 비활성화)
const checkVideoFileExists = async (url) => {
  // Firebase Storage의 CORS 정책으로 인해 HEAD 요청이 실패할 수 있음
  // 실제 파일 존재 여부는 비디오 로딩 시 onError에서 확인
  console.log(`비디오 파일 확인 시도: ${url}`);
  return true; // 항상 true 반환하여 비디오 로딩을 시도하게 함
};

// 썸네일 파일 존재 여부 확인 (CORS 문제로 인해 비활성화)
const checkThumbnailExists = async (url) => {
  // Firebase Storage의 CORS 정책으로 인해 HEAD 요청이 실패할 수 있음
  // 실제 파일 존재 여부는 썸네일 로딩 시 onError에서 확인
  console.log(`썸네일 파일 확인 시도: ${url}`);
  return true; // 항상 true 반환하여 썸네일 로딩을 시도하게 함
};

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
  const [videoError, setVideoError] = useState(null);
  const [videoLoading, setVideoLoading] = useState(true);
  const [currentVideoUrl, setCurrentVideoUrl] = useState(null);
  const [alternativeUrls, setAlternativeUrls] = useState([]);
  const [urlIndex, setUrlIndex] = useState(0);
  const [thumbnailError, setThumbnailError] = useState(false);

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
          videoElement.src = '';
          videoElement.load();
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
      
      // 비디오 URL 설정 및 파일 존재 여부 확인
      if (postData.videoUrl) {
        const urls = getAlternativeUrls(postData.videoUrl);
        setAlternativeUrls(urls);
        setCurrentVideoUrl(urls[0]);
        setUrlIndex(0);
        
        console.log('비디오 URL 설정 완료:', {
          originalUrl: postData.videoUrl,
          normalizedUrl: urls[0],
          allUrls: urls
        });
      }
      
      // 썸네일 URL 설정
      if (postData.thumbnailUrl) {
        console.log('썸네일 URL 설정 완료:', postData.thumbnailUrl);
      }
      
      // 조회수 증가 (로그인한 사용자만)
      if (user) {
        await incrementViews(id);
        setPost(prev => ({ ...prev, views: (prev?.views || 0) + 1 }));
        
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
    if (!user || (post.authorId !== user.uid && !isCurrentUserAdmin(user))) {
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
    if (!user || (post.authorId !== user.uid && !isCurrentUserAdmin(user))) {
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
              <p className="text-amber-700">비디오를 불러오는 중...</p>
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
              <div className="text-gray-400 text-6xl mb-4">🎬</div>
              <p className="text-gray-600 text-lg mb-2">비디오를 찾을 수 없습니다</p>
              <p className="text-gray-500 mb-6">삭제되었거나 존재하지 않는 영상입니다.</p>
              <button
                onClick={() => navigate("/karaoke")}
                className="bg-amber-600 text-white px-6 py-3 rounded-lg hover:bg-amber-700 transition-colors"
                title="비디오로 돌아가기"
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
            title="비디오로 돌아가기"
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
            <div className="aspect-video bg-black relative">
              <video
                src={currentVideoUrl}
                controls
                preload="auto"
                poster={post.thumbnailUrl ? normalizeThumbnailUrl(post.thumbnailUrl) : ""}
                controlsList="nodownload"
                playsInline
                onError={(e) => {
                  // 썸네일 로딩 실패 감지
                  if (e.target.tagName === 'IMG' && e.target.src.includes('thumbnail')) {
                    console.warn('썸네일 로딩 실패:', e.target.src);
                    setThumbnailError(true);
                    return;
                  }
                  
                  try {
                    const el = e.currentTarget;
                    const error = el.error;
                    const errorInfo = {
                      errorCode: error?.code,
                      errorMessage: error?.message,
                      networkState: el.networkState,
                      readyState: el.readyState,
                      src: el.src,
                      currentSrc: el.currentSrc,
                      is404: el.src.includes('404') || error?.code === 4 || error?.code === 2 || 
                             (error?.code === 4 && el.networkState === 3) // MEDIA_ERR_SRC_NOT_SUPPORTED + NETWORK_NO_SOURCE
                    };
                    
                    console.error('비디오 로딩 실패:', {
                      currentUrl: currentVideoUrl,
                      originalUrl: post?.videoUrl,
                      errorInfo
                    });
                    
                    // 404 에러인 경우 대체 URL 시도하지 않고 바로 에러 표시
                    if (errorInfo.is404) {
                      console.log('404 에러 감지 - 파일이 존재하지 않음');
                      setVideoError({
                        ...errorInfo,
                        isFileNotFound: true,
                        message: '비디오 파일을 찾을 수 없습니다. 파일이 삭제되었거나 이동되었을 수 있습니다.'
                      });
                      setVideoLoading(false);
                      el.style.display = 'none';
                      const placeholder = el.parentElement.querySelector('.video-placeholder');
                      if (placeholder) {
                        placeholder.style.display = 'flex';
                      }
                      return;
                    }
                    
                    // 대체 URL이 있으면 다음 URL 시도
                    if (urlIndex < alternativeUrls.length - 1) {
                      const nextIndex = urlIndex + 1;
                      const nextUrl = alternativeUrls[nextIndex];
                      console.log(`대체 URL 시도: ${nextUrl} (${nextIndex + 1}/${alternativeUrls.length})`);
                      setUrlIndex(nextIndex);
                      setCurrentVideoUrl(nextUrl);
                      setVideoLoading(true);
                      setVideoError(null);
                      return;
                    }
                    
                    // 모든 URL 시도 실패
                    setVideoError(errorInfo);
                    setVideoLoading(false);
                    
                    // 파일이 존재하지 않는 경우 placeholder 표시
                    el.style.display = 'none';
                    const placeholder = el.parentElement.querySelector('.video-placeholder');
                    if (placeholder) {
                      placeholder.style.display = 'flex';
                    }
                  } catch (err) {
                    console.error('비디오 에러 핸들링 중 오류:', err);
                  }
                }}
                onLoadStart={() => {
                  console.log('비디오 로딩 시작:', currentVideoUrl);
                  setVideoLoading(true);
                  setVideoError(null);
                }}
                onCanPlay={() => {
                  console.log('비디오 재생 가능:', currentVideoUrl);
                  setVideoLoading(false);
                  setVideoError(null);
                  
                  // 비디오가 성공적으로 로드되면 placeholder 숨기기
                  const placeholder = document.querySelector('.video-placeholder');
                  if (placeholder) {
                    placeholder.style.display = 'none';
                  }
                }}
                onLoadedData={() => {
                  console.log('비디오 데이터 로드 완료:', currentVideoUrl);
                  setVideoLoading(false);
                }}
                className="w-full h-full object-contain"
                onLoadedMetadata={(e) => {
                  try {
                    // 동영상 메타데이터 로드 후 첫 번째 프레임을 썸네일로 사용
                    const video = e.target;
                    if (video.videoWidth > 0 && video.videoHeight > 0) {
                      const canvas = document.createElement('canvas');
                      canvas.width = video.videoWidth;
                      canvas.height = video.videoHeight;
                      const ctx = canvas.getContext('2d');
                      ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
                      if (!post.thumbnailUrl || thumbnailError) {
                        video.poster = canvas.toDataURL();
                        console.log('비디오에서 썸네일 생성 완료');
                      }
                    }
                  } catch (err) {
                    console.warn('썸네일 생성 실패:', err);
                  }
                }}
              >
                <source src={currentVideoUrl} type={post.fileType || "video/mp4"} />
                브라우저가 비디오 태그를 지원하지 않습니다.
              </video>
              {/* 비디오 로딩 중 표시 */}
              {videoLoading && (
                <div className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center">
                  <div className="text-center text-white">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white mx-auto mb-4"></div>
                    <div className="text-lg font-medium">비디오 로딩 중...</div>
                    {alternativeUrls.length > 1 && (
                      <div className="text-sm text-gray-300 mt-2">
                        URL {urlIndex + 1}/{alternativeUrls.length} 시도 중
                      </div>
                    )}
                  </div>
                </div>
              )}
              
              {/* 비디오 로딩 실패 시 표시할 placeholder */}
              <div className="video-placeholder absolute inset-0 bg-gray-300 flex items-center justify-center text-gray-600" style={{display: 'none'}}>
                <div className="text-center">
                  <div className="text-6xl mb-4">🎬</div>
                  <div className="text-lg font-medium">
                    {videoError?.isFileNotFound ? '비디오 파일을 찾을 수 없습니다' : '비디오를 불러올 수 없습니다'}
                  </div>
                  <div className="text-sm text-gray-500 mt-2">
                    {videoError?.isFileNotFound 
                      ? '파일이 삭제되었거나 이동되었을 수 있습니다. 관리자에게 문의하세요.'
                      : '네트워크 문제이거나 파일에 문제가 있을 수 있습니다'
                    }
                  </div>
                  
                  {/* 디버깅 정보 표시 */}
                  {videoError && (
                    <div className="mt-4 p-3 bg-gray-100 rounded text-xs text-left max-w-md">
                      <div className="font-semibold mb-2">디버깅 정보:</div>
                      <div>에러 코드: {videoError.errorCode}</div>
                      <div>네트워크 상태: {videoError.networkState}</div>
                      <div>준비 상태: {videoError.readyState}</div>
                      <div className="break-all">현재 URL: {videoError.src}</div>
                      <div className="break-all">원본 URL: {post.videoUrl}</div>
                      <div>시도한 URL 수: {urlIndex + 1}/{alternativeUrls.length}</div>
                    </div>
                  )}
                  
                  <div className="flex space-x-2 mt-4">
                    <button 
                      onClick={() => {
                        const video = document.querySelector('video');
                        if (video) {
                          video.load();
                          video.style.display = 'block';
                          const placeholder = document.querySelector('.video-placeholder');
                          if (placeholder) {
                            placeholder.style.display = 'none';
                          }
                          setVideoError(null);
                          setVideoLoading(true);
                        }
                      }}
                      className="px-4 py-2 bg-amber-600 text-white rounded-lg hover:bg-amber-700 transition-colors"
                    >
                      다시 시도
                    </button>
                    
                    {alternativeUrls.length > 1 && !videoError?.isFileNotFound && (
                      <button 
                        onClick={() => {
                          const nextIndex = (urlIndex + 1) % alternativeUrls.length;
                          setUrlIndex(nextIndex);
                          setCurrentVideoUrl(alternativeUrls[nextIndex]);
                          setVideoError(null);
                          setVideoLoading(true);
                          const video = document.querySelector('video');
                          if (video) {
                            video.style.display = 'block';
                            const placeholder = document.querySelector('.video-placeholder');
                            if (placeholder) {
                              placeholder.style.display = 'none';
                            }
                          }
                        }}
                        className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                      >
                        다른 URL 시도
                      </button>
                    )}
                    
                    {videoError?.isFileNotFound && user && (post.authorId === user.uid || isCurrentUserAdmin(user)) && (
                      <button 
                        onClick={async () => {
                          if (window.confirm('이 비디오 게시글을 삭제하시겠습니까? 파일이 존재하지 않습니다.')) {
                            try {
                              await deleteKaraokePost(id, post.fileName);
                              alert('삭제된 비디오 게시글이 정리되었습니다.');
                              navigate("/karaoke");
                            } catch (error) {
                              console.error('게시글 삭제 오류:', error);
                              alert('게시글 삭제에 실패했습니다.');
                            }
                          }
                        }}
                        className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
                      >
                        삭제된 게시글 정리
                      </button>
                    )}
                  </div>
                </div>
              </div>
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
                
                {user && (post.authorId === user.uid || isCurrentUserAdmin(user)) && (
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
