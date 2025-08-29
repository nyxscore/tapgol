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

// 중고장터 게시글 작성
export const createMarketplacePost = async (postData) => {
  try {
    const postWithTimestamp = {
      ...postData,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
      sold: false,
      views: 0,
      likes: 0
    };
    
    const docRef = await addDoc(collection(db, "marketplace"), postWithTimestamp);
    return { id: docRef.id, ...postWithTimestamp };
  } catch (error) {
    console.error("중고장터 게시글 작성 오류:", error);
    throw new Error("게시글 작성에 실패했습니다.");
  }
};

// 중고장터 게시글 목록 조회
export const getMarketplacePosts = async (limitCount = 20) => {
  try {
    const q = query(
      collection(db, "marketplace"),
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
    console.error("중고장터 게시글 목록 조회 오류:", error);
    throw new Error("게시글 목록을 불러오는데 실패했습니다.");
  }
};

// 특정 중고장터 게시글 조회
export const getMarketplacePost = async (postId) => {
  try {
    const docRef = doc(db, "marketplace", postId);
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
    console.error("중고장터 게시글 조회 오류:", error);
    throw new Error("게시글을 불러오는데 실패했습니다.");
  }
};

// 중고장터 게시글 수정
export const updateMarketplacePost = async (postId, updateData) => {
  try {
    const postRef = doc(db, "marketplace", postId);
    await updateDoc(postRef, {
      ...updateData,
      updatedAt: serverTimestamp()
    });
  } catch (error) {
    console.error("중고장터 게시글 수정 오류:", error);
    throw new Error("게시글 수정에 실패했습니다.");
  }
};

// 중고장터 게시글 삭제
export const deleteMarketplacePost = async (postId) => {
  try {
    const postRef = doc(db, "marketplace", postId);
    await deleteDoc(postRef);
  } catch (error) {
    console.error("중고장터 게시글 삭제 오류:", error);
    throw new Error("게시글 삭제에 실패했습니다.");
  }
};

// 조회수 증가
export const incrementViews = async (postId) => {
  try {
    const postRef = doc(db, "marketplace", postId);
    await updateDoc(postRef, {
      views: increment(1)
    });
  } catch (error) {
    console.error("조회수 증가 오류:", error);
  }
};

// 판매 상태 변경
export const toggleSoldStatus = async (postId, sold) => {
  try {
    const postRef = doc(db, "marketplace", postId);
    await updateDoc(postRef, {
      sold: sold,
      updatedAt: serverTimestamp()
    });
  } catch (error) {
    console.error("판매 상태 변경 오류:", error);
    throw new Error("판매 상태 변경에 실패했습니다.");
  }
};

// 카테고리별 게시글 조회
export const getMarketplacePostsByCategory = async (category, limitCount = 20) => {
  try {
    const q = query(
      collection(db, "marketplace"),
      where("category", "==", category),
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
    console.error("카테고리별 게시글 조회 오류:", error);
    throw new Error("카테고리별 게시글을 불러오는데 실패했습니다.");
  }
};

// 사용자별 게시글 조회
export const getMarketplacePostsByUser = async (userId, limitCount = 20) => {
  try {
    const q = query(
      collection(db, "marketplace"),
      where("authorId", "==", userId),
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
    console.error("사용자별 게시글 조회 오류:", error);
    throw new Error("사용자별 게시글을 불러오는데 실패했습니다.");
  }
};

// 검색 기능
export const searchMarketplacePosts = async (searchTerm, limitCount = 20) => {
  try {
    // Firestore는 전체 텍스트 검색을 지원하지 않으므로
    // 클라이언트에서 필터링하는 방식으로 구현
    const allPosts = await getMarketplacePosts(100); // 더 많은 게시글을 가져와서 필터링
    
    const filteredPosts = allPosts.filter(post => 
      post.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      post.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      post.location?.toLowerCase().includes(searchTerm.toLowerCase())
    );
    
    return filteredPosts.slice(0, limitCount);
  } catch (error) {
    console.error("게시글 검색 오류:", error);
    throw new Error("검색에 실패했습니다.");
  }
};

// 가격 범위별 게시글 조회
export const getMarketplacePostsByPriceRange = async (minPrice, maxPrice, limitCount = 20) => {
  try {
    let q;
    
    if (minPrice && maxPrice) {
      q = query(
        collection(db, "marketplace"),
        where("price", ">=", minPrice),
        where("price", "<=", maxPrice),
        orderBy("price", "asc"),
        limit(limitCount)
      );
    } else if (minPrice) {
      q = query(
        collection(db, "marketplace"),
        where("price", ">=", minPrice),
        orderBy("price", "asc"),
        limit(limitCount)
      );
    } else if (maxPrice) {
      q = query(
        collection(db, "marketplace"),
        where("price", "<=", maxPrice),
        orderBy("price", "asc"),
        limit(limitCount)
      );
    } else {
      return getMarketplacePosts(limitCount);
    }
    
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
    console.error("가격 범위별 게시글 조회 오류:", error);
    throw new Error("가격 범위별 게시글을 불러오는데 실패했습니다.");
  }
};
