import React, { useState, useEffect } from "react";
import { auth } from "../util/firebase";
import { onAuthStateChanged } from "firebase/auth";
import { getUserProfile } from "../util/userService";

const Alerts = () => {
  const [user, setUser] = useState(null);
  const [userData, setUserData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      setUser(currentUser);
      
      if (currentUser) {
        try {
          const profile = await getUserProfile(currentUser.uid);
          setUserData(profile);
        } catch (error) {
          console.error("사용자 정보 로드 오류:", error);
        }
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

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

  return (
    <div className="min-h-screen bg-gradient-to-br from-amber-50 via-orange-50 to-amber-100 pb-20">
      <div className="max-w-4xl mx-auto p-6">
        {/* 헤더 */}
        <div className="bg-white rounded-2xl shadow-xl p-6 mb-6">
          <div className="flex items-center justify-between">
            <h1 className="text-2xl font-bold text-gray-800">알림</h1>
            <div className="w-24"></div>
          </div>
        </div>

        {/* 알림 내용 */}
        <div className="bg-white rounded-2xl shadow-xl p-6">
          {user ? (
            <div className="space-y-6">
              <div className="text-center py-8">
                <div className="text-gray-400 text-6xl mb-4">🔔</div>
                <p className="text-gray-600 text-lg mb-2">알림 기능은 준비 중입니다</p>
                <p className="text-gray-500">곧 새로운 알림 기능을 만나보실 수 있습니다!</p>
              </div>
              
              {/* 사용자 정보 표시 */}
              <div className="border-t border-gray-200 pt-6">
                <h3 className="text-lg font-semibold text-gray-800 mb-4">사용자 정보</h3>
                <div className="bg-gray-50 rounded-lg p-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <p className="text-sm text-gray-600">이름</p>
                      <p className="font-medium">{userData?.name || "정보 없음"}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600">닉네임</p>
                      <p className="font-medium">{userData?.nickname || "정보 없음"}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600">이메일</p>
                      <p className="font-medium">{user.email}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600">가입일</p>
                      <p className="font-medium">
                        {userData?.createdAt ? 
                          new Date(userData.createdAt.toDate()).toLocaleDateString('ko-KR') : 
                          "정보 없음"
                        }
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div className="text-center py-12">
              <div className="text-gray-400 text-6xl mb-4">🔒</div>
              <p className="text-gray-600 text-lg mb-2">로그인이 필요합니다</p>
              <p className="text-gray-500 mb-6">알림을 확인하려면 로그인해주세요.</p>
              <button
                onClick={() => window.location.href = "/login"}
                className="bg-amber-600 text-white px-6 py-3 rounded-lg hover:bg-amber-700 transition-colors"
              >
                로그인하기
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Alerts;
