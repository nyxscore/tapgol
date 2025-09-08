// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { getStorage } from "firebase/storage";
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY || "AIzaSyCB-X7HCmKsTuLYFBjX0Z3hibAk_FKf2ss",
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || "tabgol-4f728.firebaseapp.com",
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || "tabgol-4f728",
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || "tabgol-4f728.appspot.com",
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || "123456789",
  appId: import.meta.env.VITE_FIREBASE_APP_ID || "1:123456789:web:abcdef",
  measurementId: import.meta.env.VITE_FIREBASE_MEASUREMENT_ID
};

// 환경 변수 로딩 확인
console.log("Firebase 환경 변수 확인:");
console.log("API Key:", import.meta.env.VITE_FIREBASE_API_KEY ? "설정됨" : "설정되지 않음");
console.log("Auth Domain:", import.meta.env.VITE_FIREBASE_AUTH_DOMAIN ? "설정됨" : "설정되지 않음");
console.log("Project ID:", import.meta.env.VITE_FIREBASE_PROJECT_ID ? "설정됨" : "설정되지 않음");
console.log("Storage Bucket:", import.meta.env.VITE_FIREBASE_STORAGE_BUCKET ? "설정됨" : "설정되지 않음");

// Initialize Firebase
console.log("Firebase 초기화 시작...");
const app = initializeApp(firebaseConfig);
console.log("Firebase 앱 초기화 성공");

const auth = getAuth(app);
console.log("Firebase Auth 초기화 성공");

const db = getFirestore(app);
console.log("Firebase Firestore 초기화 성공");

const storage = getStorage(app);
console.log("Firebase Storage 초기화 성공");

console.log("Firebase 모든 서비스 초기화 완료");

export { auth, app, db, storage };