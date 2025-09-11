import React, { useState } from "react";
import { REPORT_REASONS, reportChatMessage, reportPost, reportComment, reportUser, checkDuplicateReport } from "../util/reportService";
import { FaExclamationTriangle, FaTimes, FaFlag } from "react-icons/fa";

const ReportModal = ({ 
  isOpen, 
  onClose, 
  targetData, 
  targetType, // "message", "post", "comment", "user"
  onSuccess 
}) => {
  const [reason, setReason] = useState("");
  const [description, setDescription] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [step, setStep] = useState(1); // 1: 사유 선택, 2: 상세 설명

  const handleSubmit = async () => {
    if (!reason) {
      setError("신고 사유를 선택해주세요.");
      return;
    }

    if (step === 1) {
      setStep(2);
      return;
    }

    setLoading(true);
    setError("");

    try {
      // 디버깅: targetData 확인
      console.log("신고 대상 데이터:", targetData);
      console.log("신고 유형:", targetType);
      
      // 중복 신고 확인
      const isDuplicate = await checkDuplicateReport(
        targetData.id, 
        targetType, 
        reason
      );

      if (isDuplicate) {
        setError("이미 같은 사유로 신고한 내역이 있습니다.");
        setLoading(false);
        return;
      }

      let reportId;
      
      switch (targetType) {
        case "message":
          reportId = await reportChatMessage(targetData, reason, description);
          break;
        case "post":
          reportId = await reportPost(targetData, reason, description);
          break;
        case "comment":
          reportId = await reportComment(targetData, reason, description);
          break;
        case "user":
          reportId = await reportUser(targetData, reason, description);
          break;
        default:
          throw new Error("지원하지 않는 신고 유형입니다.");
      }

      // 성공 처리
      if (onSuccess) {
        onSuccess(reportId);
      }
      
      // 모달 닫기
      handleClose();
      
    } catch (error) {
      console.error("신고 처리 오류:", error);
      setError(error.message || "신고 처리 중 오류가 발생했습니다.");
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    setReason("");
    setDescription("");
    setError("");
    setStep(1);
    setLoading(false);
    onClose();
  };

  const getTargetInfo = () => {
    switch (targetType) {
      case "message":
        return {
          title: "채팅 메시지 신고",
          content: targetData?.content || "메시지 내용",
          author: targetData?.author || "작성자"
        };
      case "post":
        return {
          title: "게시글 신고",
          content: targetData?.title || "게시글 제목",
          author: targetData?.author || "작성자"
        };
      case "comment":
        return {
          title: targetData?.type === "reply" ? "대댓글 신고" : "댓글 신고",
          content: targetData?.content || "댓글 내용",
          author: targetData?.author || "작성자"
        };
      case "user":
        return {
          title: "사용자 신고",
          content: targetData?.displayName || targetData?.nickname || "사용자",
          author: "신고 대상"
        };
      default:
        return {
          title: "신고",
          content: "대상",
          author: "작성자"
        };
    }
  };

  const targetInfo = getTargetInfo();

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-xl max-w-md w-full max-h-[90vh] overflow-y-auto">
        {/* 헤더 */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div className="flex items-center space-x-3">
            <FaFlag className="text-red-500 text-xl" />
            <h2 className="text-xl font-bold text-gray-800">
              {targetInfo.title}
            </h2>
          </div>
          <button
            onClick={handleClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <FaTimes className="text-xl" />
          </button>
        </div>

        {/* 내용 */}
        <div className="p-6">
          {/* 신고 대상 정보 */}
          <div className="bg-gray-50 rounded-lg p-4 mb-6">
            <h3 className="font-semibold text-gray-700 mb-2">신고 대상</h3>
            <div className="text-sm text-gray-600">
              <p><strong>작성자:</strong> {targetInfo.author}</p>
              <p><strong>내용:</strong> {targetInfo.content}</p>
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

          {/* 단계 1: 신고 사유 선택 */}
          {step === 1 && (
            <div>
              <h3 className="font-semibold text-gray-700 mb-4">
                신고 사유를 선택해주세요
              </h3>
              <div className="space-y-3">
                {REPORT_REASONS.map((reportReason) => (
                  <label
                    key={reportReason}
                    className="flex items-center space-x-3 cursor-pointer p-3 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
                  >
                    <input
                      type="radio"
                      name="reason"
                      value={reportReason}
                      checked={reason === reportReason}
                      onChange={(e) => setReason(e.target.value)}
                      className="w-4 h-4 text-red-600 border-gray-300 focus:ring-red-500"
                    />
                    <span className="text-gray-700">{reportReason}</span>
                  </label>
                ))}
              </div>
            </div>
          )}

          {/* 단계 2: 상세 설명 */}
          {step === 2 && (
            <div>
              <h3 className="font-semibold text-gray-700 mb-4">
                추가 설명 (선택사항)
              </h3>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="신고 사유에 대한 추가 설명을 입력해주세요..."
                className="w-full border border-gray-300 rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-red-400 resize-none"
                rows="4"
                maxLength="500"
              />
              <p className="text-xs text-gray-500 mt-2">
                {description.length}/500자
              </p>
            </div>
          )}

          {/* 버튼 */}
          <div className="flex space-x-3 mt-6">
            <button
              onClick={handleClose}
              disabled={loading}
              className="flex-1 bg-gray-500 text-white font-semibold py-3 px-6 rounded-lg hover:bg-gray-600 transition-colors disabled:opacity-50"
            >
              취소
            </button>
            <button
              onClick={handleSubmit}
              disabled={loading || (step === 1 && !reason)}
              className="flex-1 bg-red-600 text-white font-semibold py-3 px-6 rounded-lg hover:bg-red-700 transition-colors disabled:opacity-50"
            >
              {loading ? (
                <div className="flex items-center justify-center">
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                  처리 중...
                </div>
              ) : step === 1 ? (
                "다음"
              ) : (
                "신고하기"
              )}
            </button>
          </div>

          {/* 이전 단계로 돌아가기 */}
          {step === 2 && (
            <button
              onClick={() => setStep(1)}
              disabled={loading}
              className="w-full mt-3 text-gray-500 hover:text-gray-700 transition-colors disabled:opacity-50"
            >
              ← 이전 단계로 돌아가기
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default ReportModal;
