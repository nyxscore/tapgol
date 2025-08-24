import React, { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { auth } from "../util/firebase";
import { onAuthStateChanged, signOut } from "firebase/auth";
import { getUserProfile } from "../util/userService";

const Header = () => {
  const [user, setUser] = useState(null);
  const [userData, setUserData] = useState(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      if (currentUser) {
        setUser(currentUser);
        
        // Firestore에서 사용자 정보 가져오기
        try {
          const profile = await getUserProfile(currentUser.uid);
          setUserData(profile);
        } catch (error) {
          console.error("사용자 정보 로드 오류:", error);
          // 기본 정보만 사용
          setUserData({
            name: currentUser.displayName || "사용자",
            nickname: currentUser.displayName || "사용자"
          });
        }
      } else {
        setUser(null);
        setUserData(null);
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const handleLogout = async () => {
    try {
      await signOut(auth);
      navigate("/");
    } catch (error) {
      console.error("로그아웃 오류:", error);
    }
  };

  const getUserDisplayName = () => {
    if (userData?.nickname) {
      return userData.nickname;
    }
    if (userData?.name) {
      return userData.name;
    }
    if (user?.displayName) {
      return user.displayName;
    }
    if (user?.email) {
      return user.email.split('@')[0]; // 이메일에서 @ 앞부분만
    }
    return "사용자";
  };

  const getUserInitial = () => {
    const displayName = getUserDisplayName();
    return displayName.charAt(0).toUpperCase();
  };

  if (loading) {
    return (
      <header className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-4xl mx-auto px-4 py-3">
          <div className="flex items-center justify-between">
            <Link to="/" className="flex items-center space-x-2">
              <img
                src="/tapgol.png"
                alt="탑골톡 로고"
                className="w-8 h-8 object-contain"
              />
              <span className="text-lg font-bold text-gray-800">탑골톡</span>
            </Link>
            <div className="w-24 h-8 bg-gray-200 rounded animate-pulse"></div>
          </div>
        </div>
      </header>
    );
  }

  return (
    <header className="bg-white shadow-sm border-b border-gray-200">
      <div className="max-w-4xl mx-auto px-4 py-3">
        <div className="flex items-center justify-between">
          {/* 로고 */}
          <Link to="/" className="flex items-center space-x-2">
            <img
              src="/tapgol.png"
              alt="탑골톡 로고"
              className="w-8 h-8 object-contain"
            />
            <span className="text-lg font-bold text-gray-800">탑골톡</span>
          </Link>

          {/* 로그인/내 정보/로그아웃 버튼 */}
          {user ? (
            <div className="flex items-center space-x-3">
              <Link
                to="/profile"
                className="flex items-center space-x-2 px-4 py-2 rounded-full bg-amber-100 text-amber-900 font-semibold hover:bg-amber-200 transition-colors"
              >
                <div className="w-8 h-8 flex items-center justify-center rounded-full bg-amber-500 text-white text-sm font-bold">
                  {getUserInitial()}
                </div>
                <span className="max-w-24 truncate">{getUserDisplayName()}</span>
              </Link>
              <button
                onClick={handleLogout}
                className="px-4 py-2 rounded-full bg-gray-500 text-white font-semibold hover:bg-gray-600 transition-colors"
              >
                로그아웃
              </button>
            </div>
          ) : (
            <div className="flex items-center space-x-3">
              <Link
                to="/signup"
                className="px-4 py-2 rounded-full bg-amber-600 text-white font-semibold hover:bg-amber-700 transition-colors"
              >
                회원가입
              </Link>
              <Link
                to="/login"
                className="px-4 py-2 rounded-full bg-green-500 text-white font-semibold hover:bg-green-600 transition-colors"
              >
                로그인
              </Link>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};

export default Header;
