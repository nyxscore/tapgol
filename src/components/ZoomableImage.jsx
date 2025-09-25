import React from 'react';
import { useTouchZoom } from '../hooks/useTouchZoom';

const ZoomableImage = ({ 
  src, 
  alt, 
  className = "", 
  style = {}, 
  maxScale = 3,
  showZoomIndicator = true,
  showResetButton = true 
}) => {
  const {
    scale,
    position,
    isZoomed,
    elementRef,
    handleTouchStart,
    handleTouchMove,
    handleTouchEnd,
    handleDoubleClick,
    resetZoom
  } = useTouchZoom(1, 0.5, maxScale);

  return (
    <div className="relative inline-block">
      {/* 줌 가능한 이미지 컨테이너 */}
      <div
        ref={elementRef}
        className={`relative overflow-hidden ${className}`}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
        onDoubleClick={handleDoubleClick}
        style={style}
      >
        <img
          src={src}
          alt={alt}
          className="block w-full h-full object-cover"
          style={{ 
            transform: `scale(${scale}) translate(${position.x / scale}px, ${position.y / scale}px)`,
            transition: isZoomed ? 'none' : 'transform 0.3s ease-out',
            transformOrigin: 'center center'
          }}
          loading="lazy"
        />
        
        {/* 줌 상태 표시 */}
        {isZoomed && showZoomIndicator && (
          <div className="absolute top-2 left-2 bg-black bg-opacity-60 text-white px-2 py-1 rounded text-xs font-medium">
            {Math.round(scale * 100)}%
          </div>
        )}
        
        {/* 줌 리셋 버튼 */}
        {isZoomed && showResetButton && (
          <button
            onClick={(e) => {
              e.stopPropagation();
              resetZoom();
            }}
            className="absolute top-2 right-2 bg-black bg-opacity-60 text-white p-1 rounded-full hover:bg-opacity-80 transition-all"
            title="줌 리셋"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
          </button>
        )}
      </div>
    </div>
  );
};

export default ZoomableImage;
