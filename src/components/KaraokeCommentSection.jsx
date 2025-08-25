import React, { useState, useEffect } from "react";
import { auth } from "../util/firebase";
import { onAuthStateChanged } from "firebase/auth";
import { getUserProfile } from "../util/userService";
import { 
  getKaraokeComments, 
  createKaraokeComment, 
  updateKaraokeComment, 
  deleteKaraokeComment 
} from "../util/karaokeCommentService";
import { formatTextWithLinks } from "../util/textUtils.jsx";

const KaraokeCommentSection = ({ postId }) => {
  const [comments, setComments] = useState([]);
  const [user, setUser] = useState(null);
  const [userData, setUserData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [newComment, setNewComment] = useState("");
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
      loadComments();
    });

    return () => unsubscribe();
  }, [postId]);

  const loadComments = async () => {
    try {
      setLoading(true);
      const commentsData = await getKaraokeComments(postId);
      setComments(commentsData);
    } catch (error) {
      console.error("댓글 로드 오류:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmitComment = async (e) => {
    e.preventDefault();
    
    if (!user) {
      alert("댓글을 작성하려면 로그인이 필요합니다.");
      return;
    }

    if (!newComment.trim()) {
      alert("댓글 내용을 입력해주세요.");
      return;
    }

    try {
      const commentData = {
        content: newComment.trim(),
        author: userData?.nickname || userData?.name || user.displayName || "익명",
        authorId: user.uid,
        authorEmail: user.email
      };

      await createKaraokeComment(postId, commentData);
      setNewComment("");
      await loadComments();
    } catch (error) {
      console.error("댓글 작성 오류:", error);
      alert("댓글 작성에 실패했습니다.");
    }
  };

  const handleEditComment = async (commentId) => {
    if (!editText.trim()) {
      alert("댓글 내용을 입력해주세요.");
      return;
    }

    try {
      await updateKaraokeComment(commentId, { content: editText.trim() });
      setEditingComment(null);
      setEditText("");
      await loadComments();
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
      await deleteKaraokeComment(commentId);
      await loadComments();
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
    const now = new Date();
    const diffInMinutes = Math.floor((now - date) / (1000 * 60));
    
    if (diffInMinutes < 1) return "방금 전";
    if (diffInMinutes < 60) return `${diffInMinutes}분 전`;
    if (diffInMinutes < 1440) return `${Math.floor(diffInMinutes / 60)}시간 전`;
    if (diffInMinutes < 43200) return `${Math.floor(diffInMinutes / 1440)}일 전`;
    
    return date.toLocaleDateString('ko-KR', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit'
    });
  };

  const isCommentAuthor = (comment) => {
    return user && comment.authorId === user.uid;
  };

  return (
    <div className="bg-white rounded-2xl shadow-xl p-6">
      <h3 className="text-lg font-semibold text-gray-800 mb-4">댓글 ({comments.length})</h3>
      
      {/* Comment Form */}
      {user && (
        <form onSubmit={handleSubmitComment} className="mb-6">
          <div className="flex space-x-3">
            <div className="w-8 h-8 bg-amber-600 rounded-full flex items-center justify-center text-white text-sm font-medium">
              {userData?.nickname?.[0] || userData?.name?.[0] || user.displayName?.[0] || "익"}
            </div>
            <div className="flex-1">
              <textarea
                value={newComment}
                onChange={(e) => setNewComment(e.target.value)}
                placeholder="댓글을 입력하세요..."
                rows="3"
                maxLength="500"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent resize-none"
              />
              <div className="flex justify-between items-center mt-2">
                <span className="text-xs text-gray-500">{newComment.length}/500</span>
                <button
                  type="submit"
                  disabled={!newComment.trim()}
                  className="px-4 py-2 bg-amber-600 text-white rounded-lg hover:bg-amber-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  댓글 작성
                </button>
              </div>
            </div>
          </div>
        </form>
      )}

      {/* Comments List */}
      {loading ? (
        <div className="text-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-amber-600 mx-auto mb-2"></div>
          <p className="text-gray-500">댓글을 불러오는 중...</p>
        </div>
      ) : comments.length === 0 ? (
        <div className="text-center py-8">
          <p className="text-gray-500">아직 댓글이 없습니다.</p>
          {!user && (
            <p className="text-sm text-gray-400 mt-1">댓글을 작성하려면 로그인해주세요.</p>
          )}
        </div>
      ) : (
        <div className="space-y-4">
          {comments.map((comment) => (
            <div key={comment.id} className="border-b border-gray-100 pb-4 last:border-b-0">
              {editingComment === comment.id ? (
                // Edit Mode
                <div className="flex space-x-3">
                  <div className="w-8 h-8 bg-amber-600 rounded-full flex items-center justify-center text-white text-sm font-medium">
                    {comment.author?.[0] || "익"}
                  </div>
                  <div className="flex-1">
                    <textarea
                      value={editText}
                      onChange={(e) => setEditText(e.target.value)}
                      rows="3"
                      maxLength="500"
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent resize-none"
                    />
                    <div className="flex justify-between items-center mt-2">
                      <span className="text-xs text-gray-500">{editText.length}/500</span>
                      <div className="flex space-x-2">
                        <button
                          onClick={cancelEdit}
                          className="px-3 py-1 text-gray-600 hover:text-gray-800 transition-colors"
                        >
                          취소
                        </button>
                        <button
                          onClick={() => handleEditComment(comment.id)}
                          disabled={!editText.trim()}
                          className="px-3 py-1 bg-amber-600 text-white rounded hover:bg-amber-700 transition-colors disabled:opacity-50"
                        >
                          저장
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              ) : (
                // View Mode
                <div className="flex space-x-3">
                  <div className="w-8 h-8 bg-amber-600 rounded-full flex items-center justify-center text-white text-sm font-medium">
                    {comment.author?.[0] || "익"}
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center justify-between mb-1">
                      <div className="flex items-center space-x-2">
                        <span className="font-medium text-gray-800">{comment.author}</span>
                        <span className="text-xs text-gray-500">{formatDate(comment.createdAt)}</span>
                      </div>
                      {isCommentAuthor(comment) && (
                        <div className="flex space-x-1">
                          <button
                            onClick={() => startEdit(comment)}
                            className="text-xs text-blue-600 hover:text-blue-800 transition-colors"
                          >
                            수정
                          </button>
                          <button
                            onClick={() => handleDeleteComment(comment.id)}
                            className="text-xs text-red-600 hover:text-red-800 transition-colors"
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
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default KaraokeCommentSection;
