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
  adminDeletePost 
} from '../util/reportService';
import { createNotification } from '../util/notificationService';
import { FaTrash, FaEye, FaExclamationTriangle, FaCrown, FaBell } from 'react-icons/fa';

const AdminPanel = () => {
  const { user } = useAuth();
  const [isAdmin, setIsAdmin] = useState(false);
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('reports');
  const [deleting, setDeleting] = useState({});
  const [notificationForm, setNotificationForm] = useState({
    title: '',
    content: '',
    category: 'general'
  });
  const [creatingNotification, setCreatingNotification] = useState(false);

  useEffect(() => {
    const checkAdmin = async () => {
      if (user) {
        try {
          const adminStatus = await checkAdminRole(user.uid);
          setIsAdmin(adminStatus);
          if (adminStatus) {
            loadReports();
          } else {
            setLoading(false);
          }
        } catch (error) {
          console.error("관리자 권한 확인 오류:", error);
          setIsAdmin(false);
          setLoading(false);
        }
      } else {
        setIsAdmin(false);
        setLoading(false);
      }
    };

    checkAdmin();
  }, [user]);

  const loadReports = () => {
    // 인덱스 오류를 피하기 위해 단순한 쿼리 사용
    const q = query(
      collection(db, "reports"),
      orderBy("createdAt", "desc")
    );

    const unsubscribe = onSnapshot(q, (querySnapshot) => {
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
      setReports(reportsData);
      setLoading(false);
    });

    return unsubscribe;
  };

  // 알림 생성 함수
  const handleCreateNotification = async (e) => {
    e.preventDefault();
    
    if (!notificationForm.title.trim() || !notificationForm.content.trim()) {
      alert('제목과 내용을 모두 입력해주세요.');
      return;
    }

    setCreatingNotification(true);
    try {
      await createNotification({
        title: notificationForm.title.trim(),
        content: notificationForm.content.trim(),
        category: notificationForm.category,
        priority: 'normal',
        author: user.displayName || user.email || '관리자',
        authorId: user.uid,
        authorEmail: user.email
      });
      
      alert('알림이 성공적으로 생성되었습니다!');
      setNotificationForm({
        title: '',
        content: '',
        category: 'general'
      });
    } catch (error) {
      console.error('알림 생성 오류:', error);
      alert('알림 생성에 실패했습니다.');
    } finally {
      setCreatingNotification(false);
    }
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
      
      // 삭제된 신고를 목록에서 즉시 제거
      setReports(prev => prev.filter(r => r.id !== report.id));
      
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
              <button
                onClick={() => setActiveTab('notifications')}
                className={`px-4 py-2 font-medium rounded-t-lg transition-colors ${
                  activeTab === 'notifications'
                    ? 'text-amber-600 border-b-2 border-amber-600'
                    : 'text-gray-500 hover:text-gray-700'
                }`}
              >
                <FaBell className="inline w-4 h-4 mr-2" />
                알림 생성
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

          {/* 알림 생성 탭 */}
          {activeTab === 'notifications' && (
            <div className="bg-white rounded-2xl shadow-xl p-6">
              <h2 className="text-xl font-bold text-gray-800 mb-6">알림 생성</h2>
              
              <form onSubmit={handleCreateNotification} className="space-y-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    제목 *
                  </label>
                  <input
                    type="text"
                    value={notificationForm.title}
                    onChange={(e) => setNotificationForm(prev => ({ ...prev, title: e.target.value }))}
                    placeholder="알림 제목을 입력하세요"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent"
                    maxLength="100"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    내용 *
                  </label>
                  <textarea
                    value={notificationForm.content}
                    onChange={(e) => setNotificationForm(prev => ({ ...prev, content: e.target.value }))}
                    placeholder="알림 내용을 입력하세요"
                    rows={4}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent"
                    maxLength="500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    카테고리
                  </label>
                  <select
                    value={notificationForm.category}
                    onChange={(e) => setNotificationForm(prev => ({ ...prev, category: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent"
                  >
                    <option value="general">일반</option>
                    <option value="announcement">공지사항</option>
                    <option value="update">업데이트</option>
                    <option value="maintenance">점검</option>
                    <option value="event">이벤트</option>
                  </select>
                </div>

                <div className="flex justify-end space-x-3">
                  <button
                    type="button"
                    onClick={() => setNotificationForm({ title: '', content: '', category: 'general' })}
                    className="px-4 py-2 text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                  >
                    초기화
                  </button>
                  <button
                    type="submit"
                    disabled={creatingNotification || !notificationForm.title.trim() || !notificationForm.content.trim()}
                    className="px-6 py-2 bg-amber-600 text-white rounded-lg hover:bg-amber-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2"
                  >
                    {creatingNotification ? (
                      <>
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                        <span>생성 중...</span>
                      </>
                    ) : (
                      <>
                        <FaBell className="w-4 h-4" />
                        <span>알림 생성</span>
                      </>
                    )}
                  </button>
                </div>
              </form>

              <div className="mt-8 p-4 bg-amber-50 rounded-lg">
                <h3 className="text-sm font-medium text-amber-800 mb-2">알림 생성 안내</h3>
                <ul className="text-sm text-amber-700 space-y-1">
                  <li>• 생성된 알림은 모든 사용자에게 표시됩니다</li>
                  <li>• 제목은 최대 100자, 내용은 최대 500자까지 입력 가능합니다</li>
                  <li>• 카테고리별로 알림을 분류할 수 있습니다</li>
                  <li>• 알림은 실시간으로 사용자들에게 전달됩니다</li>
                </ul>
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  );
};

export default AdminPanel;
