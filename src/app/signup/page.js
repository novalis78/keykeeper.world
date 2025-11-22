'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { CheckCircle, XCircle, Eye, EyeOff, ArrowRight } from 'lucide-react';

export default function SignupPage() {
  const router = useRouter();
  const [formData, setFormData] = useState({
    username: '',
    domain: 'keykeeper.world',
    name: '',
    password: '',
    confirmPassword: ''
  });
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isChecking, setIsChecking] = useState(false);
  const [isAvailable, setIsAvailable] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [agreedToTerms, setAgreedToTerms] = useState(false);

  // Domain options
  const domainOptions = [
    { value: 'keykeeper.world', label: 'keykeeper.world' },
    { value: 'phoneshield.ai', label: 'phoneshield.ai' }
  ];

  // Check username availability with debouncing
  useEffect(() => {
    if (formData.username.length > 2) {
      const timeoutId = setTimeout(() => {
        checkUsernameAvailability(formData.username, formData.domain);
      }, 500);
      return () => clearTimeout(timeoutId);
    } else {
      setIsAvailable(null);
    }
  }, [formData.username, formData.domain]);

  const checkUsernameAvailability = async (username, domain) => {
    if (username.length < 3) return;

    setIsChecking(true);

    try {
      await new Promise(resolve => setTimeout(resolve, 800));

      // Mock check - certain usernames are "taken"
      const takenUsernames = ['admin', 'info', 'test', 'user', 'support', 'hello'];
      const isTaken = takenUsernames.includes(username.toLowerCase());

      setIsAvailable(!isTaken);
    } catch (err) {
      console.error('Error checking username:', err);
    } finally {
      setIsChecking(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!formData.username || !formData.password || !formData.confirmPassword) {
      setError('Please fill in all required fields');
      return;
    }

    if (formData.username.length < 3) {
      setError('Username must be at least 3 characters');
      return;
    }

    if (!isAvailable) {
      setError('Please choose an available username');
      return;
    }

    if (formData.password !== formData.confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    if (formData.password.length < 8) {
      setError('Password must be at least 8 characters');
      return;
    }

    if (!agreedToTerms) {
      setError('Please agree to the terms of service');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const email = `${formData.username}@${formData.domain}`;

      const response = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email,
          password: formData.password,
          name: formData.name || null
        })
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Registration failed');
      }

      // Store token if provided
      if (data.token) {
        localStorage.setItem('auth_token', data.token);
      }

      // Redirect to dashboard
      router.push('/dashboard');
    } catch (error) {
      console.error('Registration error:', error);
      setError(error.message || 'Something went wrong');
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  return (
    <div className="min-h-screen bg-[#050505] text-white flex items-center justify-center px-6 py-12">
      <div className="w-full max-w-md">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          {/* Header */}
          <div className="text-center mb-8">
            <Link href="/" className="inline-block mb-6">
              <div className="text-2xl font-bold">KeyKeeper</div>
            </Link>
            <h1 className="text-4xl font-bold mb-2">Create your account</h1>
            <p className="text-white/60">Get your secure email address</p>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-6">
            {error && (
              <div className="p-4 bg-red-500/10 border border-red-500/20 rounded-xl">
                <p className="text-sm text-red-400">{error}</p>
              </div>
            )}

            {/* Username Picker */}
            <div>
              <label htmlFor="username" className="block text-sm font-medium text-white/80 mb-2">
                Choose your email address
              </label>
              <div className="flex rounded-xl overflow-hidden border border-white/10 focus-within:border-white/20 transition-colors">
                <input
                  type="text"
                  id="username"
                  name="username"
                  value={formData.username}
                  onChange={handleChange}
                  className="flex-1 px-4 py-3 bg-white/[0.03] text-white placeholder:text-white/40 focus:outline-none"
                  placeholder="username"
                  autoComplete="off"
                  required
                />
                <div className="flex items-center px-4 bg-white/[0.03] border-l border-white/10">
                  <span className="text-white/60 text-sm mr-1">@</span>
                  <select
                    name="domain"
                    value={formData.domain}
                    onChange={handleChange}
                    className="bg-transparent text-sm text-white/80 focus:outline-none cursor-pointer"
                  >
                    {domainOptions.map(domain => (
                      <option key={domain.value} value={domain.value} className="bg-[#050505]">
                        {domain.label}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Availability indicator */}
              {formData.username.length > 2 && (
                <div className="mt-2 flex items-center text-sm">
                  {isChecking ? (
                    <div className="flex items-center text-white/40">
                      <div className="w-4 h-4 border-2 border-white/20 border-t-white/60 rounded-full animate-spin mr-2" />
                      Checking availability...
                    </div>
                  ) : isAvailable ? (
                    <div className="flex items-center text-green-400">
                      <CheckCircle className="w-4 h-4 mr-2" />
                      Available!
                    </div>
                  ) : isAvailable === false ? (
                    <div className="flex items-center text-red-400">
                      <XCircle className="w-4 h-4 mr-2" />
                      Not available
                    </div>
                  ) : null}
                </div>
              )}

              {formData.username.length > 0 && formData.username.length < 3 && (
                <p className="mt-2 text-xs text-amber-400">
                  Username must be at least 3 characters
                </p>
              )}
            </div>

            {/* Name */}
            <div>
              <label htmlFor="name" className="block text-sm font-medium text-white/80 mb-2">
                Display name (optional)
              </label>
              <input
                type="text"
                id="name"
                name="name"
                value={formData.name}
                onChange={handleChange}
                className="w-full px-4 py-3 bg-white/[0.03] border border-white/10 rounded-xl text-white placeholder:text-white/40 focus:outline-none focus:border-white/20 transition-colors"
                placeholder="Your name"
              />
            </div>

            {/* Password */}
            <div>
              <label htmlFor="password" className="block text-sm font-medium text-white/80 mb-2">
                Password
              </label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  id="password"
                  name="password"
                  value={formData.password}
                  onChange={handleChange}
                  className="w-full px-4 py-3 bg-white/[0.03] border border-white/10 rounded-xl text-white placeholder:text-white/40 focus:outline-none focus:border-white/20 transition-colors"
                  placeholder="At least 8 characters"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-white/40 hover:text-white/60 transition-colors"
                >
                  {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
            </div>

            {/* Confirm Password */}
            <div>
              <label htmlFor="confirmPassword" className="block text-sm font-medium text-white/80 mb-2">
                Confirm password
              </label>
              <div className="relative">
                <input
                  type={showConfirmPassword ? 'text' : 'password'}
                  id="confirmPassword"
                  name="confirmPassword"
                  value={formData.confirmPassword}
                  onChange={handleChange}
                  className="w-full px-4 py-3 bg-white/[0.03] border border-white/10 rounded-xl text-white placeholder:text-white/40 focus:outline-none focus:border-white/20 transition-colors"
                  placeholder="Confirm your password"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-white/40 hover:text-white/60 transition-colors"
                >
                  {showConfirmPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
            </div>

            {/* Terms checkbox */}
            <div className="flex items-start">
              <input
                type="checkbox"
                id="terms"
                checked={agreedToTerms}
                onChange={(e) => setAgreedToTerms(e.target.checked)}
                className="mt-1 w-4 h-4 rounded border-white/20 bg-white/5 text-white focus:ring-0 focus:ring-offset-0"
              />
              <label htmlFor="terms" className="ml-3 text-sm text-white/60">
                I agree to the{' '}
                <Link href="/terms" className="text-white/80 hover:text-white underline">
                  terms of service
                </Link>{' '}
                and{' '}
                <Link href="/privacy" className="text-white/80 hover:text-white underline">
                  privacy policy
                </Link>
              </label>
            </div>

            {/* Submit button */}
            <button
              type="submit"
              disabled={loading || (formData.username.length > 0 && !isAvailable)}
              className="w-full py-3 bg-white text-black rounded-xl font-medium hover:bg-white/90 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {loading ? 'Creating account...' : 'Create account'}
              {!loading && <ArrowRight className="w-4 h-4" />}
            </button>
          </form>

          {/* Footer */}
          <div className="mt-8 text-center text-sm text-white/60">
            Already have an account?{' '}
            <Link href="/login" className="text-white/80 hover:text-white transition-colors">
              Sign in
            </Link>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
