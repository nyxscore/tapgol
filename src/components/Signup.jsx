import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { createUserWithEmailAndPassword, updateProfile } from "firebase/auth";
import { doc, setDoc, serverTimestamp } from "firebase/firestore";
import { auth, db } from "../util/firebase";

const Signup = () => {
  const [form, setForm] = useState({
    id: "",
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
  const navigate = useNavigate();

  const interests = [
    "탁구", "바둑", "장기", "고스톱", "노래방", "운동", "독서", "게임", "음악", "영화"
  ];

  const handleChange = (e) => {
    const { name, value, type, files } = e.target;
    
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
    if (form.password.length < 6) {
      setError("비밀번호는 6자 이상이어야 합니다.");
      return false;
    }

    if (form.password !== form.passwordConfirm) {
      setError("비밀번호가 일치하지 않습니다.");
      return false;
    }

    if (form.id.length < 3) {
      setError("아이디는 3자 이상이어야 합니다.");
      return false;
    }

    // 전화번호 검증 - 더 유연한 형식 지원
    const phoneRegex = /^[0-9]{2,3}-?[0-9]{3,4}-?[0-9]{4}$/;
    if (!phoneRegex.test(form.phone)) {
      setError("전화번호 형식이 올바르지 않습니다. (예: 010-1234-5678, 01012345678, 02-1234-5678)");
      return false;
    }

    if (!form.name.trim()) {
      setError("이름을 입력해주세요.");
      return false;
    }

    if (!form.nickname.trim()) {
      setError("별명을 입력해주세요.");
      return false;
    }

    return true;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    if (!validateForm()) {
      setLoading(false);
      return;
    }

    try {
      // Firebase에 사용자 계정 생성
      const userCredential = await createUserWithEmailAndPassword(
        auth,
        form.id + "@tapgol.com",
        form.password
      );

      // 사용자 프로필 업데이트
      await updateProfile(userCredential.user, {
        displayName: form.name,
        photoURL: null
      });

      // Firestore에 상세 사용자 정보 저장
      const userData = {
        userId: form.id,
        name: form.name,
        nickname: form.nickname,
        phone: form.phone,
        email: form.id + "@tapgol.com",
        birthDate: form.birthDate || null,
        gender: form.gender || null,
        address: form.address || null,
        interests: form.interests,
        profileImage: form.profileImage ? form.profileImage.name : null,
        isActive: true,
        role: "user",
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
        lastLoginAt: serverTimestamp(),
        // 추가 메타데이터
        signupMethod: "email",
        emailVerified: false,
        profileComplete: true
      };

      await setDoc(doc(db, "users", userCredential.user.uid), userData);

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
    <div className="max-w-2xl mx-auto bg-white rounded-2xl shadow-xl p-8 mt-8">
      <h2 className="text-3xl font-bold text-amber-700 mb-6 text-center">
        탑골공원 회원가입
      </h2>
      
      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
          {error}
        </div>
      )}
      
      <form onSubmit={handleSubmit} className="space-y-6">
        {/* 기본 정보 섹션 */}
        <div className="bg-gray-50 p-6 rounded-lg">
          <h3 className="text-xl font-semibold text-gray-800 mb-4">기본 정보</h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-lg font-semibold mb-2" htmlFor="id">
                아이디 *
              </label>
              <input
                type="text"
                id="id"
                name="id"
                value={form.id}
                onChange={handleChange}
                className="w-full border border-amber-300 rounded-lg px-4 py-3 text-lg focus:outline-none focus:ring-2 focus:ring-amber-400"
                required
                placeholder="아이디를 입력하세요"
              />
            </div>
            
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
                className="w-full border border-amber-300 rounded-lg px-4 py-3 text-lg focus:outline-none focus:ring-2 focus:ring-amber-400"
                required
                placeholder="탑골짱"
              />
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
                className="w-full border border-amber-300 rounded-lg px-4 py-3 text-lg focus:outline-none focus:ring-2 focus:ring-amber-400"
                required
                placeholder="6자 이상 입력"
              />
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
                className="w-full border border-amber-300 rounded-lg px-4 py-3 text-lg focus:outline-none focus:ring-2 focus:ring-amber-400"
                required
                placeholder="비밀번호 재입력"
              />
            </div>
          </div>
        </div>

        {/* 개인 정보 섹션 */}
        <div className="bg-gray-50 p-6 rounded-lg">
          <h3 className="text-xl font-semibold text-gray-800 mb-4">개인 정보</h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-lg font-semibold mb-2" htmlFor="name">
                이름 *
              </label>
              <input
                type="text"
                id="name"
                name="name"
                value={form.name}
                onChange={handleChange}
                className="w-full border border-amber-300 rounded-lg px-4 py-3 text-lg focus:outline-none focus:ring-2 focus:ring-amber-400"
                required
                placeholder="홍길동"
              />
            </div>
            
            <div>
              <label className="block text-lg font-semibold mb-2" htmlFor="phone">
                전화번호 *
              </label>
              <input
                type="tel"
                id="phone"
                name="phone"
                value={form.phone}
                onChange={handleChange}
                className="w-full border border-amber-300 rounded-lg px-4 py-3 text-lg focus:outline-none focus:ring-2 focus:ring-amber-400"
                required
                placeholder="01012345678 또는 010-1234-5678"
                maxLength="13"
              />
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
              placeholder="서울시 종로구 탑골공원"
            />
          </div>
        </div>

        {/* 관심사 섹션 */}
        <div className="bg-gray-50 p-6 rounded-lg">
          <h3 className="text-xl font-semibold text-gray-800 mb-4">관심사 (선택)</h3>
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

        {/* 프로필 이미지 섹션 */}
        <div className="bg-gray-50 p-6 rounded-lg">
          <h3 className="text-xl font-semibold text-gray-800 mb-4">프로필 이미지 (선택)</h3>
          <input
            type="file"
            id="profileImage"
            name="profileImage"
            accept="image/*"
            onChange={handleChange}
            className="w-full border border-amber-300 rounded-lg px-4 py-3 text-lg focus:outline-none focus:ring-2 focus:ring-amber-400"
          />
          <p className="text-sm text-gray-600 mt-2">JPG, PNG, GIF 파일만 업로드 가능합니다.</p>
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
          {loading ? "가입 중..." : "회원가입 완료"}
        </button>
      </form>
    </div>
  );
};

export default Signup;
