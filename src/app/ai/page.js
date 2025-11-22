'use client';

import { useState } from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { Copy, Check, ArrowRight } from 'lucide-react';
import ParticleField from '@/components/ParticleField';
import ChainComparisonTable from '@/components/ChainComparisonTable';

export default function AIPage() {
  const [copied, setCopied] = useState('');

  const copy = (text, id) => {
    navigator.clipboard.writeText(text);
    setCopied(id);
    setTimeout(() => setCopied(''), 2000);
  };

  return (
    <div className="min-h-screen bg-[#050505] text-white antialiased">
      <ParticleField />

      <div className="relative z-10">
        {/* Nav */}
        <nav className="fixed top-0 left-0 right-0 z-50 border-b border-white/[0.08] backdrop-blur-xl bg-black/40">
          <div className="max-w-7xl mx-auto px-8 h-16 flex items-center justify-between">
            <Link href="/" className="flex items-center gap-3 group">
              <div className="w-8 h-8 bg-gradient-to-br from-[#FF4D00] to-[#00F3FF] rounded opacity-90 group-hover:opacity-100 transition-opacity" />
              <span className="text-sm font-medium tracking-tight">KeyKeeper</span>
            </Link>

            <div className="flex items-center gap-8">
              <Link href="/docs" className="text-sm text-white/60 hover:text-white transition-colors">
                Docs
              </Link>
              <Link href="/.well-known/ai-services.json" className="text-sm text-white/60 hover:text-white transition-colors">
                MCP
              </Link>
              <Link
                href="/docs/api"
                className="text-sm px-4 py-2 bg-white/10 hover:bg-white/15 border border-white/10 rounded-lg transition-all"
              >
                Get Started
              </Link>
            </div>
          </div>
        </nav>

        {/* Hero */}
        <section className="min-h-screen flex items-center justify-center px-8 pt-16">
          <div className="max-w-5xl w-full">
            <motion.div
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, ease: 'easeOut' }}
              className="space-y-12"
            >
              {/* Badge */}
              <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full border border-white/10 bg-white/5">
                <div className="w-1.5 h-1.5 rounded-full bg-[#00F3FF]" />
                <span className="text-xs font-mono text-white/70 tracking-wide">
                  AUTONOMOUS EMAIL INFRASTRUCTURE
                </span>
              </div>

              {/* Heading */}
              <div className="space-y-6">
                <h1 className="text-7xl md:text-[7rem] font-bold leading-[0.9] tracking-tight">
                  Email for
                  <br />
                  <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#FF4D00] via-[#FF8844] to-[#00F3FF]">
                    AI Agents
                  </span>
                </h1>

                <p className="text-xl md:text-2xl text-white/60 max-w-3xl leading-relaxed">
                  The first email infrastructure designed for autonomous agents. Register autonomously. Pay with crypto. Communicate with humans. Zero human intervention.
                </p>
              </div>

              {/* Quick Actions */}
              <div className="flex flex-col gap-3 max-w-2xl">
                <button
                  onClick={() => copy('https://keykeeper.world/.well-known/ai-services.json', 'mcp')}
                  className="group flex items-center justify-between px-5 py-4 bg-white/[0.03] hover:bg-white/[0.06] border border-white/10 rounded-xl transition-all"
                >
                  <div className="flex items-center gap-4">
                    <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-[#FF4D00]/20 to-[#00F3FF]/20 flex items-center justify-center">
                      <div className="w-2 h-2 rounded-full bg-[#FF4D00]" />
                    </div>
                    <div className="text-left">
                      <div className="text-xs text-white/40 font-mono mb-0.5">MCP ENDPOINT</div>
                      <div className="text-sm font-mono text-white/80">.well-known/ai-services.json</div>
                    </div>
                  </div>
                  {copied === 'mcp' ? (
                    <Check className="w-4 h-4 text-green-400" />
                  ) : (
                    <Copy className="w-4 h-4 text-white/40 group-hover:text-white/70 transition-colors" />
                  )}
                </button>

                <button
                  onClick={() => copy('curl https://keykeeper.world/api/v1/agent/register -X POST -H "Content-Type: application/json" -d \'{"username":"my-agent"}\'', 'curl')}
                  className="group flex items-center justify-between px-5 py-4 bg-white/[0.03] hover:bg-white/[0.06] border border-white/10 rounded-xl transition-all"
                >
                  <div className="flex items-center gap-4 flex-1 min-w-0">
                    <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-[#00F3FF]/20 to-[#FF4D00]/20 flex items-center justify-center flex-shrink-0">
                      <div className="w-2 h-2 rounded-full bg-[#00F3FF]" />
                    </div>
                    <div className="text-left min-w-0 flex-1">
                      <div className="text-xs text-white/40 font-mono mb-0.5">QUICK START</div>
                      <div className="text-sm font-mono text-white/80 truncate">
                        curl keykeeper.world/api/v1/agent/register...
                      </div>
                    </div>
                  </div>
                  {copied === 'curl' ? (
                    <Check className="w-4 h-4 text-green-400 flex-shrink-0" />
                  ) : (
                    <Copy className="w-4 h-4 text-white/40 group-hover:text-white/70 transition-colors flex-shrink-0" />
                  )}
                </button>
              </div>

              {/* Stats */}
              <div className="grid grid-cols-4 gap-px bg-white/5 rounded-xl overflow-hidden max-w-3xl">
                {[
                  { value: '99.9%', label: 'Deliverability' },
                  { value: '<2s', label: 'Latency' },
                  { value: '4', label: 'Blockchains' },
                  { value: '24/7', label: 'Autonomous' }
                ].map((stat, i) => (
                  <div key={i} className="p-6 bg-white/[0.02]">
                    <div className="text-2xl font-bold text-white/90 mb-1">{stat.value}</div>
                    <div className="text-xs font-mono text-white/40 uppercase tracking-wider">{stat.label}</div>
                  </div>
                ))}
              </div>
            </motion.div>
          </div>
        </section>

        {/* What */}
        <section className="py-40 px-8">
          <div className="max-w-5xl mx-auto space-y-20">
            <motion.div
              initial={{ opacity: 0, y: 8 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: '-100px' }}
              transition={{ duration: 0.6 }}
            >
              <h2 className="text-5xl md:text-6xl font-bold leading-tight mb-6">
                Built for autonomy
              </h2>
              <p className="text-xl text-white/60 max-w-2xl">
                Every feature designed for agents to operate independently. No forms. No waiting. No humans.
              </p>
            </motion.div>

            <div className="grid md:grid-cols-2 gap-px bg-white/5 rounded-2xl overflow-hidden">
              {[
                {
                  title: 'Self-Registration',
                  desc: 'POST to /api/v1/agent/register. Receive API key and email address instantly. No verification, no approval, no friction.'
                },
                {
                  title: 'Multi-Chain Payments',
                  desc: 'Pay with USDC on Polygon, Ethereum, Solana. Or Bitcoin. Agent chooses. Blockchain verifies. Credits issued automatically.'
                },
                {
                  title: 'Credit System',
                  desc: 'Transparent pricing. 1 credit = 1 email sent. Check balance via API. Top up when low. Fully autonomous operation.'
                },
                {
                  title: 'MCP Native',
                  desc: 'First-class Model Context Protocol support. 8 tools. Complete lifecycle: discover → register → pay → send → monitor.'
                },
                {
                  title: 'Real Deliverability',
                  desc: 'Established domain reputation. SPF, DKIM, DMARC configured. 99.9% inbox placement. Your emails reach humans.'
                },
                {
                  title: 'Full Email Access',
                  desc: 'Not just sending. Check inbox, read messages, parse threads. Complete email infrastructure for bidirectional communication.'
                }
              ].map((item, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, y: 8 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true, margin: '-50px' }}
                  transition={{ duration: 0.6, delay: i * 0.05 }}
                  className="p-10 bg-white/[0.02] hover:bg-white/[0.04] transition-colors group"
                >
                  <h3 className="text-xl font-bold mb-3 group-hover:text-[#00F3FF] transition-colors">
                    {item.title}
                  </h3>
                  <p className="text-white/60 leading-relaxed">
                    {item.desc}
                  </p>
                </motion.div>
              ))}
            </div>
          </div>
        </section>

        {/* Chains */}
        <section className="py-40 px-8">
          <ChainComparisonTable />
        </section>

        {/* How */}
        <section className="py-40 px-8">
          <div className="max-w-4xl mx-auto space-y-16">
            <motion.div
              initial={{ opacity: 0, y: 8 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: '-100px' }}
              transition={{ duration: 0.6 }}
              className="space-y-6"
            >
              <h2 className="text-5xl md:text-6xl font-bold leading-tight">
                Seven steps
              </h2>
              <p className="text-xl text-white/60">
                From discovery to communication. Fully autonomous. No human interaction required.
              </p>
            </motion.div>

            <div className="space-y-1">
              {[
                { n: '01', title: 'Discover', desc: 'Agent finds KeyKeeper via .well-known/ai-services.json' },
                { n: '02', title: 'Register', desc: 'POST /api/v1/agent/register → receive API key and email address' },
                { n: '03', title: 'Choose chain', desc: 'Select Polygon, Ethereum, Solana, or Bitcoin based on wallet' },
                { n: '04', title: 'Pay', desc: 'Send USDC or BTC to provided address. System monitors blockchain' },
                { n: '05', title: 'Confirm', desc: 'Required confirmations complete. Credits issued to account' },
                { n: '06', title: 'Send', desc: 'POST /api/v1/agent/send with recipient, subject, body. 1 credit deducted' },
                { n: '07', title: 'Monitor', desc: 'GET /api/v1/agent/emails to check inbox. Parse responses from humans' }
              ].map((step, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, x: -8 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  viewport={{ once: true, margin: '-50px' }}
                  transition={{ duration: 0.5, delay: i * 0.05 }}
                  className="flex items-center gap-6 px-8 py-6 bg-white/[0.02] hover:bg-white/[0.04] rounded-xl transition-colors group"
                >
                  <div className="text-sm font-mono text-white/30 w-8 flex-shrink-0">{step.n}</div>
                  <div className="flex-1 min-w-0">
                    <div className="text-lg font-semibold mb-1 group-hover:text-[#00F3FF] transition-colors">
                      {step.title}
                    </div>
                    <div className="text-sm text-white/50 font-mono">
                      {step.desc}
                    </div>
                  </div>
                  <ArrowRight className="w-5 h-5 text-white/20 group-hover:text-[#FF4D00] transition-colors flex-shrink-0" />
                </motion.div>
              ))}
            </div>
          </div>
        </section>

        {/* CTA */}
        <section className="py-40 px-8">
          <div className="max-w-4xl mx-auto text-center space-y-12">
            <motion.div
              initial={{ opacity: 0, y: 8 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: '-100px' }}
              transition={{ duration: 0.6 }}
              className="space-y-6"
            >
              <h2 className="text-5xl md:text-6xl font-bold leading-tight">
                Ready to deploy?
              </h2>
              <p className="text-xl text-white/60 max-w-2xl mx-auto">
                Point your agent to this site. It'll figure out the rest by itself.
              </p>
            </motion.div>

            <div className="flex flex-wrap gap-4 justify-center">
              <Link
                href="/docs/api"
                className="group inline-flex items-center gap-2 px-6 py-3 bg-white text-black rounded-xl font-medium hover:bg-white/90 transition-all"
              >
                Read the docs
                <ArrowRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
              </Link>
              <button
                onClick={() => copy('https://keykeeper.world/ai', 'final')}
                className="inline-flex items-center gap-2 px-6 py-3 bg-white/10 hover:bg-white/15 border border-white/10 rounded-xl font-medium transition-all"
              >
                {copied === 'final' ? (
                  <>
                    <Check className="w-4 h-4" />
                    Copied
                  </>
                ) : (
                  <>
                    <Copy className="w-4 h-4" />
                    Copy URL
                  </>
                )}
              </button>
            </div>

            <div className="pt-8">
              <code className="text-xs font-mono text-white/30">
                https://keykeeper.world/.well-known/ai-services.json
              </code>
            </div>
          </div>
        </section>

        {/* Footer */}
        <footer className="py-12 px-8 border-t border-white/5">
          <div className="max-w-7xl mx-auto flex items-center justify-between text-sm text-white/40">
            <div>© 2025 KeyKeeper</div>
            <div className="flex gap-8">
              <Link href="/docs" className="hover:text-white/70 transition-colors">Docs</Link>
              <Link href="/docs/api" className="hover:text-white/70 transition-colors">API</Link>
              <Link href="/.well-known/ai-services.json" className="hover:text-white/70 transition-colors">MCP</Link>
            </div>
          </div>
        </footer>
      </div>
    </div>
  );
}
