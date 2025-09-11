import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { collection, query, where, onSnapshot, orderBy, doc, getDoc } from 'firebase/firestore';
import { db } from '../util/firebase';
import { useAuth } from '../contexts/AuthContext';
import { subscribeToUnreadMessages, markAsRead } from '../util/unreadMessagesService';

const DmList = () => {
  const navigate = useNavigate();
  const { user: currentUser, loading: authLoading } = useAuth();
  const [threads, setThreads] = useState([]);
  const [loading, setLoading] = useState(true);
  const [unreadCounts, setUnreadCounts] = useState({});

  // 사용자 정보 가져오기
  const getUserInfo = async (userId) => {
    try {
      const userDoc = await getDoc(doc(db, 'users', userId));
      if (userDoc.exists()) {
        const userData = userDoc.data();
        return userData.nickname || userData.name || '익명';
      }
      return '익명';
    } catch (error) {
      console.error('사용자 정보 조회 오류:', error);
      return '익명';
    }
  };

  useEffect(() => {
    console.log("DmList - authLoading:", authLoading, "currentUser:", currentUser);
    console.log("DmList - currentUser.uid:", currentUser?.uid);
    console.log("DmList - currentUser.email:", currentUser?.email);
    
    // AuthContext가 로딩 중이면 대기
    if (authLoading) {
      console.log("DmList - AuthContext 로딩 중...");
      return;
    }
    
    if (!currentUser) {
      console.log("DmList - 사용자가 로그인되지 않음");
      setLoading(false);
      return;
    }
    console.log("DmList - 사용자 로그인됨, 스레드 조회 시작:", currentUser.uid);
    
    // chatMessages에서 DM 메시지들을 조회해서 스레드 목록 생성
    console.log("chatMessages에서 DM 메시지들을 조회합니다.");
    const dmQuery = query(
      collection(db, 'chatMessages'),
      where('type', '==', 'dm')
    );
    
    const unsub = onSnapshot(dmQuery, async (snap) => {
      console.log("DM 메시지 조회 결과:", snap.docs.length, "개");
      
      // 스레드별로 그룹화
      const threadMap = new Map();
      
      for (const doc of snap.docs) {
        const messageData = doc.data();
        
        // 현재 사용자가 참여한 DM인지 확인
        if (messageData.authorId === currentUser.uid || messageData.recipientId === currentUser.uid) {
          const threadKey = messageData.threadKey;
          if (!threadKey) continue;
          
          if (!threadMap.has(threadKey)) {
            // 상대방 ID 찾기
            const otherUserId = messageData.authorId === currentUser.uid 
              ? messageData.recipientId 
              : messageData.authorId;
            
            threadMap.set(threadKey, {
              id: threadKey,
              threadKey: threadKey,
              participants: [currentUser.uid, otherUserId],
              otherUserId: otherUserId,
              lastMessage: messageData.content,
              lastAuthorId: messageData.authorId,
              lastAuthorName: messageData.authorName,
              updatedAt: messageData.createdAt,
              messageCount: 0
            });
          }
          
          const thread = threadMap.get(threadKey);
          thread.messageCount++;
          
          // 더 최신 메시지로 업데이트
          if (messageData.createdAt && 
              (!thread.updatedAt || messageData.createdAt.toDate() > thread.updatedAt.toDate())) {
            thread.lastMessage = messageData.content;
            thread.lastAuthorId = messageData.authorId;
            thread.lastAuthorName = messageData.authorName;
            thread.updatedAt = messageData.createdAt;
          }
        }
      }
      
      // 상대방 정보 추가
      const list = [];
      for (const [threadKey, threadData] of threadMap) {
        try {
          threadData.otherUserName = await getUserInfo(threadData.otherUserId);
        } catch (error) {
          console.error("사용자 정보 조회 오류:", error);
          threadData.otherUserName = "익명";
        }
        list.push(threadData);
      }
      
      // 최신 업데이트 순 정렬
      list.sort((a, b) => {
        const ta = a.updatedAt?.toDate ? a.updatedAt.toDate().getTime() : 0;
        const tb = b.updatedAt?.toDate ? b.updatedAt.toDate().getTime() : 0;
        return tb - ta;
      });
      
      console.log("생성된 DM 스레드 목록:", list.length, "개");
      setThreads(list);
      setLoading(false);
    }, (error) => {
      console.error("DM 메시지 구독 오류:", error);
      setLoading(false);
      if (error.code === 'permission-denied') {
        console.warn("chatMessages 컬렉션 읽기 권한이 없습니다.");
      }
    });
    return () => unsub();
  }, [currentUser, authLoading]);

  // 미확인 메시지 구독
  useEffect(() => {
    if (!currentUser) return;

    const unsubscribeUnread = subscribeToUnreadMessages(currentUser.uid, (unreadData) => {
      console.log("미확인 메시지 데이터:", unreadData);
      setUnreadCounts(unreadData);
    });

    return () => unsubscribeUnread();
  }, [currentUser]);

  const renderItem = (t) => {
    const unreadCount = unreadCounts[`dm_${t.threadKey}`] || 0;
    
    return (
      <div key={t.id} className="bg-white rounded-xl p-4 shadow cursor-pointer hover:shadow-md transition relative"
        onClick={async () => {
          try {
            if (currentUser) {
              await markAsRead(currentUser.uid, 'dm', t.threadKey);
            }
          } catch (e) {
            console.warn('읽음 처리 실패(무시 가능):', e);
          } finally {
            navigate(`/chat/dm/${t.otherUserId}`);
          }
        }}
      >
        <div className="flex justify-between items-start">
          <div className="flex-1">
            <div className="text-sm text-gray-500">상대방</div>
            <div className="text-base font-semibold text-gray-800">{t.otherUserName || '익명'}</div>
            <div className="text-sm text-gray-600 mt-1 line-clamp-1">{t.lastMessage || ''}</div>
          </div>
          <div className="text-right">
            {t.messageCount > 0 && (
              <div className="text-xs text-gray-400 mb-1">
                {t.messageCount}개 메시지
              </div>
            )}
            {t.updatedAt && (
              <div className="text-xs text-gray-400">
                {t.updatedAt.toDate ? t.updatedAt.toDate().toLocaleString() : ''}
              </div>
            )}
          </div>
        </div>
        
        {/* 미확인 메시지 알람 */}
        {unreadCount > 0 && (
          <div className="absolute top-2 right-2 bg-gradient-to-r from-red-500 to-red-600 text-white text-xs rounded-full min-w-[22px] h-[22px] px-1.5 flex items-center justify-center font-bold shadow-lg border-2 border-white notification-badge">
            <span className="drop-shadow-sm">
              {unreadCount > 99 ? '99+' : unreadCount}
            </span>
          </div>
        )}
      </div>
    );
  };

  // AuthContext가 로딩 중이면 로딩 화면 표시
  if (authLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-amber-50 via-orange-50 to-amber-100">
        <main className="pb-20 pt-16">
          <div className="max-w-4xl mx-auto px-4">
            <div className="bg-white rounded-2xl shadow-xl p-6 text-center">
              <p className="text-gray-700">로그인 상태를 확인하는 중...</p>
            </div>
          </div>
        </main>
      </div>
    );
  }

  if (!currentUser) {
    console.log("DmList - 렌더링: 로그인되지 않은 상태");
    return (
      <div className="min-h-screen bg-gradient-to-br from-amber-50 via-orange-50 to-amber-100">
        <main className="pb-20 pt-16">
          <div className="max-w-4xl mx-auto px-4">
            <div className="bg-white rounded-2xl shadow-xl p-6 text-center">
              <p className="text-gray-700">1:1 채팅 목록을 보려면 로그인하세요.</p>
              <button className="mt-3 px-4 py-2 bg-amber-600 text-white rounded" onClick={() => navigate('/login')}>로그인</button>
            </div>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-amber-50 via-orange-50 to-amber-100">
      <main className="pb-20 pt-16">
        <div className="max-w-4xl mx-auto px-4">
          <div className="bg-white rounded-2xl shadow-xl p-6 mb-6">
            <div className="flex items-center justify-between">
              <h1 className="text-2xl font-bold text-gray-800">1:1 채팅</h1>
              <button className="text-sm text-amber-600" onClick={async () => {
                try {
                  if (currentUser) {
                    await markAsRead(currentUser.uid, 'main');
                  }
                } catch (e) {
                  console.warn('메인 읽음 처리 실패(무시 가능):', e);
                } finally {
                  navigate('/chat/main');
                }
              }}>메인 채팅</button>
            </div>
          </div>

          {loading ? (
            <div className="bg-white rounded-2xl shadow p-6 text-center">불러오는 중...</div>
          ) : threads.length === 0 ? (
            <div className="bg-white rounded-2xl shadow p-6 text-center">
              <div className="text-gray-600 mb-4">대화가 없습니다.</div>
              <div className="text-sm text-gray-500">
                <p>1:1 채팅을 시작하려면:</p>
                <p>• 게시판에서 상대방 닉네임을 클릭하세요</p>
                <p>• 중고장터에서 "판매자 1:1 문의" 버튼을 클릭하세요</p>
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-3">
              {threads.map(renderItem)}
            </div>
          )}
        </div>
      </main>
    </div>
  );
};

export default DmList;


