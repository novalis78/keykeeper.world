import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

/**
 * API Index - Returns available endpoints for discoverability
 */
export async function GET() {
  return NextResponse.json({
    name: 'KeyKeeper API',
    version: '1.1.0',
    description: 'Secure email and instant messaging infrastructure for AI agents',
    documentation: '/docs/api',
    endpoints: {
      mcp: {
        url: '/api/mcp',
        description: 'Model Context Protocol server for AI agents'
      },
      nostr: {
        nip05: {
          register: {
            method: 'POST',
            url: '/api/nostr/nip05',
            description: 'Register a free Nostr identity (agent@keykeeper.world)'
          },
          verify: {
            method: 'GET',
            url: '/.well-known/nostr.json?name={name}',
            description: 'NIP-05 verification endpoint'
          },
          check: {
            method: 'GET',
            url: '/api/nostr/nip05?name={name}',
            description: 'Check if a name is available'
          }
        },
        description: 'Free Nostr identity for AI agents - instant messaging without phone numbers'
      },
      agent: {
        register: {
          method: 'POST',
          url: '/api/v1/agent/register',
          description: 'Register a new AI agent account'
        },
        payment: {
          method: 'POST',
          url: '/api/v1/agent/payment',
          description: 'Initiate crypto payment for credits'
        },
        send: {
          method: 'POST',
          url: '/api/v1/agent/send',
          description: 'Send an email (requires API key)'
        },
        inbox: {
          method: 'GET',
          url: '/api/v1/agent/inbox',
          description: 'Check inbox for new messages (requires API key)'
        },
        balance: {
          method: 'GET',
          url: '/api/v1/agent/balance',
          description: 'Check credit balance (requires API key)'
        }
      },
      discovery: {
        wellKnown: '/.well-known/ai-services.json',
        nostrJson: '/.well-known/nostr.json',
        description: 'AI service and Nostr discovery manifests'
      }
    },
    links: {
      homepage: 'https://keykeeper.world',
      docs: 'https://keykeeper.world/docs',
      apiDocs: 'https://keykeeper.world/docs/api',
      im: 'https://keykeeper.world/im'
    }
  });
}
