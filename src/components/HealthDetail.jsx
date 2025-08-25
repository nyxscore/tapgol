import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { auth } from "../util/firebase";
import { onAuthStateChanged } from "firebase/auth";
import { getHealthPost, incrementViews, deleteHealthPost, toggleLike } from "../util/healthService";
import CommentSection from "./CommentSection";

const HealthDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [post, setPost] = useState(null);
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [deleting, setDeleting] = useState(false);
  const [liking, setLiking] = useState(false);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
    });

    const loadPost = async () => {
      try {
        const postData = await getHealthPost(id);
        setPost(postData);
        
        // 조회수 증가 (로그인한 사용자만)
        if (user) {
          await incrementViews(id);
        }
      } catch (error) {
        console.error("건강정보 게시글 로드 오류:", error);
        alert("게시글을 불러오는데 실패했습니다.");
        navigate("/health");
      } finally {
        setLoading(false);
      }
    };

    if (id) {
      loadPost();
    }

    return () => unsubscribe();
  }, [id, user, navigate]);

  const formatDate = (timestamp) => {
    if (!timestamp) return "";
    
    const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
    return date.toLocaleDateString('ko-KR', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const handleDelete = async () => {
    if (!user || user.uid !== post.authorId) {
      alert("삭제 권한이 없습니다.");
      return;
    }

    if (!window.confirm("정말로 이 게시글을 삭제하시겠습니까?")) {
      return;
    }

    setDeleting(true);
    try {
      await deleteHealthPost(id);
      alert("게시글이 삭제되었습니다.");
      navigate("/health");
    } catch (error) {
      console.error("게시글 삭제 오류:", error);
      alert("게시글 삭제에 실패했습니다.");
    } finally {
      setDeleting(false);
    }
  };

  const handleEdit = () => {
    navigate(`/health/edit/${id}`);
  };

  const handleLike = async () => {
    if (!user) {
      alert("좋아요를 누르려면 로그인이 필요합니다.");
      navigate("/login");
      return;
    }

    if (liking) return; // 중복 클릭 방지

    setLiking(true);
    try {
      const isLiked = await toggleLike(id, user.uid);
      
      // 로컬 상태 업데이트
      setPost(prev => ({
        ...prev,
        likes: isLiked ? (prev.likes || 0) + 1 : (prev.likes || 0) - 1,
        likedBy: isLiked 
          ? [...(prev.likedBy || []), user.uid]
          : (prev.likedBy || []).filter(uid => uid !== user.uid)
      }));
    } catch (error) {
      console.error("좋아요 처리 오류:", error);
      alert("좋아요 처리에 실패했습니다.");
    } finally {
      setLiking(false);
    }
  };

  const isLiked = user && post?.likedBy?.includes(user.uid);
  const isAuthor = user && user.uid === post?.authorId;

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-amber-50 via-orange-50 to-amber-100 pb-20">
        <div className="max-w-4xl mx-auto p-6">
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-amber-700 mx-auto mb-4"></div>
            <p className="text-amber-700">게시글을 불러오는 중...</p>
          </div>
        </div>
      </div>
    );
  }

  if (!post) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-amber-50 via-orange-50 to-amber-100 pb-20">
        <div className="max-w-4xl mx-auto p-6">
          <div className="text-center py-12">
            <p className="text-gray-600 text-lg">게시글을 찾을 수 없습니다.</p>
            <button
              onClick={() => navigate("/health")}
              className="mt-4 px-4 py-2 bg-amber-600 text-white rounded-lg hover:bg-amber-700 transition-colors"
            >
              목록으로 돌아가기
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-amber-50 via-orange-50 to-amber-100 pb-20">
      <div className="max-w-4xl mx-auto p-6">
        {/* Header */}
        <div className="bg-white rounded-2xl shadow-xl p-6 mb-6">
          <div className="flex items-center justify-between">
            <button
              onClick={() => navigate("/health")}
              className="flex items-center text-amber-600 hover:text-amber-700 transition-colors"
            >
              <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
              목록으로 돌아가기
            </button>
            <div className="flex items-center space-x-2">
              {isAuthor && (
                <>
                  <button
                    onClick={handleEdit}
                    className="px-3 py-1 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors text-sm"
                  >
                    수정
                  </button>
                  <button
                    onClick={handleDelete}
                    disabled={deleting}
                    className={`px-3 py-1 rounded-lg transition-colors text-sm ${
                      deleting
                        ? "bg-gray-400 text-white cursor-not-allowed"
                        : "bg-red-500 text-white hover:bg-red-600"
                    }`}
                  >
                    {deleting ? "삭제 중..." : "삭제"}
                  </button>
                </>
              )}
            </div>
          </div>
        </div>

        {/* Post Content */}
        <div className="bg-white rounded-2xl shadow-xl p-6 mb-6">
          {/* Post Header */}
          <div className="border-b border-gray-200 pb-4 mb-6">
            <div className="flex items-center justify-between mb-2">
              <span className="inline-block bg-amber-100 text-amber-800 text-sm px-3 py-1 rounded-full">
                {post.category}
              </span>
              <span className="text-sm text-gray-500">
                {formatDate(post.createdAt)}
              </span>
            </div>
            <h1 className="text-2xl font-bold text-gray-800 mb-3">
              {post.title}
            </h1>
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4 text-sm text-gray-600">
                <span className="font-medium">{post.author}</span>
                <div className="flex items-center space-x-1">
                  <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                    <path d="M10 12a2 2 0 100-4 2 2 0 000 4z" />
                    <path fillRule="evenodd" d="M.458 10C1.732 5.943 5.522 3 10 3s8.268 2.943 9.542 7c-1.274 4.057-5.064 7-9.542 7S1.732 14.057.458 10zM14 10a4 4 0 11-8 0 4 4 0 018 0z" clipRule="evenodd" />
                  </svg>
                  <span>{post.views || 0}</span>
                </div>
              </div>
              <button
                onClick={handleLike}
                disabled={liking}
                className={`flex items-center space-x-1 transition-colors ${
                  isLiked ? 'text-red-500' : 'text-gray-500 hover:text-red-500'
                }`}
              >
                <svg className="w-5 h-5" fill={isLiked ? "currentColor" : "none"} stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                </svg>
                <span>{post.likes || 0}</span>
              </button>
            </div>
          </div>

          {/* Post Content */}
          <div className="prose max-w-none">
            <div className="text-gray-700 leading-relaxed whitespace-pre-wrap">
              {post.content}
            </div>
          </div>

          {/* Updated Info */}
          {post.updatedAt && post.updatedAt !== post.createdAt && (
            <div className="mt-6 pt-4 border-t border-gray-200">
              <p className="text-sm text-gray-500">
                마지막 수정: {formatDate(post.updatedAt)}
              </p>
            </div>
          )}
        </div>

        {/* Comment Section */}
        <div className="bg-white rounded-2xl shadow-xl p-6">
          <CommentSection postId={id} boardType="health" />
        </div>
      </div>
    </div>
  );
};

export default HealthDetail;
