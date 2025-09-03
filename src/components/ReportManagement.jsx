import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { auth } from "../util/firebase";
import { onAuthStateChanged } from "firebase/auth";
import { getUserProfile } from "../util/userService";
import { getMyReports } from "../util/reportService";
import { FaFlag, FaEye, FaClock, FaCheck, FaTimes, FaExclamationTriangle } from "react-icons/fa";

const ReportManagement = () => {
  const [user, setUser] = useState(null);
  const [userData, setUserData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [reports, setReports] = useState([]);
  const [error, setError] = useState("");
  const navigate = useNavigate();

  // 사용자 인증 확인
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      if (currentUser) {
        setUser(currentUser);
        try {
          const profile = await getUserProfile(currentUser.uid);
          setUserData(profile);
          await loadReports();
        } catch (error) {
          console.error("사용자 정보 로드 오류:", error);
          setError("사용자 정보를 불러오는 중 오류가 발생했습니다.");
        }
      } else {
        navigate("/login");
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, [navigate]);

  // 신고 내역 로드
  const loadReports = async () => {
    try {
      setError("");
      const reportList = await getMyReports();
      setReports(reportList);
    } catch (error) {
      console.error("신고 내역 로드 오류:", error);
      setError("신고 내역을 불러오는 중 오류가 발생했습니다.");
    }
  };

  // 신고 상태별 아이콘
  const getStatusIcon = (status) => {
    switch (status) {
      case "pending":
        return <FaClock className="text-yellow-500" />;
      case "reviewed":
        return <FaEye className="text-blue-500" />;
      case "resolved":
        return <FaCheck className="text-green-500" />;
      case "dismissed":
        return <FaTimes className="text-gray-500" />;
      default:
        return <FaExclamationTriangle className="text-red-500" />;
    }
  };

  // 신고 상태별 텍스트
  const getStatusText = (status) => {
    switch (status) {
      case "pending":
        return "검토 대기";
      case "reviewed":
        return "검토 중";
      case "resolved":
        return "처리 완료";
      case "dismissed":
        return "기각";
      default:
        return "알 수 없음";
    }
  };

  // 신고 타입별 제목
  const getReportTypeTitle = (report) => {
    if (report.messageId) {
      return "채팅 메시지 신고";
    } else if (report.postId) {
      return "게시글 신고";
    } else if (report.commentId) {
      return "댓글 신고";
    } else if (report.reportType === "user") {
      return "사용자 신고";
    }
    return "신고";
  };

  // 신고 대상 내용
  const getReportContent = (report) => {
    if (report.messageContent) {
      return report.messageContent;
    } else if (report.postTitle) {
      return report.postTitle;
    } else if (report.commentContent) {
      return report.commentContent;
    } else if (report.reportType === "user") {
      return report.reportedUserName;
    }
    return "내용 없음";
  };

  // 시간 포맷팅
  const formatDate = (timestamp) => {
    if (!timestamp) return "";
    const date = timestamp instanceof Date ? timestamp : new Date(timestamp);
    return date.toLocaleDateString('ko-KR', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit'
    });
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
            <div className="flex items-center space-x-3">
              <button
                onClick={() => navigate("/")}
                className="flex items-center justify-center w-12 h-12 bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white rounded-full shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-110"
                title="홈으로 돌아가기"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M10.5 19.5L3 12m0 0l7.5-7.5M3 12h18" />
                </svg>
              </button>
              <div>
                <h1 className="text-3xl font-bold text-amber-700 flex items-center space-x-2">
                  <FaFlag />
                  <span>내 신고 내역</span>
                </h1>
                <p className="text-gray-600 mt-1">
                  내가 신고한 내역을 확인할 수 있습니다
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* 오류 메시지 */}
        {error && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
            <div className="flex items-start">
              <FaExclamationTriangle className="h-5 w-5 text-red-400 mt-0.5 mr-2" />
              <p className="text-sm">{error}</p>
            </div>
          </div>
        )}

        {/* 신고 내역 */}
        <div className="bg-white rounded-2xl shadow-xl p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-bold text-gray-800">
              신고 내역 ({reports.length}건)
            </h2>
            <button
              onClick={loadReports}
              className="px-4 py-2 bg-amber-600 text-white rounded-lg hover:bg-amber-700 transition-colors text-sm"
            >
              새로고침
            </button>
          </div>

          {reports.length === 0 ? (
            <div className="text-center py-12">
              <FaFlag className="text-gray-300 text-6xl mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-gray-500 mb-2">
                신고 내역이 없습니다
              </h3>
              <p className="text-gray-400">
                부적절한 내용을 발견하시면 신고해주세요
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {reports.map((report) => (
                <div
                  key={report.id}
                  className="border border-gray-200 rounded-lg p-4 hover:bg-gray-50 transition-colors"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center space-x-2 mb-2">
                        <span className="text-sm font-semibold text-gray-800">
                          {getReportTypeTitle(report)}
                        </span>
                        <span className="px-2 py-1 bg-red-100 text-red-800 text-xs rounded-full">
                          {report.reason}
                        </span>
                      </div>
                      
                      <div className="mb-2">
                        <p className="text-sm text-gray-600">
                          <strong>신고 대상:</strong> {report.reportedUserName}
                        </p>
                        <p className="text-sm text-gray-800 mt-1 break-words">
                          <strong>내용:</strong> {getReportContent(report)}
                        </p>
                      </div>

                      {report.description && (
                        <div className="mb-2">
                          <p className="text-sm text-gray-600">
                            <strong>상세 설명:</strong> {report.description}
                          </p>
                        </div>
                      )}

                      <div className="flex items-center justify-between text-xs text-gray-500">
                        <span>신고일: {formatDate(report.createdAt)}</span>
                        {report.chatType && (
                          <span>
                            {report.chatType === "main" ? "탑골톡" : "공원톡"}
                            {report.parkId && ` (공원 ${report.parkId})`}
                          </span>
                        )}
                      </div>
                    </div>

                    <div className="ml-4 flex flex-col items-center space-y-1">
                      {getStatusIcon(report.status)}
                      <span className="text-xs text-gray-600 text-center">
                        {getStatusText(report.status)}
                      </span>
                    </div>
                  </div>

                  {report.adminNote && (
                    <div className="mt-3 pt-3 border-t border-gray-200">
                      <p className="text-sm text-blue-700">
                        <strong>관리자 메모:</strong> {report.adminNote}
                      </p>
                      {report.reviewedAt && (
                        <p className="text-xs text-gray-500 mt-1">
                          처리일: {formatDate(report.reviewedAt)}
                        </p>
                      )}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* 신고 가이드 */}
        <div className="bg-amber-50 border border-amber-200 rounded-2xl p-6 mt-6">
          <h3 className="font-semibold text-amber-800 mb-3 flex items-center space-x-2">
            <FaExclamationTriangle />
            <span>신고 가이드</span>
          </h3>
          <ul className="text-sm text-amber-700 space-y-2">
            <li>• 허위 신고는 제재를 받을 수 있습니다</li>
            <li>• 신고 처리는 1-3일 정도 소요될 수 있습니다</li>
            <li>• 같은 내용을 중복 신고할 수 없습니다</li>
            <li>• 신고 결과에 대한 개별 알림은 제공되지 않습니다</li>
          </ul>
        </div>
      </div>
    </div>
  );
};

export default ReportManagement;
