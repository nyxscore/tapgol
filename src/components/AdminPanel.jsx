import React, { useState, useEffect } from 'react';
import { auth } from '../util/firebase';
import { onAuthStateChanged } from 'firebase/auth';
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
  adminDeletePost 
} from '../util/reportService';
import { FaTrash, FaEye, FaExclamationTriangle, FaCrown } from 'react-icons/fa';

const AdminPanel = () => {
  const [user, setUser] = useState(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('reports');
  const [deleting, setDeleting] = useState({});

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      setUser(currentUser);
      
      if (currentUser) {
        try {
          const adminStatus = await checkAdminRole(currentUser.uid);
          setIsAdmin(adminStatus);
        } catch (error) {
          console.error("관리자 권한 확인 오류:", error);
          setIsAdmin(false);
        }
      } else {
        setIsAdmin(false);
      }
    });

    return () => unsubscribe();
  }, []);

  useEffect(() => {
    if (isAdmin) {
      loadReports();
    }
  }, [isAdmin]);

  const loadReports = () => {
    const q = query(
      collection(db, "reports"),
      where("status", "in", ["pending", "reviewed"]),
      orderBy("createdAt", "desc")
    );

    const unsubscribe = onSnapshot(q, (querySnapshot) => {
      const reportsData = [];
      querySnapshot.forEach((doc) => {
        reportsData.push({
          id: doc.id,
          ...doc.data(),
          createdAt: doc.data().createdAt?.toDate ? doc.data().createdAt.toDate() : doc.data().createdAt
        });
      });
      setReports(reportsData);
      setLoading(false);
    });

    return unsubscribe;
  };

  const handleDeleteComment = async (report) => {
    if (!window.confirm("정말로 이 댓글/대댓글을 삭제하시겠습니까?")) {
      return;
    }

    setDeleting(prev => ({ ...prev, [report.id]: true }));

    try {
      if (report.commentId) {
        // 댓글/대댓글 삭제
        const commentType = report.isReply ? "reply" : "comment";
        await adminDeleteComment(report.commentId, commentType);
        
        // 신고 상태를 resolved로 업데이트
        await updateReportStatus(report.id, "resolved", "관리자에 의해 삭제됨");
      } else if (report.postId) {
        // 게시글 삭제
        await adminDeletePost(report.postId, report.postType);
        
        // 신고 상태를 resolved로 업데이트
        await updateReportStatus(report.id, "resolved", "관리자에 의해 삭제됨");
      }
      
      alert("성공적으로 삭제되었습니다.");
    } catch (error) {
      console.error("삭제 오류:", error);
      alert(`삭제 실패: ${error.message}`);
    } finally {
      setDeleting(prev => ({ ...prev, [report.id]: false }));
    }
  };

  const updateReportStatus = async (reportId, status, adminNote) => {
    try {
      const reportRef = doc(db, "reports", reportId);
      await updateDoc(reportRef, {
        status: status,
        adminNote: adminNote,
        updatedAt: serverTimestamp(),
        reviewedBy: user.uid,
        reviewedAt: serverTimestamp()
      });
    } catch (error) {
      console.error("신고 상태 업데이트 오류:", error);
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
              <p className="text-red-700">관리자 패널을 불러오는 중...</p>
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
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </main>
    </div>
  );
};

export default AdminPanel;
