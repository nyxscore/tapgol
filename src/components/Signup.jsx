import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { createUserWithEmailAndPassword, updateProfile } from "firebase/auth";
import { doc, setDoc } from "firebase/firestore";
import { auth, db } from "../util/firebase";

const Signup = () => {
  const [form, setForm] = useState({
    id: "",
    password: "",
    phone: "",
    name: "",
    nickname: "",
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const navigate = useNavigate();

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    // 기본 유효성 검사
    if (form.password.length < 6) {
      setError("비밀번호는 6자 이상이어야 합니다.");
      setLoading(false);
      return;
    }

    if (form.id.length < 3) {
      setError("아이디는 3자 이상이어야 합니다.");
      setLoading(false);
      return;
    }

    try {
      // Firebase에 사용자 계정 생성
      const userCredential = await createUserWithEmailAndPassword(
        auth,
        form.id + "@tapgol.com", // 이메일 형식으로 변환
        form.password
      );

      // 사용자 프로필 업데이트
      await updateProfile(userCredential.user, {
        displayName: form.name,
        photoURL: null
      });

      // 추가 사용자 정보를 Firestore에 저장 (선택사항)
      try {
        await setDoc(doc(db, "users", userCredential.user.uid), {
          userId: form.id,
          name: form.name,
          nickname: form.nickname,
          phone: form.phone,
          email: form.id + "@tapgol.com",
          createdAt: new Date(),
          updatedAt: new Date()
        });
      } catch (firestoreError) {
        console.warn("Firestore 저장 실패:", firestoreError);
        // Firestore 저장이 실패해도 계정 생성은 성공으로 처리
      }

             // 성공 메시지 표시 후 로그인 페이지로 이동
       setTimeout(() => {
         alert("가입이 완료되었습니다! 로그인 페이지로 이동합니다.");
         navigate("/login");
       }, 500);
         } catch (error) {
       console.error("회원가입 오류:", error);
       
       // 사용자 친화적인 오류 메시지
       let errorMessage = "회원가입 중 오류가 발생했습니다.";
       
       switch (error.code) {
         case "auth/email-already-in-use":
           errorMessage = "이미 사용 중인 아이디입니다.";
           break;
         case "auth/weak-password":
           errorMessage = "비밀번호는 6자 이상이어야 합니다.";
           break;
         case "auth/invalid-email":
           errorMessage = "유효하지 않은 이메일 형식입니다.";
           break;
         case "auth/operation-not-allowed":
           errorMessage = "이메일/비밀번호 로그인이 비활성화되어 있습니다.";
           break;
         case "auth/network-request-failed":
           errorMessage = "네트워크 연결을 확인해주세요.";
           break;
         case "auth/too-many-requests":
           errorMessage = "너무 많은 요청이 발생했습니다. 잠시 후 다시 시도해주세요.";
           break;
         default:
           errorMessage = `회원가입 중 오류가 발생했습니다: ${error.message}`;
       }
       
       setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-md mx-auto bg-white rounded-2xl shadow-xl p-8 mt-8">
      <h2 className="text-3xl font-bold text-amber-700 mb-6 text-center">
        간편 가입
      </h2>
      
      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
          {error}
        </div>
      )}
      
      <form onSubmit={handleSubmit} className="space-y-6">
        <div>
          <label className="block text-lg font-semibold mb-2" htmlFor="id">
            아이디
          </label>
          <input
            type="text"
            id="id"
            name="id"
            value={form.id}
            onChange={handleChange}
            className="w-full border border-amber-300 rounded-lg px-4 py-3 text-xl focus:outline-none focus:ring-2 focus:ring-amber-400"
            required
            placeholder="아이디를 입력하세요"
          />
        </div>
        <div>
          <label
            className="block text-lg font-semibold mb-2"
            htmlFor="password"
          >
            비밀번호
          </label>
          <input
            type="password"
            id="password"
            name="password"
            value={form.password}
            onChange={handleChange}
            className="w-full border border-amber-300 rounded-lg px-4 py-3 text-xl focus:outline-none focus:ring-2 focus:ring-amber-400"
            required
            placeholder="비밀번호를 입력하세요"
          />
        </div>
        <div>
          <label className="block text-lg font-semibold mb-2" htmlFor="phone">
            전화번호
          </label>
          <input
            type="tel"
            id="phone"
            name="phone"
            value={form.phone}
            onChange={handleChange}
            className="w-full border border-amber-300 rounded-lg px-4 py-3 text-xl focus:outline-none focus:ring-2 focus:ring-amber-400"
            required
            placeholder="010-1234-5678"
          />
        </div>
        <div>
          <label className="block text-lg font-semibold mb-2" htmlFor="name">
            이름
          </label>
          <input
            type="text"
            id="name"
            name="name"
            value={form.name}
            onChange={handleChange}
            className="w-full border border-amber-300 rounded-lg px-4 py-3 text-xl focus:outline-none focus:ring-2 focus:ring-amber-400"
            required
            placeholder="홍길동"
          />
        </div>
        <div>
          <label
            className="block text-lg font-semibold mb-2"
            htmlFor="nickname"
          >
            별명
          </label>
          <input
            type="text"
            id="nickname"
            name="nickname"
            value={form.nickname}
            onChange={handleChange}
            className="w-full border border-amber-300 rounded-lg px-4 py-3 text-xl focus:outline-none focus:ring-2 focus:ring-amber-400"
            required
            placeholder="탑골짱"
          />
        </div>
        <button
          type="submit"
          disabled={loading}
          className={`w-full text-xl font-bold py-4 rounded-lg transition-colors ${
            loading 
              ? "bg-gray-400 cursor-not-allowed" 
              : "bg-amber-700 hover:bg-amber-800"
          } text-white`}
        >
          {loading ? "가입 중..." : "가입하기"}
        </button>
      </form>
    </div>
  );
};

export default Signup;
