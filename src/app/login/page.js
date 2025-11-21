'use client';

import { useState } from 'react';
import { 
  LockClosedIcon, 
  EnvelopeIcon, 
  EyeIcon, 
  EyeSlashIcon,
  ExclamationCircleIcon,
  XMarkIcon
} from '@heroicons/react/24/outline';
import { motion } from 'framer-motion';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [totpCode, setTotpCode] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [requires2FA, setRequires2FA] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!email || !password) {
      setError('Please enter your email and password.');
      return;
    }
    
    setLoading(true);
    setError('');
    
    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email,
          password,
          totpCode: requires2FA ? totpCode : undefined
        }),
      });
      
      const data = await response.json();
      
      if (!response.ok) {
        if (data.requires2FA) {
          setRequires2FA(true);
          return;
        }
        throw new Error(data.error || 'Login failed');
      }
      
      console.log('Login successful:', data);
      
      // Store authentication token
      if (data.token) {
        localStorage.setItem('auth_token', data.token);
        console.log('JWT token stored in localStorage');
      }
      
      // Store user info for mail credential management
      if (data.user?.email) {
        localStorage.setItem('user_email', data.user.email);
        localStorage.setItem('user_id', data.user.id);
        if (data.user.fingerprint) {
          localStorage.setItem('user_fingerprint', data.user.fingerprint);
        }
        if (data.user.keyId) {
          localStorage.setItem('user_key_id', data.user.keyId);
        }
      }
      
      // Store mail credentials if provided
      if (data.mailPassword && data.user?.email) {
        try {
          const accountId = `account_${data.user.email.replace(/[^a-zA-Z0-9]/g, '_')}`;
          const mailServer = process.env.NEXT_PUBLIC_MAIL_HOST || 'mail.keykeeper.world';
          
          const credentials = {
            email: data.user.email,
            password: data.mailPassword,
            imapServer: mailServer,
            imapPort: parseInt(process.env.NEXT_PUBLIC_MAIL_IMAP_PORT || '993'),
            imapSecure: process.env.NEXT_PUBLIC_MAIL_IMAP_SECURE !== 'false',
            smtpServer: mailServer,
            smtpPort: parseInt(process.env.NEXT_PUBLIC_MAIL_SMTP_PORT || '587'),
            smtpSecure: process.env.NEXT_PUBLIC_MAIL_SMTP_SECURE === 'true',
            timestamp: Date.now()
          };
          
          // Store credentials directly for now (can be enhanced later)
          localStorage.setItem(`kk_mail_${accountId}_direct`, JSON.stringify(credentials));
          console.log('Mail credentials stored locally');
        } catch (credError) {
          console.error('Failed to store mail credentials:', credError);
          // Non-fatal - continue with login
        }
      }
      
      // Redirect to dashboard
      router.push('/dashboard');
    } catch (error) {
      console.error('Login error:', error);
      setError(error.message || 'Login failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };
  
  const handleBackToPassword = () => {
    setRequires2FA(false);
    setTotpCode('');
    setError('');
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
        <p className="mt-2 text-center text-xl text-gray-600 dark:text-gray-400">
          {requires2FA ? 'Enter your 2FA code' : 'Sign in to your account'}
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white dark:bg-gray-800 py-8 px-4 shadow-lg sm:rounded-lg sm:px-10">
          {error && (
            <div className="mb-4 p-3 bg-red-100 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded text-red-700 dark:text-red-300 text-sm flex items-start">
              <ExclamationCircleIcon className="h-5 w-5 mr-2 flex-shrink-0 mt-0.5" />
              <div className="flex-1">{error}</div>
              <button 
                type="button" 
                className="ml-2 flex-shrink-0 text-red-500 dark:text-red-400 hover:text-red-600 dark:hover:text-red-300"
                onClick={() => setError('')}
              >
                <XMarkIcon className="h-4 w-4" />
              </button>
            </div>
          )}
          
          <form onSubmit={handleSubmit} className="space-y-6">
            {!requires2FA ? (
              <>
                {/* Email field */}
                <div>
                  <label htmlFor="email" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                    Email Address
                  </label>
                  <div className="mt-1 relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <EnvelopeIcon className="h-5 w-5 text-gray-400" />
                    </div>
                    <input
                      id="email"
                      name="email"
                      type="email"
                      autoComplete="email"
                      required
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="block w-full pl-10 border-0 py-3 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 ring-1 ring-inset ring-gray-300 dark:ring-gray-600 focus:ring-2 focus:ring-inset focus:ring-primary-500 dark:focus:ring-primary-400 sm:text-sm sm:leading-6 dark:bg-gray-800 rounded-lg"
                      placeholder="you@example.com"
                    />
                  </div>
                </div>

                {/* Password field */}
                <div>
                  <label htmlFor="password" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                    Password
                  </label>
                  <div className="mt-1 relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <LockClosedIcon className="h-5 w-5 text-gray-400" />
                    </div>
                    <div className="absolute inset-y-0 right-0 pr-3 flex items-center">
                      <button
                        type="button"
                        className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                        onClick={() => setShowPassword(!showPassword)}
                      >
                        {showPassword ? (
                          <EyeSlashIcon className="h-5 w-5" />
                        ) : (
                          <EyeIcon className="h-5 w-5" />
                        )}
                      </button>
                    </div>
                    <input
                      id="password"
                      name="password"
                      type={showPassword ? 'text' : 'password'}
                      autoComplete="current-password"
                      required
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="block w-full pl-10 pr-10 border-0 py-3 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 ring-1 ring-inset ring-gray-300 dark:ring-gray-600 focus:ring-2 focus:ring-inset focus:ring-primary-500 dark:focus:ring-primary-400 sm:text-sm sm:leading-6 dark:bg-gray-800 rounded-lg"
                      placeholder="Enter your password"
                    />
                  </div>
                </div>

                {/* Remember me checkbox */}
                <div className="flex items-center">
                  <input
                    id="remember-me"
                    name="remember-me"
                    type="checkbox"
                    checked={rememberMe}
                    onChange={(e) => setRememberMe(e.target.checked)}
                    className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 dark:border-gray-600 rounded"
                  />
                  <label htmlFor="remember-me" className="ml-2 block text-sm text-gray-700 dark:text-gray-300">
                    Remember me
                  </label>
                </div>
              </>
            ) : (
              /* 2FA Code Input */
              <div>
                <label htmlFor="totp-code" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                  Two-Factor Authentication Code
                </label>
                <div className="mt-1">
                  <input
                    id="totp-code"
                    name="totp-code"
                    type="text"
                    inputMode="numeric"
                    pattern="[0-9]*"
                    maxLength={6}
                    autoComplete="one-time-code"
                    required
                    value={totpCode}
                    onChange={(e) => setTotpCode(e.target.value.replace(/\D/g, ''))}
                    className="block w-full text-center text-2xl tracking-widest border-0 py-3 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 ring-1 ring-inset ring-gray-300 dark:ring-gray-600 focus:ring-2 focus:ring-inset focus:ring-primary-500 dark:focus:ring-primary-400 sm:text-sm sm:leading-6 dark:bg-gray-800 rounded-lg"
                    placeholder="000000"
                  />
                </div>
                <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">
                  Enter the 6-digit code from your authenticator app.
                </p>
              </div>
            )}

            <div>
              <motion.button
                type="submit"
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                disabled={loading || (!requires2FA && (!email || !password)) || (requires2FA && !totpCode)}
                className="w-full flex justify-center py-3 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-primary-600 hover:bg-primary-700 dark:bg-primary-700 dark:hover:bg-primary-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? (
                  <>
                    <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    {requires2FA ? 'Verifying...' : 'Signing in...'}
                  </>
                ) : (
                  requires2FA ? 'Verify Code' : 'Sign In'
                )}
              </motion.button>
            </div>

            {/* Back button for 2FA */}
            {requires2FA && (
              <div className="text-center">
                <button
                  type="button"
                  onClick={handleBackToPassword}
                  className="text-sm text-primary-600 hover:text-primary-500 dark:text-primary-400 dark:hover:text-primary-300"
                >
                  ← Back to password
                </button>
              </div>
            )}
          </form>

          {/* Security note */}
          <div className="mt-6 bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg border border-blue-100 dark:border-blue-800">
            <div className="flex items-start">
              <LockClosedIcon className="h-5 w-5 text-blue-600 dark:text-blue-400 mt-0.5 flex-shrink-0" />
              <div className="ml-3">
                <h4 className="text-sm font-medium text-blue-900 dark:text-blue-100">
                  Secure & Encrypted
                </h4>
                <p className="text-sm text-blue-700 dark:text-blue-300 mt-1">
                  Your emails are protected with end-to-end encryption. We manage the security so you can focus on what matters.
                </p>
              </div>
            </div>
          </div>
          
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

            <div className="mt-4 flex justify-between items-center">
              <Link
                href="/forgot-password"
                className="text-sm text-primary-600 hover:text-primary-500 dark:text-primary-400 dark:hover:text-primary-300"
              >
                Forgot your password?
              </Link>
              
              <Link
                href="/signup"
                className="text-sm text-primary-600 hover:text-primary-500 dark:text-primary-400 dark:hover:text-primary-300"
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