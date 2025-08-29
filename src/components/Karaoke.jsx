import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { auth } from "../util/firebase";
import { onAuthStateChanged } from "firebase/auth";
import { getKaraokePosts, toggleLike, incrementViews } from "../util/karaokeService";

const Karaoke = () => {
  const navigate = useNavigate();
  const [posts, setPosts] = useState([]);
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      loadKaraokePosts();
    });

    return () => unsubscribe();
  }, []);

  const loadKaraokePosts = async () => {
    try {
      setLoading(true);
      setError(null);
      const postsData = await getKaraokePosts();
      setPosts(postsData);
    } catch (error) {
      console.error("노래자랑 게시글 로드 오류:", error);
      setError("게시글을 불러오는데 실패했습니다.");
    } finally {
      setLoading(false);
    }
  };

  const handlePostClick = async (postId) => {
    try {
      if (user) {
        await incrementViews(postId);
      }
      navigate(`/karaoke/${postId}`);
    } catch (error) {
      console.error("조회수 증가 오류:", error);
      navigate(`/karaoke/${postId}`);
    }
  };

  const handleUploadClick = () => {
    if (!user) {
      alert("영상을 업로드하려면 로그인이 필요합니다.");
      navigate("/login");
      return;
    }
    navigate("/karaoke/upload");
  };

  const handleLike = async (e, postId) => {
    e.stopPropagation();
    
    if (!user) {
      alert("좋아요를 누르려면 로그인이 필요합니다.");
      navigate("/login");
      return;
    }

    try {
      const isLiked = await toggleLike(postId, user.uid);
      
      setPosts(prev => prev.map(post => {
        if (post.id === postId) {
          return {
            ...post,
            likes: isLiked ? (post.likes || 0) + 1 : (post.likes || 0) - 1,
            likedBy: isLiked 
              ? [...(post.likedBy || []), user.uid]
              : (post.likedBy || []).filter(uid => uid !== user.uid)
          };
        }
        return post;
      }));
    } catch (error) {
      console.error("좋아요 처리 오류:", error);
      alert("좋아요 처리에 실패했습니다.");
    }
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
    return user && post.likedBy?.includes(user.uid);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-amber-50 via-orange-50 to-amber-100">
        <main className="pb-20 pt-16">
          <div className="max-w-4xl mx-auto px-4">
            <div className="text-center py-12">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-amber-700 mx-auto mb-4"></div>
              <p className="text-amber-700">노래자랑 영상을 불러오는 중...</p>
            </div>
          </div>
        </main>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-amber-50 via-orange-50 to-amber-100">
        <main className="pb-20 pt-16">
          <div className="max-w-4xl mx-auto px-4">
            <div className="text-center py-12">
              <p className="text-red-600 text-lg mb-4">{error}</p>
              <button
                onClick={loadKaraokePosts}
                className="px-4 py-2 bg-amber-600 text-white rounded-lg hover:bg-amber-700 transition-colors"
              >
                다시 시도
              </button>
            </div>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-amber-50 via-orange-50 to-amber-100">
      <main className="pb-20 pt-16">
        <div className="max-w-4xl mx-auto px-4">
          <div className="mb-6">
            <div className="flex items-center justify-between mb-2">
              <h1 className="text-2xl font-bold text-gray-800">노래자랑</h1>
              <button
                onClick={handleUploadClick}
                className="bg-amber-600 text-white px-4 py-2 rounded-lg hover:bg-amber-700 transition-colors flex items-center space-x-2"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
                <span>업로드</span>
              </button>
            </div>
                           <p className="text-gray-600">노래자랑 영상을 공유하고 소통해보세요</p>
          </div>

          {posts.length === 0 ? (
            <div className="text-center py-12">
              <div className="text-gray-400 text-6xl mb-4">🎤</div>
                             <p className="text-gray-600 text-lg mb-2">아직 노래자랑 영상이 없습니다</p>
                             <p className="text-gray-500 mb-6">첫 번째 노래자랑 영상을 업로드해보세요!</p>
              <button
                onClick={handleUploadClick}
                className="bg-amber-600 text-white px-6 py-3 rounded-lg hover:bg-amber-700 transition-colors"
              >
                                 노래자랑 영상 업로드하기
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {posts.map((post) => (
                <div
                  key={post.id}
                  onClick={() => handlePostClick(post.id)}
                  className="bg-white rounded-lg shadow-md overflow-hidden cursor-pointer transform transition-transform hover:scale-105 hover:shadow-lg"
                >
                  <div className="relative">
                    <video
                      src={post.videoUrl}
                      className="w-full h-48 object-cover"
                      muted
                      onMouseOver={async (e) => {
                        try {
                          await e.target.play();
                        } catch (error) {
                          // AbortError는 무시 (사용자가 빠르게 마우스를 움직일 때 발생)
                          if (error.name !== 'AbortError') {
                            console.error('비디오 재생 오류:', error);
                          }
                        }
                      }}
                      onMouseOut={(e) => {
                        try {
                          e.target.pause();
                          e.target.currentTime = 0;
                        } catch (error) {
                          console.error('비디오 일시정지 오류:', error);
                        }
                      }}
                    />
                    <div className="absolute top-2 right-2 bg-black bg-opacity-50 text-white text-xs px-2 py-1 rounded flex items-center space-x-1">
                      <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                        <path d="M2 6a2 2 0 012-2h6a2 2 0 012 2v8a2 2 0 01-2 2H4a2 2 0 01-2-2V6zM14.553 7.106A1 1 0 0014 8v4a1 1 0 00.553.894l2 1A1 1 0 0018 13V7a1 1 0 00-1.447-.894l-2 1z" />
                      </svg>
                      <span>{formatDate(post.createdAt)}</span>
                    </div>
                  </div>
                  <div className="p-4">
                    <h3 className="font-semibold text-gray-800 mb-2 line-clamp-2">{post.title}</h3>
                    {post.description && (
                      <p className="text-sm text-gray-600 mb-3 line-clamp-2">{post.description}</p>
                    )}
                    <div className="flex items-center justify-between text-sm text-gray-500">
                      <span className="font-medium">{post.author}</span>
                      <div className="flex items-center space-x-3">
                        <button
                          onClick={(e) => handleLike(e, post.id)}
                          className={`flex items-center space-x-1 transition-colors ${
                            isLikedByUser(post) ? 'text-red-500' : 'text-gray-500 hover:text-red-500'
                          }`}
                        >
                          <svg className="w-4 h-4" fill={isLikedByUser(post) ? "currentColor" : "none"} stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                          </svg>
                          <span>{post.likes || 0}</span>
                        </button>
                        <div className="flex items-center space-x-1">
                          <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                            <path d="M10 12a2 2 0 100-4 2 2 0 000 4z" />
                            <path fillRule="evenodd" d="M.458 10C1.732 5.943 5.522 3 10 3s8.268 2.943 9.542 7c-1.274 4.057-5.064 7-9.542 7S1.732 14.057.458 10zM14 10a4 4 0 11-8 0 4 4 0 018 0z" clipRule="evenodd" />
                          </svg>
                          <span>{post.views || 0}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </main>
    </div>
  );
};

export default Karaoke;
