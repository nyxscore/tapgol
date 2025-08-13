import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import Header from './Header';
import BottomNavigation from './BottomNavigation';

const GalleryDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [post, setPost] = useState(null);
  const [comments, setComments] = useState([]);
  const [newComment, setNewComment] = useState('');
  const [isLiked, setIsLiked] = useState(false);

  // 샘플 데이터
  const samplePosts = {
    1: {
      id: 1,
      title: '오늘의 맛집 탐방',
      author: '맛집러버',
      image: 'https://images.unsplash.com/photo-1504674900240-9c9c0c1d0b1a?w=800&h=600&fit=crop',
      content: '오늘 발견한 정말 맛있는 음식점을 공유합니다! 이곳은 정말 분위기도 좋고 음식도 맛있어서 여러분께 추천드려요. 특히 이곳의 시그니처 메뉴는 정말 대박입니다. 다음에 또 방문하고 싶은 곳이에요.',
      likes: 24,
      comments: 8,
      date: '2024-01-15'
    },
    2: {
      id: 2,
      title: '주말 등산 후기',
      author: '산사랑',
      image: 'https://images.unsplash.com/photo-1551632811-561732d1e306?w=800&h=600&fit=crop',
      content: '주말에 등산 다녀왔는데 정말 아름다운 풍경이었어요. 날씨도 좋고 산의 정기도 맑아서 정말 힐링되는 시간이었습니다. 정상에서 바라본 전경은 정말 말로 표현할 수 없을 정도로 아름다웠어요.',
      likes: 42,
      comments: 15,
      date: '2024-01-14'
    },
    3: {
      id: 3,
      title: '새로 산 카메라로 찍은 사진',
      author: '포토그래퍼',
      image: 'https://images.unsplash.com/photo-1516035069371-29a1b244cc32?w=800&h=600&fit=crop',
      content: '새로 구매한 카메라로 찍은 첫 사진입니다. 이 카메라의 성능이 정말 대단하네요. 색감도 좋고 선명도도 훌륭합니다. 앞으로 더 많은 좋은 사진들을 찍어서 공유하겠습니다.',
      likes: 67,
      comments: 23,
      date: '2024-01-13'
    },
    4: {
      id: 4,
      title: '집에서 만든 수제 쿠키',
      author: '베이킹마스터',
      image: 'https://images.unsplash.com/photo-1499636136210-6f4ee915583e?w=800&h=600&fit=crop',
      content: '오늘 집에서 만든 수제 쿠키입니다. 정말 맛있어요! 레시피도 공유해드릴게요. 버터, 설탕, 밀가루, 계란만 있으면 누구나 쉽게 만들 수 있어요. 특히 초콜릿 칩을 넣으면 더욱 맛있습니다.',
      likes: 89,
      comments: 31,
      date: '2024-01-12'
    },
    5: {
      id: 5,
      title: '강아지와의 산책',
      author: '펫러버',
      image: 'https://images.unsplash.com/photo-1548199973-03cce0bbc87b?w=800&h=600&fit=crop',
      content: '우리 강아지와 함께한 즐거운 산책 시간입니다. 날씨가 좋아서 공원에 나갔는데, 강아지가 정말 행복해 보였어요. 다른 강아지들과도 잘 놀고, 공을 가지고 뛰어다니는 모습이 너무 귀여웠습니다.',
      likes: 156,
      comments: 45,
      date: '2024-01-11'
    },
    6: {
      id: 6,
      title: '일몰 사진',
      author: '자연사랑',
      image: 'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=800&h=600&fit=crop',
      content: '오늘 저녁에 찍은 아름다운 일몰 사진입니다. 하늘의 색깔이 정말 환상적이었어요. 빨간색, 주황색, 노란색이 섞여서 마치 그림을 그린 것 같았습니다. 이런 순간들이 삶을 아름답게 만드는 것 같아요.',
      likes: 203,
      comments: 67,
      date: '2024-01-10'
    }
  };

  const sampleComments = {
    1: [
      { id: 1, author: '음식탐험가', content: '정말 맛있어 보이네요! 주소 알려주실 수 있나요?', date: '2024-01-15 14:30' },
      { id: 2, author: '맛집러버', content: '네! 서울 강남구 테헤란로 123번지에 있어요. 꼭 가보세요!', date: '2024-01-15 15:00' },
      { id: 3, author: '요리사', content: '이런 음식점이 있다니 놀라워요. 다음에 가보겠습니다!', date: '2024-01-15 16:15' }
    ],
    2: [
      { id: 1, author: '등산초보', content: '어느 산인가요? 초보자도 갈 수 있는 곳인가요?', date: '2024-01-14 10:20' },
      { id: 2, author: '산사랑', content: '북한산이에요! 초보자도 충분히 갈 수 있는 코스입니다.', date: '2024-01-14 11:00' }
    ],
    3: [
      { id: 1, author: '카메라매니아', content: '어떤 카메라인가요? 렌즈는 뭘 사용하셨나요?', date: '2024-01-13 09:30' },
      { id: 2, author: '포토그래퍼', content: 'Canon EOS R5에 24-70mm f/2.8 렌즈 사용했습니다!', date: '2024-01-13 10:15' }
    ]
  };

  useEffect(() => {
    const currentPost = samplePosts[id];
    const currentComments = sampleComments[id] || [];
    
    if (currentPost) {
      setPost(currentPost);
      setComments(currentComments);
    }
  }, [id]);

  const handleLike = () => {
    if (post) {
      setPost(prev => ({
        ...prev,
        likes: isLiked ? prev.likes - 1 : prev.likes + 1
      }));
      setIsLiked(!isLiked);
    }
  };

  const handleCommentSubmit = (e) => {
    e.preventDefault();
    if (newComment.trim()) {
      const comment = {
        id: comments.length + 1,
        author: '나',
        content: newComment,
        date: new Date().toLocaleString('ko-KR')
      };
      setComments([...comments, comment]);
      setNewComment('');
    }
  };

  if (!post) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-amber-50 via-orange-50 to-amber-100 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-500 mx-auto mb-4"></div>
          <p className="text-gray-600">로딩 중...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-amber-50 via-orange-50 to-amber-100">
      <Header />
      <main className="pb-20 pt-16">
        <div className="max-w-4xl mx-auto px-4">
          {/* 뒤로가기 버튼 */}
          <button
            onClick={() => navigate('/gallery')}
            className="mb-4 flex items-center text-gray-600 hover:text-gray-800 transition-colors"
          >
            <svg className="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M9.707 16.707a1 1 0 01-1.414 0l-6-6a1 1 0 010-1.414l6-6a1 1 0 011.414 1.414L5.414 9H17a1 1 0 110 2H5.414l4.293 4.293a1 1 0 010 1.414z" clipRule="evenodd" />
            </svg>
            갤러리로 돌아가기
          </button>

          {/* 포스트 내용 */}
          <div className="bg-white rounded-lg shadow-lg overflow-hidden mb-6">
            <img
              src={post.image}
              alt={post.title}
              className="w-full h-64 md:h-96 object-cover"
            />
            <div className="p-6">
              <div className="flex items-center justify-between mb-4">
                <h1 className="text-2xl font-bold text-gray-800">{post.title}</h1>
                <span className="text-sm text-gray-500">{post.date}</span>
              </div>
              
              <div className="flex items-center justify-between mb-4">
                <span className="text-gray-600 font-medium">작성자: {post.author}</span>
                <div className="flex items-center space-x-4">
                  <button
                    onClick={handleLike}
                    className={`flex items-center space-x-1 px-3 py-1 rounded-full transition-colors ${
                      isLiked 
                        ? 'bg-red-100 text-red-600' 
                        : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                    }`}
                  >
                    <svg className="w-4 h-4" fill={isLiked ? "currentColor" : "none"} stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                    </svg>
                    <span>{post.likes}</span>
                  </button>
                  <div className="flex items-center space-x-1 text-gray-500">
                    <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M18 10c0 3.866-3.582 7-8 7a8.841 8.841 0 01-4.083-.98L2 17l1.338-3.123C2.493 12.767 2 11.434 2 10c0-3.866 3.582-7 8-7s8 3.134 8 7zM7 9H5v2h2V9zm8 0h-2v2h2V9zM9 9h2v2H9V9z" clipRule="evenodd" />
                    </svg>
                    <span>{comments.length}</span>
                  </div>
                </div>
              </div>
              
              <p className="text-gray-700 leading-relaxed whitespace-pre-wrap">
                {post.content}
              </p>
            </div>
          </div>

          {/* 댓글 섹션 */}
          <div className="bg-white rounded-lg shadow-lg p-6">
            <h3 className="text-lg font-semibold text-gray-800 mb-4">댓글 ({comments.length})</h3>
            
            {/* 댓글 목록 */}
            <div className="space-y-4 mb-6">
              {comments.map((comment) => (
                <div key={comment.id} className="border-b border-gray-100 pb-4 last:border-b-0">
                  <div className="flex items-start justify-between mb-2">
                    <span className="font-medium text-gray-800">{comment.author}</span>
                    <span className="text-sm text-gray-500">{comment.date}</span>
                  </div>
                  <p className="text-gray-700">{comment.content}</p>
                </div>
              ))}
            </div>

            {/* 댓글 작성 폼 */}
            <form onSubmit={handleCommentSubmit} className="border-t border-gray-100 pt-4">
              <div className="flex space-x-3">
                <input
                  type="text"
                  value={newComment}
                  onChange={(e) => setNewComment(e.target.value)}
                  placeholder="댓글을 입력하세요..."
                  className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                />
                <button
                  type="submit"
                  className="px-6 py-2 bg-orange-500 text-white rounded-lg hover:bg-orange-600 transition-colors focus:outline-none focus:ring-2 focus:ring-orange-500 focus:ring-offset-2"
                >
                  작성
                </button>
              </div>
            </form>
          </div>
        </div>
      </main>
      <BottomNavigation />
    </div>
  );
};

export default GalleryDetail;
