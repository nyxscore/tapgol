import React, { useState, useEffect } from "react";
import { auth } from "../util/firebase";
import { migrateAllUsers, getActiveUsers } from "../util/userService";

const AdminMigration = () => {
  const [loading, setLoading] = useState(false);
  const [migrating, setMigrating] = useState(false);
  const [users, setUsers] = useState([]);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [stats, setStats] = useState({
    total: 0,
    migrated: 0,
    needsMigration: 0
  });

  useEffect(() => {
    loadUsers();
  }, []);

  const loadUsers = async () => {
    setLoading(true);
    try {
      const activeUsers = await getActiveUsers();
      setUsers(activeUsers);
      
      // 마이그레이션 필요 여부 확인
      const needsMigration = activeUsers.filter(user => 
        !user.profileComplete || 
        !user.interests || 
        !user.birthDate || 
        !user.gender || 
        !user.address
      );
      
      setStats({
        total: activeUsers.length,
        migrated: activeUsers.length - needsMigration.length,
        needsMigration: needsMigration.length
      });
    } catch (error) {
      console.error("사용자 목록 로드 오류:", error);
      setError("사용자 목록을 불러오는데 실패했습니다.");
    } finally {
      setLoading(false);
    }
  };

  const handleMigration = async () => {
    if (!window.confirm("모든 사용자 데이터를 새로운 구조로 마이그레이션하시겠습니까?")) {
      return;
    }

    setMigrating(true);
    setError("");
    setSuccess("");

    try {
      await migrateAllUsers();
      setSuccess("모든 사용자 데이터 마이그레이션이 완료되었습니다!");
      await loadUsers(); // 목록 새로고침
    } catch (error) {
      console.error("마이그레이션 오류:", error);
      setError("마이그레이션 중 오류가 발생했습니다: " + error.message);
    } finally {
      setMigrating(false);
    }
  };

  const handleSingleUserMigration = async (userId) => {
    setMigrating(true);
    try {
      // 개별 사용자 마이그레이션 로직
      const { getUserProfile, updateUserProfile } = await import("../util/userService");
      const userProfile = await getUserProfile(userId);
      
      // 이미 마이그레이션된 사용자인지 확인
      if (userProfile.profileComplete && userProfile.interests) {
        setSuccess("이미 마이그레이션된 사용자입니다.");
        return;
      }

      // 기본값으로 업데이트
      await updateUserProfile(userId, {
        interests: userProfile.interests || [],
        birthDate: userProfile.birthDate || "",
        gender: userProfile.gender || "",
        address: userProfile.address || "",
        profileComplete: true
      });

      setSuccess("사용자 마이그레이션이 완료되었습니다!");
      await loadUsers();
    } catch (error) {
      console.error("개별 마이그레이션 오류:", error);
      setError("개별 마이그레이션 중 오류가 발생했습니다: " + error.message);
    } finally {
      setMigrating(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-amber-50 via-orange-50 to-amber-100 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-amber-700 mx-auto mb-4"></div>
          <p className="text-amber-700">사용자 목록을 불러오는 중...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-amber-50 via-orange-50 to-amber-100 pb-20">
      <div className="max-w-6xl mx-auto p-6">
        {/* 헤더 */}
        <div className="bg-white rounded-2xl shadow-xl p-6 mb-6">
          <h1 className="text-3xl font-bold text-amber-700 mb-2 text-center">
            데이터 마이그레이션 도구
          </h1>
          <p className="text-gray-600 text-center">
            기존 사용자 데이터를 새로운 구조로 변환합니다
          </p>
        </div>

        {/* 통계 */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
          <div className="bg-white rounded-2xl shadow-xl p-6">
            <h3 className="text-lg font-semibold text-gray-800 mb-2">전체 사용자</h3>
            <p className="text-3xl font-bold text-amber-700">{stats.total}</p>
          </div>
          <div className="bg-white rounded-2xl shadow-xl p-6">
            <h3 className="text-lg font-semibold text-gray-800 mb-2">마이그레이션 완료</h3>
            <p className="text-3xl font-bold text-green-600">{stats.migrated}</p>
          </div>
          <div className="bg-white rounded-2xl shadow-xl p-6">
            <h3 className="text-lg font-semibold text-gray-800 mb-2">마이그레이션 필요</h3>
            <p className="text-3xl font-bold text-red-600">{stats.needsMigration}</p>
          </div>
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

        {/* 액션 버튼 */}
        <div className="bg-white rounded-2xl shadow-xl p-6 mb-6">
          <div className="flex justify-between items-center">
            <div>
              <h2 className="text-xl font-bold text-gray-800 mb-2">전체 마이그레이션</h2>
              <p className="text-gray-600">모든 사용자 데이터를 새로운 구조로 변환합니다.</p>
            </div>
            <button
              onClick={handleMigration}
              disabled={migrating || stats.needsMigration === 0}
              className={`px-6 py-3 rounded-lg font-semibold transition-colors ${
                migrating || stats.needsMigration === 0
                  ? "bg-gray-400 cursor-not-allowed"
                  : "bg-amber-700 hover:bg-amber-800 text-white"
              }`}
            >
              {migrating ? "마이그레이션 중..." : "전체 마이그레이션 실행"}
            </button>
          </div>
        </div>

        {/* 사용자 목록 */}
        <div className="bg-white rounded-2xl shadow-xl p-6">
          <h2 className="text-xl font-bold text-gray-800 mb-4">사용자 목록</h2>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-200">
                  <th className="text-left py-3 px-4">이름</th>
                  <th className="text-left py-3 px-4">별명</th>
                  <th className="text-left py-3 px-4">이메일</th>
                  <th className="text-left py-3 px-4">상태</th>
                  <th className="text-left py-3 px-4">액션</th>
                </tr>
              </thead>
              <tbody>
                {users.map((user) => {
                  const needsMigration = !user.profileComplete || 
                    !user.interests || 
                    !user.birthDate || 
                    !user.gender || 
                    !user.address;
                  
                  return (
                    <tr key={user.id} className="border-b border-gray-100 hover:bg-gray-50">
                      <td className="py-3 px-4">{user.name || "미설정"}</td>
                      <td className="py-3 px-4">{user.nickname || "미설정"}</td>
                      <td className="py-3 px-4">{user.email}</td>
                      <td className="py-3 px-4">
                        <span className={`px-2 py-1 rounded-full text-xs font-semibold ${
                          needsMigration 
                            ? "bg-red-100 text-red-800" 
                            : "bg-green-100 text-green-800"
                        }`}>
                          {needsMigration ? "마이그레이션 필요" : "완료"}
                        </span>
                      </td>
                      <td className="py-3 px-4">
                        {needsMigration && (
                          <button
                            onClick={() => handleSingleUserMigration(user.id)}
                            disabled={migrating}
                            className="text-sm bg-blue-600 text-white px-3 py-1 rounded hover:bg-blue-700 disabled:bg-gray-400"
                          >
                            개별 마이그레이션
                          </button>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminMigration;
