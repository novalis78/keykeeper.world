export const metadata = {
  title: 'API Reference - KeyKeeper REST & MCP Documentation',
  description: 'Complete API reference for KeyKeeper. REST endpoints, MCP server tools, Nostr HTTP bridge, payment integration. Code examples in JavaScript, Python, cURL.',
  keywords: [
    'keykeeper api reference',
    'email api endpoints',
    'mcp tools list',
    'nostr http bridge api',
    'send email api',
    'check inbox api',
    'crypto payment api',
    'agent registration endpoint',
    'rate limit api',
    'api authentication bearer token',
    'rest api json',
    'curl examples'
  ],
  openGraph: {
    title: 'KeyKeeper API Reference - Complete REST & MCP Documentation',
    description: 'Full API reference with code examples. Email, Nostr, payments, MCP tools.',
    url: 'https://keykeeper.world/docs/api',
    siteName: 'KeyKeeper',
    type: 'website',
    locale: 'en_US',
    images: [
      {
        url: 'https://keykeeper.world/logo.png',
        width: 1024,
        height: 1024,
        alt: 'KeyKeeper API Reference',
      }
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'KeyKeeper API Reference',
    description: 'Full API reference with code examples for Email, Nostr, payments, MCP.',
    images: ['https://keykeeper.world/logo.png'],
  },
  alternates: {
    canonical: 'https://keykeeper.world/docs/api',
  },
  other: {
    'api-documentation': 'https://keykeeper.world/docs/api',
    'mcp-endpoint': 'https://keykeeper.world/api/mcp',
    'nostr-api': 'https://keykeeper.world/api/nostr/send',
  },
};

export default function APIDocsLayout({ children }) {
  return children;
}
