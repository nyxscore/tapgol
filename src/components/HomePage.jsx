import React, { useState, useEffect, useRef, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";
import { getAllPosts } from "../util/postService";
import { getAllGalleryItems } from "../util/galleryService";
import { getAllKaraokePosts } from "../util/karaokeService";
import { getAllCookingPosts } from "../util/cookingService";
import { getAllHealthPosts } from "../util/healthService";
import { getAllMarketplacePosts } from "../util/marketplaceService";
import { getAllPhilosophyPosts, toggleLike as togglePhilosophyLike } from "../util/philosophyService";
import { toggleLike as togglePostLike } from "../util/postService";
import { toggleLike as toggleGalleryLike } from "../util/galleryService";
import { toggleLike as toggleKaraokeLike } from "../util/karaokeService";
import { toggleLike as toggleCookingLike } from "../util/cookingService";
import { toggleLike as toggleHealthLike } from "../util/healthService";
import { toggleLike as toggleMarketplaceLike } from "../util/marketplaceService";
import Wisdom from "./Wisdom";
import { navigateToDM } from '../util/dmUtils';
import { getComments, migrateCommentsBoardType, diagnoseComments, recalculatePostCommentCount } from '../util/commentService';
import { collection, getDocs, query, where } from 'firebase/firestore';
import { db } from '../util/firebase';
import ReportModal from './ReportModal';
import ZoomableImage from './ZoomableImage';
import { useContentZoom } from '../hooks/useContentZoom';

// 비디오 URL 정규화 함수 (Karaoke.jsx와 동일)
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

const HomePage = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [allPosts, setAllPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [visibleVideos, setVisibleVideos] = useState(new Set()); // 화면에 보이는 비디오들
  const [loadingVideos, setLoadingVideos] = useState(new Set()); // 로딩 중인 비디오들
  const [likedPosts, setLikedPosts] = useState(new Set()); // 좋아요한 포스트들
  const [commentCounts, setCommentCounts] = useState({}); // 실제 댓글 수 캐시
  const [loadingCommentCounts, setLoadingCommentCounts] = useState(new Set()); // 댓글 수 로딩 중인 포스트들
  const [loadingLikes, setLoadingLikes] = useState(new Set()); // 좋아요 처리 중인 포스트들
  const videoRefs = useRef({}); // 각 비디오 엘리먼트 참조
  
  // 신고 관련 상태
  const [showReportModal, setShowReportModal] = useState(false);
  const [reportTarget, setReportTarget] = useState(null);
  const [showDropdown, setShowDropdown] = useState(null); // 드롭다운 메뉴 표시 상태
  
  // 토스트 알림 상태
  const [toast, setToast] = useState({ show: false, message: '', type: 'success' });
  
  // 스토리 스크롤 상태
  const [storyScrollState, setStoryScrollState] = useState({ canScrollLeft: false, canScrollRight: true });

  // 스토리 스크롤 상태 체크 함수
  const checkStoryScrollState = useCallback(() => {
    const scrollContainer = document.getElementById('story-scroll');
    if (scrollContainer) {
      const { scrollLeft, scrollWidth, clientWidth } = scrollContainer;
      setStoryScrollState({
        canScrollLeft: scrollLeft > 0,
        canScrollRight: scrollLeft < scrollWidth - clientWidth - 1
      });
    }
  }, []);


  // 스토리 스크롤 상태 초기화 및 마우스 휠 이벤트 설정
  useEffect(() => {
    const timer = setTimeout(() => {
      checkStoryScrollState();
    }, 100);

    // 마우스 휠 이벤트 리스너 추가 (passive: false로 설정)
    const scrollContainer = document.getElementById('story-scroll');
    const wheelHandler = (e) => {
      e.preventDefault();
      if (scrollContainer) {
        scrollContainer.scrollLeft += e.deltaY;
        setTimeout(checkStoryScrollState, 50);
      }
    };

    if (scrollContainer) {
      scrollContainer.addEventListener('wheel', wheelHandler, { passive: false });
    }

    return () => {
      clearTimeout(timer);
      if (scrollContainer) {
        scrollContainer.removeEventListener('wheel', wheelHandler);
      }
    };
  }, [checkStoryScrollState]);

  // 좋아요 토글 함수
  const handleLike = async (e, postId) => {
    e.stopPropagation();
    if (!user) {
      alert('로그인이 필요합니다.');
      return;
    }
    
    // 이미 처리 중이면 중복 요청 방지
    if (loadingLikes.has(postId)) {
      return;
    }
    
    setLoadingLikes(prev => new Set(prev).add(postId));
    
    try {
      // 포스트 타입에 따라 적절한 toggleLike 함수 호출
      const post = allPosts.find(p => p.id === postId);
      if (!post) {
        console.error('포스트를 찾을 수 없습니다:', postId);
        return;
      }
      
      let isLiked;
      switch (post.boardType) {
        case 'board':
          isLiked = await togglePostLike(postId, user.uid);
          break;
        case 'gallery':
          isLiked = await toggleGalleryLike(postId, user.uid);
          break;
        case 'karaoke':
          isLiked = await toggleKaraokeLike(postId, user.uid);
          break;
        case 'cooking':
          isLiked = await toggleCookingLike(postId, user.uid);
          break;
        case 'health':
          isLiked = await toggleHealthLike(postId, user.uid);
          break;
        case 'philosophy':
          isLiked = await togglePhilosophyLike(postId, user.uid);
          break;
        case 'marketplace':
          isLiked = await toggleMarketplaceLike(postId, user.uid);
          break;
        default:
          console.error('알 수 없는 게시판 타입:', post.boardType);
          return;
      }
      
      // 로컬 상태 업데이트
      setLikedPosts(prev => {
        const newSet = new Set(prev);
        if (isLiked) {
          newSet.add(postId);
        } else {
          newSet.delete(postId);
        }
        return newSet;
      });
      
      // 포스트의 좋아요 수 업데이트
      setAllPosts(prev => prev.map(p => 
        p.id === postId 
          ? { 
              ...p, 
              likes: isLiked 
                ? (p.likes || 0) + 1
                : Math.max(0, (p.likes || 0) - 1)
            }
          : p
      ));
      
      console.log('좋아요 토글 완료:', { postId, isLiked, boardType: post.boardType });
    } catch (error) {
      console.error('좋아요 토글 오류:', error);
      alert('좋아요 처리 중 오류가 발생했습니다.');
    } finally {
      setLoadingLikes(prev => {
        const newSet = new Set(prev);
        newSet.delete(postId);
        return newSet;
      });
    }
  };

  // 좋아요 상태 확인 함수
  const isLikedByUser = (postId) => {
    return likedPosts.has(postId);
  };

  // 게시판 타입에 따른 경로 반환 함수
  const getBoardPath = (boardType) => {
    switch (boardType) {
      case 'board':
        return '/board';
      case 'gallery':
        return '/gallery';
      case 'karaoke':
        return '/karaoke';
      case 'cooking':
        return '/cooking';
      case 'health':
        return '/health';
      case 'philosophy':
        return '/philosophy';
      case 'marketplace':
        return '/marketplace';
      default:
        return '/board'; // 기본값
    }
  };

  // 신고 관련 함수들
  const handleReport = (post) => {
    if (!user) {
      alert("신고하려면 로그인이 필요합니다.");
      return;
    }
    setReportTarget(post);
    setShowReportModal(true);
    setShowDropdown(null); // 드롭다운 닫기
  };

  const handleReportSuccess = (reportId) => {
    showToast("신고가 성공적으로 접수되었습니다.", 'success');
  };

  // 토스트 알림 함수
  const showToast = (message, type = 'success') => {
    setToast({ show: true, message, type });
    setTimeout(() => {
      setToast({ show: false, message: '', type: 'success' });
    }, 3000);
  };

  const handleDropdownToggle = (postId, e) => {
    e.stopPropagation();
    setShowDropdown(showDropdown === postId ? null : postId);
  };

  // 사용자 프로필 조회 기능
  const handleUserProfileClick = (e, post) => {
    e.stopPropagation();
    const targetUserId = post.authorId || post.userId || post.uid;
    
    if (targetUserId) {
      // 사용자 프로필 페이지로 이동
      navigate(`/profile/${targetUserId}`);
    } else {
      showToast('사용자 정보를 찾을 수 없습니다.', 'error');
    }
  };

  // 공유 기능
  const handleShare = async (post) => {
    try {
      // 공유할 URL 생성 (현재 도메인 + 게시글 상세 페이지)
      const baseUrl = window.location.origin;
      const postUrl = `${baseUrl}${getBoardPath(post.boardType)}/${post.id}`;
      
      // 공유할 텍스트 생성
      const shareText = `${post.title}\n\n${post.description || post.content || ''}\n\n${postUrl}`;
      
      // Web Share API 지원 확인
      if (navigator.share && navigator.canShare) {
        const shareData = {
          title: post.title,
          text: post.description || post.content || '',
          url: postUrl
        };
        
        if (navigator.canShare(shareData)) {
          await navigator.share(shareData);
          return;
        }
      }
      
      // Web Share API를 지원하지 않는 경우 클립보드에 복사
      await navigator.clipboard.writeText(shareText);
      showToast('게시글 링크가 클립보드에 복사되었습니다!', 'success');
      
    } catch (error) {
      console.error('공유 기능 오류:', error);
      
      // 클립보드 복사 실패 시 fallback
      try {
        // 구식 방법으로 클립보드 복사
        const textArea = document.createElement('textarea');
        textArea.value = `${post.title}\n\n${post.description || post.content || ''}\n\n${window.location.origin}${getBoardPath(post.boardType)}/${post.id}`;
        document.body.appendChild(textArea);
        textArea.select();
        document.execCommand('copy');
        document.body.removeChild(textArea);
        
        showToast('게시글 링크가 클립보드에 복사되었습니다!', 'success');
      } catch (fallbackError) {
        console.error('클립보드 복사 실패:', fallbackError);
        showToast('공유 기능을 사용할 수 없습니다. 브라우저를 업데이트해주세요.', 'error');
      }
    } finally {
      setShowDropdown(null); // 드롭다운 닫기
    }
  };

  // 드롭다운 외부 클릭 시 닫기
  useEffect(() => {
    const handleClickOutside = () => {
      setShowDropdown(null);
    };
    
    if (showDropdown) {
      document.addEventListener('click', handleClickOutside);
      return () => document.removeEventListener('click', handleClickOutside);
    }
  }, [showDropdown]);

  // 간단한 댓글 수 계산 함수 (직접 Firestore 조회) - 안전한 버전
  const calculateCommentCountSimple = async (postId) => {
    try {
      // postId로만 조회하여 모든 댓글 개수 확인
      const commentsQuery = query(
        collection(db, "comments"),
        where("postId", "==", postId)
      );
      
      const commentsSnapshot = await getDocs(commentsQuery);
      const count = commentsSnapshot.size;
      
      setCommentCounts(prev => ({
        ...prev,
        [postId]: count
      }));
      
      return count;
    } catch (error) {
      console.error(`댓글 수 계산 오류 (${postId}):`, error);
      setCommentCounts(prev => ({
        ...prev,
        [postId]: 0
      }));
      return 0;
    }
  };

  // 실제 댓글 수 계산 함수
  const calculateCommentCount = async (postId, boardType) => {
    // 이미 로딩 중이면 중복 요청 방지
    if (loadingCommentCounts.has(postId)) {
      return;
    }
    
    setLoadingCommentCounts(prev => new Set(prev).add(postId));
    
    try {
      // 먼저 간단한 방법으로 시도
      const simpleCount = await calculateCommentCountSimple(postId);
      
      if (simpleCount > 0) {
        return simpleCount;
      }
      
      // 간단한 방법으로 댓글이 없으면 기존 방법으로 시도
      const comments = await getComments(postId, boardType);
      
      setCommentCounts(prev => ({
        ...prev,
        [postId]: comments.length
      }));
      return comments.length;
    } catch (error) {
      console.error(`댓글 수 계산 오류 (${postId}, ${boardType}):`, error);
      return 0;
    } finally {
      setLoadingCommentCounts(prev => {
        const newSet = new Set(prev);
        newSet.delete(postId);
        return newSet;
      });
    }
  };

  // 포스트 로드 후 댓글 수 계산 및 좋아요 상태 확인 (최적화: 처음 10개만)
  useEffect(() => {
    if (allPosts.length > 0 && user) {
      // 처음 10개 포스트의 댓글 수와 좋아요 상태를 미리 계산 (성능 최적화)
      const calculateInitialData = async () => {
        const initialPosts = allPosts.slice(0, 10);
        
        // 댓글 수 계산 (간단한 방법 사용)
        const commentPromises = initialPosts.map(async (post) => {
          const actualCount = await calculateCommentCountSimple(post.id);
          return { postId: post.id, count: actualCount };
        });
        
        // 좋아요 상태 확인
        const likedPostIds = initialPosts.filter(post => {
          // likedBy 배열에 현재 사용자 ID가 있는지 확인
          return post.likedBy && post.likedBy.includes(user.uid);
        }).map(post => post.id);
        
        // 좋아요한 포스트들 설정
        if (likedPostIds.length > 0) {
          setLikedPosts(prev => {
            const newSet = new Set(prev);
            likedPostIds.forEach(id => newSet.add(id));
            return newSet;
          });
        }
        
        await Promise.all(commentPromises);
      };
      
      calculateInitialData();
    }
  }, [allPosts, user]);

  useEffect(() => {
    loadAllPosts();
  }, []);

  // 비디오 엘리먼트가 추가될 때마다 Intersection Observer에 등록
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          const videoId = entry.target.dataset.videoId;
          const video = entry.target;
          
          if (entry.isIntersecting && entry.intersectionRatio >= 0.5) {
            // 화면에 50% 이상 보이면 재생
            if (!visibleVideos.has(videoId)) {
              setVisibleVideos(prev => new Set(prev).add(videoId));
              
              // 이미 재생 중이거나 재생 시도 중인 비디오는 건너뛰기
              if (video && video.paused && !video.dataset.playingAttempted) {
                video.dataset.playingAttempted = 'true';
                
                // 즉시 재생 시도
                const tryPlay = () => {
                  if (video && video.paused) {
                    if (video.readyState >= 1) {
                      video.play().catch((error) => {
                        // 재생 실패 시 재시도 횟수 제한
                        const retryCount = video.dataset.retryCount || 0;
                        if (retryCount < 2) {
                          video.dataset.retryCount = (parseInt(retryCount) + 1).toString();
                          setTimeout(tryPlay, 500);
                        }
                      });
                    } else {
                      setTimeout(tryPlay, 200);
                    }
                  }
                };
                
                // 재생 시도
                tryPlay();
              }
            }
          } else {
            // 화면에서 벗어나면 정지
            setVisibleVideos(prev => {
              const newSet = new Set(prev);
              newSet.delete(videoId);
              return newSet;
            });
            
            if (video && !video.paused) {
              video.pause();
              video.currentTime = 0;
            }
            
            // 재생 시도 플래그 리셋 (다시 화면에 들어올 때 재생 시도 가능)
            if (video) {
              video.dataset.playingAttempted = 'false';
            }
          }
        });
      },
      {
        threshold: 0.5,
        rootMargin: '0px'
      }
    );

    // 모든 비디오 엘리먼트 관찰
    Object.values(videoRefs.current).forEach((video) => {
      if (video) {
        observer.observe(video);
      }
    });

    return () => {
      observer.disconnect();
    };
  }, [allPosts.length]); // 포스트 개수가 변경될 때만 재설정

  const loadAllPosts = useCallback(async () => {
    try {
      // 이미 로딩 중이면 중복 호출 방지
      if (allPosts.length > 0) return;
      
      const [posts, gallery, karaoke, cooking, health, marketplace, philosophy] = await Promise.all([
        getAllPosts().catch(err => { console.error("posts 로드 오류:", err); return []; }),
        getAllGalleryItems().catch(err => { console.error("gallery 로드 오류:", err); return []; }),
        getAllKaraokePosts().catch(err => { console.error("karaoke 로드 오류:", err); return []; }),
        getAllCookingPosts().catch(err => { console.error("cooking 로드 오류:", err); return []; }),
        getAllHealthPosts().catch(err => { console.error("health 로드 오류:", err); return []; }),
        getAllMarketplacePosts().catch(err => { console.error("marketplace 로드 오류:", err); return []; }).then(data => {
          console.log('중고장터 원본 데이터:', data);
          return data;
        }),
        getAllPhilosophyPosts().catch(err => { console.error("philosophy 로드 오류:", err); return []; })
      ]);


      // 모든 포스트를 하나의 배열로 합치고 날짜순 정렬 (오늘의 지혜 제외)
      const combined = [
        ...posts.map(p => ({ ...p, type: 'post', boardType: 'board' })),
        ...gallery.map(g => {
          return { 
            ...g, 
            type: 'gallery', 
            boardType: 'gallery',
            imageUrl: g.fileUrl,
            title: g.title || '추억앨범',
            description: g.description || '',
            author: g.uploader || '익명',
            authorId: g.uploaderId
          };
        }).filter(g => g.fileUrl), // 이미지가 있는 갤러리 포스트만 필터링
        ...karaoke.map(k => {
          // karaoke 포스트에 대체 URL 추가
          const alternativeUrls = k.videoUrl ? getAlternativeUrls(k.videoUrl) : [];
          return { 
            ...k, 
            type: 'karaoke', 
            boardType: 'karaoke',
            videoUrl: alternativeUrls[0] || k.videoUrl,
            alternativeUrls: alternativeUrls
          };
        }),
        ...cooking.map(c => {
          console.log('요리 아이템 매핑:', {
            id: c.id,
            title: c.title,
            images: c.images,
            hasImages: !!(c.images && c.images.length > 0)
          });
          return { 
            ...c, 
            type: 'cooking', 
            boardType: 'cooking',
            imageUrl: c.images && c.images.length > 0 ? c.images[0] : null
          };
        }).filter(c => c.images && c.images.length > 0), // 이미지가 있는 요리 포스트만 필터링
        ...health.map(h => {
          console.log('건강 아이템 매핑:', {
            id: h.id,
            title: h.title,
            images: h.images,
            hasImages: !!(h.images && h.images.length > 0)
          });
          return { 
            ...h, 
            type: 'health', 
            boardType: 'health',
            imageUrl: h.images && h.images.length > 0 ? h.images[0] : null
          };
        }).filter(h => h.images && h.images.length > 0), // 이미지가 있는 건강 포스트만 필터링
        ...marketplace.map(m => {
          // 다양한 이미지 필드명 확인
          const imageUrl = m.images && m.images.length > 0 ? m.images[0] : 
                          m.imageUrl || 
                          m.fileUrl || 
                          m.thumbnailUrl || 
                          null;
          
          console.log('중고장터 아이템 매핑:', {
            id: m.id,
            title: m.title,
            images: m.images,
            imageUrl: m.imageUrl,
            fileUrl: m.fileUrl,
            thumbnailUrl: m.thumbnailUrl,
            finalImageUrl: imageUrl,
            hasImages: !!(m.images && m.images.length > 0),
            hasImageUrl: !!m.imageUrl,
            hasFileUrl: !!m.fileUrl,
            hasThumbnailUrl: !!m.thumbnailUrl
          });
          
          return { 
            ...m, 
            type: 'marketplace', 
            boardType: 'marketplace',
            imageUrl: imageUrl
          };
        }).filter(m => {
          // 이미지가 있는 중고장터 포스트만 필터링
          const hasImage = (m.images && m.images.length > 0) || 
                          m.imageUrl || 
                          m.fileUrl || 
                          m.thumbnailUrl;
          return hasImage;
        }),
        ...philosophy.map(p => ({ ...p, type: 'philosophy', boardType: 'philosophy' }))
      ].sort((a, b) => {
        const dateA = a.createdAt?.toDate ? a.createdAt.toDate() : new Date(a.createdAt);
        const dateB = b.createdAt?.toDate ? b.createdAt.toDate() : new Date(b.createdAt);
        return dateB - dateA;
      });

      setAllPosts(combined);
      
      // 포스트 로딩 후 처음 20개 포스트의 댓글 수 계산
      const initialPosts = combined.slice(0, 20);
      
      // 댓글 수 계산을 병렬로 실행
      const commentCountPromises = initialPosts.map(post => {
        if (commentCounts[post.id] === undefined) {
          return calculateCommentCountSimple(post.id);
        }
        return Promise.resolve(commentCounts[post.id]);
      });
      
      // 모든 댓글 수 계산이 완료될 때까지 대기
      Promise.all(commentCountPromises).catch(error => {
        console.error('댓글 수 계산 중 오류:', error);
      });
      
    } catch (error) {
      console.error("포스트 로드 오류:", error);
    } finally {
      setLoading(false);
    }
  }, [allPosts.length]);

  const formatDate = (timestamp) => {
    if (!timestamp) return "";
    const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
    const now = new Date();
    const diff = now - date;
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);

    if (minutes < 1) return "방금 전";
    if (minutes < 60) return `${minutes}분 전`;
    if (hours < 24) return `${hours}시간 전`;
    if (days < 7) return `${days}일 전`;
    return date.toLocaleDateString();
  };

  const getBoardName = (type) => {
    const names = {
      'post': '모임게시판',
      'gallery': '추억앨범',
      'karaoke': '비디오',
      'cooking': '나만의요리',
      'health': '건강정보',
      'marketplace': '중고장터',
      'philosophy': '개똥철학'
    };
    return names[type] || '게시판';
  };

  const handlePostClick = (post) => {
    const paths = {
      'post': `/board/${post.id}`,
      'gallery': `/gallery/${post.id}`,
      'karaoke': `/karaoke/${post.id}`,
      'cooking': `/cooking/${post.id}`,
      'health': `/health/${post.id}`,
      'marketplace': `/marketplace/${post.id}`,
      'philosophy': `/philosophy/${post.id}`
    };
    navigate(paths[post.type]);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-amber-50 pt-14 pb-16">
        <div className="flex flex-col items-center justify-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-amber-600"></div>
          <p className="mt-2 text-gray-600">로딩 중...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-amber-50 pt-14 pb-16">
      <div className="max-w-md mx-auto">
        {/* 스토리 섹션 */}
        <div className="bg-white mb-2">
          <div className="p-4 relative">
            {/* 왼쪽 스크롤 화살표 (데스크톱에서만 표시, 스크롤 가능할 때만) */}
            {storyScrollState.canScrollLeft && (
              <button
                className="hidden md:block absolute left-2 top-1/2 transform -translate-y-1/2 z-10 bg-white/80 hover:bg-white shadow-lg rounded-full p-2 transition-all duration-200 hover:scale-110"
                onClick={() => {
                  const scrollContainer = document.getElementById('story-scroll');
                  if (scrollContainer) {
                    scrollContainer.scrollBy({ left: -200, behavior: 'smooth' });
                    setTimeout(checkStoryScrollState, 300);
                  }
                }}
                title="왼쪽으로 스크롤"
              >
                <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
              </button>
            )}

            {/* 오른쪽 스크롤 화살표 (데스크톱에서만 표시, 스크롤 가능할 때만) */}
            {storyScrollState.canScrollRight && (
              <button
                className="hidden md:block absolute right-2 top-1/2 transform -translate-y-1/2 z-10 bg-white/80 hover:bg-white shadow-lg rounded-full p-2 transition-all duration-200 hover:scale-110"
                onClick={() => {
                  const scrollContainer = document.getElementById('story-scroll');
                  if (scrollContainer) {
                    scrollContainer.scrollBy({ left: 200, behavior: 'smooth' });
                    setTimeout(checkStoryScrollState, 300);
                  }
                }}
                title="오른쪽으로 스크롤"
              >
                <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </button>
            )}

            <div 
              id="story-scroll"
              className="flex space-x-4 overflow-x-auto scrollbar-hide smooth-wheel-scroll"
              onScroll={checkStoryScrollState}
            >
              <button 
                onClick={() => navigate('/gallery')}
                className="flex flex-col items-center space-y-1 min-w-[60px] hover:scale-105 transition-transform"
              >
                <div className="w-14 h-14 rounded-full bg-gradient-to-tr from-yellow-400 via-red-500 to-pink-500 p-[2px]">
                  <div className="w-full h-full rounded-full bg-white flex items-center justify-center">
                    <span className="text-2xl">📸</span>
                  </div>
                </div>
                <span className="text-xs text-gray-600">추억앨범</span>
              </button>
              <button 
                onClick={() => navigate('/karaoke')}
                className="flex flex-col items-center space-y-1 min-w-[60px] hover:scale-105 transition-transform"
              >
                <div className="w-14 h-14 rounded-full bg-gradient-to-tr from-blue-400 via-purple-500 to-pink-500 p-[2px]">
                  <div className="w-full h-full rounded-full bg-white flex items-center justify-center">
                    <span className="text-2xl">🎬</span>
                  </div>
                </div>
                <span className="text-xs text-gray-600">비디오</span>
              </button>
              <button 
                onClick={() => navigate('/cooking')}
                className="flex flex-col items-center space-y-1 min-w-[60px] hover:scale-105 transition-transform"
              >
                <div className="w-14 h-14 rounded-full bg-gradient-to-tr from-green-400 to-blue-500 p-[2px]">
                  <div className="w-full h-full rounded-full bg-white flex items-center justify-center">
                    <span className="text-2xl">👨‍🍳</span>
                  </div>
                </div>
                <span className="text-xs text-gray-600">나만의요리</span>
              </button>
              <button 
                onClick={() => navigate('/marketplace')}
                className="flex flex-col items-center space-y-1 min-w-[60px] hover:scale-105 transition-transform"
              >
                <div className="w-14 h-14 rounded-full bg-gradient-to-tr from-orange-400 to-red-500 p-[2px]">
                  <div className="w-full h-full rounded-full bg-white flex items-center justify-center">
                    <span className="text-2xl">🛒</span>
                  </div>
                </div>
                <span className="text-xs text-gray-600">중고장터</span>
              </button>
              <button 
                onClick={() => navigate('/board')}
                className="flex flex-col items-center space-y-1 min-w-[60px] hover:scale-105 transition-transform"
              >
                <div className="w-14 h-14 rounded-full bg-gradient-to-tr from-purple-400 to-indigo-500 p-[2px]">
                  <div className="w-full h-full rounded-full bg-white flex items-center justify-center">
                    <span className="text-2xl">📋</span>
                  </div>
                </div>
                <span className="text-xs text-gray-600">모임게시판</span>
              </button>
              <button 
                onClick={() => navigate('/health')}
                className="flex flex-col items-center space-y-1 min-w-[60px] hover:scale-105 transition-transform"
              >
                <div className="w-14 h-14 rounded-full bg-gradient-to-tr from-green-400 to-emerald-500 p-[2px]">
                  <div className="w-full h-full rounded-full bg-white flex items-center justify-center">
                    <span className="text-2xl">💪</span>
                  </div>
                </div>
                <span className="text-xs text-gray-600">건강정보</span>
              </button>
              <button 
                onClick={() => navigate('/philosophy')}
                className="flex flex-col items-center space-y-1 min-w-[60px] hover:scale-105 transition-transform"
              >
                <div className="w-14 h-14 rounded-full bg-gradient-to-tr from-indigo-400 to-purple-500 p-[2px]">
                  <div className="w-full h-full rounded-full bg-white flex items-center justify-center">
                    <span className="text-2xl">🤔</span>
                  </div>
                </div>
                <span className="text-xs text-gray-600">개똥철학</span>
              </button>
            </div>
          </div>
        </div>

        {/* 피드 포스트들 */}
        <div className="space-y-2">
          {allPosts.map((post) => (
            <div key={`${post.type}-${post.id}`} className="bg-white">
              {/* 포스트 헤더 */}
              <div className="flex items-center justify-between p-3 border-b border-gray-100">
                <div className="flex items-center space-x-3">
                  <div className="w-8 h-8 rounded-full bg-amber-500 flex items-center justify-center">
                    <span className="text-white text-sm font-bold">
                      {post.author?.charAt(0) || '익'}
                    </span>
                  </div>
                  <div>
                    <div className="flex items-center space-x-1">
                      <button
                        onClick={(e) => handleUserProfileClick(e, post)}
                        className="font-semibold text-sm text-gray-900 hover:text-blue-600 transition-colors"
                      >
                        {post.author || '익명'}
                      </button>
                      <span className="text-xs text-gray-500">•</span>
                      <span className="text-xs text-gray-500">{getBoardName(post.type)}</span>
                    </div>
                    <span className="text-xs text-gray-400">{formatDate(post.createdAt)}</span>
                  </div>
                </div>
                <div className="flex items-center space-x-2">
                  {/* 모임 종류 버튼 (board 타입만) */}
                  {post.type === 'post' && post.category && (
                    <span className={`px-2 py-1 rounded-full text-xs font-bold ${
                      post.category === "정기모임" 
                        ? "bg-red-500 text-white shadow-md" 
                        : post.category === "벙개모임"
                        ? "bg-purple-500 text-white shadow-md"
                        : post.category === "이벤트"
                        ? "bg-green-100 text-green-800"
                        : post.category === "공지"
                        ? "bg-red-100 text-red-800"
                        : "bg-red-500 text-white shadow-md"
                    }`}>
                      {post.category === "정기모임" ? '🔥 정기모임' : 
                       post.category === "벙개모임" ? '🍻 벙개모임' :
                       post.category === "이벤트" ? '📅 이벤트' :
                       post.category === "공지" ? '📢 공지' :
                       '🔥 정기모임'}
                    </span>
                  )}
                  <div className="relative">
                    <button 
                      className="p-1 hover:bg-gray-100 rounded-full transition-colors"
                      onClick={(e) => handleDropdownToggle(`${post.type}-${post.id}`, e)}
                    >
                    <svg className="w-5 h-5 text-gray-600" fill="currentColor" viewBox="0 0 20 20">
                      <path d="M10 6a2 2 0 110-4 2 2 0 010 4zM10 12a2 2 0 110-4 2 2 0 010 4zM10 18a2 2 0 110-4 2 2 0 010 4z" />
                    </svg>
                  </button>
                  
                  {/* 드롭다운 메뉴 */}
                  {showDropdown === `${post.type}-${post.id}` && (
                    <div className="absolute right-0 top-full mt-1 w-36 bg-white border border-gray-200 rounded-lg shadow-lg z-20">
                      <button
                        className="w-full px-3 py-2 text-left text-sm text-gray-700 hover:bg-gray-100 transition-colors rounded-t-lg"
                        onClick={(e) => {
                          e.stopPropagation();
                          const targetUserId = post.authorId || post.userId || post.uid;
                          
                          if (user && targetUserId) {
                            navigateToDM(targetUserId, user, navigate);
                          } else if (!user) {
                            alert('1:1 채팅을 하려면 로그인이 필요합니다.');
                          } else {
                            alert('이 게시글의 작성자 정보를 찾을 수 없습니다. 잠시 후 다시 시도해주세요.');
                          }
                          setShowDropdown(null);
                        }}
                      >
                        💬 1:1대화
                      </button>
                      <button
                        className="w-full px-3 py-2 text-left text-sm text-yellow-600 hover:bg-yellow-50 transition-colors"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleShare(post);
                        }}
                      >
                        🔗 공유하기
                      </button>
                      {user && user.uid !== (post.authorId || post.userId || post.uid) && (
                        <button
                          className="w-full px-3 py-2 text-left text-sm text-red-600 hover:bg-red-50 transition-colors rounded-b-lg"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleReport(post);
                          }}
                        >
                          🚩 신고하기
                        </button>
                      )}
                    </div>
                  )}
                  </div>
                </div>
              </div>

              {/* 포스트 콘텐츠 */}
              <div onClick={() => handlePostClick(post)} className="cursor-pointer">
                {/* 이미지/비디오 */}
                {post.imageUrl ? (
                  <ZoomableImage 
                    src={post.imageUrl} 
                    alt={post.title}
                    className={`w-full ${post.type === 'gallery' ? 'aspect-square' : 'aspect-video'}`}
                    maxScale={3}
                    showZoomIndicator={true}
                    showResetButton={true}
                  />
                ) : null}
                {post.videoUrl && post.type === 'karaoke' && (
                  <div className={`relative ${visibleVideos.has(`${post.type}-${post.id}`) ? 'video-playing' : 'video-paused'}`}>
                    <video
                      ref={(el) => {
                        if (el) {
                          videoRefs.current[`${post.type}-${post.id}`] = el;
                        }
                      }}
                      data-video-id={`${post.type}-${post.id}`}
                      src={post.videoUrl}
                      className="w-full aspect-video object-cover"
                      muted
                      loop
                      playsInline
                      preload="metadata"
                      poster={post.thumbnailUrl || ""}
                      onLoadStart={() => {
                        setLoadingVideos(prev => new Set(prev).add(`${post.type}-${post.id}`));
                      }}
                      onCanPlay={(e) => {
                        const video = e.target;
                        const videoId = `${post.type}-${post.id}`;
                        
                        setLoadingVideos(prev => {
                          const newSet = new Set(prev);
                          newSet.delete(videoId);
                          return newSet;
                        });
                        
                        // onCanPlay에서는 자동 재생 시도하지 않음 (Intersection Observer에서 처리)
                      }}
                      onError={(e) => {
                        const video = e.target;
                        const videoId = `${post.type}-${post.id}`;
                        const currentIndex = video.dataset.urlIndex || 0;
                        const alternativeUrls = post.alternativeUrls || [post.videoUrl];
                        
                        setLoadingVideos(prev => {
                          const newSet = new Set(prev);
                          newSet.delete(videoId);
                          return newSet;
                        });
                        
                        // 대체 URL이 있으면 시도
                        if (currentIndex < alternativeUrls.length - 1) {
                          const nextIndex = parseInt(currentIndex) + 1;
                          video.dataset.urlIndex = nextIndex;
                          video.src = alternativeUrls[nextIndex];
                        }
                      }}
                      onClick={(e) => {
                        e.stopPropagation();
                        const video = e.target;
                        if (video.paused) {
                          video.play().catch(console.error);
                        } else {
                          video.pause();
                        }
                      }}
                    />
                    
                    {/* 로딩 인디케이터 */}
                    {loadingVideos.has(`${post.type}-${post.id}`) && (
                      <div className="absolute top-2 right-2 bg-blue-500 text-white text-xs px-2 py-1 rounded-full flex items-center space-x-1">
                        <div className="w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                        <span>로딩중</span>
                      </div>
                    )}
                    
                    {/* 재생 상태 인디케이터 */}
                    
                    
                    {/* 재생 버튼 오버레이 (정지 상태일 때만 표시) */}
                    <div className="absolute inset-0 bg-black bg-opacity-20 flex items-center justify-center opacity-0 hover:opacity-100 transition-opacity duration-200 group/overlay">
                      <div className="bg-white bg-opacity-30 rounded-full p-4 backdrop-blur-sm">
                        <svg className="w-10 h-10 text-white" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM9.555 7.168A1 1 0 008 8v4a1 1 0 001.555.832l3-2a1 1 0 000-1.664l-3-2z" clipRule="evenodd" />
                        </svg>
                      </div>
                    </div>
                  </div>
                )}
                
                {/* 일반 이미지 (비디오가 아닌 경우) */}
                {post.thumbnailUrl && post.type !== 'karaoke' && (
                  <img 
                    src={post.thumbnailUrl} 
                    alt={post.title}
                    className="w-full aspect-video object-cover"
                  />
                )}

                {/* 텍스트 콘텐츠 */}
                <div className="p-3">
                  <h3 className="font-semibold text-sm mb-1">{post.title}</h3>
                  {post.description && (
                    <p className="text-sm text-gray-700 line-clamp-2">{post.description}</p>
                  )}
                  {post.content && (
                    <p className="text-sm text-gray-700 line-clamp-2">{post.content}</p>
                  )}
                </div>
              </div>

              {/* 포스트 액션 */}
              <div className="px-3 pb-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-4">
                    <button 
                      onClick={(e) => handleLike(e, post.id)}
                      disabled={loadingLikes.has(post.id)}
                      className={`flex items-center space-x-1 transition-all duration-200 hover:scale-110 ${
                        isLikedByUser(post.id) ? 'text-red-500' : 'text-gray-500 hover:text-red-400'
                      } ${loadingLikes.has(post.id) ? 'opacity-50 cursor-not-allowed' : ''}`}
                    >
                      <svg 
                        className="w-8 h-8 transition-all duration-200" 
                        fill={isLikedByUser(post.id) ? "currentColor" : "none"} 
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
                      <span className={`text-sm font-medium transition-colors duration-200 ${
                        isLikedByUser(post.id) ? 'text-red-500' : 'text-gray-600'
                      }`}>
                        {loadingLikes.has(post.id) ? (
                          <span className="animate-pulse">...</span>
                        ) : (
                          post.likes || 0
                        )}
                      </span>
                    </button>
                    <div className="relative group">
                      <button 
                        className="flex items-center space-x-1 hover:scale-110 transition-transform duration-200"
                        onClick={async (e) => {
                          e.stopPropagation();
                          
                          // 댓글 수가 캐시되지 않은 경우 계산
                          if (commentCounts[post.id] === undefined) {
                            await calculateCommentCountSimple(post.id);
                          }
                          
                          // 해당 포스트 상세 페이지로 이동 (댓글 섹션으로 스크롤)
                          const boardPath = getBoardPath(post.boardType);
                          const postUrl = `${boardPath}/${post.id}?scrollTo=comments`;
                          navigate(postUrl);
                        }}
                      >
                      <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                      </svg>
                      <span className="text-sm text-gray-600">
                        {loadingCommentCounts.has(post.id) ? (
                          <span className="animate-pulse">...</span>
                        ) : (
                          (() => {
                            const cachedCount = commentCounts[post.id];
                            const dbCount = post.commentCount;
                            
                            // 캐시된 댓글 수가 있으면 사용, 없으면 DB 값 사용, 둘 다 없으면 0
                            let finalCount = 0;
                            if (cachedCount !== undefined) {
                              finalCount = cachedCount;
                            } else if (dbCount !== undefined && dbCount > 0) {
                              finalCount = dbCount;
                            }
                            
                            
                            return finalCount;
                          })()
                        )}
                      </span>
                      </button>
                      {/* 댓글 툴팁 */}
                      <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-2 py-1 bg-black text-white text-xs rounded opacity-0 group-hover:opacity-100 transition-opacity duration-200 whitespace-nowrap z-10">
                        댓글 보기
                        <div className="absolute top-full left-1/2 transform -translate-x-1/2 w-0 h-0 border-l-2 border-r-2 border-t-2 border-transparent border-t-black"></div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* 오늘의 지혜 섹션 */}
        <div className="mb-2">
          <Wisdom />
        </div>

        {allPosts.length === 0 && !loading && (
          <div className="bg-white p-8 text-center">
            <div className="text-6xl mb-4">📱</div>
            <h3 className="text-lg font-semibold text-gray-800 mb-2">아직 게시물이 없습니다</h3>
            <p className="text-gray-600 mb-4">첫 번째 게시물을 작성해보세요!</p>
            <div className="grid grid-cols-2 gap-3">
              <button 
                onClick={() => navigate('/gallery/upload')}
                className="p-3 bg-amber-100 rounded-lg text-amber-700 font-medium"
              >
                📸 사진 업로드
              </button>
              <button 
                onClick={() => navigate('/board/write')}
                className="p-3 bg-blue-100 rounded-lg text-blue-700 font-medium"
              >
                ✍️ 글쓰기
              </button>
            </div>
          </div>
        )}

        {allPosts.length > 0 && (
          <div className="bg-white p-3 text-center border-t border-gray-100">
            <p className="text-xs text-gray-500">
              총 {allPosts.length}개의 게시물
            </p>
          </div>
        )}
      </div>

      {/* 신고 모달 */}
      {reportTarget && (
        <ReportModal
          isOpen={showReportModal}
          onClose={() => {
            setShowReportModal(false);
            setReportTarget(null);
          }}
          targetData={reportTarget}
          targetType="post"
          onSuccess={handleReportSuccess}
        />
      )}

      {/* 토스트 알림 */}
      {toast.show && (
        <div className={`fixed top-20 left-1/2 transform -translate-x-1/2 z-50 px-6 py-3 rounded-lg shadow-lg transition-all duration-300 ${
          toast.type === 'success' 
            ? 'bg-green-500 text-white' 
            : 'bg-red-500 text-white'
        }`}>
          <div className="flex items-center space-x-2">
            <span className="text-lg">
              {toast.type === 'success' ? '✅' : '❌'}
            </span>
            <span className="font-medium">{toast.message}</span>
          </div>
        </div>
      )}
    </div>
  );
};

export default HomePage;
