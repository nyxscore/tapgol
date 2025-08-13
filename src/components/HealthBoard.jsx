// src/components/HealthBoard.jsx
import React, { useState } from "react";
import Header from "./Header";
import BottomNavigation from "./BottomNavigation";

const HealthBoard = () => {
  const [posts, setPosts] = useState([
    {
      id: 1,
      title: "매일 30분 걷기의 건강 효과",
      author: "건강관리자",
      date: "2024-01-15",
      content:
        "매일 30분 걷기는 심혈관 질환 예방, 체중 관리, 스트레스 해소에 매우 효과적입니다. 특히 아침에 걷는 것이 가장 좋습니다.",
      comments: [
        {
          id: 1,
          author: "김철수",
          content: "정말 도움이 되는 정보네요!",
          date: "2024-01-15",
        },
        {
          id: 2,
          author: "이영희",
          content: "저도 매일 걷고 있는데 확실히 건강이 좋아졌어요.",
          date: "2024-01-16",
        },
      ],
    },
    {
      id: 2,
      title: "계절별 건강 관리 팁",
      author: "의료진",
      date: "2024-01-14",
      content:
        "봄철에는 알레르기 관리, 여름철에는 수분 섭취, 가을철에는 면역력 강화, 겨울철에는 감기 예방에 집중해야 합니다.",
      comments: [
        {
          id: 3,
          author: "박민수",
          content: "계절별 관리법이 정말 중요하네요!",
          date: "2024-01-14",
        },
      ],
    },
  ]);

  const [showWriteForm, setShowWriteForm] = useState(false);
  const [selectedPost, setSelectedPost] = useState(null);
  const [newPost, setNewPost] = useState({ title: "", content: "" });
  const [newComment, setNewComment] = useState("");

  const handleWritePost = () => {
    if (newPost.title && newPost.content) {
      const post = {
        id: posts.length + 1,
        title: newPost.title,
        author: "사용자",
        date: new Date().toISOString().split("T")[0],
        content: newPost.content,
        comments: [],
      };
      setPosts([post, ...posts]);
      setNewPost({ title: "", content: "" });
      setShowWriteForm(false);
    }
  };

  const handleAddComment = (postId) => {
    if (newComment.trim()) {
      const comment = {
        id: Date.now(),
        author: "사용자",
        content: newComment,
        date: new Date().toISOString().split("T")[0],
      };

      setPosts(
        posts.map((post) =>
          post.id === postId
            ? { ...post, comments: [...post.comments, comment] }
            : post
        )
      );
      setNewComment("");
    }
  };

  const handlePostClick = (post) => {
    setSelectedPost(post);
  };

  const handleBackToList = () => {
    setSelectedPost(null);
  };

  return (
    <div className="min-h-screen bg-gray-100">
      <Header />
      {/* 상세 보기 */}
      {selectedPost ? (
        <main className="pt-16 pb-20">
          <div className="max-w-4xl mx-auto px-4 py-8">
            <div className="bg-white rounded-lg shadow-md p-6">
              <div className="flex items-center justify-between mb-6">
                <button
                  onClick={handleBackToList}
                  className="flex items-center text-blue-600 hover:text-blue-800"
                >
                  <svg
                    className="w-5 h-5 mr-2"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M15 19l-7-7 7-7"
                    />
                  </svg>
                  목록으로 돌아가기
                </button>
              </div>

              <div className="border-b pb-4 mb-6">
                <h1 className="text-2xl font-bold text-gray-900 mb-2">
                  {selectedPost.title}
                </h1>
                <div className="flex items-center text-sm text-gray-600">
                  <span>{selectedPost.author}</span>
                  <span className="mx-2">•</span>
                  <span>{selectedPost.date}</span>
                </div>
              </div>

              <div className="prose max-w-none mb-8">
                <p className="text-gray-700 leading-relaxed">
                  {selectedPost.content}
                </p>
              </div>

              <div className="border-t pt-6">
                <h3 className="text-lg font-semibold mb-4">
                  댓글 ({selectedPost.comments.length})
                </h3>

                {selectedPost.comments.map((comment) => (
                  <div
                    key={comment.id}
                    className="bg-gray-50 rounded-lg p-4 mb-4"
                  >
                    <div className="flex items-center justify-between mb-2">
                      <span className="font-medium text-gray-900">
                        {comment.author}
                      </span>
                      <span className="text-sm text-gray-600">
                        {comment.date}
                      </span>
                    </div>
                    <p className="text-gray-700">{comment.content}</p>
                  </div>
                ))}

                <div className="mt-6">
                  <textarea
                    value={newComment}
                    onChange={(e) => setNewComment(e.target.value)}
                    placeholder="댓글을 입력하세요..."
                    className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    rows="3"
                  />
                  <button
                    onClick={() => handleAddComment(selectedPost.id)}
                    className="mt-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                  >
                    댓글 작성
                  </button>
                </div>
              </div>
            </div>
          </div>
        </main>
      ) : (
        // 목록 보기
        <main className="pt-16 pb-20">
          <div className="max-w-4xl mx-auto px-4 py-8">
            <div className="flex items-center justify-between mb-6">
              <h1 className="text-3xl font-bold text-gray-900">
                건강정보 게시판
              </h1>
              <button
                onClick={() => setShowWriteForm(true)}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                글쓰기
              </button>
            </div>

            {showWriteForm && (
              <div className="bg-white rounded-lg shadow-md p-6 mb-6">
                <h2 className="text-xl font-semibold mb-4">새 글 작성</h2>
                <div className="space-y-4">
                  <input
                    type="text"
                    placeholder="제목을 입력하세요"
                    value={newPost.title}
                    onChange={(e) =>
                      setNewPost({ ...newPost, title: e.target.value })
                    }
                    className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                  <textarea
                    placeholder="내용을 입력하세요"
                    value={newPost.content}
                    onChange={(e) =>
                      setNewPost({ ...newPost, content: e.target.value })
                    }
                    className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    rows="6"
                  />
                  <div className="flex space-x-2">
                    <button
                      onClick={handleWritePost}
                      className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                    >
                      작성하기
                    </button>
                    <button
                      onClick={() => setShowWriteForm(false)}
                      className="px-4 py-2 bg-gray-500 text-white rounded-lg hover:bg-gray-600 transition-colors"
                    >
                      취소
                    </button>
                  </div>
                </div>
              </div>
            )}

            <div className="space-y-4">
              {posts.map((post) => (
                <div
                  key={post.id}
                  className="bg-white rounded-lg shadow-md p-6 cursor-pointer hover:shadow-lg transition-shadow"
                  onClick={() => handlePostClick(post)}
                >
                  <div className="flex items-center justify-between mb-2">
                    <h2 className="text-xl font-semibold text-gray-900">
                      {post.title}
                    </h2>
                    <span className="text-sm text-gray-600">{post.date}</span>
                  </div>
                  <div className="flex items-center text-sm text-gray-600 mb-3">
                    <span>{post.author}</span>
                    <span className="mx-2">•</span>
                    <span>댓글 {post.comments.length}개</span>
                  </div>
                  <p className="text-gray-700 line-clamp-2">{post.content}</p>
                </div>
              ))}
            </div>
          </div>
        </main>
      )}
      <BottomNavigation /> {/* 항상 하단에 고정 렌더 */}
    </div>
  );
};

export default HealthBoard;
