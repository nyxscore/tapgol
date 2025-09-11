import {
  collection, addDoc, getDocs, getDoc, doc, updateDoc, deleteDoc, setDoc,
  query, where, orderBy, limit, serverTimestamp, onSnapshot
} from "firebase/firestore";
import { db } from "./firebase";

// 채팅 메시지 작성
export const createChatMessage = async (messageData) => {
  try {
    // authorName이 없으면 author로 설정 (기존 메시지와의 호환성)
    const messageWithDefaults = {
      ...messageData,
      authorName: messageData.authorName || messageData.author || "익명"
    };
    
    const messageWithTimestamp = {
      ...messageWithDefaults,
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
        const messageData = {
          id: doc.id,
          ...doc.data()
        };
        
        // 메인 채팅에 DM(type === 'dm')이 섞이지 않도록 제외
        if (messageData.type !== 'dm') {
          messages.push(messageData);
        }
        
        // 작성자 정보 상태 로깅 (authorId만 있으면 정상)
        if (!messageData.authorId) {
          console.log("작성자 ID가 없는 메시지:", {
            id: messageData.id,
            content: messageData.content?.substring(0, 20) + "...",
            authorId: messageData.authorId,
            authorName: messageData.authorName,
            author: messageData.author,
            userId: messageData.userId
          });
        }
      });
      
      // 최신 메시지가 아래에 오도록 역순으로 정렬 (Firestore desc → 오래된 메시지부터)
      const sortedMessages = messages.reverse();
      
      console.log("메인 채팅 메시지 정렬 후 (필터링됨):", sortedMessages.map(m => ({
        id: m.id,
        content: m.content?.substring(0, 20) + "...",
        authorName: m.authorName,
        time: m.createdAt?.toDate ? m.createdAt.toDate().toLocaleTimeString() : "시간없음"
      })));
      
      callback(sortedMessages);
    });
  } catch (error) {
    // BloomFilter 오류는 무시하고 다른 오류만 로깅
    if (error.name !== 'BloomFilterError') {
      console.error("채팅 메시지 구독 오류:", error);
      throw new Error("메시지를 불러오는데 실패했습니다.");
    }
  }
};

// 1:1 채팅 구독 (threadKey 기반)
export const subscribeToDirectMessages = (currentUserId, targetUserId, callback, limitCount = 200) => {
  try {
    if (!currentUserId || !targetUserId) {
      throw new Error("구독에 필요한 사용자 ID가 없습니다.");
    }

    const [a, b] = [currentUserId, targetUserId].sort();
    const threadKey = `${a}__${b}`;

    // 인덱스 없이 동작하도록: 서버 정렬/복합 where 제거 → 클라이언트 정렬
    const q = query(
      collection(db, "chatMessages"),
      where("threadKey", "==", threadKey)
    );

    return onSnapshot(q, (querySnapshot) => {
      const messages = [];
      querySnapshot.forEach((doc) => {
        messages.push({ id: doc.id, ...doc.data() });
      });
      // createdAt 기준 오름차순 정렬 (null 안전 처리)
      messages.sort((m1, m2) => {
        const t1 = m1.createdAt?.toDate ? m1.createdAt.toDate().getTime() : 0;
        const t2 = m2.createdAt?.toDate ? m2.createdAt.toDate().getTime() : 0;
        return t1 - t2;
      });
      // 필요 시 개수 제한
      const limited = limitCount ? messages.slice(-limitCount) : messages;
      callback(limited);
    });
  } catch (error) {
    // BloomFilter 오류는 무시하고 다른 오류만 로깅
    if (error.name !== 'BloomFilterError') {
      console.error("1:1 채팅 구독 오류:", error);
      throw new Error("1:1 메시지를 불러오는데 실패했습니다.");
    }
  }
};

// 1:1 채팅 메시지 작성
export const createDirectMessage = async (currentUser, targetUserId, content, extra = {}) => {
  try {
    if (!currentUser || !targetUserId) {
      throw new Error("메시지 작성에 필요한 사용자 정보가 없습니다.");
    }
    const [a, b] = [currentUser.uid, targetUserId].sort();
    const threadKey = `${a}__${b}`;

    const message = {
      type: "dm",
      threadKey,
      content,
      author: extra.authorName || currentUser.displayName || "익명",
      authorName: extra.authorName || currentUser.displayName || "익명",
      authorId: currentUser.uid,
      authorEmail: currentUser.email,
      recipientId: targetUserId,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    };

    const docRef = await addDoc(collection(db, "chatMessages"), message);

    // DM 스레드 upsert
    const participants = [a, b];
    const threadRef = doc(db, "chatThreads", threadKey);
    const threadData = {
      type: "dm",
      threadKey,
      participants,
      lastMessage: content,
      lastAuthorId: currentUser.uid,
      lastAuthorName: message.authorName,
      updatedAt: serverTimestamp(),
    };
    try {
      const existing = await getDoc(threadRef);
      if (existing.exists()) {
        // 기존 스레드 업데이트
        await updateDoc(threadRef, threadData);
        console.log("스레드 업데이트 성공:", threadKey);
      } else {
        // 새 스레드 생성
        await setDoc(threadRef, { ...threadData, createdAt: serverTimestamp() });
        console.log("스레드 생성 성공:", threadKey);
      }
    } catch (e) {
      console.error("스레드 업데이트 실패:", e?.code, e?.message);
      // 스레드 업데이트 실패해도 메시지 전송은 계속 진행
    }

    return { id: docRef.id, ...message };
  } catch (error) {
    console.error("1:1 채팅 메시지 작성 오류:", error);
    throw new Error("1:1 메시지 작성에 실패했습니다.");
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
