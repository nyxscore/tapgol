// 1:1 채팅 관련 유틸리티 함수들

/**
 * 1:1 채팅으로 이동하는 함수
 * @param {string} targetUserId - 대상 사용자 ID
 * @param {object} currentUser - 현재 로그인한 사용자
 * @param {function} navigate - React Router의 navigate 함수
 */
export const navigateToDM = (targetUserId, currentUser, navigate) => {
  if (!targetUserId) {
    console.warn("대상 사용자 ID가 없습니다.");
    return;
  }

  if (!currentUser) {
    alert("1:1 채팅을 하려면 로그인이 필요합니다.");
    return;
  }

  if (targetUserId === currentUser.uid) {
    alert("자기 자신과는 1:1 채팅을 할 수 없습니다.");
    return;
  }

  navigate(`/chat/dm/${targetUserId}`);
};

/**
 * 1:1 채팅 가능 여부를 확인하는 함수
 * @param {string} targetUserId - 대상 사용자 ID
 * @param {object} currentUser - 현재 로그인한 사용자
 * @returns {boolean} - 1:1 채팅 가능 여부
 */
export const canStartDM = (targetUserId, currentUser) => {
  if (!targetUserId || !currentUser) return false;
  if (targetUserId === currentUser.uid) return false;
  return true;
};
