import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Header from './Header';
import BottomNavigation from './BottomNavigation';

const Gallery = () => {
  const navigate = useNavigate();
  const [posts, setPosts] = useState([
    {
      id: 1,
      title: '오늘의 맛집 탐방',
      author: '맛집러버',
      image: '../맛집사진.jpg',
      content: '오늘 발견한 정말 맛있는 음식점을 공유합니다!',
      likes: 24,
      comments: 8,
      date: '2024-01-15'
    },
    {
      id: 2,
      title: '주말 등산 후기',
      author: '산사랑',
      image: 'https://images.unsplash.com/photo-1551632811-561732d1e306?w=400&h=300&fit=crop',
      content: '주말에 등산 다녀왔는데 정말 아름다운 풍경이었어요.',
      likes: 42,
      comments: 15,
      date: '2024-01-14'
    },
    {
      id: 3,
      title: '새로 산 카메라로 찍은 사진',
      author: '포토그래퍼',
      image: 'https://images.unsplash.com/photo-1516035069371-29a1b244cc32?w=400&h=300&fit=crop',
      content: '새로 구매한 카메라로 찍은 첫 사진입니다.',
      likes: 67,
      comments: 23,
      date: '2024-01-13'
    },
    {
      id: 4,
      title: '집에서 만든 수제 쿠키',
      author: '베이킹마스터',
      image: 'https://images.unsplash.com/photo-1499636136210-6f4ee915583e?w=400&h=300&fit=crop',
      content: '오늘 집에서 만든 수제 쿠키입니다. 정말 맛있어요!',
      likes: 89,
      comments: 31,
      date: '2024-01-12'
    },
    {
      id: 5,
      title: '강아지와의 산책',
      author: '펫러버',
      image: 'https://images.unsplash.com/photo-1548199973-03cce0bbc87b?w=400&h=300&fit=crop',
      content: '우리 강아지와 함께한 즐거운 산책 시간입니다.',
      likes: 156,
      comments: 45,
      date: '2024-01-11'
    },
    {
      id: 6,
      title: '일몰 사진',
      author: '자연사랑',
      image: 'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=400&h=300&fit=crop',
      content: '오늘 저녁에 찍은 아름다운 일몰 사진입니다.',
      likes: 203,
      comments: 67,
      date: '2024-01-10'
    }
  ]);

  const handlePostClick = (postId) => {
    navigate(`/gallery/${postId}`);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-amber-50 via-orange-50 to-amber-100">
      <Header />
      <main className="pb-20 pt-16">
        <div className="max-w-4xl mx-auto px-4">
          <div className="mb-6">
            <h1 className="text-2xl font-bold text-gray-800 mb-2">갤러리</h1>
            <p className="text-gray-600">사진과 함께하는 이야기들을 확인해보세요</p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {posts.map((post) => (
              <div
                key={post.id}
                onClick={() => handlePostClick(post.id)}
                className="bg-white rounded-lg shadow-md overflow-hidden cursor-pointer transform transition-transform hover:scale-105 hover:shadow-lg"
              >
                <div className="relative">
                  <img
                    src={post.image}
                    alt={post.title}
                    className="w-full h-48 object-cover"
                  />
                  <div className="absolute top-2 right-2 bg-black bg-opacity-50 text-white text-xs px-2 py-1 rounded">
                    {post.date}
                  </div>
                </div>
                <div className="p-4">
                  <h3 className="font-semibold text-gray-800 mb-2 line-clamp-2">
                    {post.title}
                  </h3>
                  <p className="text-sm text-gray-600 mb-3 line-clamp-2">
                    {post.content}
                  </p>
                  <div className="flex items-center justify-between text-sm text-gray-500">
                    <span className="font-medium">{post.author}</span>
                    <div className="flex items-center space-x-3">
                      <div className="flex items-center space-x-1">
                        <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                          <path d="M2 10.5a1.5 1.5 0 113 0v6a1.5 1.5 0 01-3 0v-6zM6 10.333v5.43a2 2 0 001.106 1.79l.05.025A4 4 0 008.943 18h5.416a2 2 0 001.962-1.608l1.2-6A2 2 0 0015.56 8H12V4a2 2 0 00-2-2 1 1 0 00-1 1v.667a4 4 0 01-.8 2.4L6.8 7.933a4 4 0 00-.8 2.4z" />
                        </svg>
                        <span>{post.likes}</span>
                      </div>
                      <div className="flex items-center space-x-1">
                        <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M18 10c0 3.866-3.582 7-8 7a8.841 8.841 0 01-4.083-.98L2 17l1.338-3.123C2.493 12.767 2 11.434 2 10c0-3.866 3.582-7 8-7s8 3.134 8 7zM7 9H5v2h2V9zm8 0h-2v2h2V9zM9 9h2v2H9V9z" clipRule="evenodd" />
                        </svg>
                        <span>{post.comments}</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </main>
      <BottomNavigation />
    </div>
  );
};

export default Gallery;
