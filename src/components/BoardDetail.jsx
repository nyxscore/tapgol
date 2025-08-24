import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { auth } from "../util/firebase";
import { onAuthStateChanged } from "firebase/auth";
import { getPost, incrementViews, deletePost, toggleLike } from "../util/postService";
import CommentSection from "./CommentSection";

const BoardDetail = () => {
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
        const postData = await getPost(id);
        setPost(postData);
        
        // 조회수 증가 (로그인한 사용자만)
        if (user) {
          await incrementViews(id);
        }
      } catch (error) {
        console.error("게시글 로드 오류:", error);
        alert("게시글을 불러오는데 실패했습니다.");
        navigate("/board");
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
      await deletePost(id);
      alert("게시글이 삭제되었습니다.");
      navigate("/board");
    } catch (error) {
      console.error("게시글 삭제 오류:", error);
      alert("게시글 삭제에 실패했습니다.");
    } finally {
      setDeleting(false);
    }
  };

  const handleEdit = () => {
    if (!user || user.uid !== post.authorId) {
      alert("수정 권한이 없습니다.");
      return;
    }
    navigate(`/board/edit/${id}`);
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

      // 성공 메시지
      if (isLiked) {
        console.log("좋아요를 눌렀습니다!");
      } else {
        console.log("좋아요를 취소했습니다!");
      }
    } catch (error) {
      console.error("좋아요 처리 오류:", error);
      alert("좋아요 처리에 실패했습니다.");
    } finally {
      setLiking(false);
    }
  };

  const isLiked = user && post?.likedBy?.includes(user.uid);

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

  if (!post) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-amber-50 via-orange-50 to-amber-100 flex items-center justify-center">
        <div className="text-center">
          <div className="text-gray-400 text-6xl mb-4">📄</div>
          <p className="text-gray-600 text-lg mb-2">게시글을 찾을 수 없습니다</p>
          <button
            onClick={() => navigate("/board")}
            className="bg-amber-600 text-white px-4 py-2 rounded-lg hover:bg-amber-700 transition-colors"
          >
            게시판으로 돌아가기
          </button>
        </div>
      </div>
    );
  }

  const isAuthor = user && user.uid === post.authorId;

  return (
    <div className="min-h-screen bg-gradient-to-br from-amber-50 via-orange-50 to-amber-100 pb-20">
      <div className="max-w-4xl mx-auto p-6">
        {/* 헤더 */}
        <div className="bg-white rounded-2xl shadow-xl p-6 mb-6">
          <div className="flex items-center justify-between">
            <button
              onClick={() => navigate("/board")}
              className="flex items-center text-amber-700 hover:text-amber-800 font-medium"
            >
              <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
              목록으로 돌아가기
            </button>
            <h1 className="text-2xl font-bold text-gray-800">게시글</h1>
            <div className="w-24"></div>
          </div>
        </div>

        {/* 게시글 내용 */}
        <div className="bg-white rounded-2xl shadow-xl p-6">
          {/* 게시글 헤더 */}
          <div className="border-b border-gray-200 pb-6 mb-6">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center space-x-2">
                <h2 className="text-2xl font-bold text-gray-800">{post.title}</h2>
                <span className="bg-amber-100 text-amber-800 px-3 py-1 rounded-full text-sm font-semibold">
                  {post.category || "일반"}
                </span>
              </div>
              {isAuthor && (
                <div className="flex space-x-2">
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
                </div>
              )}
            </div>
            
            <div className="flex items-center justify-between text-sm text-gray-600">
              <div className="flex items-center space-x-4">
                <span>작성자: <span className="font-semibold">{post.author}</span></span>
                <span>작성일: {formatDate(post.createdAt)}</span>
                {post.updatedAt && post.updatedAt !== post.createdAt && (
                  <span>수정일: {formatDate(post.updatedAt)}</span>
                )}
              </div>
              <div className="flex items-center space-x-4">
                <span>조회수: {post.views || 0}</span>
                <span>좋아요: {post.likes || 0}</span>
              </div>
            </div>
          </div>

          {/* 게시글 본문 */}
          <div className="mb-8">
            <div className="prose max-w-none">
              <div className="whitespace-pre-wrap text-gray-700 leading-relaxed">
                {post.content}
              </div>
            </div>
          </div>

          {/* 좋아요 버튼 */}
          <div className="border-t border-gray-200 pt-6">
            <div className="flex items-center justify-center">
              <button
                onClick={handleLike}
                disabled={liking}
                className={`flex items-center space-x-2 px-6 py-3 rounded-lg transition-all ${
                  isLiked
                    ? "bg-red-500 text-white hover:bg-red-600"
                    : "bg-amber-100 text-amber-800 hover:bg-amber-200"
                } ${liking ? "opacity-50 cursor-not-allowed" : ""}`}
              >
                <svg 
                  className={`w-5 h-5 ${isLiked ? "fill-current" : "fill-none"}`} 
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
                <span>
                  {liking ? "처리 중..." : isLiked ? "좋아요 취소" : "좋아요"} {post.likes || 0}
                </span>
              </button>
            </div>
            {!user && (
              <div className="text-center mt-2">
                <p className="text-sm text-gray-500">
                  좋아요를 누르려면 <button 
                    onClick={() => navigate("/login")}
                    className="text-amber-600 hover:text-amber-700 underline"
                  >
                    로그인
                  </button>이 필요합니다.
                </p>
              </div>
            )}
          </div>
        </div>

        {/* 댓글 섹션 */}
        <div className="bg-white rounded-2xl shadow-xl p-6 mt-6">
          <CommentSection postId={id} />
        </div>
      </div>
    </div>
  );
};

export default BoardDetail;
