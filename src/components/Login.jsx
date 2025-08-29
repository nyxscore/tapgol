// src/components/Login.jsx
import React, { useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";

const Login = () => {
  const [id, setId] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [fieldErrors, setFieldErrors] = useState({});

  const navigate = useNavigate();
  const location = useLocation();
  const from = location.state?.from || "/";
  const { login } = useAuth();

  // 입력 필드 검증
  const validateInputs = () => {
    const errors = {};
    
    // 아이디 검증
    if (!id.trim()) {
      errors.id = "아이디를 입력해주세요.";
    } else if (id.length < 3) {
      errors.id = "아이디는 3자 이상이어야 합니다.";
    } else if (!/^[a-zA-Z0-9가-힣]+$/.test(id)) {
      errors.id = "아이디는 영문, 숫자, 한글만 사용 가능합니다.";
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
      // AuthContext를 통한 로그인
      await login(id + "@tapgol.com", password);
      navigate(from, { replace: true });
    } catch (error) {
      console.error("로그인 오류:", error);
      
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
          errorMessage = "유효하지 않은 이메일 형식입니다. 아이디 형식을 확인해주세요.";
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
          errorMessage = "이메일/비밀번호 로그인이 비활성화되어 있습니다.";
          errorType = "error";
          break;
        case "auth/invalid-credential":
          errorMessage = "아이디 또는 비밀번호가 올바르지 않습니다.";
          errorType = "error";
          break;
        default:
          errorMessage = `로그인 중 오류가 발생했습니다. (${error.code}) 잠시 후 다시 시도해주세요.`;
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
          {/* ID 입력 */}
          <div>
            <label className="block text-gray-700 mb-1" htmlFor="login-id">
              아이디
            </label>
            <input
              id="login-id"
              type="text"
              value={id}
              onChange={(e) => handleInputChange('id', e.target.value)}
              className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring focus:ring-amber-300 ${
                fieldErrors.id ? 'border-red-500' : 'border-gray-300'
              }`}
              placeholder="아이디를 입력하세요"
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
        </form>

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
    </div>
  );
};

export default Login;
