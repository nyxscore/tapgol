import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { getMarketplacePost, updateMarketplacePost, deleteMarketplacePost, incrementViews, toggleSoldStatus } from '../util/marketplaceService';
import { FaArrowLeft, FaEdit, FaTrash, FaPhone, FaComment, FaHeart, FaShare } from 'react-icons/fa';
import CommentSection from './CommentSection';

const MarketplaceDetail = () => {
  const [post, setPost] = useState(null);
  const [loading, setLoading] = useState(true);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const { id } = useParams();
  const { user } = useAuth();
  const navigate = useNavigate();

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
    loadPost();
  }, [id]);

  const loadPost = async () => {
    try {
      setLoading(true);
      const postData = await getMarketplacePost(id);
      setPost(postData);
      
      // 조회수 증가
      await incrementViews(id);
    } catch (error) {
      console.error('상품 로딩 오류:', error);
      alert('상품을 불러오는데 실패했습니다.');
      navigate('/marketplace');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!user || post.authorId !== user.uid) {
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
    if (!user || post.authorId !== user.uid) {
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
    return price ? `${price.toLocaleString()}원` : '가격협의';
  };

  const formatDate = (timestamp) => {
    if (!timestamp) return '';
    const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
    return date.toLocaleDateString('ko-KR');
  };

  const nextImage = () => {
    if (post.images && post.images.length > 1) {
      setCurrentImageIndex((prev) => (prev + 1) % post.images.length);
    }
  };

  const prevImage = () => {
    if (post.images && post.images.length > 1) {
      setCurrentImageIndex((prev) => (prev - 1 + post.images.length) % post.images.length);
    }
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

  if (!post) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <p className="text-gray-600">상품을 찾을 수 없습니다.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-amber-50 via-orange-50 to-amber-100">
      <div className="max-w-4xl mx-auto px-4 py-6">
        {/* 헤더 */}
        <div className="flex items-center justify-between mb-6">
          <button
            onClick={() => navigate('/marketplace')}
            className="flex items-center gap-2 text-gray-600 hover:text-gray-800"
          >
            <FaArrowLeft />
            목록으로
          </button>
          {user && post.authorId === user.uid && (
            <div className="flex gap-2">
              <button
                onClick={() => navigate(`/marketplace/edit/${id}`)}
                className="flex items-center gap-1 px-3 py-1 bg-blue-500 text-white rounded text-sm hover:bg-blue-600"
              >
                <FaEdit />
                수정
              </button>
              <button
                onClick={() => setShowDeleteConfirm(true)}
                className="flex items-center gap-1 px-3 py-1 bg-red-500 text-white rounded text-sm hover:bg-red-600"
              >
                <FaTrash />
                삭제
              </button>
            </div>
          )}
        </div>

        <div className="bg-white rounded-lg shadow-md overflow-hidden">
          {/* 이미지 슬라이더 */}
          <div className="relative aspect-video bg-gray-200">
            {post.images && post.images.length > 0 ? (
              <>
                <img
                  src={post.images[currentImageIndex]}
                  alt={post.title}
                  className="w-full h-full object-cover"
                />
                {post.images.length > 1 && (
                  <>
                    <button
                      onClick={prevImage}
                      className="absolute left-4 top-1/2 transform -translate-y-1/2 bg-black bg-opacity-50 text-white p-2 rounded-full hover:bg-opacity-70"
                    >
                      ‹
                    </button>
                    <button
                      onClick={nextImage}
                      className="absolute right-4 top-1/2 transform -translate-y-1/2 bg-black bg-opacity-50 text-white p-2 rounded-full hover:bg-opacity-70"
                    >
                      ›
                    </button>
                    <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 bg-black bg-opacity-50 text-white px-2 py-1 rounded text-sm">
                      {currentImageIndex + 1} / {post.images.length}
                    </div>
                  </>
                )}
              </>
            ) : (
              <div className="w-full h-full flex items-center justify-center text-gray-400">
                <span className="text-6xl">📷</span>
              </div>
            )}
            {post.sold && (
              <div className="absolute top-4 right-4 bg-red-500 text-white px-3 py-1 rounded text-sm font-semibold">
                판매완료
              </div>
            )}
          </div>

          {/* 썸네일 이미지들 */}
          {post.images && post.images.length > 1 && (
            <div className="p-4 border-b">
              <div className="flex gap-2 overflow-x-auto">
                {post.images.map((image, index) => (
                  <button
                    key={index}
                    onClick={() => setCurrentImageIndex(index)}
                    className={`flex-shrink-0 w-16 h-16 rounded border-2 ${
                      index === currentImageIndex ? 'border-amber-500' : 'border-gray-300'
                    }`}
                  >
                    <img
                      src={image}
                      alt={`썸네일 ${index + 1}`}
                      className="w-full h-full object-cover rounded"
                    />
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* 상품 정보 */}
          <div className="p-6">
            <div className="flex items-start justify-between mb-4">
              <div>
                <h1 className="text-2xl font-bold text-gray-800 mb-2">{post.title}</h1>
                <p className="text-3xl font-bold text-amber-600 mb-2">
                  {formatPrice(post.price)}
                </p>
              </div>
              <div className="flex gap-2">
                <button className="p-2 text-gray-400 hover:text-red-500">
                  <FaHeart />
                </button>
                <button className="p-2 text-gray-400 hover:text-blue-500">
                  <FaShare />
                </button>
              </div>
            </div>

            {/* 카테고리 및 위치 */}
            <div className="flex flex-wrap gap-2 mb-4">
              {post.category && (
                <span className="bg-gray-100 text-gray-600 px-3 py-1 rounded-full text-sm">
                  {categories.find(c => c.value === post.category)?.label || post.category}
                </span>
              )}
              {post.location && (
                <span className="bg-blue-100 text-blue-600 px-3 py-1 rounded-full text-sm">
                  📍 {post.location}
                </span>
              )}
            </div>

            {/* 판매자 정보 */}
            <div className="bg-gray-50 rounded-lg p-4 mb-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-semibold text-gray-800">{post.authorName}</p>
                  <p className="text-sm text-gray-500">등록일: {formatDate(post.createdAt)}</p>
                  <p className="text-sm text-gray-500">조회수: {post.views || 0}</p>
                </div>
                <div className="flex gap-2">
                  <button className="flex items-center gap-1 px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600">
                    <FaPhone />
                    연락하기
                  </button>
                  <button className="flex items-center gap-1 px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600">
                    <FaComment />
                    채팅하기
                  </button>
                </div>
              </div>
            </div>

            {/* 상품 설명 */}
            <div className="mb-6">
              <h3 className="text-lg font-semibold text-gray-800 mb-3">상품 설명</h3>
              <div className="text-gray-700 whitespace-pre-wrap">
                {post.description}
              </div>
            </div>

            {/* 판매 상태 변경 (판매자만) */}
            {user && post.authorId === user.uid && (
              <div className="mb-6">
                <button
                  onClick={handleMarkAsSold}
                  className={`w-full py-3 rounded-lg font-semibold ${
                    post.sold
                      ? 'bg-green-500 text-white hover:bg-green-600'
                      : 'bg-red-500 text-white hover:bg-red-600'
                  }`}
                >
                  {post.sold ? '판매 중으로 변경' : '판매완료로 변경'}
                </button>
              </div>
            )}
          </div>
        </div>

        {/* 댓글 섹션 */}
        <div className="mt-6">
          <CommentSection postId={id} boardType="marketplace" />
        </div>
      </div>

      {/* 삭제 확인 모달 */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-sm mx-4">
            <h3 className="text-lg font-semibold mb-4">상품 삭제</h3>
            <p className="text-gray-600 mb-6">정말로 이 상품을 삭제하시겠습니까?</p>
            <div className="flex gap-4">
              <button
                onClick={() => setShowDeleteConfirm(false)}
                className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded hover:bg-gray-50"
              >
                취소
              </button>
              <button
                onClick={handleDelete}
                className="flex-1 px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600"
              >
                삭제
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default MarketplaceDetail;
