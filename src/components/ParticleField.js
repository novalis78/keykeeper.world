'use client';

import { useEffect, useState } from 'react';
import dynamic from 'next/dynamic';

// Dynamically import the Three.js scene with no SSR
const ThreeScene = dynamic(() => import('./ThreeScene'), {
  ssr: false,
  loading: () => <div className="fixed inset-0 w-full h-full bg-[#050505]" />
});

export default function ParticleField() {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return <div className="fixed inset-0 w-full h-full bg-[#050505]" style={{ zIndex: 0 }} />;
  }

  return <ThreeScene />;
}
