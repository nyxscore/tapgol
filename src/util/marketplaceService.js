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

// 데이터 검증 함수
const validatePostData = (postData) => {
  if (!postData) {
    throw new Error("게시글 데이터가 없습니다.");
  }
  
  if (!postData.title || postData.title.trim().length === 0) {
    throw new Error("제목을 입력해주세요.");
  }
  
  if (!postData.description || postData.description.trim().length === 0) {
    throw new Error("상품 설명을 입력해주세요.");
  }
  
  if (postData.price && (isNaN(postData.price) || postData.price < 0)) {
    throw new Error("올바른 가격을 입력해주세요.");
  }
  
  return true;
};

// 중고장터 게시글 작성
export const createMarketplacePost = async (postData) => {
  try {
    // 데이터 검증
    validatePostData(postData);
    
    const postWithTimestamp = {
      ...postData,
      title: postData.title.trim(),
      description: postData.description.trim(),
      price: postData.price ? Number(postData.price) : null,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
      sold: false,
      views: 0,
      likes: 0,
      commentCount: 0
    };
    
    const docRef = await addDoc(collection(db, "marketplace"), postWithTimestamp);
    return { id: docRef.id, ...postWithTimestamp };
  } catch (error) {
    console.error("중고장터 게시글 작성 오류:", error);
    if (error.message.includes("제목") || error.message.includes("설명") || error.message.includes("가격")) {
      throw error;
    }
    throw new Error("게시글 작성에 실패했습니다.");
  }
};

// 중고장터 게시글 목록 조회
export const getMarketplacePosts = async (limitCount = 20) => {
  try {
    if (limitCount && (isNaN(limitCount) || limitCount < 1)) {
      limitCount = 20;
    }
    
    const q = query(
      collection(db, "marketplace"),
      orderBy("createdAt", "desc"),
      limit(limitCount)
    );
    
    const querySnapshot = await getDocs(q);
    const posts = [];
    
    querySnapshot.forEach((doc) => {
      try {
        const data = doc.data();
        posts.push({
          id: doc.id,
          title: data.title || '제목 없음',
          description: data.description || '',
          price: data.price || null,
          category: data.category || 'other',
          location: data.location || '',
          author: data.author || data.authorName || '익명',
          authorId: data.authorId || '',
          images: Array.isArray(data.images) ? data.images : [],
          sold: Boolean(data.sold),
          views: Number(data.views) || 0,
          likes: Number(data.likes) || 0,
          createdAt: data.createdAt,
          updatedAt: data.updatedAt
        });
      } catch (docError) {
        console.error(`게시글 ${doc.id} 데이터 처리 오류:`, docError);
        // 개별 문서 오류는 무시하고 계속 진행
      }
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
    if (!postId || typeof postId !== 'string') {
      throw new Error("올바른 게시글 ID가 아닙니다.");
    }
    
    const docRef = doc(db, "marketplace", postId);
    const docSnap = await getDoc(docRef);
    
    if (docSnap.exists()) {
      const data = docSnap.data();
      return {
        id: docSnap.id,
        title: data.title || '제목 없음',
        description: data.description || '',
        price: data.price || null,
        category: data.category || 'other',
        location: data.location || '',
        author: data.author || '익명',
        authorId: data.authorId || '',
        images: Array.isArray(data.images) ? data.images : [],
        sold: Boolean(data.sold),
        views: Number(data.views) || 0,
        likes: Number(data.likes) || 0,
        createdAt: data.createdAt,
        updatedAt: data.updatedAt
      };
    } else {
      throw new Error("게시글을 찾을 수 없습니다.");
    }
  } catch (error) {
    console.error("중고장터 게시글 조회 오류:", error);
    if (error.message.includes("올바른 게시글 ID") || error.message.includes("찾을 수 없습니다")) {
      throw error;
    }
    throw new Error("게시글을 불러오는데 실패했습니다.");
  }
};

// 중고장터 게시글 수정
export const updateMarketplacePost = async (postId, updateData) => {
  try {
    if (!postId || typeof postId !== 'string') {
      throw new Error("올바른 게시글 ID가 아닙니다.");
    }
    
    // 수정할 데이터 검증
    if (updateData.title && updateData.title.trim().length === 0) {
      throw new Error("제목을 입력해주세요.");
    }
    
    if (updateData.description && updateData.description.trim().length === 0) {
      throw new Error("상품 설명을 입력해주세요.");
    }
    
    if (updateData.price && (isNaN(updateData.price) || updateData.price < 0)) {
      throw new Error("올바른 가격을 입력해주세요.");
    }
    
    const postRef = doc(db, "marketplace", postId);
    
    // 기존 문서 존재 확인
    const docSnap = await getDoc(postRef);
    if (!docSnap.exists()) {
      throw new Error("수정할 게시글을 찾을 수 없습니다.");
    }
    
    const cleanUpdateData = {
      ...updateData,
      title: updateData.title ? updateData.title.trim() : undefined,
      description: updateData.description ? updateData.description.trim() : undefined,
      price: updateData.price ? Number(updateData.price) : undefined,
      updatedAt: serverTimestamp()
    };
    
    // undefined 값 제거
    Object.keys(cleanUpdateData).forEach(key => {
      if (cleanUpdateData[key] === undefined) {
        delete cleanUpdateData[key];
      }
    });
    
    await updateDoc(postRef, cleanUpdateData);
  } catch (error) {
    console.error("중고장터 게시글 수정 오류:", error);
    if (error.message.includes("제목") || error.message.includes("설명") || error.message.includes("가격") || 
        error.message.includes("ID") || error.message.includes("찾을 수 없습니다")) {
      throw error;
    }
    throw new Error("게시글 수정에 실패했습니다.");
  }
};

// 중고장터 게시글 삭제
export const deleteMarketplacePost = async (postId) => {
  try {
    if (!postId || typeof postId !== 'string') {
      throw new Error("올바른 게시글 ID가 아닙니다.");
    }
    
    const postRef = doc(db, "marketplace", postId);
    
    // 기존 문서 존재 확인
    const docSnap = await getDoc(postRef);
    if (!docSnap.exists()) {
      throw new Error("삭제할 게시글을 찾을 수 없습니다.");
    }
    
    await deleteDoc(postRef);
  } catch (error) {
    console.error("중고장터 게시글 삭제 오류:", error);
    if (error.message.includes("ID") || error.message.includes("찾을 수 없습니다")) {
      throw error;
    }
    throw new Error("게시글 삭제에 실패했습니다.");
  }
};

// 조회수 증가
export const incrementViews = async (postId) => {
  try {
    if (!postId || typeof postId !== 'string') {
      console.error("조회수 증가: 올바른 게시글 ID가 아닙니다.");
      return;
    }
    
    const postRef = doc(db, "marketplace", postId);
    await updateDoc(postRef, {
      views: increment(1)
    });
  } catch (error) {
    console.error("조회수 증가 오류:", error);
    // 조회수 증가 실패는 무시하고 계속 진행
  }
};

// 판매 상태 변경
export const toggleSoldStatus = async (postId, sold) => {
  try {
    if (!postId || typeof postId !== 'string') {
      throw new Error("올바른 게시글 ID가 아닙니다.");
    }
    
    if (typeof sold !== 'boolean') {
      throw new Error("올바른 판매 상태가 아닙니다.");
    }
    
    const postRef = doc(db, "marketplace", postId);
    
    // 기존 문서 존재 확인
    const docSnap = await getDoc(postRef);
    if (!docSnap.exists()) {
      throw new Error("상태를 변경할 게시글을 찾을 수 없습니다.");
    }
    
    await updateDoc(postRef, {
      sold: sold,
      updatedAt: serverTimestamp()
    });
  } catch (error) {
    console.error("판매 상태 변경 오류:", error);
    if (error.message.includes("ID") || error.message.includes("상태") || error.message.includes("찾을 수 없습니다")) {
      throw error;
    }
    throw new Error("판매 상태 변경에 실패했습니다.");
  }
};

// 카테고리별 게시글 조회
export const getMarketplacePostsByCategory = async (category, limitCount = 20) => {
  try {
    if (!category || typeof category !== 'string') {
      throw new Error("올바른 카테고리가 아닙니다.");
    }
    
    if (limitCount && (isNaN(limitCount) || limitCount < 1)) {
      limitCount = 20;
    }
    
    const q = query(
      collection(db, "marketplace"),
      where("category", "==", category),
      orderBy("createdAt", "desc"),
      limit(limitCount)
    );
    
    const querySnapshot = await getDocs(q);
    const posts = [];
    
    querySnapshot.forEach((doc) => {
      try {
        const data = doc.data();
        posts.push({
          id: doc.id,
          title: data.title || '제목 없음',
          description: data.description || '',
          price: data.price || null,
          category: data.category || 'other',
          location: data.location || '',
          author: data.author || data.authorName || '익명',
          authorId: data.authorId || '',
          images: Array.isArray(data.images) ? data.images : [],
          sold: Boolean(data.sold),
          views: Number(data.views) || 0,
          likes: Number(data.likes) || 0,
          createdAt: data.createdAt,
          updatedAt: data.updatedAt
        });
      } catch (docError) {
        console.error(`카테고리별 게시글 ${doc.id} 데이터 처리 오류:`, docError);
      }
    });
    
    return posts;
  } catch (error) {
    console.error("카테고리별 게시글 조회 오류:", error);
    if (error.message.includes("카테고리")) {
      throw error;
    }
    throw new Error("카테고리별 게시글을 불러오는데 실패했습니다.");
  }
};

// 사용자별 게시글 조회
export const getMarketplacePostsByUser = async (userId, limitCount = 20) => {
  try {
    if (!userId || typeof userId !== 'string') {
      throw new Error("올바른 사용자 ID가 아닙니다.");
    }
    
    if (limitCount && (isNaN(limitCount) || limitCount < 1)) {
      limitCount = 20;
    }
    
    const q = query(
      collection(db, "marketplace"),
      where("authorId", "==", userId),
      orderBy("createdAt", "desc"),
      limit(limitCount)
    );
    
    const querySnapshot = await getDocs(q);
    const posts = [];
    
    querySnapshot.forEach((doc) => {
      try {
        const data = doc.data();
        posts.push({
          id: doc.id,
          title: data.title || '제목 없음',
          description: data.description || '',
          price: data.price || null,
          category: data.category || 'other',
          location: data.location || '',
          author: data.author || data.authorName || '익명',
          authorId: data.authorId || '',
          images: Array.isArray(data.images) ? data.images : [],
          sold: Boolean(data.sold),
          views: Number(data.views) || 0,
          likes: Number(data.likes) || 0,
          createdAt: data.createdAt,
          updatedAt: data.updatedAt
        });
      } catch (docError) {
        console.error(`사용자별 게시글 ${doc.id} 데이터 처리 오류:`, docError);
      }
    });
    
    return posts;
  } catch (error) {
    console.error("사용자별 게시글 조회 오류:", error);
    if (error.message.includes("사용자 ID")) {
      throw error;
    }
    throw new Error("사용자별 게시글을 불러오는데 실패했습니다.");
  }
};

// 검색 기능
export const searchMarketplacePosts = async (searchTerm, limitCount = 20) => {
  try {
    if (!searchTerm || typeof searchTerm !== 'string' || searchTerm.trim().length === 0) {
      throw new Error("검색어를 입력해주세요.");
    }
    
    if (limitCount && (isNaN(limitCount) || limitCount < 1)) {
      limitCount = 20;
    }
    
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
    console.error("검색 기능 오류:", error);
    if (error.message.includes("검색어")) {
      throw error;
    }
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
