import { collection, getDocs, deleteDoc, doc } from "firebase/firestore";
import { ref, getDownloadURL } from "firebase/storage";
import { db, storage } from "./firebase";

// 수동으로 무효한 karaoke 게시물 정리
export const manualCleanupKaraoke = async () => {
  try {
    console.log("=== 수동 karaoke 게시물 정리 시작 ===");
    
    const karaokeRef = collection(db, "karaokePosts");
    const snapshot = await getDocs(karaokeRef);
    
    const invalidPosts = [];
    const validPosts = [];
    
    console.log(`총 ${snapshot.docs.length}개의 게시물 확인 중...`);
    
    for (const docSnap of snapshot.docs) {
      const post = { id: docSnap.id, ...docSnap.data() };
      console.log(`확인 중: ${post.id} - ${post.title || '제목 없음'}`);
      
      if (post.videoUrl && post.videoFileName) {
        try {
          // 비디오 파일이 실제로 존재하는지 확인
          const videoRef = ref(storage, `karaoke/${post.videoFileName}`);
          await getDownloadURL(videoRef);
          validPosts.push(post);
          console.log(`✅ 유효한 게시물: ${post.id}`);
        } catch (error) {
          if (error.code === 'storage/object-not-found') {
            invalidPosts.push(post);
            console.log(`❌ 무효한 게시물: ${post.id} - 파일 없음`);
          } else {
            console.log(`⚠️ 확인 실패: ${post.id} - ${error.message}`);
            validPosts.push(post); // 확인 실패한 경우는 유지
          }
        }
      } else {
        console.log(`⚠️ 비디오 URL 또는 파일명 없음: ${post.id}`);
        invalidPosts.push(post);
      }
    }
    
    console.log(`\n=== 정리 결과 ===`);
    console.log(`유효한 게시물: ${validPosts.length}개`);
    console.log(`무효한 게시물: ${invalidPosts.length}개`);
    
    if (invalidPosts.length > 0) {
      console.log("\n무효한 게시물 목록:");
      invalidPosts.forEach(post => {
        console.log(`- ${post.id}: ${post.title || '제목 없음'} (${post.videoUrl})`);
      });
      
      // 사용자 확인 후 삭제
      const shouldDelete = confirm(`${invalidPosts.length}개의 무효한 게시물을 삭제하시겠습니까?`);
      if (shouldDelete) {
        for (const post of invalidPosts) {
          try {
            await deleteDoc(doc(db, "karaokePosts", post.id));
            console.log(`🗑️ 삭제 완료: ${post.id}`);
          } catch (error) {
            console.error(`삭제 실패: ${post.id} - ${error.message}`);
          }
        }
        console.log("정리 완료!");
      }
    } else {
      console.log("정리할 무효한 게시물이 없습니다.");
    }
    
    return { validPosts, invalidPosts };
  } catch (error) {
    console.error("게시물 정리 오류:", error);
    throw error;
  }
};

// 전역 함수로 등록
window.manualCleanupKaraoke = manualCleanupKaraoke;
