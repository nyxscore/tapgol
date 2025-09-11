import React, { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { auth } from "../util/firebase";
import { updateProfile, updateEmail, onAuthStateChanged, deleteUser, reauthenticateWithCredential, EmailAuthProvider } from "firebase/auth";
import { signOut } from "firebase/auth";
import { getUserProfile, updateUserProfile, deleteUserAccount } from "../util/userService";
import { ref, uploadBytes, getDownloadURL, deleteObject } from "firebase/storage";
import { storage } from "../util/firebase";
import { FaCamera, FaTrash, FaEdit } from "react-icons/fa";

const Profile = () => {
  const [user, setUser] = useState(null);
  const [userData, setUserData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [deleting, setDeleting] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [showPasswordConfirm, setShowPasswordConfirm] = useState(false);
  const [deletePassword, setDeletePassword] = useState("");
  const [uploadingImage, setUploadingImage] = useState(false);
  const [imagePreview, setImagePreview] = useState(null);
  const fileInputRef = useRef(null);
  const navigate = useNavigate();

  const interests = [
    "탁구", "바둑", "장기", "고스톱", "노래자랑", "운동", "독서", "게임", "음악", "영화"
  ];

  const [form, setForm] = useState({
    name: "",
    email: "",
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
              email: currentUser.email || "",
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
              email: currentUser.email || "",
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

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      // 파일 크기 검증 (5MB 이하)
      if (file.size > 5 * 1024 * 1024) {
        setError("이미지 파일 크기는 5MB 이하여야 합니다.");
        return;
      }

      // 파일 타입 검증
      if (!file.type.startsWith('image/')) {
        setError("이미지 파일만 업로드 가능합니다.");
        return;
      }

      // 미리보기 생성
      const reader = new FileReader();
      reader.onload = (e) => {
        setImagePreview(e.target.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleImageUpload = async () => {
    if (!fileInputRef.current?.files[0]) {
      setError("업로드할 이미지를 선택해주세요.");
      return;
    }

    setUploadingImage(true);
    setError("");

    try {
      const file = fileInputRef.current.files[0];
      const currentUser = auth.currentUser;
      
      if (!currentUser) {
        throw new Error("사용자가 로그인되지 않았습니다.");
      }

      // 기존 프로필 이미지 삭제
      if (userData?.profileImage) {
        try {
          const oldImageRef = ref(storage, userData.profileImage);
          await deleteObject(oldImageRef);
        } catch (deleteError) {
          console.warn("기존 이미지 삭제 실패:", deleteError);
        }
      }

      // 새 이미지 업로드
      const imageRef = ref(storage, `profile-images/${currentUser.uid}/${Date.now()}_${file.name}`);
      const snapshot = await uploadBytes(imageRef, file);
      const downloadURL = await getDownloadURL(snapshot.ref);

      // Firebase Auth 프로필 업데이트
      await updateProfile(currentUser, {
        photoURL: downloadURL
      });

      // Firestore 사용자 정보 업데이트
      await updateUserProfile(currentUser.uid, {
        profileImage: downloadURL
      });

      // 상태 업데이트
      setUser({ ...currentUser, photoURL: downloadURL });
      setUserData(prev => ({ ...prev, profileImage: downloadURL }));
      setImagePreview(null);
      
      // 파일 입력 초기화
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }

      setSuccess("프로필 이미지가 성공적으로 업로드되었습니다!");
    } catch (error) {
      console.error("이미지 업로드 오류:", error);
      setError("이미지 업로드에 실패했습니다. 다시 시도해주세요.");
    } finally {
      setUploadingImage(false);
    }
  };

  const handleImageDelete = async () => {
    if (!userData?.profileImage) {
      setError("삭제할 프로필 이미지가 없습니다.");
      return;
    }

    setUploadingImage(true);
    setError("");

    try {
      const currentUser = auth.currentUser;
      
      if (!currentUser) {
        throw new Error("사용자가 로그인되지 않았습니다.");
      }

      // Storage에서 이미지 삭제
      const imageRef = ref(storage, userData.profileImage);
      await deleteObject(imageRef);

      // Firebase Auth 프로필 업데이트
      await updateProfile(currentUser, {
        photoURL: null
      });

      // Firestore 사용자 정보 업데이트
      await updateUserProfile(currentUser.uid, {
        profileImage: null
      });

      // 상태 업데이트
      setUser({ ...currentUser, photoURL: null });
      setUserData(prev => ({ ...prev, profileImage: null }));
      setImagePreview(null);

      setSuccess("프로필 이미지가 삭제되었습니다.");
    } catch (error) {
      console.error("이미지 삭제 오류:", error);
      setError("이미지 삭제에 실패했습니다. 다시 시도해주세요.");
    } finally {
      setUploadingImage(false);
    }
  };

  const handleEdit = () => {
    setEditing(true);
    setError("");
    setSuccess("");
  };

  const handleCancel = () => {
    setEditing(false);
    setImagePreview(null);
    // 원래 데이터로 복원
    setForm({
      name: userData?.name || user?.displayName || "",
      email: user?.email || "",
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
      // 이메일 검증
      if (!form.email.trim()) {
        throw new Error("이메일을 입력해주세요.");
      }
      
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(form.email)) {
        throw new Error("올바른 이메일 형식을 입력해주세요.");
      }

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

      // Firebase Auth 이메일 업데이트 (선택적)
      if (form.email !== currentUser.email) {
        try {
          await updateEmail(currentUser, form.email);
        } catch (emailError) {
          console.warn("이메일 업데이트 실패:", emailError);
          // 이메일 업데이트가 실패해도 Firestore 업데이트는 계속 진행
          if (emailError.code === 'auth/requires-recent-login') {
            throw new Error("이메일 변경을 위해 다시 로그인해주세요.");
          }
        }
      }

      // Firestore 사용자 정보 업데이트
      await updateUserProfile(currentUser.uid, {
        name: form.name,
        email: form.email,
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
      setUser({ ...currentUser, displayName: form.name, email: form.email });
      setUserData({
        ...userData,
        name: form.name,
        email: form.email,
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
      } else if (error.message.includes("본인의 데이터만")) {
        errorMessage = "본인의 데이터만 수정할 수 있습니다.";
      } else {
        errorMessage = error.message || errorMessage;
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

    if (!showPasswordConfirm) {
      setShowPasswordConfirm(true);
      return;
    }

    if (!deletePassword.trim()) {
      setError("비밀번호를 입력해주세요.");
      return;
    }

    if (!window.confirm("정말로 회원탈퇴를 진행하시겠습니까?\n\n⚠️ 주의사항:\n• 모든 게시글, 댓글, 업로드 파일이 영구적으로 삭제됩니다\n• 복구가 불가능합니다\n• 탈퇴 후에는 같은 이메일로 재가입할 수 있습니다\n\n계속하시겠습니까?")) {
      setShowDeleteConfirm(false);
      setShowPasswordConfirm(false);
      setDeletePassword("");
      return;
    }

    setDeleting(true);
    setError("");
    setSuccess("");

    try {
      const currentUser = auth.currentUser;
      if (!currentUser) {
        throw new Error("사용자가 로그인되지 않았습니다.");
      }

      // 1. 재인증 수행
      const credential = EmailAuthProvider.credential(currentUser.email, deletePassword);
      await reauthenticateWithCredential(currentUser, credential);

      // 2. Firestore의 모든 사용자 데이터 삭제
      await deleteUserAccount(user.uid);
      
      // 3. Firebase Auth 계정 삭제
      await deleteUser(currentUser);
      
      // 4. 성공 메시지 표시 후 메인 페이지로 이동
      setSuccess("회원탈퇴가 완료되었습니다. 이용해주셔서 감사했습니다.");
      
      setTimeout(() => {
        navigate("/");
      }, 2000);
      
    } catch (error) {
      console.error("회원탈퇴 오류:", error);
      
      let errorMessage = "회원탈퇴 처리 중 오류가 발생했습니다.";
      
      if (error.code === "auth/wrong-password") {
        errorMessage = "비밀번호가 올바르지 않습니다.";
      } else if (error.code === "auth/too-many-requests") {
        errorMessage = "너무 많은 시도가 있었습니다. 잠시 후 다시 시도해주세요.";
      } else if (error.code === "auth/requires-recent-login") {
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
        errorMessage += " " + (error.message || error.code);
      }
      
      setError(errorMessage);
      setShowDeleteConfirm(false);
      setShowPasswordConfirm(false);
      setDeletePassword("");
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
            <div className="relative mr-4">
              <div className="w-20 h-20 rounded-full overflow-hidden border-4 border-amber-200">
                {user.photoURL || userData?.profileImage ? (
                  <>
                    <img 
                      src={user.photoURL || userData?.profileImage} 
                      alt="Profile" 
                      className="w-full h-full object-cover"
                      onError={(e) => {
                        e.target.style.display = 'none';
                        e.target.nextSibling.style.display = 'flex';
                      }}
                    />
                    <div className="w-full h-full bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center text-white text-2xl font-bold" style={{ display: 'none' }}>
                      {user?.displayName ? user.displayName.charAt(0) : user?.email?.charAt(0) || "U"}
                    </div>
                  </>
                ) : (
                  <div className="w-full h-full bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center text-white text-2xl font-bold">
                    {user?.displayName ? user.displayName.charAt(0) : user?.email?.charAt(0) || "U"}
                  </div>
                )}
              </div>
              {editing && (
                <div className="absolute -bottom-1 -right-1">
                  <button
                    onClick={() => fileInputRef.current?.click()}
                    className="w-8 h-8 bg-amber-600 text-white rounded-full flex items-center justify-center hover:bg-amber-700 transition-colors shadow-lg"
                    title="프로필 이미지 변경"
                  >
                    <FaCamera className="w-4 h-4" />
                  </button>
                </div>
              )}
            </div>
            <div>
              <h2 className="text-xl font-bold text-gray-800">
                {user?.displayName || "사용자"}
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
                이메일 *
              </label>
              {editing ? (
                <input
                  type="email"
                  name="email"
                  value={form.email}
                  onChange={handleChange}
                  className="w-full border border-gray-300 rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-amber-400"
                  placeholder="이메일을 입력하세요"
                />
              ) : (
                <p className="text-gray-800 py-3">{form.email || "미설정"}</p>
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

          {/* 프로필 이미지 업로드/삭제 */}
          {editing && (
            <div className="border-t pt-4">
              <h3 className="text-lg font-semibold text-gray-800 mb-3">
                프로필 이미지 관리
              </h3>
              <div className="flex items-center space-x-4 mb-4">
                <div className="w-24 h-24 rounded-full overflow-hidden border-2 border-gray-300 flex items-center justify-center bg-gray-100">
                  {imagePreview ? (
                    <img src={imagePreview} alt="Profile Preview" className="w-full h-full object-cover" />
                  ) : user.photoURL || userData?.profileImage ? (
                    <img 
                      src={user.photoURL || userData?.profileImage} 
                      alt="Current Profile" 
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <span className="text-gray-400 text-4xl">👤</span>
                  )}
                </div>
                <div className="flex-1 space-y-2">
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleImageChange}
                    className="hidden"
                    ref={fileInputRef}
                    disabled={uploadingImage}
                  />
                  <div className="flex space-x-2">
                    <button
                      onClick={() => fileInputRef.current?.click()}
                      className="flex items-center bg-amber-600 text-white font-semibold py-2 px-4 rounded-lg hover:bg-amber-700 transition-colors disabled:opacity-50"
                      disabled={uploadingImage}
                    >
                      <FaCamera className="mr-2" /> 
                      {user.photoURL || userData?.profileImage ? '이미지 변경' : '이미지 업로드'}
                    </button>
                    {(user.photoURL || userData?.profileImage) && (
                      <button
                        onClick={handleImageDelete}
                        className="flex items-center bg-red-500 text-white font-semibold py-2 px-4 rounded-lg hover:bg-red-600 transition-colors disabled:opacity-50"
                        disabled={uploadingImage}
                      >
                        <FaTrash className="mr-2" /> 이미지 삭제
                      </button>
                    )}
                  </div>
                  {imagePreview && (
                    <button
                      onClick={handleImageUpload}
                      className="w-full bg-green-600 text-white font-semibold py-2 px-4 rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50"
                      disabled={uploadingImage}
                    >
                      {uploadingImage ? '업로드 중...' : '업로드 확인'}
                    </button>
                  )}
                </div>
              </div>
              {uploadingImage && (
                <div className="flex items-center text-sm text-gray-600">
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-amber-600 mr-2"></div>
                  이미지 업로드 중...
                </div>
              )}
              <p className="text-xs text-gray-500 mt-2">
                * 이미지 파일 크기는 5MB 이하여야 하며, JPG, PNG, GIF 형식을 지원합니다.
              </p>
            </div>
          )}

          {/* 회원탈퇴 버튼 */}
          <div className="border-t pt-4">
            <button
              onClick={handleDeleteAccount}
              disabled={deleting}
              className={`w-full font-semibold py-3 px-6 rounded-lg transition-colors ${
                deleting
                  ? "bg-gray-400 text-white cursor-not-allowed"
                  : showPasswordConfirm
                  ? "bg-red-700 text-white hover:bg-red-800"
                  : showDeleteConfirm
                  ? "bg-red-600 text-white hover:bg-red-700"
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
              ) : showPasswordConfirm ? (
                "비밀번호 확인 후 탈퇴"
              ) : showDeleteConfirm ? (
                "정말 탈퇴하시겠습니까?"
              ) : (
                "회원탈퇴"
              )}
            </button>
            {showDeleteConfirm && !deleting && !showPasswordConfirm && (
              <p className="text-sm text-red-600 mt-2 text-center">
                ⚠️ 탈퇴 시 모든 데이터가 영구적으로 삭제됩니다
              </p>
            )}
            {showPasswordConfirm && !deleting && (
              <div className="mt-4 p-4 bg-red-50 border border-red-200 rounded-lg">
                <p className="text-sm text-red-700 mb-3">
                  보안을 위해 비밀번호를 입력해주세요.
                </p>
                <input
                  type="password"
                  value={deletePassword}
                  onChange={(e) => setDeletePassword(e.target.value)}
                  className="w-full px-3 py-2 border border-red-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-400"
                  placeholder="현재 비밀번호를 입력하세요"
                />
                <div className="flex space-x-2 mt-3">
                  <button
                    onClick={() => {
                      setShowDeleteConfirm(false);
                      setShowPasswordConfirm(false);
                      setDeletePassword("");
                    }}
                    className="flex-1 bg-gray-500 text-white py-2 px-4 rounded-lg hover:bg-gray-600 transition-colors"
                  >
                    취소
                  </button>
                  <button
                    onClick={handleDeleteAccount}
                    disabled={!deletePassword.trim()}
                    className="flex-1 bg-red-600 text-white py-2 px-4 rounded-lg hover:bg-red-700 transition-colors disabled:bg-gray-400"
                  >
                    탈퇴 진행
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Profile;
