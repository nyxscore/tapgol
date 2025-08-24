import React, { useState, useEffect } from "react";
import { auth } from "../util/firebase";
import { onAuthStateChanged } from "firebase/auth";
import { getUserProfile } from "../util/userService";
import { 
  getHealthComments, 
  createHealthComment, 
  updateHealthComment, 
  deleteHealthComment 
} from "../util/healthCommentService";

const HealthCommentSection = ({ postId }) => {
  const [comments, setComments] = useState([]);
  const [user, setUser] = useState(null);
  const [userData, setUserData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [newComment, setNewComment] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [editingComment, setEditingComment] = useState(null);
  const [editText, setEditText] = useState("");

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      setUser(currentUser);
      
      if (currentUser) {
        try {
          const profile = await getUserProfile(currentUser.uid);
          setUserData(profile);
        } catch (error) {
          console.error("사용자 정보 로드 오류:", error);
        }
      }
    });

    loadComments();
    return () => unsubscribe();
  }, [postId]);

  const loadComments = async () => {
    try {
      const commentsData = await getHealthComments(postId);
      setComments(commentsData);
    } catch (error) {
      console.error("댓글 로드 오류:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmitComment = async (e) => {
    e.preventDefault();
    
    if (!newComment.trim()) {
      alert("댓글 내용을 입력해주세요.");
      return;
    }

    if (!user) {
      alert("댓글을 작성하려면 로그인이 필요합니다.");
      return;
    }

    setSubmitting(true);
    
    try {
      const commentData = {
        content: newComment.trim(),
        author: userData?.nickname || userData?.name || user.displayName || "익명",
        authorId: user.uid,
        authorEmail: user.email
      };

      await createHealthComment(postId, commentData);
      setNewComment("");
      await loadComments(); // 댓글 목록 새로고침
    } catch (error) {
      console.error("댓글 작성 오류:", error);
      alert("댓글 작성에 실패했습니다.");
    } finally {
      setSubmitting(false);
    }
  };

  const handleEditComment = async (commentId) => {
    if (!editText.trim()) {
      alert("댓글 내용을 입력해주세요.");
      return;
    }

    try {
      await updateHealthComment(commentId, { content: editText.trim() });
      setEditingComment(null);
      setEditText("");
      await loadComments(); // 댓글 목록 새로고침
    } catch (error) {
      console.error("댓글 수정 오류:", error);
      alert("댓글 수정에 실패했습니다.");
    }
  };

  const handleDeleteComment = async (commentId) => {
    if (!window.confirm("정말로 이 댓글을 삭제하시겠습니까?")) {
      return;
    }

    try {
      await deleteHealthComment(commentId);
      await loadComments(); // 댓글 목록 새로고침
    } catch (error) {
      console.error("댓글 삭제 오류:", error);
      alert("댓글 삭제에 실패했습니다.");
    }
  };

  const startEdit = (comment) => {
    setEditingComment(comment.id);
    setEditText(comment.content);
  };

  const cancelEdit = () => {
    setEditingComment(null);
    setEditText("");
  };

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

  const isCommentAuthor = (comment) => {
    return user && user.uid === comment.authorId;
  };

  if (loading) {
    return (
      <div className="text-center py-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-amber-700 mx-auto mb-4"></div>
        <p className="text-amber-700">댓글을 불러오는 중...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* 댓글 작성 폼 */}
      {user ? (
        <div className="bg-gray-50 rounded-lg p-4">
          <h4 className="text-sm font-medium text-gray-700 mb-3">
            댓글 작성
          </h4>
          <form onSubmit={handleSubmitComment} className="space-y-3">
            <textarea
              value={newComment}
              onChange={(e) => setNewComment(e.target.value)}
              placeholder="댓글을 입력해주세요..."
              rows="3"
              maxLength="500"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent resize-none"
              required
            />
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-500">
                {newComment.length}/500
              </span>
              <button
                type="submit"
                disabled={submitting}
                className={`px-4 py-2 rounded-lg transition-colors ${
                  submitting
                    ? "bg-gray-400 text-white cursor-not-allowed"
                    : "bg-amber-600 text-white hover:bg-amber-700"
                }`}
              >
                {submitting ? "작성 중..." : "댓글 작성"}
              </button>
            </div>
          </form>
        </div>
      ) : (
        <div className="bg-gray-50 rounded-lg p-4 text-center">
          <p className="text-gray-600 mb-2">댓글을 작성하려면 로그인이 필요합니다.</p>
          <button
            onClick={() => window.location.href = "/login"}
            className="text-amber-600 hover:text-amber-700 underline"
          >
            로그인하기
          </button>
        </div>
      )}

      {/* 댓글 목록 */}
      <div className="space-y-4">
        <h4 className="text-lg font-semibold text-gray-800">
          댓글 ({comments.length})
        </h4>
        
        {comments.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            <p>아직 댓글이 없습니다.</p>
            <p className="text-sm">첫 번째 댓글을 작성해보세요!</p>
          </div>
        ) : (
          comments.map((comment) => (
            <div key={comment.id} className="border border-gray-200 rounded-lg p-4">
              {editingComment === comment.id ? (
                // 수정 모드
                <div className="space-y-3">
                  <textarea
                    value={editText}
                    onChange={(e) => setEditText(e.target.value)}
                    rows="3"
                    maxLength="500"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent resize-none"
                  />
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-500">
                      {editText.length}/500
                    </span>
                    <div className="flex space-x-2">
                      <button
                        onClick={() => handleEditComment(comment.id)}
                        className="px-3 py-1 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors text-sm"
                      >
                        수정 완료
                      </button>
                      <button
                        onClick={cancelEdit}
                        className="px-3 py-1 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors text-sm"
                      >
                        취소
                      </button>
                    </div>
                  </div>
                </div>
              ) : (
                // 보기 모드
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center space-x-2">
                      <span className="font-semibold text-gray-800">
                        {comment.author}
                      </span>
                      <span className="text-sm text-gray-500">
                        {formatDate(comment.createdAt)}
                      </span>
                      {comment.updatedAt && comment.updatedAt !== comment.createdAt && (
                        <span className="text-xs text-gray-400">
                          (수정됨)
                        </span>
                      )}
                    </div>
                    {isCommentAuthor(comment) && (
                      <div className="flex space-x-2">
                        <button
                          onClick={() => startEdit(comment)}
                          className="text-blue-600 hover:text-blue-700 text-sm"
                        >
                          수정
                        </button>
                        <button
                          onClick={() => handleDeleteComment(comment.id)}
                          className="text-red-600 hover:text-red-700 text-sm"
                        >
                          삭제
                        </button>
                      </div>
                    )}
                  </div>
                  <div className="text-gray-700 whitespace-pre-wrap">
                    {comment.content}
                  </div>
                </div>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default HealthCommentSection;
