import React from 'react';

// URL을 자동으로 링크로 변환하는 유틸리티 함수
export const convertUrlsToLinks = (text) => {
  if (!text || typeof text !== 'string') return text;
  
  try {
    // URL 패턴을 감지하는 정규식
    const urlRegex = /(https?:\/\/[^\s]+)|(www\.[^\s]+)/g;
    
    // 텍스트를 URL과 일반 텍스트로 분할
    const parts = text.split(urlRegex);
    
    return parts.map((part, index) => {
      if (!part) return null;
      
      // URL인지 확인
      if (urlRegex.test(part)) {
        let href = part;
        if (part.startsWith('www.')) {
          href = 'https://' + part;
        }
        
        return (
          <a
            key={index}
            href={href}
            target="_blank"
            rel="noopener noreferrer"
            className="text-blue-600 hover:text-blue-800 underline break-all"
          >
            {part}
          </a>
        );
      }
      
      return part;
    }).filter(Boolean);
  } catch (error) {
    console.error('URL 변환 중 오류:', error);
    return text; // 오류 발생 시 원본 텍스트 반환
  }
};

// 텍스트를 줄바꿈과 링크를 모두 처리하는 함수
export const formatTextWithLinks = (text) => {
  if (!text || typeof text !== 'string') return text;
  
  try {
    // 줄바꿈을 <br> 태그로 변환하고 URL을 링크로 변환
    const lines = text.split('\n');
    
    return lines.map((line, lineIndex) => (
      <React.Fragment key={lineIndex}>
        {convertUrlsToLinks(line)}
        {lineIndex < lines.length - 1 && <br />}
      </React.Fragment>
    ));
  } catch (error) {
    console.error('텍스트 포맷팅 중 오류:', error);
    return text; // 오류 발생 시 원본 텍스트 반환
  }
};
