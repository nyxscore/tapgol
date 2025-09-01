import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { getMarketplacePosts } from '../util/marketplaceService';
import { FaPlus, FaSearch, FaFilter } from 'react-icons/fa';

const Marketplace = () => {
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const { user } = useAuth();
  const navigate = useNavigate();

  const categories = [
    { value: 'all', label: '전체' },
    { value: 'electronics', label: '전자제품' },
    { value: 'furniture', label: '가구' },
    { value: 'clothing', label: '의류' },
    { value: 'books', label: '도서' },
    { value: 'sports', label: '스포츠용품' },
    { value: 'beauty', label: '뷰티' },
    { value: 'other', label: '기타' }
  ];

  useEffect(() => {
    loadPosts();
  }, []);

  const loadPosts = async () => {
    try {
      setLoading(true);
      setError(null);
      const postsData = await getMarketplacePosts(20);
      setPosts(postsData);
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
    <div className="min-h-screen bg-gradient-to-br from-amber-50 via-orange-50 to-amber-100">
      <div className="max-w-4xl mx-auto px-4 py-6">
        {/* 헤더 */}
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-gray-800 mb-2">중고장터</h1>
          <p className="text-gray-600">동네 이웃과 안전하게 거래하세요</p>
        </div>

        {/* 검색 및 필터 */}
        <div className="bg-white rounded-lg shadow-md p-4 mb-6">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1 relative">
              <FaSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                placeholder="찾고 싶은 물건을 검색해보세요"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent"
              />
            </div>
            <div className="flex gap-2">
              <select
                value={categoryFilter}
                onChange={(e) => setCategoryFilter(e.target.value)}
                className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent"
              >
                {categories.map(category => (
                  <option key={category.value} value={category.value}>
                    {category.label}
                  </option>
                ))}
              </select>
              <button
                onClick={handleWriteClick}
                className="flex items-center gap-2 px-4 py-2 bg-amber-600 text-white rounded-lg hover:bg-amber-700 transition-colors"
              >
                <FaPlus />
                글쓰기
              </button>
            </div>
          </div>
        </div>

        {/* 게시글 목록 */}
        {filteredPosts.length === 0 ? (
          <div className="text-center py-12">
            <div className="text-6xl mb-4">🛒</div>
            <h3 className="text-xl font-semibold text-gray-700 mb-2">
              {searchTerm || categoryFilter !== 'all' ? '검색 결과가 없습니다' : '아직 등록된 상품이 없습니다'}
            </h3>
            <p className="text-gray-500 mb-6">
              {searchTerm || categoryFilter !== 'all' 
                ? '다른 검색어나 카테고리를 시도해보세요' 
                : '첫 번째 상품을 등록해보세요!'}
            </p>
            {!searchTerm && categoryFilter === 'all' && (
              <button
                onClick={handleWriteClick}
                className="px-6 py-3 bg-amber-600 text-white rounded-lg hover:bg-amber-700 transition-colors"
              >
                상품 등록하기
              </button>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredPosts.map((post) => (
              <div
                key={post.id}
                onClick={() => handlePostClick(post.id)}
                className="bg-white rounded-lg shadow-md overflow-hidden hover:shadow-lg transition-shadow cursor-pointer"
              >
                <div className="aspect-square bg-gray-200 relative">
                  {post.images && post.images.length > 0 ? (
                    <>
                      <img
                        src={post.images[0]}
                        alt={post.title || '상품 이미지'}
                        className="w-full h-full object-cover"
                        onError={handleImageError}
                        loading="lazy"
                      />
                      <div className="w-full h-full flex items-center justify-center text-gray-400 hidden">
                        <span className="text-4xl">📷</span>
                      </div>
                    </>
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-gray-400">
                      <span className="text-4xl">📷</span>
                    </div>
                  )}
                  {post.sold && (
                    <div className="absolute top-2 right-2 bg-red-500 text-white px-2 py-1 rounded text-sm font-semibold">
                      판매완료
                    </div>
                  )}
                </div>
                <div className="p-4">
                  <h3 className="font-semibold text-gray-800 mb-2 line-clamp-2">
                    {post.title || '제목 없음'}
                  </h3>
                  <p className="text-amber-600 font-bold text-lg mb-2">
                    {formatPrice(post.price)}
                  </p>
                  <div className="grid grid-cols-2 gap-3 text-sm">
                    <div className="flex flex-col">
                      <span className="text-gray-500 text-xs mb-1">위치</span>
                      <span className="text-gray-600">{post.location || '위치 미설정'}</span>
                    </div>
                    <div className="flex flex-col">
                      <span className="text-gray-500 text-xs mb-1">등록일</span>
                      <span className="text-gray-600">{formatDate(post.createdAt)}</span>
                    </div>
                  </div>
                  {post.category && (
                    <div className="mt-2">
                      <span className="inline-block bg-gray-100 text-gray-600 px-2 py-1 rounded text-xs">
                        {categories.find(c => c.value === post.category)?.label || post.category}
                      </span>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default Marketplace;
