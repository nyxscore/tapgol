import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { doc, getDoc, deleteDoc, updateDoc, increment } from 'firebase/firestore';
import { db } from '../util/firebase';
import { useAuth } from '../contexts/AuthContext';
import { FaArrowLeft, FaEdit, FaTrash, FaEye, FaHeart } from 'react-icons/fa';
import CommentSection from './CommentSection';

const CookingDetail = () => {
  const navigate = useNavigate();
  const { id } = useParams();
  const { user } = useAuth();
  const [post, setPost] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    loadPost();
  }, [id]);

  const loadPost = async () => {
    try {
      const docRef = doc(db, "cookingPosts", id);
      const docSnap = await getDoc(docRef);
      
      if (docSnap.exists()) {
        setPost({ id: docSnap.id, ...docSnap.data() });
        // 조회수 증가
        await updateDoc(docRef, {
          views: increment(1)
        });
      } else {
        setError("요리 게시글을 찾을 수 없습니다.");
      }
    } catch (error) {
      console.error("요리 게시글 로드 오류:", error);
      setError("게시글을 불러오는데 실패했습니다.");
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!window.confirm("정말로 이 요리 게시글을 삭제하시겠습니까?")) {
      return;
    }

    try {
      await deleteDoc(doc(db, "cookingPosts", id));
      alert("요리 게시글이 삭제되었습니다.");
      navigate('/cooking');
    } catch (error) {
      console.error("요리 게시글 삭제 오류:", error);
      alert("게시글 삭제에 실패했습니다.");
    }
  };

  const handleLike = async () => {
    if (!user) {
      alert("좋아요를 누르려면 로그인이 필요합니다.");
      navigate('/login');
      return;
    }

    try {
      const docRef = doc(db, "cookingPosts", id);
      await updateDoc(docRef, {
        likes: increment(1)
      });
      // 로컬 상태 업데이트
      setPost(prev => ({
        ...prev,
        likes: (prev.likes || 0) + 1
      }));
    } catch (error) {
      console.error("좋아요 업데이트 오류:", error);
    }
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

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-amber-50 via-orange-50 to-amber-100">
        <main className="pb-20 pt-16">
          <div className="max-w-4xl mx-auto px-4">
            <div className="bg-white rounded-2xl shadow-xl p-6 text-center">
              <div className="text-gray-400 text-6xl mb-4">👨‍🍳</div>
              <p className="text-gray-600 text-lg mb-2">{error}</p>
              <button
                onClick={() => navigate('/cooking')}
                className="px-6 py-2 bg-amber-600 text-white rounded-lg hover:bg-amber-700 transition-colors"
              >
                요리노하우로 돌아가기
              </button>
            </div>
          </div>
        </main>
      </div>
    );
  }

  if (!post) return null;

  const isAuthor = user && post.authorId === user.uid;

  return (
    <div className="min-h-screen bg-gradient-to-br from-amber-50 via-orange-50 to-amber-100">
      <main className="pb-20 pt-16">
        <div className="max-w-4xl mx-auto px-4">
          {/* Header */}
          <div className="bg-white rounded-2xl shadow-xl p-6 mb-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <button
                  onClick={() => navigate('/cooking')}
                  className="text-gray-600 hover:text-gray-800 transition-colors"
                  title="요리노하우로 돌아가기"
                >
                  <FaArrowLeft className="w-6 h-6" />
                </button>
                <div>
                  <h1 className="text-2xl font-bold text-gray-800">요리노하우 👨‍🍳</h1>
                  <p className="text-gray-600 mt-1">맛있는 요리 레시피와 요리 팁</p>
                </div>
              </div>
              {isAuthor && (
                <div className="flex space-x-2">
                  <button
                    onClick={() => navigate(`/cooking/edit/${id}`)}
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center space-x-2"
                  >
                    <FaEdit className="text-sm" />
                    <span>수정</span>
                  </button>
                  <button
                    onClick={handleDelete}
                    className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors flex items-center space-x-2"
                  >
                    <FaTrash className="text-sm" />
                    <span>삭제</span>
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* Post Content */}
          <div className="bg-white rounded-2xl shadow-xl p-6 mb-6">
            {/* Title and Category */}
            <div className="mb-6">
              <h1 className="text-3xl font-bold text-gray-800 mb-4">{post.title}</h1>
              {post.category && (
                <div className="inline-block px-3 py-1 bg-amber-100 text-amber-800 rounded-full text-sm font-medium">
                  {post.category}
                </div>
              )}
            </div>

            {/* Post Details Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 text-sm mb-6">
              <div>
                <span className="text-gray-500">작성자</span>
                <div className="font-medium text-gray-700">{post.author || "익명"}</div>
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
                <div className="font-medium text-gray-700 flex items-center space-x-1">
                  <FaEye className="text-gray-400" />
                  <span>{post.views || 0}</span>
                </div>
              </div>
                                        <div>
                            <span className="text-gray-500">좋아요</span>
                            <div className="font-medium text-gray-700 flex items-center space-x-1">
                              <FaHeart className="text-red-400" />
                              <span>{post.likes || 0}</span>
                            </div>
                          </div>
                          <div>
                            <span className="text-gray-500">댓글</span>
                            <div className="font-medium text-gray-700 flex items-center space-x-1">
                              <span>💬</span>
                              <span>{post.commentCount || 0}</span>
                            </div>
                          </div>
            </div>

            {/* Content */}
            <div className="border-t border-gray-200 pt-6">
              <div className="prose max-w-none">
                <div className="whitespace-pre-wrap text-gray-700 leading-relaxed">
                  {post.content}
                </div>
              </div>
            </div>

                                    {/* Like Button */}
                        <div className="border-t border-gray-200 pt-6 mt-6">
                          <button
                            onClick={handleLike}
                            className="px-6 py-3 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors flex items-center space-x-2"
                          >
                            <FaHeart />
                            <span>좋아요 {post.likes || 0}</span>
                          </button>
                        </div>
                      </div>

                      {/* Comments Section */}
                      <div className="bg-white rounded-2xl shadow-xl p-6">
                        <CommentSection 
                          postId={id} 
                          postType="cooking"
                        />
                      </div>
                    </div>
                  </main>
                </div>
              );
            };

export default CookingDetail;
