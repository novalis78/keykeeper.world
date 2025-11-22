'use client';

import { useState } from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { Copy, Check, ArrowRight } from 'lucide-react';
import ChainComparisonTable from '@/components/ChainComparisonTable';

export default function AIPage() {
  const [copied, setCopied] = useState('');

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
          <Link href="/" className="text-sm font-medium">
            KeyKeeper
          </Link>

          <div className="flex items-center gap-6">
            <Link href="/docs" className="text-sm text-white/50 hover:text-white transition-colors">
              Docs
            </Link>
            <Link href="/.well-known/ai-services.json" className="text-sm text-white/50 hover:text-white transition-colors">
              MCP
            </Link>
            <Link
              href="/docs/api"
              className="text-sm px-3 py-1.5 bg-white text-black rounded-md hover:bg-white/90 transition-all"
            >
              Get Started
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero */}
      <section className="relative min-h-screen flex items-center px-6 pt-14">
        <div className="max-w-7xl mx-auto w-full">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            {/* Left: Content */}
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.6 }}
              className="space-y-8"
            >
              <h1 className="text-6xl md:text-7xl font-bold leading-tight tracking-tight">
                Email infrastructure
                <br />
                for AI agents
              </h1>

              <p className="text-lg text-white/60 max-w-xl">
                The first email service designed for autonomous agents.
                Register, pay with crypto, and communicate with humans.
                No human intervention required.
              </p>

              <div className="flex flex-col sm:flex-row gap-3">
                <Link
                  href="/docs/api"
                  className="inline-flex items-center justify-center gap-2 px-5 py-3 bg-white text-black rounded-lg font-medium hover:bg-white/90 transition-all"
                >
                  Read the docs
                  <ArrowRight className="w-4 h-4" />
                </Link>
                <button
                  onClick={() => copy('curl https://keykeeper.world/api/v1/agent/register -X POST', 'hero')}
                  className="inline-flex items-center justify-center gap-2 px-5 py-3 bg-white/5 hover:bg-white/10 border border-white/10 rounded-lg font-medium transition-all"
                >
                  {copied === 'hero' ? (
                    <>
                      <Check className="w-4 h-4" />
                      Copied
                    </>
                  ) : (
                    <>
                      <Copy className="w-4 h-4" />
                      Copy curl
                    </>
                  )}
                </button>
              </div>

              {/* Stats */}
              <div className="grid grid-cols-4 gap-6 pt-8">
                {[
                  { value: '99.9%', label: 'Deliverability' },
                  { value: '<2s', label: 'Latency' },
                  { value: '4', label: 'Chains' },
                  { value: '∞', label: 'Uptime' }
                ].map((stat, i) => (
                  <div key={i}>
                    <div className="text-2xl font-bold mb-1">{stat.value}</div>
                    <div className="text-xs text-white/40">{stat.label}</div>
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
              <div className="relative aspect-square max-w-lg mx-auto">
                <video
                  autoPlay
                  loop
                  muted
                  playsInline
                  className="w-full h-full object-cover rounded-2xl"
                >
                  <source src="/videos/link2.mp4" type="video/mp4" />
                </video>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="py-32 px-6 border-t border-white/5">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-20">
            <h2 className="text-4xl font-bold mb-4">Built for autonomy</h2>
            <p className="text-lg text-white/60">
              Every feature designed for agents to operate independently
            </p>
          </div>

          <div className="space-y-16">
            {[
              {
                title: 'Self-Registration',
                desc: 'POST to /api/v1/agent/register. Receive API key and email address instantly. No verification, no approval.'
              },
              {
                title: 'Multi-Chain Payments',
                desc: 'Pay with USDC on Polygon, Ethereum, Solana, or Bitcoin. Agent chooses. Blockchain verifies. Credits issued automatically.'
              },
              {
                title: 'Credit System',
                desc: '1 credit = 1 email sent. Check balance via API. Top up when low. Fully autonomous operation.'
              },
              {
                title: 'MCP Native',
                desc: 'First-class Model Context Protocol support. 8 tools. Complete lifecycle: discover → register → pay → send.'
              },
              {
                title: '99.9% Deliverability',
                desc: 'Established domain reputation. SPF, DKIM, DMARC configured. Your emails reach inboxes, not spam.'
              },
              {
                title: 'Full Email Access',
                desc: 'Not just sending. Check inbox, read messages, parse threads. Complete bidirectional communication.'
              }
            ].map((feature, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 10 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: '-100px' }}
                transition={{ duration: 0.4, delay: i * 0.05 }}
              >
                <h3 className="text-2xl font-bold mb-3">{feature.title}</h3>
                <p className="text-lg text-white/60 leading-relaxed">{feature.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Payment Options */}
      <section className="py-32 px-6 border-t border-white/5">
        <ChainComparisonTable />
      </section>

      {/* How it works */}
      <section className="py-32 px-6 border-t border-white/5">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-20">
            <h2 className="text-4xl font-bold mb-4">How it works</h2>
            <p className="text-lg text-white/60">
              Seven steps from discovery to communication
            </p>
          </div>

          <div className="space-y-12">
            {[
              { n: '01', title: 'Discover', desc: 'Agent finds KeyKeeper via .well-known/ai-services.json' },
              { n: '02', title: 'Register', desc: 'POST /api/v1/agent/register → receive API key and email' },
              { n: '03', title: 'Choose chain', desc: 'Select Polygon, Ethereum, Solana, or Bitcoin' },
              { n: '04', title: 'Pay', desc: 'Send USDC or BTC to provided address' },
              { n: '05', title: 'Confirm', desc: 'Blockchain confirmations complete, credits issued' },
              { n: '06', title: 'Send', desc: 'POST /api/v1/agent/send with recipient, subject, body' },
              { n: '07', title: 'Monitor', desc: 'GET /api/v1/agent/emails to check inbox and responses' }
            ].map((step, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, x: -10 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true, margin: '-50px' }}
                transition={{ duration: 0.4, delay: i * 0.05 }}
                className="flex gap-6"
              >
                <div className="text-white/30 font-mono text-sm w-8 flex-shrink-0">
                  {step.n}
                </div>
                <div>
                  <h3 className="text-xl font-bold mb-2">{step.title}</h3>
                  <p className="text-white/60">{step.desc}</p>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-32 px-6 border-t border-white/5">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-4xl font-bold mb-4">Ready to deploy?</h2>
          <p className="text-lg text-white/60 mb-8">
            Point your agent to this site. It'll figure out the rest.
          </p>

          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Link
              href="/docs/api"
              className="inline-flex items-center justify-center gap-2 px-5 py-3 bg-white text-black rounded-lg font-medium hover:bg-white/90 transition-all"
            >
              View documentation
              <ArrowRight className="w-4 h-4" />
            </Link>
            <button
              onClick={() => copy('https://keykeeper.world/.well-known/ai-services.json', 'cta')}
              className="inline-flex items-center justify-center gap-2 px-5 py-3 bg-white/5 hover:bg-white/10 border border-white/10 rounded-lg font-medium transition-all"
            >
              {copied === 'cta' ? (
                <>
                  <Check className="w-4 h-4" />
                  Copied MCP
                </>
              ) : (
                <>
                  <Copy className="w-4 h-4" />
                  Copy MCP URL
                </>
              )}
            </button>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-8 px-6 border-t border-white/5">
        <div className="max-w-7xl mx-auto flex items-center justify-between text-sm text-white/40">
          <div>© 2025 KeyKeeper</div>
          <div className="flex gap-6">
            <Link href="/docs" className="hover:text-white/70 transition-colors">Docs</Link>
            <Link href="/docs/api" className="hover:text-white/70 transition-colors">API</Link>
            <Link href="/.well-known/ai-services.json" className="hover:text-white/70 transition-colors">MCP</Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
