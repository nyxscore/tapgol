import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { getMarketplacePost, updateMarketplacePost } from '../util/marketplaceService';
import { ref, uploadBytes, getDownloadURL, deleteObject } from 'firebase/storage';
import { storage } from '../util/firebase';
import { FaUpload, FaTimes, FaArrowLeft } from 'react-icons/fa';

const MarketplaceEdit = () => {
  const [post, setPost] = useState(null);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [price, setPrice] = useState('');
  const [category, setCategory] = useState('');
  const [location, setLocation] = useState('');
  const [images, setImages] = useState([]);
  const [imageUrls, setImageUrls] = useState([]);
  const [newImages, setNewImages] = useState([]);
  const [uploading, setUploading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [loading, setLoading] = useState(true);
  const { id } = useParams();
  const { user } = useAuth();
  const navigate = useNavigate();

  const categories = [
    { value: '', label: '카테고리 선택' },
    { value: 'electronics', label: '전자제품' },
    { value: 'furniture', label: '가구' },
    { value: 'clothing', label: '의류' },
    { value: 'books', label: '도서' },
    { value: 'sports', label: '스포츠용품' },
    { value: 'beauty', label: '뷰티' },
    { value: 'other', label: '기타' }
  ];

  useEffect(() => {
    loadPost();
  }, [id]);

  const loadPost = async () => {
    try {
      setLoading(true);
      const postData = await getMarketplacePost(id);
      setPost(postData);
      setTitle(postData.title || '');
      setDescription(postData.description || '');
      setPrice(postData.price ? postData.price.toString() : '');
      setCategory(postData.category || '');
      setLocation(postData.location || '');
      setImageUrls(postData.images || []);
    } catch (error) {
      console.error('상품 로딩 오류:', error);
      alert('상품을 불러오는데 실패했습니다.');
      navigate('/marketplace');
    } finally {
      setLoading(false);
    }
  };

  const handleImageUpload = async (files) => {
    if (imageUrls.length + newImages.length + files.length > 5) {
      alert('이미지는 최대 5개까지 업로드할 수 있습니다.');
      return;
    }

    setUploading(true);
    const newImageFiles = Array.from(files);
    setNewImages(prev => [...prev, ...newImageFiles]);

    try {
      const uploadPromises = newImageFiles.map(async (file) => {
        const storageRef = ref(storage, `marketplace/${Date.now()}_${file.name}`);
        const snapshot = await uploadBytes(storageRef, file);
        return getDownloadURL(snapshot.ref);
      });

      const urls = await Promise.all(uploadPromises);
      setImageUrls(prev => [...prev, ...urls]);
    } catch (error) {
      console.error('이미지 업로드 오류:', error);
      alert('이미지 업로드에 실패했습니다.');
    } finally {
      setUploading(false);
    }
  };

  const removeImage = (index) => {
    setImageUrls(prev => prev.filter((_, i) => i !== index));
    // 새로 추가된 이미지인 경우 newImages에서도 제거
    if (index >= post.images.length) {
      const newImageIndex = index - post.images.length;
      setNewImages(prev => prev.filter((_, i) => i !== newImageIndex));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!title.trim()) {
      alert('제목을 입력해주세요.');
      return;
    }

    if (!description.trim()) {
      alert('상품 설명을 입력해주세요.');
      return;
    }

    if (!price.trim()) {
      alert('가격을 입력해주세요.');
      return;
    }

    if (!category) {
      alert('카테고리를 선택해주세요.');
      return;
    }

    if (!user || post.authorId !== user.uid) {
      alert('수정 권한이 없습니다.');
      return;
    }

    setSubmitting(true);

    try {
      const updateData = {
        title: title.trim(),
        description: description.trim(),
        price: parseInt(price.replace(/[^0-9]/g, '')) || 0,
        category,
        location: location.trim(),
        images: imageUrls
      };

      await updateMarketplacePost(id, updateData);
      alert('상품이 성공적으로 수정되었습니다!');
      navigate(`/marketplace/${id}`);
    } catch (error) {
      console.error('상품 수정 오류:', error);
      alert('상품 수정에 실패했습니다. 다시 시도해주세요.');
    } finally {
      setSubmitting(false);
    }
  };

  const handlePriceChange = (e) => {
    const value = e.target.value.replace(/[^0-9]/g, '');
    setPrice(value);
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-amber-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">상품을 불러오는 중...</p>
        </div>
      </div>
    );
  }

  if (!post) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <p className="text-gray-600">상품을 찾을 수 없습니다.</p>
        </div>
      </div>
    );
  }

  if (!user || post.authorId !== user.uid) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <p className="text-gray-600">수정 권한이 없습니다.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-amber-50 via-orange-50 to-amber-100">
      <div className="max-w-2xl mx-auto px-4 py-6">
        {/* 헤더 */}
        <div className="flex items-center mb-6">
          <button
            onClick={() => navigate(`/marketplace/${id}`)}
            className="mr-4 p-2 text-gray-600 hover:text-gray-800"
          >
            <FaArrowLeft />
          </button>
          <h1 className="text-2xl font-bold text-gray-800">상품 수정</h1>
        </div>

        <form onSubmit={handleSubmit} className="bg-white rounded-lg shadow-md p-6">
          {/* 제목 */}
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              상품명 *
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="상품명을 입력해주세요"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent"
              maxLength={50}
            />
          </div>

          {/* 카테고리 */}
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              카테고리 *
            </label>
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent"
            >
              {categories.map(cat => (
                <option key={cat.value} value={cat.value}>
                  {cat.label}
                </option>
              ))}
            </select>
          </div>

          {/* 가격 */}
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              가격 *
            </label>
            <div className="relative">
              <input
                type="text"
                value={price}
                onChange={handlePriceChange}
                placeholder="가격을 입력해주세요"
                className="w-full px-3 py-2 pr-12 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent"
              />
              <span className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500">
                원
              </span>
            </div>
          </div>

          {/* 위치 */}
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              거래 희망 지역
            </label>
            <input
              type="text"
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              placeholder="예: 탑골공원 근처, 강남역 1번 출구"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent"
            />
          </div>

          {/* 이미지 업로드 */}
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              상품 이미지 (최대 5개)
            </label>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-4">
              {imageUrls.map((url, index) => (
                <div key={index} className="relative aspect-square">
                  <img
                    src={url}
                    alt={`상품 이미지 ${index + 1}`}
                    className="w-full h-full object-cover rounded-lg"
                  />
                  <button
                    type="button"
                    onClick={() => removeImage(index)}
                    className="absolute top-2 right-2 bg-red-500 text-white rounded-full p-1 hover:bg-red-600"
                  >
                    <FaTimes size={12} />
                  </button>
                </div>
              ))}
              {imageUrls.length < 5 && (
                <label className="aspect-square border-2 border-dashed border-gray-300 rounded-lg flex items-center justify-center cursor-pointer hover:border-amber-500 transition-colors">
                  <div className="text-center">
                    <FaUpload className="mx-auto text-gray-400 mb-2" />
                    <span className="text-sm text-gray-500">이미지 추가</span>
                  </div>
                  <input
                    type="file"
                    multiple
                    accept="image/*"
                    onChange={(e) => handleImageUpload(e.target.files)}
                    className="hidden"
                    disabled={uploading}
                  />
                </label>
              )}
            </div>
            {uploading && (
              <p className="text-sm text-gray-500">이미지 업로드 중...</p>
            )}
          </div>

          {/* 상품 설명 */}
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              상품 설명 *
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="상품에 대한 자세한 설명을 입력해주세요"
              rows={6}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent resize-none"
              maxLength={1000}
            />
            <div className="text-right text-sm text-gray-500 mt-1">
              {description.length}/1000
            </div>
          </div>

          {/* 제출 버튼 */}
          <div className="flex gap-4">
            <button
              type="button"
              onClick={() => navigate(`/marketplace/${id}`)}
              className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
            >
              취소
            </button>
            <button
              type="submit"
              disabled={submitting || uploading}
              className="flex-1 px-4 py-2 bg-amber-600 text-white rounded-lg hover:bg-amber-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {submitting ? '수정 중...' : '상품 수정'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default MarketplaceEdit;
