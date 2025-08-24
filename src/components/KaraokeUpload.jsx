import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { auth } from "../util/firebase";
import { onAuthStateChanged } from "firebase/auth";
import { getUserProfile } from "../util/userService";
import { uploadKaraokeVideo, createKaraokePost, getFileType, formatFileSize } from "../util/karaokeService";

const KaraokeUpload = () => {
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
        alert("로그인이 필요합니다.");
        navigate("/login");
        return;
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, [navigate]);

  const handleFileSelect = (e) => {
    const file = e.target.files[0];
    if (file) {
      // 파일 타입 검증
      if (!file.type.startsWith('video/')) {
        alert("비디오 파일만 업로드 가능합니다.");
        return;
      }

      // 파일 크기 검증 (100MB 제한)
      if (file.size > 100 * 1024 * 1024) {
        alert("파일 크기는 100MB 이하여야 합니다.");
        return;
      }

      setSelectedFile(file);
      
      // 비디오 프리뷰 생성
      const video = document.createElement('video');
      video.src = URL.createObjectURL(file);
      video.currentTime = 1; // 1초 지점에서 썸네일 생성
      
      video.addEventListener('loadeddata', () => {
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        canvas.width = 300;
        canvas.height = 200;
        
        ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
        const thumbnailUrl = canvas.toDataURL('image/jpeg');
        setPreview(thumbnailUrl);
      });
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!selectedFile) {
      alert("비디오 파일을 선택해주세요.");
      return;
    }
    
    if (!title.trim()) {
      alert("제목을 입력해주세요.");
      return;
    }

    setUploading(true);
    setUploadProgress(0);
    
    try {
      // 비디오 업로드
      const uploadResult = await uploadKaraokeVideo(selectedFile, user.uid);
      
      // 게시글 데이터 생성
      const postData = {
        title: title.trim(),
        description: description.trim(),
        videoUrl: uploadResult.url,
        fileName: uploadResult.fileName,
        fileType: selectedFile.type,
        fileSize: selectedFile.size,
        author: userData?.nickname || userData?.name || user.displayName || "익명",
        authorId: user.uid,
        authorEmail: user.email
      };

      // Firestore에 게시글 저장
      await createKaraokePost(postData);
      
      alert("노래 영상이 업로드되었습니다!");
      navigate("/karaoke");
    } catch (error) {
      console.error("업로드 오류:", error);
      alert("업로드에 실패했습니다: " + error.message);
    } finally {
      setUploading(false);
      setUploadProgress(0);
    }
  };

  const handleCancel = () => {
    if (window.confirm("업로드를 취소하시겠습니까?")) {
      navigate("/karaoke");
    }
  };

  const clearFile = () => {
    setSelectedFile(null);
    setPreview(null);
    const fileInput = document.getElementById('video-file');
    if (fileInput) fileInput.value = '';
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-amber-50 via-orange-50 to-amber-100 pb-20">
        <div className="max-w-4xl mx-auto p-6">
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-amber-700 mx-auto mb-4"></div>
            <p className="text-amber-700">로딩 중...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-amber-50 via-orange-50 to-amber-100 pb-20">
      <div className="max-w-4xl mx-auto p-6">
        {/* Header */}
        <div className="bg-white rounded-2xl shadow-xl p-6 mb-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-800">노래 영상 업로드</h1>
              <p className="text-gray-600 mt-1">노래 영상을 공유해보세요</p>
            </div>
            <button
              onClick={handleCancel}
              className="px-4 py-2 text-gray-600 hover:text-gray-800 transition-colors"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>

        {/* Upload Form */}
        <div className="bg-white rounded-2xl shadow-xl p-6">
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* File Select */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                비디오 파일 선택
              </label>
              <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-amber-400 transition-colors">
                <input
                  id="video-file"
                  type="file"
                  accept="video/*"
                  onChange={handleFileSelect}
                  className="hidden"
                  required
                />
                <label htmlFor="video-file" className="cursor-pointer">
                  <div className="space-y-2">
                    <svg className="mx-auto h-12 w-12 text-gray-400" stroke="currentColor" fill="none" viewBox="0 0 48 48">
                      <path d="M28 8H12a4 4 0 00-4 4v20m32-12v8m0 0v8a4 4 0 01-4 4H12a4 4 0 01-4-4v-4m32-4l-3.172-3.172a4 4 0 00-5.656 0L28 28M8 32l9.172-9.172a4 4 0 015.656 0L28 28m0 0l4 4m4-24h8m-4-4v8m-12 4h.02" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                    <div className="text-gray-600">
                      <span className="font-medium text-amber-600 hover:text-amber-500">
                        클릭하여 비디오 파일 선택
                      </span>
                      <p className="text-xs">MP4, WebM, OGG (최대 100MB)</p>
                    </div>
                  </div>
                </label>
              </div>
            </div>

            {/* File Preview */}
            {selectedFile && (
              <div className="bg-gray-50 rounded-lg p-4">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-sm font-medium text-gray-700">선택된 파일</h3>
                  <button
                    type="button"
                    onClick={clearFile}
                    className="text-red-600 hover:text-red-700 text-sm"
                  >
                    제거
                  </button>
                </div>
                <div className="flex items-center space-x-3">
                  {preview && (
                    <img src={preview} alt="비디오 썸네일" className="w-16 h-12 object-cover rounded" />
                  )}
                  <div className="flex-1">
                    <p className="text-sm font-medium text-gray-900">{selectedFile.name}</p>
                    <p className="text-xs text-gray-500">
                      {getFileType(selectedFile.type)} • {formatFileSize(selectedFile.size)}
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* Title */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                제목
              </label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="노래 제목을 입력하세요"
                maxLength="100"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent"
                required
              />
              <div className="text-right text-sm text-gray-500 mt-1">
                {title.length}/100
              </div>
            </div>

            {/* Description */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                설명 (선택사항)
              </label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="노래에 대한 설명을 입력하세요..."
                rows="4"
                maxLength="500"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent resize-none"
              />
              <div className="text-right text-sm text-gray-500 mt-1">
                {description.length}/500
              </div>
            </div>

            {/* Upload Progress */}
            {uploading && (
              <div className="bg-gray-50 rounded-lg p-4">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium text-gray-700">업로드 중...</span>
                  <span className="text-sm text-gray-500">{uploadProgress}%</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div
                    className="bg-amber-600 h-2 rounded-full transition-all duration-300"
                    style={{ width: `${uploadProgress}%` }}
                  ></div>
                </div>
              </div>
            )}

            {/* Buttons */}
            <div className="flex justify-end space-x-3 pt-4">
              <button
                type="button"
                onClick={handleCancel}
                className="px-6 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
              >
                취소
              </button>
              <button
                type="submit"
                disabled={uploading || !selectedFile || !title.trim()}
                className={`px-6 py-2 rounded-lg transition-colors ${
                  uploading || !selectedFile || !title.trim()
                    ? "bg-gray-400 text-white cursor-not-allowed"
                    : "bg-amber-600 text-white hover:bg-amber-700"
                }`}
              >
                {uploading ? "업로드 중..." : "업로드"}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default KaraokeUpload;
