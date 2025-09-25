import React, { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { getKaraokePosts, toggleLike, incrementViews, uploadKaraokeThumbnail, updateKaraokePost } from "../util/karaokeService";
import UserProfileModal from './UserProfileModal';
import { navigateToDM } from '../util/dmUtils';
import { ref, getDownloadURL } from "firebase/storage";
import { storage } from "../util/firebase";
import { cleanupInvalidKaraokePosts } from "../util/cleanupKaraoke";
import "../util/manualCleanup";
import { useAuth } from '../contexts/AuthContext';

const Karaoke = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [statusMessage, setStatusMessage] = useState('');
  const [loadingVideos, setLoadingVideos] = useState(new Set()); // 로딩 중인 비디오들
  const [playingVideos, setPlayingVideos] = useState(new Set()); // 재생 중인 비디오들
  const videoRefs = useRef({}); // 각 비디오 엘리먼트 참조

  // 프로필 모달 관련 상태
  const [showProfileModal, setShowProfileModal] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);

  useEffect(() => {
    loadKaraokePosts();

    // 개발자 도구에서 정리 함수 사용 가능하도록 설정
    window.cleanupKaraoke = cleanupInvalidKaraokePosts;
    

  }, []);



  const loadKaraokePosts = async () => {
    try {
      setLoading(true);
      setError(null);
      const postsData = await getKaraokePosts();
      
      // 비디오 URL이 있는 게시글만 표시
      const videoOnly = Array.isArray(postsData) ? postsData.filter((p) => !!p.videoUrl) : [];
      
      // 비디오 URL 유효성 검사 (비동기)
      // 상세페이지와 동일한 방식: 대체 URL 생성
      const validPosts = videoOnly.map(post => {
        const alternativeUrls = getAlternativeUrls(post.videoUrl);
        return {
          ...post,
          videoUrl: alternativeUrls[0], // 첫 번째 URL 사용
          alternativeUrls: alternativeUrls // 모든 대체 URL 저장
        };
      });

      // 모든 비디오를 표시 (상세페이지와 동일한 방식)
      
      setPosts(validPosts);

      // 썸네일이 없는 기존 게시물 처리 (백그라운드)
      try {
        const targets = videoOnly.filter(p => !p.thumbnailUrl);
        for (const post of targets) {
          await generateAndSaveThumbnail(post);
        }
      } catch (thumbErr) {
        console.warn("기존 게시물 썸네일 생성 중 일부 실패:", thumbErr);
      }
    } catch (error) {
      console.error("노래자랑 게시글 로드 오류:", error);
      setError("게시글을 불러오는데 실패했습니다.");
    } finally {
      setLoading(false);
    }
  };

  // 무효한 게시물 제거 함수
  const removeInvalidPost = (postId) => {
    setPosts(prevPosts => prevPosts.filter(post => post.id !== postId));
    setStatusMessage(prev => prev.replace(/\d+개/, (match) => {
      const current = parseInt(match);
      return `${current - 1}개`;
    }));
  };

  // Storage URL 정규화 및 유효성 검사 (개선된 버전)
  const normalizeStorageUrl = (url) => {
    if (!url || typeof url !== 'string') return null;
    
    try {
      // 잘못된 경로 패턴 수정
      let fixed = url;
      
      // tabgol-4f728.firebasestorage.app을 tabgol-4f728.appspot.com으로 변경
      fixed = fixed.replace(/tabgol-4f728\.firebasestorage\.app/g, 'tabgol-4f728.appspot.com');
      
      // firebasestorage.app 도메인을 firebasestorage.googleapis.com으로 변경
      fixed = fixed.replace('firebasestorage.app', 'firebasestorage.googleapis.com');
      
      // URL 형식 검증
      const urlObj = new URL(fixed);
      if (urlObj.hostname.includes('firebasestorage.googleapis.com')) {
        return fixed;
      }
      
      console.warn('URL 검증 실패:', fixed);
      return null;
    } catch (error) {
      console.warn('URL 정규화 실패:', url, error);
      return null;
    }
  };

  // 대체 URL 생성 함수 (개선된 버전)
  const getAlternativeUrls = (originalUrl) => {
    const normalized = normalizeStorageUrl(originalUrl);
    const urls = [];
    
    // 정규화된 URL이 있으면 우선 사용 (가장 안전한 URL)
    if (normalized) {
      urls.push(normalized);
    }
    
    // 원본 URL이 유효하고 정규화된 것과 다르면 추가
    if (originalUrl && originalUrl !== normalized && originalUrl.includes('firebasestorage.googleapis.com')) {
      urls.push(originalUrl);
    }
    
    // firebasestorage.app 도메인은 CORS 문제로 인해 제외
    // 잘못된 URL 생성을 방지하기 위해 원본 URL만 사용
    
    return urls.length > 0 ? urls : [originalUrl]; // fallback
  };

  // 기존 게시글 썸네일 생성 및 저장
  const generateAndSaveThumbnail = async (post) => {
    if (!post?.videoUrl) return;
    // googleapis 도메인에서 클라이언트 캡처 시 CORS 발생 → 건너뜀
    if (normalizeStorageUrl(post.videoUrl).includes('firebasestorage.googleapis.com')) {
      return;
    }
    // 캡처
    const blob = await new Promise((resolve, reject) => {
      const video = document.createElement('video');
      video.src = normalizeStorageUrl(post.videoUrl);
      video.crossOrigin = 'anonymous';
      video.preload = 'metadata';
      video.muted = true;
      video.playsInline = true;
      video.addEventListener('loadeddata', async () => {
        try {
          video.currentTime = Math.min(1, video.duration || 1);
          const onSeeked = async () => {
            const canvas = document.createElement('canvas');
            const maxW = 640;
            const scale = Math.min(1, maxW / (video.videoWidth || 640));
            canvas.width = Math.max(1, Math.floor((video.videoWidth || 640) * scale));
            canvas.height = Math.max(1, Math.floor((video.videoHeight || 360) * scale));
            const ctx = canvas.getContext('2d');
            ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
            canvas.toBlob((b) => {
              if (b) resolve(b); else reject(new Error('썸네일 생성 실패'));
            }, 'image/jpeg', 0.85);
          };
          video.addEventListener('seeked', onSeeked, { once: true });
        } catch (err) { reject(err); }
      }, { once: true });
      video.onerror = reject;
    });

    // 업로드 및 문서 업데이트
    const uploaded = await uploadKaraokeThumbnail(blob, post.authorId || 'unknown');
    await updateKaraokePost(post.id, {
      thumbnailUrl: uploaded.url,
      thumbnailFileName: uploaded.fileName
    });

    // 로컬 상태 반영
    setPosts(prev => prev.map(p => p.id === post.id ? { ...p, thumbnailUrl: uploaded.url, thumbnailFileName: uploaded.fileName } : p));
  };

  const handlePostClick = async (postId) => {
    try {
      if (user) {
        await incrementViews(postId);
      }
      navigate(`/karaoke/${postId}`);
    } catch (error) {
      console.error("조회수 증가 오류:", error);
      navigate(`/karaoke/${postId}`);
    }
  };

  const handleUploadClick = () => {
    if (!user) {
      alert("영상을 업로드하려면 로그인이 필요합니다.");
      navigate("/login");
      return;
    }
    navigate("/karaoke/upload");
  };

  const handleLike = async (e, postId) => {
    e.stopPropagation();
    
    if (!user) {
      alert("좋아요를 누르려면 로그인이 필요합니다.");
      navigate("/login");
      return;
    }

    try {
      const isLiked = await toggleLike(postId, user.uid);
      
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

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-amber-50 via-orange-50 to-amber-100">
        <main className="pb-20 pt-16">
          <div className="max-w-4xl mx-auto px-4">
            <div className="text-center py-12">
              <p className="text-red-600 text-lg mb-4">{error}</p>
              <button
                onClick={loadKaraokePosts}
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
              <h1 className="text-2xl font-bold text-gray-800">비디오</h1>
              <button
                onClick={handleUploadClick}
                className="bg-amber-600 text-white px-4 py-2 rounded-lg hover:bg-amber-700 transition-colors flex items-center space-x-2"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
                <span>업로드</span>
              </button>
            </div>
            <p className="text-gray-600">비디오를 공유하고 소통해보세요</p>
            
            {/* 상태 메시지 표시 */}
            {statusMessage && (
              <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                <div className="flex items-center space-x-2">
                  <svg className="w-5 h-5 text-blue-600" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                  </svg>
                  <span className="text-blue-800 text-sm">{statusMessage}</span>
                </div>
              </div>
            )}
          </div>

          {posts.length === 0 ? (
            <div className="text-center py-12">
              <div className="text-gray-400 text-6xl mb-4">🎬</div>
                             <p className="text-gray-600 text-lg mb-2">아직 비디오가 없습니다</p>
                             <p className="text-gray-500 mb-6">첫 번째 비디오를 업로드해보세요!</p>
              <button
                onClick={handleUploadClick}
                className="bg-amber-600 text-white px-6 py-3 rounded-lg hover:bg-amber-700 transition-colors"
              >
                                 비디오 업로드하기
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {posts.map((post) => (
                <div
                  key={post.id}
                  className="bg-white rounded-lg shadow-md overflow-hidden cursor-pointer transform transition-transform hover:scale-105 hover:shadow-lg"
                >
                  <div className="relative cursor-pointer" onClick={() => handlePostClick(post.id)}>
                    <div className="w-full h-48 bg-gray-200 flex items-center justify-center relative overflow-hidden">
                      <video
                        ref={(el) => {
                          if (el) {
                            videoRefs.current[post.id] = el;
                          }
                        }}
                        data-video-id={post.id}
                        src={post.videoUrl}
                        className="w-full h-full object-cover"
                        muted
                        loop
                        playsInline
                        preload="metadata"
                        poster={post.thumbnailUrl || ""}
                        onError={(e) => {
                          const video = e.target;
                          const currentIndex = video.dataset.urlIndex || 0;
                          const alternativeUrls = post.alternativeUrls || [post.videoUrl];
                          
                          setLoadingVideos(prev => {
                            const newSet = new Set(prev);
                            newSet.delete(post.id);
                            return newSet;
                          });
                          
                          // 대체 URL이 있으면 시도
                          if (currentIndex < alternativeUrls.length - 1) {
                            const nextIndex = parseInt(currentIndex) + 1;
                            video.dataset.urlIndex = nextIndex;
                            video.src = alternativeUrls[nextIndex];
                          } else {
                            // 모든 URL 시도 실패 시 게시물 제거
                            console.warn(`비디오 파일을 찾을 수 없습니다. 게시물 제거: ${post.id} - ${post.title}`);
                            removeInvalidPost(post.id);
                          }
                        }}
                        onLoadStart={() => {
                          setLoadingVideos(prev => new Set(prev).add(post.id));
                        }}
                        onCanPlay={(e) => {
                          const video = e.target;
                          setLoadingVideos(prev => {
                            const newSet = new Set(prev);
                            newSet.delete(post.id);
                            return newSet;
                          });
                        }}
                        onPlay={() => {
                          setPlayingVideos(prev => new Set(prev).add(post.id));
                        }}
                        onPause={() => {
                          setPlayingVideos(prev => {
                            const newSet = new Set(prev);
                            newSet.delete(post.id);
                            return newSet;
                          });
                        }}
                      />
                      {/* 비디오 로딩 실패 시 표시할 placeholder */}
                      <div className="video-placeholder absolute inset-0 bg-gradient-to-br from-gray-200 to-gray-300 flex items-center justify-center text-gray-600" style={{display: 'none'}}>
                        <div className="text-center p-4">
                          <div className="text-4xl mb-2">🎬</div>
                          <div className="text-sm font-medium mb-1">비디오를 불러올 수 없습니다</div>
                          <div className="text-xs text-gray-500 mb-3">
                            파일이 삭제되었거나<br/>
                            네트워크 문제일 수 있습니다
                          </div>
                          <button 
                            onClick={(e) => {
                              e.stopPropagation();
                              window.location.reload();
                            }}
                            className="px-3 py-1 bg-blue-500 text-white text-xs rounded hover:bg-blue-600 transition-colors"
                          >
                            새로고침
                          </button>
                        </div>
                      </div>
                      {/* 재생/정지 버튼 오버레이 */}
                      <div className={`absolute inset-0 flex items-center justify-center transition-opacity duration-200 ${playingVideos.has(post.id) ? 'opacity-0 hover:opacity-100' : 'opacity-60 hover:opacity-100'}`}>
                        <div 
                          className="bg-black bg-opacity-50 rounded-full p-4 backdrop-blur-sm cursor-pointer hover:bg-opacity-70 transition-all duration-200"
                          onClick={(e) => {
                            e.stopPropagation();
                            const video = videoRefs.current[post.id];
                            if (video) {
                              if (video.paused) {
                                video.play().catch(console.error);
                              } else {
                                video.pause();
                              }
                            }
                          }}
                        >
                          {/* 재생 아이콘 */}
                          {!playingVideos.has(post.id) && (
                            <svg className="w-10 h-10 text-white" fill="currentColor" viewBox="0 0 20 20">
                              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM9.555 7.168A1 1 0 008 8v4a1 1 0 001.555.832l3-2a1 1 0 000-1.664l-3-2z" clipRule="evenodd" />
                            </svg>
                          )}
                          {/* 정지 아이콘 */}
                          {playingVideos.has(post.id) && (
                            <svg className="w-10 h-10 text-white" fill="currentColor" viewBox="0 0 20 20">
                              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8 7a1 1 0 00-1 1v4a1 1 0 102 0V8a1 1 0 00-1-1zm4 0a1 1 0 00-1 1v4a1 1 0 102 0V8a1 1 0 00-1-1z" clipRule="evenodd" />
                            </svg>
                          )}
                        </div>
                      </div>
                      
                      {/* 클릭 안내 텍스트 */}
                      <div className="absolute bottom-2 left-2 bg-black bg-opacity-70 text-white text-xs px-2 py-1 rounded opacity-0 hover:opacity-100 transition-opacity duration-200">
                        {playingVideos.has(post.id) ? '클릭하여 정지' : '클릭하여 재생'}
                      </div>
                      
                      
                      {/* 로딩 인디케이터 */}
                      {loadingVideos.has(post.id) && (
                        <div className="absolute top-2 right-2 bg-blue-500 text-white text-xs px-2 py-1 rounded-full flex items-center space-x-1">
                          <div className="w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                          <span>로딩중</span>
                        </div>
                      )}
                      
                      <div className="absolute bottom-2 left-2 bg-black bg-opacity-70 text-white text-xs px-2 py-1 rounded flex items-center space-x-1">
                        <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                          <path d="M2 6a2 2 0 012-2h6a2 2 0 012 2v8a2 2 0 01-2 2H4a2 2 0 01-2-2V6zM14.553 7.106A1 1 0 0014 8v4a1 1 0 00.553.894l2 1A1 1 0 0018 13V7a1 1 0 00-1.447-.894l-2 1z" />
                        </svg>
                        <span>비디오</span>
                      </div>
                    </div>
                    <div className="absolute top-2 right-2 bg-black bg-opacity-50 text-white text-xs px-2 py-1 rounded flex items-center space-x-1">
                      <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                        <path d="M2 6a2 2 0 012-2h6a2 2 0 012 2v8a2 2 0 01-2 2H4a2 2 0 01-2-2V6zM14.553 7.106A1 1 0 0014 8v4a1 1 0 00.553.894l2 1A1 1 0 0018 13V7a1 1 0 00-1.447-.894l-2 1z" />
                      </svg>
                      <span>{formatDate(post.createdAt)}</span>
                    </div>
                  </div>
                  <div className="p-4">
                    <h3 
                      className="font-semibold text-gray-800 mb-2 line-clamp-2 cursor-pointer hover:text-blue-600 transition-colors"
                      onClick={() => handlePostClick(post.id)}
                    >
                      {post.title}
                    </h3>
                    {post.description && (
                      <p 
                        className="text-sm text-gray-600 mb-3 line-clamp-2 cursor-pointer hover:text-blue-600 transition-colors"
                        onClick={() => handlePostClick(post.id)}
                      >
                        {post.description}
                      </p>
                    )}
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 text-sm">
                      <div className="flex flex-col">
                        <span className="text-gray-500 text-xs mb-1">작성자</span>
                        <span 
                          className="font-medium text-gray-800 hover:text-amber-600 cursor-pointer transition-colors"
                          onClick={(e) => {
                            e.stopPropagation();
                            navigateToDM(post.authorId, user, navigate);
                          }}
                          title="1:1 채팅하기"
                        >
                          {post.author}
                        </span>
                      </div>
                      <div className="flex flex-col">
                        <span className="text-gray-500 text-xs mb-1">좋아요</span>
                        <button
                          onClick={(e) => handleLike(e, post.id)}
                          className={`flex items-center space-x-1 transition-colors ${
                            isLikedByUser(post) ? 'text-red-500' : 'text-gray-500 hover:text-red-500'
                          }`}
                        >
                          <svg className="w-4 h-4" fill={isLikedByUser(post) ? "currentColor" : "none"} stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                          </svg>
                          <span className={isLikedByUser(post) ? "text-red-500 font-semibold" : "text-gray-600"}>{post.likes || 0}</span>
                        </button>
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

export default Karaoke;
