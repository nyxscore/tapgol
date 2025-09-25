import React, { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";
import { getUserProfile } from "../util/userService";
import { checkAdminRole } from "../util/reportService";

const Header = () => {
  const { user, logout } = useAuth();
  const [userData, setUserData] = useState(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const loadUserData = async () => {
      if (user) {
        try {
          const profile = await getUserProfile(user.uid);
          setUserData(profile);
          
          // 관리자 권한 확인
          const adminStatus = await checkAdminRole(user.uid);
          setIsAdmin(adminStatus);
        } catch (error) {
          console.error("사용자 정보 로드 오류:", error);
          // 기본 정보만 사용
          setUserData({
            name: user?.displayName || "사용자",
            nickname: user?.displayName || "사용자"
          });
          setIsAdmin(false);
        }
      } else {
        setUserData(null);
        setIsAdmin(false);
      }
      setLoading(false);
    };

    loadUserData();
  }, [user]);


  const handleLogout = async () => {
    try {
      await logout();
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
      return user?.displayName;
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
      <header className="fixed top-0 left-0 right-0 bg-white border-b border-gray-200 z-40 safe-area-inset-top">
        <div className="px-4 py-3 h-14 flex items-center justify-between">
          <Link to="/" className="flex items-center space-x-2">
            <img
              src="/tapgol.png"
              alt="탑골톡 로고"
              className="w-6 h-6 object-contain"
            />
            <span className="text-lg font-bold text-gray-800">탑골톡</span>
          </Link>
          <div className="w-16 h-6 bg-gray-200 rounded animate-pulse"></div>
        </div>
      </header>
    );
  }

  return (
    <header className="fixed top-0 left-0 right-0 bg-white border-b border-gray-200 z-40 safe-area-inset-top">
      <div className="px-4 py-3 h-14 flex items-center justify-between">
        {/* 로고 */}
        <Link to="/" className="flex items-center space-x-2">
          <img
            src="/tapgol.png"
            alt="탑골톡 로고"
            className="w-6 h-6 object-contain"
          />
          <span className="text-lg font-bold text-gray-800">탑골톡</span>
        </Link>

        {/* 모바일 최적화된 액션 버튼들 */}
        {user ? (
          <div className="flex items-center space-x-2">
            {/* 관리자 패널 (아이콘만) */}
            {isAdmin && (
              <Link
                to="/admin"
                className="p-2 rounded-full bg-red-100 text-red-600 hover:bg-red-200 transition-colors"
                title="관리자 패널"
              >
                <span className="text-lg">👑</span>
              </Link>
            )}
            
            {/* 프로필 (아이콘만) */}
            <Link
              to="/profile"
              className="p-1 rounded-full hover:bg-gray-100 transition-colors"
              title={getUserDisplayName()}
            >
              <div className="w-7 h-7 flex items-center justify-center rounded-full bg-amber-500 text-white text-xs font-bold">
                {getUserInitial()}
              </div>
            </Link>
            
            {/* 로그아웃 (아이콘만) */}
            <button
              onClick={handleLogout}
              className="p-2 rounded-full text-gray-600 hover:bg-gray-100 transition-colors"
              title="로그아웃"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
              </svg>
            </button>
          </div>
        ) : (
          <div className="flex items-center space-x-2">
            <Link
              to="/login"
              className="px-3 py-1.5 text-sm rounded-full bg-amber-600 text-white font-semibold hover:bg-amber-700 transition-colors"
            >
              로그인
            </Link>
          </div>
        )}
      </div>
    </header>
  );
};

export default Header;
