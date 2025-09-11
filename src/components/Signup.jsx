import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { createUserWithEmailAndPassword, updateProfile } from "firebase/auth";
import { doc, setDoc, serverTimestamp } from "firebase/firestore";
import { auth, db } from "../util/firebase";

const Signup = () => {
  const [form, setForm] = useState({
    email: "",
    password: "",
    passwordConfirm: "",
    phone: "",
    name: "",
    nickname: "",
    birthDate: "",
    gender: "",
    address: "",
    interests: [],
    profileImage: null
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [fieldErrors, setFieldErrors] = useState({});
  const navigate = useNavigate();

  const interests = [
    "탁구", "바둑", "장기", "고스톱", "노래자랑", "운동", "독서", "게임", "음악", "영화"
  ];

  const handleChange = (e) => {
    const { name, value, type, files } = e.target;
    
    // 필드 오류 메시지 초기화
    if (fieldErrors[name]) {
      setFieldErrors(prev => ({ ...prev, [name]: "" }));
    }
    if (error) {
      setError("");
    }
    
    if (type === 'file') {
      setForm({ ...form, [name]: files[0] });
    } else if (type === 'checkbox') {
      const checked = e.target.checked;
      if (checked) {
        setForm({ 
          ...form, 
          interests: [...form.interests, value]
        });
      } else {
        setForm({ 
          ...form, 
          interests: form.interests.filter(interest => interest !== value)
        });
      }
    } else if (name === 'phone') {
      // 전화번호 자동 포맷팅
      const phoneNumber = value.replace(/[^0-9]/g, '');
      let formattedPhone = '';
      
      if (phoneNumber.length <= 3) {
        formattedPhone = phoneNumber;
      } else if (phoneNumber.length <= 7) {
        formattedPhone = phoneNumber.slice(0, 3) + '-' + phoneNumber.slice(3);
      } else {
        formattedPhone = phoneNumber.slice(0, 3) + '-' + phoneNumber.slice(3, 7) + '-' + phoneNumber.slice(7, 11);
      }
      
      setForm({ ...form, [name]: formattedPhone });
    } else {
      setForm({ ...form, [name]: value });
    }
  };

  const validateForm = () => {
    const errors = {};

    // 이메일 검증
    if (!form.email.trim()) {
      errors.email = "이메일을 입력해주세요.";
    } else {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(form.email)) {
        errors.email = "올바른 이메일 형식을 입력해주세요.";
      }
    }

    // 비밀번호 검증
    if (!form.password) {
      errors.password = "비밀번호를 입력해주세요.";
    } else if (form.password.length < 6) {
      errors.password = "비밀번호는 6자 이상이어야 합니다.";
    } else if (!/(?=.*[a-zA-Z])(?=.*[0-9])/.test(form.password)) {
      errors.password = "비밀번호는 영문과 숫자를 포함해야 합니다.";
    }

    // 비밀번호 확인 검증
    if (!form.passwordConfirm) {
      errors.passwordConfirm = "비밀번호 확인을 입력해주세요.";
    } else if (form.password !== form.passwordConfirm) {
      errors.passwordConfirm = "비밀번호가 일치하지 않습니다.";
    }

    // 이름 검증 (선택사항)
    if (form.name.trim() && form.name.length < 2) {
      errors.name = "이름은 2자 이상이어야 합니다.";
    }

    // 별명 검증 (필수)
    if (!form.nickname.trim()) {
      errors.nickname = "별명을 입력해주세요.";
    } else if (form.nickname.length < 2) {
      errors.nickname = "별명은 2자 이상이어야 합니다.";
    }

    // 전화번호 검증 (선택사항)
    if (form.phone.trim()) {
      const phoneRegex = /^[0-9]{2,3}-?[0-9]{3,4}-?[0-9]{4}$/;
      if (!phoneRegex.test(form.phone)) {
        errors.phone = "전화번호 형식이 올바르지 않습니다. (예: 010-1234-5678)";
      }
    }

    setFieldErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    setFieldErrors({});

    if (!validateForm()) {
      setLoading(false);
      return;
    }

    try {
      // Firebase에 사용자 계정 생성
      const userCredential = await createUserWithEmailAndPassword(
        auth,
        form.email,
        form.password
      );

      // 사용자 프로필 업데이트
      await updateProfile(userCredential.user, {
        displayName: form.name || form.nickname || form.email.split('@')[0],
        photoURL: null
      });

      // Firestore에 상세 사용자 정보 저장
      const userData = {
        name: form.name || null,
        nickname: form.nickname,
        phone: form.phone || null,
        email: form.email,
        birthDate: form.birthDate || null,
        gender: form.gender || null,
        address: form.address || null,
        interests: form.interests || [],
        profileImage: form.profileImage ? form.profileImage.name : null,
        isActive: true,
        role: "user",
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
        lastLoginAt: serverTimestamp(),
        // 추가 메타데이터
        signupMethod: "email",
        emailVerified: false,
        profileComplete: true // 기본정보(이메일, 별명, 비밀번호)가 모두 필수이므로 항상 완성된 상태
      };

      await setDoc(doc(db, "users", userCredential.user.uid), userData);

      // 성공 메시지 표시 후 로그인 페이지로 이동
      setTimeout(() => {
        alert("가입이 완료되었습니다! 로그인 페이지로 이동합니다.");
        navigate("/login");
      }, 500);

    } catch (error) {
      console.error("회원가입 오류:", error);
      
      // 상세한 오류 메시지
      let errorMessage = "";
      let errorType = "error";
      
      switch (error.code) {
        case "auth/email-already-in-use":
          errorMessage = "이미 사용 중인 이메일입니다. 다른 이메일을 선택해주세요.";
          errorType = "warning";
          break;
        case "auth/weak-password":
          errorMessage = "비밀번호가 너무 약합니다. 영문과 숫자를 포함한 6자 이상으로 설정해주세요.";
          errorType = "error";
          break;
        case "auth/invalid-email":
          errorMessage = "유효하지 않은 이메일 형식입니다. 이메일 형식을 확인해주세요.";
          errorType = "error";
          break;
        case "auth/operation-not-allowed":
          errorMessage = "이메일/비밀번호 회원가입이 비활성화되어 있습니다.";
          errorType = "error";
          break;
        case "auth/network-request-failed":
          errorMessage = "네트워크 연결을 확인해주세요. 인터넷 연결 상태를 점검해주세요.";
          errorType = "error";
          break;
        case "auth/too-many-requests":
          errorMessage = "너무 많은 요청이 발생했습니다. 15분 후에 다시 시도해주세요.";
          errorType = "warning";
          break;
        case "auth/invalid-credential":
          errorMessage = "유효하지 않은 인증 정보입니다.";
          errorType = "error";
          break;
        default:
          errorMessage = `회원가입 중 오류가 발생했습니다. (${error.code}) 잠시 후 다시 시도해주세요.`;
          errorType = "error";
      }
      
      setError(errorMessage);
    } finally {
      setLoading(false);
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

  const getFieldErrorStyle = (fieldName) => {
    return fieldErrors[fieldName] ? 'border-red-500' : 'border-gray-300';
  };

  return (
    <div className="max-w-2xl mx-auto bg-white rounded-2xl shadow-xl p-8 mt-8">
      <h2 className="text-3xl font-bold text-amber-700 mb-6 text-center">
        탑골공원 회원가입
      </h2>
      
      {error && (
        <div className={`border px-4 py-3 rounded mb-4 ${getErrorStyle(error.includes("이미 사용 중인") || error.includes("15분") ? "warning" : "error")}`}>
          <div className="flex items-start">
            <div className="flex-shrink-0">
              {error.includes("이미 사용 중인") || error.includes("15분") ? (
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
      
      <form onSubmit={handleSubmit} className="space-y-6">
        {/* 기본 정보 섹션 */}
        <div className="bg-gray-50 p-6 rounded-lg">
          <h3 className="text-xl font-semibold text-gray-800 mb-4">기본 정보</h3>
          
          <div>
            <label className="block text-lg font-semibold mb-2" htmlFor="email">
              이메일 *
            </label>
            <input
              type="email"
              id="email"
              name="email"
              value={form.email}
              onChange={handleChange}
              className={`w-full border rounded-lg px-4 py-3 text-lg focus:outline-none focus:ring-2 focus:ring-amber-400 ${getFieldErrorStyle("email")}`}
              required
              placeholder="example@gmail.com"
            />
            {fieldErrors.email && <p className="text-sm text-red-500 mt-1">{fieldErrors.email}</p>}
          </div>

          <div className="mt-4">
            <div>
              <label className="block text-lg font-semibold mb-2" htmlFor="nickname">
                별명 *
              </label>
              <input
                type="text"
                id="nickname"
                name="nickname"
                value={form.nickname}
                onChange={handleChange}
                className={`w-full border rounded-lg px-4 py-3 text-lg focus:outline-none focus:ring-2 focus:ring-amber-400 ${getFieldErrorStyle("nickname")}`}
                required
                placeholder="탑골짱"
              />
              {fieldErrors.nickname && <p className="text-sm text-red-500 mt-1">{fieldErrors.nickname}</p>}
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
            <div>
              <label className="block text-lg font-semibold mb-2" htmlFor="password">
                비밀번호 *
              </label>
              <input
                type="password"
                id="password"
                name="password"
                value={form.password}
                onChange={handleChange}
                className={`w-full border rounded-lg px-4 py-3 text-lg focus:outline-none focus:ring-2 focus:ring-amber-400 ${getFieldErrorStyle("password")}`}
                required
                placeholder="6자 이상 입력"
              />
              {fieldErrors.password && <p className="text-sm text-red-500 mt-1">{fieldErrors.password}</p>}
            </div>
            
            <div>
              <label className="block text-lg font-semibold mb-2" htmlFor="passwordConfirm">
                비밀번호 확인 *
              </label>
              <input
                type="password"
                id="passwordConfirm"
                name="passwordConfirm"
                value={form.passwordConfirm}
                onChange={handleChange}
                className={`w-full border rounded-lg px-4 py-3 text-lg focus:outline-none focus:ring-2 focus:ring-amber-400 ${getFieldErrorStyle("passwordConfirm")}`}
                required
                placeholder="비밀번호 재입력"
              />
              {fieldErrors.passwordConfirm && <p className="text-sm text-red-500 mt-1">{fieldErrors.passwordConfirm}</p>}
            </div>
          </div>
        </div>

        {/* 개인 정보 섹션 */}
        <div className="bg-gray-50 p-6 rounded-lg">
          <h3 className="text-xl font-semibold text-gray-800 mb-4">개인 정보 (선택사항)</h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
                className={`w-full border rounded-lg px-4 py-3 text-lg focus:outline-none focus:ring-2 focus:ring-amber-400 ${getFieldErrorStyle("name")}`}
                placeholder="홍길동 (선택사항)"
              />
              {fieldErrors.name && <p className="text-sm text-red-500 mt-1">{fieldErrors.name}</p>}
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
                className={`w-full border rounded-lg px-4 py-3 text-lg focus:outline-none focus:ring-2 focus:ring-amber-400 ${getFieldErrorStyle("phone")}`}
                placeholder="010-1234-5678 (선택사항)"
                maxLength="13"
              />
              {fieldErrors.phone && <p className="text-sm text-red-500 mt-1">{fieldErrors.phone}</p>}
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
            <div>
              <label className="block text-lg font-semibold mb-2" htmlFor="birthDate">
                생년월일
              </label>
              <input
                type="date"
                id="birthDate"
                name="birthDate"
                value={form.birthDate}
                onChange={handleChange}
                className="w-full border border-amber-300 rounded-lg px-4 py-3 text-lg focus:outline-none focus:ring-2 focus:ring-amber-400"
              />
            </div>
            
            <div>
              <label className="block text-lg font-semibold mb-2" htmlFor="gender">
                성별
              </label>
              <select
                id="gender"
                name="gender"
                value={form.gender}
                onChange={handleChange}
                className="w-full border border-amber-300 rounded-lg px-4 py-3 text-lg focus:outline-none focus:ring-2 focus:ring-amber-400"
              >
                <option value="">선택하세요</option>
                <option value="male">남성</option>
                <option value="female">여성</option>
                <option value="other">기타</option>
              </select>
            </div>
          </div>

          <div className="mt-4">
            <label className="block text-lg font-semibold mb-2" htmlFor="address">
              주소
            </label>
            <input
              type="text"
              id="address"
              name="address"
              value={form.address}
              onChange={handleChange}
              className="w-full border border-amber-300 rounded-lg px-4 py-3 text-lg focus:outline-none focus:ring-2 focus:ring-amber-400"
              placeholder="서울시 종로구 탑골공원 (선택사항)"
            />
          </div>

          {/* 관심사 */}
          <div className="mt-6">
            <h4 className="text-lg font-semibold text-gray-800 mb-3">관심사</h4>
            <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
              {interests.map((interest) => (
                <label key={interest} className="flex items-center space-x-2 cursor-pointer">
                  <input
                    type="checkbox"
                    name="interests"
                    value={interest}
                    checked={form.interests.includes(interest)}
                    onChange={handleChange}
                    className="w-4 h-4 text-amber-600 border-amber-300 rounded focus:ring-amber-500"
                  />
                  <span className="text-sm">{interest}</span>
                </label>
              ))}
            </div>
          </div>

          {/* 프로필 이미지 */}
          <div className="mt-6">
            <h4 className="text-lg font-semibold text-gray-800 mb-3">프로필 이미지</h4>
            <input
              type="file"
              id="profileImage"
              name="profileImage"
              accept="image/*"
              onChange={handleChange}
              className="w-full border border-amber-300 rounded-lg px-4 py-3 text-lg focus:outline-none focus:ring-2 focus:ring-amber-400"
            />
            <p className="text-sm text-gray-600 mt-2">JPG, PNG, GIF 파일만 업로드 가능합니다. (선택사항)</p>
          </div>
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
          {loading ? (
            <div className="flex items-center justify-center">
              <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              가입 중...
            </div>
          ) : (
            "회원가입 완료"
          )}
        </button>
      </form>
    </div>
  );
};

export default Signup;
