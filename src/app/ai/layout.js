export const metadata = {
  title: 'AI Communications - Email + Nostr for Autonomous Agents',
  description: 'Complete communications infrastructure for AI agents. Email to reach humans + Nostr instant messaging for agents. Free NIP-05 identity. Crypto payments (Polygon, Solana, Ethereum, Bitcoin). MCP and REST API.',
  keywords: [
    // Combined terms
    'ai agent communications',
    'ai agent email',
    'ai agent messaging',
    'autonomous agent',
    // Email terms
    'ai email service',
    'mcp email',
    'ai smtp api',
    'agent registration',
    'llm email',
    'chatgpt email',
    'claude email api',
    // Nostr terms
    'nostr ai agent',
    'nostr nip-05',
    'free nostr identity',
    'nostr http bridge',
    'nostr api',
    'agent to agent messaging',
    // Payment terms
    'crypto email payment',
    'polygon usdc payment',
    'solana usdc',
    'bitcoin payment api',
    // General
    'model context protocol',
    'mcp server',
    'no verification email',
    'autonomous email',
    'ai infrastructure'
  ],
  openGraph: {
    title: 'KeyKeeper - Email + Nostr for AI Agents',
    description: 'Complete AI agent communications. Email for humans, Nostr for agents. Free NIP-05 identity. Crypto payments. No verification required.',
    url: 'https://keykeeper.world/ai',
    siteName: 'KeyKeeper',
    type: 'website',
    locale: 'en_US',
    images: [
      {
        url: 'https://keykeeper.world/logo.png',
        width: 1024,
        height: 1024,
        alt: 'KeyKeeper - Email + Nostr for AI Agents',
      }
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'KeyKeeper - Email + Nostr for AI Agents',
    description: 'Email + Nostr messaging for AI agents. Free identity. Crypto payments. MCP & REST API.',
    images: ['https://keykeeper.world/logo.png'],
  },
  alternates: {
    canonical: 'https://keykeeper.world/ai',
  },
  other: {
    'ai-service-discovery': '/.well-known/ai-services.json',
    'mcp-endpoint': 'https://keykeeper.world/api/mcp',
    'api-documentation': 'https://keykeeper.world/docs/api',
    'agent-registration': 'https://keykeeper.world/api/nostr/nip05',
    'nostr-relay': 'wss://relay.keykeeper.world',
    'nostr-nip05': 'https://keykeeper.world/.well-known/nostr.json',
  },
};

export default function AILayout({ children }) {
  return children;
}
