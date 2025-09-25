import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { FaSearch, FaPlus } from 'react-icons/fa';
import { useAuth } from '../contexts/AuthContext';
import { getAllMarketplacePosts } from '../util/marketplaceService';
import { getComments } from "../util/commentService";
import { navigateToDM } from '../util/dmUtils';
import UserProfileModal from './UserProfileModal';

const Marketplace = () => {
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [commentCounts, setCommentCounts] = useState({});
  const { user } = useAuth();
  const navigate = useNavigate();

  // 프로필 모달 관련 상태
  const [showProfileModal, setShowProfileModal] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);

  const categories = [
    { value: 'all', label: '전체' },
    { value: 'electronics', label: '디지털/가전' },
    { value: 'furniture', label: '가구/인테리어' },
    { value: 'clothing', label: '의류/잡화' },
    { value: 'books', label: '도서/티켓/문구' },
    { value: 'beauty', label: '뷰티/미용' },
    { value: 'sports', label: '스포츠/레저' },
    { value: 'food', label: '식품' },
    { value: 'baby', label: '유아동' },
    { value: 'pet', label: '반려동물용품' },
    { value: 'plant', label: '식물' },
    { value: 'other', label: '기타' }
  ];

  useEffect(() => {
    loadPosts();
  }, []);

  const loadPosts = async () => {
    try {
      setLoading(true);
      setError(null);
      const postsData = await getAllMarketplacePosts();
      setPosts(postsData);
      
      // 댓글 수 계산
      const calculateAllCommentCounts = async () => {
        const counts = {};
        for (const post of postsData) {
          counts[post.id] = await calculateCommentCount(post.id);
        }
        setCommentCounts(counts);
      };
      
      calculateAllCommentCounts();
    } catch (error) {
      console.error('중고장터 게시글 로딩 오류:', error);
      setError('게시글을 불러오는데 실패했습니다. 다시 시도해주세요.');
    } finally {
      setLoading(false);
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

  const filteredPosts = posts.filter(post => {
    if (!post) return false;
    
    const matchesSearch = post.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         post.description?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = categoryFilter === 'all' || post.category === categoryFilter;
    return matchesSearch && matchesCategory;
  });

  const handleWriteClick = () => {
    if (!user) {
      alert('로그인이 필요합니다.');
      navigate('/login');
      return;
    }
    navigate('/marketplace/write');
  };

  const handlePostClick = (postId) => {
    if (!postId) {
      console.error('게시글 ID가 없습니다.');
      return;
    }
    navigate(`/marketplace/${postId}`);
  };

  const handleImageError = (e) => {
    e.target.style.display = 'none';
    e.target.nextSibling.style.display = 'flex';
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

  const calculateCommentCount = async (postId) => {
    try {
      const comments = await getComments(postId);
      return comments.length;
    } catch (error) {
      console.error(`댓글 수 계산 오류 (${postId}):`, error);
      return 0;
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-amber-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">중고장터를 불러오는 중...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="text-red-500 text-6xl mb-4">⚠️</div>
          <h3 className="text-xl font-semibold text-gray-700 mb-2">오류가 발생했습니다</h3>
          <p className="text-gray-500 mb-6">{error}</p>
          <button
            onClick={loadPosts}
            className="px-6 py-3 bg-amber-600 text-white rounded-lg hover:bg-amber-700 transition-colors"
          >
            다시 시도
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white pt-14 pb-20">
      <div className="max-w-md mx-auto">
        {/* 헤더 */}
        <div className="bg-white border-b border-gray-200 px-4 py-3 sticky top-14 z-10">
          <div className="flex items-center justify-between">
            <h1 className="text-lg font-semibold text-gray-800">중고장터</h1>
            <button
              onClick={handleWriteClick}
              className="px-3 py-1.5 bg-amber-600 text-white rounded-lg hover:bg-amber-700 transition-colors flex items-center justify-center space-x-1 text-xs"
              title="중고장터 글쓰기"
            >
              <FaPlus className="text-xs" />
              <span>글쓰기</span>
            </button>
          </div>
        </div>

        {/* 검색 및 필터 */}
        <div className="bg-white border-b border-gray-100 px-4 py-3">
          <div className="flex flex-col gap-3">
            <div className="relative">
              <FaSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 text-sm" />
              <input
                type="text"
                placeholder="찾고 싶은 물건을 검색해보세요"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent text-sm"
              />
            </div>
            <select
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent text-sm"
            >
              {categories.map(category => (
                <option key={category.value} value={category.value}>
                  {category.label}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* 게시글 목록 */}
        {filteredPosts.length === 0 ? (
          <div className="bg-white p-8 text-center">
            <div className="text-6xl mb-4">🛒</div>
            <h3 className="text-lg font-semibold text-gray-800 mb-2">
              {searchTerm || categoryFilter !== 'all' ? '검색 결과가 없습니다' : '아직 등록된 상품이 없습니다'}
            </h3>
            <p className="text-gray-600 mb-4">
              {searchTerm || categoryFilter !== 'all' 
                ? '다른 검색어나 카테고리를 시도해보세요' 
                : '첫 번째 상품을 등록해보세요!'}
            </p>
            {!searchTerm && categoryFilter === 'all' && (
              <button
                onClick={handleWriteClick}
                className="bg-amber-600 text-white px-6 py-3 rounded-lg hover:bg-amber-700 transition-colors"
              >
                상품 등록하기
              </button>
            )}
          </div>
        ) : (
          <div className="space-y-1">
            {filteredPosts.map((post) => (
              <div
                key={post.id}
                onClick={() => handlePostClick(post.id)}
                className="bg-white border-b border-gray-100 p-4 cursor-pointer hover:bg-gray-50 transition-colors"
              >
                {/* 작성자 정보 */}
                <div className="flex items-center space-x-3 mb-3">
                  <div className="w-8 h-8 bg-gradient-to-r from-amber-400 to-orange-500 rounded-full flex items-center justify-center">
                    <span className="text-white text-sm font-medium">
                      {(post.author || "익명").charAt(0)}
                    </span>
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center space-x-2">
                      <span 
                        className="font-medium text-gray-800 text-sm"
                        onClick={(e) => {
                          e.stopPropagation();
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

                {/* 상품 이미지와 정보 */}
                <div className="flex space-x-3 mb-3">
                  <div className="w-20 h-20 bg-gray-200 rounded-lg relative flex-shrink-0">
                    {post.images && post.images.length > 0 ? (
                      <img
                        src={post.images[0]}
                        alt={post.title || '상품 이미지'}
                        className="w-full h-full object-cover rounded-lg"
                        onError={handleImageError}
                        loading="lazy"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-gray-400">
                        <span className="text-2xl">📷</span>
                      </div>
                    )}
                  </div>
                  <div className="flex-1">
                    <h3 className="font-semibold text-gray-900 text-base mb-2 line-clamp-2 leading-tight">
                      {post.title || '제목 없음'}
                    </h3>
                    <p className="text-amber-600 font-bold text-lg mb-2">
                      {formatPrice(post.price)}
                    </p>
                    <p className="text-gray-500 text-sm mb-1">
                      {post.location || '위치 미설정'}
                    </p>
                    {post.category && (
                      <span className="inline-block bg-gray-100 text-gray-600 px-2 py-1 rounded text-xs">
                        {categories.find(c => c.value === post.category)?.label || post.category}
                      </span>
                    )}
                  </div>
                </div>

                {/* 하단 통계 */}
                <div className="flex items-center justify-between text-gray-500 text-xs">
                  <div className="flex items-center space-x-4">
                    <span>{post.views || 0} 조회</span>
                    <span>{post.likes || 0} 좋아요</span>
                    <span>{commentCounts[post.id] || 0} 댓글</span>
                  </div>
                </div>
              </div>
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

export default Marketplace;