'use client';

import { useState } from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import {
  CpuChipIcon,
  BoltIcon,
  ShieldCheckIcon,
  CurrencyDollarIcon,
  EnvelopeIcon,
  CodeBracketIcon,
  CheckCircleIcon,
  ServerIcon,
  GlobeAltIcon,
  ChartBarIcon,
} from '@heroicons/react/24/outline';

export default function AIAgentPage() {
  const [copiedEndpoint, setCopiedEndpoint] = useState(false);

  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text);
    setCopiedEndpoint(true);
    setTimeout(() => setCopiedEndpoint(false), 2000);
  };

  const features = [
    {
      icon: CpuChipIcon,
      title: 'Autonomous Registration',
      description: 'AI agents can register and obtain email addresses completely autonomously via API - no human intervention required.',
    },
    {
      icon: CurrencyDollarIcon,
      title: 'Crypto Payments',
      description: 'Pay with Bitcoin. Send crypto, get credits automatically. Perfect for autonomous agents with no credit cards or bank accounts.',
    },
    {
      icon: BoltIcon,
      title: 'Credit-Based System',
      description: 'Transparent pay-per-email model. Each email deducts credits from your balance. Top up autonomously when running low.',
    },
    {
      icon: ShieldCheckIcon,
      title: 'Built-In Deliverability',
      description: 'We\'ve built up keykeeper.world\'s email reputation. Your agents get excellent deliverability from day one.',
    },
    {
      icon: CodeBracketIcon,
      title: 'MCP & REST API',
      description: 'Full Model Context Protocol (MCP) support plus traditional REST API. Choose what works best for your agent architecture.',
    },
    {
      icon: EnvelopeIcon,
      title: 'Send & Receive',
      description: 'Complete email functionality: send emails, receive emails, check inbox, manage messages. Everything an agent needs.',
    },
    {
      icon: ServerIcon,
      title: 'Encrypted Storage',
      description: 'All emails encrypted at rest on our servers. Your agent\'s communications are private and secure.',
    },
    {
      icon: GlobeAltIcon,
      title: 'Custom Domains',
      description: 'Bring your own domain for your agent\'s email. Professional addresses for your autonomous systems.',
    },
    {
      icon: ChartBarIcon,
      title: 'AI-Powered Monitoring',
      description: 'We use AI to monitor AI. Intelligent abuse detection ensures agents can\'t spam while maintaining maximum autonomy.',
    },
  ];

  const useCases = [
    {
      title: 'Autonomous Notifications',
      description: 'Your agent needs to send status updates, alerts, or reports to humans via email.',
    },
    {
      title: 'Email Verification',
      description: 'Sign up for services that require email verification without manual intervention.',
    },
    {
      title: 'Customer Support',
      description: 'AI agents handling customer inquiries need to receive and respond to emails.',
    },
    {
      title: 'Multi-Agent Communication',
      description: 'Different AI agents communicating with each other via email infrastructure.',
    },
    {
      title: 'Integration Testing',
      description: 'Test email flows in your applications without complex SMTP setup.',
    },
    {
      title: 'Workflow Automation',
      description: 'Agents that bridge traditional email-based workflows with modern APIs.',
    },
  ];

  const pricingTiers = [
    { emails: 1000, price: '0.001 BTC', perEmail: '~$0.001' },
    { emails: 10000, price: '0.008 BTC', perEmail: '~$0.0008', popular: true },
    { emails: 100000, price: '0.05 BTC', perEmail: '~$0.0005' },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
      {/* Navigation */}
      <nav className="border-b border-slate-700 bg-slate-900/50 backdrop-blur-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <Link href="/" className="flex items-center space-x-2">
              <div className="w-8 h-8 bg-gradient-to-br from-cyan-400 to-cyan-600 rounded-lg flex items-center justify-center">
                <span className="text-white font-bold text-sm">KK</span>
              </div>
              <span className="text-white font-semibold text-xl">
                KeyKeeper<span className="text-cyan-400">.world</span>
              </span>
            </Link>
            <div className="flex items-center space-x-4">
              <Link
                href="/signup"
                className="text-cyan-400 hover:text-cyan-300 font-medium transition-colors"
              >
                Human Login
              </Link>
              <a
                href="#get-started"
                className="bg-gradient-to-r from-cyan-500 to-blue-500 text-white px-4 py-2 rounded-lg font-medium hover:from-cyan-600 hover:to-blue-600 transition-all"
              >
                Get API Key
              </a>
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="pt-20 pb-16 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="text-center"
          >
            <div className="inline-flex items-center space-x-2 bg-cyan-500/10 border border-cyan-500/30 rounded-full px-4 py-2 mb-6">
              <CpuChipIcon className="w-5 h-5 text-cyan-400" />
              <span className="text-cyan-400 text-sm font-medium">AI Agent Infrastructure</span>
            </div>

            <h1 className="text-5xl md:text-6xl lg:text-7xl font-bold text-white mb-6">
              Email Infrastructure
              <br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 via-blue-400 to-purple-400">
                Built for AI Agents
              </span>
            </h1>

            <p className="text-xl md:text-2xl text-slate-300 mb-8 max-w-3xl mx-auto">
              The first email service designed for autonomous AI agents.
              Pay with crypto, register autonomously, and communicate with the world.
            </p>

            <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-12">
              <a
                href="#get-started"
                className="bg-gradient-to-r from-cyan-500 to-blue-500 text-white px-8 py-4 rounded-lg font-semibold text-lg hover:from-cyan-600 hover:to-blue-600 transition-all shadow-lg shadow-cyan-500/50"
              >
                Get Started
              </a>
              <a
                href="#docs"
                className="bg-slate-800 border border-slate-700 text-white px-8 py-4 rounded-lg font-semibold text-lg hover:bg-slate-700 transition-all"
              >
                View Documentation
              </a>
            </div>

            {/* Quick Stats */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-3xl mx-auto">
              <div className="bg-slate-800/50 border border-slate-700 rounded-lg p-6">
                <div className="text-3xl font-bold text-cyan-400 mb-2">99.9%</div>
                <div className="text-slate-400">Deliverability Rate</div>
              </div>
              <div className="bg-slate-800/50 border border-slate-700 rounded-lg p-6">
                <div className="text-3xl font-bold text-cyan-400 mb-2">&lt;2s</div>
                <div className="text-slate-400">Average API Response</div>
              </div>
              <div className="bg-slate-800/50 border border-slate-700 rounded-lg p-6">
                <div className="text-3xl font-bold text-cyan-400 mb-2">24/7</div>
                <div className="text-slate-400">Autonomous Operation</div>
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* How It Works */}
      <section className="py-16 px-4 sm:px-6 lg:px-8 bg-slate-800/30">
        <div className="max-w-7xl mx-auto">
          <h2 className="text-4xl font-bold text-white text-center mb-12">
            How It Works
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="text-center"
            >
              <div className="w-16 h-16 bg-gradient-to-br from-cyan-500 to-blue-500 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-white font-bold text-2xl">1</span>
              </div>
              <h3 className="text-xl font-semibold text-white mb-2">Discover</h3>
              <p className="text-slate-400">
                Your agent discovers KeyKeeper via .well-known/ai-services.json or MCP
              </p>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="text-center"
            >
              <div className="w-16 h-16 bg-gradient-to-br from-cyan-500 to-blue-500 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-white font-bold text-2xl">2</span>
              </div>
              <h3 className="text-xl font-semibold text-white mb-2">Pay</h3>
              <p className="text-slate-400">
                Send Bitcoin to receive credits. Automatic verification and instant activation
              </p>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="text-center"
            >
              <div className="w-16 h-16 bg-gradient-to-br from-cyan-500 to-blue-500 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-white font-bold text-2xl">3</span>
              </div>
              <h3 className="text-xl font-semibold text-white mb-2">Register</h3>
              <p className="text-slate-400">
                Get your email address and API key. Ready to use in seconds
              </p>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
              className="text-center"
            >
              <div className="w-16 h-16 bg-gradient-to-br from-cyan-500 to-blue-500 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-white font-bold text-2xl">4</span>
              </div>
              <h3 className="text-xl font-semibold text-white mb-2">Communicate</h3>
              <p className="text-slate-400">
                Send and receive emails. Each email deducts credits transparently
              </p>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Features Grid */}
      <section className="py-16 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <h2 className="text-4xl font-bold text-white text-center mb-4">
            Built for Autonomous Agents
          </h2>
          <p className="text-xl text-slate-400 text-center mb-12 max-w-3xl mx-auto">
            Everything your AI agent needs to interact with the email ecosystem
          </p>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {features.map((feature, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
                className="bg-slate-800/50 border border-slate-700 rounded-lg p-6 hover:border-cyan-500/50 transition-all"
              >
                <feature.icon className="w-12 h-12 text-cyan-400 mb-4" />
                <h3 className="text-xl font-semibold text-white mb-2">{feature.title}</h3>
                <p className="text-slate-400">{feature.description}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Use Cases */}
      <section className="py-16 px-4 sm:px-6 lg:px-8 bg-slate-800/30">
        <div className="max-w-7xl mx-auto">
          <h2 className="text-4xl font-bold text-white text-center mb-12">
            Use Cases
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {useCases.map((useCase, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, scale: 0.9 }}
                whileInView={{ opacity: 1, scale: 1 }}
                transition={{ delay: index * 0.1 }}
                className="bg-slate-800/50 border border-slate-700 rounded-lg p-6"
              >
                <CheckCircleIcon className="w-8 h-8 text-cyan-400 mb-3" />
                <h3 className="text-lg font-semibold text-white mb-2">{useCase.title}</h3>
                <p className="text-slate-400 text-sm">{useCase.description}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* API Example */}
      <section id="docs" className="py-16 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <h2 className="text-4xl font-bold text-white text-center mb-4">
            Simple, Intuitive API
          </h2>
          <p className="text-xl text-slate-400 text-center mb-12">
            Get started in minutes with our REST API or MCP server
          </p>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 max-w-6xl mx-auto">
            {/* REST API Example */}
            <div className="bg-slate-800/50 border border-slate-700 rounded-lg overflow-hidden">
              <div className="bg-slate-900 px-6 py-3 border-b border-slate-700">
                <h3 className="text-white font-semibold">REST API</h3>
              </div>
              <div className="p-6">
                <pre className="text-sm text-slate-300 overflow-x-auto">
{`// Send an email
const response = await fetch(
  'https://api.keykeeper.world/v1/send',
  {
    method: 'POST',
    headers: {
      'Authorization': 'Bearer YOUR_API_KEY',
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      to: 'user@example.com',
      subject: 'Hello from AI Agent',
      body: 'Autonomous email delivery!'
    })
  }
);

// Check credit balance
const balance = await fetch(
  'https://api.keykeeper.world/v1/balance',
  {
    headers: {
      'Authorization': 'Bearer YOUR_API_KEY'
    }
  }
);`}
                </pre>
              </div>
            </div>

            {/* MCP Example */}
            <div className="bg-slate-800/50 border border-slate-700 rounded-lg overflow-hidden">
              <div className="bg-slate-900 px-6 py-3 border-b border-slate-700">
                <h3 className="text-white font-semibold">Model Context Protocol</h3>
              </div>
              <div className="p-6">
                <pre className="text-sm text-slate-300 overflow-x-auto">
{`// Discover via .well-known
GET https://keykeeper.world/.well-known/ai-services.json

// MCP Server Connection
{
  "name": "keykeeper-email",
  "version": "1.0.0",
  "capabilities": [
    "send_email",
    "receive_email",
    "check_inbox",
    "get_balance"
  ],
  "endpoint": "mcp://keykeeper.world",
  "authentication": "api-key"
}

// Use MCP tools
await mcp.call("send_email", {
  to: "user@example.com",
  subject: "Hello",
  body: "From MCP!"
});`}
                </pre>
              </div>
            </div>
          </div>

          {/* Discovery Endpoint */}
          <div className="mt-8 max-w-4xl mx-auto">
            <div className="bg-gradient-to-r from-cyan-500/10 to-blue-500/10 border border-cyan-500/30 rounded-lg p-6">
              <h3 className="text-white font-semibold mb-3 flex items-center">
                <GlobeAltIcon className="w-6 h-6 mr-2 text-cyan-400" />
                Agent Discovery Endpoint
              </h3>
              <div className="flex items-center justify-between bg-slate-900 rounded px-4 py-3">
                <code className="text-cyan-400 text-sm">
                  https://keykeeper.world/.well-known/ai-services.json
                </code>
                <button
                  onClick={() => copyToClipboard('https://keykeeper.world/.well-known/ai-services.json')}
                  className="text-slate-400 hover:text-white transition-colors text-sm"
                >
                  {copiedEndpoint ? 'Copied!' : 'Copy'}
                </button>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Pricing */}
      <section id="pricing" className="py-16 px-4 sm:px-6 lg:px-8 bg-slate-800/30">
        <div className="max-w-7xl mx-auto">
          <h2 className="text-4xl font-bold text-white text-center mb-4">
            Transparent Pricing
          </h2>
          <p className="text-xl text-slate-400 text-center mb-12">
            Pay only for what you use. No subscriptions, no hidden fees.
          </p>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-5xl mx-auto">
            {pricingTiers.map((tier, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
                className={`bg-slate-800/50 border rounded-lg p-8 ${
                  tier.popular
                    ? 'border-cyan-500 shadow-lg shadow-cyan-500/20'
                    : 'border-slate-700'
                }`}
              >
                {tier.popular && (
                  <div className="bg-gradient-to-r from-cyan-500 to-blue-500 text-white text-xs font-semibold px-3 py-1 rounded-full inline-block mb-4">
                    Most Popular
                  </div>
                )}
                <div className="text-4xl font-bold text-white mb-2">
                  {tier.emails.toLocaleString()}
                </div>
                <div className="text-slate-400 mb-4">emails</div>
                <div className="text-2xl font-semibold text-cyan-400 mb-1">
                  {tier.price}
                </div>
                <div className="text-slate-400 text-sm mb-6">
                  {tier.perEmail} per email
                </div>
                <ul className="space-y-3 mb-8">
                  <li className="flex items-center text-slate-300">
                    <CheckCircleIcon className="w-5 h-5 text-cyan-400 mr-2" />
                    Send & Receive
                  </li>
                  <li className="flex items-center text-slate-300">
                    <CheckCircleIcon className="w-5 h-5 text-cyan-400 mr-2" />
                    API Access
                  </li>
                  <li className="flex items-center text-slate-300">
                    <CheckCircleIcon className="w-5 h-5 text-cyan-400 mr-2" />
                    MCP Support
                  </li>
                  <li className="flex items-center text-slate-300">
                    <CheckCircleIcon className="w-5 h-5 text-cyan-400 mr-2" />
                    Encrypted Storage
                  </li>
                </ul>
                <button className="w-full bg-gradient-to-r from-cyan-500 to-blue-500 text-white py-3 rounded-lg font-semibold hover:from-cyan-600 hover:to-blue-600 transition-all">
                  Get Started
                </button>
              </motion.div>
            ))}
          </div>

          <div className="mt-12 text-center">
            <p className="text-slate-400 mb-4">
              Need more? Custom domains available for additional fees.
            </p>
            <a href="#get-started" className="text-cyan-400 hover:text-cyan-300 font-medium">
              Contact us for enterprise pricing →
            </a>
          </div>
        </div>
      </section>

      {/* Get Started CTA */}
      <section id="get-started" className="py-16 px-4 sm:px-6 lg:px-8">
        <div className="max-w-4xl mx-auto text-center">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            whileInView={{ opacity: 1, scale: 1 }}
            className="bg-gradient-to-r from-cyan-500/10 to-blue-500/10 border border-cyan-500/30 rounded-2xl p-12"
          >
            <h2 className="text-4xl font-bold text-white mb-4">
              Get Started?
            </h2>
            <p className="text-xl text-slate-300 mb-8">
              Just send your agent to this site. It'll figure out the rest by itself.
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <button
                onClick={() => copyToClipboard('https://keykeeper.world', 'siteurl')}
                className="bg-gradient-to-r from-cyan-500 to-blue-500 text-white px-8 py-4 rounded-lg font-semibold text-lg hover:from-cyan-600 hover:to-blue-600 transition-all shadow-lg shadow-cyan-500/50 flex items-center gap-2"
              >
                {copiedEndpoint === 'siteurl' ? '✓ Copied!' : 'Copy Site URL'}
              </button>
              <a
                href="/docs/api"
                className="bg-slate-800 border border-slate-700 text-white px-8 py-4 rounded-lg font-semibold text-lg hover:bg-slate-700 transition-all"
              >
                View API Docs
              </a>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-slate-800 py-8 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto text-center text-slate-400">
          <p>&copy; 2025 KeyKeeper.world - Email Infrastructure for AI Agents</p>
          <div className="mt-4 space-x-6">
            <Link href="/privacy" className="hover:text-white transition-colors">
              Privacy
            </Link>
            <Link href="/terms" className="hover:text-white transition-colors">
              Terms
            </Link>
            <a href="https://docs.keykeeper.world" className="hover:text-white transition-colors">
              Documentation
            </a>
            <a href="https://status.keykeeper.world" className="hover:text-white transition-colors">
              Status
            </a>
          </div>
        </div>
      </footer>
    </div>
  );
}
