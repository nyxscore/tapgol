import { doc, getDoc, updateDoc, deleteDoc, collection, query, where, getDocs, setDoc } from "firebase/firestore";
import { auth, db } from "./firebase";

// 기존 데이터를 새로운 구조로 마이그레이션하는 함수
const migrateUserData = (oldData) => {
  return {
    userId: oldData.userId || oldData.id || "",
    name: oldData.name || "",
    nickname: oldData.nickname || "",
    phone: oldData.phone || "",
    email: oldData.email || "",
    birthDate: oldData.birthDate || "",
    gender: oldData.gender || "",
    address: oldData.address || "",
    interests: oldData.interests || [],
    profileImage: oldData.profileImage || null,
    isActive: oldData.isActive !== undefined ? oldData.isActive : true,
    role: oldData.role || "user",
    createdAt: oldData.createdAt || new Date(),
    updatedAt: oldData.updatedAt || new Date(),
    lastLoginAt: oldData.lastLoginAt || new Date(),
    signupMethod: oldData.signupMethod || "email",
    emailVerified: oldData.emailVerified !== undefined ? oldData.emailVerified : false,
    profileComplete: oldData.profileComplete !== undefined ? oldData.profileComplete : true
  };
};

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

// 사용자 정보 조회
export const getUserProfile = async (userId) => {
  try {
    // 인증 상태 확인
    await validateUserAuth();
    
    const userDoc = await getDoc(doc(db, "users", userId));
    if (userDoc.exists()) {
      const data = userDoc.data();
      return { id: userDoc.id, ...migrateUserData(data) };
    } else {
      // 사용자 데이터가 없으면 기본 구조로 생성
      const defaultData = {
        userId: userId,
        name: "",
        nickname: "",
        phone: "",
        email: "",
        birthDate: "",
        gender: "",
        address: "",
        interests: [],
        profileImage: null,
        isActive: true,
        role: "user",
        createdAt: new Date(),
        updatedAt: new Date(),
        lastLoginAt: new Date(),
        signupMethod: "email",
        emailVerified: false,
        profileComplete: false
      };
      
      // 기본 데이터를 Firestore에 저장
      await setDoc(doc(db, "users", userId), defaultData);
      return { id: userId, ...defaultData };
    }
  } catch (error) {
    console.error("사용자 정보 조회 오류:", error);
    throw error;
  }
};

// 사용자 정보 업데이트
export const updateUserProfile = async (userId, updateData) => {
  try {
    // 인증 상태 확인
    const currentUser = await validateUserAuth();
    
    // 본인 데이터만 수정 가능하도록 확인
    if (currentUser.uid !== userId) {
      throw new Error("본인의 데이터만 수정할 수 있습니다.");
    }
    
    const userRef = doc(db, "users", userId);
    await updateDoc(userRef, {
      ...updateData,
      updatedAt: new Date()
    });
    return true;
  } catch (error) {
    console.error("사용자 정보 업데이트 오류:", error);
    throw error;
  }
};

// 사용자 계정 삭제
export const deleteUserAccount = async (userId) => {
  try {
    // 인증 상태 확인
    const currentUser = await validateUserAuth();
    
    // 본인 계정만 삭제 가능하도록 확인
    if (currentUser.uid !== userId) {
      throw new Error("본인의 계정만 삭제할 수 있습니다.");
    }
    
    await deleteDoc(doc(db, "users", userId));
    return true;
  } catch (error) {
    console.error("사용자 계정 삭제 오류:", error);
    throw error;
  }
};

// 닉네임으로 사용자 검색
export const searchUserByNickname = async (nickname) => {
  try {
    // 인증 상태 확인
    await validateUserAuth();
    
    const q = query(
      collection(db, "users"),
      where("nickname", "==", nickname)
    );
    const querySnapshot = await getDocs(q);
    const users = [];
    querySnapshot.forEach((doc) => {
      const data = doc.data();
      users.push({ id: doc.id, ...migrateUserData(data) });
    });
    return users;
  } catch (error) {
    console.error("사용자 검색 오류:", error);
    throw error;
  }
};

// 관심사별 사용자 검색
export const searchUsersByInterest = async (interest) => {
  try {
    // 인증 상태 확인
    await validateUserAuth();
    
    const q = query(
      collection(db, "users"),
      where("interests", "array-contains", interest)
    );
    const querySnapshot = await getDocs(q);
    const users = [];
    querySnapshot.forEach((doc) => {
      const data = doc.data();
      users.push({ id: doc.id, ...migrateUserData(data) });
    });
    return users;
  } catch (error) {
    console.error("관심사별 사용자 검색 오류:", error);
    throw error;
  }
};

// 활성 사용자 목록 조회
export const getActiveUsers = async () => {
  try {
    // 인증 상태 확인
    await validateUserAuth();
    
    const q = query(
      collection(db, "users"),
      where("isActive", "==", true)
    );
    const querySnapshot = await getDocs(q);
    const users = [];
    querySnapshot.forEach((doc) => {
      const data = doc.data();
      users.push({ id: doc.id, ...migrateUserData(data) });
    });
    return users;
  } catch (error) {
    console.error("활성 사용자 조회 오류:", error);
    throw error;
  }
};

// 사용자 통계 정보
export const getUserStats = async (userId) => {
  try {
    // 인증 상태 확인
    const currentUser = await validateUserAuth();
    
    // 본인 통계만 조회 가능하도록 확인
    if (currentUser.uid !== userId) {
      throw new Error("본인의 통계만 조회할 수 있습니다.");
    }
    
    const userDoc = await getDoc(doc(db, "users", userId));
    if (userDoc.exists()) {
      const userData = migrateUserData(userDoc.data());
      const now = new Date();
      const createdAt = userData.createdAt?.toDate ? userData.createdAt.toDate() : new Date(userData.createdAt);
      const daysSinceJoin = Math.floor((now - createdAt) / (1000 * 60 * 60 * 24));
      
      return {
        userId,
        joinDate: createdAt,
        daysSinceJoin,
        interests: userData.interests || [],
        isActive: userData.isActive || false,
        profileComplete: userData.profileComplete || false
      };
    }
    return null;
  } catch (error) {
    console.error("사용자 통계 조회 오류:", error);
    throw error;
  }
};

// 닉네임 중복 확인
export const checkNicknameAvailability = async (nickname) => {
  try {
    // 인증 상태 확인
    await validateUserAuth();
    
    const users = await searchUserByNickname(nickname);
    return users.length === 0;
  } catch (error) {
    console.error("닉네임 중복 확인 오류:", error);
    throw error;
  }
};

// 사용자 활동 기록 업데이트
export const updateUserActivity = async (userId, activityType) => {
  try {
    // 인증 상태 확인
    const currentUser = await validateUserAuth();
    
    // 본인 활동만 업데이트 가능하도록 확인
    if (currentUser.uid !== userId) {
      throw new Error("본인의 활동만 업데이트할 수 있습니다.");
    }
    
    const userRef = doc(db, "users", userId);
    await updateDoc(userRef, {
      lastActivityAt: new Date(),
      lastActivityType: activityType,
      updatedAt: new Date()
    });
    return true;
  } catch (error) {
    console.error("사용자 활동 기록 업데이트 오류:", error);
    throw error;
  }
};

// 모든 사용자 데이터를 새로운 구조로 마이그레이션 (관리자용)
export const migrateAllUsers = async () => {
  try {
    // 인증 상태 확인
    await validateUserAuth();
    
    const querySnapshot = await getDocs(collection(db, "users"));
    const migrationPromises = [];
    
    querySnapshot.forEach((doc) => {
      const data = doc.data();
      const migratedData = migrateUserData(data);
      migrationPromises.push(
        setDoc(doc.ref, migratedData, { merge: true })
      );
    });
    
    await Promise.all(migrationPromises);
    console.log(`${migrationPromises.length}명의 사용자 데이터 마이그레이션 완료`);
    return true;
  } catch (error) {
    console.error("전체 사용자 마이그레이션 오류:", error);
    throw error;
  }
};
