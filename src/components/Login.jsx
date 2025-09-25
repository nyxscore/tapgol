// src/components/Login.jsx
import React, { useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";
import { sendPasswordResetEmail } from "firebase/auth";
import { auth } from "../util/firebase";

const Login = () => {
  const [id, setId] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [fieldErrors, setFieldErrors] = useState({});
  const [showPasswordReset, setShowPasswordReset] = useState(false);
  const [showIdFind, setShowIdFind] = useState(false);
  const [resetEmail, setResetEmail] = useState("");
  const [resetLoading, setResetLoading] = useState(false);
  const [resetMessage, setResetMessage] = useState("");
  const [showAdminSignup, setShowAdminSignup] = useState(false);
  const [adminSignupLoading, setAdminSignupLoading] = useState(false);

  const navigate = useNavigate();
  const location = useLocation();
  const from = location.state?.from || "/";
  const { login, signup } = useAuth();

  // 입력 필드 검증
  const validateInputs = () => {
    const errors = {};
    
    // 관리자 이메일인지 확인 (이메일 형식이면 관리자로 간주)
    const isAdminEmail = id.includes('@');
    
    if (!id.trim()) {
      errors.id = isAdminEmail ? "이메일을 입력해주세요." : "아이디를 입력해주세요.";
    } else if (isAdminEmail) {
      // 관리자 이메일 형식 검증
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(id)) {
        errors.id = "올바른 이메일 형식을 입력해주세요.";
      }
    } else {
      // 일반 사용자 아이디 검증
      if (id.length < 3) {
        errors.id = "아이디는 3자 이상이어야 합니다.";
      } else if (id.length > 20) {
        errors.id = "아이디는 20자 이하여야 합니다.";
      } else if (!/^[a-zA-Z0-9_]+$/.test(id)) {
        errors.id = "아이디는 영문, 숫자, 언더스코어(_)만 사용할 수 있습니다.";
      }
    }
    
    // 비밀번호 검증
    if (!password) {
      errors.password = "비밀번호를 입력해주세요.";
    } else if (password.length < 6) {
      errors.password = "비밀번호는 6자 이상이어야 합니다.";
    }
    
    setFieldErrors(errors);
    return Object.keys(errors).length === 0;
  };

  // 관리자 계정 생성 함수
  const handleAdminSignup = async () => {
    if (!id.includes('@')) {
      setError("관리자 계정은 이메일 형식이어야 합니다.");
      return;
    }

    setAdminSignupLoading(true);
    setError("");

    try {
      await signup(id, password);
      setError("관리자 계정이 생성되었습니다. 로그인해주세요.");
      setShowAdminSignup(false);
    } catch (error) {
      console.error("관리자 계정 생성 오류:", error);
      let errorMessage = "";
      
      switch (error.code) {
        case "auth/email-already-in-use":
          errorMessage = "이미 등록된 이메일입니다. 로그인을 시도해주세요.";
          break;
        case "auth/invalid-email":
          errorMessage = "올바르지 않은 이메일 형식입니다.";
          break;
        case "auth/weak-password":
          errorMessage = "비밀번호가 너무 약합니다. 6자 이상 입력해주세요.";
          break;
        default:
          errorMessage = "관리자 계정 생성 중 오류가 발생했습니다.";
      }
      
      setError(errorMessage);
    } finally {
      setAdminSignupLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    setFieldErrors({});

    // 입력 검증
    if (!validateInputs()) {
      setLoading(false);
      return;
    }

    try {
      console.log("로그인 시도:", { username: id, hasPassword: !!password });
      
      // 관리자 이메일인지 확인 (이메일 형식이면 그대로 사용)
      const isAdminEmail = id.includes('@');
      const loginEmail = isAdminEmail ? id : `${id}@tapgol.local`;
      
      await login(loginEmail, password);
      console.log("로그인 성공!");
      navigate(from, { replace: true });
    } catch (error) {
      console.error("로그인 오류:", error);
      console.error("오류 코드:", error.code);
      console.error("오류 메시지:", error.message);
      console.error("입력된 아이디:", id);
      console.error("Firebase Auth 도메인:", import.meta.env.VITE_FIREBASE_AUTH_DOMAIN);
      console.error("Firebase 프로젝트 ID:", import.meta.env.VITE_FIREBASE_PROJECT_ID);
      
      // 상세한 오류 메시지
      let errorMessage = "";
      let errorType = "error";
      
      switch (error.code) {
        case "auth/user-not-found":
          errorMessage = "존재하지 않는 아이디입니다. 회원가입을 먼저 진행해주세요.";
          errorType = "warning";
          break;
        case "auth/wrong-password":
          errorMessage = "비밀번호가 올바르지 않습니다. 비밀번호를 다시 확인해주세요.";
          errorType = "error";
          break;
        case "auth/invalid-email":
          errorMessage = "유효하지 않은 아이디 형식입니다. 아이디 형식을 확인해주세요.";
          errorType = "error";
          break;
        case "auth/user-disabled":
          errorMessage = "비활성화된 계정입니다. 관리자에게 문의해주세요.";
          errorType = "warning";
          break;
        case "auth/too-many-requests":
          errorMessage = "너무 많은 로그인 시도가 있었습니다. 15분 후에 다시 시도해주세요.";
          errorType = "warning";
          break;
        case "auth/network-request-failed":
          errorMessage = "네트워크 연결을 확인해주세요. 인터넷 연결 상태를 점검해주세요.";
          errorType = "error";
          break;
        case "auth/operation-not-allowed":
          errorMessage = "아이디/비밀번호 로그인이 비활성화되어 있습니다.";
          errorType = "error";
          break;
        case "auth/invalid-credential":
          // 관리자 이메일인 경우 특별한 안내
          if (id.includes('@')) {
            errorMessage = "관리자 이메일 또는 비밀번호가 올바르지 않습니다.\n\n💡 관리자 계정 해결 방법:\n• Firebase Console에서 계정 생성\n• 비밀번호 재설정\n• 계정이 비활성화되지 않았는지 확인\n• 이메일 주소가 정확한지 확인";
            setShowAdminSignup(true); // 관리자 계정 생성 버튼 표시
          } else {
            errorMessage = "아이디 또는 비밀번호가 올바르지 않습니다. 다시 확인해주세요.\n\n💡 해결 방법:\n• 아이디가 정확한지 확인\n• 비밀번호가 올바른지 확인\n• 회원가입이 되어 있는지 확인\n• 비밀번호 재설정을 시도해보세요";
          }
          errorType = "error";
          break;
        default:
          errorMessage = `로그인 중 오류가 발생했습니다. (${error.code || '알 수 없는 오류'}) 잠시 후 다시 시도해주세요.`;
          errorType = "error";
      }
      
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  // 입력 필드 변경 시 오류 메시지 초기화
  const handleInputChange = (field, value) => {
    if (fieldErrors[field]) {
      setFieldErrors(prev => ({ ...prev, [field]: "" }));
    }
    if (error) {
      setError("");
    }
    
    // 관리자 계정 생성 버튼 숨기기
    if (showAdminSignup) {
      setShowAdminSignup(false);
    }
    
    if (field === 'id') {
      setId(value);
    } else if (field === 'password') {
      setPassword(value);
    }
  };

  const getErrorStyle = (type) => {
    switch (type) {
      case "warning":
        return "bg-yellow-100 border-yellow-400 text-yellow-700";
      case "error":
      default:
        return "bg-red-100 border-red-400 text-red-700";
    }
  };

  // 비밀번호 재설정
  const handlePasswordReset = async (e) => {
    e.preventDefault();
    setResetLoading(true);
    setResetMessage("");

    try {
      // 관리자 이메일인지 확인 (이메일 형식이면 그대로 사용)
      const isAdminEmail = resetEmail.includes('@');
      const emailFormat = isAdminEmail ? resetEmail : `${resetEmail}@tapgol.local`;
      
      await sendPasswordResetEmail(auth, emailFormat);
      setResetMessage("비밀번호 재설정 이메일이 전송되었습니다. 이메일을 확인해주세요.");
      setResetEmail("");
    } catch (error) {
      console.error("비밀번호 재설정 오류:", error);
      let errorMessage = "";
      
      switch (error.code) {
        case "auth/user-not-found":
          errorMessage = "존재하지 않는 아이디입니다.";
          break;
        case "auth/invalid-email":
          errorMessage = "유효하지 않은 아이디 형식입니다.";
          break;
        case "auth/too-many-requests":
          errorMessage = "너무 많은 요청이 있었습니다. 잠시 후 다시 시도해주세요.";
          break;
        default:
          errorMessage = "비밀번호 재설정 중 오류가 발생했습니다.";
      }
      setResetMessage(errorMessage);
    } finally {
      setResetLoading(false);
    }
  };

  // 이메일 찾기 (간단한 안내 메시지)
  const handleEmailFind = () => {
    setResetMessage("이메일을 찾으려면 관리자에게 문의해주세요. 연락처: 010-4222-2466");
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-amber-50 via-orange-50 to-amber-100 relative z-10">
      <div className="bg-white p-8 rounded-lg shadow-md w-full max-w-md">
        <h2 className="text-2xl font-bold text-center text-amber-700 mb-6">
          로그인
        </h2>


        {error && (
          <div className={`border px-4 py-3 rounded mb-4 ${getErrorStyle(error.includes("존재하지 않는") || error.includes("비활성화") || error.includes("15분") ? "warning" : "error")}`}>
            <div className="flex items-start">
              <div className="flex-shrink-0">
                {error.includes("존재하지 않는") || error.includes("비활성화") || error.includes("15분") ? (
                  <svg className="h-5 w-5 text-yellow-400" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                  </svg>
                ) : (
                  <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                  </svg>
                )}
              </div>
              <div className="ml-3">
                <p className="text-sm">{error}</p>
              </div>
            </div>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* 아이디/이메일 입력 */}
          <div>
            <label className="block text-gray-700 mb-1" htmlFor="login-id">
              {id.includes('@') ? '이메일' : '아이디'}
            </label>
            <input
              id="login-id"
              type={id.includes('@') ? 'email' : 'text'}
              value={id}
              onChange={(e) => handleInputChange('id', e.target.value)}
              className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring focus:ring-amber-300 ${
                fieldErrors.id ? 'border-red-500' : 'border-gray-300'
              }`}
              placeholder={id.includes('@') ? '이메일을 입력하세요' : '아이디를 입력하세요'}
              required
            />
            {fieldErrors.id && (
              <p className="text-red-500 text-sm mt-1">{fieldErrors.id}</p>
            )}
          </div>

          {/* 비밀번호 입력 */}
          <div>
            <label className="block text-gray-700 mb-1" htmlFor="login-pw">
              비밀번호
            </label>
            <input
              id="login-pw"
              type="password"
              value={password}
              onChange={(e) => handleInputChange('password', e.target.value)}
              className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring focus:ring-amber-300 ${
                fieldErrors.password ? 'border-red-500' : 'border-gray-300'
              }`}
              placeholder="비밀번호를 입력하세요"
              required
            />
            {fieldErrors.password && (
              <p className="text-red-500 text-sm mt-1">{fieldErrors.password}</p>
            )}
          </div>

          {/* 로그인 버튼 */}
          <button
            type="submit"
            disabled={loading}
            className="w-full bg-amber-700 hover:bg-amber-800 disabled:opacity-60 text-white py-2 rounded-lg transition"
          >
            {loading ? (
              <div className="flex items-center justify-center">
                <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                로그인 중...
              </div>
            ) : (
              "로그인"
            )}
          </button>

          {/* 관리자 계정 생성 버튼 */}
          {showAdminSignup && id.includes('@') && (
            <button
              type="button"
              onClick={handleAdminSignup}
              disabled={adminSignupLoading || loading}
              className="w-full bg-blue-600 hover:bg-blue-700 disabled:opacity-60 text-white py-2 rounded-lg transition mt-2"
            >
              {adminSignupLoading ? (
                <div className="flex items-center justify-center">
                  <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  관리자 계정 생성 중...
                </div>
              ) : (
                "관리자 계정 생성"
              )}
            </button>
          )}
        </form>

        {/* 비밀번호 재설정 및 아이디 찾기 */}
        <div className="mt-4 text-center space-y-2">
          <div className="flex space-x-2">
            <button
              onClick={() => setShowPasswordReset(true)}
              className="flex-1 text-sm text-blue-600 hover:text-blue-800 underline"
            >
              비밀번호 재설정
            </button>
            <button
              onClick={() => setShowIdFind(true)}
              className="flex-1 text-sm text-blue-600 hover:text-blue-800 underline"
            >
              아이디 찾기
            </button>
          </div>
          <p className="text-xs text-gray-500 mt-2">
            로그인에 문제가 있으시면 위의 버튼을 이용하거나 관리자에게 문의해주세요.
          </p>
          
        </div>

        {/* 가입하기 버튼 */}
        <div className="mt-4 text-center">
          <p className="text-gray-600">아직 계정이 없으신가요?</p>
          <button
            onClick={() => navigate("/signup")}
            className="mt-2 w-full bg-amber-100 hover:bg-amber-200 text-amber-800 py-2 rounded-lg transition"
          >
            가입하기
          </button>
        </div>
      </div>

      {/* 비밀번호 재설정 모달 */}
      {showPasswordReset && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-lg shadow-lg w-full max-w-md mx-4">
            <h3 className="text-lg font-bold text-amber-700 mb-4">비밀번호 재설정</h3>
            <p className="text-gray-600 mb-4">
              {resetEmail.includes('@') 
                ? '이메일을 입력하시면 비밀번호 재설정 이메일을 보내드립니다.' 
                : '아이디를 입력하시면 비밀번호 재설정 이메일을 보내드립니다.'}
            </p>
            
            <form onSubmit={handlePasswordReset} className="space-y-4">
              <div>
                <label className="block text-gray-700 mb-1">
                  {resetEmail.includes('@') ? '이메일' : '아이디'}
                </label>
                <input
                  type={resetEmail.includes('@') ? 'email' : 'text'}
                  value={resetEmail}
                  onChange={(e) => setResetEmail(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring focus:ring-amber-300"
                  placeholder={resetEmail.includes('@') ? '이메일을 입력하세요' : '아이디를 입력하세요'}
                  required
                />
              </div>
              
              {resetMessage && (
                <div className={`p-3 rounded ${
                  resetMessage.includes("전송되었습니다") 
                    ? "bg-green-100 text-green-700" 
                    : "bg-red-100 text-red-700"
                }`}>
                  {resetMessage}
                </div>
              )}
              
              <div className="flex space-x-2">
                <button
                  type="button"
                  onClick={() => {
                    setShowPasswordReset(false);
                    setResetMessage("");
                    setResetEmail("");
                  }}
                  className="flex-1 bg-gray-300 hover:bg-gray-400 text-gray-700 py-2 rounded-lg transition"
                >
                  취소
                </button>
                <button
                  type="submit"
                  disabled={resetLoading}
                  className="flex-1 bg-amber-700 hover:bg-amber-800 disabled:opacity-60 text-white py-2 rounded-lg transition"
                >
                  {resetLoading ? "전송 중..." : "이메일 전송"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 아이디 찾기 모달 */}
      {showIdFind && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-lg shadow-lg w-full max-w-md mx-4">
            <h3 className="text-lg font-bold text-amber-700 mb-4">아이디 찾기</h3>
            <p className="text-gray-600 mb-4">아이디를 찾으려면 관리자에게 문의해주세요.</p>
            
                                  <div className="bg-blue-50 p-4 rounded-lg mb-4">
                        <p className="text-blue-800 font-medium">관리자 연락처</p>
                        <p className="text-blue-700">전화: 010-4222-2466</p>
                        <p className="text-blue-700">이메일: admin@tapgol.com</p>
                      </div>
            
            <button
              onClick={() => setShowIdFind(false)}
              className="w-full bg-amber-700 hover:bg-amber-800 text-white py-2 rounded-lg transition"
            >
              확인
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default Login;
