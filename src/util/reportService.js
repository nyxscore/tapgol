import { doc, addDoc, collection, query, where, getDocs, orderBy, limit, serverTimestamp, getDoc, updateDoc, deleteDoc, setDoc } from "firebase/firestore";
import { auth, db } from "./firebase";

// 사용자 인증 상태 확인 함수
const validateUserAuth = async () => {
  const currentUser = auth.currentUser;
  if (!currentUser) {
    throw new Error("사용자가 로그인되지 않았습니다.");
  }
  
  try {
    await currentUser.getIdToken(true);
    return currentUser;
  } catch (error) {
    throw new Error("사용자 인증이 만료되었습니다. 다시 로그인해주세요.");
  }
};

// 관리자 권한 확인 함수 (간소화된 버전)
export const checkAdminRole = async (userId) => {
  console.log("🔍 관리자 권한 확인 시작:", userId);
  
  try {
    // 현재 로그인한 사용자의 이메일 확인
    const currentUser = auth.currentUser;
    if (!currentUser) {
      console.log("❌ 로그인된 사용자가 없습니다.");
      return false;
    }
    
    const userEmail = currentUser.email;
    console.log("📧 사용자 이메일:", userEmail);
    
    // 지정된 관리자 이메일 확인 (가장 우선순위)
    if (userEmail === "juhyundon82@gmail.com") {
      console.log("✅ 관리자 이메일로 권한 부여:", userEmail);
      return true;
    }
    
    console.log("🔍 Firestore에서 관리자 권한 확인 중...");
    
    // Firestore에서 관리자 권한 확인
    const userDoc = await getDoc(doc(db, "users", userId));
    console.log("📄 사용자 문서 존재:", userDoc.exists());
    
    if (userDoc.exists()) {
      const userData = userDoc.data();
      console.log("👤 사용자 데이터:", userData);
      
      if (userData.isAdmin === true || userData.role === "admin") {
        console.log("✅ Firestore에서 관리자 권한 확인:", userData);
        return true;
      }
    }
    
    console.log("❌ 관리자 권한 없음 - 일반 사용자");
    return false;
    
  } catch (error) {
    console.error("❌ 관리자 권한 확인 오류:", error);
    return false;
  }
};

// 신고 사유 목록
export const REPORT_REASONS = [
  "스팸/홍보",
  "욕설/비방",
  "음란물",
  "폭력/위협",
  "개인정보 노출",
  "저작권 침해",
  "기타"
];

// 채팅 메시지 신고
export const reportChatMessage = async (messageData, reason, description) => {
  try {
    const currentUser = await validateUserAuth();
    
    if (!messageData || !messageData.id) {
      throw new Error("신고할 메시지 정보가 없습니다.");
    }
    
    if (!reason || !REPORT_REASONS.includes(reason)) {
      throw new Error("올바른 신고 사유를 선택해주세요.");
    }
    
    // 필수 필드 유효성 검사
    console.log("채팅 메시지 신고 - 전달받은 데이터:", messageData);
    console.log("채팅 메시지 신고 - authorId:", messageData.authorId);
    console.log("채팅 메시지 신고 - author:", messageData.author);
    
    if (!messageData.authorId) {
      console.error("메시지 데이터:", messageData);
      throw new Error("메시지 작성자 정보가 없습니다.");
    }
    
    const reportData = {
      reporterId: currentUser.uid,
      reporterName: currentUser.displayName || "익명",
      reportedUserId: messageData.authorId,
      reportedUserName: messageData.author || "익명",
      messageId: messageData.id,
      messageContent: messageData.content || "",
      messageTimestamp: messageData.createdAt || serverTimestamp(),
      reason: reason,
      description: description || "",
      status: "pending", // pending, reviewed, resolved, dismissed
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
      chatType: messageData.chatType || "main", // main, park
      parkId: messageData.parkId || null
    };
    
    const reportRef = await addDoc(collection(db, "reports"), reportData);
    console.log("신고가 성공적으로 접수되었습니다:", reportRef.id);
    
    return reportRef.id;
  } catch (error) {
    console.error("채팅 메시지 신고 오류:", error);
    throw error;
  }
};

// 게시글 신고
export const reportPost = async (postData, reason, description) => {
  try {
    const currentUser = await validateUserAuth();
    
    if (!postData || !postData.id) {
      throw new Error("신고할 게시글 정보가 없습니다.");
    }
    
    if (!reason || !REPORT_REASONS.includes(reason)) {
      throw new Error("올바른 신고 사유를 선택해주세요.");
    }
    
    // 필수 필드 유효성 검사
    console.log("게시글 신고 - 전달받은 데이터:", postData);
    console.log("게시글 신고 - authorId:", postData.authorId);
    console.log("게시글 신고 - author:", postData.author);
    console.log("게시글 신고 - userId:", postData.userId);
    console.log("게시글 신고 - uploader:", postData.uploader);
    
    // 다양한 필드명으로 작성자 정보 찾기
    const authorId = postData.authorId || postData.userId || postData.uploaderId || postData.uploader?.id;
    const authorName = postData.author || postData.uploader || postData.uploaderName || postData.userName || postData.nickname;
    
    console.log("게시글 신고 - 추출된 authorId:", authorId);
    console.log("게시글 신고 - 추출된 authorName:", authorName);
    
    if (!authorId) {
      console.error("게시글 데이터:", postData);
      console.log("작성자 정보가 없는 경우 - 시스템 관리자로 처리");
      
      // 작성자 정보가 없는 경우 시스템 관리자로 처리
      const systemAdminId = "system-admin";
      const systemAdminName = "시스템 관리자";
      
      const reportData = {
        reporterId: currentUser.uid,
        reporterName: currentUser.displayName || "익명",
        reportedUserId: systemAdminId,
        reportedUserName: systemAdminName,
        postId: postData.id,
        postTitle: postData.title || postData.originalName || postData.description || "제목 없음",
        postContent: postData.content || postData.description || "",
        postTimestamp: postData.createdAt || postData.uploadedAt || serverTimestamp(),
        reason: reason,
        description: description || "",
        status: "pending",
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
        postType: postData.boardType || postData.type || "general",
        note: "작성자 정보가 없는 게시글 신고"
      };
      
      const reportRef = await addDoc(collection(db, "reports"), reportData);
      console.log("게시글 신고가 성공적으로 접수되었습니다 (시스템 관리자로 처리):", reportRef.id);
      
      return reportRef.id;
    }
    
    const reportData = {
      reporterId: currentUser.uid,
      reporterName: currentUser.displayName || "익명",
      reportedUserId: authorId,
      reportedUserName: authorName || "익명",
      postId: postData.id,
      postTitle: postData.title || postData.originalName || postData.description || "제목 없음",
      postContent: postData.content || postData.description || "",
      postTimestamp: postData.createdAt || postData.uploadedAt || serverTimestamp(),
      reason: reason,
      description: description || "",
      status: "pending",
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
      postType: postData.boardType || postData.type || "general" // general, health, marketplace, gallery, karaoke
    };
    
    const reportRef = await addDoc(collection(db, "reports"), reportData);
    console.log("게시글 신고가 성공적으로 접수되었습니다:", reportRef.id);
    
    return reportRef.id;
  } catch (error) {
    console.error("게시글 신고 오류:", error);
    throw error;
  }
};

// 댓글/대댓글 신고
export const reportComment = async (commentData, reason, description) => {
  try {
    const currentUser = await validateUserAuth();
    
    if (!commentData || !commentData.id) {
      throw new Error("신고할 댓글 정보가 없습니다.");
    }
    
    if (!reason || !REPORT_REASONS.includes(reason)) {
      throw new Error("올바른 신고 사유를 선택해주세요.");
    }
    
    // 필수 필드 유효성 검사
    console.log("댓글 신고 - 전달받은 데이터:", commentData);
    console.log("댓글 신고 - authorId:", commentData.authorId);
    console.log("댓글 신고 - author:", commentData.author);
    
    if (!commentData.authorId) {
      console.error("댓글 데이터:", commentData);
      throw new Error("댓글 작성자 정보가 없습니다.");
    }
    
    // 댓글인지 대댓글인지 구분
    const isReply = commentData.type === "reply";
    const contentType = isReply ? "대댓글" : "댓글";
    
    const reportData = {
      reporterId: currentUser.uid,
      reporterName: currentUser.displayName || "익명",
      reportedUserId: commentData.authorId,
      reportedUserName: commentData.author || "익명",
      commentId: commentData.id,
      commentContent: commentData.content || "",
      commentTimestamp: commentData.createdAt || serverTimestamp(),
      reason: reason,
      description: description || "",
      status: "pending",
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
      commentType: commentData.boardType || "general",
      isReply: isReply, // 대댓글 여부
      parentCommentId: commentData.parentCommentId || null // 대댓글인 경우 부모 댓글 ID
    };
    
    const reportRef = await addDoc(collection(db, "reports"), reportData);
    console.log(`${contentType} 신고가 성공적으로 접수되었습니다:`, reportRef.id);
    
    return reportRef.id;
  } catch (error) {
    console.error("댓글/대댓글 신고 오류:", error);
    throw error;
  }
};

// 사용자 신고
export const reportUser = async (userData, reason, description) => {
  try {
    const currentUser = await validateUserAuth();
    
    if (!userData || !userData.id) {
      throw new Error("신고할 사용자 정보가 없습니다.");
    }
    
    if (!reason || !REPORT_REASONS.includes(reason)) {
      throw new Error("올바른 신고 사유를 선택해주세요.");
    }
    
    // 필수 필드 유효성 검사
    console.log("사용자 신고 - 전달받은 데이터:", userData);
    console.log("사용자 신고 - id:", userData.id);
    console.log("사용자 신고 - displayName:", userData.displayName);
    console.log("사용자 신고 - nickname:", userData.nickname);
    
    if (!userData.id) {
      console.error("사용자 데이터:", userData);
      throw new Error("사용자 ID 정보가 없습니다.");
    }
    
    // 자기 자신을 신고하는 것을 방지
    if (currentUser.uid === userData.id) {
      throw new Error("자기 자신을 신고할 수 없습니다.");
    }
    
    const reportData = {
      reporterId: currentUser.uid,
      reporterName: currentUser.displayName || "익명",
      reportedUserId: userData.id,
      reportedUserName: userData.displayName || userData.nickname || "익명",
      reason: reason,
      description: description || "",
      status: "pending",
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
      reportType: "user"
    };
    
    const reportRef = await addDoc(collection(db, "reports"), reportData);
    console.log("사용자 신고가 성공적으로 접수되었습니다:", reportRef.id);
    
    return reportRef.id;
  } catch (error) {
    console.error("사용자 신고 오류:", error);
    throw error;
  }
};

// 내가 신고한 목록 조회
export const getMyReports = async (limitCount = 20) => {
  try {
    const currentUser = await validateUserAuth();
    
    const q = query(
      collection(db, "reports"),
      where("reporterId", "==", currentUser.uid),
      orderBy("createdAt", "desc"),
      limit(limitCount)
    );
    
    const querySnapshot = await getDocs(q);
    const reports = [];
    
    querySnapshot.forEach((doc) => {
      const data = doc.data();
      reports.push({
        id: doc.id,
        ...data,
        createdAt: data.createdAt?.toDate ? data.createdAt.toDate() : data.createdAt,
        updatedAt: data.updatedAt?.toDate ? data.updatedAt.toDate() : data.updatedAt
      });
    });
    
    return reports;
  } catch (error) {
    console.error("내 신고 목록 조회 오류:", error);
    throw error;
  }
};

// 관리자용 신고 데이터 삭제
export const adminDeleteReport = async (reportId) => {
  try {
    const currentUser = await validateUserAuth();
    
    // 간단한 관리자 권한 확인 (이메일 기반)
    const isAdminEmail = currentUser.email === "juhyundon82@gmail.com";
    
    let isAdmin = isAdminEmail;
    
    // 이메일이 관리자가 아니면 Firestore에서 확인
    if (!isAdminEmail) {
      try {
        isAdmin = await checkAdminRole(currentUser.uid);
      } catch (error) {
        console.log("⚠️ 관리자 권한 확인 실패:", error.message);
        isAdmin = false;
      }
    }
    
    if (!isAdmin) {
      throw new Error("관리자 권한이 필요합니다.");
    }
    
    console.log(`🗑️ 신고 데이터 삭제 시도: reports/${reportId}`);
    
    // 신고 데이터 삭제
    await deleteDoc(doc(db, "reports", reportId));
    console.log(`✅ 신고 데이터 삭제 완료: reports/${reportId}`);
    
    return true;
  } catch (error) {
    console.error("신고 데이터 삭제 오류:", error);
    console.error("오류 상세 정보:", {
      message: error.message,
      code: error.code,
      stack: error.stack
    });
    throw new Error(`신고 데이터 삭제 실패: ${error.message || '알 수 없는 오류'}`);
  }
};

// 신고 상태 업데이트 (관리자용)
export const updateReportStatus = async (reportId, status, adminNote = "") => {
  try {
    const currentUser = await validateUserAuth();
    
    // 간단한 관리자 권한 확인 (이메일 기반)
    const isAdminEmail = currentUser.email === "juhyundon82@gmail.com";
    
    let isAdmin = isAdminEmail;
    
    // 이메일이 관리자가 아니면 Firestore에서 확인
    if (!isAdminEmail) {
      try {
        const userDoc = await getDoc(doc(db, "users", currentUser.uid));
        const userData = userDoc.data();
        isAdmin = userData && (userData.role === "admin" || userData.isAdmin === true);
      } catch (error) {
        console.log("⚠️ 관리자 권한 확인 실패:", error.message);
        isAdmin = false;
      }
    }
    
    if (!isAdmin) {
      throw new Error("관리자 권한이 필요합니다.");
    }
    
    console.log(`📝 신고 상태 업데이트: ${reportId} → ${status}`);
    
    const reportRef = doc(db, "reports", reportId);
    await updateDoc(reportRef, {
      status: status,
      adminNote: adminNote,
      updatedAt: serverTimestamp(),
      reviewedBy: currentUser.uid,
      reviewedAt: serverTimestamp()
    });
    
    console.log(`✅ 신고 상태 업데이트 완료: ${reportId}`);
    
    return true;
  } catch (error) {
    console.error("신고 상태 업데이트 오류:", error);
    console.error("오류 상세 정보:", {
      message: error.message,
      code: error.code,
      stack: error.stack
    });
    throw new Error(`신고 상태 업데이트 실패: ${error.message || '알 수 없는 오류'}`);
  }
};

// 신고 중복 확인 (같은 사용자가 같은 대상을 같은 사유로 신고했는지)
export const checkDuplicateReport = async (targetId, targetType, reason) => {
  try {
    const currentUser = await validateUserAuth();
    
    const q = query(
      collection(db, "reports"),
      where("reporterId", "==", currentUser.uid),
      where("reason", "==", reason)
    );
    
    const querySnapshot = await getDocs(q);
    
    // targetType에 따라 다른 필드 확인
    for (const doc of querySnapshot.docs) {
      const data = doc.data();
      // 클라이언트에서 상태 필터링
      if (data.status !== "pending" && data.status !== "reviewed") {
        continue;
      }
      
      let isDuplicate = false;
      
      switch (targetType) {
        case "message":
          isDuplicate = data.messageId === targetId;
          break;
        case "post":
          isDuplicate = data.postId === targetId;
          break;
        case "comment":
          isDuplicate = data.commentId === targetId;
          break;
        case "user":
          isDuplicate = data.reportedUserId === targetId;
          break;
      }
      
      if (isDuplicate) {
        return true; // 중복 신고 발견
      }
    }
    
    return false; // 중복 신고 없음
  } catch (error) {
    console.error("중복 신복 확인 오류:", error);
    throw error;
  }
};

// 관리자용 댓글/대댓글 강제 삭제
export const adminDeleteComment = async (commentId, commentType = "comment") => {
  try {
    const currentUser = await validateUserAuth();
    
    // 간단한 관리자 권한 확인 (이메일 기반)
    const isAdminEmail = currentUser.email === "juhyundon82@gmail.com";
    
    let isAdmin = isAdminEmail;
    
    // 이메일이 관리자가 아니면 Firestore에서 확인
    if (!isAdminEmail) {
      try {
        isAdmin = await checkAdminRole(currentUser.uid);
      } catch (error) {
        console.log("⚠️ 관리자 권한 확인 실패:", error.message);
        isAdmin = false;
      }
    }
    
    if (!isAdmin) {
      throw new Error("관리자 권한이 필요합니다.");
    }
    
    console.log(`🗑️ 댓글 삭제 시도: ${commentType} - ${commentId}`);
    
    // 댓글/대댓글 삭제
    if (commentType === "reply") {
      // 대댓글 삭제
      console.log(`🗑️ Firestore에서 대댓글 삭제 시도: replies/${commentId}`);
      await deleteDoc(doc(db, "replies", commentId));
      console.log(`✅ Firestore 대댓글 삭제 완료: replies/${commentId}`);
    } else {
      // 댓글 삭제 (대댓글도 함께 삭제)
      console.log(`🗑️ Firestore에서 댓글 삭제 시도: comments/${commentId}`);
      await deleteDoc(doc(db, "comments", commentId));
      console.log(`✅ Firestore 댓글 삭제 완료: comments/${commentId}`);
      
      // 해당 댓글의 대댓글들도 삭제
      try {
        console.log(`🔍 관련 대댓글 검색 중: parentCommentId=${commentId}`);
        const repliesQuery = query(
          collection(db, "replies"),
          where("parentCommentId", "==", commentId)
        );
        const repliesSnapshot = await getDocs(repliesQuery);
        
        console.log(`📝 발견된 대댓글 수: ${repliesSnapshot.docs.length}개`);
        
        if (repliesSnapshot.docs.length > 0) {
          const deletePromises = repliesSnapshot.docs.map(doc => {
            console.log(`🗑️ 대댓글 삭제 시도: ${doc.id}`);
            return deleteDoc(doc.ref);
          });
          await Promise.all(deletePromises);
          console.log(`✅ 관련 대댓글 ${repliesSnapshot.docs.length}개 삭제 완료`);
        } else {
          console.log(`ℹ️ 삭제할 대댓글이 없습니다.`);
        }
      } catch (replyError) {
        console.log("⚠️ 대댓글 삭제 실패 (무시):", replyError.message);
      }
    }
    
    return true;
  } catch (error) {
    console.error("관리자 댓글 삭제 오류:", error);
    console.error("오류 상세 정보:", {
      message: error.message,
      code: error.code,
      stack: error.stack
    });
    throw new Error(`댓글 삭제 실패: ${error.message || '알 수 없는 오류'}`);
  }
};

// 관리자용 게시글 강제 삭제
export const adminDeletePost = async (postId, postType) => {
  try {
    const currentUser = await validateUserAuth();
    
    // 간단한 관리자 권한 확인 (이메일 기반)
    const isAdminEmail = currentUser.email === "juhyundon82@gmail.com";
    
    let isAdmin = isAdminEmail;
    
    // 이메일이 관리자가 아니면 Firestore에서 확인
    if (!isAdminEmail) {
      try {
        isAdmin = await checkAdminRole(currentUser.uid);
      } catch (error) {
        console.log("⚠️ 관리자 권한 확인 실패:", error.message);
        isAdmin = false;
      }
    }
    
    if (!isAdmin) {
      throw new Error("관리자 권한이 필요합니다.");
    }
    
    // 게시글 타입에 따른 컬렉션 결정
    let collectionName;
    switch (postType) {
      case "board":
        collectionName = "posts";
        break;
      case "health":
        collectionName = "healthPosts";
        break;
      case "marketplace":
        collectionName = "marketplace";
        break;
      case "gallery":
        collectionName = "gallery";
        break;
      case "karaoke":
        collectionName = "karaokePosts";
        break;
      case "cooking":
        collectionName = "cookingPosts";
        break;
      case "chat":
        collectionName = "chatMessages";
        break;
      case "parkChat":
        collectionName = "parkChats";
        break;
      default:
        collectionName = "posts";
    }
    
    console.log(`🗑️ 게시글 삭제 시도:`, {
      postType: postType,
      collectionName: collectionName,
      postId: postId,
      currentUser: currentUser.email
    });
    
    // 게시글 삭제
    console.log(`🗑️ Firestore에서 삭제 시도: ${collectionName}/${postId}`);
    await deleteDoc(doc(db, collectionName, postId));
    console.log(`✅ Firestore 게시글 삭제 완료: ${collectionName}/${postId}`);
    
    // 관련 댓글들도 삭제 (채팅 메시지는 댓글이 없으므로 건너뛰기)
    if (postType !== "chat" && postType !== "parkChat") {
      try {
        console.log(`🔍 관련 댓글 검색 중: postId=${postId}`);
        const commentsQuery = query(
          collection(db, "comments"),
          where("postId", "==", postId)
        );
        const commentsSnapshot = await getDocs(commentsQuery);
        
        console.log(`📝 발견된 댓글 수: ${commentsSnapshot.docs.length}개`);
        
        if (commentsSnapshot.docs.length > 0) {
          const deletePromises = commentsSnapshot.docs.map(doc => {
            console.log(`🗑️ 댓글 삭제 시도: ${doc.id}`);
            return deleteDoc(doc.ref);
          });
          await Promise.all(deletePromises);
          console.log(`✅ 관련 댓글 ${commentsSnapshot.docs.length}개 삭제 완료`);
        } else {
          console.log(`ℹ️ 삭제할 댓글이 없습니다.`);
        }
      } catch (commentError) {
        console.log("⚠️ 댓글 삭제 실패 (무시):", commentError.message);
      }
    } else {
      console.log(`ℹ️ 채팅 메시지는 댓글이 없으므로 댓글 삭제를 건너뜁니다.`);
    }
    
    console.log(`관리자가 ${postType} 게시글 ${postId}와 관련 댓글들을 삭제했습니다.`);
    
    return true;
  } catch (error) {
    console.error("관리자 게시글 삭제 오류:", error);
    console.error("오류 상세 정보:", {
      message: error.message,
      code: error.code,
      stack: error.stack
    });
    throw new Error(`게시글 삭제 실패: ${error.message || '알 수 없는 오류'}`);
  }
};
