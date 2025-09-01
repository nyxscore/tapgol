import React, { useState, useEffect } from "react";
import { getUserProfile } from "../util/userService";
import { FaTimes, FaUser, FaCalendar, FaEnvelope, FaMapMarkerAlt, FaBirthdayCake, FaVenusMars } from "react-icons/fa";

const UserProfileModal = ({ isOpen, onClose, userId, userName }) => {
  const [userProfile, setUserProfile] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (isOpen && userId) {
      loadUserProfile();
    }
  }, [isOpen, userId]);

  const loadUserProfile = async () => {
    if (!userId) return;
    
    setLoading(true);
    setError(null);
    
    try {
      const profile = await getUserProfile(userId);
      setUserProfile(profile);
    } catch (error) {
      console.error("사용자 프로필 로드 오류:", error);
      setError("프로필을 불러오는데 실패했습니다.");
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-md w-full max-h-[90vh] overflow-y-auto">
        {/* 헤더 */}
        <div className="flex items-center justify-between p-4 border-b">
          <h2 className="text-lg font-semibold text-gray-800">사용자 프로필</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <FaTimes className="w-5 h-5" />
          </button>
        </div>

        {/* 로딩 상태 */}
        {loading && (
          <div className="p-6 text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-amber-500 mx-auto"></div>
            <p className="text-gray-500 mt-2">프로필을 불러오는 중...</p>
          </div>
        )}

        {/* 에러 상태 */}
        {error && (
          <div className="p-6 text-center">
            <div className="text-red-500 mb-2">
              <FaTimes className="w-8 h-8 mx-auto" />
            </div>
            <p className="text-red-600 font-medium">{error}</p>
            <button
              onClick={loadUserProfile}
              className="mt-3 px-4 py-2 bg-amber-500 text-white rounded-lg hover:bg-amber-600 transition-colors"
            >
              다시 시도
            </button>
          </div>
        )}

        {/* 프로필 정보 */}
        {userProfile && !loading && (
          <div className="p-6">
            {/* 프로필 이미지 */}
            <div className="text-center mb-6">
              {userProfile.profileImage ? (
                <img
                  src={userProfile.profileImage}
                  alt="프로필 이미지"
                  className="w-20 h-20 rounded-full mx-auto border-4 border-amber-100"
                />
              ) : (
                <div className="w-20 h-20 bg-amber-500 rounded-full mx-auto flex items-center justify-center text-white text-2xl font-bold">
                  {userProfile.nickname?.[0] || userProfile.name?.[0] || userName?.[0] || "?"}
                </div>
              )}
            </div>

            {/* 사용자 이름 */}
            <div className="text-center mb-6">
              <h3 className="text-xl font-bold text-gray-800 mb-1">
                {userProfile.nickname || userProfile.name || userName || "알 수 없음"}
              </h3>
              {userProfile.nickname && userProfile.name && userProfile.nickname !== userProfile.name && (
                <p className="text-sm text-gray-500">({userProfile.name})</p>
              )}
            </div>

                         {/* 프로필 정보 목록 */}
             <div className="space-y-4">
               {/* 이메일 */}
               {userProfile.email && (
                 <div className="flex items-center space-x-3 p-3 bg-gray-50 rounded-lg">
                   <FaEnvelope className="text-gray-400 w-4 h-4" />
                   <div>
                     <p className="text-xs text-gray-500">이메일</p>
                     <p className="text-sm text-gray-800">{userProfile.email}</p>
                   </div>
                 </div>
               )}

               {/* 주소 - 무조건 표시 */}
               <div className="flex items-center space-x-3 p-3 bg-gray-50 rounded-lg">
                 <FaMapMarkerAlt className="text-gray-400 w-4 h-4" />
                 <div>
                   <p className="text-xs text-gray-500">주소</p>
                   <p className="text-sm text-gray-800">{userProfile.address || "미입력"}</p>
                 </div>
               </div>

               {/* 생년월일 - 무조건 표시 */}
               <div className="flex items-center space-x-3 p-3 bg-gray-50 rounded-lg">
                 <FaBirthdayCake className="text-gray-400 w-4 h-4" />
                 <div>
                   <p className="text-xs text-gray-500">생년월일</p>
                   <p className="text-sm text-gray-800">{userProfile.birthDate || "미입력"}</p>
                 </div>
               </div>

               {/* 성별 - 무조건 표시 */}
               <div className="flex items-center space-x-3 p-3 bg-gray-50 rounded-lg">
                 <FaVenusMars className="text-gray-400 w-4 h-4" />
                 <div>
                   <p className="text-xs text-gray-500">성별</p>
                   <p className="text-sm text-gray-800">
                     {userProfile.gender === 'male' ? '남성' : 
                      userProfile.gender === 'female' ? '여성' : 
                      userProfile.gender || "미입력"}
                   </p>
                 </div>
               </div>

               {/* 가입일 */}
               {userProfile.createdAt && (
                 <div className="flex items-center space-x-3 p-3 bg-gray-50 rounded-lg">
                   <FaCalendar className="text-gray-400 w-4 h-4" />
                   <div>
                     <p className="text-xs text-gray-500">가입일</p>
                     <p className="text-sm text-gray-800">
                       {userProfile.createdAt.toDate ? 
                         userProfile.createdAt.toDate().toLocaleDateString('ko-KR') : 
                         new Date(userProfile.createdAt).toLocaleDateString('ko-KR')
                       }
                     </p>
                   </div>
                 </div>
               )}

               {/* 자기소개 */}
               {userProfile.bio && (
                 <div className="flex items-start space-x-3 p-3 bg-gray-50 rounded-lg">
                   <FaUser className="text-gray-400 w-4 h-4 mt-1" />
                   <div>
                     <p className="text-xs text-gray-500">자기소개</p>
                     <p className="text-sm text-gray-800">{userProfile.bio}</p>
                   </div>
                 </div>
               )}
             </div>

                         {/* 추가 정보가 없는 경우 */}
             {!userProfile.email && !userProfile.bio && (
              <div className="text-center py-6">
                <FaUser className="w-8 h-8 text-gray-300 mx-auto mb-2" />
                <p className="text-gray-500 text-sm">추가 정보가 없습니다</p>
              </div>
            )}
          </div>
        )}

        {/* 닫기 버튼 */}
        <div className="p-4 border-t">
          <button
            onClick={onClose}
            className="w-full px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors"
          >
            닫기
          </button>
        </div>
      </div>
    </div>
  );
};

export default UserProfileModal;
