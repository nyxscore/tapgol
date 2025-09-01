// src/App.jsx
import React from "react";
import { BrowserRouter as Router, Routes, Route, Outlet } from "react-router-dom";
import { AuthProvider } from "./contexts/AuthContext";
import { NotificationsProvider } from "./contexts/NotificationsContext";
import ErrorBoundary from "./components/ErrorBoundary";
import HomePage from "./components/HomePage";
import Board from "./components/Board";
import BoardWrite from "./components/BoardWrite";
import BoardDetail from "./components/BoardDetail";
import BoardEdit from "./components/BoardEdit";
import Gallery from "./components/Gallery";
import GalleryUpload from "./components/GalleryUpload";
import GalleryDetail from "./components/GalleryDetail";
import Header from "./components/Header";
import BottomNavigation from "./components/BottomNavigation";
import Login from "./components/Login";
import Signup from "./components/Signup";
import Profile from "./components/Profile";
import Chat from "./components/Chat";
import Community from "./components/Community";
import Events from "./components/Events";
import Karaoke from "./components/Karaoke";
import KaraokeUpload from "./components/KaraokeUpload";
import KaraokeDetail from "./components/KaraokeDetail";
import Cooking from "./components/Cooking";
import CookingWrite from "./components/CookingWrite";
import CookingDetail from "./components/CookingDetail";
import CookingEdit from "./components/CookingEdit";
import HealthBoard from "./components/HealthBoard";
import HealthWrite from "./components/HealthWrite";
import HealthDetail from "./components/HealthDetail";
import HealthEdit from "./components/HealthEdit";

import Alerts from "./components/Alerts";
import NotificationBoard from "./components/NotificationBoard";


import Marketplace from "./components/Marketplace";
import MarketplaceWrite from "./components/MarketplaceWrite";
import MarketplaceDetail from "./components/MarketplaceDetail";
import MarketplaceEdit from "./components/MarketplaceEdit";
import ReportManagement from "./components/ReportManagement";

// 메인 레이아웃 컴포넌트
function MainLayout() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-amber-50 via-orange-50 to-amber-100">
      {/* 헤더를 공통으로 표시 */}
      <Header />
      {/* 네비와 겹치지 않게 공통 하단 여백 */}
      <div className="pb-20">
        <Outlet />
      </div>
      <BottomNavigation />
    </div>
  );
}

export default function App() {
  return (
    <ErrorBoundary>
      <AuthProvider>
        <NotificationsProvider>
          <Router>
            <Routes>
              <Route element={<MainLayout />}>
                <Route index element={<HomePage />} />
                <Route path="/board" element={<Board />} />
                <Route path="/board/write" element={<BoardWrite />} />
                <Route path="/board/:id" element={<BoardDetail />} />
                <Route path="/board/edit/:id" element={<BoardEdit />} />
                <Route path="/gallery" element={<Gallery />} />
                <Route path="/gallery/upload" element={<GalleryUpload />} />
                <Route path="/gallery/:id" element={<GalleryDetail />} />
                <Route path="/chat" element={<Chat />} />
                <Route path="/chat/main" element={<Chat />} />
                <Route path="/community" element={<Community />} />
                <Route path="/events" element={<Events />} />
                <Route path="/karaoke" element={<Karaoke />} />
                <Route path="/karaoke/upload" element={<KaraokeUpload />} />
                <Route path="/karaoke/:id" element={<KaraokeDetail />} />
                <Route path="/cooking" element={<Cooking />} />
                <Route path="/cooking/write" element={<CookingWrite />} />
                <Route path="/cooking/:id" element={<CookingDetail />} />
                <Route path="/cooking/edit/:id" element={<CookingEdit />} />
                <Route path="/health" element={<HealthBoard />} />
                <Route path="/health/write" element={<HealthWrite />} />
                <Route path="/health/:id" element={<HealthDetail />} />
                <Route path="/health/edit/:id" element={<HealthEdit />} />


                <Route path="/alerts" element={<Alerts />} />
                <Route path="/notification-board" element={<NotificationBoard />} />


                <Route path="/marketplace" element={<Marketplace />} />
                <Route path="/marketplace/write" element={<MarketplaceWrite />} />
                <Route path="/marketplace/:id" element={<MarketplaceDetail />} />
                <Route path="/marketplace/edit/:id" element={<MarketplaceEdit />} />
                <Route path="/reports" element={<ReportManagement />} />
                <Route path="/login" element={<Login />} />
                <Route path="/signup" element={<Signup />} />
                <Route path="/profile" element={<Profile />} />
              </Route>
            </Routes>
          </Router>
        </NotificationsProvider>
      </AuthProvider>
    </ErrorBoundary>
  );
}
