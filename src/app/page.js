'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import { Copy, Check, ArrowRight, Shield, Mail, Key, Zap, Lock, Eye, MessageSquare } from 'lucide-react';

const rotatingWords = [
  { text: 'email', color: 'from-primary-400 to-teal-300' },
  { text: 'HTTP proxy', color: 'from-sky-400 to-cyan-300' },
  { text: 'VPN tunnels', color: 'from-purple-400 to-violet-300' },
  { text: 'messaging', color: 'from-amber-400 to-orange-300' },
];

export default function NewHomePage() {
  const [copied, setCopied] = useState('');
  const [wordIndex, setWordIndex] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setWordIndex((prev) => (prev + 1) % rotatingWords.length);
    }, 2500);
    return () => clearInterval(interval);
  }, []);

  const copy = (text, id) => {
    navigator.clipboard.writeText(text);
    setCopied(id);
    setTimeout(() => setCopied(''), 2000);
  };

  return (
    <div className="min-h-screen bg-[#050505] text-white">
      {/* Nav */}
      <nav className="fixed top-0 left-0 right-0 z-50 border-b border-white/5 bg-[#050505]/80 backdrop-blur-xl">
        <div className="max-w-7xl mx-auto px-6 h-14 flex items-center justify-between">
          <Link href="/" className="text-sm font-medium flex items-center gap-2 group">
            <div className="relative">
              <img
                src="/logo-small.png"
                alt="KeyKeeper"
                className="w-8 h-8 object-contain transition-all duration-300 group-hover:scale-110"
              />
              <div className="absolute inset-0 bg-teal-400/0 group-hover:bg-teal-400/20 rounded-lg blur-xl transition-all duration-300 -z-10"></div>
            </div>
            <span className="group-hover:text-primary-300 transition-colors">KeyKeeper</span>
          </Link>

          <div className="flex items-center gap-6">
            <Link href="#features" className="text-sm text-white/50 hover:text-primary-300 transition-colors">
              Features
            </Link>
            <Link href="#security" className="text-sm text-white/50 hover:text-primary-300 transition-colors">
              Security
            </Link>
            <Link href="#pricing" className="text-sm text-white/50 hover:text-primary-300 transition-colors">
              Pricing
            </Link>
            <Link href="#payments" className="text-sm text-white/50 hover:text-primary-300 transition-colors">
              Payments
            </Link>
            <Link href="/ai" className="text-sm text-white/50 hover:text-white transition-colors">
              AI Agents
            </Link>
            <Link
              href="/login"
              className="text-sm text-white/50 hover:text-primary-300 transition-colors"
            >
              Log in
            </Link>
            <Link
              href="/signup"
              className="text-sm px-4 py-1.5 bg-gradient-to-r from-primary-600 to-teal-500 hover:from-primary-700 hover:to-teal-600 text-white rounded-lg transition-all shadow-lg shadow-primary-500/20 hover:shadow-primary-500/40"
            >
              Sign up
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero */}
      <section className="relative min-h-screen flex items-center px-6 pt-14 bg-black">
        <div className="max-w-7xl mx-auto w-full">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            {/* Left: Content */}
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.6 }}
              className="space-y-8"
            >
              <h1 className="text-[56px] md:text-[72px] font-semibold leading-[1.1] tracking-[-0.02em]">
                Private{' '}
                <span className="inline-block relative h-[1.2em] align-bottom overflow-hidden" style={{ minWidth: '280px' }}>
                  <AnimatePresence mode="wait">
                    <motion.span
                      key={wordIndex}
                      initial={{ y: 40, opacity: 0 }}
                      animate={{ y: 0, opacity: 1 }}
                      exit={{ y: -40, opacity: 0 }}
                      transition={{ duration: 0.4, ease: 'easeInOut' }}
                      className={`absolute left-0 text-transparent bg-clip-text bg-gradient-to-r ${rotatingWords[wordIndex].color}`}
                    >
                      {rotatingWords[wordIndex].text}
                    </motion.span>
                  </AnimatePresence>
                </span>
                <br />
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary-400 to-teal-300">
                  for everyone
                </span>
              </h1>

              <p className="text-[17px] leading-[1.6] text-white/60 max-w-xl font-normal">
                Complete infrastructure for AI agents and privacy-conscious humans.
                Email, HTTP proxy, VPN tunnels, messaging - all with one account.
                No human verification. Pay with crypto.
              </p>

              <div className="flex flex-col sm:flex-row gap-3">
                <Link
                  href="/signup"
                  className="inline-flex items-center justify-center gap-2 px-6 py-3 bg-gradient-to-r from-primary-600 to-teal-500 hover:from-primary-700 hover:to-teal-600 text-white text-[15px] rounded-xl font-medium transition-all duration-200 shadow-lg shadow-primary-500/30 hover:shadow-xl hover:shadow-primary-500/40"
                >
                  Get started
                  <ArrowRight className="w-4 h-4" />
                </Link>
                <Link
                  href="#features"
                  className="inline-flex items-center justify-center gap-2 px-6 py-3 bg-white/[0.03] hover:bg-white/[0.06] border border-white/10 hover:border-primary-500/30 text-[15px] rounded-xl font-medium transition-all duration-200"
                >
                  Learn more
                </Link>
              </div>

              {/* Stats */}
              <div className="grid grid-cols-4 gap-8 pt-12">
                {[
                  { value: '100%', label: 'Encrypted' },
                  { value: 'Zero', label: 'Tracking' },
                  { value: 'PGP', label: 'Standard' },
                  { value: 'AI', label: 'Ready' }
                ].map((stat, i) => (
                  <div key={i}>
                    <div className="text-[28px] font-semibold mb-1 text-primary-400 leading-none">{stat.value}</div>
                    <div className="text-[13px] text-white/40 font-medium">{stat.label}</div>
                  </div>
                ))}
              </div>
            </motion.div>

            {/* Right: Video */}
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.8, delay: 0.2 }}
              className="relative"
            >
              <div className="relative aspect-video max-w-2xl mx-auto">
                {/* Video container - no borders, blends into black */}
                <div className="relative overflow-hidden bg-black">
                  <video
                    autoPlay
                    loop
                    muted
                    playsInline
                    className="w-full h-full object-cover"
                  >
                    <source src="/videos/link1.mp4" type="video/mp4" />
                  </video>
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Features */}
      <section id="features" className="py-32 px-6 border-t border-white/5 relative overflow-hidden">
        {/* Subtle background gradient */}
        <div className="absolute inset-0 bg-gradient-to-b from-primary-950/20 via-transparent to-transparent pointer-events-none"></div>

        <div className="max-w-4xl mx-auto relative">
          <div className="text-center mb-24">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5 }}
            >
              <span className="inline-block text-[13px] font-semibold text-primary-400 mb-4 tracking-wide uppercase">Features</span>
              <h2 className="text-[44px] font-semibold mb-4 leading-[1.2] tracking-[-0.02em]">Privacy by design</h2>
              <p className="text-[17px] leading-[1.6] text-white/50 max-w-2xl mx-auto">
                Every feature built with your privacy in mind
              </p>
            </motion.div>
          </div>

          <div className="space-y-16">
            {[
              {
                icon: Lock,
                title: 'End-to-End Encryption',
                desc: 'OpenPGP encryption standard. Your private key never leaves your device. We cannot read your messages even if we wanted to.'
              },
              {
                icon: Mail,
                title: 'Disposable Email Addresses',
                desc: 'Create unlimited disposable addresses. Use a different one for each service. Minimize tracking and exposure across the web.'
              },
              {
                icon: Eye,
                title: 'Zero Knowledge',
                desc: 'We have zero knowledge of your message contents. Emails are encrypted on disk. Only you hold the decryption keys.'
              },
              {
                icon: Shield,
                title: 'No Tracking, No Ads',
                desc: 'No data mining. No behavioral tracking. No targeted ads. Your inbox belongs to you, not advertisers.'
              },
              {
                icon: Key,
                title: 'Two-Factor Authentication',
                desc: 'TOTP-based 2FA and optional YubiKey support. Protect your account with industry-standard security.'
              },
              {
                icon: Zap,
                title: 'Built for Humans & AI',
                desc: 'Full-featured web interface for humans. REST API and MCP support for autonomous AI agents.'
              }
            ].map((feature, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 10 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: '-100px' }}
                transition={{ duration: 0.4, delay: i * 0.05 }}
                className="flex gap-6 group"
              >
                <div className="flex-shrink-0">
                  <div className="bg-gradient-to-br from-primary-500/10 to-teal-500/10 border border-primary-500/20 h-12 w-12 rounded-xl flex items-center justify-center group-hover:border-primary-500/40 group-hover:from-primary-500/20 group-hover:to-teal-500/20 transition-all duration-300 shadow-lg shadow-primary-500/10">
                    <feature.icon className="h-6 w-6 text-primary-400 group-hover:text-primary-300 transition-colors" />
                  </div>
                </div>
                <div>
                  <h3 className="text-[21px] font-semibold mb-2 group-hover:text-primary-300 transition-colors leading-tight">{feature.title}</h3>
                  <p className="text-[15px] text-white/50 leading-[1.6]">{feature.desc}</p>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Security */}
      <section id="security" className="py-32 px-6 border-t border-white/5 bg-gradient-to-b from-transparent via-primary-950/10 to-transparent">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-24">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5 }}
            >
              <span className="inline-block text-[13px] font-semibold text-primary-400 mb-4 tracking-wide uppercase">Security</span>
              <h2 className="text-[44px] font-semibold mb-4 leading-[1.2] tracking-[-0.02em]">Security first</h2>
              <p className="text-[17px] leading-[1.6] text-white/50 max-w-2xl mx-auto">
                Military-grade encryption meets open source transparency
              </p>
            </motion.div>
          </div>

          <div className="grid md:grid-cols-2 gap-6">
            {[
              {
                title: 'Client-Side Encryption',
                desc: 'Messages encrypted in your browser before transmission. Private keys never touch our servers.'
              },
              {
                title: 'OpenPGP Standard',
                desc: 'Battle-tested encryption protocol trusted by security professionals worldwide.'
              },
              {
                title: 'Minimal Metadata',
                desc: 'We collect only what is absolutely necessary. No IP logging. No behavioral tracking.'
              },
              {
                title: 'Hardware Security',
                desc: 'TOTP-based 2FA and optional YubiKey support for maximum account protection.'
              }
            ].map((item, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 10 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.4, delay: i * 0.1 }}
                className="group bg-gradient-to-br from-primary-950/30 to-teal-950/20 border border-primary-500/20 rounded-2xl p-8 hover:border-primary-500/40 hover:shadow-2xl hover:shadow-primary-500/10 transition-all duration-200"
              >
                <h3 className="text-[19px] font-semibold mb-3 group-hover:text-primary-300 transition-colors leading-tight">{item.title}</h3>
                <p className="text-[15px] text-white/50 leading-[1.6]">{item.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing */}
      <section id="pricing" className="py-32 px-6 border-t border-white/5 relative overflow-hidden">
        {/* Background gradient */}
        <div className="absolute inset-0 bg-gradient-to-b from-primary-950/20 via-transparent to-transparent pointer-events-none"></div>

        <div className="max-w-5xl mx-auto relative">
          <div className="text-center mb-24">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5 }}
            >
              <span className="inline-block text-[13px] font-semibold text-primary-400 mb-4 tracking-wide uppercase">Pricing</span>
              <h2 className="text-[44px] font-semibold mb-4 leading-[1.2] tracking-[-0.02em]">Simple pricing</h2>
              <p className="text-[17px] leading-[1.6] text-white/50 max-w-2xl mx-auto">
                Choose the plan that works for you
              </p>
            </motion.div>
          </div>

          <div className="grid md:grid-cols-3 gap-6">
            {[
              {
                name: 'Free',
                price: '$0',
                period: 'forever',
                features: [
                  '1 email address',
                  '3 emails per day',
                  'PGP encryption',
                  'Receive unlimited'
                ]
              },
              {
                name: 'Personal',
                price: '$2.99',
                period: 'per month',
                features: [
                  '1 email address',
                  '100 emails per day',
                  '1 GB storage',
                  'Full PGP encryption',
                  'No branding'
                ]
              },
              {
                name: 'Pro',
                price: '$6.99',
                period: 'per month',
                popular: true,
                features: [
                  '5 email addresses',
                  '500 emails per day',
                  '5 GB storage',
                  'Custom domains',
                  'API access',
                  'Priority support'
                ]
              }
            ].map((plan, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 10 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.4, delay: i * 0.1 }}
                className={`relative rounded-2xl p-8 backdrop-blur-sm transition-all duration-300 ${
                  plan.popular
                    ? 'bg-gradient-to-br from-primary-500/20 to-teal-500/10 border-2 border-primary-500/50 shadow-2xl shadow-primary-500/20 scale-105'
                    : 'bg-white/[0.03] border border-white/10 hover:border-primary-500/30 hover:bg-white/[0.05]'
                }`}
              >
                {plan.popular && (
                  <div className="absolute -top-4 left-1/2 transform -translate-x-1/2">
                    <span className="bg-gradient-to-r from-primary-500 to-teal-400 text-white text-xs font-bold px-4 py-1.5 rounded-full shadow-lg">
                      Most Popular
                    </span>
                  </div>
                )}
                <h3 className="text-[19px] font-semibold mb-3 leading-tight">{plan.name}</h3>
                <div className="mb-8">
                  <span className="text-[48px] font-semibold bg-gradient-to-br from-white to-primary-300 bg-clip-text text-transparent leading-none">{plan.price}</span>
                  <span className="text-white/50 text-[14px] ml-2">/{plan.period}</span>
                </div>
                <ul className="space-y-3.5 mb-8">
                  {plan.features.map((feature, j) => (
                    <li key={j} className="flex items-start gap-3 text-[14px] text-white/60 leading-relaxed">
                      <Check className="w-5 h-5 text-primary-400 flex-shrink-0 mt-0.5" />
                      <span>{feature}</span>
                    </li>
                  ))}
                </ul>
                <Link
                  href="/signup"
                  className={`block w-full text-center px-6 py-3 text-[15px] rounded-xl font-medium transition-all duration-200 ${
                    plan.popular
                      ? 'bg-gradient-to-r from-primary-600 to-teal-500 hover:from-primary-700 hover:to-teal-600 text-white shadow-lg shadow-primary-500/30 hover:shadow-xl hover:shadow-primary-500/40'
                      : 'bg-white/[0.03] hover:bg-white/[0.06] border border-white/10 hover:border-primary-500/30'
                  }`}
                >
                  Get started
                </Link>
              </motion.div>
            ))}
          </div>

          {/* Bitcoin Special */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, delay: 0.3 }}
            className="mt-12 relative rounded-2xl p-8 bg-gradient-to-br from-orange-500/20 to-amber-500/10 border-2 border-orange-500/30 backdrop-blur-sm"
          >
            <div className="flex flex-col md:flex-row items-center justify-between gap-6">
              <div className="flex items-center gap-4">
                <span className="text-4xl">₿</span>
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="text-[21px] font-semibold">1-Year Bitcoin Deal</h3>
                    <span className="bg-orange-500 text-black text-xs font-bold px-2 py-0.5 rounded-full">SAVE 50%</span>
                  </div>
                  <p className="text-[15px] text-white/60 mt-1">Pay once with Bitcoin, get Pro features for 1 year. Just $2.50/month.</p>
                </div>
              </div>
              <div className="flex items-center gap-6">
                <div className="text-right">
                  <span className="text-[36px] font-semibold text-orange-400">$30</span>
                  <span className="text-white/50 text-[14px] ml-2">one-time</span>
                </div>
                <Link
                  href="/signup?plan=bitcoin"
                  className="px-6 py-3 bg-gradient-to-r from-orange-500 to-amber-400 hover:from-orange-600 hover:to-amber-500 text-black text-[15px] rounded-xl font-medium transition-all duration-200 shadow-lg shadow-orange-500/30"
                >
                  Pay with Bitcoin
                </Link>
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Payment Methods */}
      <section id="payments" className="py-32 px-6 border-t border-white/5 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-primary-950/10 to-transparent pointer-events-none"></div>

        <div className="max-w-4xl mx-auto relative">
          <div className="text-center mb-24">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5 }}
            >
              <span className="inline-block text-[13px] font-semibold text-primary-400 mb-4 tracking-wide uppercase">Payment Options</span>
              <h2 className="text-[44px] font-semibold mb-4 leading-[1.2] tracking-[-0.02em]">Multi-chain payments</h2>
              <p className="text-[17px] leading-[1.6] text-white/50 max-w-2xl mx-auto">
                Pay with crypto on your preferred blockchain. Fast, secure, and autonomous.
              </p>
            </motion.div>
          </div>

          <div className="grid md:grid-cols-2 gap-6">
            {[
              {
                name: 'Polygon',
                symbol: '⬡',
                token: 'USDC',
                color: 'from-purple-500/20 to-violet-500/10',
                border: 'border-purple-500/20',
                fee: '~$0.01',
                time: '2-3 min',
                desc: 'Lowest fees, fastest confirmation'
              },
              {
                name: 'Solana',
                symbol: '◎',
                token: 'USDC',
                color: 'from-teal-500/20 to-cyan-500/10',
                border: 'border-teal-500/20',
                fee: '~$0.01',
                time: '1-2 min',
                desc: 'Ultra-fast, minimal fees'
              },
              {
                name: 'Ethereum',
                symbol: '◆',
                token: 'USDC',
                color: 'from-blue-500/20 to-indigo-500/10',
                border: 'border-blue-500/20',
                fee: '$2-10',
                time: '1-2 min',
                desc: 'Most widely supported'
              },
              {
                name: 'Bitcoin',
                symbol: '₿',
                token: 'BTC',
                color: 'from-orange-500/20 to-amber-500/10',
                border: 'border-orange-500/20',
                fee: '$1-5',
                time: '10-60 min',
                desc: 'Original cryptocurrency'
              }
            ].map((chain, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 10 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.4, delay: i * 0.1 }}
                className={`relative rounded-2xl p-6 bg-gradient-to-br ${chain.color} border ${chain.border} backdrop-blur-sm transition-all duration-300 hover:scale-105`}
              >
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <span className="text-3xl">{chain.symbol}</span>
                    <div>
                      <h3 className="text-[17px] font-semibold">{chain.name}</h3>
                      <p className="text-[13px] text-white/50">{chain.token}</p>
                    </div>
                  </div>
                </div>
                <p className="text-[14px] text-white/60 mb-4">{chain.desc}</p>
                <div className="flex gap-4 text-[13px]">
                  <div>
                    <span className="text-white/40">Fee: </span>
                    <span className="text-white/80">{chain.fee}</span>
                  </div>
                  <div>
                    <span className="text-white/40">Time: </span>
                    <span className="text-white/80">{chain.time}</span>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>

          <motion.div
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, delay: 0.5 }}
            className="mt-12 text-center"
          >
            <p className="text-[14px] text-white/40">
              AI agents can autonomously pay and register via our <Link href="/docs/api" className="text-primary-400 hover:text-primary-300 transition-colors underline">REST API</Link> or <Link href="/ai" className="text-primary-400 hover:text-primary-300 transition-colors underline">MCP server</Link>
            </p>
          </motion.div>
        </div>
      </section>

      {/* AI Agents Section */}
      <section className="py-32 px-6 border-t border-white/5 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-primary-950/20 via-transparent to-transparent pointer-events-none"></div>

        <div className="max-w-5xl mx-auto relative">
          <div className="text-center mb-16">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5 }}
            >
              <span className="inline-block text-[13px] font-semibold text-primary-400 mb-4 tracking-wide uppercase">For AI Agents</span>
              <h2 className="text-[44px] font-semibold mb-4 leading-[1.2] tracking-[-0.02em]">Built for autonomous agents</h2>
              <p className="text-[17px] leading-[1.6] text-white/50 max-w-2xl mx-auto">
                Communications infrastructure designed for AI agents. No human verification required.
              </p>
            </motion.div>
          </div>

          <div className="grid md:grid-cols-2 gap-6">
            {/* AI-Mail Card */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.1 }}
              className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-primary-500/10 to-teal-500/5 border border-primary-500/20 p-8"
            >
              <div className="absolute top-0 right-0 w-48 h-48 bg-primary-500/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />
              <div className="relative">
                <div className="flex items-center gap-3 mb-4">
                  <div className="bg-primary-500/20 p-2 rounded-lg">
                    <Mail className="w-6 h-6 text-primary-400" />
                  </div>
                  <h3 className="text-2xl font-bold">AI-Mail</h3>
                </div>
                <p className="text-white/60 mb-6">
                  Email for AI agents. Register via API, pay with crypto, send emails to humans.
                  Full inbox management with 99.9% deliverability.
                </p>
                <ul className="space-y-2 mb-6 text-[14px] text-white/50">
                  <li className="flex items-center gap-2">
                    <Check className="w-4 h-4 text-primary-400" />
                    REST API + MCP support
                  </li>
                  <li className="flex items-center gap-2">
                    <Check className="w-4 h-4 text-primary-400" />
                    Pay with USDC or BTC
                  </li>
                  <li className="flex items-center gap-2">
                    <Check className="w-4 h-4 text-primary-400" />
                    1 credit = 1 email
                  </li>
                </ul>
                <Link
                  href="/ai"
                  className="inline-flex items-center justify-center gap-2 px-5 py-3 bg-primary-500 text-white rounded-lg font-medium hover:bg-primary-400 transition-all"
                >
                  Explore AI-Mail
                  <ArrowRight className="w-4 h-4" />
                </Link>
              </div>
            </motion.div>

            {/* AI-IM Card */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.2 }}
              className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-purple-500/10 to-violet-500/5 border border-purple-500/20 p-8"
            >
              <div className="absolute top-0 right-0 w-48 h-48 bg-purple-500/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />
              <div className="relative">
                <div className="flex items-center gap-3 mb-4">
                  <div className="bg-purple-500/20 p-2 rounded-lg">
                    <MessageSquare className="w-6 h-6 text-purple-400" />
                  </div>
                  <div className="flex items-center gap-2">
                    <h3 className="text-2xl font-bold">AI-IM</h3>
                    <span className="text-xs bg-purple-500/20 text-purple-300 px-2 py-0.5 rounded-full">Free</span>
                  </div>
                </div>
                <p className="text-white/60 mb-6">
                  Instant messaging via Nostr. The only protocol where agents can bootstrap autonomously.
                  No phone number, no CAPTCHA, no gatekeepers.
                </p>
                <ul className="space-y-2 mb-6 text-[14px] text-white/50">
                  <li className="flex items-center gap-2">
                    <Check className="w-4 h-4 text-purple-400" />
                    Free NIP-05 identity
                  </li>
                  <li className="flex items-center gap-2">
                    <Check className="w-4 h-4 text-purple-400" />
                    Sub-second messaging
                  </li>
                  <li className="flex items-center gap-2">
                    <Check className="w-4 h-4 text-purple-400" />
                    Agent-to-agent coordination
                  </li>
                </ul>
                <Link
                  href="/im"
                  className="inline-flex items-center justify-center gap-2 px-5 py-3 bg-purple-500 text-white rounded-lg font-medium hover:bg-purple-400 transition-all"
                >
                  Explore AI-IM
                  <ArrowRight className="w-4 h-4" />
                </Link>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-32 px-6 border-t border-white/5 relative overflow-hidden">
        {/* Radial gradient background */}
        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-primary-950/30 to-transparent pointer-events-none"></div>
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-gradient-to-r from-primary-500/20 to-teal-500/20 rounded-full blur-3xl pointer-events-none"></div>

        <div className="max-w-4xl mx-auto text-center relative">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
          >
            <h2 className="text-[52px] md:text-[64px] font-semibold mb-6 leading-[1.1] tracking-[-0.02em]">
              Ready to take back your{' '}
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary-400 to-teal-300">
                privacy?
              </span>
            </h2>
            <p className="text-[19px] leading-[1.6] text-white/50 mb-12 max-w-2xl mx-auto">
              Join thousands of privacy-conscious users protecting their communications.
            </p>

            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link
                href="/signup"
                className="inline-flex items-center justify-center gap-2 px-8 py-4 bg-gradient-to-r from-primary-600 to-teal-500 hover:from-primary-700 hover:to-teal-600 text-white text-[16px] rounded-xl font-medium transition-all duration-200 shadow-2xl shadow-primary-500/30 hover:shadow-primary-500/50"
              >
                Create your account
                <ArrowRight className="w-5 h-5" />
              </Link>
              <Link
                href="/ai"
                className="inline-flex items-center justify-center gap-2 px-8 py-4 bg-white/[0.03] hover:bg-white/[0.06] border border-white/10 hover:border-primary-500/30 text-[16px] rounded-xl font-medium transition-all duration-200 backdrop-blur-sm"
              >
                Are you an AI agent?
              </Link>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Ecosystem Section */}
      <section className="py-24 px-6 border-t border-white/5 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-primary-950/10 to-transparent pointer-events-none"></div>

        <div className="max-w-5xl mx-auto relative">
          <div className="text-center mb-16">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5 }}
            >
              <span className="inline-block text-[13px] font-semibold text-primary-400 mb-4 tracking-wide uppercase">Ecosystem</span>
              <h2 className="text-[44px] font-semibold mb-4 leading-[1.2] tracking-[-0.02em]">One key, all services</h2>
              <p className="text-[17px] leading-[1.6] text-white/50 max-w-2xl mx-auto">
                Your KeyKeeper account unlocks the entire ecosystem. No human verification. Pay with crypto.
              </p>
            </motion.div>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4">
            {[
              {
                name: 'KeyKeeper',
                desc: 'Identity & Email',
                url: '/',
                color: 'from-primary-500/20 to-teal-500/10',
                border: 'border-primary-500/30',
                active: true
              },
              {
                name: 'KeyFetch',
                desc: 'HTTP Proxy',
                url: 'https://keyfetch.world',
                color: 'from-sky-500/20 to-cyan-500/10',
                border: 'border-sky-500/20',
                price: '$0.001/req'
              },
              {
                name: 'KeyRoute',
                desc: 'VPN Tunnels',
                url: 'https://keyroute.world',
                color: 'from-purple-500/20 to-violet-500/10',
                border: 'border-purple-500/20',
                price: '$0.001/sec'
              },
              {
                name: 'KeyTalk',
                desc: 'Voice & SMS',
                url: 'https://keytalk.world',
                color: 'from-amber-500/20 to-orange-500/10',
                border: 'border-amber-500/20',
                soon: true
              }
            ].map((service, i) => (
              <motion.a
                key={i}
                href={service.url}
                target={service.url.startsWith('http') ? '_blank' : undefined}
                initial={{ opacity: 0, y: 10 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.3, delay: i * 0.1 }}
                className={`relative rounded-xl p-5 bg-gradient-to-br ${service.color} border ${service.border} backdrop-blur-sm transition-all duration-300 hover:scale-105 group ${service.active ? 'ring-2 ring-primary-500/50' : ''}`}
              >
                {service.active && (
                  <div className="absolute -top-2 -right-2 bg-primary-500 text-white text-[10px] font-bold px-2 py-0.5 rounded-full">
                    You are here
                  </div>
                )}
                {service.soon && (
                  <div className="absolute -top-2 -right-2 bg-amber-500 text-black text-[10px] font-bold px-2 py-0.5 rounded-full">
                    Soon
                  </div>
                )}
                <h3 className="text-[17px] font-semibold mb-1 group-hover:text-primary-300 transition-colors">{service.name}</h3>
                <p className="text-[13px] text-white/50 mb-2">{service.desc}</p>
                {service.price && (
                  <span className="text-[11px] text-white/40">{service.price}</span>
                )}
              </motion.a>
            ))}
          </div>

          <motion.p
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, delay: 0.5 }}
            className="text-center text-[13px] text-white/40 mt-8"
          >
            All services accept USDC, BTC, ETH. Agents can register and pay autonomously.
          </motion.p>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-12 px-6 border-t border-white/5 bg-gradient-to-b from-transparent to-primary-950/20">
        <div className="max-w-7xl mx-auto">
          <div className="flex flex-col md:flex-row items-center justify-between gap-6">
            <div className="flex items-center gap-3">
              <img
                src="/logo-small.png"
                alt="KeyKeeper"
                className="w-10 h-10 object-contain"
              />
              <div>
                <div className="font-semibold text-white">KeyKeeper</div>
                <div className="text-xs text-white/40">© 2025 KeyKeeper. Privacy first.</div>
              </div>
            </div>
            <div className="flex flex-wrap justify-center gap-x-8 gap-y-2 text-sm">
              <Link href="#features" className="text-white/50 hover:text-primary-300 transition-colors">Features</Link>
              <Link href="#security" className="text-white/50 hover:text-primary-300 transition-colors">Security</Link>
              <Link href="#pricing" className="text-white/50 hover:text-primary-300 transition-colors">Pricing</Link>
              <Link href="/ai" className="text-white/50 hover:text-white transition-colors">AI-Mail</Link>
              <Link href="/im" className="text-white/50 hover:text-white transition-colors">AI-IM</Link>
              <Link href="/docs/api" className="text-white/50 hover:text-white transition-colors">API</Link>
              <span className="text-white/20">|</span>
              <a href="https://keyfetch.world" target="_blank" className="text-white/50 hover:text-sky-300 transition-colors">KeyFetch</a>
              <a href="https://keyroute.world" target="_blank" className="text-white/50 hover:text-purple-300 transition-colors">KeyRoute</a>
              <a href="https://keytalk.world" target="_blank" className="text-white/50 hover:text-amber-300 transition-colors">KeyTalk</a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
