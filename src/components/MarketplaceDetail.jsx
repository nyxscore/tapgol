import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { getMarketplacePost, updateMarketplacePost, deleteMarketplacePost, incrementViews, toggleSoldStatus } from '../util/marketplaceService';
import { FaArrowLeft, FaEdit, FaTrash, FaPhone, FaComment, FaHeart, FaShare, FaFlag } from 'react-icons/fa';
// import CommentSection from './CommentSection';
import UserProfileModal from './UserProfileModal';
import { navigateToDM } from '../util/dmUtils';
import ReportModal from './ReportModal';
import { formatAdminName, isAdmin, getEnhancedAdminStyles, isCurrentUserAdmin } from '../util/adminUtils';

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

  // 신고 관련 상태
  const [showReportModal, setShowReportModal] = useState(false);

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
    if (!user || !post || (post.authorId !== user.uid && !isCurrentUserAdmin(user))) {
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
    <div className="min-h-screen bg-white pb-20">
      <div className="max-w-md mx-auto">
        {/* 헤더 */}
        <div className="bg-white border-b border-gray-200 px-4 py-3 sticky top-0 z-10">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <button
                onClick={() => navigate('/marketplace')}
                className="flex items-center justify-center w-8 h-8 bg-gray-100 rounded-full hover:bg-gray-200 transition-colors"
                title="목록으로 돌아가기"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
              </button>
              <h1 className="text-lg font-semibold text-gray-800">상품 상세</h1>
            </div>
            {user && (post.authorId === user.uid || isCurrentUserAdmin(user)) && (
              <div className="flex gap-1">
                <button
                  onClick={() => {
                    if (!user || (post.authorId !== user.uid && !isCurrentUserAdmin(user))) {
                      alert("수정 권한이 없습니다.");
                      return;
                    }
                    navigate(`/marketplace/edit/${id}`);
                  }}
                  className="flex items-center gap-1 px-2 py-1 bg-blue-500 text-white rounded text-xs"
                >
                  <FaEdit className="w-3 h-3" />
                  수정
                </button>
                <button
                  onClick={() => setShowDeleteConfirm(true)}
                  className="flex items-center gap-1 px-2 py-1 bg-red-500 text-white rounded text-xs"
                >
                  <FaTrash className="w-3 h-3" />
                  삭제
                </button>
              </div>
            )}
          </div>
        </div>
        {/* 작성자 정보 */}
        <div className="bg-white border-b border-gray-100 p-4">
          <div className="flex items-center space-x-3 mb-3">
            <div className="w-10 h-10 bg-gradient-to-r from-amber-400 to-orange-500 rounded-full flex items-center justify-center">
              <span className="text-white font-medium">
                {(post.author || "익명").charAt(0)}
              </span>
            </div>
            <div className="flex-1">
              <div className="flex items-center space-x-2">
                <span 
                  className="font-medium text-gray-800"
                  onClick={() => {
                    navigateToDM(post.authorId, user, navigate);
                  }}
                >
                  {post.author || "익명"}
                </span>
                <span className="text-gray-400 text-xs">•</span>
                <span className="text-gray-400 text-xs">{formatDate(post.createdAt)}</span>
              </div>
            </div>
            {post.sold && (
              <span className="bg-red-500 text-white px-2 py-1 rounded-full text-xs font-semibold">
                판매완료
              </span>
            )}
          </div>

          {/* 상품 정보 */}
          <div className="mb-3">
            <h1 className="text-lg font-semibold text-gray-800 mb-1">{post.title || '제목 없음'}</h1>
            <p className="text-amber-600 font-bold text-xl mb-2">{formatPrice(post.price)}</p>
            <p className="text-gray-600 text-sm">{post.location || '위치 미설정'}</p>
            {post.category && (
              <span className="inline-block bg-gray-100 text-gray-600 px-2 py-1 rounded text-xs mt-2">
                {categories.find(c => c.value === post.category)?.label || post.category}
              </span>
            )}
          </div>

          {/* 하단 통계 */}
          <div className="flex items-center justify-between text-gray-500 text-xs">
            <div className="flex items-center space-x-4">
              <span>{post.views || 0} 조회</span>
              <span>{post.likes || 0} 좋아요</span>
              <span>{post.commentCount || 0} 댓글</span>
            </div>
          </div>
        </div>

        {/* 이미지 갤러리 */}
        {post.images && post.images.length > 0 && (
          <div className="bg-white">
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
        <div className="bg-white border-b border-gray-100 p-4">
          <h2 className="text-base font-semibold text-gray-800 mb-3">상품 설명</h2>
          <div className="prose max-w-none">
            <p className="text-gray-700 whitespace-pre-wrap text-sm leading-relaxed">
              {post.description || '상품 설명이 없습니다.'}
            </p>
          </div>
          {/* 판매자 1:1 문의 버튼 */}
          <div className="mt-4">
            {!user ? (
              <button
                onClick={() => {
                  alert('로그인이 필요합니다.');
                  navigate('/login');
                }}
                className="w-full px-4 py-3 bg-gray-400 text-white rounded-lg hover:bg-gray-500 transition-colors text-sm"
              >
                로그인 후 1:1 문의
              </button>
            ) : user.uid === post.authorId ? (
              <div className="text-center py-2">
                <span className="text-gray-500 text-sm">본인이 작성한 게시글입니다</span>
              </div>
            ) : (
              <button
                onClick={() => navigateToDM(post.authorId, user, navigate)}
                className="w-full px-4 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm"
              >
                판매자 1:1 문의
              </button>
            )}
          </div>
        </div>

        {/* 판매 상태 변경 */}
        {user && post.authorId === user.uid && (
          <div className="bg-white border-b border-gray-100 p-4">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-base font-semibold text-gray-800 mb-1">판매 상태</h2>
                <p className="text-gray-600 text-sm">
                  현재 상태: {post.sold ? '판매완료' : '판매중'}
                </p>
              </div>
              <button
                onClick={handleMarkAsSold}
                className={`px-4 py-2 rounded text-sm transition-colors ${
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

        {/* 중고장터 댓글 기능 제거됨 */}

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

        {/* 신고 모달 */}
        <ReportModal
          isOpen={showReportModal}
          onClose={() => setShowReportModal(false)}
          targetData={post}
          targetType="post"
          onSuccess={handleReportSuccess}
        />
      </div>
    </div>
  );
};

export default MarketplaceDetail;
