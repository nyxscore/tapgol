import React from "react";
import Banner from "./Banner";
import PopularPosts from "./PopularPosts";
import FeatureGrid from "./FeatureGrid";

const HomePage = () => {
  return (
    <main>
      <Banner />
      <PopularPosts />
      <FeatureGrid />
    </main>
  );
};

export default HomePage;
