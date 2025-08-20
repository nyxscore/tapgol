// src/App.jsx
import React from "react";
import {
  BrowserRouter as Router,
  Routes,
  Route,
  Outlet,
} from "react-router-dom";

import Header from "./components/Header";
import Banner from "./components/Banner";
import PopularPosts from "./components/PopularPosts";
import FeatureGrid from "./components/FeatureGrid";
import BottomNavigation from "./components/BottomNavigation";

import Board from "./components/Board";
import Gallery from "./components/Gallery";
import GalleryDetail from "./components/GalleryDetail";
import Chat from "./components/Chat";
import Community from "./components/Community";
import ParkMeetings from "./components/ParkMeetings";
import AlumniSearch from "./components/AlumniSearch";
import AlumniResults from "./components/AlumniResults";
import HealthBoard from "./components/HealthBoard";
import Playground from "./components/Playground";
import JanggiGame from "./components/games/JanggiGame";
import BadukGame from "./components/games/BadukGame";
import TetrisGame from "./components/games/TetrisGame";
import YutnoriGame from "./components/games/YutnoriGame";
import GostopGame from "./components/games/GostopGame";
import Signup from "./components/Signup";
import Login from "./components/Login";
import Events from "./components/Events";
import Karaoke from "./components/Karaoke";

// 알림 컨텍스트 + 페이지
import { NotificationsProvider } from "./contexts/NotificationsContext";
import Alerts from "./pages/Alerts";

// 공통 레이아웃: 모든 페이지에서 하단 네비 표시
function MainLayout() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-amber-50 via-orange-50 to-amber-100">
      {/* 네비와 겹치지 않게 공통 하단 여백 */}
      <div className="pb-20">
        <Outlet />
      </div>
      <BottomNavigation />
    </div>
  );
}

function HomePage() {
  return (
    <>
      <Header />
      <main>
        <Banner />
        <PopularPosts />
        <FeatureGrid />
      </main>
    </>
  );
}

export default function App() {
  return (
    <NotificationsProvider>
      <Router>
        <Routes>
          {/* 공통 레이아웃 아래에 전부 중첩 */}
          <Route element={<MainLayout />}>
            <Route index element={<HomePage />} />
            <Route path="/board" element={<Board />} />
            <Route path="/gallery" element={<Gallery />} />
            <Route path="/gallery/:id" element={<GalleryDetail />} />
            <Route path="/chat" element={<Chat />} />
            <Route path="/community" element={<Community />} />
            <Route path="/community/:id" element={<ParkMeetings />} />
            <Route path="/alumni-search" element={<AlumniSearch />} />
            <Route path="/alumni-results" element={<AlumniResults />} />
            <Route path="/health-board" element={<HealthBoard />} />
            <Route path="/playground" element={<Playground />} />
            <Route path="/playground/janggi" element={<JanggiGame />} />
            <Route path="/playground/baduk" element={<BadukGame />} />
            <Route path="/playground/tetris" element={<TetrisGame />} />
            <Route path="/playground/yutnori" element={<YutnoriGame />} />
            <Route path="/playground/gostop" element={<GostopGame />} />
            <Route path="/signup" element={<Signup />} />
            <Route path="/login" element={<Login />} />
            <Route path="/events" element={<Events />} />
            <Route path="/karaoke" element={<Karaoke />} />
            <Route path="/alerts" element={<Alerts />} />
            <Route
              path="*"
              element={<div style={{ padding: 16 }}>Not Found</div>}
            />
          </Route>
        </Routes>
      </Router>
    </NotificationsProvider>
  );
}
