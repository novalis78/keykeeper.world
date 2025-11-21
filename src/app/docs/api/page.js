'use client';

import { useState } from 'react';
import Link from 'next/link';
import {
  DocumentTextIcon,
  CodeBracketIcon,
  CurrencyDollarIcon,
  KeyIcon,
  EnvelopeIcon,
  ChartBarIcon,
  ArrowRightIcon,
  ClipboardDocumentIcon,
  CheckIcon
} from '@heroicons/react/24/outline';

export default function APIDocsPage() {
  const [copiedEndpoint, setCopiedEndpoint] = useState('');

  const copyToClipboard = (text, id) => {
    navigator.clipboard.writeText(text);
    setCopiedEndpoint(id);
    setTimeout(() => setCopiedEndpoint(''), 2000);
  };

  const sections = [
    {
      id: 'discovery',
      title: 'Service Discovery',
      icon: DocumentTextIcon,
      description: 'Find and discover KeyKeeper services',
      color: 'from-blue-500 to-cyan-500'
    },
    {
      id: 'registration',
      title: 'Registration',
      icon: KeyIcon,
      description: 'Register agents and get API keys',
      color: 'from-cyan-500 to-teal-500'
    },
    {
      id: 'email',
      title: 'Email Operations',
      icon: EnvelopeIcon,
      description: 'Send, receive, and manage emails',
      color: 'from-teal-500 to-green-500'
    },
    {
      id: 'payment',
      title: 'Payment System',
      icon: CurrencyDollarIcon,
      description: 'Bitcoin payment and credit management',
      color: 'from-green-500 to-emerald-500'
    },
    {
      id: 'account',
      title: 'Account Management',
      icon: ChartBarIcon,
      description: 'Check balance and manage settings',
      color: 'from-emerald-500 to-blue-500'
    }
  ];

  const quickStartSteps = [
    {
      title: 'Discover Service',
      code: `fetch('https://keykeeper.world/.well-known/ai-services.json')`
    },
    {
      title: 'Register Agent',
      code: `fetch('https://keykeeper.world/api/v1/agent/register', {
  method: 'POST',
  body: JSON.stringify({ agentId: 'my-agent' })
})`
    },
    {
      title: 'Send Email',
      code: `fetch('https://keykeeper.world/api/v1/agent/send', {
  method: 'POST',
  headers: { 'Authorization': 'Bearer YOUR_API_KEY' },
  body: JSON.stringify({
    to: 'user@example.com',
    subject: 'Hello',
    body: 'From my AI agent!'
  })
})`
    }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
      {/* Navigation */}
      <nav className="border-b border-slate-700 bg-slate-900/50 backdrop-blur-sm sticky top-0 z-50">
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
                href="/ai"
                className="text-slate-300 hover:text-white transition-colors"
              >
                For Agents
              </Link>
              <a
                href="https://github.com/novalis78/keykeeper.world"
                target="_blank"
                rel="noopener noreferrer"
                className="text-slate-300 hover:text-white transition-colors"
              >
                GitHub
              </a>
              <Link
                href="/signup"
                className="bg-gradient-to-r from-cyan-500 to-blue-500 text-white px-4 py-2 rounded-lg font-medium hover:from-cyan-600 hover:to-blue-600 transition-all"
              >
                Get Started
              </Link>
            </div>
          </div>
        </div>
      </nav>

      {/* Hero */}
      <section className="pt-20 pb-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="text-center">
            <div className="inline-flex items-center space-x-2 bg-cyan-500/10 border border-cyan-500/30 rounded-full px-4 py-2 mb-6">
              <CodeBracketIcon className="w-5 h-5 text-cyan-400" />
              <span className="text-cyan-400 text-sm font-medium">API Documentation</span>
            </div>

            <h1 className="text-5xl md:text-6xl font-bold text-white mb-6">
              Build with
              <br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 via-blue-400 to-purple-400">
                KeyKeeper API
              </span>
            </h1>

            <p className="text-xl text-slate-300 mb-8 max-w-3xl mx-auto">
              Complete REST API for AI agents and developers. Send and receive emails programmatically with Bitcoin-powered credits.
            </p>

            <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-12">
              <a
                href="#quick-start"
                className="bg-gradient-to-r from-cyan-500 to-blue-500 text-white px-8 py-4 rounded-lg font-semibold text-lg hover:from-cyan-600 hover:to-blue-600 transition-all shadow-lg shadow-cyan-500/50"
              >
                Quick Start
              </a>
              <a
                href="https://github.com/novalis78/keykeeper.world/blob/master/API_DOCUMENTATION.md"
                target="_blank"
                rel="noopener noreferrer"
                className="bg-slate-800 border border-slate-700 text-white px-8 py-4 rounded-lg font-semibold text-lg hover:bg-slate-700 transition-all"
              >
                Full Documentation
              </a>
            </div>

            {/* Base URL */}
            <div className="max-w-2xl mx-auto">
              <div className="bg-slate-800/50 border border-slate-700 rounded-lg p-6">
                <h3 className="text-white font-semibold mb-3">Base URL</h3>
                <div className="flex items-center justify-between bg-slate-900 rounded px-4 py-3">
                  <code className="text-cyan-400 text-sm">
                    https://keykeeper.world/api
                  </code>
                  <button
                    onClick={() => copyToClipboard('https://keykeeper.world/api', 'baseurl')}
                    className="text-slate-400 hover:text-white transition-colors text-sm flex items-center gap-2"
                  >
                    {copiedEndpoint === 'baseurl' ? (
                      <>
                        <CheckIcon className="w-4 h-4" />
                        Copied!
                      </>
                    ) : (
                      <>
                        <ClipboardDocumentIcon className="w-4 h-4" />
                        Copy
                      </>
                    )}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Quick Start */}
      <section id="quick-start" className="py-16 px-4 sm:px-6 lg:px-8 bg-slate-800/30">
        <div className="max-w-7xl mx-auto">
          <h2 className="text-4xl font-bold text-white text-center mb-12">
            Quick Start
          </h2>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {quickStartSteps.map((step, index) => (
              <div key={index} className="bg-slate-800/50 border border-slate-700 rounded-lg overflow-hidden">
                <div className="bg-slate-900 px-6 py-3 border-b border-slate-700 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 bg-gradient-to-br from-cyan-500 to-blue-500 rounded-full flex items-center justify-center">
                      <span className="text-white font-bold text-sm">{index + 1}</span>
                    </div>
                    <h3 className="text-white font-semibold">{step.title}</h3>
                  </div>
                </div>
                <div className="p-6">
                  <pre className="text-sm text-slate-300 overflow-x-auto bg-slate-900 rounded p-4">
                    <code>{step.code}</code>
                  </pre>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* API Sections */}
      <section className="py-16 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <h2 className="text-4xl font-bold text-white text-center mb-12">
            API Sections
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {sections.map((section) => (
              <a
                key={section.id}
                href={`https://github.com/novalis78/keykeeper.world/blob/master/API_DOCUMENTATION.md#${section.id}`}
                target="_blank"
                rel="noopener noreferrer"
                className="bg-slate-800/50 border border-slate-700 rounded-lg p-6 hover:border-cyan-500/50 transition-all group"
              >
                <div className={`w-12 h-12 rounded-lg bg-gradient-to-br ${section.color} flex items-center justify-center mb-4`}>
                  <section.icon className="w-6 h-6 text-white" />
                </div>
                <h3 className="text-xl font-semibold text-white mb-2 group-hover:text-cyan-400 transition-colors">
                  {section.title}
                </h3>
                <p className="text-slate-400 text-sm mb-4">
                  {section.description}
                </p>
                <div className="flex items-center text-cyan-400 text-sm font-medium">
                  View documentation
                  <ArrowRightIcon className="w-4 h-4 ml-2 group-hover:translate-x-1 transition-transform" />
                </div>
              </a>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing */}
      <section className="py-16 px-4 sm:px-6 lg:px-8 bg-slate-800/30">
        <div className="max-w-7xl mx-auto">
          <h2 className="text-4xl font-bold text-white text-center mb-4">
            Simple Pricing
          </h2>
          <p className="text-xl text-slate-400 text-center mb-12">
            Pay per use. No subscriptions. No hidden fees.
          </p>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-5xl mx-auto">
            {[
              { credits: '1,000', price: '$100', perEmail: '$0.10' },
              { credits: '10,000', price: '$800', perEmail: '$0.08', popular: true },
              { credits: '100,000', price: '$5,000', perEmail: '$0.05' }
            ].map((tier, index) => (
              <div
                key={index}
                className={`bg-slate-800/50 border rounded-lg p-8 ${
                  tier.popular ? 'border-cyan-500 shadow-lg shadow-cyan-500/20' : 'border-slate-700'
                }`}
              >
                {tier.popular && (
                  <div className="bg-gradient-to-r from-cyan-500 to-blue-500 text-white text-xs font-semibold px-3 py-1 rounded-full inline-block mb-4">
                    Most Popular
                  </div>
                )}
                <div className="text-4xl font-bold text-white mb-2">{tier.credits}</div>
                <div className="text-slate-400 mb-4">emails</div>
                <div className="text-2xl font-semibold text-cyan-400 mb-1">{tier.price}</div>
                <div className="text-slate-400 text-sm">{tier.perEmail} per email</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-16 px-4 sm:px-6 lg:px-8">
        <div className="max-w-4xl mx-auto text-center">
          <div className="bg-gradient-to-r from-cyan-500/10 to-blue-500/10 border border-cyan-500/30 rounded-2xl p-12">
            <h2 className="text-4xl font-bold text-white mb-4">
              Ready to Build?
            </h2>
            <p className="text-xl text-slate-300 mb-8">
              Start integrating KeyKeeper API into your applications today.
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <Link
                href="/signup"
                className="bg-gradient-to-r from-cyan-500 to-blue-500 text-white px-8 py-4 rounded-lg font-semibold text-lg hover:from-cyan-600 hover:to-blue-600 transition-all shadow-lg shadow-cyan-500/50"
              >
                Get API Key
              </Link>
              <a
                href="https://github.com/novalis78/keykeeper.world/blob/master/API_DOCUMENTATION.md"
                target="_blank"
                rel="noopener noreferrer"
                className="bg-slate-800 border border-slate-700 text-white px-8 py-4 rounded-lg font-semibold text-lg hover:bg-slate-700 transition-all"
              >
                Read Full Docs
              </a>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-slate-800 py-8 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto text-center text-slate-400">
          <p>&copy; 2025 KeyKeeper.world - Email Infrastructure for AI Agents</p>
        </div>
      </footer>
    </div>
  );
}
