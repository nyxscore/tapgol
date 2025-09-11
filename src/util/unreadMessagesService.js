// src/util/unreadMessagesService.js
import { 
  collection, 
  doc, 
  getDoc, 
  setDoc, 
  updateDoc, 
  onSnapshot, 
  query, 
  where,
  serverTimestamp 
} from "firebase/firestore";
import { db } from "./firebase";

// 미확인 메시지 카운트 조회
export const getUnreadCount = async (userId, chatType, chatId = null) => {
  try {
    const unreadDocId = chatId ? `${userId}_${chatType}_${chatId}` : `${userId}_${chatType}`;
    const unreadDoc = await getDoc(doc(db, "unreadMessages", unreadDocId));
    
    if (unreadDoc.exists()) {
      return unreadDoc.data().count || 0;
    }
    return 0;
  } catch (error) {
    console.error("미확인 메시지 카운트 조회 오류:", error);
    return 0;
  }
};

// 미확인 메시지 카운트 설정 (재시도 로직 포함)
export const setUnreadCount = async (userId, chatType, chatId, count, retryCount = 0) => {
  try {
    const unreadDocId = chatId ? `${userId}_${chatType}_${chatId}` : `${userId}_${chatType}`;
    const unreadRef = doc(db, "unreadMessages", unreadDocId);
    
    await setDoc(unreadRef, {
      userId,
      chatType,
      chatId,
      count,
      lastUpdated: serverTimestamp()
    }, { merge: true });
  } catch (error) {
    console.error("미확인 메시지 카운트 설정 오류:", error);
    
    // 권한 오류이고 재시도 횟수가 1회 미만이면 1초 후 재시도
    if (error.code === 'permission-denied' && retryCount < 1) {
      console.log("권한 오류로 인한 재시도...");
      setTimeout(() => {
        setUnreadCount(userId, chatType, chatId, count, retryCount + 1);
      }, 1000);
    }
  }
};

// 미확인 메시지 카운트 증가
export const incrementUnreadCount = async (userId, chatType, chatId = null) => {
  try {
    const currentCount = await getUnreadCount(userId, chatType, chatId);
    await setUnreadCount(userId, chatType, chatId, currentCount + 1);
  } catch (error) {
    console.error("미확인 메시지 카운트 증가 오류:", error);
  }
};

// 미확인 메시지 카운트 초기화 (읽음 처리)
export const markAsRead = async (userId, chatType, chatId = null) => {
  try {
    await setUnreadCount(userId, chatType, chatId, 0);
  } catch (error) {
    console.error("읽음 처리 오류:", error);
  }
};

// 사용자의 모든 미확인 메시지 구독 (재시도 로직 포함)
export const subscribeToUnreadMessages = (userId, callback, retryCount = 0) => {
  try {
    const q = query(
      collection(db, "unreadMessages"),
      where("userId", "==", userId)
    );
    
    return onSnapshot(q, (snapshot) => {
      const unreadData = {};
      snapshot.forEach((doc) => {
        const data = doc.data();
        const key = data.chatId ? `${data.chatType}_${data.chatId}` : data.chatType;
        unreadData[key] = data.count || 0;
      });
      callback(unreadData);
    }, (error) => {
      console.error("미확인 메시지 구독 오류:", error);
      
      // 권한 오류이고 재시도 횟수가 1회 미만이면 2초 후 재시도
      if (error.code === 'permission-denied' && retryCount < 1) {
        console.log("구독 권한 오류로 인한 재시도...");
        setTimeout(() => {
          subscribeToUnreadMessages(userId, callback, retryCount + 1);
        }, 2000);
      }
    });
  } catch (error) {
    console.error("미확인 메시지 구독 설정 오류:", error);
    return () => {};
  }
};

// 메시지 전송 시 미확인 카운트 증가
export const handleMessageSent = async (messageData, currentUser) => {
  try {
    // DM 메시지인 경우
    if (messageData.type === 'dm' && messageData.recipientId) {
      await incrementUnreadCount(messageData.recipientId, 'dm', messageData.threadKey);
    }
    // 메인 채팅 메시지인 경우
    else if (!messageData.type || messageData.type === 'main') {
      // 현재 사용자를 제외한 모든 사용자에게 미확인 카운트 증가
      // 실제로는 온라인 사용자 목록을 조회해서 처리해야 함
      console.log("메인 채팅 메시지 전송됨 - 미확인 카운트 증가 필요");
    }
  } catch (error) {
    console.error("메시지 전송 시 미확인 카운트 처리 오류:", error);
  }
};
