'use client';

import { useState, useEffect } from 'react';
import {
  UserCircleIcon,
  CreditCardIcon,
  GlobeAltIcon,
  KeyIcon,
  BellIcon,
  PaintBrushIcon,
  EnvelopeIcon,
  ShieldCheckIcon,
  CheckCircleIcon,
  XCircleIcon,
  ClipboardDocumentIcon,
  ArrowTopRightOnSquareIcon,
  PlusIcon,
  TrashIcon,
  CloudIcon,
  ExclamationTriangleIcon,
  SparklesIcon
} from '@heroicons/react/24/outline';
import { CheckIcon } from '@heroicons/react/24/solid';
import DashboardLayout from '../../../components/dashboard/DashboardLayout';

export default function SettingsPage() {
  const [activeSection, setActiveSection] = useState('account');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [user, setUser] = useState(null);
  const [subscription, setSubscription] = useState(null);
  const [domains, setDomains] = useState([]);
  const [showAddDomain, setShowAddDomain] = useState(false);
  const [newDomain, setNewDomain] = useState('');
  const [copiedField, setCopiedField] = useState(null);

  // Settings state
  const [settings, setSettings] = useState({
    name: '',
    email: '',
    autoEncrypt: true,
    attachPublicKey: true,
    darkMode: 'system',
    emailNotifications: true,
    securityAlerts: true
  });

  useEffect(() => {
    fetchUserData();
  }, []);

  const fetchUserData = async () => {
    try {
      const token = localStorage.getItem('auth_token');

      // Fetch user profile
      const profileRes = await fetch('/api/user/profile', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (profileRes.ok) {
        const profileData = await profileRes.json();
        setUser(profileData.user);
        setSettings(s => ({
          ...s,
          name: profileData.user?.name || '',
          email: profileData.user?.email || ''
        }));
      }

      // Fetch subscription status
      const subRes = await fetch('/api/user/subscription', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (subRes.ok) {
        const subData = await subRes.json();
        setSubscription(subData);
      }

      // Fetch user domains
      const domainsRes = await fetch('/api/user/domains', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (domainsRes.ok) {
        const domainsData = await domainsRes.json();
        setDomains(domainsData.domains || []);
      }

    } catch (error) {
      console.error('Error fetching user data:', error);
    } finally {
      setLoading(false);
    }
  };

  const copyToClipboard = (text, field) => {
    navigator.clipboard.writeText(text);
    setCopiedField(field);
    setTimeout(() => setCopiedField(null), 2000);
  };

  const handleAddDomain = async () => {
    if (!newDomain.trim()) return;

    try {
      const token = localStorage.getItem('auth_token');
      const res = await fetch('/api/user/domains', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ domain: newDomain.trim() })
      });

      if (res.ok) {
        const data = await res.json();
        setDomains([...domains, data.domain]);
        setNewDomain('');
        setShowAddDomain(false);
      }
    } catch (error) {
      console.error('Error adding domain:', error);
    }
  };

  const handleUpgrade = async (planId) => {
    try {
      const token = localStorage.getItem('auth_token');
      const res = await fetch('/api/stripe/checkout', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ planId })
      });

      if (res.ok) {
        const data = await res.json();
        window.location.href = data.url;
      }
    } catch (error) {
      console.error('Error creating checkout:', error);
    }
  };

  const sections = [
    { id: 'account', name: 'Account', icon: UserCircleIcon },
    { id: 'billing', name: 'Billing & Plans', icon: CreditCardIcon },
    { id: 'domains', name: 'Custom Domains', icon: GlobeAltIcon },
    { id: 'security', name: 'Security', icon: ShieldCheckIcon },
    { id: 'email', name: 'Email Preferences', icon: EnvelopeIcon },
    { id: 'notifications', name: 'Notifications', icon: BellIcon },
    { id: 'appearance', name: 'Appearance', icon: PaintBrushIcon },
  ];

  if (loading) {
    return (
      <DashboardLayout>
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary-500"></div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-white">Settings</h1>
          <p className="mt-2 text-gray-400">Manage your account, billing, and preferences</p>
        </div>

        <div className="flex flex-col lg:flex-row gap-8">
          {/* Sidebar Navigation */}
          <nav className="lg:w-64 flex-shrink-0">
            <div className="bg-gray-800/50 rounded-xl border border-gray-700/50 p-2">
              {sections.map((section) => (
                <button
                  key={section.id}
                  onClick={() => setActiveSection(section.id)}
                  className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-all ${
                    activeSection === section.id
                      ? 'bg-primary-600/20 text-primary-400 border border-primary-500/30'
                      : 'text-gray-400 hover:bg-gray-700/50 hover:text-white'
                  }`}
                >
                  <section.icon className="h-5 w-5" />
                  {section.name}
                </button>
              ))}
            </div>
          </nav>

          {/* Main Content */}
          <div className="flex-1 space-y-6">
            {/* Account Section */}
            {activeSection === 'account' && (
              <div className="space-y-6">
                <div className="bg-gray-800/50 rounded-xl border border-gray-700/50 p-6">
                  <h2 className="text-xl font-semibold text-white mb-6">Profile Information</h2>

                  <div className="flex items-start gap-6 mb-6">
                    <div className="h-20 w-20 bg-gradient-to-br from-primary-500 to-purple-600 rounded-full flex items-center justify-center text-white text-2xl font-bold">
                      {settings.name?.charAt(0)?.toUpperCase() || settings.email?.charAt(0)?.toUpperCase() || 'U'}
                    </div>
                    <div className="flex-1">
                      <h3 className="text-lg font-medium text-white">{settings.name || 'User'}</h3>
                      <p className="text-gray-400">{settings.email}</p>
                      <div className="mt-2 flex gap-2">
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-primary-500/20 text-primary-400 border border-primary-500/30">
                          {subscription?.subscription?.status === 'active' ? 'Pro' : 'Free Plan'}
                        </span>
                        {user?.hasPgpKeys && (
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-500/20 text-green-400 border border-green-500/30">
                            <KeyIcon className="h-3 w-3 mr-1" />
                            PGP Active
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-300 mb-2">Display Name</label>
                      <input
                        type="text"
                        value={settings.name}
                        onChange={(e) => setSettings({...settings, name: e.target.value})}
                        className="w-full bg-gray-900/50 border border-gray-700 rounded-lg px-4 py-2.5 text-white placeholder-gray-500 focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                        placeholder="Your name"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-300 mb-2">Email Address</label>
                      <input
                        type="email"
                        value={settings.email}
                        disabled
                        className="w-full bg-gray-900/30 border border-gray-700/50 rounded-lg px-4 py-2.5 text-gray-400 cursor-not-allowed"
                      />
                      <p className="mt-1.5 text-xs text-gray-500">Email is tied to your PGP identity and cannot be changed</p>
                    </div>
                  </div>
                </div>

                {/* PGP Key Info */}
                {user?.publicKey && (
                  <div className="bg-gray-800/50 rounded-xl border border-gray-700/50 p-6">
                    <h2 className="text-xl font-semibold text-white mb-4 flex items-center gap-2">
                      <KeyIcon className="h-5 w-5 text-primary-400" />
                      PGP Key
                    </h2>

                    <div className="grid grid-cols-2 gap-4 mb-4">
                      <div className="bg-gray-900/50 rounded-lg p-4">
                        <p className="text-xs text-gray-500 uppercase tracking-wide mb-1">Key ID</p>
                        <p className="text-sm font-mono text-white">{user.keyId || 'Not set'}</p>
                      </div>
                      <div className="bg-gray-900/50 rounded-lg p-4">
                        <p className="text-xs text-gray-500 uppercase tracking-wide mb-1">Fingerprint</p>
                        <p className="text-sm font-mono text-white truncate">{user.fingerprint || 'Not set'}</p>
                      </div>
                    </div>

                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <p className="text-sm font-medium text-gray-300">Public Key</p>
                        <button
                          onClick={() => copyToClipboard(user.publicKey, 'publicKey')}
                          className="inline-flex items-center gap-1.5 text-xs text-primary-400 hover:text-primary-300"
                        >
                          {copiedField === 'publicKey' ? (
                            <>
                              <CheckIcon className="h-4 w-4" />
                              Copied!
                            </>
                          ) : (
                            <>
                              <ClipboardDocumentIcon className="h-4 w-4" />
                              Copy
                            </>
                          )}
                        </button>
                      </div>
                      <textarea
                        readOnly
                        value={user.publicKey}
                        rows={4}
                        className="w-full bg-gray-900/50 border border-gray-700 rounded-lg px-4 py-3 text-xs font-mono text-gray-400"
                      />
                    </div>
                  </div>
                )}

                <div className="flex justify-end">
                  <button className="px-6 py-2.5 bg-primary-600 hover:bg-primary-500 text-white font-medium rounded-lg transition-colors">
                    Save Changes
                  </button>
                </div>
              </div>
            )}

            {/* Billing Section */}
            {activeSection === 'billing' && (
              <div className="space-y-6">
                {/* Current Plan */}
                <div className="bg-gray-800/50 rounded-xl border border-gray-700/50 p-6">
                  <h2 className="text-xl font-semibold text-white mb-6">Current Plan</h2>

                  <div className="flex items-center justify-between p-4 bg-gradient-to-r from-primary-600/20 to-purple-600/20 rounded-xl border border-primary-500/30">
                    <div>
                      <div className="flex items-center gap-2">
                        <SparklesIcon className="h-5 w-5 text-primary-400" />
                        <h3 className="text-lg font-semibold text-white">
                          {subscription?.subscription?.plan || 'Free'} Plan
                        </h3>
                      </div>
                      <p className="text-sm text-gray-400 mt-1">
                        {subscription?.subscription?.status === 'active'
                          ? `Renews ${new Date(subscription.subscription.expiresAt).toLocaleDateString()}`
                          : 'Upgrade to unlock more features'}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-2xl font-bold text-white">
                        {subscription?.usage?.emailsRemaining || 3}
                      </p>
                      <p className="text-xs text-gray-400">emails remaining today</p>
                    </div>
                  </div>

                  {/* Usage Bar */}
                  <div className="mt-4">
                    <div className="flex justify-between text-sm text-gray-400 mb-2">
                      <span>Daily Usage</span>
                      <span>{subscription?.usage?.emailsSentToday || 0} / {subscription?.usage?.emailLimit || 3}</span>
                    </div>
                    <div className="h-2 bg-gray-700 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-gradient-to-r from-primary-500 to-purple-500 rounded-full transition-all"
                        style={{
                          width: `${Math.min(100, ((subscription?.usage?.emailsSentToday || 0) / (subscription?.usage?.emailLimit || 3)) * 100)}%`
                        }}
                      />
                    </div>
                  </div>
                </div>

                {/* Pricing Plans */}
                <div className="bg-gray-800/50 rounded-xl border border-gray-700/50 p-6">
                  <h2 className="text-xl font-semibold text-white mb-6">Available Plans</h2>

                  <div className="grid md:grid-cols-3 gap-4">
                    {/* Personal Plan */}
                    <div className="relative bg-gray-900/50 rounded-xl border border-gray-700 p-6 hover:border-primary-500/50 transition-colors">
                      <h3 className="text-lg font-semibold text-white">Personal</h3>
                      <div className="mt-2">
                        <span className="text-3xl font-bold text-white">$2.99</span>
                        <span className="text-gray-400">/month</span>
                      </div>
                      <ul className="mt-4 space-y-2">
                        <li className="flex items-center gap-2 text-sm text-gray-300">
                          <CheckIcon className="h-4 w-4 text-green-400" />
                          100 emails per day
                        </li>
                        <li className="flex items-center gap-2 text-sm text-gray-300">
                          <CheckIcon className="h-4 w-4 text-green-400" />
                          1GB storage
                        </li>
                        <li className="flex items-center gap-2 text-sm text-gray-300">
                          <CheckIcon className="h-4 w-4 text-green-400" />
                          Full PGP encryption
                        </li>
                        <li className="flex items-center gap-2 text-sm text-gray-300">
                          <CheckIcon className="h-4 w-4 text-green-400" />
                          No branding
                        </li>
                      </ul>
                      <button
                        onClick={() => handleUpgrade('personal')}
                        className="mt-6 w-full py-2.5 bg-gray-700 hover:bg-gray-600 text-white font-medium rounded-lg transition-colors"
                      >
                        Upgrade
                      </button>
                    </div>

                    {/* Pro Plan */}
                    <div className="relative bg-gradient-to-b from-primary-900/30 to-gray-900/50 rounded-xl border-2 border-primary-500/50 p-6">
                      <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                        <span className="bg-primary-500 text-white text-xs font-medium px-3 py-1 rounded-full">
                          Most Popular
                        </span>
                      </div>
                      <h3 className="text-lg font-semibold text-white">Pro</h3>
                      <div className="mt-2">
                        <span className="text-3xl font-bold text-white">$6.99</span>
                        <span className="text-gray-400">/month</span>
                      </div>
                      <ul className="mt-4 space-y-2">
                        <li className="flex items-center gap-2 text-sm text-gray-300">
                          <CheckIcon className="h-4 w-4 text-green-400" />
                          500 emails per day
                        </li>
                        <li className="flex items-center gap-2 text-sm text-gray-300">
                          <CheckIcon className="h-4 w-4 text-green-400" />
                          5GB storage
                        </li>
                        <li className="flex items-center gap-2 text-sm text-gray-300">
                          <CheckIcon className="h-4 w-4 text-green-400" />
                          Custom domains
                        </li>
                        <li className="flex items-center gap-2 text-sm text-gray-300">
                          <CheckIcon className="h-4 w-4 text-green-400" />
                          API access
                        </li>
                      </ul>
                      <button
                        onClick={() => handleUpgrade('pro')}
                        className="mt-6 w-full py-2.5 bg-primary-600 hover:bg-primary-500 text-white font-medium rounded-lg transition-colors"
                      >
                        Upgrade to Pro
                      </button>
                    </div>

                    {/* Bitcoin Plan */}
                    <div className="relative bg-gray-900/50 rounded-xl border border-amber-500/30 p-6">
                      <div className="absolute -top-3 right-4">
                        <span className="bg-amber-500 text-black text-xs font-medium px-3 py-1 rounded-full flex items-center gap-1">
                          <svg viewBox="0 0 24 24" className="h-3 w-3" fill="currentColor">
                            <path d="M23.638 14.904c-1.602 6.43-8.113 10.34-14.542 8.736C2.67 22.05-1.244 15.525.362 9.105 1.962 2.67 8.475-1.243 14.9.358c6.43 1.605 10.342 8.115 8.738 14.548v-.002z"/>
                          </svg>
                          Bitcoin
                        </span>
                      </div>
                      <h3 className="text-lg font-semibold text-white">3-Year Deal</h3>
                      <div className="mt-2">
                        <span className="text-3xl font-bold text-white">$30</span>
                        <span className="text-gray-400"> one-time</span>
                      </div>
                      <p className="text-xs text-amber-400 mt-1">Just $0.83/month</p>
                      <ul className="mt-4 space-y-2">
                        <li className="flex items-center gap-2 text-sm text-gray-300">
                          <CheckIcon className="h-4 w-4 text-green-400" />
                          500 emails per day
                        </li>
                        <li className="flex items-center gap-2 text-sm text-gray-300">
                          <CheckIcon className="h-4 w-4 text-green-400" />
                          Maximum privacy
                        </li>
                        <li className="flex items-center gap-2 text-sm text-gray-300">
                          <CheckIcon className="h-4 w-4 text-green-400" />
                          No recurring charges
                        </li>
                      </ul>
                      <button
                        onClick={() => handleUpgrade('bitcoin')}
                        className="mt-6 w-full py-2.5 bg-amber-500 hover:bg-amber-400 text-black font-medium rounded-lg transition-colors"
                      >
                        Pay with Bitcoin
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Custom Domains Section */}
            {activeSection === 'domains' && (
              <div className="space-y-6">
                <div className="bg-gray-800/50 rounded-xl border border-gray-700/50 p-6">
                  <div className="flex items-center justify-between mb-6">
                    <div>
                      <h2 className="text-xl font-semibold text-white">Custom Domains</h2>
                      <p className="text-sm text-gray-400 mt-1">Add your own domain to send and receive emails</p>
                    </div>
                    <button
                      onClick={() => setShowAddDomain(true)}
                      className="inline-flex items-center gap-2 px-4 py-2.5 bg-primary-600 hover:bg-primary-500 text-white font-medium rounded-lg transition-colors"
                    >
                      <PlusIcon className="h-5 w-5" />
                      Add Domain
                    </button>
                  </div>

                  {/* Add Domain Modal/Form */}
                  {showAddDomain && (
                    <div className="mb-6 p-4 bg-gray-900/50 rounded-xl border border-gray-700">
                      <h3 className="text-lg font-medium text-white mb-4">Add a New Domain</h3>
                      <div className="flex gap-3">
                        <input
                          type="text"
                          value={newDomain}
                          onChange={(e) => setNewDomain(e.target.value)}
                          placeholder="yourdomain.com"
                          className="flex-1 bg-gray-800 border border-gray-700 rounded-lg px-4 py-2.5 text-white placeholder-gray-500 focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                        />
                        <button
                          onClick={handleAddDomain}
                          className="px-6 py-2.5 bg-primary-600 hover:bg-primary-500 text-white font-medium rounded-lg transition-colors"
                        >
                          Add
                        </button>
                        <button
                          onClick={() => setShowAddDomain(false)}
                          className="px-4 py-2.5 bg-gray-700 hover:bg-gray-600 text-white font-medium rounded-lg transition-colors"
                        >
                          Cancel
                        </button>
                      </div>
                    </div>
                  )}

                  {/* Domains List */}
                  {domains.length === 0 ? (
                    <div className="text-center py-12">
                      <GlobeAltIcon className="h-12 w-12 text-gray-600 mx-auto mb-4" />
                      <h3 className="text-lg font-medium text-white mb-2">No custom domains yet</h3>
                      <p className="text-gray-400 mb-6">Add a domain to start sending emails from your own address</p>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {domains.map((domain) => (
                        <DomainCard key={domain.id} domain={domain} onCopy={copyToClipboard} copiedField={copiedField} />
                      ))}
                    </div>
                  )}
                </div>

                {/* DNS Setup Instructions */}
                <div className="bg-gray-800/50 rounded-xl border border-gray-700/50 p-6">
                  <h2 className="text-xl font-semibold text-white mb-4">DNS Setup Guide</h2>
                  <p className="text-gray-400 mb-6">
                    To use your custom domain, add these DNS records to your domain registrar:
                  </p>

                  <div className="space-y-4">
                    <DNSRecordRow
                      type="MX"
                      name="@"
                      value="mail.keykeeper.world"
                      priority="10"
                      onCopy={copyToClipboard}
                      copiedField={copiedField}
                    />
                    <DNSRecordRow
                      type="TXT"
                      name="@"
                      value="v=spf1 include:keykeeper.world ~all"
                      onCopy={copyToClipboard}
                      copiedField={copiedField}
                    />
                    <DNSRecordRow
                      type="TXT"
                      name="_dmarc"
                      value="v=DMARC1; p=quarantine; rua=mailto:dmarc@keykeeper.world"
                      onCopy={copyToClipboard}
                      copiedField={copiedField}
                    />
                  </div>

                  {/* Cloudflare Integration */}
                  <div className="mt-8 p-4 bg-orange-500/10 border border-orange-500/30 rounded-xl">
                    <div className="flex items-start gap-4">
                      <CloudIcon className="h-8 w-8 text-orange-400 flex-shrink-0" />
                      <div>
                        <h3 className="text-lg font-medium text-white mb-2">Using Cloudflare?</h3>
                        <p className="text-sm text-gray-400 mb-4">
                          Connect your Cloudflare account to automatically configure DNS records.
                        </p>
                        <button className="inline-flex items-center gap-2 px-4 py-2 bg-orange-500 hover:bg-orange-400 text-white font-medium rounded-lg transition-colors">
                          <CloudIcon className="h-5 w-5" />
                          Connect Cloudflare
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Security Section */}
            {activeSection === 'security' && (
              <div className="space-y-6">
                <div className="bg-gray-800/50 rounded-xl border border-gray-700/50 p-6">
                  <h2 className="text-xl font-semibold text-white mb-6">Two-Factor Authentication</h2>

                  <div className="flex items-center justify-between p-4 bg-gray-900/50 rounded-xl">
                    <div className="flex items-center gap-4">
                      <div className="h-12 w-12 bg-green-500/20 rounded-full flex items-center justify-center">
                        <ShieldCheckIcon className="h-6 w-6 text-green-400" />
                      </div>
                      <div>
                        <h3 className="font-medium text-white">TOTP Authenticator</h3>
                        <p className="text-sm text-gray-400">Use an app like Google Authenticator</p>
                      </div>
                    </div>
                    <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-green-500/20 text-green-400">
                      {user?.totpEnabled ? 'Enabled' : 'Disabled'}
                    </span>
                  </div>
                </div>

                <div className="bg-gray-800/50 rounded-xl border border-gray-700/50 p-6">
                  <h2 className="text-xl font-semibold text-white mb-6">Active Sessions</h2>

                  <div className="space-y-3">
                    <div className="flex items-center justify-between p-4 bg-gray-900/50 rounded-xl">
                      <div className="flex items-center gap-4">
                        <div className="h-10 w-10 bg-primary-500/20 rounded-lg flex items-center justify-center">
                          <svg className="h-5 w-5 text-primary-400" fill="currentColor" viewBox="0 0 24 24">
                            <path d="M12 2C6.477 2 2 6.477 2 12s4.477 10 10 10 10-4.477 10-10S17.523 2 12 2z"/>
                          </svg>
                        </div>
                        <div>
                          <h3 className="font-medium text-white">Current Session</h3>
                          <p className="text-sm text-gray-400">Chrome on macOS</p>
                        </div>
                      </div>
                      <span className="text-xs text-green-400">Active now</span>
                    </div>
                  </div>

                  <button className="mt-4 text-sm text-red-400 hover:text-red-300">
                    Sign out all other sessions
                  </button>
                </div>
              </div>
            )}

            {/* Email Preferences */}
            {activeSection === 'email' && (
              <div className="space-y-6">
                <div className="bg-gray-800/50 rounded-xl border border-gray-700/50 p-6">
                  <h2 className="text-xl font-semibold text-white mb-6">Encryption Settings</h2>

                  <div className="space-y-4">
                    <ToggleSetting
                      title="Auto-encrypt emails"
                      description="Automatically encrypt emails when recipient's public key is available"
                      checked={settings.autoEncrypt}
                      onChange={(v) => setSettings({...settings, autoEncrypt: v})}
                    />
                    <ToggleSetting
                      title="Attach public key"
                      description="Include your public key as an attachment on outgoing emails"
                      checked={settings.attachPublicKey}
                      onChange={(v) => setSettings({...settings, attachPublicKey: v})}
                    />
                  </div>
                </div>

                <div className="bg-gray-800/50 rounded-xl border border-gray-700/50 p-6">
                  <h2 className="text-xl font-semibold text-white mb-6">Email Signature</h2>

                  <textarea
                    rows={4}
                    placeholder="Add your email signature..."
                    className="w-full bg-gray-900/50 border border-gray-700 rounded-lg px-4 py-3 text-white placeholder-gray-500 focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                    defaultValue="Best regards,&#10;&#10;Sent securely via KeyKeeper"
                  />
                </div>
              </div>
            )}

            {/* Notifications */}
            {activeSection === 'notifications' && (
              <div className="bg-gray-800/50 rounded-xl border border-gray-700/50 p-6">
                <h2 className="text-xl font-semibold text-white mb-6">Notification Preferences</h2>

                <div className="space-y-4">
                  <ToggleSetting
                    title="Email notifications"
                    description="Receive notifications about new emails"
                    checked={settings.emailNotifications}
                    onChange={(v) => setSettings({...settings, emailNotifications: v})}
                  />
                  <ToggleSetting
                    title="Security alerts"
                    description="Get notified about login attempts and security events"
                    checked={settings.securityAlerts}
                    onChange={(v) => setSettings({...settings, securityAlerts: v})}
                  />
                </div>
              </div>
            )}

            {/* Appearance */}
            {activeSection === 'appearance' && (
              <div className="bg-gray-800/50 rounded-xl border border-gray-700/50 p-6">
                <h2 className="text-xl font-semibold text-white mb-6">Theme</h2>

                <div className="grid grid-cols-3 gap-4">
                  {['light', 'dark', 'system'].map((theme) => (
                    <button
                      key={theme}
                      onClick={() => setSettings({...settings, darkMode: theme})}
                      className={`p-4 rounded-xl border-2 transition-all ${
                        settings.darkMode === theme
                          ? 'border-primary-500 bg-primary-500/10'
                          : 'border-gray-700 hover:border-gray-600'
                      }`}
                    >
                      <div className={`h-16 rounded-lg mb-3 ${
                        theme === 'light' ? 'bg-white' :
                        theme === 'dark' ? 'bg-gray-900' :
                        'bg-gradient-to-br from-white to-gray-900'
                      }`} />
                      <span className="text-sm font-medium text-white capitalize">{theme}</span>
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}

// Toggle Setting Component
function ToggleSetting({ title, description, checked, onChange }) {
  return (
    <div className="flex items-center justify-between p-4 bg-gray-900/50 rounded-xl">
      <div>
        <h3 className="font-medium text-white">{title}</h3>
        <p className="text-sm text-gray-400">{description}</p>
      </div>
      <button
        onClick={() => onChange(!checked)}
        className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
          checked ? 'bg-primary-600' : 'bg-gray-700'
        }`}
      >
        <span
          className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
            checked ? 'translate-x-6' : 'translate-x-1'
          }`}
        />
      </button>
    </div>
  );
}

// DNS Record Row Component
function DNSRecordRow({ type, name, value, priority, onCopy, copiedField }) {
  const fieldId = `${type}-${name}`;

  return (
    <div className="flex items-center gap-4 p-4 bg-gray-900/50 rounded-xl">
      <span className="px-3 py-1 bg-primary-500/20 text-primary-400 text-xs font-mono font-bold rounded">
        {type}
      </span>
      <div className="flex-1 grid grid-cols-3 gap-4">
        <div>
          <p className="text-xs text-gray-500 uppercase">Name</p>
          <p className="text-sm font-mono text-white">{name}</p>
        </div>
        <div className="col-span-2">
          <p className="text-xs text-gray-500 uppercase">Value</p>
          <p className="text-sm font-mono text-white truncate">{value}</p>
        </div>
      </div>
      {priority && (
        <div>
          <p className="text-xs text-gray-500 uppercase">Priority</p>
          <p className="text-sm font-mono text-white">{priority}</p>
        </div>
      )}
      <button
        onClick={() => onCopy(value, fieldId)}
        className="p-2 text-gray-400 hover:text-white rounded-lg hover:bg-gray-700 transition-colors"
      >
        {copiedField === fieldId ? (
          <CheckIcon className="h-5 w-5 text-green-400" />
        ) : (
          <ClipboardDocumentIcon className="h-5 w-5" />
        )}
      </button>
    </div>
  );
}

// Domain Card Component
function DomainCard({ domain, onCopy, copiedField }) {
  const isVerified = domain.verified;

  return (
    <div className="p-4 bg-gray-900/50 rounded-xl border border-gray-700">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <GlobeAltIcon className="h-5 w-5 text-gray-400" />
          <span className="font-medium text-white">{domain.name}</span>
        </div>
        <div className="flex items-center gap-2">
          {isVerified ? (
            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-500/20 text-green-400">
              <CheckCircleIcon className="h-4 w-4" />
              Verified
            </span>
          ) : (
            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-500/20 text-yellow-400">
              <ExclamationTriangleIcon className="h-4 w-4" />
              Pending DNS
            </span>
          )}
          <button className="p-1.5 text-gray-400 hover:text-red-400 rounded">
            <TrashIcon className="h-4 w-4" />
          </button>
        </div>
      </div>

      {!isVerified && (
        <div className="text-sm text-gray-400">
          <p className="mb-2">Add the following DNS records to verify your domain:</p>
          <button className="text-primary-400 hover:text-primary-300">
            View DNS records
          </button>
        </div>
      )}
    </div>
  );
}
