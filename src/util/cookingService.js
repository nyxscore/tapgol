import { 
  collection, addDoc, getDocs, getDoc, doc, updateDoc, deleteDoc, 
  query, where, orderBy, limit, serverTimestamp, increment 
} from "firebase/firestore";
import { db } from "./firebase";
import { getUserProfile } from "./userService";

// 나만의 요리 게시글 작성
export const createCookingPost = async (postData) => {
  try {
    const postWithTimestamp = {
      ...postData,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
      views: 0,
      likes: 0,
      commentCount: 0
    };
    const docRef = await addDoc(collection(db, "cookingPosts"), postWithTimestamp);
    return { id: docRef.id, ...postWithTimestamp };
  } catch (error) {
    console.error("나만의 요리 게시글 작성 오류:", error);
    throw new Error("게시글 작성에 실패했습니다.");
  }
};

// 모든 나만의 요리 게시글 조회
export const getAllCookingPosts = async () => {
  try {
    const q = query(
      collection(db, "cookingPosts"),
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
              updateDoc(doc(db, "cookingPosts", docSnapshot.id), {
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
    console.error("모든 나만의 요리 게시글 조회 오류:", error);
    throw new Error("나만의 요리 게시글을 불러오는데 실패했습니다.");
  }
};

// 나만의 요리 게시글 조회
export const getCookingPost = async (postId) => {
  try {
    const postRef = doc(db, "cookingPosts", postId);
    const postSnap = await getDoc(postRef);
    
    if (postSnap.exists()) {
      return {
        id: postSnap.id,
        ...postSnap.data()
      };
    } else {
      throw new Error("게시글을 찾을 수 없습니다.");
    }
  } catch (error) {
    console.error("나만의 요리 게시글 조회 오류:", error);
    throw new Error("게시글을 불러오는데 실패했습니다.");
  }
};

// 나만의 요리 게시글 수정
export const updateCookingPost = async (postId, updateData) => {
  try {
    const postRef = doc(db, "cookingPosts", postId);
    await updateDoc(postRef, {
      ...updateData,
      updatedAt: serverTimestamp()
    });
  } catch (error) {
    console.error("나만의 요리 게시글 수정 오류:", error);
    throw new Error("게시글 수정에 실패했습니다.");
  }
};

// 나만의 요리 게시글 삭제
export const deleteCookingPost = async (postId) => {
  try {
    const postRef = doc(db, "cookingPosts", postId);
    await deleteDoc(postRef);
  } catch (error) {
    console.error("나만의 요리 게시글 삭제 오류:", error);
    throw new Error("게시글 삭제에 실패했습니다.");
  }
};

// 조회수 증가
export const incrementViews = async (postId) => {
  try {
    const postRef = doc(db, "cookingPosts", postId);
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
    const postRef = doc(db, "cookingPosts", postId);
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
    console.error("좋아요 토글 오류:", error);
    throw new Error("좋아요 처리에 실패했습니다.");
  }
};

// 사용자별 나만의 요리 게시글 조회
export const getCookingPostsByUser = async (userId) => {
  try {
    const q = query(
      collection(db, "cookingPosts"),
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
    console.error("사용자별 나만의 요리 게시글 조회 오류:", error);
    throw new Error("사용자의 게시글을 불러오는데 실패했습니다.");
  }
};
