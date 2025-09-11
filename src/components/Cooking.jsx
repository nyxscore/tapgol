import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { collection, getDocs, orderBy, query } from 'firebase/firestore';
import { db } from '../util/firebase';
import { FaPlus, FaSearch } from 'react-icons/fa';
import UserProfileModal from './UserProfileModal';
import { navigateToDM } from '../util/dmUtils';
import { useAuth } from '../contexts/AuthContext';

const Cooking = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  // 프로필 모달 관련 상태
  const [showProfileModal, setShowProfileModal] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);

  useEffect(() => {
    loadPosts();
  }, []);

  const loadPosts = async () => {
    try {
      const q = query(collection(db, "cookingPosts"), orderBy("createdAt", "desc"));
      const querySnapshot = await getDocs(q);
      const postsData = [];
      querySnapshot.forEach((doc) => {
        postsData.push({
          id: doc.id,
          ...doc.data()
        });
      });
      setPosts(postsData);
    } catch (error) {
      console.error("요리 게시글 로드 오류:", error);
    } finally {
      setLoading(false);
    }
  };

  const filteredPosts = posts.filter(post =>
    post.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    post.content?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    post.author?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // 프로필 관련 함수들
  const handleShowProfile = (userId, userName) => {
    setSelectedUser({ id: userId, name: userName });
    setShowProfileModal(true);
  };

  const handleCloseProfileModal = () => {
    setShowProfileModal(false);
    setSelectedUser(null);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-amber-50 via-orange-50 to-amber-100">
        <main className="pb-20 pt-16">
          <div className="max-w-4xl mx-auto px-4">
            <div className="text-center py-12">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-amber-700 mx-auto mb-4"></div>
              <p className="text-amber-700">요리 게시글을 불러오는 중...</p>
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
          {/* Header */}
          <div className="bg-white rounded-2xl shadow-xl p-6 mb-6">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
              <div>
                <h1 className="text-2xl font-bold text-gray-800">나만의요리 👨‍🍳</h1>
                <p className="text-gray-600 mt-1">맛있는 요리 레시피와 요리 팁을 공유해보세요</p>
              </div>
              <button
                onClick={() => navigate('/cooking/write')}
                className="mt-4 sm:mt-0 px-6 py-3 bg-amber-600 text-white rounded-lg hover:bg-amber-700 transition-colors flex items-center justify-center space-x-2"
              >
                <FaPlus className="text-sm" />
                <span>요리글쓰기</span>
              </button>
            </div>
          </div>

          {/* Search Bar */}
          <div className="bg-white rounded-2xl shadow-xl p-6 mb-6">
            <div className="relative">
              <FaSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                placeholder="요리 제목, 내용, 작성자로 검색..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent"
              />
            </div>
          </div>

          {/* Posts List */}
          <div className="bg-white rounded-2xl shadow-xl p-6">
            <h2 className="text-xl font-bold text-gray-800 mb-6">최신 요리 게시글</h2>
            
            {filteredPosts.length === 0 ? (
              <div className="text-center py-12">
                <div className="text-gray-400 text-6xl mb-4">👨‍🍳</div>
                <p className="text-gray-500 text-lg mb-2">
                  {searchTerm ? '검색 결과가 없습니다.' : '아직 요리 게시글이 없습니다.'}
                </p>
                {!searchTerm && (
                  <p className="text-gray-400">첫 번째 요리 레시피를 공유해보세요!</p>
                )}
              </div>
            ) : (
              <div className="space-y-4">
                {filteredPosts.map((post) => (
                  <div
                    key={post.id}
                    onClick={() => {
                      console.log('요리게시판 클릭:', post.id);
                      console.log('이동할 URL:', `/cooking/${post.id}`);
                      navigate(`/cooking/${post.id}`);
                    }}
                    className="p-4 border border-gray-200 rounded-lg hover:border-amber-300 hover:shadow-md transition-all cursor-pointer"
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <h3 className="font-semibold text-gray-800 text-lg mb-2 line-clamp-2">
                          {post.title}
                        </h3>
                        <p className="text-gray-600 text-sm line-clamp-2 mb-3">
                          {post.content}
                        </p>
                        
                        {/* 이미지 미리보기 */}
                        {post.images && post.images.length > 0 && (
                          <div className="mb-3">
                            <div className="flex space-x-2">
                              {post.images.slice(0, 3).map((imageUrl, index) => (
                                <img
                                  key={index}
                                  src={imageUrl}
                                  alt={`요리 사진 ${index + 1}`}
                                  className="w-16 h-16 object-cover rounded border"
                                  onError={(e) => {
                                    console.error(`목록 이미지 로드 실패:`, imageUrl);
                                    e.target.style.display = 'none';
                                  }}
                                />
                              ))}
                              {post.images.length > 3 && (
                                <div className="w-16 h-16 bg-gray-200 rounded border flex items-center justify-center text-xs text-gray-500">
                                  +{post.images.length - 3}
                                </div>
                              )}
                            </div>
                          </div>
                        )}
                        
                        {/* Post Details Grid */}
                        <div className="grid grid-cols-2 gap-3 text-sm">
                          <div>
                            <span className="text-gray-500">작성자</span>
                            <div 
                              className="font-medium text-gray-700 hover:text-amber-600 cursor-pointer transition-colors"
                              onClick={(e) => {
                                e.stopPropagation();
                                navigateToDM(post.authorId, user, navigate);
                              }}
                              title="1:1 채팅하기"
                            >
                              {post.author || "익명"}
                            </div>
                          </div>
                          <div>
                            <span className="text-gray-500">작성일</span>
                            <div className="font-medium text-gray-700">
                              {post.createdAt?.toDate ? 
                                post.createdAt.toDate().toLocaleDateString('ko-KR') : 
                                "날짜 없음"
                              }
                            </div>
                          </div>
                          {post.modifiedAt && (
                            <div>
                              <span className="text-gray-500">수정일</span>
                              <div className="font-medium text-gray-700">
                                {post.modifiedAt?.toDate ? 
                                  post.modifiedAt.toDate().toLocaleDateString('ko-KR') : 
                                  "날짜 없음"
                                }
                              </div>
                            </div>
                          )}
                          <div>
                            <span className="text-gray-500">조회수</span>
                            <div className="font-medium text-gray-700">{post.views || 0}</div>
                          </div>
                                                                <div>
                                        <span className="text-gray-500">좋아요</span>
                                        <div className="font-medium text-gray-700">{post.likes || 0}</div>
                                      </div>
                                      <div>
                                        <span className="text-gray-500">댓글</span>
                                        <div className="font-medium text-gray-700">{post.commentCount || 0}</div>
                                      </div>
                                      {post.category && (
                                        <div className="col-span-2">
                                          <span className="text-gray-500">카테고리</span>
                                          <div className="font-medium text-gray-700">{post.category}</div>
                                        </div>
                                      )}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </main>

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

export default Cooking;
