import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { getMarketplacePost, updateMarketplacePost, deleteMarketplacePost, incrementViews, toggleSoldStatus } from '../util/marketplaceService';
import { FaArrowLeft, FaEdit, FaTrash, FaPhone, FaComment, FaHeart, FaShare } from 'react-icons/fa';
import CommentSection from './CommentSection';
import UserProfileModal from './UserProfileModal';

const MarketplaceDetail = () => {
  const [post, setPost] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [imageError, setImageError] = useState({});
  const { id } = useParams();
  const { user } = useAuth();
  const navigate = useNavigate();
  
  // 프로필 모달 관련 상태
  const [showProfileModal, setShowProfileModal] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);

  const categories = [
    { value: 'electronics', label: '전자제품' },
    { value: 'furniture', label: '가구' },
    { value: 'clothing', label: '의류' },
    { value: 'books', label: '도서' },
    { value: 'sports', label: '스포츠용품' },
    { value: 'beauty', label: '뷰티' },
    { value: 'other', label: '기타' }
  ];

  useEffect(() => {
    if (id) {
      loadPost();
    }
  }, [id]);

  const loadPost = async () => {
    try {
      setLoading(true);
      setError(null);
      const postData = await getMarketplacePost(id);
      setPost(postData);
      
      // 조회수 증가
      try {
        await incrementViews(id);
      } catch (viewError) {
        console.error('조회수 증가 오류:', viewError);
        // 조회수 증가 실패는 무시하고 계속 진행
      }
    } catch (error) {
      console.error('상품 로딩 오류:', error);
      setError('상품을 불러오는데 실패했습니다.');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!user || !post || post.authorId !== user.uid) {
      alert('삭제 권한이 없습니다.');
      return;
    }

    try {
      await deleteMarketplacePost(id);
      alert('상품이 삭제되었습니다.');
      navigate('/marketplace');
    } catch (error) {
      console.error('상품 삭제 오류:', error);
      alert('상품 삭제에 실패했습니다.');
    }
  };

  const handleMarkAsSold = async () => {
    if (!user || !post || post.authorId !== user.uid) {
      alert('권한이 없습니다.');
      return;
    }

    try {
      await toggleSoldStatus(id, !post.sold);
      setPost(prev => ({ ...prev, sold: !prev.sold }));
      alert(post.sold ? '판매 중으로 변경되었습니다.' : '판매완료로 변경되었습니다.');
    } catch (error) {
      console.error('상태 변경 오류:', error);
      alert('상태 변경에 실패했습니다.');
    }
  };

  const formatPrice = (price) => {
    if (!price || isNaN(price)) return '가격협의';
    return `${price.toLocaleString()}원`;
  };

  const formatDate = (timestamp) => {
    if (!timestamp) return '';
    try {
      const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
      return date.toLocaleDateString('ko-KR');
    } catch (error) {
      console.error('날짜 포맷 오류:', error);
      return '';
    }
  };

  const nextImage = () => {
    if (post?.images && post.images.length > 1) {
      setCurrentImageIndex((prev) => (prev + 1) % post.images.length);
    }
  };

  const prevImage = () => {
    if (post?.images && post.images.length > 1) {
      setCurrentImageIndex((prev) => (prev - 1 + post.images.length) % post.images.length);
    }
  };

  const handleImageError = (imageIndex) => {
    setImageError(prev => ({ ...prev, [imageIndex]: true }));
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
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-amber-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">상품을 불러오는 중...</p>
        </div>
      </div>
    );
  }

  if (error || !post) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="text-red-500 text-6xl mb-4">⚠️</div>
          <h3 className="text-xl font-semibold text-gray-700 mb-2">상품을 찾을 수 없습니다</h3>
          <p className="text-gray-500 mb-6">{error || '존재하지 않는 상품입니다.'}</p>
          <button
            onClick={() => navigate('/marketplace')}
            className="px-6 py-3 bg-amber-600 text-white rounded-lg hover:bg-amber-700 transition-colors"
          >
            중고장터로 돌아가기
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-amber-50 via-orange-50 to-amber-100">
      <div className="max-w-4xl mx-auto px-4 py-6">
        {/* 헤더 */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <div className="flex items-center justify-between mb-4">
            <button
              onClick={() => navigate('/marketplace')}
              className="flex items-center justify-center w-12 h-12 bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white rounded-full shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-110"
              title="목록으로 돌아가기"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M10.5 19.5L3 12m0 0l7.5-7.5M3 12h18" />
              </svg>
            </button>
            {user && post.authorId === user.uid && (
              <div className="flex gap-2">
                <button
                  onClick={() => navigate(`/marketplace/edit/${id}`)}
                  className="flex items-center gap-2 px-3 py-1 bg-blue-500 text-white rounded hover:bg-blue-600 transition-colors text-sm"
                >
                  <FaEdit />
                  수정
                </button>
                <button
                  onClick={() => setShowDeleteConfirm(true)}
                  className="flex items-center gap-2 px-3 py-1 bg-red-500 text-white rounded hover:bg-red-600 transition-colors text-sm"
                >
                  <FaTrash />
                  삭제
                </button>
              </div>
            )}
          </div>
          
          <h1 className="text-2xl font-bold text-gray-800 mb-2">{post.title || '제목 없음'}</h1>
          <p className="text-amber-600 font-bold text-2xl mb-4">{formatPrice(post.price)}</p>
          
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 text-sm mb-4">
            <div className="flex flex-col">
              <span className="text-gray-500 text-xs mb-1">위치</span>
              <span className="text-gray-600">{post.location || '위치 미설정'}</span>
            </div>
            <div className="flex flex-col">
              <span className="text-gray-500 text-xs mb-1">등록일</span>
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
          
          {post.category && (
            <div className="mb-4">
              <span className="inline-block bg-gray-100 text-gray-600 px-3 py-1 rounded text-sm">
                {categories.find(c => c.value === post.category)?.label || post.category}
              </span>
            </div>
          )}
        </div>

        {/* 이미지 갤러리 */}
        {post.images && post.images.length > 0 && (
          <div className="bg-white rounded-lg shadow-md p-6 mb-6">
            <div className="relative">
              <div className="aspect-video bg-gray-200 rounded-lg overflow-hidden relative">
                {!imageError[currentImageIndex] ? (
                  <img
                    src={post.images[currentImageIndex]}
                    alt={`${post.title} 이미지 ${currentImageIndex + 1}`}
                    className="w-full h-full object-cover"
                    onError={() => handleImageError(currentImageIndex)}
                    loading="lazy"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-gray-400">
                    <span className="text-6xl">📷</span>
                  </div>
                )}
                
                {post.images.length > 1 && (
                  <>
                    <button
                      onClick={prevImage}
                      className="absolute left-4 top-1/2 transform -translate-y-1/2 bg-black bg-opacity-50 text-white p-2 rounded-full hover:bg-opacity-70 transition-colors"
                    >
                      ‹
                    </button>
                    <button
                      onClick={nextImage}
                      className="absolute right-4 top-1/2 transform -translate-y-1/2 bg-black bg-opacity-50 text-white p-2 rounded-full hover:bg-opacity-70 transition-colors"
                    >
                      ›
                    </button>
                  </>
                )}
              </div>
              
              {post.images.length > 1 && (
                <div className="flex justify-center mt-4 gap-2">
                  {post.images.map((_, index) => (
                    <button
                      key={index}
                      onClick={() => setCurrentImageIndex(index)}
                      className={`w-3 h-3 rounded-full ${
                        index === currentImageIndex ? 'bg-amber-600' : 'bg-gray-300'
                      }`}
                    />
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {/* 상품 설명 */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <h2 className="text-xl font-semibold text-gray-800 mb-4">상품 설명</h2>
          <div className="prose max-w-none">
            <p className="text-gray-700 whitespace-pre-wrap">
              {post.description || '상품 설명이 없습니다.'}
            </p>
          </div>
        </div>

        {/* 판매자 정보 */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <h2 className="text-xl font-semibold text-gray-800 mb-4">판매자 정보</h2>
          <div className="flex items-center justify-between">
            <div>
              <p 
                className="font-medium text-gray-800 hover:text-amber-600 cursor-pointer transition-colors"
                onClick={() => handleShowProfile(post.authorId, post.author || '익명')}
                title="프로필 보기"
              >
                {post.author || '익명'}
              </p>
              <p className="text-sm text-gray-500">{post.location || '위치 미설정'}</p>
            </div>
            <div className="flex gap-2">
              <button className="flex items-center gap-2 px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600 transition-colors">
                <FaPhone />
                연락하기
              </button>
              <button className="flex items-center gap-2 px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 transition-colors">
                <FaComment />
                채팅
              </button>
            </div>
          </div>
        </div>

        {/* 판매 상태 변경 */}
        {user && post.authorId === user.uid && (
          <div className="bg-white rounded-lg shadow-md p-6 mb-6">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-xl font-semibold text-gray-800 mb-2">판매 상태</h2>
                <p className="text-gray-600">
                  현재 상태: {post.sold ? '판매완료' : '판매중'}
                </p>
              </div>
              <button
                onClick={handleMarkAsSold}
                className={`px-6 py-2 rounded transition-colors ${
                  post.sold
                    ? 'bg-blue-500 text-white hover:bg-blue-600'
                    : 'bg-red-500 text-white hover:bg-red-600'
                }`}
              >
                {post.sold ? '판매중으로 변경' : '판매완료로 변경'}
              </button>
            </div>
          </div>
        )}

        {/* 댓글 섹션 */}
        <div className="bg-white rounded-lg shadow-md p-6">
          <CommentSection postId={id} postType="marketplace" />
        </div>

        {/* 삭제 확인 모달 */}
        {showDeleteConfirm && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
              <h3 className="text-xl font-semibold text-gray-800 mb-4">상품 삭제</h3>
              <p className="text-gray-600 mb-6">정말로 이 상품을 삭제하시겠습니까?</p>
              <div className="flex gap-3">
                <button
                  onClick={handleDelete}
                  className="flex-1 px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600 transition-colors"
                >
                  삭제
                </button>
                <button
                  onClick={() => setShowDeleteConfirm(false)}
                  className="flex-1 px-4 py-2 bg-gray-500 text-white rounded hover:bg-gray-600 transition-colors"
                >
                  취소
                </button>
              </div>
            </div>
          </div>
        )}

        {/* 사용자 프로필 모달 */}
        <UserProfileModal
          isOpen={showProfileModal}
          onClose={handleCloseProfileModal}
          userId={selectedUser?.id}
          userName={selectedUser?.name}
        />
      </div>
    </div>
  );
};

export default MarketplaceDetail;
