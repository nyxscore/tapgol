// src/components/Events.jsx
import React, { useMemo, useState } from "react";
import Header from "./Header";
import BottomNavigation from "./BottomNavigation";

const mockEvents = [
  {
    id: 1,
    title: "맨발 걷기 모임",
    emoji: "🔥",
    date: "2025-09-10T10:00:00",
    location: "탑골공원 분수대 앞",
    category: "동네모임",
    desc: "매주 수요일 아침에 함께 맨발로 걸어요. 준비물: 물, 수건",
    capacity: 30,
    attendees: 21,
  },
  {
    id: 2,
    title: "국악 버스킹",
    emoji: "🎶",
    date: "2025-08-25T17:30:00",
    location: "탑골공원 야외무대",
    category: "문화",
    desc: "해질녘에 즐기는 국악 공연. 누구나 무료 관람!",
    capacity: 200,
    attendees: 188,
  },
  {
    id: 3,
    title: "건강 스트레칭 클래스",
    emoji: "🧘",
    date: "2025-08-18T09:00:00",
    location: "탑골공원 중앙 잔디",
    category: "건강",
    desc: "어르신 맞춤 30분 전신 스트레칭. 매트 가져오시면 좋아요.",
    capacity: 50,
    attendees: 50,
  },
  {
    id: 4,
    title: "바둑 번개대회",
    emoji: "⚫",
    date: "2025-07-30T14:00:00",
    location: "탑골공원 쉼터",
    category: "게임",
    desc: "바둑 실력자 모여라! 가벼운 토너먼트 진행.",
    capacity: 32,
    attendees: 32,
  },
];

function formatDate(iso) {
  const d = new Date(iso);
  return d.toLocaleString("ko-KR", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function isPast(iso) {
  return new Date(iso).getTime() < Date.now();
}

const Events = () => {
  const [query, setQuery] = useState("");
  const [tab, setTab] = useState("all"); // all | open | closed | past
  const [rsvp, setRsvp] = useState(() => new Set()); // 참여한 이벤트 ID들(로컬 상태)

  const filtered = useMemo(() => {
    return (
      mockEvents
        .map((e) => {
          const past = isPast(e.date);
          const full = e.attendees >= e.capacity;
          const open = !past && !full;
          return { ...e, past, full, open };
        })
        .filter((e) => {
          if (tab === "open" && !e.open) return false;
          if (tab === "closed" && !(e.full && !e.past)) return false; // 마감(정원초과) & 아직 날짜 안 지남
          if (tab === "past" && !e.past) return false;
          return true;
        })
        .filter((e) => {
          if (!query.trim()) return true;
          const q = query.toLowerCase();
          return (
            e.title.toLowerCase().includes(q) ||
            e.location.toLowerCase().includes(q) ||
            e.category.toLowerCase().includes(q)
          );
        })
        // 기본 정렬: 날짜 오름차순(가까운 일정 먼저)
        .sort((a, b) => new Date(a.date) - new Date(b.date))
    );
  }, [query, tab]);

  const toggleRSVP = (id) => {
    setRsvp((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const TabButton = ({ value, label }) => (
    <button
      onClick={() => setTab(value)}
      className={
        "px-3 py-1 rounded-full text-sm font-medium transition " +
        (tab === value
          ? "bg-orange-500 text-white"
          : "bg-white text-gray-700 border border-gray-200 hover:bg-gray-50")
      }
    >
      {label}
    </button>
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-amber-50 via-orange-50 to-amber-100">
      <Header />
      <main className="pt-16 pb-20">
        <div className="max-w-4xl mx-auto px-4">
          <div className="flex items-center justify-between mb-4">
            <h1 className="text-2xl font-bold text-gray-900">이벤트</h1>
            <div className="flex gap-2">
              <TabButton value="all" label="전체" />
              <TabButton value="open" label="진행중" />
              <TabButton value="closed" label="마감" />
              <TabButton value="past" label="지난 이벤트" />
            </div>
          </div>

          {/* 검색 */}
          <div className="mb-6">
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="이벤트 제목/장소/분류 검색…"
              className="w-full px-4 py-2 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-orange-300"
            />
          </div>

          {/* 리스트 */}
          <div className="space-y-4">
            {filtered.map((e) => {
              const badge = e.past
                ? { text: "지난 이벤트", cls: "bg-gray-200 text-gray-700" }
                : e.full
                ? { text: "마감", cls: "bg-red-100 text-red-700" }
                : { text: "참가 가능", cls: "bg-green-100 text-green-700" };

              const joined = rsvp.has(e.id);
              return (
                <div
                  key={e.id}
                  className="bg-white rounded-xl shadow-md p-4 hover:shadow-lg transition"
                >
                  <div className="flex items-start gap-3">
                    <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-white to-orange-50 flex items-center justify-center text-2xl">
                      <span>{e.emoji}</span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-xs px-2 py-0.5 rounded-full bg-orange-100 text-orange-700">
                          {e.category}
                        </span>
                        <span
                          className={`text-xs px-2 py-0.5 rounded-full ${badge.cls}`}
                        >
                          {badge.text}
                        </span>
                      </div>
                      <h3 className="text-lg font-semibold text-gray-900 truncate">
                        {e.title}
                      </h3>
                      <p className="text-sm text-gray-600 mt-1">
                        {formatDate(e.date)} · {e.location}
                      </p>
                      <p className="text-sm text-gray-700 mt-2 line-clamp-2">
                        {e.desc}
                      </p>
                      <div className="flex items-center justify-between mt-3">
                        <span className="text-xs text-gray-500">
                          정원 {e.capacity}명 / 신청 {e.attendees}명
                          {joined ? " + 나" : ""}
                        </span>
                        <div className="flex gap-2">
                          <button
                            disabled={e.past || e.full}
                            onClick={() => toggleRSVP(e.id)}
                            className={
                              "px-3 py-1 rounded-lg text-sm font-medium transition " +
                              (e.past || e.full
                                ? "bg-gray-200 text-gray-500 cursor-not-allowed"
                                : joined
                                ? "bg-green-600 text-white hover:bg-green-700"
                                : "bg-orange-500 text-white hover:bg-orange-600")
                            }
                          >
                            {e.past
                              ? "종료됨"
                              : e.full
                              ? "마감됨"
                              : joined
                              ? "참여완료"
                              : "참여하기"}
                          </button>
                          <button className="px-3 py-1 rounded-lg text-sm bg-white border border-gray-200 hover:bg-gray-50">
                            공유
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}

            {filtered.length === 0 && (
              <div className="text-center text-gray-500 py-12">
                조건에 맞는 이벤트가 없어요.
              </div>
            )}
          </div>
        </div>
      </main>
      <BottomNavigation />
    </div>
  );
};

export default Events;
