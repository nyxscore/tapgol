import React, { useState, useEffect } from "react";
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
      
      // 비디오 파일 존재 여부 확인 (비동기)
      const validPosts = [];
      const invalidPosts = [];
      
      for (const post of videoOnly) {
        try {
          if (post.videoFileName) {
            const videoRef = ref(storage, `karaoke/${post.videoFileName}`);
            await getDownloadURL(videoRef);
            validPosts.push(post);
          } else {
            // 파일명이 없는 경우는 일단 유효한 것으로 간주
            validPosts.push(post);
          }
        } catch (error) {
          if (error.code === 'storage/object-not-found') {
            invalidPosts.push(post);
            console.log(`무효한 비디오 게시물 발견: ${post.id} - ${post.title || '제목 없음'}`);
          } else {
            // 다른 오류는 일단 유효한 것으로 간주
            validPosts.push(post);
          }
        }
      }
      
      if (invalidPosts.length > 0) {
        console.log(`${invalidPosts.length}개의 무효한 비디오 게시물이 필터링되었습니다.`);
      }
      
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
  // Storage URL 정규화 (잘못 저장된 버킷/도메인 보정)
  const normalizeStorageUrl = (url) => {
    if (!url || typeof url !== 'string') return url;
    const fixAll = (s, from, to) => (s || '').split(from).join(to);
    let fixed = url;
    fixed = fixAll(fixed, 'tabgol-4f728.firebasestorage.app', 'tabgol-4f728.appspot.com');
    fixed = fixAll(fixed, 'b/tabgol-4f728.firebasestorage.app', 'b/tabgol-4f728.appspot.com');
    fixed = fixAll(fixed, 'https://firebasestorage.app', 'https://firebasestorage.googleapis.com');
    return fixed;
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
                  onClick={() => handlePostClick(post.id)}
                  className="bg-white rounded-lg shadow-md overflow-hidden cursor-pointer transform transition-transform hover:scale-105 hover:shadow-lg"
                >
                  <div className="relative">
                    <div className="w-full h-48 bg-gray-200 flex items-center justify-center relative overflow-hidden">
                      <video
                        src={normalizeStorageUrl(post.videoUrl)}
                        className="w-full h-full object-cover"
                        muted
                        preload="metadata"
                        poster={normalizeStorageUrl(post.thumbnailUrl) || ""}
                        crossOrigin="anonymous"
                        onError={(e) => {
                          try {
                            const el = e.currentTarget;
                            console.log(`비디오 로딩 실패: ${post.videoUrl}`);
                            // 파일이 존재하지 않는 경우 placeholder 표시
                            el.style.display = 'none';
                            const placeholder = el.parentElement.querySelector('.video-placeholder');
                            if (placeholder) {
                              placeholder.style.display = 'flex';
                            }
                          } catch {}
                        }}
                        onLoadedMetadata={(e) => {
                          // 동영상 메타데이터 로드 후 첫 번째 프레임을 썸네일로 사용
                          const video = e.target;
                          const canvas = document.createElement('canvas');
                          canvas.width = video.videoWidth;
                          canvas.height = video.videoHeight;
                          const ctx = canvas.getContext('2d');
                          ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
                          if (!post.thumbnailUrl) {
                            video.style.backgroundImage = `url(${canvas.toDataURL()})`;
                          }
                          video.style.backgroundSize = 'cover';
                          video.style.backgroundPosition = 'center';
                        }}
                        onMouseOver={async (e) => {
                          try {
                            await e.target.play();
                          } catch (error) {
                            // AbortError는 무시 (사용자가 빠르게 마우스를 움직일 때 발생)
                            if (error.name !== 'AbortError') {
                              console.error('비디오 재생 오류:', error);
                            }
                          }
                        }}
                        onMouseOut={(e) => {
                          try {
                            e.target.pause();
                            e.target.currentTime = 0;
                          } catch (error) {
                            console.error('비디오 일시정지 오류:', error);
                          }
                        }}
                      />
                      {/* 비디오 로딩 실패 시 표시할 placeholder */}
                      <div className="video-placeholder absolute inset-0 bg-gray-300 flex items-center justify-center text-gray-600" style={{display: 'none'}}>
                        <div className="text-center">
                          <div className="text-4xl mb-2">🎬</div>
                          <div className="text-sm">비디오를 불러올 수 없습니다</div>
                        </div>
                      </div>
                      <div className="absolute inset-0 bg-black bg-opacity-30 flex items-center justify-center">
                        <div className="bg-white bg-opacity-20 rounded-full p-3 backdrop-blur-sm">
                          <svg className="w-8 h-8 text-white" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM9.555 7.168A1 1 0 008 8v4a1 1 0 001.555.832l3-2a1 1 0 000-1.664l-3-2z" clipRule="evenodd" />
                          </svg>
                        </div>
                      </div>
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
                    <h3 className="font-semibold text-gray-800 mb-2 line-clamp-2">{post.title}</h3>
                    {post.description && (
                      <p className="text-sm text-gray-600 mb-3 line-clamp-2">{post.description}</p>
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
