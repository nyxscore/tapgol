import { doc, addDoc, collection, query, where, getDocs, orderBy, limit, serverTimestamp, getDoc, updateDoc } from "firebase/firestore";
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
    
    const reportData = {
      reporterId: currentUser.uid,
      reporterName: currentUser.displayName || "익명",
      reportedUserId: messageData.authorId,
      reportedUserName: messageData.author,
      messageId: messageData.id,
      messageContent: messageData.content,
      messageTimestamp: messageData.createdAt,
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
    
    const reportData = {
      reporterId: currentUser.uid,
      reporterName: currentUser.displayName || "익명",
      reportedUserId: postData.authorId,
      reportedUserName: postData.author,
      postId: postData.id,
      postTitle: postData.title,
      postContent: postData.content,
      postTimestamp: postData.createdAt,
      reason: reason,
      description: description || "",
      status: "pending",
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
      postType: postData.boardType || "general" // general, health, marketplace, gallery, karaoke
    };
    
    const reportRef = await addDoc(collection(db, "reports"), reportData);
    console.log("게시글 신고가 성공적으로 접수되었습니다:", reportRef.id);
    
    return reportRef.id;
  } catch (error) {
    console.error("게시글 신고 오류:", error);
    throw error;
  }
};

// 댓글 신고
export const reportComment = async (commentData, reason, description) => {
  try {
    const currentUser = await validateUserAuth();
    
    if (!commentData || !commentData.id) {
      throw new Error("신고할 댓글 정보가 없습니다.");
    }
    
    if (!reason || !REPORT_REASONS.includes(reason)) {
      throw new Error("올바른 신고 사유를 선택해주세요.");
    }
    
    const reportData = {
      reporterId: currentUser.uid,
      reporterName: currentUser.displayName || "익명",
      reportedUserId: commentData.authorId,
      reportedUserName: commentData.author,
      commentId: commentData.id,
      commentContent: commentData.content,
      commentTimestamp: commentData.createdAt,
      reason: reason,
      description: description || "",
      status: "pending",
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
      commentType: commentData.boardType || "general"
    };
    
    const reportRef = await addDoc(collection(db, "reports"), reportData);
    console.log("댓글 신고가 성공적으로 접수되었습니다:", reportRef.id);
    
    return reportRef.id;
  } catch (error) {
    console.error("댓글 신고 오류:", error);
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

// 신고 상태 업데이트 (관리자용)
export const updateReportStatus = async (reportId, status, adminNote = "") => {
  try {
    const currentUser = await validateUserAuth();
    
    // 관리자 권한 확인 (간단한 체크)
    const userDoc = await getDoc(doc(db, "users", currentUser.uid));
    const userData = userDoc.data();
    
    if (!userData || userData.role !== "admin") {
      throw new Error("관리자 권한이 필요합니다.");
    }
    
    const reportRef = doc(db, "reports", reportId);
    await updateDoc(reportRef, {
      status: status,
      adminNote: adminNote,
      updatedAt: serverTimestamp(),
      reviewedBy: currentUser.uid,
      reviewedAt: serverTimestamp()
    });
    
    return true;
  } catch (error) {
    console.error("신고 상태 업데이트 오류:", error);
    throw error;
  }
};

// 신고 중복 확인 (같은 사용자가 같은 대상을 같은 사유로 신고했는지)
export const checkDuplicateReport = async (targetId, targetType, reason) => {
  try {
    const currentUser = await validateUserAuth();
    
    const q = query(
      collection(db, "reports"),
      where("reporterId", "==", currentUser.uid),
      where("reason", "==", reason),
      where("status", "in", ["pending", "reviewed"])
    );
    
    const querySnapshot = await getDocs(q);
    
    // targetType에 따라 다른 필드 확인
    for (const doc of querySnapshot.docs) {
      const data = doc.data();
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
    console.error("중복 신고 확인 오류:", error);
    throw error;
  }
};
