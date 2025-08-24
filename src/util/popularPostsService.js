import {
  collection,
  query,
  orderBy,
  limit,
  getDocs,
  where,
  serverTimestamp
} from "firebase/firestore";
import { db } from "./firebase";

// 좋아요가 많은 게시글들을 가져오는 함수 (게시판 + 갤러리)
export const getPopularPosts = async (limitCount = 3) => {
  try {
    // 게시판 글 가져오기
    const postsQuery = query(
      collection(db, "posts"),
      orderBy("likes", "desc"),
      limit(limitCount)
    );
    
    // 갤러리 글 가져오기
    const galleryQuery = query(
      collection(db, "gallery"),
      orderBy("likes", "desc"),
      limit(limitCount)
    );
    
    // 병렬로 데이터 가져오기
    const [postsSnapshot, gallerySnapshot] = await Promise.all([
      getDocs(postsQuery),
      getDocs(galleryQuery)
    ]);
    
    const allPosts = [];
    
    // 게시판 글 처리
    postsSnapshot.forEach((doc) => {
      const data = doc.data();
      allPosts.push({
        id: doc.id,
        type: 'post',
        category: data.category || '일반',
        ...data,
        createdAt: data.createdAt?.toDate?.() || data.createdAt,
        updatedAt: data.updatedAt?.toDate?.() || data.updatedAt
      });
    });
    
    // 갤러리 글 처리
    gallerySnapshot.forEach((doc) => {
      const data = doc.data();
      allPosts.push({
        id: doc.id,
        type: 'gallery',
        category: '갤러리',
        ...data,
        createdAt: data.createdAt?.toDate?.() || data.createdAt,
        updatedAt: data.updatedAt?.toDate?.() || data.updatedAt
      });
    });
    
    // 좋아요 수로 정렬하고 상위 limitCount개만 반환
    allPosts.sort((a, b) => (b.likes || 0) - (a.likes || 0));
    
    return allPosts.slice(0, limitCount);
  } catch (error) {
    console.error("인기글 조회 오류:", error);
    throw new Error("인기글을 불러오는데 실패했습니다.");
  }
};

// 카테고리별 인기글을 가져오는 함수
export const getPopularPostsByCategory = async (category, limitCount = 3) => {
  try {
    let postsQuery;
    
    if (category === '갤러리') {
      postsQuery = query(
        collection(db, "gallery"),
        orderBy("likes", "desc"),
        limit(limitCount)
      );
    } else {
      postsQuery = query(
        collection(db, "posts"),
        where("category", "==", category),
        orderBy("likes", "desc"),
        limit(limitCount)
      );
    }
    
    const querySnapshot = await getDocs(postsQuery);
    const popularPosts = [];
    
    querySnapshot.forEach((doc) => {
      const data = doc.data();
      popularPosts.push({
        id: doc.id,
        type: category === '갤러리' ? 'gallery' : 'post',
        category: category === '갤러리' ? '갤러리' : data.category,
        ...data,
        createdAt: data.createdAt?.toDate?.() || data.createdAt,
        updatedAt: data.updatedAt?.toDate?.() || data.updatedAt
      });
    });
    
    return popularPosts;
  } catch (error) {
    console.error("카테고리별 인기글 조회 오류:", error);
    throw new Error("카테고리별 인기글을 불러오는데 실패했습니다.");
  }
};

// 최근 일주일 내 인기글을 가져오는 함수
export const getRecentPopularPosts = async (limitCount = 3) => {
  try {
    const oneWeekAgo = new Date();
    oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);
    
    // 게시판 글 가져오기
    const postsQuery = query(
      collection(db, "posts"),
      where("createdAt", ">=", oneWeekAgo),
      orderBy("createdAt", "desc"),
      orderBy("likes", "desc"),
      limit(limitCount)
    );
    
    // 갤러리 글 가져오기
    const galleryQuery = query(
      collection(db, "gallery"),
      where("createdAt", ">=", oneWeekAgo),
      orderBy("createdAt", "desc"),
      orderBy("likes", "desc"),
      limit(limitCount)
    );
    
    // 병렬로 데이터 가져오기
    const [postsSnapshot, gallerySnapshot] = await Promise.all([
      getDocs(postsQuery),
      getDocs(galleryQuery)
    ]);
    
    const allPosts = [];
    
    // 게시판 글 처리
    postsSnapshot.forEach((doc) => {
      const data = doc.data();
      allPosts.push({
        id: doc.id,
        type: 'post',
        category: data.category || '일반',
        ...data,
        createdAt: data.createdAt?.toDate?.() || data.createdAt,
        updatedAt: data.updatedAt?.toDate?.() || data.updatedAt
      });
    });
    
    // 갤러리 글 처리
    gallerySnapshot.forEach((doc) => {
      const data = doc.data();
      allPosts.push({
        id: doc.id,
        type: 'gallery',
        category: '갤러리',
        ...data,
        createdAt: data.createdAt?.toDate?.() || data.createdAt,
        updatedAt: data.updatedAt?.toDate?.() || data.updatedAt
      });
    });
    
    // 좋아요 수로 정렬하고 상위 limitCount개만 반환
    allPosts.sort((a, b) => (b.likes || 0) - (a.likes || 0));
    
    return allPosts.slice(0, limitCount);
  } catch (error) {
    console.error("최근 인기글 조회 오류:", error);
    throw new Error("최근 인기글을 불러오는데 실패했습니다.");
  }
};
