import { useState, useRef, useCallback } from 'react';

export const useContentZoom = (initialScale = 1, minScale = 0.8, maxScale = 2) => {
  const [scale, setScale] = useState(initialScale);
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [isZoomed, setIsZoomed] = useState(false);
  
  const elementRef = useRef(null);
  const lastDistanceRef = useRef(0);
  const lastPositionRef = useRef({ x: 0, y: 0 });
  const isDraggingRef = useRef(false);
  const lastTapRef = useRef(0);

  // 핀치 제스처 처리
  const handleTouchStart = useCallback((e) => {
    if (e.touches.length === 2) {
      // 두 손가락으로 핀치 시작
      const touch1 = e.touches[0];
      const touch2 = e.touches[1];
      const distance = Math.sqrt(
        Math.pow(touch2.clientX - touch1.clientX, 2) +
        Math.pow(touch2.clientY - touch1.clientY, 2)
      );
      lastDistanceRef.current = distance;
    } else if (e.touches.length === 1 && scale > 1) {
      // 드래그 시작 (줌된 상태에서만)
      isDraggingRef.current = true;
      lastPositionRef.current = { x: e.touches[0].clientX, y: e.touches[0].clientY };
    }
  }, [scale]);

  const handleTouchMove = useCallback((e) => {
    e.preventDefault();
    
    if (e.touches.length === 2) {
      // 핀치 제스처 처리
      const touch1 = e.touches[0];
      const touch2 = e.touches[1];
      const distance = Math.sqrt(
        Math.pow(touch2.clientX - touch1.clientX, 2) +
        Math.pow(touch2.clientY - touch1.clientY, 2)
      );
      
      const scaleChange = distance / lastDistanceRef.current;
      const newScale = Math.min(Math.max(scale * scaleChange, minScale), maxScale);
      
      setScale(newScale);
      lastDistanceRef.current = distance;
      
      if (newScale > 1.1) {
        setIsZoomed(true);
      }
    } else if (e.touches.length === 1 && isDraggingRef.current && scale > 1) {
      // 드래그 처리
      const deltaX = e.touches[0].clientX - lastPositionRef.current.x;
      const deltaY = e.touches[0].clientY - lastPositionRef.current.y;
      
      setPosition(prev => ({
        x: prev.x + deltaX,
        y: prev.y + deltaY
      }));
      
      lastPositionRef.current = { x: e.touches[0].clientX, y: e.touches[0].clientY };
    }
  }, [scale, minScale, maxScale]);

  const handleTouchEnd = useCallback(() => {
    isDraggingRef.current = false;
    
    // 줌이 1에 가까우면 리셋
    if (scale < 1.1) {
      setScale(1);
      setPosition({ x: 0, y: 0 });
      setIsZoomed(false);
    }
  }, [scale]);

  // 더블탭 줌 토글
  const handleDoubleClick = useCallback((e) => {
    e.preventDefault();
    const now = Date.now();
    const timeSinceLastTap = now - lastTapRef.current;
    
    if (timeSinceLastTap < 300) {
      // 더블탭
      if (scale === 1) {
        setScale(1.5);
        setIsZoomed(true);
      } else {
        setScale(1);
        setPosition({ x: 0, y: 0 });
        setIsZoomed(false);
      }
    }
    
    lastTapRef.current = now;
  }, [scale]);

  // 줌 리셋
  const resetZoom = useCallback(() => {
    setScale(1);
    setPosition({ x: 0, y: 0 });
    setIsZoomed(false);
  }, []);

  return {
    scale,
    position,
    isZoomed,
    elementRef,
    handleTouchStart,
    handleTouchMove,
    handleTouchEnd,
    handleDoubleClick,
    resetZoom
  };
};
