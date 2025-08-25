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
        isOnline: true
      });
      return existingUser;
    }
    
    // 새로운 사용자 추가
    const onlineUserData = {
      ...userData,
      lastSeen: serverTimestamp(),
      isOnline: true
    };
    
    const docRef = await addDoc(collection(db, "onlineUsers"), onlineUserData);
    return { id: docRef.id, ...onlineUserData };
  } catch (error) {
    console.error("접속자 추가 오류:", error);
    throw new Error("접속자 등록에 실패했습니다.");
  }
};

// 사용자 접속 상태 업데이트
export const updateOnlineUser = async (userId, updateData) => {
  try {
    const userRef = doc(db, "onlineUsers", userId);
    await updateDoc(userRef, {
      ...updateData,
      lastSeen: serverTimestamp()
    });
  } catch (error) {
    console.error("접속자 업데이트 오류:", error);
    throw new Error("접속자 정보 업데이트에 실패했습니다.");
  }
};

// 사용자 접속 해제
export const removeOnlineUser = async (userId) => {
  try {
    const userRef = doc(db, "onlineUsers", userId);
    await deleteDoc(userRef);
  } catch (error) {
    console.error("접속자 제거 오류:", error);
    throw new Error("접속자 제거에 실패했습니다.");
  }
};

// 실시간 접속자 목록 구독
export const subscribeToOnlineUsers = (callback) => {
  try {
    const q = query(
      collection(db, "onlineUsers"),
      orderBy("lastSeen", "desc")
    );
    
    return onSnapshot(q, (querySnapshot) => {
      const onlineUsers = [];
      querySnapshot.forEach((doc) => {
        const data = doc.data();
        // isOnline이 true인 사용자만 필터링
        if (data.isOnline) {
          onlineUsers.push({
            id: doc.id,
            ...data
          });
        }
      });
      console.log("접속자 목록 필터링 결과:", onlineUsers);
      callback(onlineUsers);
    });
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
  } catch (error) {
    console.error("오프라인 사용자 정리 오류:", error);
  }
};
