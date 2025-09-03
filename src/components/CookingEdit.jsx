import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { doc, getDoc, updateDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '../util/firebase';
import { useAuth } from '../contexts/AuthContext';
import { FaArrowLeft, FaSave } from 'react-icons/fa';

const CookingEdit = () => {
  const navigate = useNavigate();
  const { id } = useParams();
  const { user } = useAuth();
  const [form, setForm] = useState({
    title: '',
    content: '',
    category: '한식'
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);

  const categories = [
    '한식', '중식', '일식', '양식', '베이킹', '음료', '간식', '기타'
  ];

  useEffect(() => {
    loadPost();
  }, [id]);

  const loadPost = async () => {
    try {
      const docRef = doc(db, "cookingPosts", id);
      const docSnap = await getDoc(docRef);
      
      if (docSnap.exists()) {
        const postData = docSnap.data();
        
        // 작성자 확인
        if (postData.authorId !== user?.uid) {
          setError("수정 권한이 없습니다.");
          return;
        }

        setForm({
          title: postData.title || '',
          content: postData.content || '',
          category: postData.category || '한식'
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

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!form.title.trim()) {
      alert('제목을 입력해주세요.');
      return;
    }

    if (!form.content.trim()) {
      alert('내용을 입력해주세요.');
      return;
    }

    setSaving(true);
    try {
      const docRef = doc(db, "cookingPosts", id);
      await updateDoc(docRef, {
        title: form.title.trim(),
        content: form.content.trim(),
        category: form.category,
        updatedAt: serverTimestamp()
      });
      
      alert('요리 게시글이 수정되었습니다!');
      navigate(`/cooking/${id}`);
    } catch (error) {
      console.error('요리 게시글 수정 오류:', error);
      alert('게시글 수정에 실패했습니다. 다시 시도해주세요.');
    } finally {
      setSaving(false);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm(prev => ({
      ...prev,
      [name]: value
    }));
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

  return (
    <div className="min-h-screen bg-gradient-to-br from-amber-50 via-orange-50 to-amber-100">
      <main className="pb-20 pt-16">
        <div className="max-w-4xl mx-auto px-4">
          {/* Header */}
          <div className="bg-white rounded-2xl shadow-xl p-6 mb-6">
            <div className="flex items-center space-x-3">
              <button
                onClick={() => navigate(`/cooking/${id}`)}
                className="text-gray-600 hover:text-gray-800 transition-colors"
                title="요리 게시글로 돌아가기"
              >
                <FaArrowLeft className="w-6 h-6" />
              </button>
              <div>
                <h1 className="text-2xl font-bold text-gray-800">요리글 수정 👨‍🍳</h1>
                <p className="text-gray-600 mt-1">요리 레시피와 요리 팁을 수정해보세요</p>
              </div>
            </div>
          </div>

          {/* Form */}
          <div className="bg-white rounded-2xl shadow-xl p-6">
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Category Selection */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  요리 카테고리
                </label>
                <select
                  name="category"
                  value={form.category}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent"
                >
                  {categories.map((category) => (
                    <option key={category} value={category}>
                      {category}
                    </option>
                  ))}
                </select>
              </div>

              {/* Title */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  요리 제목 *
                </label>
                <input
                  type="text"
                  name="title"
                  value={form.title}
                  onChange={handleChange}
                  placeholder="예: 김치찌개 만드는 법, 간단한 파스타 레시피..."
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent"
                  maxLength="100"
                />
                <div className="text-right text-xs text-gray-500 mt-1">
                  {form.title.length}/100
                </div>
              </div>

              {/* Content */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  요리 내용 *
                </label>
                <textarea
                  name="content"
                  value={form.content}
                  onChange={handleChange}
                  placeholder="재료, 조리 순서, 팁 등을 자세히 작성해주세요..."
                  rows="12"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent resize-none"
                  maxLength="2000"
                />
                <div className="text-right text-xs text-gray-500 mt-1">
                  {form.content.length}/2000
                </div>
              </div>

              {/* Submit Button */}
              <div className="flex justify-end space-x-3">
                <button
                  type="button"
                  onClick={() => navigate(`/cooking/${id}`)}
                  className="px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  취소
                </button>
                <button
                  type="submit"
                  disabled={saving || !form.title.trim() || !form.content.trim()}
                  className="px-6 py-3 bg-amber-600 text-white rounded-lg hover:bg-amber-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2"
                >
                  <FaSave className="text-sm" />
                  <span>{saving ? '저장 중...' : '수정하기'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      </main>
    </div>
  );
};

export default CookingEdit;
