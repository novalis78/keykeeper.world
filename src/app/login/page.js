'use client';

import { useState } from 'react';
import { LockClosedIcon, KeyIcon, EnvelopeIcon } from '@heroicons/react/24/outline';
import { motion } from 'framer-motion';
import Link from 'next/link';
import pgpUtils from '@/lib/auth/pgp';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [step, setStep] = useState(1);
  const [challenge, setChallenge] = useState('');
  const [privateKey, setPrivateKey] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  
  const handleSubmitEmail = async (e) => {
    e.preventDefault();
    
    if (!email) return;
    
    setLoading(true);
    setError('');
    
    try {
      // In production, we would fetch a challenge from the server
      // based on the user's email address
      const newChallenge = pgpUtils.generateChallenge();
      setChallenge(newChallenge);
      setStep(2);
    } catch (error) {
      console.error('Error generating challenge:', error);
      setError('Failed to generate authentication challenge. Please try again.');
    } finally {
      setLoading(false);
    }
  };
  
  const handleKeyFileUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    
    const reader = new FileReader();
    reader.onload = (event) => {
      setPrivateKey(event.target.result);
    };
    reader.readAsText(file);
  };
  
  const handleSignChallenge = async (e) => {
    e.preventDefault();
    
    if (!privateKey || !challenge) return;
    
    setLoading(true);
    setError('');
    
    try {
      // Sign the challenge using the private key
      const signature = await pgpUtils.signChallenge(challenge, privateKey);
      
      // In production, we would send the signature, email, and challenge
      // to the server for verification against the stored public key
      
      // For now, we'll simulate a successful login
      setTimeout(() => {
        // Redirect to dashboard
        window.location.href = '/dashboard';
      }, 1000);
    } catch (error) {
      console.error('Error signing challenge:', error);
      setError('Failed to sign challenge. Please check your private key and try again.');
      setLoading(false);
    }
  };
  
  const handleHardwareAuth = async () => {
    setLoading(true);
    setError('');
    
    try {
      // Check if hardware security key is available
      const isAvailable = await pgpUtils.isSecurityKeyAvailable();
      
      if (!isAvailable) {
        setError('No hardware security key detected. Please connect your device and try again.');
        setLoading(false);
        return;
      }
      
      // In production, we would interface with the WebAuthn API
      // to authenticate using the hardware security key
      
      // For now, we'll simulate a successful login
      setTimeout(() => {
        // Redirect to dashboard
        window.location.href = '/dashboard';
      }, 1000);
    } catch (error) {
      console.error('Error with hardware authentication:', error);
      setError('Hardware authentication failed. Please try again.');
      setLoading(false);
    }
  };
  
  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <Link href="/" className="flex justify-center">
          <span className="sr-only">KeyKeeper</span>
          <div className="h-14 w-14 rounded-full bg-primary-600 flex items-center justify-center">
            <LockClosedIcon className="h-8 w-8 text-white" />
          </div>
        </Link>
        <h1 className="mt-6 text-center text-3xl font-extrabold text-gray-900 dark:text-white">
          KeyKeeper.world
        </h1>
        <h2 className="mt-2 text-center text-xl text-gray-600 dark:text-gray-400">
          Sign in with your PGP key
        </h2>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white dark:bg-gray-800 py-8 px-4 shadow sm:rounded-lg sm:px-10">
          {error && (
            <div className="mb-4 p-3 bg-red-100 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded text-red-700 dark:text-red-300 text-sm">
              {error}
            </div>
          )}
          
          {step === 1 ? (
            <form onSubmit={handleSubmitEmail}>
              <div>
                <label htmlFor="email" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                  Email Address
                </label>
                <div className="mt-1">
                  <input
                    id="email"
                    name="email"
                    type="email"
                    autoComplete="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="appearance-none block w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-primary-500 focus:border-primary-500 dark:bg-gray-700 dark:text-white sm:text-sm"
                    placeholder="you@example.com"
                  />
                </div>
              </div>

              <div className="mt-6">
                <motion.button
                  type="submit"
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  disabled={loading || !email}
                  className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-primary-600 hover:bg-primary-700 dark:bg-primary-700 dark:hover:bg-primary-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 disabled:opacity-50"
                >
                  {loading ? (
                    <>
                      <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      Processing...
                    </>
                  ) : (
                    'Continue with Email'
                  )}
                </motion.button>
              </div>
            </form>
          ) : (
            <div>
              <div className="bg-gray-50 dark:bg-gray-700 p-4 rounded-lg mb-6">
                <div className="flex items-start">
                  <div className="flex-shrink-0">
                    <EnvelopeIcon className="h-5 w-5 text-primary-600 dark:text-primary-400" />
                  </div>
                  <div className="ml-3">
                    <h3 className="text-sm font-medium text-gray-900 dark:text-gray-100">Authentication Challenge</h3>
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                      Sign the challenge below with your private key to authenticate.
                    </p>
                    <div className="mt-2 bg-gray-100 dark:bg-gray-600 p-2 rounded font-mono text-xs overflow-x-auto">
                      {challenge}
                    </div>
                  </div>
                </div>
              </div>
              
              <form onSubmit={handleSignChallenge} className="space-y-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                    Choose Authentication Method
                  </label>
                  
                  <div className="mt-4 space-y-4">
                    <div className="relative bg-white dark:bg-gray-800 rounded-lg border border-gray-300 dark:border-gray-600 p-4 hover:border-primary-500 dark:hover:border-primary-500 cursor-pointer">
                      <div className="flex items-start">
                        <div className="flex items-center h-5">
                          <input
                            id="private-key-file"
                            name="auth-method"
                            type="radio"
                            defaultChecked
                            className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 dark:border-gray-700"
                          />
                        </div>
                        <div className="ml-3">
                          <label htmlFor="private-key-file" className="font-medium text-gray-700 dark:text-gray-300">
                            Upload Private Key File
                          </label>
                          <p className="text-gray-500 dark:text-gray-400 text-sm">
                            Select the PGP private key file you downloaded during signup.
                          </p>
                          
                          <div className="mt-3">
                            <label htmlFor="key-file" className="relative cursor-pointer bg-white dark:bg-gray-700 rounded-md font-medium text-primary-600 dark:text-primary-400 hover:text-primary-500 dark:hover:text-primary-300 focus-within:outline-none">
                              <span>Upload key file</span>
                              <input
                                id="key-file"
                                name="key-file"
                                type="file"
                                className="sr-only"
                                accept=".asc,.txt,.key,.gpg"
                                onChange={handleKeyFileUpload}
                              />
                            </label>
                            {privateKey && (
                              <span className="ml-2 text-xs text-green-600 dark:text-green-400">
                                ✓ Key file loaded
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                    
                    <div className="relative bg-white dark:bg-gray-800 rounded-lg border border-gray-300 dark:border-gray-600 p-4 hover:border-primary-500 dark:hover:border-primary-500 cursor-pointer">
                      <div className="flex items-start">
                        <div className="flex items-center h-5">
                          <input
                            id="password-manager"
                            name="auth-method"
                            type="radio"
                            className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 dark:border-gray-700"
                          />
                        </div>
                        <div className="ml-3">
                          <label htmlFor="password-manager" className="font-medium text-gray-700 dark:text-gray-300">
                            Use Password Manager
                          </label>
                          <p className="text-gray-500 dark:text-gray-400 text-sm">
                            Copy your private key from your password manager and paste it below.
                          </p>
                          
                          <div className="mt-3">
                            <textarea
                              id="paste-key"
                              name="paste-key"
                              rows={3}
                              className="shadow-sm focus:ring-primary-500 focus:border-primary-500 block w-full sm:text-sm border-gray-300 dark:border-gray-600 rounded-md dark:bg-gray-700 dark:text-white"
                              placeholder="Paste your PGP private key here..."
                              onChange={(e) => setPrivateKey(e.target.value)}
                            />
                          </div>
                        </div>
                      </div>
                    </div>
                    
                    <div className="relative bg-white dark:bg-gray-800 rounded-lg border border-gray-300 dark:border-gray-600 p-4 hover:border-primary-500 dark:hover:border-primary-500 cursor-pointer">
                      <div className="flex items-start">
                        <div className="flex items-center h-5">
                          <input
                            id="hardware-key"
                            name="auth-method"
                            type="radio"
                            className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 dark:border-gray-700"
                          />
                        </div>
                        <div className="ml-3 flex-1">
                          <label htmlFor="hardware-key" className="font-medium text-gray-700 dark:text-gray-300">
                            Use Hardware Security Key
                          </label>
                          <p className="text-gray-500 dark:text-gray-400 text-sm">
                            Authenticate with your YubiKey or other hardware security device.
                          </p>
                          
                          <div className="mt-3">
                            <button
                              type="button"
                              onClick={handleHardwareAuth}
                              className="inline-flex items-center px-4 py-2 border border-gray-300 dark:border-gray-600 shadow-sm text-sm font-medium rounded-md text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-700 hover:bg-gray-50 dark:hover:bg-gray-600"
                            >
                              <KeyIcon className="mr-2 h-4 w-4" />
                              Connect Hardware Key
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
                
                <div>
                  <motion.button
                    type="submit"
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    disabled={loading || !privateKey}
                    className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-primary-600 hover:bg-primary-700 dark:bg-primary-700 dark:hover:bg-primary-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 disabled:opacity-50"
                  >
                    {loading ? (
                      <>
                        <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        </svg>
                        Authenticating...
                      </>
                    ) : (
                      'Sign In'
                    )}
                  </motion.button>
                </div>
              </form>
            </div>
          )}
          
          <div className="mt-6">
            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-gray-300 dark:border-gray-600"></div>
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="px-2 bg-white dark:bg-gray-800 text-gray-500 dark:text-gray-400">
                  Don't have an account?
                </span>
              </div>
            </div>

            <div className="mt-6">
              <Link
                href="/signup"
                className="w-full inline-flex justify-center py-2 px-4 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-700 hover:bg-gray-50 dark:hover:bg-gray-600"
              >
                Create an account
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}