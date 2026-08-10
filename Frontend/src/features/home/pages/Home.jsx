import React from 'react';
import Hero from '../components/Hero';
import StatsBar from '../components/StatsBar';
import HowItWorks from '../components/HowItWorks';
import Features from '../components/Features';
import RoleCards from '../components/RoleCards';
import FAQ from '../components/FAQ';

const Home = () => {
  return (
    <div className="w-full">
      <Hero />
      <StatsBar />
      <HowItWorks />
      <Features />
      <RoleCards />
      <FAQ />
    </div>
  );
};

export default Home;
