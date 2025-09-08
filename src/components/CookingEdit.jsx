import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { doc, getDoc, updateDoc, serverTimestamp } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { db, storage } from '../util/firebase';
import { useAuth } from '../contexts/AuthContext';
import { FaArrowLeft, FaSave, FaImage, FaTimes } from 'react-icons/fa';

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
  const [images, setImages] = useState([]);
  const [uploadingImages, setUploadingImages] = useState(false);

  const categories = [
    '한식', '중식', '일식', '양식', '베이킹', '음료', '간식', '기타'
  ];

  // 이미지 업로드 함수
  const handleImageUpload = async (files) => {
    if (!files || files.length === 0) return;

    setUploadingImages(true);
    const uploadPromises = Array.from(files).map(async (file) => {
      if (file.size > 5 * 1024 * 1024) {
        alert('파일 크기는 5MB 이하여야 합니다.');
        return null;
      }

      if (!file.type.startsWith('image/')) {
        alert('이미지 파일만 업로드 가능합니다.');
        return null;
      }

      try {
        const imageRef = ref(storage, `cooking/${Date.now()}_${file.name}`);
        const snapshot = await uploadBytes(imageRef, file);
        const downloadURL = await getDownloadURL(snapshot.ref);
        
        return {
          id: Date.now() + Math.random(),
          url: downloadURL,
          name: file.name,
          size: file.size
        };
      } catch (error) {
        console.error('이미지 업로드 오류:', error);
        alert('이미지 업로드에 실패했습니다.');
        return null;
      }
    });

    try {
      const uploadedImages = await Promise.all(uploadPromises);
      const validImages = uploadedImages.filter(img => img !== null);
      setImages(prev => [...prev, ...validImages]);
    } catch (error) {
      console.error('이미지 업로드 오류:', error);
      alert('이미지 업로드에 실패했습니다.');
    } finally {
      setUploadingImages(false);
    }
  };

  // 이미지 삭제 함수
  const handleImageRemove = (imageId) => {
    setImages(prev => prev.filter(img => img.id !== imageId));
  };

  // 파일 선택 핸들러
  const handleFileSelect = (e) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      handleImageUpload(files);
    }
  };

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

        // 기존 이미지들 로드
        if (postData.images && postData.images.length > 0) {
          const existingImages = postData.images.map((url, index) => ({
            id: `existing_${index}`,
            url: url,
            name: `기존 이미지 ${index + 1}`,
            size: 0
          }));
          setImages(existingImages);
        }
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
        images: images.map(img => img.url), // 이미지 URL 배열 업데이트
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

              {/* Image Upload Section */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  요리 사진 첨부 (선택사항)
                </label>
                <div className="space-y-4">
                  {/* Upload Button */}
                  <div className="flex items-center space-x-4">
                    <label className="flex items-center space-x-2 px-4 py-2 bg-amber-100 text-amber-800 rounded-lg hover:bg-amber-200 transition-colors cursor-pointer">
                      <FaImage className="w-4 h-4" />
                      <span>사진 추가</span>
                      <input
                        type="file"
                        multiple
                        accept="image/*"
                        onChange={handleFileSelect}
                        className="hidden"
                        disabled={uploadingImages}
                      />
                    </label>
                    {uploadingImages && (
                      <div className="flex items-center space-x-2 text-amber-600">
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-amber-600"></div>
                        <span className="text-sm">업로드 중...</span>
                      </div>
                    )}
                  </div>

                  {/* Image Preview */}
                  {images.length > 0 && (
                    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                      {images.map((image) => (
                        <div key={image.id} className="relative group">
                          <img
                            src={image.url}
                            alt={image.name}
                            className="w-full h-32 object-cover rounded-lg shadow-md"
                          />
                          <button
                            type="button"
                            onClick={() => handleImageRemove(image.id)}
                            className="absolute -top-2 -right-2 w-6 h-6 bg-red-500 text-white rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-600"
                          >
                            <FaTimes className="w-3 h-3" />
                          </button>
                          <div className="absolute bottom-0 left-0 right-0 bg-black bg-opacity-50 text-white text-xs p-2 rounded-b-lg">
                            <div className="truncate">{image.name}</div>
                            {image.size > 0 && <div>{(image.size / 1024 / 1024).toFixed(1)}MB</div>}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Upload Info */}
                  <div className="text-xs text-gray-500">
                    <p>• 최대 5MB까지 업로드 가능합니다</p>
                    <p>• JPG, PNG, GIF 형식을 지원합니다</p>
                    <p>• 여러 장의 사진을 한 번에 선택할 수 있습니다</p>
                  </div>
                </div>
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
