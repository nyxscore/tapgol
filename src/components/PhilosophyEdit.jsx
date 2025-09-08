import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { auth } from "../util/firebase";
import { onAuthStateChanged } from "firebase/auth";
import { getPhilosophyPost, updatePhilosophyPost } from "../util/philosophyService";

const PhilosophyEdit = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [post, setPost] = useState(null);
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      if (!currentUser) {
        alert("글을 수정하려면 로그인이 필요합니다.");
        navigate("/login");
        return;
      }
      setUser(currentUser);
      
      // 게시글 로드
      try {
        const postData = await getPhilosophyPost(id);
        setPost(postData);
        
        // 작성자 확인
        if (postData.authorId !== currentUser.uid) {
          alert("본인이 작성한 글만 수정할 수 있습니다.");
          navigate(`/philosophy/${id}`);
          return;
        }
        
        // 폼에 기존 데이터 설정
        setTitle(postData.title);
        setContent(postData.content);
      } catch (error) {
        console.error("게시글 로드 오류:", error);
        setError("게시글을 불러오는데 실패했습니다.");
      } finally {
        setLoading(false);
      }
    });

    return () => unsubscribe();
  }, [id, navigate]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!title.trim()) {
      alert("제목을 입력해주세요.");
      return;
    }
    
    if (!content.trim()) {
      alert("내용을 입력해주세요.");
      return;
    }

    setSubmitting(true);
    
    try {
      const postData = {
        title: title.trim(),
        content: content.trim()
      };
      
      await updatePhilosophyPost(id, postData);
      alert("개똥철학 글이 성공적으로 수정되었습니다!");
      navigate(`/philosophy/${id}`);
    } catch (error) {
      console.error("글 수정 오류:", error);
      alert("글 수정에 실패했습니다. 다시 시도해주세요.");
    } finally {
      setSubmitting(false);
    }
  };

  const handleCancel = () => {
    if (window.confirm("수정을 취소하시겠습니까?")) {
      navigate(`/philosophy/${id}`);
    }
  };

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

  if (error || !post) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-amber-50 via-orange-50 to-amber-100 flex items-center justify-center">
        <div className="text-center">
          <p className="text-red-600 text-lg mb-4">{error || "게시글을 찾을 수 없습니다."}</p>
          <button
            onClick={() => navigate("/philosophy")}
            className="px-4 py-2 bg-amber-600 text-white rounded-lg hover:bg-amber-700 transition-colors"
          >
            개똥철학으로 돌아가기
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-amber-50 via-orange-50 to-amber-100">
      <main className="pb-20 pt-16">
        <div className="max-w-4xl mx-auto px-4">
          {/* 헤더 */}
          <div className="bg-white rounded-2xl shadow-xl p-6 mb-6">
            <div className="flex items-center justify-between">
              <button
                onClick={handleCancel}
                className="flex items-center justify-center w-12 h-12 bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white rounded-full shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-110"
                title="개똥철학으로 돌아가기"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M10.5 19.5L3 12m0 0l7.5-7.5M3 12h18" />
                </svg>
              </button>
              <h1 className="text-2xl font-bold text-gray-800">개똥철학 수정</h1>
              <div className="w-24"></div>
            </div>
          </div>

          {/* 수정 폼 */}
          <div className="bg-white rounded-2xl shadow-xl p-6">
            <form onSubmit={handleSubmit}>
              {/* 제목 입력 */}
              <div className="mb-6">
                <label htmlFor="title" className="block text-sm font-medium text-gray-700 mb-2">
                  제목
                </label>
                <input
                  type="text"
                  id="title"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent transition-colors"
                  placeholder="개똥철학에 대한 제목을 입력하세요"
                  maxLength={100}
                />
                <div className="text-right mt-1">
                  <span className="text-sm text-gray-500">{title.length}/100</span>
                </div>
              </div>

              {/* 내용 입력 */}
              <div className="mb-6">
                <label htmlFor="content" className="block text-sm font-medium text-gray-700 mb-2">
                  내용
                </label>
                <textarea
                  id="content"
                  value={content}
                  onChange={(e) => setContent(e.target.value)}
                  rows={12}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent transition-colors resize-none"
                  placeholder="책에는 없는 나만의 철학을 작성해주세요..."
                  maxLength={2000}
                />
                <div className="text-right mt-1">
                  <span className="text-sm text-gray-500">{content.length}/2000</span>
                </div>
              </div>

              {/* 버튼 그룹 */}
              <div className="flex justify-end space-x-3">
                <button
                  type="button"
                  onClick={handleCancel}
                  className="px-6 py-3 bg-gray-500 text-white rounded-lg hover:bg-gray-600 transition-colors"
                >
                  취소
                </button>
                <button
                  type="submit"
                  disabled={submitting || !title.trim() || !content.trim()}
                  className={`px-6 py-3 rounded-lg transition-colors ${
                    submitting || !title.trim() || !content.trim()
                      ? "bg-gray-400 text-white cursor-not-allowed"
                      : "bg-amber-600 text-white hover:bg-amber-700"
                  }`}
                >
                  {submitting ? "수정 중..." : "수정하기"}
                </button>
              </div>
            </form>
          </div>
        </div>
      </main>
    </div>
  );
};

export default PhilosophyEdit;
