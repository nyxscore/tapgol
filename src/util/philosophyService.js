import { 
  collection, 
  addDoc, 
  getDocs, 
  getDoc, 
  doc, 
  updateDoc, 
  deleteDoc, 
  query, 
  where, 
  orderBy, 
  serverTimestamp,
  limit,
  increment
} from "firebase/firestore";
import { db } from "./firebase";

// 개똥철학 게시글 생성
export const createPhilosophyPost = async (postData) => {
  try {
    const postWithTimestamp = {
      ...postData,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
      likes: 0,
      views: 0
    };
    
    const docRef = await addDoc(collection(db, "philosophy"), postWithTimestamp);
    return { id: docRef.id, ...postWithTimestamp };
  } catch (error) {
    console.error("개똥철학 게시글 생성 오류:", error);
    throw new Error("개똥철학 게시글 생성에 실패했습니다.");
  }
};

// 개똥철학 게시글 목록 조회
export const getPhilosophyPosts = async (limitCount = 20) => {
  try {
    const q = query(
      collection(db, "philosophy"),
      orderBy("createdAt", "desc"),
      limit(limitCount)
    );
    
    const querySnapshot = await getDocs(q);
    const posts = [];
    
    querySnapshot.forEach((doc) => {
      posts.push({
        id: doc.id,
        ...doc.data()
      });
    });
    
    return posts;
  } catch (error) {
    console.error("개똥철학 게시글 목록 조회 오류:", error);
    throw new Error("개똥철학 게시글 목록을 불러오는데 실패했습니다.");
  }
};

// 특정 개똥철학 게시글 조회
export const getPhilosophyPost = async (postId) => {
  try {
    if (!postId) {
      throw new Error("개똥철학 게시글 ID가 필요합니다.");
    }
    
    const docRef = doc(db, "philosophy", postId);
    const docSnap = await getDoc(docRef);
    
    if (docSnap.exists()) {
      return {
        id: docSnap.id,
        ...docSnap.data()
      };
    } else {
      throw new Error("개똥철학 게시글을 찾을 수 없습니다.");
    }
  } catch (error) {
    console.error("개똥철학 게시글 조회 오류:", error);
    throw error;
  }
};

// 개똥철학 게시글 수정
export const updatePhilosophyPost = async (postId, updateData) => {
  try {
    const postRef = doc(db, "philosophy", postId);
    await updateDoc(postRef, {
      ...updateData,
      updatedAt: serverTimestamp()
    });
  } catch (error) {
    console.error("개똥철학 게시글 수정 오류:", error);
    throw new Error("개똥철학 게시글 수정에 실패했습니다.");
  }
};

// 개똥철학 게시글 삭제
export const deletePhilosophyPost = async (postId) => {
  try {
    const postRef = doc(db, "philosophy", postId);
    await deleteDoc(postRef);
  } catch (error) {
    console.error("개똥철학 게시글 삭제 오류:", error);
    throw new Error("개똥철학 게시글 삭제에 실패했습니다.");
  }
};

// 조회수 증가
export const incrementViews = async (postId) => {
  try {
    const postRef = doc(db, "philosophy", postId);
    await updateDoc(postRef, {
      views: increment(1)
    });
  } catch (error) {
    console.error("조회수 증가 오류:", error);
  }
};

// 좋아요 토글
export const toggleLike = async (postId, userId) => {
  try {
    const postRef = doc(db, "philosophy", postId);
    const postSnap = await getDoc(postRef);
    
    if (!postSnap.exists()) {
      throw new Error("개똥철학 게시글을 찾을 수 없습니다.");
    }
    
    const postData = postSnap.data();
    const likedBy = postData.likedBy || [];
    const isLiked = likedBy.includes(userId);
    
    if (isLiked) {
      // 좋아요 취소
      await updateDoc(postRef, {
        likes: increment(-1),
        likedBy: likedBy.filter(uid => uid !== userId)
      });
      return false;
    } else {
      // 좋아요 추가
      await updateDoc(postRef, {
        likes: increment(1),
        likedBy: [...likedBy, userId]
      });
      return true;
    }
  } catch (error) {
    console.error("좋아요 토글 오류:", error);
    throw new Error("좋아요 처리에 실패했습니다.");
  }
};

// 사용자별 개똥철학 게시글 조회
export const getPhilosophyPostsByUser = async (userId) => {
  try {
    const q = query(
      collection(db, "philosophy"),
      where("authorId", "==", userId),
      orderBy("createdAt", "desc")
    );
    
    const querySnapshot = await getDocs(q);
    const posts = [];
    
    querySnapshot.forEach((doc) => {
      posts.push({
        id: doc.id,
        ...doc.data()
      });
    });
    
    return posts;
  } catch (error) {
    console.error("사용자 개똥철학 게시글 조회 오류:", error);
    throw new Error("사용자 개똥철학 게시글을 불러오는데 실패했습니다.");
  }
};
