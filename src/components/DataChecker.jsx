import React, { useState, useEffect } from "react";
import { auth, db } from "../util/firebase";
import { doc, getDoc } from "firebase/firestore";

const DataChecker = () => {
  const [userId, setUserId] = useState("");
  const [userData, setUserData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const checkUserData = async () => {
    if (!userId.trim()) {
      setError("사용자 ID를 입력해주세요.");
      return;
    }

    setLoading(true);
    setError("");
    setUserData(null);

    try {
      const userDoc = await getDoc(doc(db, "users", userId));
      if (userDoc.exists()) {
        const data = userDoc.data();
        setUserData(data);
      } else {
        setError("해당 사용자를 찾을 수 없습니다.");
      }
    } catch (error) {
      console.error("데이터 확인 오류:", error);
      setError("데이터 확인 중 오류가 발생했습니다: " + error.message);
    } finally {
      setLoading(false);
    }
  };

  const getFieldStatus = (value, fieldName) => {
    if (value === undefined || value === null) {
      return { status: "missing", text: "누락됨" };
    }
    if (Array.isArray(value) && value.length === 0) {
      return { status: "empty", text: "빈 배열" };
    }
    if (typeof value === "string" && value.trim() === "") {
      return { status: "empty", text: "빈 문자열" };
    }
    return { status: "ok", text: "정상" };
  };

  const getStatusColor = (status) => {
    switch (status) {
      case "ok": return "text-green-600";
      case "empty": return "text-yellow-600";
      case "missing": return "text-red-600";
      default: return "text-gray-600";
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-amber-50 via-orange-50 to-amber-100 pb-20">
      <div className="max-w-4xl mx-auto p-6">
        {/* 헤더 */}
        <div className="bg-white rounded-2xl shadow-xl p-6 mb-6">
          <h1 className="text-3xl font-bold text-amber-700 mb-2 text-center">
            데이터 구조 확인 도구
          </h1>
          <p className="text-gray-600 text-center">
            특정 사용자의 Firestore 데이터 구조를 확인합니다
          </p>
        </div>

        {/* 검색 폼 */}
        <div className="bg-white rounded-2xl shadow-xl p-6 mb-6">
          <div className="flex gap-4">
            <input
              type="text"
              value={userId}
              onChange={(e) => setUserId(e.target.value)}
              placeholder="사용자 ID를 입력하세요"
              className="flex-1 border border-gray-300 rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-amber-400"
            />
            <button
              onClick={checkUserData}
              disabled={loading}
              className={`px-6 py-3 rounded-lg font-semibold transition-colors ${
                loading
                  ? "bg-gray-400 cursor-not-allowed"
                  : "bg-amber-700 hover:bg-amber-800 text-white"
              }`}
            >
              {loading ? "확인 중..." : "데이터 확인"}
            </button>
          </div>
        </div>

        {/* 오류 메시지 */}
        {error && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
            {error}
          </div>
        )}

        {/* 데이터 표시 */}
        {userData && (
          <div className="bg-white rounded-2xl shadow-xl p-6">
            <h2 className="text-xl font-bold text-gray-800 mb-4">사용자 데이터 구조</h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* 기본 정보 */}
              <div>
                <h3 className="text-lg font-semibold text-gray-700 mb-3">기본 정보</h3>
                <div className="space-y-2">
                  {[
                    { key: "userId", label: "사용자 ID" },
                    { key: "name", label: "이름" },
                    { key: "nickname", label: "별명" },
                    { key: "email", label: "이메일" },
                    { key: "phone", label: "전화번호" }
                  ].map(({ key, label }) => {
                    const status = getFieldStatus(userData[key], key);
                    return (
                      <div key={key} className="flex justify-between items-center">
                        <span className="text-sm text-gray-600">{label}:</span>
                        <div className="flex items-center gap-2">
                          <span className="text-sm">{userData[key] || "미설정"}</span>
                          <span className={`text-xs font-semibold ${getStatusColor(status.status)}`}>
                            ({status.text})
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* 추가 정보 */}
              <div>
                <h3 className="text-lg font-semibold text-gray-700 mb-3">추가 정보</h3>
                <div className="space-y-2">
                  {[
                    { key: "birthDate", label: "생년월일" },
                    { key: "gender", label: "성별" },
                    { key: "address", label: "주소" },
                    { key: "interests", label: "관심사" },
                    { key: "profileComplete", label: "프로필 완성도" }
                  ].map(({ key, label }) => {
                    const status = getFieldStatus(userData[key], key);
                    let displayValue = userData[key];
                    
                    if (key === "interests") {
                      displayValue = Array.isArray(userData[key]) 
                        ? userData[key].join(", ") || "없음"
                        : "배열 아님";
                    } else if (key === "profileComplete") {
                      displayValue = userData[key] ? "완료" : "미완료";
                    }
                    
                    return (
                      <div key={key} className="flex justify-between items-center">
                        <span className="text-sm text-gray-600">{label}:</span>
                        <div className="flex items-center gap-2">
                          <span className="text-sm">{displayValue}</span>
                          <span className={`text-xs font-semibold ${getStatusColor(status.status)}`}>
                            ({status.text})
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* 메타데이터 */}
            <div className="mt-6 pt-6 border-t border-gray-200">
              <h3 className="text-lg font-semibold text-gray-700 mb-3">메타데이터</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {[
                  { key: "isActive", label: "활성 상태" },
                  { key: "role", label: "역할" },
                  { key: "signupMethod", label: "가입 방법" },
                  { key: "emailVerified", label: "이메일 인증" },
                  { key: "createdAt", label: "생성일" },
                  { key: "updatedAt", label: "수정일" }
                ].map(({ key, label }) => {
                  const value = userData[key];
                  let displayValue = value;
                  
                  if (key === "createdAt" || key === "updatedAt") {
                    displayValue = value?.toDate ? value.toDate().toLocaleString('ko-KR') : value;
                  } else if (typeof value === "boolean") {
                    displayValue = value ? "예" : "아니오";
                  }
                  
                  return (
                    <div key={key} className="flex justify-between items-center">
                      <span className="text-sm text-gray-600">{label}:</span>
                      <span className="text-sm font-medium">{displayValue || "미설정"}</span>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* 원본 데이터 */}
            <div className="mt-6 pt-6 border-t border-gray-200">
              <h3 className="text-lg font-semibold text-gray-700 mb-3">원본 데이터 (JSON)</h3>
              <pre className="bg-gray-100 p-4 rounded-lg text-xs overflow-x-auto">
                {JSON.stringify(userData, null, 2)}
              </pre>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default DataChecker;
