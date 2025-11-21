'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import {
  Cpu,
  Zap,
  Shield,
  DollarSign,
  Mail,
  Code,
  CheckCircle,
  Server,
  Globe,
  BarChart3,
  ArrowRight,
  Copy,
  Check,
  Sparkles
} from 'lucide-react';
import CyberGrid from '@/components/CyberGrid';
import ChainComparisonTable from '@/components/ChainComparisonTable';

export default function AlphaGoPage() {
  const [copiedEndpoint, setCopiedEndpoint] = useState('');
  const [activeAgent, setActiveAgent] = useState(0);

  const copyToClipboard = (text, id) => {
    navigator.clipboard.writeText(text);
    setCopiedEndpoint(id);
    setTimeout(() => setCopiedEndpoint(''), 2000);
  };

  // Cycle through example agents
  const exampleAgents = ['GPT-4', 'Claude', 'Gemini', 'Llama', 'Mistral'];
  useEffect(() => {
    const interval = setInterval(() => {
      setActiveAgent((prev) => (prev + 1) % exampleAgents.length);
    }, 3000);
    return () => clearInterval(interval);
  }, []);

  const features = [
    {
      icon: Cpu,
      title: 'Autonomous Registration',
      description: 'Register and obtain email addresses completely autonomously via MCP or REST API. Zero human intervention.',
      color: 'from-cyan-500 to-blue-500',
      glow: 'cyan'
    },
    {
      icon: DollarSign,
      title: 'Multi-Chain Payments',
      description: 'Pay with Polygon, Ethereum, Solana, or Bitcoin. USDC stablecoins or native tokens. Agent chooses.',
      color: 'from-orange-500 to-red-500',
      glow: 'orange'
    },
    {
      icon: Zap,
      title: 'Credit-Based System',
      description: 'Transparent pay-per-email. 1 credit = 1 email. Top up autonomously when balance runs low.',
      color: 'from-purple-500 to-pink-500',
      glow: 'purple'
    },
    {
      icon: Shield,
      title: 'Built-In Deliverability',
      description: 'Established domain reputation. 99.9% deliverability rate. Your emails reach inboxes, not spam.',
      color: 'from-green-500 to-emerald-500',
      glow: 'green'
    },
    {
      icon: Code,
      title: 'MCP Native',
      description: 'Model Context Protocol first-class support. 8 tools for complete lifecycle: register → pay → send.',
      color: 'from-blue-500 to-indigo-500',
      glow: 'blue'
    },
    {
      icon: Mail,
      title: 'Full Send/Receive',
      description: 'Not just sending. Check inbox, get emails, manage threads. Complete email infrastructure for agents.',
      color: 'from-pink-500 to-rose-500',
      glow: 'pink'
    }
  ];

  const stats = [
    { value: '99.9%', label: 'Deliverability', subtext: 'Inbox placement rate' },
    { value: '<2s', label: 'API Latency', subtext: 'Average response time' },
    { value: '4 Chains', label: 'Blockchains', subtext: 'Payment options' },
    { value: '24/7', label: 'Autonomous', subtext: 'No humans needed' }
  ];

  return (
    <div className="min-h-screen bg-[#050505] text-white relative overflow-hidden font-sans">
      {/* Cyber Grid Background */}
      <CyberGrid />

      {/* Content */}
      <div className="relative z-10">
        {/* Navigation */}
        <nav className="border-b border-slate-800/50 backdrop-blur-xl bg-black/20">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex justify-between items-center h-20">
              <Link href="/" className="flex items-center gap-3 group">
                <div className="w-12 h-12 bg-gradient-to-br from-[#FF4D00] to-[#00F3FF] rounded-lg flex items-center justify-center relative">
                  <span className="text-white font-bold text-xl font-mono">αG</span>
                  <div className="absolute inset-0 bg-gradient-to-br from-[#FF4D00] to-[#00F3FF] rounded-lg blur-xl opacity-50 group-hover:opacity-75 transition-opacity"></div>
                </div>
                <div>
                  <div className="text-xl font-bold bg-gradient-to-r from-[#FF4D00] to-[#00F3FF] bg-clip-text text-transparent">
                    Alpha-Go
                  </div>
                  <div className="text-xs text-slate-500 font-mono">KeyKeeper MCP-2099</div>
                </div>
              </Link>

              <div className="flex items-center gap-4">
                <Link
                  href="/docs/api"
                  className="text-slate-400 hover:text-[#00F3FF] transition-colors font-mono text-sm"
                >
                  /docs
                </Link>
                <Link
                  href="/.well-known/ai-services.json"
                  className="text-slate-400 hover:text-[#00F3FF] transition-colors font-mono text-sm"
                >
                  /.well-known
                </Link>
                <Link
                  href="/"
                  className="px-4 py-2 bg-gradient-to-r from-[#FF4D00] to-[#00F3FF] rounded-lg font-semibold text-sm hover:shadow-lg hover:shadow-cyan-500/50 transition-all"
                >
                  Human Portal
                </Link>
              </div>
            </div>
          </div>
        </nav>

        {/* Hero Section */}
        <section className="pt-32 pb-20 px-4 sm:px-6 lg:px-8">
          <div className="max-w-7xl mx-auto">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="text-center"
            >
              {/* Floating Badge */}
              <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-gradient-to-r from-[#FF4D00]/20 to-[#00F3FF]/20 border border-[#00F3FF]/30 backdrop-blur-xl mb-8"
              >
                <Sparkles className="w-4 h-4 text-[#00F3FF]" />
                <span className="text-sm font-mono text-[#00F3FF]">YEAR 2099 AGENT INFRASTRUCTURE</span>
                <div className="w-2 h-2 rounded-full bg-[#00F3FF] animate-pulse"></div>
              </motion.div>

              {/* Main Heading */}
              <h1 className="text-6xl md:text-8xl font-bold mb-6 leading-tight">
                <span className="text-white">Email for</span>
                <br />
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#FF4D00] via-[#00F3FF] to-[#FF4D00] animate-gradient">
                  Autonomous Agents
                </span>
              </h1>

              {/* Subheading */}
              <p className="text-xl md:text-2xl text-slate-400 mb-4 max-w-3xl mx-auto">
                The first email infrastructure designed for AI. Register autonomously, pay with crypto,
                communicate with humans. <span className="text-[#FF4D00]">Zero human intervention.</span>
              </p>

              {/* Agent Name Cycler */}
              <div className="flex items-center justify-center gap-3 mb-12">
                <span className="text-slate-500 font-mono text-sm">Currently serving:</span>
                <motion.span
                  key={activeAgent}
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: 10 }}
                  className="text-[#00F3FF] font-mono font-bold"
                >
                  {exampleAgents[activeAgent]}
                </motion.span>
                <span className="text-slate-500 font-mono text-sm">+ others</span>
              </div>

              {/* CTA Buttons */}
              <div className="flex flex-col sm:flex-row gap-4 justify-center mb-12">
                <button
                  onClick={() => copyToClipboard('https://keykeeper.world', 'site')}
                  className="group relative px-8 py-4 bg-gradient-to-r from-[#FF4D00] to-[#00F3FF] rounded-lg font-bold text-lg overflow-hidden"
                >
                  <div className="absolute inset-0 bg-gradient-to-r from-[#00F3FF] to-[#FF4D00] opacity-0 group-hover:opacity-100 transition-opacity"></div>
                  <div className="relative flex items-center justify-center gap-2">
                    {copiedEndpoint === 'site' ? (
                      <>
                        <Check className="w-5 h-5" />
                        Copied!
                      </>
                    ) : (
                      <>
                        <Copy className="w-5 h-5" />
                        Copy Site URL
                      </>
                    )}
                  </div>
                  <div className="absolute inset-0 bg-gradient-to-r from-[#FF4D00] to-[#00F3FF] blur-xl opacity-50 group-hover:opacity-75 transition-opacity -z-10"></div>
                </button>

                <button
                  onClick={() => copyToClipboard('https://keykeeper.world/api/mcp', 'mcp')}
                  className="px-8 py-4 bg-black/40 backdrop-blur-xl border-2 border-[#00F3FF]/30 rounded-lg font-bold text-lg hover:border-[#00F3FF] hover:shadow-lg hover:shadow-cyan-500/50 transition-all flex items-center justify-center gap-2"
                >
                  {copiedEndpoint === 'mcp' ? (
                    <>
                      <Check className="w-5 h-5 text-[#00F3FF]" />
                      <span className="text-[#00F3FF]">Copied!</span>
                    </>
                  ) : (
                    <>
                      <Code className="w-5 h-5 text-[#00F3FF]" />
                      <span>MCP Endpoint</span>
                    </>
                  )}
                </button>
              </div>

              {/* Quick Start Command */}
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.3 }}
                className="max-w-3xl mx-auto"
              >
                <div className="bg-black/60 backdrop-blur-xl border border-slate-800 rounded-xl p-6">
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-sm text-slate-500 font-mono">GET STARTED IN ONE LINE</span>
                    <button
                      onClick={() => copyToClipboard('curl https://keykeeper.world/.well-known/ai-services.json', 'curl')}
                      className="text-slate-500 hover:text-[#00F3FF] transition-colors"
                    >
                      {copiedEndpoint === 'curl' ? (
                        <Check className="w-4 h-4 text-[#00F3FF]" />
                      ) : (
                        <Copy className="w-4 h-4" />
                      )}
                    </button>
                  </div>
                  <code className="text-[#00F3FF] font-mono text-sm md:text-base block">
                    curl https://keykeeper.world/.well-known/ai-services.json
                  </code>
                </div>
              </motion.div>
            </motion.div>
          </div>
        </section>

        {/* Stats Section */}
        <section className="py-16 px-4 sm:px-6 lg:px-8 border-y border-slate-800/50">
          <div className="max-w-7xl mx-auto">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
              {stats.map((stat, idx) => (
                <motion.div
                  key={idx}
                  initial={{ opacity: 0, scale: 0.9 }}
                  whileInView={{ opacity: 1, scale: 1 }}
                  viewport={{ once: true }}
                  transition={{ delay: idx * 0.1 }}
                  className="text-center"
                >
                  <div className="text-4xl md:text-5xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-[#FF4D00] to-[#00F3FF] font-mono mb-2">
                    {stat.value}
                  </div>
                  <div className="text-lg text-white font-semibold mb-1">{stat.label}</div>
                  <div className="text-sm text-slate-500 font-mono">{stat.subtext}</div>
                </motion.div>
              ))}
            </div>
          </div>
        </section>

        {/* Features Grid */}
        <section className="py-20 px-4 sm:px-6 lg:px-8">
          <div className="max-w-7xl mx-auto">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="text-center mb-16"
            >
              <h2 className="text-4xl md:text-5xl font-bold text-white mb-4">
                Built for the <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#FF4D00] to-[#00F3FF]">Agent Economy</span>
              </h2>
              <p className="text-xl text-slate-400 max-w-3xl mx-auto">
                Every feature designed for autonomous operation. No humans, no hassle, no limitations.
              </p>
            </motion.div>

            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {features.map((feature, idx) => (
                <motion.div
                  key={idx}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: idx * 0.1 }}
                  whileHover={{ scale: 1.02, y: -5 }}
                  className="group relative bg-black/40 backdrop-blur-xl border border-slate-800 rounded-xl p-6 overflow-hidden hover:border-[#00F3FF]/50 transition-all"
                >
                  {/* Glow Effect */}
                  <div className={`absolute inset-0 bg-gradient-to-br ${feature.color} opacity-0 group-hover:opacity-5 transition-opacity`}></div>

                  {/* Icon */}
                  <div className={`inline-flex p-3 rounded-lg bg-gradient-to-br ${feature.color} mb-4`}>
                    <feature.icon className="w-6 h-6 text-white" />
                  </div>

                  {/* Content */}
                  <h3 className="text-xl font-bold text-white mb-2 group-hover:text-[#00F3FF] transition-colors">
                    {feature.title}
                  </h3>
                  <p className="text-slate-400 text-sm leading-relaxed">
                    {feature.description}
                  </p>

                  {/* Hover Arrow */}
                  <ArrowRight className="absolute bottom-6 right-6 w-5 h-5 text-[#00F3FF] opacity-0 group-hover:opacity-100 transition-opacity" />
                </motion.div>
              ))}
            </div>
          </div>
        </section>

        {/* Multi-Chain Comparison Table */}
        <ChainComparisonTable />

        {/* How It Works */}
        <section className="py-20 px-4 sm:px-6 lg:px-8">
          <div className="max-w-5xl mx-auto">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="text-center mb-16"
            >
              <h2 className="text-4xl md:text-5xl font-bold text-white mb-4">
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#FF4D00] to-[#00F3FF]">Autonomous</span> by Design
              </h2>
              <p className="text-xl text-slate-400">
                7-step autonomous flow. No humans. No waiting. No limits.
              </p>
            </motion.div>

            <div className="space-y-4">
              {[
                { step: '01', title: 'Discover Service', desc: 'Agent hits /.well-known/ai-services.json', color: 'cyan' },
                { step: '02', title: 'Register Account', desc: 'Call register_agent MCP tool → Get API key', color: 'orange' },
                { step: '03', title: 'Choose Blockchain', desc: 'Pick Polygon, Ethereum, Solana, or Bitcoin', color: 'purple' },
                { step: '04', title: 'Initiate Payment', desc: 'Get payment address and amount in USDC/BTC', color: 'green' },
                { step: '05', title: 'Send Crypto', desc: 'Agent sends payment from its wallet', color: 'blue' },
                { step: '06', title: 'Monitor Confirmation', desc: 'Poll check_payment_status until confirmed', color: 'pink' },
                { step: '07', title: 'Send Emails', desc: 'Credits loaded. Start communicating.', color: 'cyan' }
              ].map((item, idx) => (
                <motion.div
                  key={idx}
                  initial={{ opacity: 0, x: -20 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: idx * 0.1 }}
                  className="group bg-black/40 backdrop-blur-xl border border-slate-800 rounded-xl p-6 hover:border-[#00F3FF]/50 transition-all flex items-center gap-6"
                >
                  <div className="flex-shrink-0 w-16 h-16 rounded-full bg-gradient-to-br from-[#FF4D00] to-[#00F3FF] flex items-center justify-center font-mono font-bold text-lg">
                    {item.step}
                  </div>
                  <div className="flex-1">
                    <h3 className="text-xl font-bold text-white mb-1 group-hover:text-[#00F3FF] transition-colors">
                      {item.title}
                    </h3>
                    <p className="text-slate-400 text-sm font-mono">{item.desc}</p>
                  </div>
                  <ArrowRight className="w-6 h-6 text-slate-600 group-hover:text-[#00F3FF] transition-colors" />
                </motion.div>
              ))}
            </div>
          </div>
        </section>

        {/* CTA Section */}
        <section className="py-20 px-4 sm:px-6 lg:px-8">
          <div className="max-w-4xl mx-auto">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true }}
              className="relative bg-gradient-to-br from-[#FF4D00]/10 via-black/40 to-[#00F3FF]/10 backdrop-blur-xl border-2 border-[#00F3FF]/30 rounded-3xl p-12 overflow-hidden"
            >
              {/* Background Grid */}
              <div className="absolute inset-0 bg-[linear-gradient(to_right,#80808012_1px,transparent_1px),linear-gradient(to_bottom,#80808012_1px,transparent_1px)] bg-[size:24px_24px]"></div>

              {/* Content */}
              <div className="relative text-center">
                <h2 className="text-4xl md:text-5xl font-bold text-white mb-6">
                  Ready to Deploy Your Agent?
                </h2>
                <p className="text-xl text-slate-300 mb-8 max-w-2xl mx-auto">
                  Just send your agent to this site. It'll figure out the rest by itself.
                </p>

                <div className="flex flex-col sm:flex-row gap-4 justify-center">
                  <Link
                    href="/docs/api"
                    className="px-8 py-4 bg-gradient-to-r from-[#FF4D00] to-[#00F3FF] rounded-lg font-bold text-lg hover:shadow-2xl hover:shadow-cyan-500/50 transition-all inline-flex items-center justify-center gap-2"
                  >
                    <Code className="w-5 h-5" />
                    View Documentation
                  </Link>
                  <button
                    onClick={() => copyToClipboard('https://keykeeper.world', 'final')}
                    className="px-8 py-4 bg-black/60 backdrop-blur-xl border-2 border-[#00F3FF]/30 rounded-lg font-bold text-lg hover:border-[#00F3FF] hover:shadow-lg hover:shadow-cyan-500/50 transition-all inline-flex items-center justify-center gap-2"
                  >
                    {copiedEndpoint === 'final' ? (
                      <>
                        <Check className="w-5 h-5 text-[#00F3FF]" />
                        <span className="text-[#00F3FF]">Copied!</span>
                      </>
                    ) : (
                      <>
                        <Globe className="w-5 h-5" />
                        <span>Copy URL</span>
                      </>
                    )}
                  </button>
                </div>

                <div className="mt-8 text-sm text-slate-500 font-mono">
                  MCP: <span className="text-[#00F3FF]">https://keykeeper.world/api/mcp</span>
                </div>
              </div>
            </motion.div>
          </div>
        </section>

        {/* Footer */}
        <footer className="border-t border-slate-800/50 py-12 px-4 sm:px-6 lg:px-8">
          <div className="max-w-7xl mx-auto text-center">
            <div className="text-slate-500 font-mono text-sm mb-4">
              Alpha-Go MCP-2099 © {new Date().getFullYear()} KeyKeeper
            </div>
            <div className="text-xs text-slate-600 font-mono">
              Built for the autonomous agent economy
            </div>
          </div>
        </footer>
      </div>

      <style jsx global>{`
        @keyframes gradient {
          0%, 100% { background-position: 0% 50%; }
          50% { background-position: 100% 50%; }
        }
        .animate-gradient {
          background-size: 200% 200%;
          animation: gradient 3s ease infinite;
        }
      `}</style>
    </div>
  );
}
