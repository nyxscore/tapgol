import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { auth } from "../util/firebase";
import { updateProfile, onAuthStateChanged, deleteUser } from "firebase/auth";
import { signOut } from "firebase/auth";
import { getUserProfile, updateUserProfile, deleteUserAccount } from "../util/userService";

const Profile = () => {
  const [user, setUser] = useState(null);
  const [userData, setUserData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [deleting, setDeleting] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const navigate = useNavigate();

  const interests = [
    "탁구", "바둑", "장기", "고스톱", "노래방", "운동", "독서", "게임", "음악", "영화"
  ];

  const [form, setForm] = useState({
    name: "",
    nickname: "",
    phone: "",
    birthDate: "",
    gender: "",
    address: "",
    interests: []
  });

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      if (currentUser) {
        // 사용자 객체가 유효한지 확인
        try {
          // getIdToken을 호출하여 사용자 객체가 유효한지 테스트
          await currentUser.getIdToken(true);
          setUser(currentUser);
          
          // Firestore에서 추가 사용자 정보 가져오기
          try {
            const userProfile = await getUserProfile(currentUser.uid);
            setUserData(userProfile);
            setForm({
              name: userProfile.name || currentUser.displayName || "",
              nickname: userProfile.nickname || "",
              phone: userProfile.phone || "",
              birthDate: userProfile.birthDate || "",
              gender: userProfile.gender || "",
              address: userProfile.address || "",
              interests: userProfile.interests || []
            });
          } catch (error) {
            console.error("사용자 정보 로드 오류:", error);
            setForm({
              name: currentUser.displayName || "",
              nickname: "",
              phone: "",
              birthDate: "",
              gender: "",
              address: "",
              interests: []
            });
          }
        } catch (authError) {
          console.error("사용자 인증 오류:", authError);
          setError("사용자 인증에 문제가 있습니다. 다시 로그인해주세요.");
          // 인증에 문제가 있으면 로그아웃 처리
          await signOut(auth);
          navigate("/login");
          return;
        }
      } else {
        // 로그인되지 않은 경우 로그인 페이지로 이동
        navigate("/login");
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, [navigate]);

  const handleChange = (e) => {
    const { name, value, type } = e.target;
    
    if (type === 'checkbox') {
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
    } else {
      setForm({ ...form, [name]: value });
    }
  };

  const handleEdit = () => {
    setEditing(true);
    setError("");
    setSuccess("");
  };

  const handleCancel = () => {
    setEditing(false);
    // 원래 데이터로 복원
    setForm({
      name: userData?.name || user?.displayName || "",
      nickname: userData?.nickname || "",
      phone: userData?.phone || "",
      birthDate: userData?.birthDate || "",
      gender: userData?.gender || "",
      address: userData?.address || "",
      interests: userData?.interests || []
    });
    setError("");
    setSuccess("");
  };

  const handleSave = async () => {
    setLoading(true);
    setError("");
    setSuccess("");

    try {
      // 현재 사용자 상태 재확인
      const currentUser = auth.currentUser;
      if (!currentUser) {
        throw new Error("사용자가 로그인되지 않았습니다.");
      }

      // 사용자 객체 유효성 재확인
      try {
        await currentUser.getIdToken(true);
      } catch (authError) {
        throw new Error("사용자 인증이 만료되었습니다. 다시 로그인해주세요.");
      }

      // Firebase Auth 프로필 업데이트 (선택적)
      if (form.name !== currentUser.displayName) {
        try {
          await updateProfile(currentUser, {
            displayName: form.name,
          });
        } catch (profileError) {
          console.warn("프로필 업데이트 실패:", profileError);
          // 프로필 업데이트가 실패해도 Firestore 업데이트는 계속 진행
        }
      }

      // Firestore 사용자 정보 업데이트
      await updateUserProfile(currentUser.uid, {
        name: form.name,
        nickname: form.nickname,
        phone: form.phone,
        birthDate: form.birthDate,
        gender: form.gender,
        address: form.address,
        interests: form.interests,
        profileComplete: true
      });

      setSuccess("회원정보가 성공적으로 수정되었습니다!");
      setEditing(false);
      
      // 사용자 상태 업데이트
      setUser({ ...currentUser, displayName: form.name });
      setUserData({
        ...userData,
        name: form.name,
        nickname: form.nickname,
        phone: form.phone,
        birthDate: form.birthDate,
        gender: form.gender,
        address: form.address,
        interests: form.interests,
        profileComplete: true
      });
    } catch (error) {
      console.error("회원정보 수정 오류:", error);
      
      // 사용자 친화적인 오류 메시지
      let errorMessage = "회원정보 수정 중 오류가 발생했습니다.";
      
      if (error.message.includes("인증이 만료")) {
        errorMessage = "로그인 세션이 만료되었습니다. 다시 로그인해주세요.";
        // 자동으로 로그인 페이지로 이동
        setTimeout(() => {
          signOut(auth);
          navigate("/login");
        }, 2000);
      } else if (error.message.includes("로그인되지 않았습니다")) {
        errorMessage = "로그인이 필요합니다.";
        navigate("/login");
      } else {
        errorMessage += " " + error.message;
      }
      
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = async () => {
    try {
      await signOut(auth);
      navigate("/");
    } catch (error) {
      console.error("로그아웃 오류:", error);
      setError("로그아웃 중 오류가 발생했습니다.");
    }
  };

  const handleDeleteAccount = async () => {
    if (!showDeleteConfirm) {
      setShowDeleteConfirm(true);
      return;
    }

    if (!window.confirm("정말로 회원탈퇴를 진행하시겠습니까?\n\n⚠️ 주의사항:\n• 모든 게시글, 댓글, 업로드 파일이 영구적으로 삭제됩니다\n• 복구가 불가능합니다\n• 탈퇴 후에는 같은 아이디로 재가입할 수 있습니다\n\n계속하시겠습니까?")) {
      setShowDeleteConfirm(false);
      return;
    }

    setDeleting(true);
    setError("");
    setSuccess("");

    try {
      // 1. Firestore의 모든 사용자 데이터 삭제
      await deleteUserAccount(user.uid);
      
      // 2. Firebase Auth 계정 삭제
      await deleteUser(user);
      
      // 3. 성공 메시지 표시 후 메인 페이지로 이동
      setSuccess("회원탈퇴가 완료되었습니다. 이용해주셔서 감사했습니다.");
      
      setTimeout(() => {
        navigate("/");
      }, 2000);
      
    } catch (error) {
      console.error("회원탈퇴 오류:", error);
      
      let errorMessage = "회원탈퇴 처리 중 오류가 발생했습니다.";
      
      if (error.message.includes("requires-recent-login")) {
        errorMessage = "보안을 위해 최근에 로그인한 기록이 필요합니다. 다시 로그인 후 시도해주세요.";
        // 로그아웃 후 로그인 페이지로 이동
        setTimeout(() => {
          signOut(auth);
          navigate("/login");
        }, 3000);
      } else if (error.message.includes("인증이 만료")) {
        errorMessage = "로그인 세션이 만료되었습니다. 다시 로그인해주세요.";
        setTimeout(() => {
          signOut(auth);
          navigate("/login");
        }, 2000);
      } else {
        errorMessage += " " + error.message;
      }
      
      setError(errorMessage);
      setShowDeleteConfirm(false);
    } finally {
      setDeleting(false);
    }
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

  if (!user) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-amber-50 via-orange-50 to-amber-100 pb-20">
      <div className="max-w-4xl mx-auto p-6">
        {/* 헤더 */}
        <div className="bg-white rounded-2xl shadow-xl p-6 mb-6">
          <h1 className="text-3xl font-bold text-amber-700 mb-2 text-center">
            내 정보
          </h1>
          <p className="text-gray-600 text-center">
            회원정보를 확인하고 수정할 수 있습니다
          </p>
        </div>

        {/* 오류/성공 메시지 */}
        {error && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
            <div className="flex items-start">
              <div className="flex-shrink-0">
                <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                </svg>
              </div>
              <div className="ml-3">
                <p className="text-sm">{error}</p>
              </div>
            </div>
          </div>
        )}
        
        {success && (
          <div className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded mb-4">
            <div className="flex items-start">
              <div className="flex-shrink-0">
                <svg className="h-5 w-5 text-green-400" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
              </div>
              <div className="ml-3">
                <p className="text-sm">{success}</p>
              </div>
            </div>
          </div>
        )}

        {/* 프로필 정보 */}
        <div className="bg-white rounded-2xl shadow-xl p-6 mb-6">
          <div className="flex items-center mb-6">
            <div className="w-20 h-20 bg-gradient-to-br from-amber-400 to-orange-500 rounded-full flex items-center justify-center text-white text-2xl font-bold mr-4">
              {user.displayName ? user.displayName.charAt(0) : user.email?.charAt(0) || "U"}
            </div>
            <div>
              <h2 className="text-xl font-bold text-gray-800">
                {user.displayName || "사용자"}
              </h2>
              <p className="text-gray-600">{user.email}</p>
              <p className="text-sm text-gray-500">
                가입일: {user.metadata?.creationTime 
                  ? new Date(user.metadata.creationTime).toLocaleDateString('ko-KR')
                  : "알 수 없음"
                }
              </p>
            </div>
          </div>

          {/* 기본 정보 섹션 */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                이름 *
              </label>
              {editing ? (
                <input
                  type="text"
                  name="name"
                  value={form.name}
                  onChange={handleChange}
                  className="w-full border border-gray-300 rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-amber-400"
                  placeholder="이름을 입력하세요"
                />
              ) : (
                <p className="text-gray-800 py-3">{form.name || "미설정"}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                별명 *
              </label>
              {editing ? (
                <input
                  type="text"
                  name="nickname"
                  value={form.nickname}
                  onChange={handleChange}
                  className="w-full border border-gray-300 rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-amber-400"
                  placeholder="별명을 입력하세요"
                />
              ) : (
                <p className="text-gray-800 py-3">{form.nickname || "미설정"}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                전화번호 *
              </label>
              {editing ? (
                <input
                  type="tel"
                  name="phone"
                  value={form.phone}
                  onChange={handleChange}
                  className="w-full border border-gray-300 rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-amber-400"
                  placeholder="010-1234-5678"
                />
              ) : (
                <p className="text-gray-800 py-3">{form.phone || "미설정"}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                생년월일
              </label>
              {editing ? (
                <input
                  type="date"
                  name="birthDate"
                  value={form.birthDate}
                  onChange={handleChange}
                  className="w-full border border-gray-300 rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-amber-400"
                />
              ) : (
                <p className="text-gray-800 py-3">
                  {form.birthDate ? new Date(form.birthDate).toLocaleDateString('ko-KR') : "미설정"}
                </p>
              )}
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                성별
              </label>
              {editing ? (
                <select
                  name="gender"
                  value={form.gender}
                  onChange={handleChange}
                  className="w-full border border-gray-300 rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-amber-400"
                >
                  <option value="">선택하세요</option>
                  <option value="male">남성</option>
                  <option value="female">여성</option>
                  <option value="other">기타</option>
                </select>
              ) : (
                <p className="text-gray-800 py-3">
                  {form.gender === 'male' ? '남성' : 
                   form.gender === 'female' ? '여성' : 
                   form.gender === 'other' ? '기타' : '미설정'}
                </p>
              )}
            </div>

            <div className="md:col-span-2">
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                주소
              </label>
              {editing ? (
                <input
                  type="text"
                  name="address"
                  value={form.address}
                  onChange={handleChange}
                  className="w-full border border-gray-300 rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-amber-400"
                  placeholder="서울시 종로구 탑골공원"
                />
              ) : (
                <p className="text-gray-800 py-3">{form.address || "미설정"}</p>
              )}
            </div>
          </div>

          {/* 관심사 섹션 */}
          <div className="border-t pt-6">
            <label className="block text-sm font-semibold text-gray-700 mb-4">
              관심사
            </label>
            {editing ? (
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
            ) : (
              <div className="flex flex-wrap gap-2">
                {form.interests.length > 0 ? (
                  form.interests.map((interest) => (
                    <span
                      key={interest}
                      className="bg-amber-100 text-amber-800 px-3 py-1 rounded-full text-sm"
                    >
                      {interest}
                    </span>
                  ))
                ) : (
                  <p className="text-gray-500">관심사가 설정되지 않았습니다.</p>
                )}
              </div>
            )}
          </div>
        </div>

        {/* 액션 버튼들 */}
        <div className="space-y-4">
          {editing ? (
            <div className="flex space-x-4">
              <button
                onClick={handleSave}
                disabled={loading}
                className="flex-1 bg-amber-700 text-white font-semibold py-3 px-6 rounded-lg hover:bg-amber-800 transition-colors disabled:bg-gray-400"
              >
                {loading ? "저장 중..." : "저장"}
              </button>
              <button
                onClick={handleCancel}
                disabled={loading}
                className="flex-1 bg-gray-500 text-white font-semibold py-3 px-6 rounded-lg hover:bg-gray-600 transition-colors disabled:bg-gray-400"
              >
                취소
              </button>
            </div>
          ) : (
            <button
              onClick={handleEdit}
              className="w-full bg-amber-700 text-white font-semibold py-3 px-6 rounded-lg hover:bg-amber-800 transition-colors"
            >
              정보 수정
            </button>
          )}

          <button
            onClick={handleLogout}
            className="w-full bg-red-600 text-white font-semibold py-3 px-6 rounded-lg hover:bg-red-700 transition-colors"
          >
            로그아웃
          </button>

          {/* 회원탈퇴 버튼 */}
          <div className="border-t pt-4">
            <button
              onClick={handleDeleteAccount}
              disabled={deleting}
              className={`w-full font-semibold py-3 px-6 rounded-lg transition-colors ${
                deleting
                  ? "bg-gray-400 text-white cursor-not-allowed"
                  : showDeleteConfirm
                  ? "bg-red-700 text-white hover:bg-red-800"
                  : "bg-red-100 text-red-700 hover:bg-red-200"
              }`}
            >
              {deleting ? (
                <div className="flex items-center justify-center">
                  <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  탈퇴 처리 중...
                </div>
              ) : showDeleteConfirm ? (
                "정말 탈퇴하시겠습니까?"
              ) : (
                "회원탈퇴"
              )}
            </button>
            {showDeleteConfirm && !deleting && (
              <p className="text-sm text-red-600 mt-2 text-center">
                ⚠️ 탈퇴 시 모든 데이터가 영구적으로 삭제됩니다
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Profile;
