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
import { getUserProfile } from "./userService";

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
        where("category", "==", "philosophy")
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
        console.log("오류 코드:", collectionError.code);
        console.log("오류 메시지:", collectionError.message);
      }
    }
    
    // 3. 중복 제거 및 클라이언트 사이드 정렬 (인덱스 불필요)
    const uniquePosts = allPosts.reduce((acc, post) => {
      const existingPost = acc.find(p => p.id === post.id);
      if (!existingPost) {
        acc.push(post);
      }
      return acc;
    }, []);
    
    // 클라이언트 사이드에서 정렬하여 복합 인덱스 요구사항 제거
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
    console.log("개똥철학 게시글 삭제 시도:", postId);
    
    let postsDeleted = false;
    let philosophyDeleted = false;
    
    // posts 컬렉션에서 삭제 시도
    try {
      console.log("posts 컬렉션에서 삭제 시도...");
      const postsRef = doc(db, "posts", postId);
      await deleteDoc(postsRef);
      console.log("posts 컬렉션에서 삭제 성공");
      postsDeleted = true;
    } catch (postsError) {
      console.log("posts 컬렉션 삭제 실패:", postsError.message);
      
      // 권한 오류인 경우 더 자세한 정보 제공
      if (postsError.code === 'permission-denied') {
        console.error("posts 컬렉션 권한 거부됨 - 관리자 권한 확인 필요");
        throw new Error("삭제 권한이 없습니다. 관리자 권한을 확인해주세요.");
      }
    }
    
    // philosophy 컬렉션에서 삭제 시도
    try {
      console.log("philosophy 컬렉션에서 삭제 시도...");
      const philosophyRef = doc(db, "philosophy", postId);
      await deleteDoc(philosophyRef);
      console.log("philosophy 컬렉션에서 삭제 성공");
      philosophyDeleted = true;
    } catch (philosophyError) {
      console.error("philosophy 컬렉션 삭제 실패:", philosophyError);
      
      // 권한 오류인 경우 더 자세한 정보 제공
      if (philosophyError.code === 'permission-denied') {
        console.error("philosophy 컬렉션 권한 거부됨 - 관리자 권한 확인 필요");
        throw new Error("삭제 권한이 없습니다. 관리자 권한을 확인해주세요.");
      }
    }
    
    // 삭제 결과 확인
    if (postsDeleted || philosophyDeleted) {
      console.log("게시글 삭제 완료 - posts:", postsDeleted, "philosophy:", philosophyDeleted);
      return;
    } else {
      throw new Error("두 컬렉션 모두에서 삭제에 실패했습니다.");
    }
  } catch (error) {
    console.error("개똥철학 게시글 삭제 오류:", error);
    
    // 에러 타입에 따른 구체적인 메시지 제공
    if (error.code === 'permission-denied') {
      throw new Error("삭제 권한이 없습니다. 관리자 권한을 확인해주세요.");
    } else if (error.code === 'unavailable') {
      throw new Error("서비스가 일시적으로 사용할 수 없습니다. 잠시 후 다시 시도해주세요.");
    } else if (error.code === 'not-found') {
      throw new Error("게시글을 찾을 수 없습니다.");
    } else {
      throw new Error("개똥철학 게시글 삭제에 실패했습니다: " + error.message);
    }
  }
};

// 강제 삭제 함수 (관리자용)
export const forceDeletePhilosophyPost = async (postId) => {
  try {
    console.log("강제 삭제 시도:", postId);
    
    const deletePromises = [];
    
    // posts 컬렉션에서 삭제 시도
    try {
      const postsRef = doc(db, "posts", postId);
      deletePromises.push(deleteDoc(postsRef).then(() => {
        console.log("posts 컬렉션 강제 삭제 성공");
        return "posts";
      }).catch(error => {
        console.log("posts 컬렉션 강제 삭제 실패:", error.message);
        return null;
      }));
    } catch (error) {
      console.log("posts 컬렉션 참조 생성 실패:", error.message);
    }
    
    // philosophy 컬렉션에서 삭제 시도
    try {
      const philosophyRef = doc(db, "philosophy", postId);
      deletePromises.push(deleteDoc(philosophyRef).then(() => {
        console.log("philosophy 컬렉션 강제 삭제 성공");
        return "philosophy";
      }).catch(error => {
        console.log("philosophy 컬렉션 강제 삭제 실패:", error.message);
        return null;
      }));
    } catch (error) {
      console.log("philosophy 컬렉션 참조 생성 실패:", error.message);
    }
    
    // 모든 삭제 시도 완료 대기
    const results = await Promise.all(deletePromises);
    const successfulDeletes = results.filter(result => result !== null);
    
    console.log("강제 삭제 결과:", successfulDeletes);
    
    if (successfulDeletes.length > 0) {
      return { success: true, deletedFrom: successfulDeletes };
    } else {
      throw new Error("모든 컬렉션에서 삭제에 실패했습니다.");
    }
  } catch (error) {
    console.error("강제 삭제 오류:", error);
    throw error;
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
    
    // 1. posts 컬렉션에서 조회 (인덱스 없이 클라이언트에서 정렬)
    try {
      const postsQuery = query(
        collection(db, "posts"),
        where("authorId", "==", userId),
        where("category", "==", "philosophy")
      );
      
      const postsSnapshot = await getDocs(postsQuery);
      postsSnapshot.forEach((doc) => {
        allPosts.push({
          id: doc.id,
          ...doc.data()
        });
      });
    } catch (postsError) {
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
    }
    
    // 중복 제거 및 클라이언트 사이드 정렬 (인덱스 불필요)
    const uniquePosts = allPosts.reduce((acc, post) => {
      const existingPost = acc.find(p => p.id === post.id);
      if (!existingPost) {
        acc.push(post);
      }
      return acc;
    }, []);
    
    // 클라이언트 사이드에서 정렬하여 복합 인덱스 요구사항 제거
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

// 모든 개똥철학 게시글 조회
export const getAllPhilosophyPosts = async () => {
  try {
    const allPosts = [];
    
    // 1. posts 컬렉션에서 조회 (인덱스 없이 모든 데이터 가져온 후 클라이언트에서 필터링)
    try {
      const postsQuery = query(
        collection(db, "posts"),
        where("category", "==", "philosophy")
      );
      
      const postsSnapshot = await getDocs(postsQuery);
      postsSnapshot.forEach((doc) => {
        allPosts.push({
          id: doc.id,
          ...doc.data()
        });
      });
    } catch (postsError) {
    }
    
    // 2. philosophy 컬렉션에서 조회
    try {
      const philosophyQuery = query(
        collection(db, "philosophy"),
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
    }

    // 중복 제거 및 클라이언트 사이드 정렬 (인덱스 불필요)
    const uniquePosts = allPosts.reduce((acc, post) => {
      const existingPost = acc.find(p => p.id === post.id);
      if (!existingPost) {
        acc.push(post);
      }
      return acc;
    }, []);

    // 클라이언트 사이드에서 정렬하여 복합 인덱스 요구사항 제거
    uniquePosts.sort((a, b) => {
      const dateA = a.createdAt?.toDate ? a.createdAt.toDate() : new Date(a.createdAt);
      const dateB = b.createdAt?.toDate ? b.createdAt.toDate() : new Date(b.createdAt);
      return dateB - dateA;
    });

    // 각 게시글에 대해 작성자 정보를 동적으로 조회
    for (let i = 0; i < uniquePosts.length; i++) {
      const post = uniquePosts[i];
      let authorName = post.author || "익명";
      
      // authorId가 있고 author가 "익명"이거나 없으면 사용자 프로필에서 조회
      if (post.authorId && (!post.author || post.author === "익명")) {
        try {
          const userProfile = await getUserProfile(post.authorId);
          if (userProfile) {
            authorName = userProfile.nickname || userProfile.name || userProfile.displayName || "익명";
            // 작성자 정보를 업데이트 (선택적)
            if (authorName !== "익명") {
              const collectionName = post.fromOldCollection ? "philosophy" : "posts";
              updateDoc(doc(db, collectionName, post.id), {
                author: authorName
              }).catch(err => console.log("작성자 정보 업데이트 실패:", err));
            }
          }
        } catch (error) {
          console.log("작성자 정보 조회 실패:", error);
        }
      }
      
      // 작성자 정보 업데이트
      uniquePosts[i] = {
        ...post,
        author: authorName
      };
    }

    return uniquePosts;
  } catch (error) {
    console.error("모든 개똥철학 게시글 조회 오류:", error);
    throw new Error("개똥철학 게시글을 불러오는데 실패했습니다.");
  }
};
