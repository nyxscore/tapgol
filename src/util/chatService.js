import {
  collection, addDoc, getDocs, getDoc, doc, updateDoc, deleteDoc,
  query, where, orderBy, limit, serverTimestamp, onSnapshot
} from "firebase/firestore";
import { db } from "./firebase";

// 채팅 메시지 작성
export const createChatMessage = async (messageData) => {
  try {
    const messageWithTimestamp = {
      ...messageData,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp()
    };
    
    const docRef = await addDoc(collection(db, "chatMessages"), messageWithTimestamp);
    return { id: docRef.id, ...messageWithTimestamp };
  } catch (error) {
    console.error("채팅 메시지 작성 오류:", error);
    throw new Error("메시지 작성에 실패했습니다.");
  }
};

// 채팅 메시지 목록 조회 (실시간)
export const subscribeToChatMessages = (callback, limitCount = 100) => {
  try {
    const q = query(
      collection(db, "chatMessages"),
      orderBy("createdAt", "desc"),
      limit(limitCount)
    );
    
    return onSnapshot(q, (querySnapshot) => {
      const messages = [];
      querySnapshot.forEach((doc) => {
        messages.push({
          id: doc.id,
          ...doc.data()
        });
      });
      // 최신 메시지가 아래에 오도록 역순으로 정렬
      const sortedMessages = messages.reverse();
      callback(sortedMessages);
    });
  } catch (error) {
    console.error("채팅 메시지 구독 오류:", error);
    throw new Error("메시지를 불러오는데 실패했습니다.");
  }
};

// 특정 채팅 메시지 조회
export const getChatMessage = async (messageId) => {
  try {
    const docRef = doc(db, "chatMessages", messageId);
    const docSnap = await getDoc(docRef);
    
    if (docSnap.exists()) {
      return {
        id: docSnap.id,
        ...docSnap.data()
      };
    } else {
      throw new Error("메시지를 찾을 수 없습니다.");
    }
  } catch (error) {
    console.error("채팅 메시지 조회 오류:", error);
    throw new Error("메시지를 불러오는데 실패했습니다.");
  }
};

// 채팅 메시지 수정
export const updateChatMessage = async (messageId, updateData) => {
  try {
    const messageRef = doc(db, "chatMessages", messageId);
    await updateDoc(messageRef, {
      ...updateData,
      updatedAt: serverTimestamp()
    });
  } catch (error) {
    console.error("채팅 메시지 수정 오류:", error);
    throw new Error("메시지 수정에 실패했습니다.");
  }
};

// 채팅 메시지 삭제
export const deleteChatMessage = async (messageId) => {
  try {
    const messageRef = doc(db, "chatMessages", messageId);
    await deleteDoc(messageRef);
  } catch (error) {
    console.error("채팅 메시지 삭제 오류:", error);
    throw new Error("메시지 삭제에 실패했습니다.");
  }
};

// 사용자별 채팅 메시지 조회
export const getChatMessagesByUser = async (userId) => {
  try {
    const q = query(
      collection(db, "chatMessages"),
      where("authorId", "==", userId),
      orderBy("createdAt", "desc")
    );
    
    const querySnapshot = await getDocs(q);
    const messages = [];
    
    querySnapshot.forEach((doc) => {
      messages.push({
        id: doc.id,
        ...doc.data()
      });
    });
    
    return messages;
  } catch (error) {
    console.error("사용자 채팅 메시지 조회 오류:", error);
    throw new Error("사용자 메시지를 불러오는데 실패했습니다.");
  }
};

// 채팅방 정보 조회
export const getChatRoomInfo = async () => {
  try {
    const docRef = doc(db, "chatRooms", "tapgol-chat");
    const docSnap = await getDoc(docRef);
    
    if (docSnap.exists()) {
      return {
        id: docSnap.id,
        ...docSnap.data()
      };
    } else {
      // 채팅방이 없으면 기본 정보 반환
      return {
        id: "tapgol-chat",
        name: "탑골톡",
        description: "탑골공원 실시간 채팅방",
        isActive: true,
        createdAt: serverTimestamp()
      };
    }
  } catch (error) {
    console.error("채팅방 정보 조회 오류:", error);
    throw new Error("채팅방 정보를 불러오는데 실패했습니다.");
  }
};
