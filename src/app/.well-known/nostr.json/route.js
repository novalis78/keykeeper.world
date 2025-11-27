import { NextResponse } from 'next/server';
import { query } from '@/lib/db';

export const dynamic = 'force-dynamic';

/**
 * NIP-05 Verification Endpoint
 *
 * Returns Nostr public keys for registered identities
 * https://github.com/nostr-protocol/nips/blob/master/05.md
 *
 * GET /.well-known/nostr.json?name=agentbob
 * Returns: {"names": {"agentbob": "<hex-pubkey>"}, "relays": {...}}
 */
export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const name = searchParams.get('name');

    // If no name specified, return all registered names (limited)
    if (!name) {
      const results = await query(
        'SELECT name, pubkey FROM nostr_identities ORDER BY created_at DESC LIMIT 100'
      );

      const names = {};
      for (const row of results) {
        names[row.name] = row.pubkey;
      }

      return NextResponse.json({
        names,
        relays: getDefaultRelays()
      }, {
        headers: getCorsHeaders()
      });
    }

    // Look up specific name
    const results = await query(
      'SELECT name, pubkey FROM nostr_identities WHERE name = ?',
      [name.toLowerCase()]
    );

    if (results.length === 0) {
      return NextResponse.json({
        names: {},
        relays: {}
      }, {
        status: 200, // NIP-05 spec says return empty, not 404
        headers: getCorsHeaders()
      });
    }

    const identity = results[0];

    return NextResponse.json({
      names: {
        [identity.name]: identity.pubkey
      },
      relays: {
        [identity.pubkey]: getRelaysForPubkey(identity.pubkey)
      }
    }, {
      headers: getCorsHeaders()
    });

  } catch (error) {
    console.error('[NIP-05] Error:', error);
    return NextResponse.json({
      names: {},
      error: 'Internal server error'
    }, {
      status: 500,
      headers: getCorsHeaders()
    });
  }
}

/**
 * Get default relays for KeyKeeper identities
 */
function getDefaultRelays() {
  return {
    // Will add our own relay in Phase 3
    // For now, recommend popular public relays
  };
}

/**
 * Get recommended relays for a specific pubkey
 */
function getRelaysForPubkey(pubkey) {
  return [
    'wss://relay.damus.io',
    'wss://nos.lol',
    'wss://relay.nostr.band'
    // Will add wss://relay.keykeeper.world in Phase 3
  ];
}

/**
 * CORS headers for NIP-05 (needs to be accessible from Nostr clients)
 */
function getCorsHeaders() {
  return {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Cache-Control': 'max-age=300' // Cache for 5 minutes
  };
}

/**
 * Handle CORS preflight
 */
export async function OPTIONS() {
  return new NextResponse(null, {
    status: 200,
    headers: getCorsHeaders()
  });
}
