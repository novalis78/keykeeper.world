'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';

// Service icons as simple SVG components
const icons = {
  database: (
    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <ellipse cx="12" cy="5" rx="9" ry="3" />
      <path d="M21 12c0 1.66-4 3-9 3s-9-1.34-9-3" />
      <path d="M3 5v14c0 1.66 4 3 9 3s9-1.34 9-3V5" />
    </svg>
  ),
  'id-card': (
    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <rect x="2" y="5" width="20" height="14" rx="2" />
      <circle cx="8" cy="12" r="2" />
      <path d="M14 10h4M14 14h4" />
    </svg>
  ),
  relay: (
    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path d="M12 2L2 7l10 5 10-5-10-5z" />
      <path d="M2 17l10 5 10-5M2 12l10 5 10-5" />
    </svg>
  ),
  bridge: (
    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path d="M4 15s1-1 4-1 5 2 8 2 4-1 4-1V3s-1 1-4 1-5-2-8-2-4 1-4 1z" />
      <line x1="4" y1="22" x2="4" y2="15" />
      <line x1="20" y1="22" x2="20" y2="15" />
    </svg>
  ),
  email: (
    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" />
      <polyline points="22,6 12,13 2,6" />
    </svg>
  )
};

const statusColors = {
  operational: {
    bg: 'bg-green-500/20',
    border: 'border-green-500/30',
    text: 'text-green-400',
    dot: 'bg-green-500',
    glow: 'shadow-green-500/20'
  },
  degraded: {
    bg: 'bg-yellow-500/20',
    border: 'border-yellow-500/30',
    text: 'text-yellow-400',
    dot: 'bg-yellow-500',
    glow: 'shadow-yellow-500/20'
  },
  outage: {
    bg: 'bg-red-500/20',
    border: 'border-red-500/30',
    text: 'text-red-400',
    dot: 'bg-red-500',
    glow: 'shadow-red-500/20'
  }
};

const statusLabels = {
  operational: 'Operational',
  degraded: 'Degraded',
  outage: 'Outage'
};

function StatusDot({ status, pulse = false }) {
  const colors = statusColors[status] || statusColors.degraded;
  return (
    <span className="relative flex h-3 w-3">
      {pulse && status === 'operational' && (
        <span className={`animate-ping absolute inline-flex h-full w-full rounded-full ${colors.dot} opacity-75`}></span>
      )}
      <span className={`relative inline-flex rounded-full h-3 w-3 ${colors.dot}`}></span>
    </span>
  );
}

function ServiceCard({ service }) {
  const colors = statusColors[service.status] || statusColors.degraded;
  const Icon = icons[service.icon];

  return (
    <div className={`${colors.bg} ${colors.border} border rounded-2xl p-6 transition-all duration-300 hover:scale-[1.02] hover:shadow-lg ${colors.glow}`}>
      <div className="flex items-start justify-between mb-4">
        <div className={`${colors.text} p-3 rounded-xl ${colors.bg}`}>
          {Icon}
        </div>
        <div className="flex items-center gap-2">
          <StatusDot status={service.status} pulse={true} />
          <span className={`text-sm font-medium ${colors.text}`}>
            {statusLabels[service.status]}
          </span>
        </div>
      </div>

      <h3 className="text-lg font-semibold text-white mb-1">{service.name}</h3>
      <p className="text-white/50 text-sm mb-4">{service.description}</p>

      <div className="flex items-center justify-between text-xs text-white/40">
        <span>Response: {service.response_time_ms}ms</span>
        {service.details && (
          <span className="text-white/30">
            {service.details.registered_identities !== undefined && `${service.details.registered_identities} identities`}
            {service.details.url && service.details.url}
            {service.details.accounts !== undefined && `${service.details.accounts} accounts`}
          </span>
        )}
      </div>
    </div>
  );
}

function OverallStatus({ status, timestamp, responseTime }) {
  const colors = statusColors[status] || statusColors.degraded;
  const messages = {
    operational: 'All Systems Operational',
    degraded: 'Some Systems Degraded',
    outage: 'System Outage Detected'
  };

  return (
    <div className={`${colors.bg} ${colors.border} border rounded-3xl p-8 mb-8 text-center`}>
      <div className="flex items-center justify-center gap-3 mb-4">
        <StatusDot status={status} pulse={true} />
        <h1 className={`text-3xl font-bold ${colors.text}`}>
          {messages[status]}
        </h1>
      </div>
      <p className="text-white/50 text-sm">
        Last checked: {new Date(timestamp).toLocaleString()} ({responseTime}ms)
      </p>
    </div>
  );
}

export default function StatusPage() {
  const [statusData, setStatusData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [lastUpdated, setLastUpdated] = useState(null);

  const fetchStatus = async () => {
    try {
      const response = await fetch('/api/status');
      if (!response.ok) throw new Error('Failed to fetch status');
      const data = await response.json();
      setStatusData(data);
      setLastUpdated(new Date());
      setError(null);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStatus();
    // Refresh every 30 seconds
    const interval = setInterval(fetchStatus, 30000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-950 via-gray-900 to-gray-950">
      {/* Header */}
      <header className="border-b border-white/10">
        <div className="max-w-5xl mx-auto px-6 py-6 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-3 group">
            <div className="w-10 h-10 bg-gradient-to-br from-purple-500 to-violet-600 rounded-xl flex items-center justify-center">
              <span className="text-white font-bold text-lg">K</span>
            </div>
            <span className="text-white font-semibold text-xl group-hover:text-purple-400 transition-colors">
              KeyKeeper
            </span>
          </Link>
          <div className="flex items-center gap-4">
            <button
              onClick={fetchStatus}
              disabled={loading}
              className="px-4 py-2 bg-white/5 hover:bg-white/10 border border-white/10 rounded-lg text-sm text-white/70 hover:text-white transition-all disabled:opacity-50"
            >
              {loading ? 'Checking...' : 'Refresh'}
            </button>
            <Link
              href="/docs"
              className="px-4 py-2 bg-purple-500/20 hover:bg-purple-500/30 border border-purple-500/30 rounded-lg text-sm text-purple-300 hover:text-purple-200 transition-all"
            >
              Docs
            </Link>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-5xl mx-auto px-6 py-12">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-white mb-4">System Status</h1>
          <p className="text-white/50 max-w-2xl mx-auto">
            Real-time status of KeyKeeper services. We monitor all critical systems to ensure
            reliable communication infrastructure for humans and AI agents.
          </p>
        </div>

        {error && (
          <div className="bg-red-500/20 border border-red-500/30 rounded-2xl p-6 mb-8 text-center">
            <p className="text-red-400">Failed to load status: {error}</p>
            <button
              onClick={fetchStatus}
              className="mt-4 px-4 py-2 bg-red-500/20 hover:bg-red-500/30 border border-red-500/30 rounded-lg text-sm text-red-300"
            >
              Retry
            </button>
          </div>
        )}

        {loading && !statusData && (
          <div className="text-center py-20">
            <div className="inline-flex items-center gap-3 text-white/50">
              <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
              </svg>
              <span>Checking all services...</span>
            </div>
          </div>
        )}

        {statusData && (
          <>
            <OverallStatus
              status={statusData.status}
              timestamp={statusData.timestamp}
              responseTime={statusData.response_time_ms}
            />

            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {statusData.services.map((service, index) => (
                <ServiceCard key={index} service={service} />
              ))}
            </div>

            {/* Auto-refresh indicator */}
            <div className="mt-12 text-center text-white/30 text-sm">
              <p>Auto-refreshes every 30 seconds</p>
              {lastUpdated && (
                <p className="mt-1">
                  Last update: {lastUpdated.toLocaleTimeString()}
                </p>
              )}
            </div>
          </>
        )}

        {/* Service descriptions */}
        <div className="mt-16 border-t border-white/10 pt-12">
          <h2 className="text-2xl font-semibold text-white mb-6 text-center">Our Services</h2>
          <div className="grid md:grid-cols-2 gap-6 text-sm">
            <div className="bg-white/[0.02] border border-white/10 rounded-xl p-6">
              <h3 className="font-semibold text-white mb-2">For AI Agents</h3>
              <ul className="text-white/50 space-y-2">
                <li>Free Nostr identity (NIP-05)</li>
                <li>HTTP-to-Nostr bridge for messaging</li>
                <li>Email API with crypto payments</li>
                <li>MCP integration for Claude</li>
              </ul>
            </div>
            <div className="bg-white/[0.02] border border-white/10 rounded-xl p-6">
              <h3 className="font-semibold text-white mb-2">For Humans</h3>
              <ul className="text-white/50 space-y-2">
                <li>PGP-encrypted email</li>
                <li>Web-based inbox</li>
                <li>Nostr identity verification</li>
                <li>Privacy-focused (no tracking)</li>
              </ul>
            </div>
          </div>
        </div>

        {/* Links */}
        <div className="mt-12 flex flex-wrap justify-center gap-4 text-sm">
          <Link href="/" className="text-white/50 hover:text-white transition-colors">
            Home
          </Link>
          <span className="text-white/20">|</span>
          <Link href="/docs" className="text-white/50 hover:text-white transition-colors">
            Documentation
          </Link>
          <span className="text-white/20">|</span>
          <Link href="/docs/api" className="text-white/50 hover:text-white transition-colors">
            API Reference
          </Link>
          <span className="text-white/20">|</span>
          <a href="wss://relay.keykeeper.world" className="text-white/50 hover:text-white transition-colors">
            Nostr Relay
          </a>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-white/10 mt-20">
        <div className="max-w-5xl mx-auto px-6 py-8 text-center text-white/30 text-sm">
          <p>KeyKeeper.world - Communications Infrastructure for Humans & AI Agents</p>
        </div>
      </footer>
    </div>
  );
}
