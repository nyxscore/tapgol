import { 
  collection, addDoc, getDocs, getDoc, doc, updateDoc, deleteDoc, 
  query, where, orderBy, limit, serverTimestamp, increment 
} from "firebase/firestore";
import { 
  ref, uploadBytes, getDownloadURL, deleteObject, listAll 
} from "firebase/storage";
import { db, storage } from "./firebase";

// 노래방 영상 업로드
export const uploadKaraokeVideo = async (file, userId) => {
  try {
    const timestamp = Date.now();
    const fileName = `${userId}_${timestamp}_${file.name}`;
    const storageRef = ref(storage, `karaoke/${fileName}`);
    
    const snapshot = await uploadBytes(storageRef, file);
    const downloadURL = await getDownloadURL(snapshot.ref);
    
    return {
      url: downloadURL,
      fileName: fileName
    };
  } catch (error) {
    console.error("노래방 영상 업로드 오류:", error);
    throw new Error("영상 업로드에 실패했습니다.");
  }
};

// 노래방 게시글 작성
export const createKaraokePost = async (postData) => {
  try {
    const postWithTimestamp = {
      ...postData,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
      views: 0,
      likes: 0,
      likedBy: []
    };
    
    const docRef = await addDoc(collection(db, "karaokePosts"), postWithTimestamp);
    return { id: docRef.id, ...postWithTimestamp };
  } catch (error) {
    console.error("노래방 게시글 작성 오류:", error);
    throw new Error("게시글 작성에 실패했습니다.");
  }
};

// 노래방 게시글 목록 조회
export const getKaraokePosts = async (limitCount = 20) => {
  try {
    const q = query(
      collection(db, "karaokePosts"),
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
    console.error("노래방 게시글 목록 조회 오류:", error);
    throw new Error("게시글 목록을 불러오는데 실패했습니다.");
  }
};

// 특정 노래방 게시글 조회
export const getKaraokePost = async (postId) => {
  try {
    const docRef = doc(db, "karaokePosts", postId);
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
    console.error("노래방 게시글 조회 오류:", error);
    throw new Error("게시글을 불러오는데 실패했습니다.");
  }
};

// 노래방 게시글 수정
export const updateKaraokePost = async (postId, updateData) => {
  try {
    const postRef = doc(db, "karaokePosts", postId);
    await updateDoc(postRef, {
      ...updateData,
      updatedAt: serverTimestamp()
    });
  } catch (error) {
    console.error("노래방 게시글 수정 오류:", error);
    throw new Error("게시글 수정에 실패했습니다.");
  }
};

// 노래방 게시글 삭제
export const deleteKaraokePost = async (postId, fileName) => {
  try {
    // Firestore에서 게시글 삭제
    const postRef = doc(db, "karaokePosts", postId);
    await deleteDoc(postRef);
    
    // Storage에서 영상 파일 삭제
    if (fileName) {
      const videoRef = ref(storage, `karaoke/${fileName}`);
      await deleteObject(videoRef);
    }
  } catch (error) {
    console.error("노래방 게시글 삭제 오류:", error);
    throw new Error("게시글 삭제에 실패했습니다.");
  }
};

// 조회수 증가
export const incrementViews = async (postId) => {
  try {
    const postRef = doc(db, "karaokePosts", postId);
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
    const postRef = doc(db, "karaokePosts", postId);
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

// 사용자별 노래방 게시글 조회
export const getKaraokePostsByUser = async (userId) => {
  try {
    const q = query(
      collection(db, "karaokePosts"),
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
    console.error("사용자 노래방 게시글 조회 오류:", error);
    throw new Error("사용자 게시글을 불러오는데 실패했습니다.");
  }
};

// 파일 타입 확인
export const getFileType = (fileType) => {
  if (fileType.startsWith('video/')) {
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
