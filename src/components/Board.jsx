import React, { useState } from 'react';
import { useParams } from 'react-router-dom';
import BottomNavigation from './BottomNavigation';

const Board = () => {
  const { id } = useParams();
  const [posts] = useState([
    {
      id: 1,
      title: "오늘 공원에서 만난 이웃분들",
      author: "김철수",
      date: "2024-01-15",
      views: 45,
      likes: 12,
      content: "오늘 탑골공원에서 산책하다가 이웃분들과 인사를 나눴는데, 정말 따뜻한 분들이셨어요. 이런 소통이 참 좋은 것 같습니다."
    },
    {
      id: 2,
      title: "공원 정화 활동 후기",
      author: "이영희",
      date: "2024-01-14",
      views: 32,
      likes: 8,
      content: "지난주에 진행한 공원 정화 활동에 참여했는데, 많은 분들이 함께해주셔서 감사했습니다. 다음에도 참여하고 싶어요!"
    },
    {
      id: 3,
      title: "새로 오신 이웃분 환영합니다",
      author: "박민수",
      date: "2024-01-13",
      views: 67,
      likes: 15,
      content: "우리 동네에 새로 이사 오신 분들 환영합니다! 탑골공원에서 자주 만나뵙길 바라며, 따뜻한 이웃이 되었으면 좋겠어요."
    },
    {
      id: 4,
      title: "공원 벚꽃 개화 소식",
      author: "최미영",
      date: "2024-01-12",
      views: 89,
      likes: 23,
      content: "탑골공원의 벚꽃이 곧 피기 시작할 것 같아요. 벚꽃 축제도 계획 중이라고 하니 기대가 됩니다!"
    },
    {
      id: 5,
      title: "이웃 간 도움 요청",
      author: "정수진",
      date: "2024-01-11",
      views: 28,
      likes: 6,
      content: "혹시 우리 동네에서 개를 키우시는 분 계신가요? 강아지 산책 팁을 여쭤보고 싶어요."
    }
  ]);

  const [selectedPost, setSelectedPost] = useState(null);

  // /board/:id로 접근 시 해당 게시글 보여주기
  const postById = id ? posts.find(post => post.id === Number(id)) : null;

  const handlePostClick = (post) => {
    setSelectedPost(post);
  };

  const handleBackToList = () => {
    setSelectedPost(null);
  };

  if (postById || selectedPost) {
    const post = postById || selectedPost;
    return (
      <div className="min-h-screen bg-gradient-to-br from-amber-50 via-orange-50 to-amber-100">
        <div className="max-w-4xl mx-auto px-4 py-8 pb-20">
          {/* 헤더 */}
          <div className="flex items-center justify-between mb-6">
            <button 
              onClick={handleBackToList}
              className="flex items-center text-amber-700 hover:text-amber-800 font-medium"
            >
              <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
              목록으로 돌아가기
            </button>
            <h1 className="text-2xl font-bold text-gray-800">게시판</h1>
          </div>

          {/* 게시글 상세 */}
          <div className="bg-white rounded-2xl shadow-lg p-6">
            <div className="border-b border-gray-200 pb-4 mb-6">
              <h2 className="text-2xl font-bold text-gray-800 mb-2">{post.title}</h2>
              <div className="flex items-center text-sm text-gray-600 space-x-4">
                <span>작성자: {post.author}</span>
                <span>작성일: {post.date}</span>
                <span>조회수: {post.views}</span>
                <span>좋아요: {post.likes}</span>
              </div>
            </div>
            <div className="text-gray-700 leading-relaxed">
              {post.content}
            </div>
            
            {/* 댓글 섹션 */}
            <div className="mt-8 pt-6 border-t border-gray-200">
              <h3 className="text-lg font-semibold text-gray-800 mb-4">댓글</h3>
              <div className="space-y-4">
                <div className="bg-gray-50 rounded-lg p-4">
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-medium text-gray-800">이웃분1</span>
                    <span className="text-sm text-gray-600">2024-01-15</span>
                  </div>
                  <p className="text-gray-700">정말 따뜻한 이야기네요! 저도 같은 생각입니다.</p>
                </div>
                <div className="bg-gray-50 rounded-lg p-4">
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-medium text-gray-800">이웃분2</span>
                    <span className="text-sm text-gray-600">2024-01-15</span>
                  </div>
                  <p className="text-gray-700">우리 동네가 정말 좋은 곳이에요!</p>
                </div>
              </div>
              
              {/* 댓글 작성 */}
              <div className="mt-6">
                <textarea 
                  className="w-full p-3 border border-gray-300 rounded-lg resize-none focus:outline-none focus:ring-2 focus:ring-amber-500"
                  rows="3"
                  placeholder="댓글을 작성해주세요..."
                ></textarea>
                <button className="mt-2 bg-amber-600 hover:bg-amber-700 text-white px-4 py-2 rounded-lg transition-colors duration-200">
                  댓글 작성
                </button>
              </div>
            </div>
          </div>
        </div>
        <BottomNavigation />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-amber-50 via-orange-50 to-amber-100">
      <div className="max-w-4xl mx-auto px-4 py-8 pb-20">
        {/* 헤더 */}
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-3xl font-bold text-gray-800">이웃 게시판</h1>
          <button className="bg-amber-600 hover:bg-amber-700 text-white px-4 py-2 rounded-lg transition-colors duration-200">
            글쓰기
          </button>
        </div>

        {/* 게시글 목록 */}
        <div className="space-y-4">
          {posts.map((post) => (
            <div 
              key={post.id}
              onClick={() => handlePostClick(post)}
              className="bg-white rounded-xl shadow-md p-6 cursor-pointer hover:shadow-lg transition-shadow duration-200"
            >
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-lg font-semibold text-gray-800 hover:text-amber-700 transition-colors duration-200">
                  {post.title}
                </h3>
                <div className="flex items-center space-x-4 text-sm text-gray-600">
                  <span>조회 {post.views}</span>
                  <span>♥ {post.likes}</span>
                </div>
              </div>
              <p className="text-gray-600 mb-3 line-clamp-2">
                {post.content}
              </p>
              <div className="flex items-center justify-between text-sm text-gray-500">
                <span>작성자: {post.author}</span>
                <span>{post.date}</span>
              </div>
            </div>
          ))}
        </div>

        {/* 페이지네이션 */}
        <div className="flex justify-center mt-8">
          <div className="flex space-x-2">
            <button className="px-3 py-2 text-gray-600 hover:text-amber-700">이전</button>
            <button className="px-3 py-2 bg-amber-600 text-white rounded-lg">1</button>
            <button className="px-3 py-2 text-gray-600 hover:text-amber-700">2</button>
            <button className="px-3 py-2 text-gray-600 hover:text-amber-700">3</button>
            <button className="px-3 py-2 text-gray-600 hover:text-amber-700">다음</button>
          </div>
        </div>
      </div>
      <BottomNavigation />
    </div>
  );
};

export default Board;
