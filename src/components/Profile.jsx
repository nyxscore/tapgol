import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { auth, db } from "../util/firebase";
import { updateProfile } from "firebase/auth";
import { doc, getDoc, updateDoc } from "firebase/firestore";
import { signOut } from "firebase/auth";

const Profile = () => {
  const [user, setUser] = useState(null);
  const [userData, setUserData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const navigate = useNavigate();

  const [form, setForm] = useState({
    name: "",
    nickname: "",
    phone: "",
  });

  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged(async (currentUser) => {
      if (currentUser) {
        setUser(currentUser);
        
        // Firestore에서 추가 사용자 정보 가져오기
        try {
          const userDoc = await getDoc(doc(db, "users", currentUser.uid));
          if (userDoc.exists()) {
            const data = userDoc.data();
            setUserData(data);
            setForm({
              name: data.name || currentUser.displayName || "",
              nickname: data.nickname || "",
              phone: data.phone || "",
            });
          } else {
            // Firestore에 데이터가 없으면 기본값 설정
            setForm({
              name: currentUser.displayName || "",
              nickname: "",
              phone: "",
            });
          }
        } catch (error) {
          console.error("사용자 정보 로드 오류:", error);
          setForm({
            name: currentUser.displayName || "",
            nickname: "",
            phone: "",
          });
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
    setForm({ ...form, [e.target.name]: e.target.value });
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
    });
    setError("");
    setSuccess("");
  };

  const handleSave = async () => {
    setLoading(true);
    setError("");
    setSuccess("");

    try {
      // Firebase Auth 프로필 업데이트
      await updateProfile(user, {
        displayName: form.name,
      });

      // Firestore 사용자 정보 업데이트
      await updateDoc(doc(db, "users", user.uid), {
        name: form.name,
        nickname: form.nickname,
        phone: form.phone,
        updatedAt: new Date(),
      });

      setSuccess("회원정보가 성공적으로 수정되었습니다!");
      setEditing(false);
      
      // 사용자 상태 업데이트
      setUser({ ...user, displayName: form.name });
      setUserData({
        ...userData,
        name: form.name,
        nickname: form.nickname,
        phone: form.phone,
      });
    } catch (error) {
      console.error("회원정보 수정 오류:", error);
      setError("회원정보 수정 중 오류가 발생했습니다.");
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
      <div className="max-w-2xl mx-auto p-6">
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
            {error}
          </div>
        )}
        
        {success && (
          <div className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded mb-4">
            {success}
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
            </div>
          </div>

          {/* 정보 폼 */}
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                이름
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
                별명
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
                전화번호
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
                가입일
              </label>
              <p className="text-gray-800 py-3">
                {user.metadata?.creationTime 
                  ? new Date(user.metadata.creationTime).toLocaleDateString('ko-KR')
                  : "알 수 없음"
                }
              </p>
            </div>
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
        </div>
      </div>
    </div>
  );
};

export default Profile;
