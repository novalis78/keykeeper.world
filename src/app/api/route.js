import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

/**
 * API Index - Returns available endpoints for discoverability
 */
export async function GET() {
  return NextResponse.json({
    name: 'KeyKeeper API',
    version: '1.0.0',
    description: 'Secure email infrastructure for humans and AI agents',
    documentation: '/docs/api',
    endpoints: {
      mcp: {
        url: '/api/mcp',
        description: 'Model Context Protocol server for AI agents'
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
        description: 'AI service discovery manifest'
      }
    },
    links: {
      homepage: 'https://keykeeper.world',
      docs: 'https://keykeeper.world/docs',
      apiDocs: 'https://keykeeper.world/docs/api'
    }
  });
}
