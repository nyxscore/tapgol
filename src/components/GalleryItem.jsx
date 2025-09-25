import React from 'react';
import { useContentZoom } from '../hooks/useContentZoom';

const GalleryItem = ({ item, onItemClick, onLike, isLikedByUser, onShowProfile, user }) => {
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
  } = useContentZoom(1, 0.8, 2);

  const formatDate = (timestamp) => {
    if (!timestamp) return "";
    
    const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
    return date.toLocaleDateString('ko-KR', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit'
    });
  };

  const getFileTypeIcon = (fileType) => {
    if (fileType === 'image') {
      return (
        <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
          <path fillRule="evenodd" d="M4 3a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V5a2 2 0 00-2-2H4zm12 12H4l4-8 3 6 2-4 3 6z" clipRule="evenodd" />
        </svg>
      );
    }
    return null;
  };

  return (
    <div
      key={item.id}
      className="gallery-container relative cursor-pointer group"
    >
      {/* 줌 가능한 전체 콘텐츠 컨테이너 */}
      <div
        ref={elementRef}
        className="content-zoom-container relative"
        style={{
          width: '100%',
          height: '100%',
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          zIndex: 1,
          transform: `scale(${scale}) translate(${position.x / scale}px, ${position.y / scale}px)`,
          transition: isZoomed ? 'none' : 'transform 0.3s ease-out'
        }}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
        onDoubleClick={(e) => {
          handleDoubleClick(e);
          if (!isZoomed) {
            onItemClick(item.id);
          }
        }}
        onClick={(e) => {
          if (!isZoomed) {
            onItemClick(item.id);
          }
        }}
      >
        <img
          src={item.fileUrl}
          alt={item.title || '갤러리 이미지'}
          className="gallery-image"
          loading="lazy"
          style={{
            width: '100%',
            height: '100%',
            objectFit: 'cover',
            objectPosition: 'center',
            display: 'block',
            backgroundColor: 'transparent',
            backgroundImage: 'none',
            border: 'none',
            outline: 'none',
            opacity: 1,
            visibility: 'visible',
            filter: 'none',
            maxWidth: '100%',
            maxHeight: '100%',
            minWidth: '100%',
            minHeight: '100%'
          }}
          onError={(e) => {
            console.error('이미지 로드 실패:', {
              src: item.fileUrl,
              itemId: item.id,
              error: e
            });
            e.target.style.display = 'none';
          }}
        />
        
        {/* 줌 상태 표시 */}
        {isZoomed && (
          <div className="absolute top-2 right-2 bg-black bg-opacity-50 text-white px-2 py-1 rounded text-xs">
            {Math.round(scale * 100)}%
          </div>
        )}
        
        {/* 줌 리셋 버튼 */}
        {isZoomed && (
          <button
            onClick={(e) => {
              e.stopPropagation();
              resetZoom();
            }}
            className="absolute bottom-2 right-2 bg-black bg-opacity-50 text-white p-2 rounded-full hover:bg-opacity-70 transition-all"
            title="줌 리셋"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
          </button>
        )}
      </div>

      {/* 파일 타입 아이콘 */}
      <div className="absolute top-2 left-2 z-10">
        {getFileTypeIcon(item.fileType)}
      </div>

      {/* 좋아요 버튼 */}
      <div className="absolute bottom-2 left-2 z-10">
        <button
          onClick={(e) => onLike(e, item.id)}
          className={`p-2 rounded-full transition-all ${
            isLikedByUser(item)
              ? 'bg-red-500 text-white'
              : 'bg-white bg-opacity-80 text-gray-600 hover:bg-opacity-100'
          }`}
          title={isLikedByUser(item) ? '좋아요 취소' : '좋아요'}
        >
          <svg className="w-4 h-4" fill={isLikedByUser(item) ? 'currentColor' : 'none'} stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
          </svg>
        </button>
      </div>

      {/* 툴팁 */}
      <div className="gallery-title-tooltip">
        <p className="font-medium">
          {item.title || item.description || '추억앨범'}
        </p>
        <div className="flex items-center justify-between mt-1">
          {item.createdAt && (
            <p className="text-xs opacity-80">
              {formatDate(item.createdAt)}
            </p>
          )}
          <div className="flex items-center space-x-1 text-xs opacity-80">
            <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M3.172 5.172a4 4 0 015.656 0L10 6.343l1.172-1.171a4 4 0 115.656 5.656L10 17.657l-6.828-6.829a4 4 0 010-5.656z" clipRule="evenodd" />
            </svg>
            <span>{item.likes || 0}</span>
          </div>
        </div>
      </div>

      {/* 업로더 정보 */}
      <div className="absolute bottom-2 right-2 z-10 bg-black bg-opacity-50 text-white px-2 py-1 rounded text-xs">
        <span 
          className="cursor-pointer transition-colors hover:text-blue-400"
          onClick={(e) => {
            e.stopPropagation();
            onShowProfile(item.uploaderId, item.uploader);
          }}
          title="프로필 보기"
        >
          {item.uploader || '익명'}
        </span>
      </div>
    </div>
  );
};

export default GalleryItem;
