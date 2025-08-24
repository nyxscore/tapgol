import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { getPopularPosts } from "../util/popularPostsService";

const PopularPosts = () => {
  const [popularPosts, setPopularPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const loadPopularPosts = async () => {
      try {
        setLoading(true);
        const posts = await getPopularPosts(3);
        setPopularPosts(posts);
      } catch (err) {
        console.error("인기글 로딩 오류:", err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    loadPopularPosts();
  }, []);

  // 카테고리에 따른 아이콘과 색상을 반환하는 함수
  const getCategoryInfo = (category) => {
    const categoryMap = {
      '일반': {
        icon: '📋',
        bgColor: 'from-blue-400 to-blue-600',
        label: '일반'
      },
      '갤러리': {
        icon: '📸',
        bgColor: 'from-purple-400 to-purple-600',
        label: '갤러리'
      },
      '동네모임': {
        icon: '👥',
        bgColor: 'from-green-400 to-green-600',
        label: '동네모임'
      },
      '생활정보': {
        icon: '💡',
        bgColor: 'from-yellow-400 to-yellow-600',
        label: '생활정보'
      },
      '건강정보': {
        icon: '🏥',
        bgColor: 'from-red-400 to-red-600',
        label: '건강정보'
      },
      '노래방': {
        icon: '🎤',
        bgColor: 'from-pink-400 to-pink-600',
        label: '노래방'
      }
    };

    return categoryMap[category] || {
      icon: '📋',
      bgColor: 'from-gray-400 to-gray-600',
      label: category || '일반'
    };
  };

  // 날짜 포맷팅 함수
  const formatDate = (date) => {
    if (!date) return '';
    
    const now = new Date();
    const postDate = new Date(date);
    const diffTime = Math.abs(now - postDate);
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays === 1) return '오늘';
    if (diffDays === 2) return '어제';
    if (diffDays <= 7) return `${diffDays - 1}일 전`;
    
    return postDate.toLocaleDateString('ko-KR', {
      month: 'short',
      day: 'numeric'
    });
  };

  if (loading) {
    return (
      <section className="py-8 px-4">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-2xl font-bold text-gray-800 mb-6">오늘의 인기글</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="bg-white rounded-lg shadow-md overflow-hidden animate-pulse">
                <div className="p-4">
                  <div className="flex items-center space-x-3">
                    <div className="w-12 h-12 bg-gray-300 rounded-lg"></div>
                    <div className="flex-1">
                      <div className="h-4 bg-gray-300 rounded mb-2"></div>
                      <div className="h-5 bg-gray-300 rounded"></div>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>
    );
  }

  if (error) {
    return (
      <section className="py-8 px-4">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-2xl font-bold text-gray-800 mb-6">오늘의 인기글</h2>
          <div className="text-center text-gray-500 py-8">
            인기글을 불러오는데 실패했습니다.
          </div>
        </div>
      </section>
    );
  }

  return (
    <section className="py-8 px-4">
      <div className="max-w-4xl mx-auto">
        <h2 className="text-2xl font-bold text-gray-800 mb-6">오늘의 인기글</h2>

        {popularPosts.length === 0 ? (
          <div className="text-center text-gray-500 py-8">
            아직 인기글이 없습니다.
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {popularPosts.map((post) => {
              const categoryInfo = getCategoryInfo(post.category);
              
              // 갤러리 글인지 게시판 글인지에 따라 링크 경로 결정
              const linkPath = post.type === 'gallery' ? `/gallery/${post.id}` : `/board/${post.id}`;
              
              return (
                <Link
                  key={post.id}
                  to={linkPath}
                  className="bg-white rounded-lg shadow-md overflow-hidden hover:shadow-lg transition-shadow duration-200 block"
                >
                  <div className="p-4">
                    <div className="flex items-center space-x-3">
                      <div className={`w-12 h-12 bg-gradient-to-br ${categoryInfo.bgColor} rounded-lg flex items-center justify-center`}>
                        <span className="text-white text-xl">
                          {categoryInfo.icon}
                        </span>
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm text-gray-600">[{categoryInfo.label}]</p>
                        <p className="font-medium text-gray-800 truncate">
                          {post.title}
                        </p>
                        <div className="flex items-center space-x-2 mt-1">
                          <span className="text-xs text-gray-500">
                            {formatDate(post.createdAt)}
                          </span>
                          <span className="text-xs text-red-500">
                            ❤️ {post.likes || 0}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                </Link>
              );
            })}
          </div>
        )}
      </div>
    </section>
  );
};

export default PopularPosts;
