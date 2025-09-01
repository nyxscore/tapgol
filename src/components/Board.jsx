import React, { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { auth } from "../util/firebase";
import { onAuthStateChanged } from "firebase/auth";
import { getPosts } from "../util/postService";

const Board = () => {
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    // 로그인 상태 확인
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
    });

    // 게시글 데이터 로드
    const loadPosts = async () => {
      try {
        const postsData = await getPosts(20);
        setPosts(postsData);
      } catch (error) {
        console.error("게시글 로드 오류:", error);
        // 에러 시 기본 데이터 표시
        setPosts([
          {
            id: 1,
            title: "탑골공원에서 만난 할머니",
            author: "김할배",
            date: "2024-01-15",
            views: 156,
            likes: 23,
          },
          {
            id: 2,
            title: "오늘 바둑 대회 결과",
            author: "이장로",
            date: "2024-01-14",
            views: 89,
            likes: 15,
          },
          {
            id: 3,
            title: "새로운 운동 기구 설치",
            author: "박어르신",
            date: "2024-01-13",
            views: 234,
            likes: 45,
          },
        ]);
      } finally {
        setLoading(false);
      }
    };

    loadPosts();
    return () => unsubscribe();
  }, []);

  const handleWriteClick = () => {
    if (!user) {
      alert("글을 작성하려면 로그인이 필요합니다.");
      navigate("/login");
      return;
    }
    navigate("/board/write");
  };

  const handlePostClick = (postId) => {
    navigate(`/board/${postId}`);
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

  const isLikedByUser = (post) => {
    return user && post.likedBy && post.likedBy.includes(user.uid);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-amber-50 via-orange-50 to-amber-100 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-amber-700 mx-auto mb-4"></div>
          <p className="text-amber-700">게시글을 불러오는 중...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-amber-50 via-orange-50 to-amber-100 pb-20">
      <div className="max-w-4xl mx-auto p-6">
        {/* 헤더 */}
        <div className="bg-white rounded-2xl shadow-xl p-6 mb-6">
          <h1 className="text-3xl font-bold text-amber-700 mb-2 text-center">
            모임게시판
          </h1>
          <p className="text-gray-600 text-center">
            탑골공원 모임과 활동을 함께 나누어보세요
          </p>
        </div>

        {/* 게시글 목록 */}
        <div className="bg-white rounded-2xl shadow-xl p-6">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-xl font-bold text-gray-800">최신 모임 게시글</h2>
            <button 
              onClick={handleWriteClick}
              className={`px-4 py-2 rounded-lg transition-colors ${
                user 
                  ? "bg-amber-600 text-white hover:bg-amber-700" 
                  : "bg-gray-400 text-white hover:bg-gray-500"
              }`}
            >
                             {user ? "모임글쓰기" : "로그인 후 모임글쓰기"}
            </button>
          </div>

          <div className="space-y-4">
            {posts.length === 0 ? (
              <div className="text-center py-12">
                <div className="text-gray-400 text-6xl mb-4">📝</div>
                <p className="text-gray-600 text-lg mb-2">아직 게시글이 없습니다</p>
                <p className="text-gray-500">첫 번째 게시글을 작성해보세요!</p>
              </div>
            ) : (
              posts.map((post) => (
                <div
                  key={post.id}
                  onClick={() => handlePostClick(post.id)}
                  className="border border-gray-200 rounded-lg p-4 hover:bg-gray-50 transition-colors cursor-pointer"
                >
                  <div className="flex justify-between items-start">
                                         <div className="flex-1">
                       <div className="mb-2">
                         <h3 className="text-lg font-semibold text-gray-800 hover:text-amber-700 transition-colors mb-2">
                           {post.title}
                         </h3>
                         <span className={`px-2 py-1 rounded-full text-xs font-semibold ${
                           post.category === "정기모임" 
                             ? "bg-red-500 text-white" 
                             : "bg-amber-100 text-amber-800"
                         }`}>
                           {post.category || "정기모임"}
                         </span>
                       </div>
                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-sm">
                        <div className="flex flex-col">
                          <span className="text-gray-500 text-xs mb-1">작성자</span>
                          <span className="font-medium text-gray-800">{post.author}</span>
                        </div>
                        <div className="flex flex-col">
                          <span className="text-gray-500 text-xs mb-1">작성일</span>
                          <span className="text-gray-600">{formatDate(post.createdAt)}</span>
                        </div>
                        <div className="flex flex-col">
                          <span className="text-gray-500 text-xs mb-1">조회수</span>
                          <span className="text-gray-600">{post.views || 0}</span>
                        </div>
                        <div className="flex flex-col">
                          <span className="text-gray-500 text-xs mb-1">좋아요</span>
                          <div className="flex items-center space-x-1">
                            <svg 
                              className={`w-4 h-4 ${isLikedByUser(post) ? "text-red-500 fill-current" : "text-gray-400"}`} 
                              stroke="currentColor" 
                              viewBox="0 0 24 24"
                            >
                              <path 
                                strokeLinecap="round" 
                                strokeLinejoin="round" 
                                strokeWidth={2} 
                                d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" 
                              />
                            </svg>
                            <span className={`${isLikedByUser(post) ? "text-red-500 font-semibold" : "text-gray-600"}`}>
                              {post.likes || 0}
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>
                    <div className="ml-4">
                      <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                      </svg>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>

          {/* 페이지네이션 */}
          {posts.length > 0 && (
            <div className="flex justify-center mt-8">
              <div className="flex space-x-2">
                <button className="px-3 py-2 border border-gray-300 rounded-lg hover:bg-gray-50">
                  이전
                </button>
                <button className="px-3 py-2 bg-amber-600 text-white rounded-lg">
                  1
                </button>
                <button className="px-3 py-2 border border-gray-300 rounded-lg hover:bg-gray-50">
                  2
                </button>
                <button className="px-3 py-2 border border-gray-300 rounded-lg hover:bg-gray-50">
                  3
                </button>
                <button className="px-3 py-2 border border-gray-300 rounded-lg hover:bg-gray-50">
                  다음
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Board;
