import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { auth, db } from "../util/firebase";
import { onAuthStateChanged } from "firebase/auth";
import { collection, query, orderBy, onSnapshot } from "firebase/firestore";
import { getGalleryItems, toggleLike, incrementViews } from "../util/galleryService";
import UserProfileModal from './UserProfileModal';
import { navigateToDM } from '../util/dmUtils';
import GalleryItem from './GalleryItem';

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
            const data = doc.data();
            galleryData.push({
              id: doc.id,
              ...data
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
      <div className="min-h-screen bg-gray-50 pt-14 pb-16">
        <div className="max-w-md mx-auto">
          <div className="flex flex-col items-center justify-center h-64">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-amber-600"></div>
            <p className="mt-2 text-gray-600">갤러리를 불러오는 중...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 pt-14 pb-16">
      <div className="max-w-md mx-auto">
        {/* 헤더 */}
        <div className="bg-white border-b border-gray-200 px-4 py-3">
          <div className="flex items-center justify-between">
            <h1 className="text-lg font-semibold text-gray-800">추억앨범</h1>
            <button
              onClick={handleUploadClick}
              className="p-2 rounded-full bg-amber-600 text-white hover:bg-amber-700 transition-colors"
              title="사진 업로드"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
            </button>
          </div>
        </div>

        {/* 갤러리 그리드 */}
        {items.length === 0 ? (
          <div className="bg-white p-8 text-center">
            <div className="text-6xl mb-4">📷</div>
            <h3 className="text-lg font-semibold text-gray-800 mb-2">아직 사진이 없습니다</h3>
            <p className="text-gray-600 mb-4">첫 번째 사진을 업로드해보세요!</p>
            <button
              onClick={handleUploadClick}
              className="bg-amber-600 text-white px-6 py-3 rounded-lg hover:bg-amber-700 transition-colors"
            >
              사진 업로드하기
            </button>
          </div>
        ) : (
          <div className="gallery-grid">
            {items.map((item) => (
              <GalleryItem
                key={item.id}
                item={item}
                onItemClick={handleItemClick}
                onLike={handleLike}
                isLikedByUser={isLikedByUser}
                onShowProfile={handleShowProfile}
                user={user}
              />
            ))}
          </div>
        )}
      </div>

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
