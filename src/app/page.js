'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import NavBar from '../components/NavBar';
import HeroSection from '../components/HeroSection';
import FeaturesSection from '../components/FeaturesSection';
import SecuritySection from '../components/SecuritySection';
import PricingSection from '../components/PricingSection';
import Footer from '../components/Footer';

export default function Home() {
  return (
    <main className="overflow-x-hidden">
      <NavBar />
      <HeroSection />
      <FeaturesSection />
      <SecuritySection />
      <PricingSection />
      <Footer />
    </main>
  );
}