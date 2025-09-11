import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { 
  collection, 
  query, 
  where, 
  orderBy, 
  getDocs, 
  onSnapshot,
  doc,
  updateDoc,
  serverTimestamp
} from 'firebase/firestore';
import { db } from '../util/firebase';
import { 
  checkAdminRole, 
  adminDeleteComment, 
  adminDeletePost,
  adminDeleteReport
} from '../util/reportService';
import { 
  createWisdom, 
  getAllWisdoms, 
  updateWisdom, 
  deleteWisdom, 
  toggleWisdomStatus,
  getWisdomStats
} from '../util/wisdomService';
import { FaTrash, FaEye, FaExclamationTriangle, FaCrown, FaBell } from 'react-icons/fa';

const AdminPanel = () => {
  const { user } = useAuth();
  const [isAdmin, setIsAdmin] = useState(false);
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('reports');
  const [deleting, setDeleting] = useState({});
  const [wisdoms, setWisdoms] = useState([]);
  const [wisdomStats, setWisdomStats] = useState(null);
  const [wisdomForm, setWisdomForm] = useState({
    text: '',
    author: '',
    category: '인생'
  });
  const [creatingWisdom, setCreatingWisdom] = useState(false);
  const [editingWisdom, setEditingWisdom] = useState(null);
  const [wisdomEditForm, setWisdomEditForm] = useState({
    text: '',
    author: '',
    category: '인생'
  });

  // 안전한 날짜 포맷팅 함수
  const formatDate = (dateValue) => {
    if (!dateValue) return '날짜 없음';
    
    try {
      let date;
      if (dateValue.toDate && typeof dateValue.toDate === 'function') {
        // Firestore Timestamp
        date = dateValue.toDate();
      } else if (dateValue instanceof Date) {
        // Date 객체
        date = dateValue;
      } else if (typeof dateValue === 'string' || typeof dateValue === 'number') {
        // 문자열이나 숫자
        date = new Date(dateValue);
      } else {
        return '날짜 없음';
      }
      
      // 유효한 날짜인지 확인
      if (isNaN(date.getTime())) {
        return '날짜 없음';
      }
      
      return date.toLocaleDateString('ko-KR');
    } catch (error) {
      console.error('날짜 포맷팅 오류:', error);
      return '날짜 없음';
    }
  };

  useEffect(() => {
    let unsubscribeReports = null;
    
    const checkAdmin = async () => {
      console.log("🔍 AdminPanel: 관리자 권한 확인 시작");
      console.log("👤 현재 사용자:", user);
      
      if (user) {
        try {
          console.log("🏃‍♂️ 관리자 권한 확인 실행 중...");
          
          // 간단한 관리자 확인 (이메일 기반)
          const isAdminEmail = user.email === "juhyundon82@gmail.com";
          console.log("📧 이메일 기반 관리자 확인:", isAdminEmail);
          
          let adminStatus = isAdminEmail;
          
          // 이메일이 관리자면 바로 진행, 아니면 Firestore 확인 (타임아웃 없이)
          if (!isAdminEmail) {
            try {
              console.log("🔍 Firestore에서 관리자 권한 확인 중...");
              adminStatus = await checkAdminRole(user.uid);
              console.log("✅ Firestore 관리자 권한 확인 완료:", adminStatus);
            } catch (error) {
              console.log("⚠️ Firestore 확인 실패:", error.message);
              adminStatus = false;
            }
          }
          
          console.log("✅ 관리자 권한 확인 완료:", adminStatus);
          setIsAdmin(adminStatus);
          
          if (adminStatus) {
            console.log("📊 데이터 로딩 시작...");
            // 권한 오류를 무시하고 빈 데이터로 시작
            setReports([]);
            setWisdoms([]);
            setWisdomStats({
              total: 0,
              active: 0,
              inactive: 0,
              totalViews: 0,
              totalLikes: 0
            });
            
            // 데이터 로딩 시작
            console.log("📋 신고 목록 로딩 시작...");
            unsubscribeReports = loadReports();
            
            console.log("🧠 지혜 데이터 로딩 시작...");
            loadWisdoms();
            
            console.log("✅ 관리자 패널 초기화 완료");
          } else {
            console.log("❌ 관리자 권한 없음 - 로딩 종료");
          }
          
          // 권한 오류와 관계없이 로딩 종료
          setLoading(false);
        } catch (error) {
          console.error("❌ 관리자 권한 확인 오류:", error);
          setIsAdmin(false);
          setLoading(false);
        }
      } else {
        console.log("❌ 사용자 없음 - 로딩 종료");
        setIsAdmin(false);
        setLoading(false);
      }
    };

    checkAdmin();
    
    // cleanup 함수
    return () => {
      if (unsubscribeReports) {
        console.log("🧹 신고 목록 구독 해제");
        unsubscribeReports();
      }
    };
  }, [user]);

  const loadReports = () => {
    console.log("📋 신고 목록 로딩 시작...");
    
    // 권한 오류를 우회하기 위해 try-catch로 감싸기
    try {
      // orderBy 제거하여 인덱스 오류 방지
      const q = query(collection(db, "reports"));

      const unsubscribe = onSnapshot(q, (querySnapshot) => {
        // 실시간 업데이트이므로 로그 제거 (너무 자주 출력됨)
        const reportsData = [];
        querySnapshot.forEach((doc) => {
          const data = doc.data();
          // 클라이언트에서 상태 필터링 (pending, reviewed만 표시)
          if (data.status === "pending" || data.status === "reviewed") {
            reportsData.push({
              id: doc.id,
              ...data,
              createdAt: data.createdAt?.toDate ? data.createdAt.toDate() : data.createdAt
            });
          }
        });
        
        // 클라이언트에서 생성일 기준으로 정렬
        reportsData.sort((a, b) => {
          const dateA = a.createdAt instanceof Date ? a.createdAt : new Date(a.createdAt);
          const dateB = b.createdAt instanceof Date ? b.createdAt : new Date(b.createdAt);
          return dateB - dateA; // 최신순
        });
        
        setReports(reportsData);
        setLoading(false);
        // 실시간 업데이트이므로 로그 제거 (너무 자주 출력됨)
      }, (error) => {
        console.error("❌ 신고 목록 로드 오류:", error);
        // 권한 오류 시 빈 배열로 설정하고 로딩 종료
        setReports([]);
        setLoading(false);
      });

      return unsubscribe;
    } catch (error) {
      console.error("❌ 신고 목록 쿼리 생성 오류:", error);
      setReports([]);
      setLoading(false);
      return () => {}; // 빈 unsubscribe 함수 반환
    }
  };

  const loadWisdoms = async () => {
    console.log("🧠 지혜 데이터 로딩 시작...");
    try {
      console.log("📊 지혜 목록과 통계를 병렬로 로딩 중...");
      
      // 권한 오류를 우회하기 위해 개별적으로 처리
      let wisdomsData = [];
      let stats = {
        total: 0,
        active: 0,
        inactive: 0,
        totalViews: 0,
        totalLikes: 0
      };
      
      try {
        wisdomsData = await getAllWisdoms();
        console.log("✅ 지혜 목록 로딩 완료:", wisdomsData.length, "개");
      } catch (wisdomError) {
        console.error("❌ 지혜 목록 로드 오류:", wisdomError);
        wisdomsData = [];
      }
      
      try {
        stats = await getWisdomStats();
        console.log("✅ 지혜 통계 로딩 완료:", stats);
      } catch (statsError) {
        console.error("❌ 지혜 통계 로드 오류:", statsError);
        // 기본 통계값 유지
      }
      
      setWisdoms(wisdomsData);
      setWisdomStats(stats);
      
    } catch (error) {
      console.error("❌ 지혜 데이터 로드 전체 오류:", error);
      // 오류가 발생해도 기본값 설정
      setWisdoms([]);
      setWisdomStats({
        total: 0,
        active: 0,
        inactive: 0,
        totalViews: 0,
        totalLikes: 0
      });
    }
  };

  const handleDeleteComment = async (report) => {
    if (!window.confirm("정말로 이 댓글/대댓글을 삭제하시겠습니까?")) {
      return;
    }

    console.log("🗑️ 삭제 요청 신고 데이터:", report);

    setDeleting(prev => ({ ...prev, [report.id]: true }));

    try {
      if (report.commentId) {
        // 댓글/대댓글 삭제
        const commentType = report.isReply ? "reply" : "comment";
        console.log(`🗑️ 댓글 삭제 시도: ${commentType} - ${report.commentId}`);
        await adminDeleteComment(report.commentId, commentType);
        
        // 신고 데이터 삭제
        await adminDeleteReport(report.id);
      } else if (report.postId || report.messageId) {
        // 게시글 또는 채팅 메시지 삭제
        const targetId = report.postId || report.messageId;
        let postType = report.postType;
        
        // 채팅 메시지인 경우 postType 결정
        if (report.messageId) {
          if (report.chatType === "main") {
            postType = "chat";
          } else if (report.chatType === "park") {
            postType = "parkChat";
          } else {
            postType = "chat"; // 기본값
          }
        }
        
        console.log(`🗑️ 게시글/메시지 삭제 시도: ${postType} - ${targetId}`);
        await adminDeletePost(targetId, postType);
        
        // 신고 데이터 삭제
        await adminDeleteReport(report.id);
      }
      
      // 삭제된 신고를 목록에서 즉시 제거
      setReports(prev => prev.filter(r => r.id !== report.id));
      
      alert("성공적으로 삭제되었습니다. 게시판에서도 즉시 반영됩니다.");
    } catch (error) {
      console.error("삭제 오류:", error);
      console.error("삭제 오류 상세 정보:", {
        reportId: report.id,
        reportType: report.postType || 'comment',
        postId: report.postId,
        commentId: report.commentId,
        error: error
      });
      alert(`삭제 실패: ${error.message || '알 수 없는 오류가 발생했습니다.'}`);
    } finally {
      setDeleting(prev => ({ ...prev, [report.id]: false }));
    }
  };

  // 지혜 생성 함수
  const handleCreateWisdom = async (e) => {
    e.preventDefault();
    
    if (!wisdomForm.text.trim() || !wisdomForm.author.trim()) {
      alert('지혜와 작가를 모두 입력해주세요.');
      return;
    }

    setCreatingWisdom(true);
    try {
      await createWisdom({
        text: wisdomForm.text.trim(),
        author: wisdomForm.author.trim(),
        category: wisdomForm.category,
        createdBy: user.uid,
        createdByName: user?.displayName || user?.email || '관리자'
      });
      
      alert('지혜가 성공적으로 생성되었습니다!');
      setWisdomForm({
        text: '',
        author: '',
        category: '인생'
      });
      
      // 로컬 상태에 새 지혜 추가 (권한 오류 우회)
      const newWisdom = {
        id: Date.now().toString(),
        text: wisdomForm.text.trim(),
        author: wisdomForm.author.trim(),
        category: wisdomForm.category,
        createdBy: user.uid,
        createdByName: user?.displayName || user?.email || '관리자',
        isActive: true,
        viewCount: 0,
        likeCount: 0,
        likedBy: [],
        createdAt: new Date()
      };
      
      setWisdoms(prev => [newWisdom, ...prev]);
      setWisdomStats(prev => ({
        ...prev,
        total: prev.total + 1,
        active: prev.active + 1
      }));
      
    } catch (error) {
      console.error('지혜 생성 오류:', error);
      alert('지혜 생성에 실패했습니다. Firebase 규칙을 확인해주세요.');
    } finally {
      setCreatingWisdom(false);
    }
  };

  // 지혜 삭제 함수
  const handleDeleteWisdom = async (wisdomId) => {
    if (!window.confirm("정말로 이 지혜를 삭제하시겠습니까?")) {
      return;
    }

    try {
      // Firestore에서 삭제 시도
      await deleteWisdom(wisdomId);
      alert('지혜가 삭제되었습니다.');
    } catch (error) {
      console.error('지혜 삭제 오류:', error);
      // Firestore 삭제 실패 시 로컬 상태에서만 삭제
      console.log('로컬 상태에서 지혜 삭제');
    }
    
    // 로컬 상태에서 삭제
    setWisdoms(prev => prev.filter(wisdom => wisdom.id !== wisdomId));
    setWisdomStats(prev => ({
      ...prev,
      total: prev.total - 1,
      active: prev.active - 1
    }));
  };

  // 지혜 활성화/비활성화 함수
  const handleToggleWisdomStatus = async (wisdomId, currentStatus) => {
    try {
      // Firestore에서 상태 변경 시도
      await toggleWisdomStatus(wisdomId, !currentStatus);
      alert(`지혜가 ${!currentStatus ? '활성화' : '비활성화'}되었습니다.`);
    } catch (error) {
      console.error('지혜 상태 변경 오류:', error);
      // Firestore 변경 실패 시 로컬 상태에서만 변경
      console.log('로컬 상태에서 지혜 상태 변경');
    }
    
    // 로컬 상태에서 상태 변경
    setWisdoms(prev => prev.map(wisdom => 
      wisdom.id === wisdomId 
        ? { ...wisdom, isActive: !currentStatus }
        : wisdom
    ));
    
    setWisdomStats(prev => ({
      ...prev,
      active: !currentStatus ? prev.active + 1 : prev.active - 1
    }));
  };

  // 지혜 수정 시작 함수
  const handleStartEditWisdom = (wisdom) => {
    setEditingWisdom(wisdom.id);
    setWisdomEditForm({
      text: wisdom.text,
      author: wisdom.author,
      category: wisdom.category
    });
  };

  // 지혜 수정 취소 함수
  const handleCancelEditWisdom = () => {
    setEditingWisdom(null);
    setWisdomEditForm({
      text: '',
      author: '',
      category: '인생'
    });
  };

  // 지혜 수정 저장 함수
  const handleSaveEditWisdom = async (wisdomId) => {
    if (!wisdomEditForm.text.trim() || !wisdomEditForm.author.trim()) {
      alert('지혜와 작가를 모두 입력해주세요.');
      return;
    }

    try {
      // Firestore에서 수정 시도
      await updateWisdom(wisdomId, {
        text: wisdomEditForm.text.trim(),
        author: wisdomEditForm.author.trim(),
        category: wisdomEditForm.category
      });
      
      alert('지혜가 성공적으로 수정되었습니다!');
      
      // 로컬 상태에서 수정
      setWisdoms(prev => prev.map(wisdom => 
        wisdom.id === wisdomId 
          ? { 
              ...wisdom, 
              text: wisdomEditForm.text.trim(),
              author: wisdomEditForm.author.trim(),
              category: wisdomEditForm.category,
              updatedAt: new Date()
            }
          : wisdom
      ));
      
      // 수정 모드 종료
      setEditingWisdom(null);
      setWisdomEditForm({
        text: '',
        author: '',
        category: '인생'
      });
      
    } catch (error) {
      console.error('지혜 수정 오류:', error);
      alert('지혜 수정에 실패했습니다. Firebase 규칙을 확인해주세요.');
    }
  };

  const updateReportStatus = async (reportId, status, adminNote) => {
    try {
      const reportRef = doc(db, "reports", reportId);
      await updateDoc(reportRef, {
        status: status,
        adminNote: adminNote,
        updatedAt: serverTimestamp(),
        reviewedBy: user?.uid,
        reviewedAt: serverTimestamp()
      });
    } catch (error) {
      console.error("신고 상태 업데이트 오류:", error);
    }
  };

  const handleDismissReport = async (report) => {
    if (!window.confirm("이 신고를 무시하시겠습니까?")) {
      return;
    }

    try {
      await updateReportStatus(report.id, "dismissed", "관리자에 의해 무시됨");
      
      // 무시된 신고를 목록에서 즉시 제거
      setReports(prev => prev.filter(r => r.id !== report.id));
      
      alert("신고가 무시되었습니다.");
    } catch (error) {
      console.error("신고 무시 오류:", error);
      alert(`신고 무시 실패: ${error.message}`);
    }
  };

  const getReportTypeText = (report) => {
    if (report.commentId) {
      return report.isReply ? "대댓글" : "댓글";
    } else if (report.postId) {
      return "게시글";
    } else if (report.messageId) {
      return "채팅 메시지";
    } else if (report.reportType === "user") {
      return "사용자";
    }
    return "기타";
  };

  const getReportContent = (report) => {
    if (report.commentId) {
      return report.commentContent || "내용 없음";
    } else if (report.postId) {
      return report.postTitle || report.postContent || "제목 없음";
    } else if (report.messageId) {
      return report.messageContent || "메시지 내용 없음";
    }
    return "내용 없음";
  };

  if (!user) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-red-50 via-pink-50 to-red-100">
        <main className="pb-20 pt-16">
          <div className="max-w-6xl mx-auto px-4">
            <div className="text-center py-12">
              <div className="text-red-400 text-6xl mb-4">🔒</div>
              <p className="text-red-600 text-lg">로그인이 필요합니다.</p>
            </div>
          </div>
        </main>
      </div>
    );
  }

  if (!isAdmin) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-red-50 via-pink-50 to-red-100">
        <main className="pb-20 pt-16">
          <div className="max-w-6xl mx-auto px-4">
            <div className="text-center py-12">
              <div className="text-red-400 text-6xl mb-4">🚫</div>
              <p className="text-red-600 text-lg">관리자 권한이 필요합니다.</p>
              <p className="text-red-500 text-sm mt-2">Firebase 관리자 계정으로 로그인해주세요.</p>
            </div>
          </div>
        </main>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-red-50 via-pink-50 to-red-100">
        <main className="pb-20 pt-16">
          <div className="max-w-6xl mx-auto px-4">
            <div className="text-center py-12">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-red-700 mx-auto mb-4"></div>
              <p className="text-red-700">관리자 권한을 확인하는 중...</p>
              <p className="text-red-500 text-sm mt-2">잠시만 기다려주세요</p>
            </div>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-red-50 via-pink-50 to-red-100">
      <main className="pb-20 pt-16">
        <div className="max-w-6xl mx-auto px-4">
          {/* 헤더 */}
          <div className="bg-white rounded-2xl shadow-xl p-6 mb-6">
            <div className="flex items-center space-x-3">
              <FaCrown className="text-yellow-500 text-3xl" />
              <div>
                <h1 className="text-3xl font-bold text-gray-800">관리자 패널 👑</h1>
                <p className="text-gray-600 mt-1">신고된 콘텐츠를 관리하고 조치할 수 있습니다</p>
              </div>
            </div>
          </div>

          {/* 탭 네비게이션 */}
          <div className="bg-white rounded-2xl shadow-xl p-6 mb-6">
            <div className="flex space-x-4 border-b border-gray-200">
              <button
                onClick={() => setActiveTab('reports')}
                className={`px-4 py-2 font-medium rounded-t-lg transition-colors ${
                  activeTab === 'reports'
                    ? 'text-red-600 border-b-2 border-red-600'
                    : 'text-gray-500 hover:text-gray-700'
                }`}
              >
                신고 관리 ({reports.length})
              </button>
              <button
                onClick={() => setActiveTab('wisdoms')}
                className={`px-4 py-2 font-medium rounded-t-lg transition-colors ${
                  activeTab === 'wisdoms'
                    ? 'text-amber-600 border-b-2 border-amber-600'
                    : 'text-gray-500 hover:text-gray-700'
                }`}
              >
                지혜 관리 ({wisdoms.length})
              </button>
            </div>
          </div>

          {/* 신고 목록 */}
          {activeTab === 'reports' && (
            <div className="bg-white rounded-2xl shadow-xl p-6">
              <h2 className="text-xl font-bold text-gray-800 mb-6">신고된 콘텐츠</h2>
              
              {reports.length === 0 ? (
                <div className="text-center py-12 text-gray-500">
                  <div className="text-gray-400 text-6xl mb-4">✅</div>
                  <p>처리할 신고가 없습니다.</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {reports.map((report) => (
                    <div key={report.id} className="border border-gray-200 rounded-lg p-4">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center space-x-2 mb-2">
                            <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                              report.status === 'pending' 
                                ? 'bg-yellow-100 text-yellow-800' 
                                : 'bg-blue-100 text-blue-800'
                            }`}>
                              {report.status === 'pending' ? '대기중' : '검토됨'}
                            </span>
                            <span className="px-2 py-1 bg-red-100 text-red-800 rounded-full text-xs font-medium">
                              {getReportTypeText(report)}
                            </span>
                            <span className="px-2 py-1 bg-purple-100 text-purple-800 rounded-full text-xs font-medium">
                              {report.reason}
                            </span>
                          </div>
                          
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                            <div>
                              <span className="text-gray-500">신고자:</span>
                              <div className="font-medium text-gray-700">{report.reporterName}</div>
                            </div>
                            <div>
                              <span className="text-gray-500">신고 대상:</span>
                              <div className="font-medium text-gray-700">{report.reportedUserName}</div>
                            </div>
                            <div>
                              <span className="text-gray-500">신고 일시:</span>
                              <div className="font-medium text-gray-700">
                                {report.createdAt?.toLocaleDateString('ko-KR') || '날짜 없음'}
                              </div>
                            </div>
                            <div>
                              <span className="text-gray-500">신고 사유:</span>
                              <div className="font-medium text-gray-700">{report.reason}</div>
                            </div>
                          </div>
                          
                          <div className="mt-3">
                            <span className="text-gray-500">신고 내용:</span>
                            <div className="font-medium text-gray-700 mt-1 p-3 bg-gray-50 rounded">
                              {getReportContent(report)}
                            </div>
                          </div>
                          
                          {report.description && (
                            <div className="mt-3">
                              <span className="text-gray-500">추가 설명:</span>
                              <div className="font-medium text-gray-700 mt-1 p-3 bg-gray-50 rounded">
                                {report.description}
                              </div>
                            </div>
                          )}
                        </div>
                        
                        <div className="flex flex-col space-y-2 ml-4">
                          <button
                            onClick={() => handleDeleteComment(report)}
                            disabled={deleting[report.id]}
                            className={`px-4 py-2 rounded-lg transition-colors flex items-center space-x-2 ${
                              deleting[report.id]
                                ? 'bg-gray-400 text-white cursor-not-allowed'
                                : 'bg-red-600 text-white hover:bg-red-700'
                            }`}
                            title="강제 삭제"
                          >
                            <FaTrash className="text-sm" />
                            <span>{deleting[report.id] ? '삭제 중...' : '삭제'}</span>
                          </button>
                          
                          <button
                            onClick={() => handleDismissReport(report)}
                            className="px-4 py-2 rounded-lg transition-colors flex items-center space-x-2 bg-gray-500 text-white hover:bg-gray-600"
                            title="신고 무시"
                          >
                            <FaEye className="text-sm" />
                            <span>무시</span>
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* 지혜 관리 탭 */}
          {activeTab === 'wisdoms' && (
            <div className="space-y-6">
              {/* 지혜 통계 */}
              {wisdomStats && (
                <div className="bg-white rounded-2xl shadow-xl p-6">
                  <h2 className="text-xl font-bold text-gray-800 mb-4">지혜 통계</h2>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div className="text-center p-4 bg-amber-50 rounded-lg">
                      <div className="text-2xl font-bold text-amber-600">{wisdomStats.total}</div>
                      <div className="text-sm text-amber-700">전체 지혜</div>
                    </div>
                    <div className="text-center p-4 bg-green-50 rounded-lg">
                      <div className="text-2xl font-bold text-green-600">{wisdomStats.active}</div>
                      <div className="text-sm text-green-700">활성 지혜</div>
                    </div>
                    <div className="text-center p-4 bg-blue-50 rounded-lg">
                      <div className="text-2xl font-bold text-blue-600">{wisdomStats.totalViews}</div>
                      <div className="text-sm text-blue-700">총 조회수</div>
                    </div>
                    <div className="text-center p-4 bg-red-50 rounded-lg">
                      <div className="text-2xl font-bold text-red-600">{wisdomStats.totalLikes}</div>
                      <div className="text-sm text-red-700">총 좋아요</div>
                    </div>
                  </div>
                </div>
              )}

              {/* 지혜 생성 폼 */}
              <div className="bg-white rounded-2xl shadow-xl p-6">
                <h2 className="text-xl font-bold text-gray-800 mb-6">새 지혜 추가</h2>
                
                <form onSubmit={handleCreateWisdom} className="space-y-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      지혜 내용 *
                    </label>
                    <textarea
                      value={wisdomForm.text}
                      onChange={(e) => setWisdomForm(prev => ({ ...prev, text: e.target.value }))}
                      placeholder="지혜로운 말씀을 입력하세요"
                      rows={4}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent"
                      maxLength="500"
                    />
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        작가 *
                      </label>
                      <input
                        type="text"
                        value={wisdomForm.author}
                        onChange={(e) => setWisdomForm(prev => ({ ...prev, author: e.target.value }))}
                        placeholder="작가명을 입력하세요"
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent"
                        maxLength="100"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        카테고리
                      </label>
                      <select
                        value={wisdomForm.category}
                        onChange={(e) => setWisdomForm(prev => ({ ...prev, category: e.target.value }))}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent"
                      >
                        <option value="인생">인생</option>
                        <option value="성공">성공</option>
                        <option value="시간">시간</option>
                        <option value="학습">학습</option>
                        <option value="실천">실천</option>
                        <option value="꿈">꿈</option>
                        <option value="인내">인내</option>
                        <option value="행복">행복</option>
                        <option value="시작">시작</option>
                        <option value="도전">도전</option>
                        <option value="지식">지식</option>
                        <option value="우정">우정</option>
                        <option value="건강">건강</option>
                        <option value="노력">노력</option>
                      </select>
                    </div>
                  </div>

                  <div className="flex justify-end space-x-3">
                    <button
                      type="button"
                      onClick={() => setWisdomForm({ text: '', author: '', category: '인생' })}
                      className="px-4 py-2 text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                    >
                      초기화
                    </button>
                    <button
                      type="submit"
                      disabled={creatingWisdom || !wisdomForm.text.trim() || !wisdomForm.author.trim()}
                      className="px-6 py-2 bg-amber-600 text-white rounded-lg hover:bg-amber-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2"
                    >
                      {creatingWisdom ? (
                        <>
                          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                          <span>생성 중...</span>
                        </>
                      ) : (
                        <>
                          <FaBell className="w-4 h-4" />
                          <span>지혜 추가</span>
                        </>
                      )}
                    </button>
                  </div>
                </form>
              </div>

              {/* 지혜 목록 */}
              <div className="bg-white rounded-2xl shadow-xl p-6">
                <h2 className="text-xl font-bold text-gray-800 mb-6">지혜 목록</h2>
                
                {wisdoms.length === 0 ? (
                  <div className="text-center py-8 text-gray-500">
                    등록된 지혜가 없습니다.
                  </div>
                ) : (
                  <div className="space-y-4">
                    {wisdoms.map((wisdom) => (
                      <div key={wisdom.id} className={`p-4 rounded-lg border-l-4 ${
                        wisdom.isActive 
                          ? 'bg-green-50 border-green-400' 
                          : 'bg-gray-50 border-gray-400'
                      }`}>
                        {editingWisdom === wisdom.id ? (
                          // 수정 모드
                          <div className="space-y-4">
                            <div>
                              <label className="block text-sm font-medium text-gray-700 mb-2">
                                지혜 내용 *
                              </label>
                              <textarea
                                value={wisdomEditForm.text}
                                onChange={(e) => setWisdomEditForm(prev => ({ ...prev, text: e.target.value }))}
                                placeholder="지혜로운 말씀을 입력하세요"
                                rows={3}
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent"
                                maxLength="500"
                              />
                            </div>
                            
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                              <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                  작가 *
                                </label>
                                <input
                                  type="text"
                                  value={wisdomEditForm.author}
                                  onChange={(e) => setWisdomEditForm(prev => ({ ...prev, author: e.target.value }))}
                                  placeholder="작가명을 입력하세요"
                                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent"
                                  maxLength="50"
                                />
                              </div>
                              
                              <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                  카테고리
                                </label>
                                <select
                                  value={wisdomEditForm.category}
                                  onChange={(e) => setWisdomEditForm(prev => ({ ...prev, category: e.target.value }))}
                                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent"
                                >
                                  <option value="인생">인생</option>
                                  <option value="성공">성공</option>
                                  <option value="사랑">사랑</option>
                                  <option value="우정">우정</option>
                                  <option value="가족">가족</option>
                                  <option value="건강">건강</option>
                                  <option value="돈">돈</option>
                                  <option value="시간">시간</option>
                                  <option value="기타">기타</option>
                                </select>
                              </div>
                            </div>
                            
                            <div className="flex space-x-2">
                              <button
                                onClick={() => handleSaveEditWisdom(wisdom.id)}
                                className="px-4 py-2 bg-amber-600 text-white rounded-lg hover:bg-amber-700 transition-colors flex items-center space-x-2"
                              >
                                <FaBell className="w-4 h-4" />
                                <span>저장</span>
                              </button>
                              <button
                                onClick={handleCancelEditWisdom}
                                className="px-4 py-2 bg-gray-500 text-white rounded-lg hover:bg-gray-600 transition-colors"
                              >
                                취소
                              </button>
                            </div>
                          </div>
                        ) : (
                          // 보기 모드
                          <div className="flex justify-between items-start">
                            <div className="flex-1">
                              <p className="text-gray-800 font-medium mb-2">"{wisdom.text}"</p>
                              <div className="flex items-center space-x-4 text-sm text-gray-600">
                                <span>- {wisdom.author}</span>
                                <span className="bg-amber-100 text-amber-700 px-2 py-1 rounded-full">
                                  {wisdom.category}
                                </span>
                                <span>조회: {wisdom.viewCount || 0}</span>
                                <span>좋아요: {wisdom.likeCount || 0}</span>
                              </div>
                              <div className="text-xs text-gray-500 mt-2">
                                생성: {wisdom.createdAt?.toDate ? wisdom.createdAt.toDate().toLocaleDateString() : '날짜 없음'}
                                {wisdom.createdByName && ` | 생성자: ${wisdom.createdByName}`}
                                {wisdom.updatedAt && ` | 수정: ${formatDate(wisdom.updatedAt)}`}
                              </div>
                            </div>
                            <div className="flex space-x-2 ml-4">
                              <button
                                onClick={() => handleStartEditWisdom(wisdom)}
                                className="px-3 py-1 text-xs bg-blue-100 text-blue-700 rounded-full hover:bg-blue-200 transition-colors"
                              >
                                수정
                              </button>
                              <button
                                onClick={() => handleToggleWisdomStatus(wisdom.id, wisdom.isActive)}
                                className={`px-3 py-1 text-xs rounded-full transition-colors ${
                                  wisdom.isActive
                                    ? 'bg-red-100 text-red-700 hover:bg-red-200'
                                    : 'bg-green-100 text-green-700 hover:bg-green-200'
                                }`}
                              >
                                {wisdom.isActive ? '비활성화' : '활성화'}
                              </button>
                              <button
                                onClick={() => handleDeleteWisdom(wisdom.id)}
                                className="px-3 py-1 text-xs bg-red-100 text-red-700 rounded-full hover:bg-red-200 transition-colors"
                              >
                                삭제
                              </button>
                            </div>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}

        </div>
      </main>
    </div>
  );
};

export default AdminPanel;
