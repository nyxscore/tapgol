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
import { db, auth } from "./firebase";

// 개똥철학 게시글 생성
export const createPhilosophyPost = async (postData) => {
  try {
    const postWithTimestamp = {
      ...postData,
      category: "philosophy", // 개똥철학 카테고리 추가
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
      likes: 0,
      views: 0,
      commentCount: 0
    };
    
    const docRef = await addDoc(collection(db, "posts"), postWithTimestamp);
    return { id: docRef.id, ...postWithTimestamp };
  } catch (error) {
    console.error("개똥철학 게시글 생성 오류:", error);
    throw new Error("개똥철학 게시글 생성에 실패했습니다.");
  }
};

// 개똥철학 게시글 목록 조회
export const getPhilosophyPosts = async (limitCount = 20) => {
  try {
    console.log("개똥철학 게시글 목록 조회 시작");
    console.log("현재 인증 상태:", auth.currentUser ? "로그인됨" : "로그아웃됨");
    console.log("사용자 UID:", auth.currentUser?.uid);
    
    const allPosts = [];
    
    // 1. 새로운 posts 컬렉션에서 개똥철학 카테고리 조회
    try {
      console.log("posts 컬렉션에서 개똥철학 게시글 조회 중...");
      const postsQuery = query(
        collection(db, "posts"),
        where("category", "==", "philosophy"),
        orderBy("createdAt", "desc"),
        limit(limitCount)
      );
      
      const postsSnapshot = await getDocs(postsQuery);
      console.log("posts 컬렉션 조회 완료, 문서 수:", postsSnapshot.size);
      
      postsSnapshot.forEach((doc) => {
        allPosts.push({
          id: doc.id,
          ...doc.data()
        });
      });
    } catch (postsError) {
      console.log("posts 컬렉션 조회 실패:", postsError.message);
    }
    
    // 1-2. posts 컬렉션에서 모든 데이터 확인 (개똥철학 관련 키워드 검색)
    try {
      console.log("posts 컬렉션에서 모든 데이터 확인 중...");
      const allPostsQuery = query(
        collection(db, "posts"),
        orderBy("createdAt", "desc"),
        limit(50) // 더 많은 데이터 확인
      );
      
      const allPostsSnapshot = await getDocs(allPostsQuery);
      console.log("posts 컬렉션 전체 조회 완료, 문서 수:", allPostsSnapshot.size);
      
      allPostsSnapshot.forEach((doc) => {
        const data = doc.data();
        // 개똥철학 관련 키워드가 있는지 확인
        const isPhilosophy = data.category === "philosophy" || 
                           data.title?.includes("개똥철학") || 
                           data.content?.includes("개똥철학") ||
                           data.title?.includes("철학") ||
                           data.content?.includes("철학");
        
        if (isPhilosophy) {
          console.log("개똥철학 관련 게시글 발견:", doc.id, data.title);
          allPosts.push({
            id: doc.id,
            ...data
          });
        }
      });
    } catch (allPostsError) {
      console.log("posts 컬렉션 전체 조회 실패:", allPostsError.message);
    }
    
    // 2. 기존 philosophy 컬렉션에서도 조회 (권한이 있다면)
    const possibleCollections = ["philosophy", "philosophyPosts", "philosophy_posts"];
    
    for (const collectionName of possibleCollections) {
      try {
        console.log(`${collectionName} 컬렉션에서 기존 게시글 조회 중...`);
        
        const testCollection = collection(db, collectionName);
        console.log(`${collectionName} 컬렉션 참조 생성 성공`);
        
        const testQuery = query(testCollection, limit(10));
        console.log(`${collectionName} 쿼리 생성 성공`);
        
        const testSnapshot = await getDocs(testQuery);
        console.log(`${collectionName} 컬렉션 조회 완료, 문서 수:`, testSnapshot.size);
        
        if (testSnapshot.size > 0) {
          console.log(`${collectionName} 컬렉션에서 데이터 발견!`);
          testSnapshot.forEach((doc) => {
            console.log(`${collectionName} 문서:`, doc.id, doc.data());
            allPosts.push({
              id: doc.id,
              ...doc.data(),
              fromOldCollection: true,
              sourceCollection: collectionName
            });
          });
        } else {
          console.log(`${collectionName} 컬렉션에 데이터가 없습니다.`);
        }
      } catch (collectionError) {
        console.log(`${collectionName} 컬렉션 조회 실패:`, collectionError);
        console.log("오류 코드:", collectionError.code);
        console.log("오류 메시지:", collectionError.message);
      }
    }
    
    // 3. 생성일 기준으로 정렬하고 중복 제거
    const uniquePosts = allPosts.reduce((acc, post) => {
      const existingPost = acc.find(p => p.id === post.id);
      if (!existingPost) {
        acc.push(post);
      }
      return acc;
    }, []);
    
    // 생성일 기준으로 정렬
    uniquePosts.sort((a, b) => {
      const dateA = a.createdAt?.toDate ? a.createdAt.toDate() : new Date(a.createdAt);
      const dateB = b.createdAt?.toDate ? b.createdAt.toDate() : new Date(b.createdAt);
      return dateB - dateA;
    });
    
    // limitCount만큼만 반환
    const result = uniquePosts.slice(0, limitCount);
    
    console.log("개똥철학 게시글 목록 조회 완료:", result.length, "개");
    return result;
  } catch (error) {
    console.error("개똥철학 게시글 목록 조회 오류:", error);
    console.error("오류 상세:", error.code, error.message);
    
    // 권한 오류인 경우 빈 배열 반환
    if (error.code === 'permission-denied') {
      console.log("권한 오류로 인해 빈 배열을 반환합니다.");
      return [];
    }
    
    throw new Error("개똥철학 게시글 목록을 불러오는데 실패했습니다.");
  }
};

// 특정 개똥철학 게시글 조회
export const getPhilosophyPost = async (postId) => {
  try {
    if (!postId) {
      throw new Error("개똥철학 게시글 ID가 필요합니다.");
    }
    
    // 1. 먼저 posts 컬렉션에서 조회
    try {
      const postsDocRef = doc(db, "posts", postId);
      const postsDocSnap = await getDoc(postsDocRef);
      
      if (postsDocSnap.exists()) {
        const data = postsDocSnap.data();
        // 개똥철학 카테고리인지 확인
        if (data.category === "philosophy") {
          return {
            id: postsDocSnap.id,
            ...data
          };
        }
      }
    } catch (postsError) {
      console.log("posts 컬렉션에서 조회 실패:", postsError.message);
    }
    
    // 2. philosophy 컬렉션에서 조회
    try {
      const philosophyDocRef = doc(db, "philosophy", postId);
      const philosophyDocSnap = await getDoc(philosophyDocRef);
      
      if (philosophyDocSnap.exists()) {
        return {
          id: philosophyDocSnap.id,
          ...philosophyDocSnap.data(),
          fromOldCollection: true
        };
      }
    } catch (philosophyError) {
      console.log("philosophy 컬렉션에서 조회 실패:", philosophyError.message);
    }
    
    throw new Error("개똥철학 게시글을 찾을 수 없습니다.");
  } catch (error) {
    console.error("개똥철학 게시글 조회 오류:", error);
    throw error;
  }
};

// 개똥철학 게시글 수정
export const updatePhilosophyPost = async (postId, updateData) => {
  try {
    // 먼저 posts 컬렉션에서 시도
    try {
      const postsRef = doc(db, "posts", postId);
      await updateDoc(postsRef, {
        ...updateData,
        updatedAt: serverTimestamp()
      });
      return;
    } catch (postsError) {
      console.log("posts 컬렉션 수정 실패:", postsError.message);
    }
    
    // philosophy 컬렉션에서 시도
    const philosophyRef = doc(db, "philosophy", postId);
    await updateDoc(philosophyRef, {
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
    // 먼저 posts 컬렉션에서 시도
    try {
      const postsRef = doc(db, "posts", postId);
      await deleteDoc(postsRef);
      return;
    } catch (postsError) {
      console.log("posts 컬렉션 삭제 실패:", postsError.message);
    }
    
    // philosophy 컬렉션에서 시도
    const philosophyRef = doc(db, "philosophy", postId);
    await deleteDoc(philosophyRef);
  } catch (error) {
    console.error("개똥철학 게시글 삭제 오류:", error);
    throw new Error("개똥철학 게시글 삭제에 실패했습니다.");
  }
};

// 조회수 증가
export const incrementViews = async (postId) => {
  try {
    // 먼저 posts 컬렉션에서 시도
    try {
      const postsRef = doc(db, "posts", postId);
      await updateDoc(postsRef, {
        views: increment(1)
      });
      return;
    } catch (postsError) {
      console.log("posts 컬렉션 조회수 증가 실패:", postsError.message);
    }
    
    // philosophy 컬렉션에서 시도
    const philosophyRef = doc(db, "philosophy", postId);
    await updateDoc(philosophyRef, {
      views: increment(1)
    });
  } catch (error) {
    console.error("조회수 증가 오류:", error);
  }
};

// 좋아요 토글
export const toggleLike = async (postId, userId) => {
  try {
    // 먼저 posts 컬렉션에서 시도
    try {
      const postsRef = doc(db, "posts", postId);
      const postsSnap = await getDoc(postsRef);
      
      if (postsSnap.exists()) {
        const postData = postsSnap.data();
        const likedBy = postData.likedBy || [];
        const isLiked = likedBy.includes(userId);
        
        if (isLiked) {
          // 좋아요 취소
          await updateDoc(postsRef, {
            likes: increment(-1),
            likedBy: likedBy.filter(uid => uid !== userId)
          });
          return false;
        } else {
          // 좋아요 추가
          await updateDoc(postsRef, {
            likes: increment(1),
            likedBy: [...likedBy, userId]
          });
          return true;
        }
      }
    } catch (postsError) {
      console.log("posts 컬렉션 좋아요 처리 실패:", postsError.message);
    }
    
    // philosophy 컬렉션에서 시도
    const philosophyRef = doc(db, "philosophy", postId);
    const philosophySnap = await getDoc(philosophyRef);
    
    if (!philosophySnap.exists()) {
      throw new Error("개똥철학 게시글을 찾을 수 없습니다.");
    }
    
    const postData = philosophySnap.data();
    const likedBy = postData.likedBy || [];
    const isLiked = likedBy.includes(userId);
    
    if (isLiked) {
      // 좋아요 취소
      await updateDoc(philosophyRef, {
        likes: increment(-1),
        likedBy: likedBy.filter(uid => uid !== userId)
      });
      return false;
    } else {
      // 좋아요 추가
      await updateDoc(philosophyRef, {
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
    const allPosts = [];
    
    // 1. posts 컬렉션에서 조회
    try {
      const postsQuery = query(
        collection(db, "posts"),
        where("authorId", "==", userId),
        where("category", "==", "philosophy"),
        orderBy("createdAt", "desc")
      );
      
      const postsSnapshot = await getDocs(postsQuery);
      postsSnapshot.forEach((doc) => {
        allPosts.push({
          id: doc.id,
          ...doc.data()
        });
      });
    } catch (postsError) {
      console.log("posts 컬렉션 사용자 게시글 조회 실패:", postsError.message);
    }
    
    // 2. philosophy 컬렉션에서 조회
    try {
      const philosophyQuery = query(
        collection(db, "philosophy"),
        where("authorId", "==", userId),
        orderBy("createdAt", "desc")
      );
      
      const philosophySnapshot = await getDocs(philosophyQuery);
      philosophySnapshot.forEach((doc) => {
        allPosts.push({
          id: doc.id,
          ...doc.data(),
          fromOldCollection: true
        });
      });
    } catch (philosophyError) {
      console.log("philosophy 컬렉션 사용자 게시글 조회 실패:", philosophyError.message);
    }
    
    // 중복 제거 및 정렬
    const uniquePosts = allPosts.reduce((acc, post) => {
      const existingPost = acc.find(p => p.id === post.id);
      if (!existingPost) {
        acc.push(post);
      }
      return acc;
    }, []);
    
    uniquePosts.sort((a, b) => {
      const dateA = a.createdAt?.toDate ? a.createdAt.toDate() : new Date(a.createdAt);
      const dateB = b.createdAt?.toDate ? b.createdAt.toDate() : new Date(b.createdAt);
      return dateB - dateA;
    });
    
    return uniquePosts;
  } catch (error) {
    console.error("사용자 개똥철학 게시글 조회 오류:", error);
    throw new Error("사용자 개똥철학 게시글을 불러오는데 실패했습니다.");
  }
};
