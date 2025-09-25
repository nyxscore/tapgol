import { 
  collection, addDoc, getDocs, getDoc, doc, updateDoc, deleteDoc, 
  query, where, orderBy, limit, serverTimestamp, increment 
} from "firebase/firestore";
import { db } from "./firebase";
import { getUserProfile } from "./userService";

// 건강정보 게시글 작성
export const createHealthPost = async (postData) => {
  try {
    const postWithTimestamp = {
      ...postData,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
      views: 0,
      likes: 0,
      likedBy: [],
      commentCount: 0
    };
    
    const docRef = await addDoc(collection(db, "healthPosts"), postWithTimestamp);
    return { id: docRef.id, ...postWithTimestamp };
  } catch (error) {
    console.error("건강정보 게시글 작성 오류:", error);
    throw new Error("게시글 작성에 실패했습니다.");
  }
};

// 건강정보 게시글 목록 조회
export const getHealthPosts = async (limitCount = 20) => {
  try {
    console.log("건강정보 게시글 목록 조회 시작");
    
    const q = query(
      collection(db, "healthPosts"),
      orderBy("createdAt", "desc"),
      limit(limitCount)
    );
    
    console.log("Firestore 쿼리 생성 완료");
    
    const querySnapshot = await getDocs(q);
    console.log("Firestore 쿼리 실행 완료, 문서 수:", querySnapshot.size);
    
    const posts = [];
    
    querySnapshot.forEach((doc) => {
      const data = doc.data();
      console.log("문서 데이터:", { id: doc.id, ...data });
      posts.push({
        id: doc.id,
        ...data
      });
    });
    
    console.log("최종 게시글 목록:", posts);
    return posts;
  } catch (error) {
    console.error("건강정보 게시글 목록 조회 오류:", error);
    console.error("오류 상세:", error.message, error.code);
    throw new Error("게시글 목록을 불러오는데 실패했습니다.");
  }
};

// 특정 건강정보 게시글 조회
export const getHealthPost = async (postId) => {
  try {
    const docRef = doc(db, "healthPosts", postId);
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
    console.error("건강정보 게시글 조회 오류:", error);
    throw new Error("게시글을 불러오는데 실패했습니다.");
  }
};

// 건강정보 게시글 수정
export const updateHealthPost = async (postId, updateData) => {
  try {
    const postRef = doc(db, "healthPosts", postId);
    await updateDoc(postRef, {
      ...updateData,
      updatedAt: serverTimestamp()
    });
  } catch (error) {
    console.error("건강정보 게시글 수정 오류:", error);
    throw new Error("게시글 수정에 실패했습니다.");
  }
};

// 건강정보 게시글 삭제
export const deleteHealthPost = async (postId) => {
  try {
    const postRef = doc(db, "healthPosts", postId);
    await deleteDoc(postRef);
  } catch (error) {
    console.error("건강정보 게시글 삭제 오류:", error);
    throw new Error("게시글 삭제에 실패했습니다.");
  }
};

// 조회수 증가
export const incrementViews = async (postId) => {
  try {
    const postRef = doc(db, "healthPosts", postId);
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
    const postRef = doc(db, "healthPosts", postId);
    const postSnap = await getDoc(postRef);
    
    if (!postSnap.exists()) {
      throw new Error("게시글을 찾을 수 없습니다.");
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
    console.error("좋아요 처리 오류:", error);
    throw new Error("좋아요 처리에 실패했습니다.");
  }
};

// 사용자별 건강정보 게시글 조회
export const getHealthPostsByUser = async (userId) => {
  try {
    const q = query(
      collection(db, "healthPosts"),
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
    console.error("사용자 건강정보 게시글 조회 오류:", error);
    throw new Error("사용자 게시글을 불러오는데 실패했습니다.");
  }
};

// 카테고리별 건강정보 게시글 조회
export const getHealthPostsByCategory = async (category) => {
  try {
    const q = query(
      collection(db, "healthPosts"),
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
    console.error("카테고리별 건강정보 게시글 조회 오류:", error);
    throw new Error("카테고리별 게시글을 불러오는데 실패했습니다.");
  }
};

// 모든 건강정보 게시글 조회
export const getAllHealthPosts = async () => {
  try {
    const q = query(
      collection(db, "healthPosts"),
      orderBy("createdAt", "desc")
    );
    
    const querySnapshot = await getDocs(q);
    const posts = [];
    
    // 각 게시글에 대해 작성자 정보를 동적으로 조회
    for (const docSnapshot of querySnapshot.docs) {
      const postData = docSnapshot.data();
      let authorName = postData.author || "익명";
      
      // authorId가 있고 author가 "익명"이거나 없으면 사용자 프로필에서 조회
      if (postData.authorId && (!postData.author || postData.author === "익명")) {
        try {
          const userProfile = await getUserProfile(postData.authorId);
          if (userProfile) {
            authorName = userProfile.nickname || userProfile.name || userProfile.displayName || "익명";
            // 작성자 정보를 업데이트 (선택적)
            if (authorName !== "익명") {
              updateDoc(doc(db, "healthPosts", docSnapshot.id), {
                author: authorName
              }).catch(err => console.log("작성자 정보 업데이트 실패:", err));
            }
          }
        } catch (error) {
          console.log("작성자 정보 조회 실패:", error);
        }
      }
      
      posts.push({
        id: docSnapshot.id,
        ...postData,
        author: authorName
      });
    }
    
    return posts;
  } catch (error) {
    console.error("모든 건강정보 게시글 조회 오류:", error);
    throw new Error("건강정보 게시글을 불러오는데 실패했습니다.");
  }
};
