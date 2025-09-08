// src/App.jsx
import React, { Suspense, lazy } from "react";
import { BrowserRouter as Router, Routes, Route, Outlet } from "react-router-dom";
import { AuthProvider } from "./contexts/AuthContext";
import { NotificationsProvider } from "./contexts/NotificationsContext";
import ErrorBoundary from "./components/ErrorBoundary";
const HomePage = lazy(() => import("./components/HomePage"));
const Board = lazy(() => import("./components/Board"));
const BoardWrite = lazy(() => import("./components/BoardWrite"));
const BoardDetail = lazy(() => import("./components/BoardDetail"));
const BoardEdit = lazy(() => import("./components/BoardEdit"));
const Gallery = lazy(() => import("./components/Gallery"));
const GalleryUpload = lazy(() => import("./components/GalleryUpload"));
const GalleryDetail = lazy(() => import("./components/GalleryDetail"));
import Header from "./components/Header";
import BottomNavigation from "./components/BottomNavigation";
const Login = lazy(() => import("./components/Login"));
const Signup = lazy(() => import("./components/Signup"));
const Profile = lazy(() => import("./components/Profile"));
const Chat = lazy(() => import("./components/Chat"));
const Community = lazy(() => import("./components/Community"));
const Events = lazy(() => import("./components/Events"));
const Karaoke = lazy(() => import("./components/Karaoke"));
const KaraokeUpload = lazy(() => import("./components/KaraokeUpload"));
const KaraokeDetail = lazy(() => import("./components/KaraokeDetail"));
const Cooking = lazy(() => import("./components/Cooking"));
const CookingWrite = lazy(() => import("./components/CookingWrite"));
const CookingDetail = lazy(() => import("./components/CookingDetail"));
const CookingEdit = lazy(() => import("./components/CookingEdit"));
const HealthBoard = lazy(() => import("./components/HealthBoard"));
const HealthWrite = lazy(() => import("./components/HealthWrite"));
const HealthDetail = lazy(() => import("./components/HealthDetail"));
const HealthEdit = lazy(() => import("./components/HealthEdit"));
const PhilosophyBoard = lazy(() => import("./components/PhilosophyBoard"));
const PhilosophyWrite = lazy(() => import("./components/PhilosophyWrite"));
const PhilosophyDetail = lazy(() => import("./components/PhilosophyDetail"));
const PhilosophyEdit = lazy(() => import("./components/PhilosophyEdit"));

const Alerts = lazy(() => import("./components/Alerts"));
const NotificationBoard = lazy(() => import("./components/NotificationBoard"));


const Marketplace = lazy(() => import("./components/Marketplace"));
const MarketplaceWrite = lazy(() => import("./components/MarketplaceWrite"));
const MarketplaceDetail = lazy(() => import("./components/MarketplaceDetail"));
const MarketplaceEdit = lazy(() => import("./components/MarketplaceEdit"));
const ReportManagement = lazy(() => import("./components/ReportManagement"));
const AdminPanel = lazy(() => import("./components/AdminPanel"));


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
            <Suspense fallback={<div className="p-8 text-center text-amber-700">로딩 중...</div>}>
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
                  <Route path="/philosophy" element={<PhilosophyBoard />} />
                  <Route path="/philosophy/write" element={<PhilosophyWrite />} />
                  <Route path="/philosophy/:id" element={<PhilosophyDetail />} />
                  <Route path="/philosophy/edit/:id" element={<PhilosophyEdit />} />
                  <Route path="/alerts" element={<Alerts />} />
                  <Route path="/notification-board" element={<NotificationBoard />} />
                  <Route path="/marketplace" element={<Marketplace />} />
                  <Route path="/marketplace/write" element={<MarketplaceWrite />} />
                  <Route path="/marketplace/:id" element={<MarketplaceDetail />} />
                  <Route path="/marketplace/edit/:id" element={<MarketplaceEdit />} />
                  <Route path="/reports" element={<ReportManagement />} />
                  <Route path="/admin" element={<AdminPanel />} />
                  <Route path="/login" element={<Login />} />
                  <Route path="/signup" element={<Signup />} />
                  <Route path="/profile" element={<Profile />} />
                </Route>
              </Routes>
            </Suspense>
          </Router>
        </NotificationsProvider>
      </AuthProvider>
    </ErrorBoundary>
  );
}
