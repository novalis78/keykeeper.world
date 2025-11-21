'use client';

import { useState, useEffect } from 'react';
import { 
  ArrowRightIcon, 
  LockClosedIcon, 
  CheckIcon, 
  AtSymbolIcon,
  ExclamationCircleIcon,
  XMarkIcon,
  EyeIcon,
  EyeSlashIcon
} from '@heroicons/react/24/outline';
import { motion } from 'framer-motion';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

export default function SignupPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [name, setName] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [agreedToTerms, setAgreedToTerms] = useState(false);
  
  // Password strength validation
  const [passwordStrength, setPasswordStrength] = useState({
    score: 0,
    feedback: []
  });

  // Check password strength
  useEffect(() => {
    if (password.length === 0) {
      setPasswordStrength({ score: 0, feedback: [] });
      return;
    }

    const feedback = [];
    let score = 0;

    // Length check
    if (password.length >= 8) score += 1;
    else feedback.push('At least 8 characters');

    // Complexity checks
    if (/[a-z]/.test(password)) score += 1;
    else feedback.push('Lowercase letter');

    if (/[A-Z]/.test(password)) score += 1;
    else feedback.push('Uppercase letter');

    if (/[0-9]/.test(password)) score += 1;
    else feedback.push('Number');

    if (/[^a-zA-Z0-9]/.test(password)) score += 1;
    else feedback.push('Special character');

    setPasswordStrength({ score, feedback });
  }, [password]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!email || !password || !confirmPassword || !agreedToTerms) {
      setError('Please fill in all required fields and agree to the terms.');
      return;
    }

    if (password !== confirmPassword) {
      setError('Passwords do not match.');
      return;
    }

    if (passwordStrength.score < 3) {
      setError('Please choose a stronger password.');
      return;
    }
    
    setLoading(true);
    setError(null);
    
    try {
      const response = await fetch('/api/auth/register', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email,
          password,
          name: name || null
        }),
      });
      
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error || 'Registration failed');
      }
      
      console.log('Registration successful:', data);
      
      // Store token if provided (auto-login)
      if (data.token) {
        localStorage.setItem('auth_token', data.token);
      }
      
      // Redirect to dashboard
      router.push('/dashboard');
    } catch (error) {
      console.error('Registration error:', error);
      setError(error.message || 'Something went wrong. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const getPasswordStrengthColor = () => {
    if (passwordStrength.score <= 2) return 'bg-red-500';
    if (passwordStrength.score <= 3) return 'bg-yellow-500';
    return 'bg-green-500';
  };

  const getPasswordStrengthText = () => {
    if (passwordStrength.score <= 2) return 'Weak';
    if (passwordStrength.score <= 3) return 'Fair';
    return 'Strong';
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-900 to-gray-800 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      {/* Logo and brand */}
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <Link href="/" className="flex justify-center">
          <span className="sr-only">KeyKeeper</span>
          <div className="h-20 w-20 rounded-full bg-gradient-to-r from-primary-600 to-primary-500 flex items-center justify-center shadow-lg shadow-primary-500/20 hover:shadow-primary-500/40 transition-all duration-300">
            <LockClosedIcon className="h-10 w-10 text-white" />
          </div>
        </Link>
        <h1 className="mt-6 text-center text-5xl font-extrabold text-white">
          KeyKeeper<span className="text-primary-400">.world</span>
        </h1>
        <p className="mt-2 text-center text-lg text-gray-300">
          Secure email made simple
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-xl">
        <div className="bg-white dark:bg-gray-800 py-10 px-8 shadow-2xl sm:rounded-2xl border border-gray-100 dark:border-gray-700 backdrop-blur-lg bg-opacity-95 dark:bg-opacity-90">
          <form onSubmit={handleSubmit}>
            <h2 className="text-3xl font-bold text-center text-gray-900 dark:text-white mb-8">
              Create Your Account
            </h2>
            
            {error && (
              <div className="mb-6 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg flex items-start">
                <ExclamationCircleIcon className="h-5 w-5 text-red-500 dark:text-red-400 flex-shrink-0 mt-0.5" />
                <div className="ml-3">
                  <p className="text-sm text-red-700 dark:text-red-300">{error}</p>
                </div>
                <button 
                  type="button" 
                  className="ml-auto flex-shrink-0 text-red-500 dark:text-red-400 hover:text-red-600 dark:hover:text-red-300"
                  onClick={() => setError(null)}
                >
                  <XMarkIcon className="h-5 w-5" />
                </button>
              </div>
            )}
            
            <div className="space-y-6">
              {/* Name field */}
              <div>
                <label htmlFor="name" className="block text-lg font-medium text-gray-700 dark:text-gray-200 mb-2">
                  Full Name (Optional)
                </label>
                <input
                  type="text"
                  id="name"
                  name="name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="block w-full rounded-lg border-0 py-4 text-lg text-gray-900 dark:text-white shadow-sm ring-1 ring-inset ring-gray-300 dark:ring-gray-600 placeholder:text-gray-400 dark:placeholder:text-gray-500 focus:ring-2 focus:ring-inset focus:ring-primary-500 dark:focus:ring-primary-400 transition-all duration-200 bg-white dark:bg-gray-800 dark:bg-opacity-80 px-4"
                  placeholder="John Doe"
                />
              </div>

              {/* Email field */}
              <div>
                <label htmlFor="email" className="block text-lg font-medium text-gray-700 dark:text-gray-200 mb-2">
                  Email Address
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <AtSymbolIcon className="h-5 w-5 text-gray-400" />
                  </div>
                  <input
                    type="email"
                    id="email"
                    name="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    className="block w-full rounded-lg border-0 py-4 pl-10 pr-4 text-lg text-gray-900 dark:text-white shadow-sm ring-1 ring-inset ring-gray-300 dark:ring-gray-600 placeholder:text-gray-400 dark:placeholder:text-gray-500 focus:ring-2 focus:ring-inset focus:ring-primary-500 dark:focus:ring-primary-400 transition-all duration-200 bg-white dark:bg-gray-800 dark:bg-opacity-80"
                    placeholder="you@example.com"
                    autoComplete="email"
                  />
                </div>
              </div>

              {/* Password field */}
              <div>
                <label htmlFor="password" className="block text-lg font-medium text-gray-700 dark:text-gray-200 mb-2">
                  Password
                </label>
                <div className="relative">
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
                    type={showPassword ? 'text' : 'password'}
                    id="password"
                    name="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    className="block w-full rounded-lg border-0 py-4 pr-10 text-lg text-gray-900 dark:text-white shadow-sm ring-1 ring-inset ring-gray-300 dark:ring-gray-600 placeholder:text-gray-400 dark:placeholder:text-gray-500 focus:ring-2 focus:ring-inset focus:ring-primary-500 dark:focus:ring-primary-400 transition-all duration-200 bg-white dark:bg-gray-800 dark:bg-opacity-80 px-4"
                    placeholder="Create a strong password"
                    autoComplete="new-password"
                  />
                </div>
                
                {/* Password strength indicator */}
                {password && (
                  <div className="mt-2">
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-sm text-gray-600 dark:text-gray-400">
                        Password strength: {getPasswordStrengthText()}
                      </span>
                      <span className="text-sm text-gray-600 dark:text-gray-400">
                        {passwordStrength.score}/5
                      </span>
                    </div>
                    <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                      <div 
                        className={`h-2 rounded-full transition-all duration-300 ${getPasswordStrengthColor()}`}
                        style={{ width: `${(passwordStrength.score / 5) * 100}%` }}
                      />
                    </div>
                    {passwordStrength.feedback.length > 0 && (
                      <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                        Add: {passwordStrength.feedback.join(', ')}
                      </p>
                    )}
                  </div>
                )}
              </div>

              {/* Confirm password field */}
              <div>
                <label htmlFor="confirmPassword" className="block text-lg font-medium text-gray-700 dark:text-gray-200 mb-2">
                  Confirm Password
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 right-0 pr-3 flex items-center">
                    <button
                      type="button"
                      className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    >
                      {showConfirmPassword ? (
                        <EyeSlashIcon className="h-5 w-5" />
                      ) : (
                        <EyeIcon className="h-5 w-5" />
                      )}
                    </button>
                  </div>
                  <input
                    type={showConfirmPassword ? 'text' : 'password'}
                    id="confirmPassword"
                    name="confirmPassword"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    required
                    className="block w-full rounded-lg border-0 py-4 pr-10 text-lg text-gray-900 dark:text-white shadow-sm ring-1 ring-inset ring-gray-300 dark:ring-gray-600 placeholder:text-gray-400 dark:placeholder:text-gray-500 focus:ring-2 focus:ring-inset focus:ring-primary-500 dark:focus:ring-primary-400 transition-all duration-200 bg-white dark:bg-gray-800 dark:bg-opacity-80 px-4"
                    placeholder="Confirm your password"
                    autoComplete="new-password"
                  />
                </div>
                {confirmPassword && password && confirmPassword !== password && (
                  <p className="mt-1 text-sm text-red-600 dark:text-red-400">
                    Passwords do not match
                  </p>
                )}
              </div>
              
              {/* Terms checkbox */}
              <div className="flex items-center pt-3">
                <input
                  id="terms"
                  name="terms"
                  type="checkbox"
                  checked={agreedToTerms}
                  onChange={(e) => setAgreedToTerms(e.target.checked)}
                  required
                  className="h-5 w-5 text-primary-500 focus:ring-primary-400 focus:ring-offset-2 focus:ring-offset-white dark:focus:ring-offset-gray-800 border-gray-300 dark:border-gray-600 rounded transition-all duration-200"
                />
                <div className="ml-3 text-sm">
                  <label htmlFor="terms" className="font-medium text-gray-700 dark:text-gray-200">
                    I agree to the <span className="text-primary-500 hover:text-primary-600 dark:text-primary-400 dark:hover:text-primary-300 cursor-pointer underline underline-offset-2">Terms of Service</span> and <span className="text-primary-500 hover:text-primary-600 dark:text-primary-400 dark:hover:text-primary-300 cursor-pointer underline underline-offset-2">Privacy Policy</span>
                  </label>
                </div>
              </div>
              
              {/* Security note */}
              <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg border border-blue-100 dark:border-blue-800">
                <div className="flex items-start">
                  <LockClosedIcon className="h-5 w-5 text-blue-600 dark:text-blue-400 mt-0.5 flex-shrink-0" />
                  <div className="ml-3">
                    <h4 className="text-sm font-medium text-blue-900 dark:text-blue-100">
                      End-to-End Encryption Included
                    </h4>
                    <p className="text-sm text-blue-700 dark:text-blue-300 mt-1">
                      Your emails will be encrypted automatically. We generate and manage PGP keys for you, so you get enterprise-grade security without the complexity.
                    </p>
                  </div>
                </div>
              </div>
              
              {/* Sign up button */}
              <div className="mt-8">
                <motion.button
                  type="submit"
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  className="w-full flex items-center justify-center px-6 py-4 border border-transparent text-base font-medium rounded-lg shadow-lg text-white bg-gradient-to-r from-primary-600 to-primary-500 hover:from-primary-700 hover:to-primary-600 dark:from-primary-600 dark:to-primary-500 dark:hover:from-primary-500 dark:hover:to-primary-400 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:from-primary-600 disabled:hover:to-primary-500"
                  disabled={loading || !email || !password || !confirmPassword || password !== confirmPassword || passwordStrength.score < 3 || !agreedToTerms}
                >
                  {loading ? (
                    <>
                      <svg className="animate-spin -ml-1 mr-2 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      Creating Account...
                    </>
                  ) : (
                    <>
                      Create Your Account
                      <ArrowRightIcon className="ml-2 h-5 w-5" />
                    </>
                  )}
                </motion.button>
              </div>
              
              {/* Login link */}
              <div className="mt-6 text-center text-sm">
                <span className="text-gray-600 dark:text-gray-400">
                  Already have an account?{' '}
                </span>
                <Link
                  href="/login"
                  className="font-medium text-primary-600 hover:text-primary-500 dark:text-primary-400 dark:hover:text-primary-300"
                >
                  Sign in
                </Link>
              </div>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}