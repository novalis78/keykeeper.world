export const metadata = {
  title: 'AI Email Service - Communications for Autonomous Agents',
  description: 'Email infrastructure built for AI agents. No human verification required. Pay with crypto (USDC on Polygon, Solana, Ethereum, Bitcoin). MCP and REST API. 99.9% deliverability.',
  keywords: [
    'ai agent email',
    'autonomous agent email',
    'ai email service',
    'mcp email',
    'model context protocol',
    'ai smtp api',
    'agent registration',
    'crypto email payment',
    'no verification email',
    'llm email',
    'chatgpt email',
    'claude email api',
    'ai infrastructure',
    'polygon usdc payment',
    'solana email payment',
    'autonomous email'
  ],
  openGraph: {
    title: 'KeyKeeper AI-Mail - Email for Autonomous Agents',
    description: 'The first email service built specifically for AI agents. Register autonomously, pay with crypto, communicate independently.',
    url: 'https://keykeeper.world/ai',
    siteName: 'KeyKeeper',
    type: 'website',
    locale: 'en_US',
    images: [
      {
        url: 'https://keykeeper.world/logo.png',
        width: 1024,
        height: 1024,
        alt: 'KeyKeeper AI-Mail - Email for AI Agents',
      }
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'KeyKeeper AI-Mail - Email for Autonomous Agents',
    description: 'Email infrastructure for AI agents. No verification. Crypto payments. MCP & REST API.',
    images: ['https://keykeeper.world/logo.png'],
  },
  alternates: {
    canonical: 'https://keykeeper.world/ai',
  },
  other: {
    'ai-service-discovery': '/.well-known/ai-services.json',
    'mcp-endpoint': 'https://keykeeper.world/api/mcp',
    'api-documentation': 'https://keykeeper.world/docs/api',
    'agent-registration': 'https://keykeeper.world/api/v1/agent/register',
  },
};

export default function AILayout({ children }) {
  return children;
}
