import { 
  collection, addDoc, getDocs, getDoc, doc, updateDoc, deleteDoc, 
  query, where, orderBy, serverTimestamp 
} from "firebase/firestore";
import { db } from "./firebase";

// 건강정보 댓글 작성
export const createHealthComment = async (postId, commentData) => {
  try {
    const commentWithTimestamp = {
      ...commentData,
      postId,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
      likes: 0
    };
    
    const docRef = await addDoc(collection(db, "healthComments"), commentWithTimestamp);
    return { id: docRef.id, ...commentWithTimestamp };
  } catch (error) {
    console.error("건강정보 댓글 작성 오류:", error);
    throw new Error("댓글 작성에 실패했습니다.");
  }
};

// 건강정보 게시글의 댓글 목록 조회
export const getHealthComments = async (postId) => {
  try {
    const q = query(
      collection(db, "healthComments"),
      where("postId", "==", postId),
      orderBy("createdAt", "asc")
    );
    
    const querySnapshot = await getDocs(q);
    const comments = [];
    
    querySnapshot.forEach((doc) => {
      comments.push({
        id: doc.id,
        ...doc.data()
      });
    });
    
    return comments;
  } catch (error) {
    console.error("건강정보 댓글 목록 조회 오류:", error);
    throw new Error("댓글 목록을 불러오는데 실패했습니다.");
  }
};

// 특정 건강정보 댓글 조회
export const getHealthComment = async (commentId) => {
  try {
    const docRef = doc(db, "healthComments", commentId);
    const docSnap = await getDoc(docRef);
    
    if (docSnap.exists()) {
      return {
        id: docSnap.id,
        ...docSnap.data()
      };
    } else {
      throw new Error("댓글을 찾을 수 없습니다.");
    }
  } catch (error) {
    console.error("건강정보 댓글 조회 오류:", error);
    throw new Error("댓글을 불러오는데 실패했습니다.");
  }
};

// 건강정보 댓글 수정
export const updateHealthComment = async (commentId, updateData) => {
  try {
    const commentRef = doc(db, "healthComments", commentId);
    await updateDoc(commentRef, {
      ...updateData,
      updatedAt: serverTimestamp()
    });
  } catch (error) {
    console.error("건강정보 댓글 수정 오류:", error);
    throw new Error("댓글 수정에 실패했습니다.");
  }
};

// 건강정보 댓글 삭제
export const deleteHealthComment = async (commentId) => {
  try {
    const commentRef = doc(db, "healthComments", commentId);
    await deleteDoc(commentRef);
  } catch (error) {
    console.error("건강정보 댓글 삭제 오류:", error);
    throw new Error("댓글 삭제에 실패했습니다.");
  }
};

// 사용자별 건강정보 댓글 조회
export const getHealthCommentsByUser = async (userId) => {
  try {
    const q = query(
      collection(db, "healthComments"),
      where("authorId", "==", userId),
      orderBy("createdAt", "desc")
    );
    
    const querySnapshot = await getDocs(q);
    const comments = [];
    
    querySnapshot.forEach((doc) => {
      comments.push({
        id: doc.id,
        ...doc.data()
      });
    });
    
    return comments;
  } catch (error) {
    console.error("사용자 건강정보 댓글 조회 오류:", error);
    throw new Error("사용자 댓글을 불러오는데 실패했습니다.");
  }
};
