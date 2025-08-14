import { useState } from "react";
import Header from "@/components/Header";
import Banner from "@/components/Banner";
import PopularPosts from "@/components/PopularPosts";
import MenuGrid from "@/components/MenuGrid";
import Navigation from "@/components/Navigation";
import FeaturePanel from "@/components/FeaturePanel";

export default function MainPage() {
  const [activeTab, setActiveTab] = useState("home");

  return (
    <div className="flex min-h-screen bg-gray-100">
      {/* Left: 앱 UI */}
      <div className="w-96 bg-white shadow-lg">
        <Header />
        <Banner />
        <PopularPosts />
        <MenuGrid />
        <Navigation activeTab={activeTab} setActiveTab={setActiveTab} />
      </div>

      {/* Right: 설명 패널(발표/개발용) */}
      <FeaturePanel />
    </div>
  );
}
