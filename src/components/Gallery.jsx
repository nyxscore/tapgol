import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { auth, db } from "../util/firebase";
import { onAuthStateChanged } from "firebase/auth";
import { collection, query, orderBy, onSnapshot } from "firebase/firestore";
import { getGalleryItems, toggleLike, incrementViews } from "../util/galleryService";
import UserProfileModal from './UserProfileModal';
import { navigateToDM } from '../util/dmUtils';

const Gallery = () => {
  const navigate = useNavigate();
  const [items, setItems] = useState([]);
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  // 프로필 모달 관련 상태
  const [showProfileModal, setShowProfileModal] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
    });

    // 실시간 갤러리 구독 (최적화된 쿼리)
    const q = query(
      collection(db, "gallery"),
      orderBy("createdAt", "desc")
    );

    const unsubscribeGallery = onSnapshot(q, 
      { includeMetadataChanges: true }, // 메타데이터 변경도 감지하여 삭제 즉시 반영
      (querySnapshot) => {
        const galleryData = [];
        querySnapshot.forEach((doc) => {
          // 삭제된 문서는 제외
          if (doc.exists()) {
            galleryData.push({
              id: doc.id,
              ...doc.data()
            });
          }
        });
        setItems(galleryData);
        setLoading(false);
      }, 
      (error) => {
        console.error("갤러리 실시간 구독 오류:", error);
        // BloomFilter 오류는 무시 (기능에 영향 없음)
        if (error.name !== 'BloomFilterError') {
          setLoading(false);
        }
      }
    );

    return () => {
      unsubscribe();
      unsubscribeGallery();
    };
  }, []);

  const loadGalleryItems = async () => {
    try {
      const galleryData = await getGalleryItems();
      setItems(galleryData);
    } catch (error) {
      console.error("갤러리 로드 오류:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleItemClick = async (itemId) => {
    try {
      // 조회수 증가 (로그인한 사용자만)
      if (user) {
        await incrementViews(itemId);
      }
      navigate(`/gallery/${itemId}`);
    } catch (error) {
      console.error("조회수 증가 오류:", error);
      navigate(`/gallery/${itemId}`);
    }
  };

  const handleUploadClick = () => {
    if (!user) {
      alert("업로드를 하려면 로그인이 필요합니다.");
      navigate("/login");
      return;
    }
    navigate("/gallery/upload");
  };

  const handleLike = async (e, itemId) => {
    e.stopPropagation(); // 이벤트 버블링 방지
    
    if (!user) {
      alert("좋아요를 누르려면 로그인이 필요합니다.");
      navigate("/login");
      return;
    }

    try {
      const isLiked = await toggleLike(itemId, user.uid);
      
      // 로컬 상태 업데이트
      setItems(prev => prev.map(item => {
        if (item.id === itemId) {
          return {
            ...item,
            likes: isLiked ? (item.likes || 0) + 1 : (item.likes || 0) - 1,
            likedBy: isLiked 
              ? [...(item.likedBy || []), user.uid]
              : (item.likedBy || []).filter(uid => uid !== user.uid)
          };
        }
        return item;
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

  const isLikedByUser = (item) => {
    return user && item.likedBy && item.likedBy.includes(user.uid);
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

  const getFileTypeIcon = (fileType) => {
    if (fileType === 'image') {
      return (
        <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
          <path fillRule="evenodd" d="M4 3a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V5a2 2 0 00-2-2H4zm12 12H4l4-8 3 6 2-4 3 6z" clipRule="evenodd" />
        </svg>
      );
    }
    return null;
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-amber-50 via-orange-50 to-amber-100">
        <main className="pb-20 pt-16">
          <div className="max-w-4xl mx-auto px-4">
            <div className="text-center py-12">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-amber-700 mx-auto mb-4"></div>
              <p className="text-amber-700">갤러리를 불러오는 중...</p>
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
              <h1 className="text-2xl font-bold text-gray-800">추억앨범</h1>
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
            <p className="text-gray-600">
              사진과 동영상을 공유해보세요
            </p>
          </div>

          {items.length === 0 ? (
            <div className="text-center py-12">
              <div className="text-gray-400 text-6xl mb-4">📷</div>
              <p className="text-gray-600 text-lg mb-2">아직 업로드된 파일이 없습니다</p>
              <p className="text-gray-500 mb-6">첫 번째 파일을 업로드해보세요!</p>
              <button
                onClick={handleUploadClick}
                className="bg-amber-600 text-white px-6 py-3 rounded-lg hover:bg-amber-700 transition-colors"
              >
                파일 업로드하기
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {items.map((item) => (
                <div
                  key={item.id}
                  onClick={() => handleItemClick(item.id)}
                  className="bg-white rounded-lg shadow-md overflow-hidden cursor-pointer transform transition-transform hover:scale-105 hover:shadow-lg"
                >
                  <div className="relative">
                    <img
                      src={item.fileUrl}
                      alt={item.title}
                      className="w-full h-48 object-cover"
                      loading="lazy"
                    />
                    <div className="absolute top-2 right-2 bg-black bg-opacity-50 text-white text-xs px-2 py-1 rounded flex items-center space-x-1">
                      {getFileTypeIcon(item.fileTypeCategory)}
                      <span>{formatDate(item.createdAt)}</span>
                    </div>
                  </div>
                  <div className="p-4">
                    <h3 className="font-semibold text-gray-800 mb-2 line-clamp-2">
                      {item.title}
                    </h3>
                    {item.description && (
                      <p className="text-sm text-gray-600 mb-3 line-clamp-2">
                        {item.description}
                      </p>
                    )}
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 text-sm">
                      <div className="flex flex-col">
                        <span className="text-gray-500 text-xs mb-1">업로더</span>
                        <span 
                          className="font-medium text-gray-800 hover:text-amber-600 cursor-pointer transition-colors"
                          onClick={(e) => {
                            e.stopPropagation();
                            navigateToDM(item.uploaderId, user, navigate);
                          }}
                          title="프로필 보기"
                        >
                          {item.uploader}
                        </span>
                      </div>
                      <div className="flex flex-col">
                        <span className="text-gray-500 text-xs mb-1">좋아요</span>
                        <button
                          onClick={(e) => handleLike(e, item.id)}
                          className={`flex items-center space-x-1 transition-colors ${
                            isLikedByUser(item) ? 'text-red-500' : 'text-gray-500 hover:text-red-500'
                          }`}
                        >
                          <svg className="w-4 h-4" fill={isLikedByUser(item) ? "currentColor" : "none"} stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                          </svg>
                          <span className={isLikedByUser(item) ? "text-red-500 font-semibold" : "text-gray-600"}>{item.likes || 0}</span>
                        </button>
                      </div>
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

export default Gallery;
