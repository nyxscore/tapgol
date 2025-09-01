// src/contexts/AuthContext.jsx
import React, { createContext, useState, useEffect, useContext } from "react";
import { auth } from "../util/firebase";
import { onAuthStateChanged, signInWithEmailAndPassword, createUserWithEmailAndPassword, signOut, setPersistence, browserSessionPersistence } from "firebase/auth";

const AuthContext = createContext(null);

// useAuth 훅 추가
export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [lastActivity, setLastActivity] = useState(Date.now());

  useEffect(() => {
    // 세션 지속성을 브라우저 세션으로 설정 (탭/창을 닫으면 로그아웃)
    setPersistence(auth, browserSessionPersistence);

    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setUser(user);
      setLoading(false);
      if (user) {
        setLastActivity(Date.now());
      }
    });

    return () => {
      unsubscribe();
    };
  }, []);

  // 사용자 활동 감지 및 자동 로그아웃 처리
  useEffect(() => {
    if (!user) return;

    // 사용자 활동을 감지하는 이벤트들
    const activityEvents = ['mousedown', 'mousemove', 'keypress', 'scroll', 'touchstart', 'click'];
    
    const updateActivity = () => {
      setLastActivity(Date.now());
    };

    // 모든 활동 이벤트 리스너 등록
    activityEvents.forEach(event => {
      document.addEventListener(event, updateActivity, true);
    });

    // 10분(600,000ms) 비활성 체크 타이머
    const inactivityTimer = setInterval(() => {
      const now = Date.now();
      const timeSinceLastActivity = now - lastActivity;
      const tenMinutes = 10 * 60 * 1000; // 10분

      if (timeSinceLastActivity >= tenMinutes) {
        console.log('10분 비활성으로 인한 자동 로그아웃');
        signOut(auth);
      }
    }, 60000); // 1분마다 체크

    return () => {
      // 모든 이벤트 리스너 제거
      activityEvents.forEach(event => {
        document.removeEventListener(event, updateActivity, true);
      });
      clearInterval(inactivityTimer);
    };
  }, [user, lastActivity]);

  const login = async (email, password) => {
    try {
      console.log("AuthContext login 시도:", { email, passwordLength: password?.length });
      console.log("Firebase Auth 인스턴스:", auth);
      console.log("Auth 도메인:", auth.config.authDomain);
      
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      console.log("AuthContext 로그인 성공:", userCredential.user.email);
      return userCredential.user;
    } catch (error) {
      console.error("AuthContext 로그인 오류:", error);
      console.error("오류 상세:", {
        code: error.code,
        message: error.message,
        email: email
      });
      throw error;
    }
  };

  const signup = async (email, password) => {
    try {
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      return userCredential.user;
    } catch (error) {
      throw error;
    }
  };

  const logout = async () => {
    try {
      await signOut(auth);
    } catch (error) {
      throw error;
    }
  };

  const value = {
    user,
    login,
    signup,
    logout,
    loading
  };

  return (
    <AuthContext.Provider value={value}>
      {!loading && children}
    </AuthContext.Provider>
  );
};

export default AuthContext;
