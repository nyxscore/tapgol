// src/components/Login.jsx
import React, { useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { signInWithEmailAndPassword } from "firebase/auth";
import { auth } from "../util/firebase";

const Login = () => {
  const [id, setId] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const navigate = useNavigate();
  const location = useLocation();
  const from = location.state?.from || "/";

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      // Firebase 로그인
      await signInWithEmailAndPassword(auth, id + "@tapgol.com", password);
      navigate(from, { replace: true });
    } catch (error) {
      console.error("로그인 오류:", error);
      
      // 사용자 친화적인 오류 메시지
      let errorMessage = "로그인 중 오류가 발생했습니다.";
      
      switch (error.code) {
        case "auth/user-not-found":
          errorMessage = "존재하지 않는 아이디입니다.";
          break;
        case "auth/wrong-password":
          errorMessage = "비밀번호가 올바르지 않습니다.";
          break;
        case "auth/invalid-email":
          errorMessage = "유효하지 않은 이메일 형식입니다.";
          break;
        case "auth/user-disabled":
          errorMessage = "비활성화된 계정입니다.";
          break;
        case "auth/too-many-requests":
          errorMessage = "너무 많은 로그인 시도가 있었습니다. 잠시 후 다시 시도해주세요.";
          break;
        case "auth/network-request-failed":
          errorMessage = "네트워크 연결을 확인해주세요.";
          break;
      }
      
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-amber-50 via-orange-50 to-amber-100 relative z-10">
      <div className="bg-white p-8 rounded-lg shadow-md w-full max-w-md">
        <h2 className="text-2xl font-bold text-center text-amber-700 mb-6">
          로그인
        </h2>

        {error && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
            {error}
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
              onChange={(e) => setId(e.target.value)}
              className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring focus:ring-green-300"
              placeholder="아이디를 입력하세요"
              required
            />
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
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring focus:ring-green-300"
              placeholder="비밀번호를 입력하세요"
              required
            />
          </div>

          {/* 로그인 버튼 */}
          <button
            type="submit"
            disabled={loading}
            className="w-full bg-amber-700 hover:bg-amber-800 disabled:opacity-60 text-white py-2 rounded-lg transition"
          >
            {loading ? "로그인 중..." : "로그인"}
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
