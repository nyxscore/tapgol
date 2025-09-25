import React from 'react';
import { useContentZoom } from '../hooks/useContentZoom';
import ZoomableImage from './ZoomableImage';

const ZoomablePostCard = ({ 
  post, 
  user, 
  onPostClick, 
  onLike, 
  onShare, 
  onReport, 
  onDropdownToggle, 
  onUserProfileClick,
  showDropdown, 
  isLikedByUser, 
  loadingLikes,
  visibleVideos,
  videoRefs,
  children 
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
  } = useContentZoom(1, 0.8, 2);

  const handleCardClick = (e) => {
    if (!isZoomed) {
      onPostClick(post);
    }
  };

  const handleImageClick = (e) => {
    e.stopPropagation();
    // 이미지 클릭은 줌 기능으로 처리
  };

  return (
    <div className="bg-white rounded-lg shadow-md overflow-hidden mb-4">
      {/* 포스트 헤더 */}
      <div className="px-3 py-2 border-b border-gray-100">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <button
              onClick={(e) => onUserProfileClick(e, post)}
              className="font-semibold text-sm text-gray-900 hover:text-blue-600 transition-colors"
            >
              {post.author || '익명'}
            </button>
            <span className="text-xs text-gray-500">
              {post.createdAt ? new Date(post.createdAt.seconds ? post.createdAt.seconds * 1000 : post.createdAt).toLocaleDateString('ko-KR') : ''}
            </span>
          </div>
          <div className="flex items-center space-x-2">
            {/* 모임 종류 버튼 (board 타입만) */}
            {post.type === 'post' && post.category && (
              <span className={`px-2 py-1 rounded-full text-xs font-bold ${
                post.category === "정기모임" 
                  ? "bg-red-500 text-white shadow-md" 
                  : post.category === "벙개모임"
                  ? "bg-purple-500 text-white shadow-md"
                  : post.category === "이벤트"
                  ? "bg-green-100 text-green-800"
                  : post.category === "공지"
                  ? "bg-red-100 text-red-800"
                  : "bg-red-500 text-white shadow-md"
              }`}>
                {post.category === "정기모임" ? '🔥 정기모임' : 
                 post.category === "벙개모임" ? '🍻 벙개모임' :
                 post.category === "이벤트" ? '📅 이벤트' :
                 post.category === "공지" ? '📢 공지' :
                 '🔥 정기모임'}
              </span>
            )}
            <div className="relative">
              <button 
                className="p-1 hover:bg-gray-100 rounded-full transition-colors"
                onClick={(e) => onDropdownToggle(`${post.type}-${post.id}`, e)}
              >
                <svg className="w-5 h-5 text-gray-600" fill="currentColor" viewBox="0 0 20 20">
                  <path d="M10 6a2 2 0 110-4 2 2 0 010 4zM10 12a2 2 0 110-4 2 2 0 010 4zM10 18a2 2 0 110-4 2 2 0 010 4z" />
                </svg>
              </button>
              
              {/* 드롭다운 메뉴 */}
              {showDropdown === `${post.type}-${post.id}` && (
                <div className="absolute right-0 top-full mt-1 w-36 bg-white border border-gray-200 rounded-lg shadow-lg z-20">
                  <button
                    className="w-full px-3 py-2 text-left text-sm text-gray-700 hover:bg-gray-100 transition-colors rounded-t-lg"
                    onClick={(e) => {
                      e.stopPropagation();
                      const targetUserId = post.authorId || post.userId || post.uid;
                      
                      if (user && targetUserId) {
                        navigateToDM(targetUserId, user, navigate);
                      } else if (!user) {
                        alert('1:1 채팅을 하려면 로그인이 필요합니다.');
                      } else {
                        alert('이 게시글의 작성자 정보를 찾을 수 없습니다. 잠시 후 다시 시도해주세요.');
                      }
                      onDropdownToggle(null);
                    }}
                  >
                    💬 1:1대화
                  </button>
                  <button
                    className="w-full px-3 py-2 text-left text-sm text-yellow-600 hover:bg-yellow-50 transition-colors"
                    onClick={(e) => {
                      e.stopPropagation();
                      onShare(post);
                    }}
                  >
                    🔗 공유하기
                  </button>
                  {user && user.uid !== (post.authorId || post.userId || post.uid) && (
                    <button
                      className="w-full px-3 py-2 text-left text-sm text-red-600 hover:bg-red-50 transition-colors rounded-b-lg"
                      onClick={(e) => {
                        e.stopPropagation();
                        onReport(post);
                      }}
                    >
                      🚩 신고하기
                    </button>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* 줌 가능한 포스트 콘텐츠 */}
      <div
        ref={elementRef}
        className="content-zoom-container"
        style={{
          transform: `scale(${scale}) translate(${position.x / scale}px, ${position.y / scale}px)`,
          transition: isZoomed ? 'none' : 'transform 0.3s ease-out'
        }}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
        onDoubleClick={handleDoubleClick}
        onClick={handleCardClick}
      >
        {/* 이미지/비디오 */}
        {post.imageUrl ? (
          <div onClick={handleImageClick}>
            <ZoomableImage 
              src={post.imageUrl} 
              alt={post.title}
              className={`w-full ${post.type === 'gallery' ? 'aspect-square' : 'aspect-video'}`}
              maxScale={1} // 부모에서 이미 줌 처리하므로 이미지 개별 줌은 비활성화
              showZoomIndicator={false}
              showResetButton={false}
            />
          </div>
        ) : null}
        
        {post.videoUrl && post.type === 'karaoke' && (
          <div className={`relative ${visibleVideos.has(`${post.type}-${post.id}`) ? 'video-playing' : 'video-paused'}`}>
            <video
              ref={(el) => {
                if (el) {
                  videoRefs.current[`${post.type}-${post.id}`] = el;
                }
              }}
              src={post.videoUrl}
              className="w-full aspect-video object-cover"
              preload="metadata"
              muted
              playsInline
              loop
              poster={post.thumbnailUrl}
            />
            <div className="absolute inset-0 bg-black bg-opacity-30 flex items-center justify-center">
              <svg className="w-12 h-12 text-white" fill="currentColor" viewBox="0 0 20 20">
                <path d="M6.3 2.841A1.5 1.5 0 004 4.11V15.89a1.5 1.5 0 002.3 1.269l9.344-5.89a1.5 1.5 0 000-2.538L6.3 2.84z" />
              </svg>
            </div>
          </div>
        )}

        {/* 포스트 내용 */}
        <div className="p-3">
          <h3 className="font-semibold text-sm mb-1">{post.title}</h3>
          {post.description && (
            <p className="text-sm text-gray-700 line-clamp-2">{post.description}</p>
          )}
          {post.content && (
            <p className="text-sm text-gray-700 line-clamp-2">{post.content}</p>
          )}
        </div>
      </div>

      {/* 포스트 액션 */}
      <div className="px-3 pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <button 
              onClick={(e) => onLike(e, post.id)}
              disabled={loadingLikes.has(post.id)}
              className={`flex items-center space-x-1 transition-all duration-200 hover:scale-110 ${
                isLikedByUser(post.id) ? 'text-red-500' : 'text-gray-500 hover:text-red-400'
              }`}
            >
              <svg 
                className="w-5 h-5" 
                fill={isLikedByUser(post.id) ? 'currentColor' : 'none'} 
                stroke="currentColor" 
                viewBox="0 0 24 24"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
              </svg>
              <span className="text-sm">{post.likes || 0}</span>
            </button>
            <button 
              onClick={() => onPostClick(post)}
              className="flex items-center space-x-1 text-gray-500 hover:text-blue-400 transition-colors"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
              </svg>
              <span className="text-sm">{post.commentCount || 0}</span>
            </button>
          </div>
          <div className="text-xs text-gray-500">
            {getBoardName(post.boardType || post.type)}
          </div>
        </div>
      </div>

      {/* 줌 상태 표시 */}
      {isZoomed && (
        <div className="absolute top-2 right-2 bg-black bg-opacity-60 text-white px-2 py-1 rounded text-xs">
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
          className="absolute bottom-2 right-2 bg-black bg-opacity-60 text-white p-2 rounded-full hover:bg-opacity-80 transition-all"
          title="줌 리셋"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
          </svg>
        </button>
      )}
    </div>
  );
};

// 게시판 이름 매핑 함수
const getBoardName = (type) => {
  const boardNames = {
    'post': '모임게시판',
    'gallery': '추억앨범',
    'karaoke': '노래방',
    'cooking': '나만의 요리',
    'health': '건강정보',
    'marketplace': '중고장터',
    'philosophy': '철학게시판'
  };
  return boardNames[type] || '게시판';
};

export default ZoomablePostCard;
