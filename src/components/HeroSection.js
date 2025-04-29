'use client';

import { motion } from 'framer-motion';
import { LockClosedIcon, EnvelopeIcon, KeyIcon } from '@heroicons/react/24/outline';
import Link from 'next/link';

export default function HeroSection() {
  const container = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: {
        staggerChildren: 0.2,
      },
    },
  };

  const item = {
    hidden: { opacity: 0, y: 30 },
    show: { opacity: 1, y: 0, transition: { duration: 0.8, ease: "easeOut" } },
  };

  const securityFeatures = [
    { icon: <LockClosedIcon className="h-5 w-5" />, text: "End-to-End Encryption" },
    { icon: <EnvelopeIcon className="h-5 w-5" />, text: "Disposable Email Addresses" },
    { icon: <KeyIcon className="h-5 w-5" />, text: "OpenPGP Key Management" },
  ];

  return (
    <div className="relative min-h-screen flex items-center">
      {/* Background elements */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute -top-24 -right-24 w-96 h-96 bg-primary-200 dark:bg-primary-900 rounded-full blur-3xl opacity-50"></div>
        <div className="absolute top-1/3 -left-24 w-72 h-72 bg-primary-300 dark:bg-primary-800 rounded-full blur-3xl opacity-40"></div>
        <div className="absolute bottom-0 right-1/4 w-60 h-60 bg-primary-100 dark:bg-primary-700 rounded-full blur-3xl opacity-30"></div>
        
        {/* Grid pattern */}
        <div className="absolute inset-0 bg-grid-pattern opacity-5"></div>
      </div>

      {/* Hero content */}
      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-32 sm:py-40">
        <motion.div 
          variants={container}
          initial="hidden"
          animate="show"
          className="md:w-2/3"
        >
          <motion.div variants={item}>
            <span className="inline-flex items-center rounded-full bg-primary-100 px-3 py-1 text-sm font-medium text-primary-800 dark:bg-primary-800 dark:text-primary-100">
              <span className="mr-2">✨</span> NEW: Enhanced Privacy Features
            </span>
          </motion.div>
          
          <motion.h1 
            variants={item}
            className="mt-6 text-4xl font-bold tracking-tight text-gray-900 dark:text-white sm:text-5xl md:text-6xl"
          >
            <span className="block">Your keys.</span>
            <span className="block text-primary-600">Your mail.</span>
            <span className="block">Your privacy.</span>
          </motion.h1>
          
          <motion.p 
            variants={item}
            className="mt-6 text-lg sm:text-xl text-gray-600 dark:text-gray-300 max-w-2xl"
          >
            KeyKeeper.world provides truly private email with disposable addresses, 
            OpenPGP encryption, and zero knowledge of your messages.
          </motion.p>
          
          <motion.div
            variants={item}
            className="mt-6 flex flex-wrap gap-4"
          >
            <Link
              href="/signup"
              className="btn-primary text-lg px-6 py-3"
            >
              Get Started
            </Link>
            <Link
              href="#features"
              className="btn-secondary text-lg px-6 py-3"
            >
              Learn More
            </Link>
          </motion.div>
          
          <motion.div
            variants={item}
            className="mt-8 flex items-center gap-x-6"
          >
            {securityFeatures.map((feature, index) => (
              <div key={index} className="flex items-center text-primary-700 dark:text-primary-300">
                <span className="mr-2">{feature.icon}</span>
                <span className="text-sm font-medium">{feature.text}</span>
              </div>
            ))}
          </motion.div>
        </motion.div>
      </div>
    </div>
  );
}