import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { doc, getDoc, deleteDoc, updateDoc, increment } from 'firebase/firestore';
import { db } from '../util/firebase';
import { useAuth } from '../contexts/AuthContext';
import { FaArrowLeft, FaEdit, FaTrash, FaEye, FaHeart, FaFlag } from 'react-icons/fa';
import CommentSection from './CommentSection';
import UserProfileModal from './UserProfileModal';
import ReportModal from './ReportModal';
import { formatAdminName, isAdmin, getEnhancedAdminStyles } from '../util/adminUtils';

const CookingDetail = () => {
  const navigate = useNavigate();
  const { id } = useParams();
  const { user } = useAuth();
  const [post, setPost] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  // 프로필 모달 관련 상태
  const [showProfileModal, setShowProfileModal] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);

  // 신고 관련 상태
  const [showReportModal, setShowReportModal] = useState(false);
  
  // 좋아요 관련 상태
  const [liking, setLiking] = useState(false);

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

  // 좋아요 상태 확인 함수
  const isLikedByUser = () => {
    return user && post && post.likedBy && post.likedBy.includes(user.uid);
  };

  const handleLike = async () => {
    if (!user) {
      alert("좋아요를 누르려면 로그인이 필요합니다.");
      navigate('/login');
      return;
    }

    if (liking) return;

    setLiking(true);
    try {
      const docRef = doc(db, "cookingPosts", id);
      const isLiked = isLikedByUser();
      
      if (isLiked) {
        // 좋아요 취소
        const newLikedBy = post.likedBy.filter(uid => uid !== user.uid);
        await updateDoc(docRef, {
          likes: increment(-1),
          likedBy: newLikedBy
        });
        setPost(prev => ({
          ...prev,
          likes: (prev.likes || 0) - 1,
          likedBy: newLikedBy
        }));
        console.log("좋아요를 취소했습니다!");
      } else {
        // 좋아요 추가
        const newLikedBy = [...(post.likedBy || []), user.uid];
        await updateDoc(docRef, {
          likes: increment(1),
          likedBy: newLikedBy
        });
        setPost(prev => ({
          ...prev,
          likes: (prev.likes || 0) + 1,
          likedBy: newLikedBy
        }));
        console.log("좋아요를 눌렀습니다!");
      }
    } catch (error) {
      console.error("좋아요 업데이트 오류:", error);
      alert("좋아요 처리에 실패했습니다.");
    } finally {
      setLiking(false);
    }
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

  // 신고 관련 함수들
  const handleReport = () => {
    if (!user) {
      alert("신고하려면 로그인이 필요합니다.");
      navigate("/login");
      return;
    }
    setShowReportModal(true);
  };

  const handleReportSuccess = (reportId) => {
    alert("신고가 성공적으로 접수되었습니다.");
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
                 title="나만의요리로 돌아가기"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
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
          <div className={`rounded-2xl shadow-xl p-6 mb-6 ${
            isAdmin(post?.authorEmail) 
              ? 'bg-gradient-to-br from-purple-50 via-pink-50 to-purple-100 border-l-4 border-purple-500' 
              : 'bg-white'
          }`}>
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <button
                  onClick={() => navigate('/cooking')}
                  className="flex items-center justify-center w-12 h-12 bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white rounded-full shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-110"
                  title="나만의요리로 돌아가기"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M10.5 19.5L3 12m0 0l7.5-7.5M3 12h18" />
                  </svg>
                </button>
                <div>
                  <h1 className="text-2xl font-bold text-gray-800">나만의요리 👨‍🍳</h1>
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
          <div className={`rounded-2xl shadow-xl p-6 mb-6 ${
            isAdmin(post?.authorEmail) 
              ? getEnhancedAdminStyles().container
              : 'bg-white'
          }`}>
            {isAdmin(post?.authorEmail) && (
              <>
                <div className={getEnhancedAdminStyles().glowEffect}></div>
                <svg className={getEnhancedAdminStyles().adminIcon} fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M2.166 4.999A11.954 11.954 0 0010 1.944 11.954 11.954 0 0017.834 5c.11.65.166 1.32.166 2.001 0 5.225-3.34 9.67-8 11.317C5.34 16.67 2 12.225 2 7c0-.682.057-1.35.166-2.001zm11.541 3.708a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
              </>
            )}
            {/* Title and Category */}
            <div className="mb-6">
              <h1 className={`text-3xl font-bold mb-4 ${
                isAdmin(post?.authorEmail) 
                  ? 'text-purple-800 ' + getEnhancedAdminStyles().titleGlow
                  : 'text-gray-800'
              }`}>{post.title}</h1>
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
                <div 
                  className="cursor-pointer transition-colors"
                  onClick={() => handleShowProfile(post.authorId, post.author || "익명")}
                  title="프로필 보기"
                >
                  {(() => {
                    const adminInfo = formatAdminName(post.author || "익명", post.authorEmail);
                    if (adminInfo.isAdmin) {
                      return (
                        <span className="inline-flex items-center space-x-1">
                          <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-gradient-to-r from-purple-500 to-pink-500 text-white shadow-lg">
                            <svg className="w-3 h-3 mr-1" fill="currentColor" viewBox="0 0 20 20">
                              <path fillRule="evenodd" d="M2.166 4.999A11.954 11.954 0 0010 1.944 11.954 11.954 0 0017.834 5c.11.65.166 1.32.166 2.001 0 5.225-3.34 9.67-8 11.317C5.34 16.67 2 12.225 2 7c0-.682.057-1.35.166-2.001zm11.541 3.708a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                            </svg>
                            {adminInfo.badgeText}
                          </span>
                          <span className="font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
                            {adminInfo.name}
                          </span>
                        </span>
                      );
                    }
                    return adminInfo.name;
                  })()}
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

            {/* Images Gallery */}
            {post.images && post.images.length > 0 && (
              <div className="border-t border-gray-200 pt-6">
                <h3 className="text-lg font-semibold text-gray-800 mb-4">요리 사진</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {post.images.map((imageUrl, index) => (
                    <div key={index} className="relative group">
                      <img
                        src={imageUrl}
                        alt={`요리 사진 ${index + 1}`}
                        className="w-full h-48 object-cover rounded-lg shadow-md hover:shadow-lg transition-shadow cursor-pointer"
                        onClick={() => {
                          // 이미지 확대 보기 (간단한 모달)
                          const newWindow = window.open();
                          newWindow.document.write(`
                            <html>
                              <head><title>요리 사진</title></head>
                              <body style="margin:0; padding:20px; background:#000; display:flex; justify-content:center; align-items:center; min-height:100vh;">
                                <img src="${imageUrl}" style="max-width:100%; max-height:100%; object-fit:contain;" />
                              </body>
                            </html>
                          `);
                        }}
                      />
                      <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-20 transition-all duration-200 rounded-lg flex items-center justify-center">
                        <div className="opacity-0 group-hover:opacity-100 transition-opacity text-white text-sm font-medium">
                          클릭하여 확대보기
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

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
                          <div className="flex items-center space-x-4">
                            <button
                              onClick={handleLike}
                              disabled={liking}
                              className={`px-6 py-3 rounded-lg transition-colors flex items-center space-x-2 ${
                                isLikedByUser() 
                                  ? "bg-red-600 text-white hover:bg-red-700" 
                                  : "bg-red-500 text-white hover:bg-red-600"
                              } ${liking ? "opacity-50 cursor-not-allowed" : ""}`}
                            >
                              <FaHeart />
                              <span>
                                {liking ? "처리 중..." : isLikedByUser() ? "취소" : "좋아요"}
                              </span>
                            </button>
                            
                            {/* 신고 버튼 - 작성자가 아닌 경우에만 표시 */}
                            {user && user.uid !== post.authorId && (
                              <button
                                onClick={handleReport}
                                className="flex items-center space-x-2 px-4 py-3 rounded-lg transition-colors bg-purple-100 text-purple-700 hover:bg-purple-200 hover:text-purple-800"
                                title="게시글 신고"
                              >
                                <FaFlag className="w-4 h-4" />
                                <span>신고</span>
                              </button>
                            )}
                          </div>
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

                  {/* 사용자 프로필 모달 */}
                  <UserProfileModal
                    isOpen={showProfileModal}
                    onClose={handleCloseProfileModal}
                    userId={selectedUser?.id}
                    userName={selectedUser?.name}
                  />

                  {/* 신고 모달 */}
                  <ReportModal
                    isOpen={showReportModal}
                    onClose={() => setShowReportModal(false)}
                    targetData={post}
                    targetType="post"
                    onSuccess={handleReportSuccess}
                  />
                </div>
              );
            };

export default CookingDetail;
