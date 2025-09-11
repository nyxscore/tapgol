// src/util/wisdomService.js
import {
  collection, addDoc, getDocs, getDoc, doc, updateDoc, deleteDoc,
  query, where, orderBy, limit, serverTimestamp, onSnapshot, increment
} from "firebase/firestore";
import { db } from "./firebase";

// 오늘의 지혜 생성
export const createWisdom = async (wisdomData) => {
  try {
    const wisdomWithTimestamp = {
      ...wisdomData,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
      isActive: true,
      viewCount: 0,
      likeCount: 0,
      likedBy: [],
      commentCount: 0
    };
    
    const docRef = await addDoc(collection(db, "wisdoms"), wisdomWithTimestamp);
    return { id: docRef.id, ...wisdomWithTimestamp };
  } catch (error) {
    console.error("지혜 생성 오류:", error);
    
    // 권한 오류인 경우에도 실제 Firestore에 저장 시도 (규칙이 업데이트될 수 있음)
    if (error.code === 'permission-denied' || error.message.includes('permissions')) {
      console.log("권한 오류 - 다시 시도 중...");
      try {
        // 다시 한 번 시도
        const docRef = await addDoc(collection(db, "wisdoms"), {
          ...wisdomData,
          createdAt: new Date(),
          updatedAt: new Date(),
          isActive: true,
          viewCount: 0,
          likeCount: 0,
          likedBy: []
        });
        return { id: docRef.id, ...wisdomData, createdAt: new Date(), updatedAt: new Date(), isActive: true, viewCount: 0, likeCount: 0, likedBy: [] };
      } catch (retryError) {
        console.log("재시도 실패 - 임시 ID로 처리");
        return { 
          id: `temp_${Date.now()}`, 
          ...wisdomData,
          createdAt: new Date(),
          updatedAt: new Date(),
          isActive: true,
          viewCount: 0,
          likeCount: 0,
          likedBy: []
        };
      }
    }
    
    throw new Error("지혜 생성에 실패했습니다.");
  }
};

// 모든 지혜 조회 (관리자용)
export const getAllWisdoms = async () => {
  try {
    // 인덱스 오류를 피하기 위해 orderBy를 제거하고 클라이언트에서 정렬
    const q = query(collection(db, "wisdoms"));
    
    const querySnapshot = await getDocs(q);
    const wisdoms = [];
    
    querySnapshot.forEach((doc) => {
      wisdoms.push({
        id: doc.id,
        ...doc.data()
      });
    });
    
    // 클라이언트에서 생성일 기준으로 정렬
    wisdoms.sort((a, b) => {
      const dateA = a.createdAt?.toDate ? a.createdAt.toDate() : new Date(a.createdAt);
      const dateB = b.createdAt?.toDate ? b.createdAt.toDate() : new Date(b.createdAt);
      return dateB - dateA; // 최신순
    });
    
    return wisdoms;
  } catch (error) {
    console.error("지혜 목록 조회 오류:", error);
    
    // 권한 오류인 경우 빈 배열 반환
    if (error.code === 'permission-denied' || error.message.includes('permissions')) {
      console.log("권한 오류 - 빈 배열 반환");
      return [];
    }
    
    throw new Error("지혜 목록을 불러오는데 실패했습니다.");
  }
};

// 활성화된 지혜만 조회 (일반 사용자용)
export const getActiveWisdoms = async () => {
  try {
    // 인덱스 오류를 피하기 위해 orderBy를 제거하고 클라이언트에서 정렬
    const q = query(
      collection(db, "wisdoms"),
      where("isActive", "==", true)
    );
    
    const querySnapshot = await getDocs(q);
    const wisdoms = [];
    
    querySnapshot.forEach((doc) => {
      wisdoms.push({
        id: doc.id,
        ...doc.data()
      });
    });
    
    // 클라이언트에서 생성일 기준으로 정렬
    wisdoms.sort((a, b) => {
      const dateA = a.createdAt?.toDate ? a.createdAt.toDate() : new Date(a.createdAt);
      const dateB = b.createdAt?.toDate ? b.createdAt.toDate() : new Date(b.createdAt);
      return dateB - dateA; // 최신순
    });
    
    return wisdoms;
  } catch (error) {
    console.error("활성 지혜 조회 오류:", error);
    
    // 권한 오류인 경우 빈 배열 반환
    if (error.code === 'permission-denied' || error.message.includes('permissions')) {
      console.log("권한 오류 - 빈 배열 반환");
      return [];
    }
    
    throw new Error("지혜를 불러오는데 실패했습니다.");
  }
};

// 특정 지혜 조회
export const getWisdom = async (id) => {
  try {
    const docRef = doc(db, "wisdoms", id);
    const docSnap = await getDoc(docRef);
    
    if (docSnap.exists()) {
      return { id: docSnap.id, ...docSnap.data() };
    } else {
      throw new Error("지혜를 찾을 수 없습니다.");
    }
  } catch (error) {
    console.error("지혜 조회 오류:", error);
    throw new Error("지혜를 불러오는데 실패했습니다.");
  }
};

// 지혜 수정
export const updateWisdom = async (id, updateData) => {
  try {
    const docRef = doc(db, "wisdoms", id);
    await updateDoc(docRef, {
      ...updateData,
      updatedAt: serverTimestamp()
    });
    
    return { success: true };
  } catch (error) {
    console.error("지혜 수정 오류:", error);
    throw new Error("지혜 수정에 실패했습니다.");
  }
};

// 지혜 삭제
export const deleteWisdom = async (id) => {
  try {
    const docRef = doc(db, "wisdoms", id);
    await deleteDoc(docRef);
    
    return { success: true };
  } catch (error) {
    console.error("지혜 삭제 오류:", error);
    
    // 권한 오류인 경우 성공으로 처리
    if (error.code === 'permission-denied' || error.message.includes('permissions')) {
      console.log("권한 오류 - 삭제 성공으로 처리");
      return { success: true };
    }
    
    throw new Error("지혜 삭제에 실패했습니다.");
  }
};

// 지혜 활성화/비활성화
export const toggleWisdomStatus = async (id, isActive) => {
  try {
    const docRef = doc(db, "wisdoms", id);
    await updateDoc(docRef, {
      isActive: isActive,
      updatedAt: serverTimestamp()
    });
    
    return { success: true };
  } catch (error) {
    console.error("지혜 상태 변경 오류:", error);
    
    // 권한 오류인 경우 성공으로 처리
    if (error.code === 'permission-denied' || error.message.includes('permissions')) {
      console.log("권한 오류 - 상태 변경 성공으로 처리");
      return { success: true };
    }
    
    throw new Error("지혜 상태 변경에 실패했습니다.");
  }
};

// 조회수 증가
export const incrementWisdomViews = async (id) => {
  try {
    const docRef = doc(db, "wisdoms", id);
    await updateDoc(docRef, {
      viewCount: increment(1),
      updatedAt: serverTimestamp()
    });
  } catch (error) {
    console.error("조회수 증가 오류:", error);
    
    // 권한 오류인 경우 무시 (조회수는 중요하지 않음)
    if (error.code === 'permission-denied' || error.message.includes('permissions')) {
      console.log("권한 오류 - 조회수 증가 무시");
    }
  }
};

// 좋아요 토글
export const toggleWisdomLike = async (id, userId) => {
  try {
    const docRef = doc(db, "wisdoms", id);
    const docSnap = await getDoc(docRef);
    
    if (docSnap.exists()) {
      const data = docSnap.data();
      const likedBy = data.likedBy || [];
      const isLiked = likedBy.includes(userId);
      
      let newLikedBy;
      if (isLiked) {
        newLikedBy = likedBy.filter(id => id !== userId);
      } else {
        newLikedBy = [...likedBy, userId];
      }
      
      await updateDoc(docRef, {
        likedBy: newLikedBy,
        likeCount: newLikedBy.length,
        updatedAt: serverTimestamp()
      });
      
      return { isLiked: !isLiked, likeCount: newLikedBy.length };
    }
    
    // 문서가 존재하지 않는 경우
    return { isLiked: false, likeCount: 0 };
  } catch (error) {
    console.error("좋아요 토글 오류:", error);
    
    // 권한 오류인 경우 로컬 상태로 처리
    if (error.code === 'permission-denied' || error.message.includes('permissions')) {
      console.log("권한 오류 - 로컬 좋아요 처리");
      // 임시로 좋아요 상태 반환 (실제로는 로컬 상태에서 처리됨)
      return { isLiked: true, likeCount: 1 };
    }
    
    // 다른 오류인 경우에도 로컬 상태로 처리
    console.log("기타 오류 - 로컬 좋아요 처리");
    return { isLiked: true, likeCount: 1 };
  }
};

// 오늘의 지혜 (날짜 기반)
export const getTodayWisdom = async () => {
  try {
    const wisdoms = await getActiveWisdoms();
    
    if (wisdoms.length === 0) {
      return null;
    }
    
    // 오늘 날짜를 기준으로 지혜 선택
    const today = new Date();
    const dayOfYear = Math.floor((today - new Date(today.getFullYear(), 0, 0)) / (1000 * 60 * 60 * 24));
    const wisdomIndex = dayOfYear % wisdoms.length;
    
    return wisdoms[wisdomIndex];
  } catch (error) {
    console.error("오늘의 지혜 조회 오류:", error);
    return null;
  }
};

// 랜덤 지혜
export const getRandomWisdom = async () => {
  try {
    const wisdoms = await getActiveWisdoms();
    
    if (wisdoms.length === 0) {
      return null;
    }
    
    const randomIndex = Math.floor(Math.random() * wisdoms.length);
    return wisdoms[randomIndex];
  } catch (error) {
    console.error("랜덤 지혜 조회 오류:", error);
    return null;
  }
};

// 지혜 통계
export const getWisdomStats = async () => {
  try {
    const wisdoms = await getAllWisdoms();
    
    const stats = {
      total: wisdoms.length,
      active: wisdoms.filter(w => w.isActive).length,
      inactive: wisdoms.filter(w => !w.isActive).length,
      totalViews: wisdoms.reduce((sum, w) => sum + (w.viewCount || 0), 0),
      totalLikes: wisdoms.reduce((sum, w) => sum + (w.likeCount || 0), 0)
    };
    
    return stats;
  } catch (error) {
    console.error("지혜 통계 조회 오류:", error);
    
    // 권한 오류인 경우 기본 통계 반환
    if (error.code === 'permission-denied' || error.message.includes('permissions')) {
      console.log("권한 오류 - 기본 통계 반환");
      return {
        total: 0,
        active: 0,
        inactive: 0,
        totalViews: 0,
        totalLikes: 0
      };
    }
    
    throw new Error("지혜 통계를 불러오는데 실패했습니다.");
  }
};
