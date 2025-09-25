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
  setDoc,
  increment
} from "firebase/firestore";
import { db, auth } from "./firebase";


// 댓글 작성 (통합)
export const createComment = async (postId, commentData, boardType = "board") => {
  try {
    console.log("댓글 작성 시작:", { postId, boardType, commentData });
    
    const commentWithTimestamp = {
      ...commentData,
      postId,
      boardType, // 게시판 타입 추가 (board, gallery, health, karaoke 등)
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
      likes: 0
    };
    
    console.log("Firestore에 저장할 데이터:", commentWithTimestamp);
    
    const docRef = await addDoc(collection(db, "comments"), commentWithTimestamp);
    console.log("댓글 저장 성공, 문서 ID:", docRef.id);
    
    // 게시글의 commentCount 증가
    try {
      const collectionName = getCollectionName(boardType);
      const postRef = doc(db, collectionName, postId);
      await updateDoc(postRef, {
        commentCount: increment(1),
        updatedAt: serverTimestamp()
      });
      console.log("게시글 commentCount 증가 완료");
    } catch (updateError) {
      console.error("commentCount 업데이트 오류:", updateError);
      // commentCount 업데이트 실패해도 댓글 작성은 성공으로 처리
    }
    
    const result = { id: docRef.id, ...commentWithTimestamp };
    console.log("반환할 댓글 데이터:", result);
    
    return result;
  } catch (error) {
    console.error("댓글 작성 오류:", error);
    console.error("오류 상세 정보:", {
      code: error.code,
      message: error.message,
      stack: error.stack
    });
    throw new Error("댓글 작성에 실패했습니다.");
  }
};

// 게시글의 댓글 목록 조회 (통합) - 안전한 버전
export const getComments = async (postId, boardType = "board") => {
  try {
    console.log('getComments 호출:', { postId, boardType });
    
    // postId로만 조회하여 모든 댓글 가져오기 (boardType 필터링 제거)
    const commentsQuery = query(
      collection(db, "comments"),
      where("postId", "==", postId)
    );
    
    const commentsSnapshot = await getDocs(commentsQuery);
    console.log('댓글 조회 결과:', { postId, totalCount: commentsSnapshot.size });
    
    const comments = [];
    let missingBoardTypeCount = 0;
    
    commentsSnapshot.forEach((doc) => {
      const data = doc.data();
      
      // boardType이 없는 댓글 카운트
      if (!data.boardType || data.boardType === undefined) {
        missingBoardTypeCount++;
      }
      
      // 모든 댓글을 포함하되, boardType 필드가 없으면 현재 boardType으로 설정
      comments.push({
        id: doc.id,
        ...data,
        boardType: data.boardType || boardType
      });
    });
    
    if (missingBoardTypeCount > 0) {
      console.log('boardType이 없는 댓글:', { postId, count: missingBoardTypeCount });
    }
    
    console.log('최종 댓글 수:', { postId, boardType, totalComments: comments.length });
    
    // 클라이언트에서 날짜순으로 정렬
    comments.sort((a, b) => {
      const dateA = a.createdAt?.toDate ? a.createdAt.toDate() : new Date(a.createdAt);
      const dateB = b.createdAt?.toDate ? b.createdAt.toDate() : new Date(b.createdAt);
      return dateA - dateB;
    });
    
    return comments;
  } catch (error) {
    console.error("댓글 목록 조회 오류:", error);
    // 오류가 발생해도 빈 배열 반환하여 앱이 중단되지 않도록 함
    return [];
  }
};

// 댓글 진단 함수 - 모든 댓글의 상태를 확인
export const diagnoseComments = async () => {
  try {
    console.log('=== 댓글 진단 시작 ===');
    
    const commentsSnapshot = await getDocs(collection(db, "comments"));
    console.log('전체 댓글 수:', commentsSnapshot.size);
    
    const diagnosis = {
      total: commentsSnapshot.size,
      withBoardType: 0,
      withoutBoardType: 0,
      byPostId: {},
      byBoardType: {}
    };
    
    commentsSnapshot.forEach((doc) => {
      const data = doc.data();
      const postId = data.postId;
      
      // boardType 통계
      if (data.boardType && data.boardType !== undefined) {
        diagnosis.withBoardType++;
        diagnosis.byBoardType[data.boardType] = (diagnosis.byBoardType[data.boardType] || 0) + 1;
      } else {
        diagnosis.withoutBoardType++;
      }
      
      // postId별 통계
      if (postId) {
        diagnosis.byPostId[postId] = (diagnosis.byPostId[postId] || 0) + 1;
      }
    });
    
    console.log('댓글 진단 결과:', diagnosis);
    console.log('=== 댓글 진단 완료 ===');
    
    return diagnosis;
  } catch (error) {
    console.error('댓글 진단 오류:', error);
    return null;
  }
};

// 특정 포스트의 댓글을 강제로 다시 계산하는 함수
export const recalculatePostCommentCount = async (postId) => {
  try {
    console.log('포스트 댓글 수 재계산:', { postId });
    
    // 해당 포스트의 모든 댓글 조회
    const commentsQuery = query(
      collection(db, "comments"),
      where("postId", "==", postId)
    );
    
    const commentsSnapshot = await getDocs(commentsQuery);
    const actualCount = commentsSnapshot.size;
    
    console.log('실제 댓글 수:', { postId, actualCount });
    
    // 각 댓글의 상세 정보 로그
    commentsSnapshot.forEach((doc) => {
      const data = doc.data();
      console.log('댓글 상세:', {
        id: doc.id,
        postId: data.postId,
        boardType: data.boardType,
        content: data.content?.substring(0, 30),
        createdAt: data.createdAt?.toDate?.() || data.createdAt
      });
    });
    
    return actualCount;
  } catch (error) {
    console.error('댓글 수 재계산 오류:', error);
    return 0;
  }
};

// 댓글 마이그레이션 함수 (비활성화됨 - 안전 모드)
export const migrateCommentsBoardType = async () => {
  console.log('=== 댓글 마이그레이션 비활성화됨 (안전 모드) ===');
  console.log('💡 마이그레이션은 관리자 권한이 필요합니다.');
  console.log('✅ 댓글 수 계산은 boardType과 관계없이 정상적으로 진행됩니다.');
  console.log('🔧 관리자 마이그레이션이 필요한 경우 adminMigrateComments() 함수를 사용하세요.');
  return;
};

// 특정 댓글 조회
export const getComment = async (commentId) => {
  try {
    const docRef = doc(db, "comments", commentId);
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
    console.error("댓글 조회 오류:", error);
    throw new Error("댓글을 불러오는데 실패했습니다.");
  }
};

// 댓글 수정
export const updateComment = async (commentId, updateData) => {
  try {
    const commentRef = doc(db, "comments", commentId);
    await updateDoc(commentRef, {
      ...updateData,
      updatedAt: serverTimestamp()
    });
  } catch (error) {
    console.error("댓글 수정 오류:", error);
    throw new Error("댓글 수정에 실패했습니다.");
  }
};

// 댓글 삭제
export const deleteComment = async (commentId) => {
  try {
    // 먼저 댓글 정보를 가져와서 게시글 ID와 게시판 타입 확인
    const commentRef = doc(db, "comments", commentId);
    const commentSnap = await getDoc(commentRef);
    
    if (!commentSnap.exists()) {
      throw new Error("댓글을 찾을 수 없습니다.");
    }
    
    const commentData = commentSnap.data();
    const { postId, boardType } = commentData;
    
    // 댓글 삭제
    await deleteDoc(commentRef);
    
    // 게시글의 commentCount 감소
    try {
      const collectionName = getCollectionName(boardType);
      const postRef = doc(db, collectionName, postId);
      await updateDoc(postRef, {
        commentCount: increment(-1),
        updatedAt: serverTimestamp()
      });
      console.log("게시글 commentCount 감소 완료");
    } catch (updateError) {
      console.error("commentCount 업데이트 오류:", updateError);
      // commentCount 업데이트 실패해도 댓글 삭제는 성공으로 처리
    }
  } catch (error) {
    console.error("댓글 삭제 오류:", error);
    throw new Error("댓글 삭제에 실패했습니다.");
  }
};

// 사용자별 댓글 조회
export const getCommentsByUser = async (userId) => {
  try {
    const q = query(
      collection(db, "comments"),
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
    console.error("사용자 댓글 조회 오류:", error);
    throw new Error("사용자 댓글을 불러오는데 실패했습니다.");
  }
};

// 기존 서비스들과의 호환성을 위한 별칭 함수들
export const createGalleryComment = async (galleryId, commentData) => {
  return createComment(galleryId, commentData, "gallery");
};

export const getGalleryComments = async (galleryId) => {
  return getComments(galleryId, "gallery");
};

export const updateGalleryComment = async (commentId, updateData) => {
  return updateComment(commentId, updateData);
};

export const deleteGalleryComment = async (commentId) => {
  return deleteComment(commentId);
};

export const createHealthComment = async (healthId, commentData) => {
  return createComment(healthId, commentData, "health");
};

export const getHealthComments = async (healthId) => {
  return getComments(healthId, "health");
};

export const updateHealthComment = async (commentId, updateData) => {
  return updateComment(commentId, updateData);
};

export const deleteHealthComment = async (commentId) => {
  return deleteComment(commentId);
};

export const createKaraokeComment = async (karaokeId, commentData) => {
  return createComment(karaokeId, commentData, "karaoke");
};

export const getKaraokeComments = async (karaokeId) => {
  return getComments(karaokeId, "karaoke");
};

export const updateKaraokeComment = async (commentId, updateData) => {
  return updateComment(commentId, updateData);
};

export const deleteKaraokeComment = async (commentId) => {
  return deleteComment(commentId);
};

export const createMarketplaceComment = async (marketplaceId, commentData) => {
  return createComment(marketplaceId, commentData, "marketplace");
};

export const getMarketplaceComments = async (marketplaceId) => {
  return getComments(marketplaceId, "marketplace");
};

export const updateMarketplaceComment = async (commentId, updateData) => {
  return updateComment(commentId, updateData);
};

export const deleteMarketplaceComment = async (commentId) => {
  return deleteComment(commentId);
};

// 대댓글 작성
export const createReply = async (commentId, replyData, boardType = "board") => {
  try {
    console.log("대댓글 작성 시작:", { commentId, boardType, replyData });
    
    const replyWithTimestamp = {
      ...replyData,
      commentId,
      boardType,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
      likes: 0
    };
    
    console.log("Firestore에 저장할 대댓글 데이터:", replyWithTimestamp);
    
    const docRef = await addDoc(collection(db, "replies"), replyWithTimestamp);
    console.log("대댓글 저장 성공, 문서 ID:", docRef.id);
    
    const result = { id: docRef.id, ...replyWithTimestamp };
    console.log("반환할 대댓글 데이터:", result);
    
    return result;
  } catch (error) {
    console.error("대댓글 작성 오류:", error);
    throw new Error("대댓글 작성에 실패했습니다.");
  }
};

// 댓글의 대댓글 목록 조회
export const getReplies = async (commentId, boardType = "board") => {
  try {
    let replies = [];
    
    try {
      // 새로운 형식 (boardType이 있는 대댓글들)
      const newQuery = query(
        collection(db, "replies"),
        where("commentId", "==", commentId),
        where("boardType", "==", boardType)
      );
      
      const newQuerySnapshot = await getDocs(newQuery);
      newQuerySnapshot.forEach((doc) => {
        replies.push({
          id: doc.id,
          ...doc.data()
        });
      });
    } catch (newQueryError) {
      console.log("새로운 형식 대댓글 쿼리 실패, 기존 형식으로 시도:", newQueryError);
      
      // 기존 형식 (boardType이 없는 대댓글들)
      const oldQuery = query(
        collection(db, "replies"),
        where("commentId", "==", commentId)
      );
      
      const oldQuerySnapshot = await getDocs(oldQuery);
      oldQuerySnapshot.forEach((doc) => {
        const data = doc.data();
        replies.push({
          id: doc.id,
          ...data,
          boardType: data.boardType || boardType
        });
      });
    }
    
    // 클라이언트에서 날짜순으로 정렬
    replies.sort((a, b) => {
      const dateA = a.createdAt?.toDate ? a.createdAt.toDate() : new Date(a.createdAt);
      const dateB = b.createdAt?.toDate ? b.createdAt.toDate() : new Date(b.createdAt);
      return dateA - dateB;
    });
    
    return replies;
  } catch (error) {
    console.error("대댓글 조회 오류:", error);
    throw new Error("대댓글을 불러오는데 실패했습니다.");
  }
};

// 대댓글 수정
export const updateReply = async (replyId, updateData) => {
  try {
    const replyRef = doc(db, "replies", replyId);
    await updateDoc(replyRef, {
      ...updateData,
      updatedAt: serverTimestamp()
    });
  } catch (error) {
    console.error("대댓글 수정 오류:", error);
    throw new Error("대댓글 수정에 실패했습니다.");
  }
};

// 대댓글 삭제
export const deleteReply = async (replyId) => {
  try {
    const replyRef = doc(db, "replies", replyId);
    await deleteDoc(replyRef);
  } catch (error) {
    console.error("대댓글 삭제 오류:", error);
    throw new Error("대댓글 삭제에 실패했습니다.");
  }
};

// 관리자 권한으로 댓글 마이그레이션 실행 (강제 실행)
export const adminMigrateComments = async () => {
  try {
    console.log('=== 관리자 댓글 마이그레이션 시작 ===');
    
    // 현재 사용자 확인 (관리자인지 체크)
    const currentUser = auth.currentUser;
    if (!currentUser) {
      throw new Error('로그인이 필요합니다.');
    }
    
    console.log('현재 사용자:', currentUser.email);
    
    const querySnapshot = await getDocs(collection(db, "comments"));
    const migrationPromises = [];
    let migratedCount = 0;
    
    querySnapshot.forEach((doc) => {
      const data = doc.data();
      // boardType이 없는 기존 댓글들에 boardType 추가
      if (!data.boardType || data.boardType === undefined) {
        migrationPromises.push(
          updateDoc(doc.ref, {
            boardType: "board" // 기본값으로 board 설정
          }).then(() => {
            migratedCount++;
            console.log('관리자 마이그레이션 성공:', { 
              id: doc.id, 
              postId: data.postId,
              content: data.content?.substring(0, 20)
            });
          }).catch((error) => {
            console.error('관리자 마이그레이션 실패:', { 
              id: doc.id, 
              error: error.message
            });
          })
        );
      }
    });
    
    if (migrationPromises.length > 0) {
      await Promise.all(migrationPromises);
      console.log(`관리자 마이그레이션 완료: ${migratedCount}개의 댓글 업데이트`);
    } else {
      console.log("마이그레이션이 필요한 댓글이 없습니다.");
    }
    
    // 마이그레이션 후 진단
    await diagnoseComments();
    
    console.log('=== 관리자 댓글 마이그레이션 완료 ===');
    return true;
  } catch (error) {
    console.error("관리자 댓글 마이그레이션 오류:", error);
    throw error;
  }
};

// 기존 댓글들을 새로운 형식으로 마이그레이션 (관리자용) - 호환성 유지
export const migrateComments = async () => {
  return adminMigrateComments();
};

// 게시판 타입에 따른 컬렉션 이름 반환
const getCollectionName = (boardType) => {
  const collectionMap = {
    'board': 'posts',
    'gallery': 'gallery',
    'health': 'healthPosts',
    'karaoke': 'karaokePosts',
    'cooking': 'cookingPosts',
    'philosophy': 'philosophy',
    'marketplace': 'marketplace',
    'wisdom': 'wisdoms'
  };
  
  return collectionMap[boardType] || 'posts';
};


