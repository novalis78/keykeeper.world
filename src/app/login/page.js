'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Lock, Mail, Eye, EyeOff, ArrowRight } from 'lucide-react';

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
    <div className="min-h-screen bg-[#050505] flex items-center justify-center px-6 py-12">
      <div className="w-full max-w-md">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          {/* Header */}
          <div className="text-center mb-8">
            <Link href="/" className="inline-block mb-6">
              <div className="flex items-center justify-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-primary-500 to-teal-400 flex items-center justify-center shadow-lg shadow-primary-500/30">
                  <Lock className="w-4 h-4 text-white" />
                </div>
                <span className="text-xl font-semibold text-white">KeyKeeper</span>
              </div>
            </Link>
            <h1 className="text-[44px] font-semibold mb-3 text-white leading-[1.2] tracking-[-0.02em]">
              {requires2FA ? 'Two-factor code' : 'Welcome back'}
            </h1>
            <p className="text-[15px] text-white/50 leading-[1.6]">
              {requires2FA ? 'Enter your 6-digit authentication code' : 'Sign in to your account'}
            </p>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-6 bg-white/[0.03] border border-white/10 rounded-2xl p-8 backdrop-blur-sm">
            {error && (
              <div className="p-4 bg-red-500/10 border border-red-500/20 rounded-xl">
                <p className="text-sm text-red-300">{error}</p>
              </div>
            )}

            {!requires2FA ? (
              <>
                {/* Email field */}
                <div>
                  <label htmlFor="email" className="block text-[13px] font-medium text-white/80 mb-2">
                    Email Address
                  </label>
                  <input
                    id="email"
                    name="email"
                    type="email"
                    autoComplete="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full px-4 py-3 bg-white/[0.03] border border-white/10 rounded-xl text-white text-[15px] placeholder:text-white/30 focus:outline-none focus:border-primary-500/50 focus:ring-2 focus:ring-primary-500/20 transition-all"
                    placeholder="you@keykeeper.world"
                  />
                </div>

                {/* Password field */}
                <div>
                  <label htmlFor="password" className="block text-[13px] font-medium text-white/80 mb-2">
                    Password
                  </label>
                  <div className="relative">
                    <input
                      id="password"
                      name="password"
                      type={showPassword ? 'text' : 'password'}
                      autoComplete="current-password"
                      required
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="w-full px-4 py-3 bg-white/[0.03] border border-white/10 rounded-xl text-white text-[15px] placeholder:text-white/30 focus:outline-none focus:border-primary-500/50 focus:ring-2 focus:ring-primary-500/20 transition-all"
                      placeholder="Enter your password"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-4 top-1/2 -translate-y-1/2 text-white/40 hover:text-white/70 transition-colors"
                    >
                      {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                    </button>
                  </div>
                </div>

                {/* Remember me & Forgot password */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center">
                    <input
                      id="remember-me"
                      name="remember-me"
                      type="checkbox"
                      checked={rememberMe}
                      onChange={(e) => setRememberMe(e.target.checked)}
                      className="w-4 h-4 rounded border-white/20 text-primary-600 focus:ring-primary-500 bg-white/[0.03]"
                    />
                    <label htmlFor="remember-me" className="ml-2 text-[13px] text-white/60">
                      Remember me
                    </label>
                  </div>
                  <Link href="/forgot-password" className="text-[13px] text-primary-400 hover:text-primary-300 transition-colors">
                    Forgot password?
                  </Link>
                </div>
              </>
            ) : (
              /* 2FA Code Input */
              <div>
                <label htmlFor="totp-code" className="block text-[13px] font-medium text-white/80 mb-2">
                  Two-Factor Code
                </label>
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
                  className="w-full px-4 py-3 bg-white/[0.03] border border-white/10 rounded-xl text-white text-[24px] placeholder:text-white/30 focus:outline-none focus:border-primary-500/50 focus:ring-2 focus:ring-primary-500/20 transition-all text-center tracking-widest"
                  placeholder="000000"
                />
                <p className="mt-2 text-[13px] text-white/50">
                  Enter the 6-digit code from your authenticator app
                </p>
              </div>
            )}

            {/* Submit button */}
            <button
              type="submit"
              disabled={loading || (!requires2FA && (!email || !password)) || (requires2FA && !totpCode)}
              className="w-full py-3 bg-gradient-to-r from-primary-600 to-teal-500 hover:from-primary-700 hover:to-teal-600 text-white text-[15px] rounded-xl font-medium transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 shadow-lg shadow-primary-500/30 hover:shadow-xl hover:shadow-primary-500/40"
            >
              {loading ? (requires2FA ? 'Verifying...' : 'Signing in...') : (requires2FA ? 'Verify code' : 'Sign in')}
              {!loading && <ArrowRight className="w-4 h-4" />}
            </button>

            {/* Back button for 2FA */}
            {requires2FA && (
              <div className="text-center">
                <button
                  type="button"
                  onClick={handleBackToPassword}
                  className="text-[13px] text-primary-400 hover:text-primary-300 transition-colors"
                >
                  ← Back to password
                </button>
              </div>
            )}
          </form>

          {/* Footer */}
          <div className="mt-8 text-center text-[13px] text-white/50">
            Don't have an account?{' '}
            <Link href="/signup" className="text-primary-400 hover:text-primary-300 font-medium transition-colors">
              Create account
            </Link>
          </div>
        </motion.div>
      </div>
    </div>
  );
}