import React, { useState, useEffect } from "react";
import { auth } from "../util/firebase";
import { onAuthStateChanged } from "firebase/auth";
import { getUserProfile } from "../util/userService";
import { 
  getComments, 
  createComment, 
  updateComment, 
  deleteComment 
} from "../util/commentService";
import { formatTextWithLinks } from "../util/textUtils.jsx";

const CommentSection = ({ postId, boardType = "board" }) => {
  const [comments, setComments] = useState([]);
  const [user, setUser] = useState(null);
  const [userData, setUserData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [newComment, setNewComment] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [editingComment, setEditingComment] = useState(null);
  const [editText, setEditText] = useState("");
  const [error, setError] = useState("");

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
  }, [postId, boardType]);

  const loadComments = async () => {
    try {
      setLoading(true);
      const commentsData = await getComments(postId, boardType);
      setComments(commentsData);
      setError("");
    } catch (error) {
      console.error("댓글 로드 오류:", error);
      // 오류가 발생해도 빈 배열로 설정하여 UI가 깨지지 않도록 함
      setComments([]);
      setError("댓글을 불러오는데 실패했습니다. 새로고침 후 다시 시도해주세요.");
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
    setError("");
    
    try {
      const commentData = {
        content: newComment.trim(),
        author: userData?.nickname || userData?.name || user.displayName || "익명",
        authorId: user.uid,
        authorEmail: user.email
      };

      // 댓글 작성
      const newCommentDoc = await createComment(postId, commentData, boardType);
      
      // 즉시 로컬 상태에 추가 (UI 즉시 업데이트)
      setComments(prevComments => [...prevComments, newCommentDoc]);
      
      // 입력 필드 초기화
      setNewComment("");
      
      // 성공 메시지 (선택사항)
      console.log("댓글이 성공적으로 작성되었습니다.");
      
    } catch (error) {
      console.error("댓글 작성 오류:", error);
      setError("댓글 작성에 실패했습니다. 다시 시도해주세요.");
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
      await updateComment(commentId, { content: editText.trim() });
      
      // 즉시 로컬 상태 업데이트
      setComments(prevComments => 
        prevComments.map(comment => 
          comment.id === commentId 
            ? { ...comment, content: editText.trim(), updatedAt: new Date() }
            : comment
        )
      );
      
      setEditingComment(null);
      setEditText("");
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
      await deleteComment(commentId);
      
      // 즉시 로컬 상태에서 제거
      setComments(prevComments => 
        prevComments.filter(comment => comment.id !== commentId)
      );
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
      {/* 오류 메시지 */}
      {error && (
        <div className="bg-yellow-100 border border-yellow-400 text-yellow-700 px-4 py-3 rounded">
          <div className="flex items-start">
            <div className="flex-shrink-0">
              <svg className="h-5 w-5 text-yellow-400" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="ml-3">
              <p className="text-sm">{error}</p>
              <button
                onClick={loadComments}
                className="mt-2 text-yellow-800 underline hover:text-yellow-900"
              >
                다시 시도
              </button>
            </div>
          </div>
        </div>
      )}

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
                {submitting ? (
                  <div className="flex items-center">
                    <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    작성 중...
                  </div>
                ) : (
                  "댓글 작성"
                )}
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
                    {formatTextWithLinks(comment.content)}
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

export default CommentSection;
