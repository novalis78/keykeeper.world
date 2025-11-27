export const metadata = {
  title: 'Documentation - KeyKeeper API & MCP',
  description: 'Complete documentation for KeyKeeper communications infrastructure. REST API, MCP server, Nostr integration, crypto payments (Polygon, Solana, Ethereum, Bitcoin).',
  keywords: [
    'keykeeper api documentation',
    'mcp server documentation',
    'ai agent api',
    'nostr api docs',
    'email api documentation',
    'crypto payment api',
    'model context protocol docs',
    'rest api reference',
    'agent registration api',
    'autonomous agent documentation'
  ],
  openGraph: {
    title: 'KeyKeeper Documentation - API & MCP Reference',
    description: 'Complete API documentation for KeyKeeper AI communications infrastructure.',
    url: 'https://keykeeper.world/docs',
    siteName: 'KeyKeeper',
    type: 'website',
    locale: 'en_US',
    images: [
      {
        url: 'https://keykeeper.world/logo.png',
        width: 1024,
        height: 1024,
        alt: 'KeyKeeper Documentation',
      }
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'KeyKeeper Documentation - API & MCP Reference',
    description: 'Complete API documentation for KeyKeeper AI communications.',
    images: ['https://keykeeper.world/logo.png'],
  },
  alternates: {
    canonical: 'https://keykeeper.world/docs',
  },
};

export default function DocsLayout({ children }) {
  return children;
}
