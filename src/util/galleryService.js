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
import { 
  ref, 
  uploadBytes, 
  getDownloadURL, 
  deleteObject,
  listAll 
} from "firebase/storage";
import { db, storage } from "./firebase";

// 파일 업로드
export const uploadFile = async (file, userId) => {
  try {
    // 파일 타입 검증
    const allowedImageTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
    const allowedVideoTypes = ['video/mp4', 'video/webm', 'video/ogg', 'video/quicktime'];
    
    if (!allowedImageTypes.includes(file.type) && !allowedVideoTypes.includes(file.type)) {
      throw new Error("지원하지 않는 파일 형식입니다. (이미지: JPG, PNG, GIF, WEBP / 동영상: MP4, WEBM, OGG, MOV)");
    }

    // 파일 크기 제한 (50MB)
    const maxSize = 50 * 1024 * 1024; // 50MB
    if (file.size > maxSize) {
      throw new Error("파일 크기는 50MB를 초과할 수 없습니다.");
    }

    // 파일명 생성 (중복 방지)
    const timestamp = Date.now();
    const fileExtension = file.name.split('.').pop();
    const fileName = `${userId}_${timestamp}.${fileExtension}`;
    
    // Storage 경로 설정
    const storageRef = ref(storage, `gallery/${fileName}`);
    
    // 파일 업로드
    const snapshot = await uploadBytes(storageRef, file);
    const downloadURL = await getDownloadURL(snapshot.ref);
    
    return {
      url: downloadURL,
      fileName: fileName,
      originalName: file.name,
      size: file.size,
      type: file.type
    };
  } catch (error) {
    console.error("파일 업로드 오류:", error);
    throw error;
  }
};

// 추억앨범 항목 생성
export const createGalleryItem = async (galleryData) => {
  try {
    const itemWithTimestamp = {
      ...galleryData,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
      likes: 0,
      views: 0
    };
    
    const docRef = await addDoc(collection(db, "gallery"), itemWithTimestamp);
    return { id: docRef.id, ...itemWithTimestamp };
  } catch (error) {
    console.error("추억앨범 항목 생성 오류:", error);
    throw new Error("추억앨범 항목 생성에 실패했습니다.");
  }
};

// 추억앨범 목록 조회
export const getGalleryItems = async (limitCount = 20) => {
  try {
    const q = query(
      collection(db, "gallery"),
      orderBy("createdAt", "desc"),
      limit(limitCount)
    );
    
    const querySnapshot = await getDocs(q);
    const items = [];
    
    querySnapshot.forEach((doc) => {
      items.push({
        id: doc.id,
        ...doc.data()
      });
    });
    
    return items;
  } catch (error) {
    console.error("추억앨범 목록 조회 오류:", error);
    throw new Error("추억앨범 목록을 불러오는데 실패했습니다.");
  }
};

// 특정 추억앨범 항목 조회
export const getGalleryItem = async (itemId) => {
  try {
    console.log("getGalleryItem 호출됨, itemId:", itemId);
    
    if (!itemId) {
      throw new Error("추억앨범 항목 ID가 필요합니다.");
    }

    // Firebase 연결 상태 확인
    if (!db) {
      console.error("Firebase DB 연결 실패: db 객체가 undefined입니다.");
      throw new Error("Firebase 데이터베이스에 연결할 수 없습니다.");
    }

    console.log("Firebase DB 연결 상태:", !!db);
    console.log("갤러리 컬렉션에 접근 시도...");
    
    const docRef = doc(db, "gallery", itemId);
    console.log("문서 참조 생성됨:", docRef);
    
    const docSnap = await getDoc(docRef);
    console.log("문서 스냅샷 결과:", docSnap.exists() ? "존재함" : "존재하지 않음");
    
    if (docSnap.exists()) {
      const data = docSnap.data();
      console.log("문서 데이터 로드 성공:", data);
      return {
        id: docSnap.id,
        ...data
      };
    } else {
      console.error(`추억앨범 항목을 찾을 수 없습니다. ID: ${itemId}`);
      throw new Error("추억앨범 항목을 찾을 수 없습니다.");
    }
  } catch (error) {
    console.error("추억앨범 항목 조회 오류:", error);
    console.error("에러 코드:", error.code);
    console.error("에러 메시지:", error.message);
    console.error("에러 스택:", error.stack);
    
    // Firebase 관련 에러 처리
    if (error.code === "permission-denied") {
      throw new Error("접근 권한이 없습니다.");
    } else if (error.code === "unavailable") {
      throw new Error("서비스가 일시적으로 사용할 수 없습니다.");
    } else if (error.code === "not-found") {
      throw new Error("데이터베이스를 찾을 수 없습니다.");
    } else if (error.message === "추억앨범 항목을 찾을 수 없습니다.") {
      throw error; // 원래 에러 메시지 유지
    } else if (error.message.includes("Firebase")) {
      throw error; // Firebase 연결 에러 유지
    }
    
    throw new Error("추억앨범 항목을 불러오는데 실패했습니다.");
  }
};

// 추억앨범 항목 수정
export const updateGalleryItem = async (itemId, updateData) => {
  try {
    const itemRef = doc(db, "gallery", itemId);
    await updateDoc(itemRef, {
      ...updateData,
      updatedAt: serverTimestamp()
    });
  } catch (error) {
    console.error("추억앨범 항목 수정 오류:", error);
    throw new Error("추억앨범 항목 수정에 실패했습니다.");
  }
};

// 추억앨범 항목 삭제
export const deleteGalleryItem = async (itemId, fileName) => {
  try {
    // Firestore 문서 삭제
    const itemRef = doc(db, "gallery", itemId);
    await deleteDoc(itemRef);
    
    // Storage 파일 삭제
    if (fileName) {
      const fileRef = ref(storage, `gallery/${fileName}`);
      await deleteObject(fileRef);
    }
  } catch (error) {
    console.error("추억앨범 항목 삭제 오류:", error);
    throw new Error("추억앨범 항목 삭제에 실패했습니다.");
  }
};

// 조회수 증가
export const incrementViews = async (itemId) => {
  try {
    const itemRef = doc(db, "gallery", itemId);
    await updateDoc(itemRef, {
      views: increment(1)
    });
  } catch (error) {
    console.error("조회수 증가 오류:", error);
  }
};

// 좋아요 토글
export const toggleLike = async (itemId, userId) => {
  try {
    const itemRef = doc(db, "gallery", itemId);
    const itemSnap = await getDoc(itemRef);
    
    if (!itemSnap.exists()) {
      throw new Error("추억앨범 항목을 찾을 수 없습니다.");
    }
    
    const itemData = itemSnap.data();
    const likedBy = itemData.likedBy || [];
    const isLiked = likedBy.includes(userId);
    
    if (isLiked) {
      // 좋아요 취소
      await updateDoc(itemRef, {
        likes: increment(-1),
        likedBy: likedBy.filter(uid => uid !== userId)
      });
      return false;
    } else {
      // 좋아요 추가
      await updateDoc(itemRef, {
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

// 사용자별 추억앨범 항목 조회
export const getGalleryItemsByUser = async (userId) => {
  try {
    const q = query(
      collection(db, "gallery"),
      where("uploaderId", "==", userId),
      orderBy("createdAt", "desc")
    );
    
    const querySnapshot = await getDocs(q);
    const items = [];
    
    querySnapshot.forEach((doc) => {
      items.push({
        id: doc.id,
        ...doc.data()
      });
    });
    
    return items;
  } catch (error) {
    console.error("사용자 추억앨범 조회 오류:", error);
    throw new Error("사용자 추억앨범을 불러오는데 실패했습니다.");
  }
};

// 파일 타입 확인
export const getFileType = (fileType) => {
  if (fileType.startsWith('image/')) {
    return 'image';
  } else if (fileType.startsWith('video/')) {
    return 'video';
  }
  return 'unknown';
};

// 파일 크기 포맷팅
export const formatFileSize = (bytes) => {
  if (bytes === 0) return '0 Bytes';
  
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
};
