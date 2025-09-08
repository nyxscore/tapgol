// 관리자 관련 유틸리티 함수들
import React from 'react';

// 관리자 이메일 목록
export const ADMIN_EMAILS = [
  "juhyundon82@gmail.com"
];

// 관리자 권한 확인 함수
export const isAdmin = (userEmail) => {
  return ADMIN_EMAILS.includes(userEmail);
};

// 관리자 표시 컴포넌트를 위한 스타일
export const getAdminStyles = () => ({
  container: "inline-flex items-center space-x-1",
  badge: "inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-gradient-to-r from-purple-500 to-pink-500 text-white shadow-lg",
  icon: "w-3 h-3 mr-1",
  text: "font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent"
});

// 관리자 이름 표시 함수
export const formatAdminName = (name, userEmail) => {
  if (isAdmin(userEmail)) {
    return {
      isAdmin: true,
      name: name,
      badgeText: "관리자"
    };
  }
  return {
    isAdmin: false,
    name: name,
    badgeText: null
  };
};

// 관리자 댓글/게시글 스타일
export const getAdminPostStyles = () => ({
  container: "border-l-4 border-purple-500 bg-gradient-to-r from-purple-50 to-pink-50 shadow-lg shadow-purple-200/50 ring-1 ring-purple-200/30",
  header: "flex items-center space-x-2 mb-2",
  badge: "inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-gradient-to-r from-purple-500 to-pink-500 text-white shadow-lg animate-pulse",
  content: "text-gray-800 font-medium"
});

// 관리자 게시글 강화 스타일
export const getEnhancedAdminStyles = () => ({
  container: "border-l-4 border-purple-500 bg-gradient-to-br from-purple-50 via-pink-50 to-purple-100 shadow-xl shadow-purple-300/40 ring-2 ring-purple-200/50 relative overflow-hidden",
  glowEffect: "absolute inset-0 bg-gradient-to-r from-purple-400/20 via-pink-400/20 to-purple-400/20 animate-pulse",
  adminIcon: "absolute top-4 right-4 w-8 h-8 text-purple-500 animate-bounce",
  titleGlow: "text-shadow-lg shadow-purple-500/50",
  contentGlow: "drop-shadow-sm shadow-purple-400/30"
});
