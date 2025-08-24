import {
  collection, addDoc, getDocs, getDoc, doc, updateDoc, deleteDoc,
  query, where, orderBy, limit, serverTimestamp, onSnapshot, increment
} from "firebase/firestore";
import { db } from "./firebase";

// 알림 작성 (관리자용)
export const createNotification = async (notificationData) => {
  try {
    const notificationWithTimestamp = {
      ...notificationData,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
      isRead: false,
      readCount: 0
    };
    
    const docRef = await addDoc(collection(db, "notifications"), notificationWithTimestamp);
    return { id: docRef.id, ...notificationWithTimestamp };
  } catch (error) {
    console.error("알림 작성 오류:", error);
    throw new Error("알림 작성에 실패했습니다.");
  }
};

// 알림 목록 조회
export const getNotifications = async (limitCount = 20) => {
  try {
    const q = query(
      collection(db, "notifications"),
      orderBy("createdAt", "desc"),
      limit(limitCount)
    );
    
    const querySnapshot = await getDocs(q);
    const notifications = [];
    
    querySnapshot.forEach((doc) => {
      notifications.push({
        id: doc.id,
        ...doc.data()
      });
    });
    
    return notifications;
  } catch (error) {
    console.error("알림 목록 조회 오류:", error);
    throw new Error("알림 목록을 불러오는데 실패했습니다.");
  }
};

// 실시간 알림 목록 구독
export const subscribeToNotifications = (callback, limitCount = 20) => {
  try {
    const q = query(
      collection(db, "notifications"),
      orderBy("createdAt", "desc"),
      limit(limitCount)
    );
    
    return onSnapshot(q, (querySnapshot) => {
      const notifications = [];
      querySnapshot.forEach((doc) => {
        notifications.push({
          id: doc.id,
          ...doc.data()
        });
      });
      callback(notifications);
    });
  } catch (error) {
    console.error("알림 구독 오류:", error);
    throw new Error("알림을 불러오는데 실패했습니다.");
  }
};

// 특정 알림 조회
export const getNotification = async (notificationId) => {
  try {
    const docRef = doc(db, "notifications", notificationId);
    const docSnap = await getDoc(docRef);
    
    if (docSnap.exists()) {
      return {
        id: docSnap.id,
        ...docSnap.data()
      };
    } else {
      throw new Error("알림을 찾을 수 없습니다.");
    }
  } catch (error) {
    console.error("알림 조회 오류:", error);
    throw new Error("알림을 불러오는데 실패했습니다.");
  }
};

// 알림 수정 (관리자용)
export const updateNotification = async (notificationId, updateData) => {
  try {
    const notificationRef = doc(db, "notifications", notificationId);
    await updateDoc(notificationRef, {
      ...updateData,
      updatedAt: serverTimestamp()
    });
  } catch (error) {
    console.error("알림 수정 오류:", error);
    throw new Error("알림 수정에 실패했습니다.");
  }
};

// 알림 삭제 (관리자용)
export const deleteNotification = async (notificationId) => {
  try {
    const notificationRef = doc(db, "notifications", notificationId);
    await deleteDoc(notificationRef);
  } catch (error) {
    console.error("알림 삭제 오류:", error);
    throw new Error("알림 삭제에 실패했습니다.");
  }
};

// 알림 읽음 처리
export const markNotificationAsRead = async (notificationId) => {
  try {
    const notificationRef = doc(db, "notifications", notificationId);
    await updateDoc(notificationRef, {
      isRead: true,
      readCount: increment(1),
      updatedAt: serverTimestamp()
    });
  } catch (error) {
    console.error("알림 읽음 처리 오류:", error);
    throw new Error("알림 읽음 처리에 실패했습니다.");
  }
};

// 읽지 않은 알림 개수 조회
export const getUnreadNotificationCount = async () => {
  try {
    const q = query(
      collection(db, "notifications"),
      where("isRead", "==", false)
    );
    
    const querySnapshot = await getDocs(q);
    return querySnapshot.size;
  } catch (error) {
    console.error("읽지 않은 알림 개수 조회 오류:", error);
    return 0;
  }
};

// 실시간 읽지 않은 알림 개수 구독
export const subscribeToUnreadCount = (callback) => {
  try {
    const q = query(
      collection(db, "notifications"),
      where("isRead", "==", false)
    );
    
    return onSnapshot(q, (querySnapshot) => {
      callback(querySnapshot.size);
    });
  } catch (error) {
    console.error("읽지 않은 알림 개수 구독 오류:", error);
    throw new Error("읽지 않은 알림 개수를 불러오는데 실패했습니다.");
  }
};

// 카테고리별 알림 조회
export const getNotificationsByCategory = async (category, limitCount = 10) => {
  try {
    const q = query(
      collection(db, "notifications"),
      where("category", "==", category),
      orderBy("createdAt", "desc"),
      limit(limitCount)
    );
    
    const querySnapshot = await getDocs(q);
    const notifications = [];
    
    querySnapshot.forEach((doc) => {
      notifications.push({
        id: doc.id,
        ...doc.data()
      });
    });
    
    return notifications;
  } catch (error) {
    console.error("카테고리별 알림 조회 오류:", error);
    throw new Error("카테고리별 알림을 불러오는데 실패했습니다.");
  }
};

// 채팅 알림 생성
export const createChatNotification = async (chatData) => {
  try {
    const notificationData = {
      title: "새로운 채팅 메시지",
      content: `${chatData.author}님이 메시지를 보냈습니다: ${chatData.content.substring(0, 50)}${chatData.content.length > 50 ? '...' : ''}`,
      category: "chat",
      priority: "normal",
      author: chatData.author,
      authorId: chatData.authorId,
      authorEmail: chatData.authorEmail,
      chatMessageId: chatData.id,
      isRead: false,
      readCount: 0,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp()
    };
    
    const docRef = await addDoc(collection(db, "notifications"), notificationData);
    return { id: docRef.id, ...notificationData };
  } catch (error) {
    console.error("채팅 알림 생성 오류:", error);
    throw new Error("채팅 알림 생성에 실패했습니다.");
  }
};

// 채팅 알림 목록 조회 (채팅 관련 알림만)
export const getChatNotifications = async (limitCount = 10) => {
  try {
    const q = query(
      collection(db, "notifications"),
      where("category", "==", "chat"),
      orderBy("createdAt", "desc"),
      limit(limitCount)
    );
    
    const querySnapshot = await getDocs(q);
    const notifications = [];
    
    querySnapshot.forEach((doc) => {
      notifications.push({
        id: doc.id,
        ...doc.data()
      });
    });
    
    return notifications;
  } catch (error) {
    console.error("채팅 알림 목록 조회 오류:", error);
    throw new Error("채팅 알림 목록을 불러오는데 실패했습니다.");
  }
};

// 실시간 채팅 알림 구독
export const subscribeToChatNotifications = (callback, limitCount = 10) => {
  try {
    const q = query(
      collection(db, "notifications"),
      where("category", "==", "chat"),
      orderBy("createdAt", "desc"),
      limit(limitCount)
    );
    
    return onSnapshot(q, (querySnapshot) => {
      const notifications = [];
      querySnapshot.forEach((doc) => {
        notifications.push({
          id: doc.id,
          ...doc.data()
        });
      });
      callback(notifications);
    });
  } catch (error) {
    console.error("채팅 알림 구독 오류:", error);
    throw new Error("채팅 알림을 불러오는데 실패했습니다.");
  }
};

// 읽지 않은 채팅 알림 개수 조회
export const getUnreadChatNotificationCount = async () => {
  try {
    const q = query(
      collection(db, "notifications"),
      where("category", "==", "chat"),
      where("isRead", "==", false)
    );
    
    const querySnapshot = await getDocs(q);
    return querySnapshot.size;
  } catch (error) {
    console.error("읽지 않은 채팅 알림 개수 조회 오류:", error);
    return 0;
  }
};

// 실시간 읽지 않은 채팅 알림 개수 구독
export const subscribeToUnreadChatCount = (callback) => {
  try {
    const q = query(
      collection(db, "notifications"),
      where("category", "==", "chat"),
      where("isRead", "==", false)
    );
    
    return onSnapshot(q, (querySnapshot) => {
      callback(querySnapshot.size);
    });
  } catch (error) {
    console.error("읽지 않은 채팅 알림 개수 구독 오류:", error);
    throw new Error("읽지 않은 채팅 알림 개수를 불러오는데 실패했습니다.");
  }
};
