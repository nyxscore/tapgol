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
  limit, 
  serverTimestamp,
  increment
} from "firebase/firestore";
import { db } from "./firebase";

// 게시글 작성
export const createPost = async (postData) => {
  try {
    const postWithTimestamp = {
      ...postData,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
      views: 0,
      likes: 0,
      comments: []
    };
    
    const docRef = await addDoc(collection(db, "posts"), postWithTimestamp);
    return { id: docRef.id, ...postWithTimestamp };
  } catch (error) {
    console.error("게시글 작성 오류:", error);
    throw new Error("게시글 작성에 실패했습니다.");
  }
};

// 게시글 목록 조회
export const getPosts = async (limitCount = 20) => {
  try {
    const q = query(
      collection(db, "posts"),
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
    console.error("게시글 목록 조회 오류:", error);
    throw new Error("게시글 목록을 불러오는데 실패했습니다.");
  }
};

// 특정 게시글 조회
export const getPost = async (postId) => {
  try {
    const docRef = doc(db, "posts", postId);
    const docSnap = await getDoc(docRef);
    
    if (docSnap.exists()) {
      return {
        id: docSnap.id,
        ...docSnap.data()
      };
    } else {
      throw new Error("게시글을 찾을 수 없습니다.");
    }
  } catch (error) {
    console.error("게시글 조회 오류:", error);
    throw new Error("게시글을 불러오는데 실패했습니다.");
  }
};

// 조회수 증가
export const incrementViews = async (postId) => {
  try {
    const postRef = doc(db, "posts", postId);
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
    const postRef = doc(db, "posts", postId);
    const postSnap = await getDoc(postRef);
    
    if (!postSnap.exists()) {
      throw new Error("게시글을 찾을 수 없습니다.");
    }
    
    const postData = postSnap.data();
    const likedBy = postData.likedBy || [];
    const isLiked = likedBy.includes(userId);
    
    if (isLiked) {
      // 좋아요 취소
      const newLikedBy = likedBy.filter(id => id !== userId);
      await updateDoc(postRef, {
        likes: postData.likes - 1,
        likedBy: newLikedBy,
        updatedAt: serverTimestamp()
      });
    } else {
      // 좋아요 추가
      const newLikedBy = [...likedBy, userId];
      await updateDoc(postRef, {
        likes: postData.likes + 1,
        likedBy: newLikedBy,
        updatedAt: serverTimestamp()
      });
    }
    
    return !isLiked;
  } catch (error) {
    console.error("좋아요 토글 오류:", error);
    throw new Error("좋아요 처리에 실패했습니다.");
  }
};

// 게시글 수정
export const updatePost = async (postId, updateData) => {
  try {
    const postRef = doc(db, "posts", postId);
    await updateDoc(postRef, {
      ...updateData,
      updatedAt: serverTimestamp()
    });
  } catch (error) {
    console.error("게시글 수정 오류:", error);
    throw new Error("게시글 수정에 실패했습니다.");
  }
};

// 게시글 삭제
export const deletePost = async (postId) => {
  try {
    const postRef = doc(db, "posts", postId);
    await deleteDoc(postRef);
  } catch (error) {
    console.error("게시글 삭제 오류:", error);
    throw new Error("게시글 삭제에 실패했습니다.");
  }
};

// 사용자별 게시글 조회
export const getPostsByUser = async (userId) => {
  try {
    const q = query(
      collection(db, "posts"),
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
    console.error("사용자 게시글 조회 오류:", error);
    throw new Error("사용자 게시글을 불러오는데 실패했습니다.");
  }
};

// 카테고리별 게시글 조회
export const getPostsByCategory = async (category) => {
  try {
    const q = query(
      collection(db, "posts"),
      where("category", "==", category),
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
    console.error("카테고리별 게시글 조회 오류:", error);
    throw new Error("카테고리별 게시글을 불러오는데 실패했습니다.");
  }
};
