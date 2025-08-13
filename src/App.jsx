import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Header from './components/Header';
import Banner from './components/Banner';
import PopularPosts from './components/PopularPosts';
import FeatureGrid from './components/FeatureGrid';
import BottomNavigation from './components/BottomNavigation';
import Board from './components/Board';
import Gallery from './components/Gallery';
import GalleryDetail from './components/GalleryDetail';
import Chat from './components/Chat';
import Community from './components/Community';
import ParkMeetings from './components/ParkMeetings';
import AlumniSearch from './components/AlumniSearch';
import AlumniResults from './components/AlumniResults';
import HealthBoard from './components/HealthBoard';
import Playground from './components/Playground';
import JanggiGame from './components/games/JanggiGame';
import BadukGame from './components/games/BadukGame';
import TetrisGame from './components/games/TetrisGame';
import YutnoriGame from './components/games/YutnoriGame';
import GostopGame from './components/games/GostopGame';

function HomePage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-amber-50 via-orange-50 to-amber-100">
      <Header />
      <main className="pb-20">
        <Banner />
        <PopularPosts />
        <FeatureGrid />
      </main>
      <BottomNavigation />
    </div>
  );
}

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<HomePage />} />
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
      </Routes>
    </Router>
  );
}

export default App;
