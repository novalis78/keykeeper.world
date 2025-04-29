'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import Link from 'next/link';
import { LockClosedIcon, ArrowLeftIcon } from '@heroicons/react/24/outline';

export default function Signup() {
  const [formData, setFormData] = useState({
    email: '',
    name: '',
  });
  const [step, setStep] = useState(1); // 1: form, 2: key generation, 3: success
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);
    
    try {
      // Validate email format
      if (!formData.email.includes('@')) {
        throw new Error('Please enter a valid email address');
      }
      
      // Move to key generation step
      setStep(2);
      
      // In a real implementation, we would:
      // 1. Generate PGP keys (client-side or ask the user to provide one)
      // 2. Submit registration data including the public key
      // 3. Show success and next steps
      
      // For demo purposes, simulate key generation
      setTimeout(() => {
        setStep(3); // Move to success step
        setIsLoading(false);
      }, 2000);
      
    } catch (error) {
      setError(error.message || 'An error occurred during registration');
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-b from-primary-50 to-primary-100 dark:from-primary-950 dark:to-primary-900 p-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="bg-white dark:bg-primary-800 rounded-xl shadow-xl overflow-hidden max-w-md w-full"
      >
        <div className="p-8">
          <div className="text-center mb-8">
            <Link href="/" className="inline-flex items-center text-primary-600 hover:text-primary-700 mb-6">
              <ArrowLeftIcon className="h-4 w-4 mr-1" />
              Back to home
            </Link>
            <div className="flex justify-center mb-4">
              <LockClosedIcon className="h-12 w-12 text-primary-600" />
            </div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
              {step === 1 && 'Create your account'}
              {step === 2 && 'Generating your keys'}
              {step === 3 && 'Account created!'}
            </h1>
            <p className="mt-2 text-gray-600 dark:text-gray-300">
              {step === 1 && 'Secure email with OpenPGP encryption'}
              {step === 2 && 'This may take a moment...'}
              {step === 3 && 'Your secure email is ready to use'}
            </p>
          </div>

          {error && (
            <div className="mb-6 p-4 bg-red-50 dark:bg-red-900/30 text-red-800 dark:text-red-200 rounded-md text-sm">
              {error}
            </div>
          )}

          {step === 1 && (
            <form onSubmit={handleSubmit} className="space-y-6">
              <div>
                <label htmlFor="name" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Name (optional)
                </label>
                <input
                  id="name"
                  name="name"
                  type="text"
                  autoComplete="name"
                  value={formData.name}
                  onChange={handleChange}
                  className="appearance-none block w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-primary-500 focus:border-primary-500 dark:bg-primary-700/50 dark:text-white"
                  placeholder="Your name"
                />
              </div>
              
              <div>
                <label htmlFor="email" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Email address
                </label>
                <input
                  id="email"
                  name="email"
                  type="email"
                  autoComplete="email"
                  required
                  value={formData.email}
                  onChange={handleChange}
                  className="appearance-none block w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-primary-500 focus:border-primary-500 dark:bg-primary-700/50 dark:text-white"
                  placeholder="you@example.com"
                />
              </div>

              <div className="text-sm text-gray-500 dark:text-gray-400">
                <p>By creating an account, you agree to our:</p>
                <ul className="list-disc pl-5 mt-2 space-y-1">
                  <li>We'll generate a secure PGP key pair for you</li>
                  <li>Your private key never leaves your device</li>
                  <li>Only your public key is shared with our server</li>
                </ul>
              </div>

              <div>
                <button
                  type="submit"
                  disabled={isLoading}
                  className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  Create Account
                </button>
              </div>
            </form>
          )}

          {step === 2 && (
            <div className="text-center py-10">
              <div className="flex justify-center mb-6">
                <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary-600"></div>
              </div>
              <p className="text-gray-600 dark:text-gray-300">
                Generating your secure PGP keys...
              </p>
              <p className="text-sm text-gray-500 dark:text-gray-400 mt-2">
                This process happens entirely on your device to ensure maximum security.
              </p>
            </div>
          )}

          {step === 3 && (
            <div className="text-center py-6">
              <div className="mb-6 flex justify-center">
                <div className="rounded-full h-16 w-16 bg-green-100 dark:bg-green-800 flex items-center justify-center">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-green-600 dark:text-green-200" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                </div>
              </div>
              
              <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
                Your KeyKeeper account is ready!
              </h3>
              
              <p className="text-gray-600 dark:text-gray-300 mb-6">
                You can now access secure email features and create disposable addresses.
              </p>
              
              <div className="space-y-3">
                <Link
                  href="/dashboard"
                  className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 transition-colors"
                >
                  Go to Dashboard
                </Link>
                
                <Link
                  href="/"
                  className="w-full flex justify-center py-2 px-4 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm text-sm font-medium text-gray-700 dark:text-gray-200 bg-white dark:bg-transparent hover:bg-gray-50 dark:hover:bg-primary-700/30 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 transition-colors"
                >
                  Return to Home
                </Link>
              </div>
            </div>
          )}

          {step === 1 && (
            <div className="mt-6 text-center">
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Already have an account?{' '}
                <Link href="/login" className="font-medium text-primary-600 hover:text-primary-500">
                  Sign in
                </Link>
              </p>
            </div>
          )}
        </div>
      </motion.div>
    </div>
  );
}
