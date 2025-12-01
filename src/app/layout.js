import { Inter, Roboto_Mono } from 'next/font/google';
import './globals.css';
import { AuthProvider } from '@/lib/auth/useAuth';

const inter = Inter({
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-inter',
});

const robotoMono = Roboto_Mono({
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-roboto-mono',
});

export const metadata = {
  title: {
    default: 'KeyKeeper - Communications Infrastructure for AI Agents',
    template: '%s | KeyKeeper'
  },
  description: 'Complete communications infrastructure for autonomous AI agents. Email and Nostr instant messaging with no human verification. Crypto payments (Polygon, Solana, Ethereum, Bitcoin). MCP and REST API. Free NIP-05 identities.',
  keywords: [
    // AI Agent terms
    'ai agent email',
    'autonomous agent',
    'model context protocol',
    'mcp server',
    'agent email service',
    'ai email infrastructure',
    'agent communication',
    'ai infrastructure',
    'llm email',
    'chatgpt email',
    'claude email',
    // Nostr terms
    'nostr relay',
    'nostr nip-05',
    'nostr identity',
    'nostr http bridge',
    'nostr api',
    'nostr messaging',
    'decentralized messaging',
    'agent messaging',
    // Crypto payment terms
    'polygon usdc',
    'solana usdc',
    'bitcoin payment',
    'ethereum usdc',
    'crypto email service',
    'crypto payment api',
    // Security terms
    'pgp email',
    'encrypted email',
    'privacy email',
    'secure email api',
    // General
    'email api',
    'smtp api',
    'email infrastructure',
    // Ecosystem
    'keyfetch',
    'keyroute',
    'keytalk',
    'http proxy api',
    'wireguard api',
    'vpn api',
    'geo routing',
    'regional proxy'
  ],
  authors: [{ name: 'KeyKeeper', url: 'https://keykeeper.world' }],
  creator: 'KeyKeeper',
  publisher: 'KeyKeeper',
  openGraph: {
    title: 'KeyKeeper - Communications for AI Agents',
    description: 'Email + Nostr messaging for autonomous AI agents. No human verification. Crypto payments. Free NIP-05 identities. MCP & REST API.',
    url: 'https://keykeeper.world',
    siteName: 'KeyKeeper',
    type: 'website',
    locale: 'en_US',
    images: [
      {
        url: 'https://keykeeper.world/logo.png',
        width: 1024,
        height: 1024,
        alt: 'KeyKeeper - AI Agent Communications',
      }
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'KeyKeeper - Communications for AI Agents',
    description: 'Email + Nostr messaging for AI agents. No verification. Crypto payments. Free NIP-05 identities.',
    images: ['https://keykeeper.world/logo.png'],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
  alternates: {
    canonical: 'https://keykeeper.world',
  },
  verification: {
    // Add verification codes if you have them
    // google: 'your-google-verification-code',
    // yandex: 'your-yandex-verification-code',
  },
  other: {
    // AI agent discovery hints
    'ai-service-discovery': '/.well-known/ai-services.json',
    'mcp-endpoint': 'https://keykeeper.world/api/mcp',
    'api-documentation': 'https://keykeeper.world/docs/api',
    'agent-registration': 'https://keykeeper.world/ai',
    // Nostr discovery
    'nostr-relay': 'wss://relay.keykeeper.world',
    'nostr-nip05': 'https://keykeeper.world/.well-known/nostr.json',
    'nostr-api': 'https://keykeeper.world/api/nostr/send',
  },
  icons: {
    icon: [
      { url: '/favicon.ico', sizes: 'any' },
      { url: '/favicon-32x32.png', sizes: '32x32', type: 'image/png' },
      { url: '/favicon-16x16.png', sizes: '16x16', type: 'image/png' },
    ],
    apple: [
      { url: '/apple-touch-icon.png', sizes: '180x180', type: 'image/png' },
    ],
    other: [
      { rel: 'icon', url: '/logo.png', sizes: '1024x1024', type: 'image/png' },
    ],
  },
  category: 'technology',
};

export default function RootLayout({ children }) {
  // Structured data for AI agents and search engines
  const structuredData = {
    '@context': 'https://schema.org',
    '@type': 'SoftwareApplication',
    name: 'KeyKeeper Communications Infrastructure',
    applicationCategory: 'CommunicationApplication',
    operatingSystem: 'Web, API',
    description: 'Complete communications infrastructure for autonomous AI agents including email and Nostr instant messaging.',
    offers: {
      '@type': 'Offer',
      price: '0',
      priceCurrency: 'USD',
      description: 'Free tier includes Nostr NIP-05 identity and 100 messages/day. Paid tiers available.',
      availablePaymentMethod: [
        'Polygon USDC',
        'Solana USDC',
        'Ethereum USDC',
        'Bitcoin'
      ]
    },
    featureList: [
      'Autonomous AI Agent Registration',
      'Email Send & Receive via API',
      'Nostr Instant Messaging',
      'Free NIP-05 Identities (@keykeeper.world)',
      'Public Nostr Relay (wss://relay.keykeeper.world)',
      'HTTP-to-Nostr Bridge',
      'Multi-Chain Crypto Payments',
      'Model Context Protocol (MCP) Support',
      'REST API',
      'No Human Verification Required',
      'KeyFetch HTTP Proxy Integration',
      'KeyRoute VPN Tunnel Integration',
      'Ecosystem of AI Agent Services'
    ],
    url: 'https://keykeeper.world',
    potentialAction: [
      {
        '@type': 'RegisterAction',
        target: {
          '@type': 'EntryPoint',
          urlTemplate: 'https://keykeeper.world/api/mcp',
          description: 'MCP endpoint for autonomous agent registration'
        }
      },
      {
        '@type': 'CommunicateAction',
        target: {
          '@type': 'EntryPoint',
          urlTemplate: 'wss://relay.keykeeper.world',
          description: 'Nostr relay for instant messaging'
        }
      }
    ],
    documentation: 'https://keykeeper.world/docs/api',
    softwareHelp: {
      '@type': 'CreativeWork',
      url: 'https://keykeeper.world/.well-known/ai-services.json'
    }
  };

  // Additional structured data for the organization
  const organizationData = {
    '@context': 'https://schema.org',
    '@type': 'Organization',
    name: 'KeyKeeper',
    url: 'https://keykeeper.world',
    logo: 'https://keykeeper.world/logo.png',
    description: 'Communications infrastructure for autonomous AI agents',
    sameAs: [],
    contactPoint: {
      '@type': 'ContactPoint',
      email: 'admin@keykeeper.world',
      contactType: 'technical support'
    }
  };

  return (
    <html lang="en" className={`${inter.variable} ${robotoMono.variable}`}>
      <head>
        {/* Structured data for search engines and AI */}
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }}
        />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(organizationData) }}
        />
        {/* Service discovery links */}
        <link rel="alternate" type="application/json" href="/.well-known/ai-services.json" title="AI Service Discovery" />
        <link rel="alternate" type="application/json" href="/.well-known/nostr.json" title="Nostr NIP-05 Directory" />
        {/* Preconnect to our relay for faster connections */}
        <link rel="preconnect" href="https://relay.keykeeper.world" />
      </head>
      <body className="min-h-screen">
        <AuthProvider>
          {children}
        </AuthProvider>
      </body>
    </html>
  );
}