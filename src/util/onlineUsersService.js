import {
  collection, addDoc, getDocs, getDoc, doc, updateDoc, deleteDoc,
  query, where, orderBy, limit, serverTimestamp, onSnapshot
} from "firebase/firestore";
import { db } from "./firebase";

// 사용자 접속 상태 추가
export const addOnlineUser = async (userData) => {
  try {
    // 기존에 같은 사용자가 접속해 있는지 확인
    const existingUser = await getOnlineUser(userData.authorId);
    
    if (existingUser) {
      // 기존 사용자가 있으면 업데이트
      await updateOnlineUser(existingUser.id, {
        lastSeen: serverTimestamp(),
        isOnline: true,
        lastActivity: serverTimestamp()
      });
      return existingUser;
    }
    
    // 새로운 사용자 추가
    const onlineUserData = {
      ...userData,
      lastSeen: serverTimestamp(),
      lastActivity: serverTimestamp(),
      isOnline: true
    };
    
    const docRef = await addDoc(collection(db, "onlineUsers"), onlineUserData);
    return { id: docRef.id, ...onlineUserData };
  } catch (error) {
    console.error("접속자 추가 오류:", error);
    
    // 권한 오류인 경우 로컬 상태로 처리
    if (error.code === 'permission-denied' || error.message.includes('permissions')) {
      console.log("권한 오류 - 로컬 접속자 상태 처리");
      return { id: `local-${userData.authorId}`, ...userData, isOnline: true };
    }
    
    throw new Error("접속자 등록에 실패했습니다.");
  }
};

// 사용자 접속 상태 업데이트
export const updateOnlineUser = async (userId, updateData) => {
  try {
    const userRef = doc(db, "onlineUsers", userId);
    
    // 문서가 존재하는지 먼저 확인
    const userDoc = await getDoc(userRef);
    
    if (userDoc.exists()) {
      // 문서가 존재하면 업데이트
      await updateDoc(userRef, {
        ...updateData,
        lastSeen: serverTimestamp()
      });
    } else {
      // 문서가 존재하지 않으면 새로 생성
      await addDoc(collection(db, "onlineUsers"), {
        authorId: userId,
        ...updateData,
        lastSeen: serverTimestamp(),
        isOnline: true
      });
    }
  } catch (error) {
    console.error("접속자 업데이트 오류:", error);
    
    // 권한 오류인 경우 무시
    if (error.code === 'permission-denied' || error.message.includes('permissions')) {
      console.log("권한 오류 - 접속자 업데이트 건너뜀");
      return;
    }
    
    throw new Error("접속자 정보 업데이트에 실패했습니다.");
  }
};

// 사용자 활동 업데이트 (메시지 전송, 스크롤 등)
export const updateUserActivity = async (userId) => {
  try {
    const userRef = doc(db, "onlineUsers", userId);
    
    // 문서가 존재하는지 먼저 확인
    const userDoc = await getDoc(userRef);
    
    if (userDoc.exists()) {
      // 문서가 존재하면 업데이트
      await updateDoc(userRef, {
        lastActivity: serverTimestamp(),
        lastSeen: serverTimestamp()
      });
    } else {
      // 문서가 존재하지 않으면 무시 (로그만 출력)
      console.log(`사용자 ${userId}의 온라인 상태 문서가 존재하지 않습니다.`);
    }
  } catch (error) {
    console.error("사용자 활동 업데이트 오류:", error);
    
    // 권한 오류인 경우 무시
    if (error.code === 'permission-denied' || error.message.includes('permissions')) {
      console.log("권한 오류 - 사용자 활동 업데이트 건너뜀");
      return;
    }
  }
};

// 사용자 접속 해제
export const removeOnlineUser = async (userId) => {
  try {
    const userRef = doc(db, "onlineUsers", userId);
    await deleteDoc(userRef);
  } catch (error) {
    console.error("접속자 제거 오류:", error);
    
    // 권한 오류인 경우 무시
    if (error.code === 'permission-denied' || error.message.includes('permissions')) {
      console.log("권한 오류 - 접속자 제거 건너뜀");
      return;
    }
    
    throw new Error("접속자 제거에 실패했습니다.");
  }
};

// 접속자 목록 조회 (실시간 구독 대신 주기적 조회)
export const getOnlineUsers = async () => {
  try {
    const q = query(
      collection(db, "onlineUsers"),
      orderBy("lastSeen", "desc")
    );
    
    const querySnapshot = await getDocs(q);
    const onlineUsers = [];
    const now = new Date();
    const fiveMinutesAgo = new Date(now.getTime() - 5 * 60 * 1000);
    
    querySnapshot.forEach((doc) => {
      const data = doc.data();
      const lastSeen = data.lastSeen?.toDate ? data.lastSeen.toDate() : new Date(data.lastSeen);
      
      // isOnline이 true이고 5분 이내에 활동이 있는 사용자만 필터링
      if (data.isOnline && lastSeen > fiveMinutesAgo) {
        onlineUsers.push({
          id: doc.id,
          ...data
        });
      }
    });
    
    console.log("접속자 목록 조회 결과:", onlineUsers);
    return onlineUsers;
  } catch (error) {
    console.error("접속자 목록 조회 오류:", error);
    
    // 권한 오류인 경우 빈 배열 반환
    if (error.code === 'permission-denied' || error.message.includes('permissions')) {
      console.log("권한 오류 - 빈 접속자 목록 반환");
      return [];
    }
    
    throw new Error("접속자 목록을 불러오는데 실패했습니다.");
  }
};

// 실시간 접속자 목록 구독 (5분마다 업데이트)
export const subscribeToOnlineUsers = (callback) => {
  try {
    // 초기 데이터 로드
    getOnlineUsers().then(callback);
    
    // 5분마다 접속자 목록 업데이트
    const interval = setInterval(async () => {
      try {
        const users = await getOnlineUsers();
        callback(users);
      } catch (error) {
        console.error("접속자 목록 업데이트 오류:", error);
      }
    }, 5 * 60 * 1000); // 5분
    
    // 구독 해제 함수 반환
    return () => {
      clearInterval(interval);
    };
  } catch (error) {
    console.error("접속자 목록 구독 오류:", error);
    throw new Error("접속자 목록을 불러오는데 실패했습니다.");
  }
};

// 특정 사용자 접속 상태 조회
export const getOnlineUser = async (userId) => {
  try {
    const q = query(
      collection(db, "onlineUsers"),
      where("authorId", "==", userId),
      where("isOnline", "==", true)
    );
    
    const querySnapshot = await getDocs(q);
    if (!querySnapshot.empty) {
      const doc = querySnapshot.docs[0];
      return {
        id: doc.id,
        ...doc.data()
      };
    }
    return null;
  } catch (error) {
    console.error("접속자 조회 오류:", error);
    
    // 권한 오류인 경우 null 반환
    if (error.code === 'permission-denied' || error.message.includes('permissions')) {
      console.log("권한 오류 - 접속자 조회 실패");
      return null;
    }
    
    throw new Error("접속자 정보를 불러오는데 실패했습니다.");
  }
};

// 오프라인 사용자 정리 (5분 이상 활동이 없는 사용자)
export const cleanupOfflineUsers = async () => {
  try {
    const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000);
    const q = query(
      collection(db, "onlineUsers"),
      where("lastSeen", "<", fiveMinutesAgo)
    );
    
    const querySnapshot = await getDocs(q);
    const deletePromises = querySnapshot.docs.map(doc => deleteDoc(doc.ref));
    await Promise.all(deletePromises);
    
    console.log(`${querySnapshot.docs.length}명의 오프라인 사용자가 정리되었습니다.`);
  } catch (error) {
    console.error("오프라인 사용자 정리 오류:", error);
    
    // 권한 오류인 경우 무시
    if (error.code === 'permission-denied' || error.message.includes('permissions')) {
      console.log("권한 오류 - 오프라인 사용자 정리 건너뜀");
      return;
    }
    
    // 다른 오류인 경우에도 무시 (정리 기능은 선택사항)
    console.log("오프라인 사용자 정리 실패 - 계속 진행");
  }
};

// 주기적으로 오프라인 사용자 정리 (5분마다)
export const startPeriodicCleanup = () => {
  // 초기 정리 실행
  cleanupOfflineUsers();
  
  // 5분마다 정리 실행
  const interval = setInterval(cleanupOfflineUsers, 5 * 60 * 1000);
  
  return () => {
    clearInterval(interval);
  };
};
