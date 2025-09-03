import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { auth } from "../util/firebase";
import { onAuthStateChanged } from "firebase/auth";
import { getPost, updatePost } from "../util/postService";

const BoardEdit = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [form, setForm] = useState({
    title: "",
    content: "",
    category: "정기모임"
  });
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      setUser(currentUser);
      
      // 로그인 상태가 확인된 후 게시글 로드
      if (currentUser !== null) {
        try {
          const postData = await getPost(id);
          
          // 작성자 확인
          if (currentUser.uid !== postData.authorId) {
            alert("수정 권한이 없습니다.");
            navigate(`/board/${id}`);
            return;
          }

          setForm({
            title: postData.title || "",
            content: postData.content || "",
            category: postData.category || "정기모임"
          });
        } catch (error) {
          console.error("게시글 로드 오류:", error);
          alert("게시글을 불러오는데 실패했습니다.");
          navigate("/board");
        } finally {
          setLoading(false);
        }
      } else if (currentUser === null) {
        // 로그인되지 않은 경우
        alert("로그인이 필요합니다.");
        navigate("/login");
      }
    });

    return () => unsubscribe();
  }, [id, navigate]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setForm(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!form.title.trim()) {
      alert("제목을 입력해주세요.");
      return;
    }
    
    if (!form.content.trim()) {
      alert("내용을 입력해주세요.");
      return;
    }

    setSubmitting(true);
    
    try {
      const updateData = {
        title: form.title.trim(),
        content: form.content.trim(),
        category: form.category
      };

      await updatePost(id, updateData);
      alert("게시글이 성공적으로 수정되었습니다!");
      navigate(`/board/${id}`);
    } catch (error) {
      console.error("게시글 수정 오류:", error);
      alert("게시글 수정 중 오류가 발생했습니다. 다시 시도해주세요.");
    } finally {
      setSubmitting(false);
    }
  };

  const handleCancel = () => {
    if (window.confirm("수정을 취소하시겠습니까? 변경사항이 저장되지 않습니다.")) {
      navigate(`/board/${id}`);
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

  return (
    <div className="min-h-screen bg-gradient-to-br from-amber-50 via-orange-50 to-amber-100 pb-20">
      <div className="max-w-4xl mx-auto p-6">
        {/* 헤더 */}
        <div className="bg-white rounded-2xl shadow-xl p-6 mb-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-amber-700 mb-2">
                모임글 수정
              </h1>
              <p className="text-gray-600">
                모임글 내용을 수정해주세요
              </p>
            </div>
            <button
              onClick={() => navigate(`/board/${id}`)}
              className="flex items-center text-amber-700 hover:text-amber-800 font-medium"
              title="돌아가기"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
            </button>
          </div>
        </div>

        {/* 수정 폼 */}
        <div className="bg-white rounded-2xl shadow-xl p-6">
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* 카테고리 선택 */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                카테고리
              </label>
              <select
                name="category"
                value={form.category}
                onChange={handleInputChange}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent"
              >
                <option value="정기모임">정기모임</option>
                <option value="벙개모임">벙개모임</option>
                <option value="모임후기">모임후기</option>
                <option value="모임건의사항">모임건의사항</option>
              </select>
            </div>

            {/* 제목 입력 */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                제목 <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                name="title"
                value={form.title}
                onChange={handleInputChange}
                placeholder="제목을 입력해주세요"
                maxLength={100}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent"
                required
              />
              <div className="text-right text-sm text-gray-500 mt-1">
                {form.title.length}/100
              </div>
            </div>

            {/* 내용 입력 */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                내용 <span className="text-red-500">*</span>
              </label>
              <textarea
                name="content"
                value={form.content}
                onChange={handleInputChange}
                placeholder="내용을 입력해주세요"
                rows={15}
                maxLength={2000}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent resize-none"
                required
              />
              <div className="text-right text-sm text-gray-500 mt-1">
                {form.content.length}/2000
              </div>
            </div>

            {/* 버튼 그룹 */}
            <div className="flex justify-end space-x-4 pt-6 border-t border-gray-200">
              <button
                type="button"
                onClick={handleCancel}
                className="px-6 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
              >
                취소
              </button>
              <button
                type="submit"
                disabled={submitting}
                className={`px-6 py-2 rounded-lg transition-colors ${
                  submitting
                    ? "bg-gray-400 text-white cursor-not-allowed"
                    : "bg-amber-600 text-white hover:bg-amber-700"
                }`}
              >
                {submitting ? "수정 중..." : "수정 완료"}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default BoardEdit;
