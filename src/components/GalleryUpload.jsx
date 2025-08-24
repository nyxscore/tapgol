import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { auth } from "../util/firebase";
import { onAuthStateChanged } from "firebase/auth";
import { getUserProfile } from "../util/userService";
import { uploadFile, createGalleryItem, getFileType, formatFileSize } from "../util/galleryService";

const GalleryUpload = () => {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [userData, setUserData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [selectedFile, setSelectedFile] = useState(null);
  const [preview, setPreview] = useState(null);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [uploadProgress, setUploadProgress] = useState(0);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      if (currentUser) {
        setUser(currentUser);
        try {
          const profile = await getUserProfile(currentUser.uid);
          setUserData(profile);
        } catch (error) {
          console.error("사용자 정보 로드 오류:", error);
        }
      } else {
        navigate("/login");
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, [navigate]);

  const handleFileSelect = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    // 파일 타입 검증
    const allowedImageTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
    const allowedVideoTypes = ['video/mp4', 'video/webm', 'video/ogg', 'video/quicktime'];
    
    if (!allowedImageTypes.includes(file.type) && !allowedVideoTypes.includes(file.type)) {
      alert("지원하지 않는 파일 형식입니다.\n\n이미지: JPG, PNG, GIF, WEBP\n동영상: MP4, WEBM, OGG, MOV");
      return;
    }

    // 파일 크기 제한 (50MB)
    const maxSize = 50 * 1024 * 1024; // 50MB
    if (file.size > maxSize) {
      alert("파일 크기는 50MB를 초과할 수 없습니다.");
      return;
    }

    setSelectedFile(file);

    // 미리보기 생성
    if (file.type.startsWith('image/')) {
      const reader = new FileReader();
      reader.onload = (e) => {
        setPreview(e.target.result);
      };
      reader.readAsDataURL(file);
    } else if (file.type.startsWith('video/')) {
      const video = document.createElement('video');
      video.onloadedmetadata = () => {
        setPreview(URL.createObjectURL(file));
      };
      video.src = URL.createObjectURL(file);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!selectedFile) {
      alert("파일을 선택해주세요.");
      return;
    }

    if (!title.trim()) {
      alert("제목을 입력해주세요.");
      return;
    }

    setUploading(true);
    setUploadProgress(0);

    try {
      // 파일 업로드
      const uploadResult = await uploadFile(selectedFile, user.uid);
      
      // 갤러리 항목 생성
      const galleryData = {
        title: title.trim(),
        description: description.trim(),
        fileUrl: uploadResult.url,
        fileName: uploadResult.fileName,
        originalName: uploadResult.originalName,
        fileSize: uploadResult.size,
        fileType: uploadResult.type,
        fileTypeCategory: getFileType(uploadResult.type),
        uploaderId: user.uid,
        uploader: userData?.nickname || userData?.name || user.displayName || "익명",
        uploaderEmail: user.email
      };

      await createGalleryItem(galleryData);
      
      alert("업로드가 완료되었습니다!");
      navigate("/gallery");
    } catch (error) {
      console.error("업로드 오류:", error);
      alert(error.message || "업로드에 실패했습니다.");
    } finally {
      setUploading(false);
      setUploadProgress(0);
    }
  };

  const handleCancel = () => {
    if (uploading) {
      if (!window.confirm("업로드 중입니다. 정말로 취소하시겠습니까?")) {
        return;
      }
    }
    navigate("/gallery");
  };

  const clearFile = () => {
    setSelectedFile(null);
    setPreview(null);
    if (preview && preview.startsWith('blob:')) {
      URL.revokeObjectURL(preview);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-amber-50 via-orange-50 to-amber-100 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-amber-700 mx-auto mb-4"></div>
          <p className="text-amber-700">로딩 중...</p>
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
            <button
              onClick={handleCancel}
              className="flex items-center text-amber-700 hover:text-amber-800 font-medium"
            >
              <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
              갤러리로 돌아가기
            </button>
            <h1 className="text-2xl font-bold text-gray-800">갤러리 업로드</h1>
            <div className="w-24"></div>
          </div>
        </div>

        {/* 업로드 폼 */}
        <div className="bg-white rounded-2xl shadow-xl p-6">
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* 파일 선택 */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                파일 선택 *
              </label>
              <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-amber-400 transition-colors">
                <input
                  type="file"
                  accept="image/*,video/*"
                  onChange={handleFileSelect}
                  className="hidden"
                  id="file-upload"
                  disabled={uploading}
                />
                <label
                  htmlFor="file-upload"
                  className={`cursor-pointer ${uploading ? 'opacity-50 cursor-not-allowed' : ''}`}
                >
                  <div className="space-y-2">
                    <svg className="mx-auto h-12 w-12 text-gray-400" stroke="currentColor" fill="none" viewBox="0 0 48 48">
                      <path d="M28 8H12a4 4 0 00-4 4v20m32-12v8m0 0v8a4 4 0 01-4 4H12a4 4 0 01-4-4v-4m32-4l-3.172-3.172a4 4 0 00-5.656 0L28 28M8 32l9.172-9.172a4 4 0 015.656 0L28 28m0 0l4 4m4-24h8m-4-4v8m-12 4h.02" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                    <div className="text-gray-600">
                      <span className="font-medium text-amber-600 hover:text-amber-500">
                        파일을 클릭하여 선택
                      </span>
                      <p className="text-xs">또는 드래그 앤 드롭</p>
                    </div>
                    <p className="text-xs text-gray-500">
                      이미지: JPG, PNG, GIF, WEBP / 동영상: MP4, WEBM, OGG, MOV (최대 50MB)
                    </p>
                  </div>
                </label>
              </div>
            </div>

            {/* 파일 미리보기 */}
            {selectedFile && (
              <div className="border border-gray-200 rounded-lg p-4">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-sm font-medium text-gray-700">선택된 파일</h3>
                  <button
                    type="button"
                    onClick={clearFile}
                    className="text-red-600 hover:text-red-700 text-sm"
                    disabled={uploading}
                  >
                    제거
                  </button>
                </div>
                <div className="flex items-center space-x-4">
                  {preview && (
                    <div className="flex-shrink-0">
                      {selectedFile.type.startsWith('image/') ? (
                        <img
                          src={preview}
                          alt="미리보기"
                          className="w-20 h-20 object-cover rounded-lg"
                        />
                      ) : (
                        <video
                          src={preview}
                          className="w-20 h-20 object-cover rounded-lg"
                          muted
                        />
                      )}
                    </div>
                  )}
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900 truncate">
                      {selectedFile.name}
                    </p>
                    <p className="text-sm text-gray-500">
                      {formatFileSize(selectedFile.size)} • {selectedFile.type}
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* 제목 */}
            <div>
              <label htmlFor="title" className="block text-sm font-medium text-gray-700 mb-2">
                제목 *
              </label>
              <input
                type="text"
                id="title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent"
                placeholder="제목을 입력하세요"
                maxLength="100"
                required
                disabled={uploading}
              />
              <p className="text-xs text-gray-500 mt-1">
                {title.length}/100
              </p>
            </div>

            {/* 설명 */}
            <div>
              <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-2">
                설명
              </label>
              <textarea
                id="description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows="4"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent resize-none"
                placeholder="파일에 대한 설명을 입력하세요 (선택사항)"
                maxLength="500"
                disabled={uploading}
              />
              <p className="text-xs text-gray-500 mt-1">
                {description.length}/500
              </p>
            </div>

            {/* 업로드 진행률 */}
            {uploading && (
              <div className="space-y-2">
                <div className="flex justify-between text-sm text-gray-600">
                  <span>업로드 중...</span>
                  <span>{uploadProgress}%</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div
                    className="bg-amber-600 h-2 rounded-full transition-all duration-300"
                    style={{ width: `${uploadProgress}%` }}
                  ></div>
                </div>
              </div>
            )}

            {/* 버튼 */}
            <div className="flex justify-end space-x-3 pt-4">
              <button
                type="button"
                onClick={handleCancel}
                disabled={uploading}
                className={`px-6 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors ${
                  uploading ? 'opacity-50 cursor-not-allowed' : ''
                }`}
              >
                취소
              </button>
              <button
                type="submit"
                disabled={uploading || !selectedFile || !title.trim()}
                className={`px-6 py-2 rounded-lg transition-colors ${
                  uploading || !selectedFile || !title.trim()
                    ? 'bg-gray-400 text-white cursor-not-allowed'
                    : 'bg-amber-600 text-white hover:bg-amber-700'
                }`}
              >
                {uploading ? '업로드 중...' : '업로드'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default GalleryUpload;
