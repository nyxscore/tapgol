import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import BottomNavigation from "./BottomNavigation";

const Karaoke = () => {
  const navigate = useNavigate();
  const [videos, setVideos] = useState([
    {
      id: 1,
      title: "임영웅 - 사랑은 늘 도망가",
      user: "노래왕김철수",
      views: "1.2K",
      likes: 156,
      comments: 23,
      thumbnail:
        "https://via.placeholder.com/300x200/FF6B6B/FFFFFF?text=노래방+영상",
      videoUrl: null,
      videoFile: null,
      description: "부족한 노래이지만 즐겨주세요",
      timestamp: "2시간 전",
    },
    {
      id: 2,
      title: "조항조 - 거짓말",
      user: "음악사랑",
      views: "856",
      likes: 89,
      comments: 12,
      thumbnail:
        "https://via.placeholder.com/300x200/4ECDC4/FFFFFF?text=아이유+커버",
      videoUrl: null,
      videoFile: null,
      description: "제가 가장 좋아하는 애창곡입니다.",
      timestamp: "5시간 전",
    },
    {
      id: 3,
      title: "나훈아 - 홍시",
      user: "까마귀",
      views: "2.1K",
      likes: 234,
      comments: 45,
      thumbnail:
        "https://via.placeholder.com/300x200/45B7D1/FFFFFF?text=BTS+커버",
      videoUrl: null,
      videoFile: null,
      description: "생각이 난다 홍시가 열리면 울 엄마가 생각이 난다",
      timestamp: "1일 전",
    },
  ]);

  const [selectedVideo, setSelectedVideo] = useState(null);
  const [comment, setComment] = useState("");
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [uploadForm, setUploadForm] = useState({
    title: "",
    description: "",
    videoFile: null,
  });
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);

  const handleLike = (videoId) => {
    setVideos(
      videos.map((video) =>
        video.id === videoId ? { ...video, likes: video.likes + 1 } : video
      )
    );
  };

  const handleComment = (videoId) => {
    if (comment.trim()) {
      // 댓글 추가 로직
      setComment("");
    }
  };

  const handleVideoSelect = (video) => {
    setSelectedVideo(video);
    setIsPlaying(false);
    setCurrentTime(0);
    setDuration(0);
  };

  const handleVideoLoad = (e) => {
    setDuration(e.target.duration);
  };

  const handleVideoTimeUpdate = (e) => {
    setCurrentTime(e.target.currentTime);
  };

  const handleVideoPlay = () => {
    setIsPlaying(true);
  };

  const handleVideoPause = () => {
    setIsPlaying(false);
  };

  const formatTime = (time) => {
    const minutes = Math.floor(time / 60);
    const seconds = Math.floor(time % 60);
    return `${minutes}:${seconds.toString().padStart(2, "0")}`;
  };

  const handleUpload = () => {
    if (uploadForm.title && uploadForm.description && uploadForm.videoFile) {
      // 비디오 파일에서 썸네일 생성
      const video = document.createElement("video");
      video.src = URL.createObjectURL(uploadForm.videoFile);
      video.currentTime = 1; // 1초 지점에서 썸네일 생성

      const canvas = document.createElement("canvas");
      const ctx = canvas.getContext("2d");
      canvas.width = 300;
      canvas.height = 200;

      video.addEventListener("loadeddata", () => {
        ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
        const thumbnailUrl = canvas.toDataURL("image/jpeg");

        const newVideo = {
          id: videos.length + 1,
          title: uploadForm.title,
          user: "나",
          views: "0",
          likes: 0,
          comments: 0,
          thumbnail: thumbnailUrl,
          videoUrl: URL.createObjectURL(uploadForm.videoFile),
          videoFile: uploadForm.videoFile,
          description: uploadForm.description,
          timestamp: "방금 전",
        };

        setVideos([newVideo, ...videos]);
        setShowUploadModal(false);
        setUploadForm({ title: "", description: "", videoFile: null });
      });
    } else {
      alert("제목, 설명, 그리고 비디오 파일을 모두 입력해주세요.");
    }
  };

  return (
    <div className="min-h-screen bg-gray-900 text-white">
      {/* 헤더 */}
      <div className="bg-gray-800 border-b border-gray-700">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <button
                onClick={() => navigate(-1)}
                className="text-gray-300 hover:text-white"
              >
                <svg
                  className="w-6 h-6"
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
              </button>
              <h1 className="text-2xl font-bold">노래방</h1>
            </div>
            <button
              onClick={() => setShowUploadModal(true)}
              className="bg-red-600 hover:bg-red-700 px-4 py-2 rounded-lg font-medium flex items-center space-x-2"
            >
              <svg
                className="w-5 h-5"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 4v16m8-8H4"
                />
              </svg>
              <span>영상 업로드</span>
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-6">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* 메인 비디오 영역 */}
          <div className="lg:col-span-2">
            {selectedVideo ? (
              <div>
                {/* 비디오 플레이어 */}
                <div className="bg-black rounded-lg overflow-hidden mb-4">
                  <div className="aspect-video bg-gray-800">
                    {selectedVideo.videoUrl ? (
                      <video
                        controls
                        className="w-full h-full object-contain"
                        src={selectedVideo.videoUrl}
                        poster={selectedVideo.thumbnail}
                        onLoadedMetadata={handleVideoLoad}
                        onTimeUpdate={handleVideoTimeUpdate}
                        onPlay={handleVideoPlay}
                        onPause={handleVideoPause}
                      >
                        브라우저가 비디오 태그를 지원하지 않습니다.
                      </video>
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <div className="text-center">
                          <svg
                            className="w-16 h-16 text-gray-400 mx-auto mb-4"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M14.828 14.828a4 4 0 01-5.656 0M9 10h1m4 0h1m-6 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                            />
                          </svg>
                          <p className="text-gray-400">
                            비디오 파일이 없습니다
                          </p>
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                {/* 비디오 정보 */}
                <div className="mb-6">
                  <h1 className="text-2xl font-bold mb-2">
                    {selectedVideo.title}
                  </h1>
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center space-x-4 text-gray-400">
                      <span>{selectedVideo.views} 조회수</span>
                      <span>•</span>
                      <span>{selectedVideo.timestamp}</span>
                      {duration > 0 && (
                        <>
                          <span>•</span>
                          <span>{formatTime(duration)}</span>
                        </>
                      )}
                    </div>
                    <div className="flex items-center space-x-4">
                      <button
                        onClick={() => handleLike(selectedVideo.id)}
                        className="flex items-center space-x-2 text-gray-400 hover:text-red-500"
                      >
                        <svg
                          className="w-5 h-5"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"
                          />
                        </svg>
                        <span>{selectedVideo.likes}</span>
                      </button>
                      <button className="flex items-center space-x-2 text-gray-400 hover:text-blue-500">
                        <svg
                          className="w-5 h-5"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"
                          />
                        </svg>
                        <span>{selectedVideo.comments}</span>
                      </button>
                    </div>
                  </div>
                  <div className="bg-gray-800 rounded-lg p-4">
                    <div className="flex items-center space-x-3 mb-3">
                      <div className="w-10 h-10 bg-gray-600 rounded-full flex items-center justify-center">
                        <span className="text-sm font-medium">
                          {selectedVideo.user[0]}
                        </span>
                      </div>
                      <div>
                        <p className="font-medium">{selectedVideo.user}</p>
                        <p className="text-sm text-gray-400">
                          {selectedVideo.timestamp}
                        </p>
                      </div>
                    </div>
                    <p className="text-gray-300">{selectedVideo.description}</p>
                  </div>
                </div>

                {/* 댓글 섹션 */}
                <div>
                  <h3 className="text-lg font-semibold mb-4">댓글</h3>
                  <div className="flex space-x-3 mb-6">
                    <div className="w-8 h-8 bg-gray-600 rounded-full flex items-center justify-center">
                      <span className="text-sm font-medium">나</span>
                    </div>
                    <div className="flex-1">
                      <input
                        type="text"
                        value={comment}
                        onChange={(e) => setComment(e.target.value)}
                        placeholder="댓글을 입력하세요..."
                        className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-2 text-white placeholder-gray-400 focus:outline-none focus:border-blue-500"
                      />
                    </div>
                    <button
                      onClick={() => handleComment(selectedVideo.id)}
                      className="bg-blue-600 hover:bg-blue-700 px-4 py-2 rounded-lg font-medium"
                    >
                      댓글
                    </button>
                  </div>

                  {/* 댓글 목록 */}
                  <div className="space-y-4">
                    <div className="flex space-x-3">
                      <div className="w-8 h-8 bg-gray-600 rounded-full flex items-center justify-center">
                        <span className="text-sm font-medium">김</span>
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center space-x-2 mb-1">
                          <span className="font-medium">김철수</span>
                          <span className="text-sm text-gray-400">
                            1시간 전
                          </span>
                        </div>
                        <p className="text-gray-300">
                          정말 잘 부르셨네요! 목소리가 좋으세요~
                        </p>
                      </div>
                    </div>
                    <div className="flex space-x-3">
                      <div className="w-8 h-8 bg-gray-600 rounded-full flex items-center justify-center">
                        <span className="text-sm font-medium">이</span>
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center space-x-2 mb-1">
                          <span className="font-medium">김수희</span>
                          <span className="text-sm text-gray-400">30분 전</span>
                        </div>
                        <p className="text-gray-300">노래 너무 감동적이에요</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              <div className="text-center py-20">
                <svg
                  className="w-16 h-16 text-gray-400 mx-auto mb-4"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z"
                  />
                </svg>
                <p className="text-gray-400">영상을 선택해주세요</p>
                <p className="text-sm text-gray-500 mt-2">
                  사이드바에서 영상을 클릭하거나 새 영상을 업로드해보세요!
                </p>
              </div>
            )}
          </div>

          {/* 사이드바 - 비디오 목록 */}
          <div className="lg:col-span-1">
            <h3 className="text-lg font-semibold mb-4">추천 영상</h3>
            <div className="space-y-4">
              {videos.map((video) => (
                <div
                  key={video.id}
                  onClick={() => handleVideoSelect(video)}
                  className="cursor-pointer hover:bg-gray-800 rounded-lg p-3 transition-colors"
                >
                  <div className="flex space-x-3">
                    <div className="flex-shrink-0">
                      {video.videoUrl ? (
                        <img
                          src={video.thumbnail}
                          alt={video.title}
                          className="w-32 h-20 object-cover rounded-lg"
                        />
                      ) : (
                        <div className="w-32 h-20 bg-gray-700 rounded-lg flex items-center justify-center">
                          <svg
                            className="w-8 h-8 text-gray-400"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z"
                            />
                          </svg>
                        </div>
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <h4 className="font-medium text-sm line-clamp-2 mb-1">
                        {video.title}
                      </h4>
                      <p className="text-xs text-gray-400 mb-1">{video.user}</p>
                      <div className="flex items-center space-x-2 text-xs text-gray-400">
                        <span>{video.views} 조회수</span>
                        <span>•</span>
                        <span>{video.timestamp}</span>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* 업로드 모달 */}
      {showUploadModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-gray-800 rounded-lg p-6 w-full max-w-md mx-4">
            <h2 className="text-xl font-bold mb-4">영상 업로드</h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-2">제목</label>
                <input
                  type="text"
                  value={uploadForm.title}
                  onChange={(e) =>
                    setUploadForm({ ...uploadForm, title: e.target.value })
                  }
                  className="w-full bg-gray-700 border border-gray-600 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-blue-500"
                  placeholder="영상 제목을 입력하세요"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">설명</label>
                <textarea
                  value={uploadForm.description}
                  onChange={(e) =>
                    setUploadForm({
                      ...uploadForm,
                      description: e.target.value,
                    })
                  }
                  className="w-full bg-gray-700 border border-gray-600 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-blue-500"
                  rows="3"
                  placeholder="영상 설명을 입력하세요"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">
                  영상 파일
                </label>
                <input
                  type="file"
                  accept="video/*"
                  onChange={(e) => {
                    const file = e.target.files[0];
                    if (file && file.size > 100 * 1024 * 1024) {
                      // 100MB 제한
                      alert("파일 크기는 100MB 이하여야 합니다.");
                      e.target.value = "";
                      return;
                    }
                    setUploadForm({ ...uploadForm, videoFile: file });
                  }}
                  className="w-full bg-gray-700 border border-gray-600 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-blue-500"
                />
                {uploadForm.videoFile && (
                  <div className="mt-2 space-y-1">
                    <p className="text-sm text-green-400">
                      ✅ {uploadForm.videoFile.name} 선택됨
                    </p>
                    <p className="text-xs text-gray-400">
                      크기:{" "}
                      {(uploadForm.videoFile.size / (1024 * 1024)).toFixed(2)}MB
                    </p>
                  </div>
                )}
                <p className="text-xs text-gray-400 mt-1">
                  지원 형식: MP4, WebM, OGG (최대 100MB)
                </p>
              </div>
            </div>
            <div className="flex space-x-3 mt-6">
              <button
                onClick={() => setShowUploadModal(false)}
                className="flex-1 bg-gray-600 hover:bg-gray-700 px-4 py-2 rounded-lg font-medium"
              >
                취소
              </button>
              <button
                onClick={handleUpload}
                className="flex-1 bg-red-600 hover:bg-red-700 px-4 py-2 rounded-lg font-medium"
              >
                업로드
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Karaoke;
