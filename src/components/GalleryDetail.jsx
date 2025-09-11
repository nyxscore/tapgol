import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { auth, db } from "../util/firebase";
import { onAuthStateChanged } from "firebase/auth";
import { getGalleryItem, incrementViews, deleteGalleryItem, toggleLike, updateGalleryItem } from "../util/galleryService";
import { formatTextWithLinks } from "../util/textUtils.jsx";
import CommentSection from "./CommentSection";
import UserProfileModal from "./UserProfileModal";
import { navigateToDM } from '../util/dmUtils';
import ReportModal from "./ReportModal";
import { FaFlag } from 'react-icons/fa';
import { formatAdminName, isAdmin, getEnhancedAdminStyles, isCurrentUserAdmin } from '../util/adminUtils';

const GalleryDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [item, setItem] = useState(null);
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [deleting, setDeleting] = useState(false);
  const [liking, setLiking] = useState(false);
  const [editing, setEditing] = useState(false);
  const [editTitle, setEditTitle] = useState("");
  const [editDescription, setEditDescription] = useState("");
  const [saving, setSaving] = useState(false);
  
  // 프로필 모달 관련 상태
  const [showProfileModal, setShowProfileModal] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);

  // 신고 관련 상태
  const [showReportModal, setShowReportModal] = useState(false);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
    });

    return () => {
      unsubscribe();
    };
  }, []);

  // 갤러리 항목 로드 (id가 변경될 때만)
  useEffect(() => {
    const loadItem = async () => {
      if (!id) {
        setLoading(false);
        return;
      }
      
      try {
        setLoading(true);
        console.log(`갤러리 항목 로드 시도: ${id}`);
        
        // Firebase 연결 상태 확인
        if (!db) {
          console.error("Firebase DB 연결 실패: db 객체가 undefined입니다.");
          throw new Error("Firebase 데이터베이스에 연결할 수 없습니다.");
        }
        
        console.log("Firebase DB 연결 상태:", !!db);
        console.log("Firebase Auth 연결 상태:", !!auth);
        
        const itemData = await getGalleryItem(id);
        console.log("갤러리 항목 로드 성공:", itemData);
        setItem(itemData);
      } catch (error) {
        console.error("갤러리 항목 로드 오류:", error);
        console.error("에러 코드:", error.code);
        console.error("에러 메시지:", error.message);
        console.error("에러 스택:", error.stack);
        setItem(null);
        
        // 에러 타입에 따른 사용자 메시지
        let errorMessage = "갤러리 항목을 불러오는데 실패했습니다.";
        
        if (error.message === "추억앨범 항목을 찾을 수 없습니다.") {
          errorMessage = "요청하신 갤러리 항목을 찾을 수 없습니다. 삭제되었거나 잘못된 링크일 수 있습니다.";
        } else if (error.message.includes("Firebase")) {
          errorMessage = "데이터베이스 연결에 문제가 있습니다. 잠시 후 다시 시도해주세요.";
        } else if (error.code === "permission-denied") {
          errorMessage = "접근 권한이 없습니다.";
        } else if (error.code === "unavailable") {
          errorMessage = "서비스가 일시적으로 사용할 수 없습니다. 잠시 후 다시 시도해주세요.";
        } else if (error.code === "not-found") {
          errorMessage = "데이터베이스를 찾을 수 없습니다.";
        }
        
        alert(errorMessage);
        
        // 2초 후 갤러리로 이동
        setTimeout(() => {
          navigate("/gallery");
        }, 2000);
      } finally {
        setLoading(false);
      }
    };

    loadItem();
  }, [id, navigate]);

  // 조회수 증가 및 알림 처리 (user가 로그인한 후)
  useEffect(() => {
    const handleUserActions = async () => {
      if (!user || !item) return;
      
      try {
        // 조회수 증가
        await incrementViews(id);
        
      } catch (error) {
        console.error("사용자 액션 처리 오류:", error);
        // 조회수 증가 실패는 갤러리 보기에 영향을 주지 않도록 함
      }
    };

    handleUserActions();
  }, [user, item, id]);

  const formatDate = (timestamp) => {
    if (!timestamp) return "";
    
    const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
    return date.toLocaleDateString('ko-KR', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit'
    });
  };



  const handleDelete = async () => {
    if (!user || (user.uid !== item.uploaderId && !isCurrentUserAdmin(user))) {
      alert("삭제 권한이 없습니다.");
      return;
    }

    if (!window.confirm("정말로 이 파일을 삭제하시겠습니까?")) {
      return;
    }

    setDeleting(true);
    try {
      await deleteGalleryItem(id, item.fileName);
      alert("파일이 삭제되었습니다.");
      navigate("/gallery");
    } catch (error) {
      console.error("파일 삭제 오류:", error);
      alert("파일 삭제에 실패했습니다.");
    } finally {
      setDeleting(false);
    }
  };

  const startEdit = () => {
    setEditTitle(item.title || "");
    setEditDescription(item.description || "");
    setEditing(true);
  };

  const cancelEdit = () => {
    setEditing(false);
    setEditTitle("");
    setEditDescription("");
  };

  const handleSave = async () => {
    if (!editTitle.trim()) {
      alert("제목을 입력해주세요.");
      return;
    }

    setSaving(true);
    try {
      // 갤러리 서비스에서 수정 함수 호출
      await updateGalleryItem(id, {
        title: editTitle.trim(),
        description: editDescription.trim(),
        updatedAt: new Date()
      });

      // 로컬 상태 업데이트
      setItem(prev => ({
        ...prev,
        title: editTitle.trim(),
        description: editDescription.trim(),
        updatedAt: new Date()
      }));

      setEditing(false);
      alert("수정이 완료되었습니다.");
    } catch (error) {
      console.error("수정 오류:", error);
      alert("수정에 실패했습니다.");
    } finally {
      setSaving(false);
    }
  };

  // 프로필 관련 함수들
  const handleShowProfile = (userId, userName) => {
    setSelectedUser({ id: userId, name: userName });
    setShowProfileModal(true);
  };

  const handleCloseProfileModal = () => {
    setShowProfileModal(false);
    setSelectedUser(null);
  };

  // 신고 관련 함수들
  const handleReport = () => {
    if (!user) {
      alert("신고하려면 로그인이 필요합니다.");
      navigate("/login");
      return;
    }
    
    // 디버깅: 갤러리 아이템 데이터 확인
    console.log("갤러리 신고 - 아이템 데이터:", item);
    console.log("갤러리 신고 - uploaderId:", item?.uploaderId);
    console.log("갤러리 신고 - uploader:", item?.uploader);
    
    setShowReportModal(true);
  };

  const handleReportSuccess = (reportId) => {
    alert("신고가 성공적으로 접수되었습니다.");
  };

  const handleLike = async () => {
    if (!user) {
      alert("좋아요를 누르려면 로그인이 필요합니다.");
      navigate("/login");
      return;
    }

    if (liking) return; // 중복 클릭 방지

    setLiking(true);
    try {
      const isLiked = await toggleLike(id, user.uid);
      
      // 로컬 상태 업데이트
      setItem(prev => ({
        ...prev,
        likes: isLiked ? (prev.likes || 0) + 1 : (prev.likes || 0) - 1,
        likedBy: isLiked 
          ? [...(prev.likedBy || []), user.uid]
          : (prev.likedBy || []).filter(uid => uid !== user.uid)
      }));

      // 성공 메시지
      if (isLiked) {
        console.log("좋아요를 눌렀습니다!");
      } else {
        console.log("좋아요를 취소했습니다!");
      }
    } catch (error) {
      console.error("좋아요 처리 오류:", error);
      alert("좋아요 처리에 실패했습니다.");
    } finally {
      setLiking(false);
    }
  };

  const isLiked = user && item?.likedBy?.includes(user.uid);
  const isAuthor = user && user.uid === item?.uploaderId;
  const canEditDelete = isAuthor || isCurrentUserAdmin(user);

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-amber-50 via-orange-50 to-amber-100 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-amber-700 mx-auto mb-4"></div>
          <p className="text-amber-700">갤러리 항목을 불러오는 중...</p>
        </div>
      </div>
    );
  }

  if (!item && !loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-amber-50 via-orange-50 to-amber-100 flex items-center justify-center">
        <div className="text-center">
          <div className="text-gray-400 text-6xl mb-4">📄</div>
                        <p className="text-gray-600 text-lg mb-2">추억앨범 항목을 찾을 수 없습니다</p>
          <p className="text-gray-500 text-sm mb-4">삭제되었거나 잘못된 링크일 수 있습니다.</p>
                      <button
              onClick={() => navigate("/gallery")}
              className="bg-amber-600 text-white px-4 py-2 rounded-lg hover:bg-amber-700 transition-colors"
              title="추억앨범으로 돌아가기"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
            </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-amber-50 via-orange-50 to-amber-100 pb-20">
      <div className="max-w-4xl mx-auto p-6">
        {/* 헤더 */}
        <div className={`rounded-2xl shadow-xl p-6 mb-6 ${
          isAdmin(item?.authorEmail) 
            ? 'bg-gradient-to-br from-purple-50 via-pink-50 to-purple-100 border-l-4 border-purple-500' 
            : 'bg-white'
        }`}>
          <div className="flex items-center justify-between">
            <button
              onClick={() => navigate("/gallery")}
              className="flex items-center justify-center w-12 h-12 bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white rounded-full shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-110"
              title="추억앨범으로 돌아가기"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M10.5 19.5L3 12m0 0l7.5-7.5M3 12h18" />
              </svg>
            </button>
            <h1 className="text-2xl font-bold text-gray-800">추억앨범</h1>
            <div className="w-24"></div>
          </div>
        </div>

        {/* 갤러리 항목 내용 */}
        <div className={`rounded-2xl shadow-xl p-6 mb-6 ${
          isAdmin(item?.authorEmail) 
            ? getEnhancedAdminStyles().container
            : 'bg-white'
        }`}>
          {isAdmin(item?.authorEmail) && (
            <>
              <div className={getEnhancedAdminStyles().glowEffect}></div>
              <svg className={getEnhancedAdminStyles().adminIcon} fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M2.166 4.999A11.954 11.954 0 0010 1.944 11.954 11.954 0 0017.834 5c.11.65.166 1.32.166 2.001 0 5.225-3.34 9.67-8 11.317C5.34 16.67 2 12.225 2 7c0-.682.057-1.35.166-2.001zm11.541 3.708a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
              </svg>
            </>
          )}
          {/* 항목 헤더 */}
          <div className="border-b border-gray-200 pb-6 mb-6">
            <div className="flex items-center justify-between mb-4">
              {editing ? (
                <div className="flex-1 mr-4">
                  <input
                    type="text"
                    value={editTitle}
                    onChange={(e) => setEditTitle(e.target.value)}
                    className="w-full text-2xl font-bold text-gray-800 border-b-2 border-blue-500 focus:outline-none focus:border-blue-600"
                    placeholder="제목을 입력하세요"
                  />
                </div>
              ) : (
                <h2 className="text-2xl font-bold text-gray-800">{item.title}</h2>
              )}
              {canEditDelete && (
                <div className="flex space-x-2">
                  {editing ? (
                    <>
                      <button
                        onClick={handleSave}
                        disabled={saving}
                        className={`px-3 py-1 rounded-lg transition-colors text-sm ${
                          saving
                            ? "bg-gray-400 text-white cursor-not-allowed"
                            : "bg-green-500 text-white hover:bg-green-600"
                        }`}
                      >
                        {saving ? "저장 중..." : "저장"}
                      </button>
                      <button
                        onClick={cancelEdit}
                        className="px-3 py-1 rounded-lg transition-colors text-sm bg-gray-500 text-white hover:bg-gray-600"
                      >
                        취소
                      </button>
                    </>
                  ) : (
                    <button
                      onClick={startEdit}
                      className="px-3 py-1 rounded-lg transition-colors text-sm bg-blue-500 text-white hover:bg-blue-600"
                    >
                      수정
                    </button>
                  )}
                  <button
                    onClick={handleDelete}
                    disabled={deleting}
                    className={`px-3 py-1 rounded-lg transition-colors text-sm ${
                      deleting
                        ? "bg-gray-400 text-white cursor-not-allowed"
                        : "bg-red-500 text-white hover:bg-red-600"
                    }`}
                  >
                    {deleting ? "삭제 중..." : "삭제"}
                  </button>
                </div>
              )}
            </div>
            
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-sm">
              <div className="flex flex-col">
                <span className="text-gray-500 text-xs mb-1">업로더</span>
                <span 
                  className="cursor-pointer transition-colors"
                  onClick={() => navigateToDM(item.uploaderId, user, navigate)}
                  title="프로필 보기"
                >
                  {(() => {
                    const adminInfo = formatAdminName(item.uploader, item.uploaderEmail);
                    if (adminInfo.isAdmin) {
                      return (
                        <span className="inline-flex items-center space-x-1">
                          <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-gradient-to-r from-purple-500 to-pink-500 text-white shadow-lg">
                            <svg className="w-3 h-3 mr-1" fill="currentColor" viewBox="0 0 20 20">
                              <path fillRule="evenodd" d="M2.166 4.999A11.954 11.954 0 0010 1.944 11.954 11.954 0 0017.834 5c.11.65.166 1.32.166 2.001 0 5.225-3.34 9.67-8 11.317C5.34 16.67 2 12.225 2 7c0-.682.057-1.35.166-2.001zm11.541 3.708a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                            </svg>
                            {adminInfo.badgeText}
                          </span>
                          <span className="font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
                            {adminInfo.name}
                          </span>
                        </span>
                      );
                    }
                    return adminInfo.name;
                  })()}
                </span>
              </div>
              <div className="flex flex-col">
                <span className="text-gray-500 text-xs mb-1">업로드일</span>
                <span className="text-gray-600">{formatDate(item.createdAt)}</span>
              </div>
              {item.updatedAt && item.updatedAt !== item.createdAt && (
                <div className="flex flex-col">
                  <span className="text-gray-500 text-xs mb-1">수정일</span>
                  <span className="text-gray-600">{formatDate(item.updatedAt)}</span>
                </div>
              )}
              <div className="flex flex-col">
                <span className="text-gray-500 text-xs mb-1">조회수</span>
                <div className="flex items-center space-x-1">
                  <svg className="w-4 h-4 text-gray-400" fill="currentColor" viewBox="0 0 20 20">
                    <path d="M10 12a2 2 0 100-4 2 2 0 000 4z" />
                    <path fillRule="evenodd" d="M.458 10C1.732 5.943 5.522 3 10 3s8.268 2.943 9.542 7c-1.274 4.057-5.064 7-9.542 7S1.732 14.057.458 10zM14 10a4 4 0 11-8 0 4 4 0 018 0z" clipRule="evenodd" />
                  </svg>
                  <span className="text-gray-600">{item.views || 0}</span>
                </div>
              </div>
            </div>
          </div>

          {/* 파일 표시 */}
          <div className="mb-8">
            <div className="text-center">
              <img
                src={item.fileUrl}
                alt={item.title}
                className="max-w-full h-auto rounded-lg shadow-lg mx-auto"
                style={{ maxHeight: '70vh' }}
                loading="lazy"
              />
            </div>
          </div>

          {/* 설명 */}
          <div className="mb-8">
            <h3 className="text-lg font-semibold text-gray-800 mb-3">설명</h3>
            {editing ? (
              <div className="bg-gray-50 rounded-lg p-4">
                <textarea
                  value={editDescription}
                  onChange={(e) => setEditDescription(e.target.value)}
                  rows="4"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                  placeholder="설명을 입력하세요"
                />
              </div>
            ) : (
              item.description && (
                <div className="bg-gray-50 rounded-lg p-4">
                  <div className="text-gray-700 whitespace-pre-wrap">
                    {formatTextWithLinks(item.description)}
                  </div>
                </div>
              )
            )}
          </div>



          {/* 좋아요 버튼 */}
          <div className="border-t border-gray-200 pt-6">
            <div className="flex items-center justify-center space-x-4">
              <button
                onClick={handleLike}
                disabled={liking}
                className={`flex items-center space-x-2 px-6 py-3 rounded-lg transition-all min-w-[120px] justify-center ${
                  isLiked
                    ? "bg-red-500 text-white hover:bg-red-600"
                    : "bg-amber-100 text-amber-800 hover:bg-amber-200"
                } ${liking ? "opacity-50 cursor-not-allowed" : ""}`}
              >
                <svg 
                  className={`w-5 h-5 ${isLiked ? "fill-current" : "fill-none"}`} 
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
                <span>
                  {liking ? "처리 중..." : isLiked ? "취소" : "좋아요"}
                </span>
              </button>
              
              {/* 신고 버튼 - 작성자가 아닌 경우에만 표시 */}
              {user && user.uid !== item.uploaderId && (
                <button
                  onClick={handleReport}
                  className="flex items-center space-x-2 px-4 py-3 rounded-lg transition-colors bg-purple-100 text-purple-700 hover:bg-purple-200 hover:text-purple-800"
                  title="게시글 신고"
                >
                  <FaFlag className="w-4 h-4" />
                  <span>신고</span>
                </button>
              )}
            </div>
            {!user && (
              <div className="text-center mt-2">
                <p className="text-sm text-gray-500">
                  좋아요를 누르려면 <button 
                    onClick={() => navigate("/login")}
                    className="text-amber-600 hover:text-amber-700 underline"
                  >
                    로그인
                  </button>이 필요합니다.
                </p>
              </div>
            )}
          </div>
        </div>

        {/* 댓글 섹션 */}
        <div className="bg-white rounded-2xl shadow-xl p-6">
          <CommentSection postId={id} boardType="gallery" />
        </div>
      </div>

      {/* 사용자 프로필 모달 */}
      <UserProfileModal
        isOpen={showProfileModal}
        onClose={handleCloseProfileModal}
        userId={selectedUser?.id}
        userName={selectedUser?.name}
      />

      {/* 신고 모달 */}
      <ReportModal
        isOpen={showReportModal}
        onClose={() => setShowReportModal(false)}
        targetData={item}
        targetType="post"
        onSuccess={handleReportSuccess}
      />
    </div>
  );
};

export default GalleryDetail;
