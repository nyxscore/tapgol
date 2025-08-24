import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { auth } from "../util/firebase";
import { onAuthStateChanged } from "firebase/auth";
import { getUserProfile } from "../util/userService";
import { createPost } from "../util/postService";

const BoardWrite = () => {
  const [form, setForm] = useState({
    title: "",
    content: "",
    category: "일반"
  });
  const [user, setUser] = useState(null);
  const [userData, setUserData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      if (currentUser) {
        setUser(currentUser);
        
        // 사용자 정보 가져오기
        try {
          const profile = await getUserProfile(currentUser.uid);
          setUserData(profile);
        } catch (error) {
          console.error("사용자 정보 로드 오류:", error);
        }
      } else {
        // 로그인되지 않은 경우 로그인 페이지로 리다이렉트
        alert("글을 작성하려면 로그인이 필요합니다.");
        navigate("/login");
        return;
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, [navigate]);

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
      const postData = {
        title: form.title.trim(),
        content: form.content.trim(),
        category: form.category,
        author: userData?.nickname || userData?.name || user.displayName || "익명",
        authorId: user.uid,
        authorEmail: user.email
      };

      await createPost(postData);
      alert("게시글이 성공적으로 작성되었습니다!");
      navigate("/board");
    } catch (error) {
      console.error("게시글 작성 오류:", error);
      alert("게시글 작성 중 오류가 발생했습니다. 다시 시도해주세요.");
    } finally {
      setSubmitting(false);
    }
  };

  const handleCancel = () => {
    if (form.title.trim() || form.content.trim()) {
      if (window.confirm("작성 중인 내용이 있습니다. 정말 나가시겠습니까?")) {
        navigate("/board");
      }
    } else {
      navigate("/board");
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-amber-50 via-orange-50 to-amber-100 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-amber-700 mx-auto mb-4"></div>
          <p className="text-amber-700">페이지를 불러오는 중...</p>
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
                글쓰기
              </h1>
              <p className="text-gray-600">
                탑골공원 이야기를 나누어보세요
              </p>
            </div>
            <div className="flex items-center space-x-2 text-sm text-gray-600">
              <span>작성자:</span>
              <span className="font-semibold text-amber-700">
                {userData?.nickname || userData?.name || user.displayName || "익명"}
              </span>
            </div>
          </div>
        </div>

        {/* 글쓰기 폼 */}
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
                <option value="일반">일반</option>
                <option value="이벤트">이벤트</option>
                <option value="건의사항">건의사항</option>
                <option value="질문">질문</option>
                <option value="후기">후기</option>
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
                {submitting ? "작성 중..." : "글쓰기"}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default BoardWrite;
