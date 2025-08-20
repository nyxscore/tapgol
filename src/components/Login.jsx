// src/components/Login.jsx
import React, { useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";

const Login = () => {
  const [id, setId] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  const navigate = useNavigate();
  const location = useLocation();
  const from = location.state?.from || "/";

  const handleSubmit = async (e) => {
    e.preventDefault();
    console.log("로그인 버튼 클릭됨");
    console.log("로그인 시도:", { id, password });

    setLoading(true);
    try {
      // TODO: 실제 로그인 API 호출
      // await api.login({ id, password });

      // 데모용 딜레이
      await new Promise((r) => setTimeout(r, 500));

      // 로그인 성공 시 이전 페이지 또는 홈으로 이동
      navigate(from, { replace: true });
    } catch (err) {
      console.error(err);
      alert("로그인 실패");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 relative z-10">
      <div className="bg-white p-8 rounded-lg shadow-md w-full max-w-md">
        <h2 className="text-2xl font-bold text-center text-gray-800 mb-6">
          로그인
        </h2>

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
            className="w-full bg-green-500 hover:bg-green-600 disabled:opacity-60 text-white py-2 rounded-lg transition"
          >
            {loading ? "로그인 중..." : "로그인"}
          </button>
        </form>

        {/* 가입하기 버튼 */}
        <div className="mt-4 text-center">
          <p className="text-gray-600">아직 계정이 없으신가요?</p>
          <button
            onClick={() => navigate("/signup")}
            className="mt-2 w-full bg-gray-100 hover:bg-gray-200 text-gray-800 py-2 rounded-lg transition"
          >
            가입하기
          </button>
        </div>
      </div>
    </div>
  );
};

export default Login;
