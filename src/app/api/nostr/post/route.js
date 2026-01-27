import { NextResponse } from 'next/server';
import db from '@/lib/db';
import { nostrKeys } from '@/lib/nostr/nostrDb';
import {
  publishEvent,
  hexToNpub,
  DEFAULT_RELAYS
} from '@/lib/nostr/nostrService';
import { finalizeEvent } from 'nostr-tools';

export const dynamic = 'force-dynamic';

/**
 * POST /api/nostr/post - Publish a public Nostr note (kind 1)
 *
 * Request body:
 * {
 *   "content": "Hello world!",
 *   "api_key": "kk_..."
 * }
 */
export async function POST(request) {
  try {
    const rawBody = await request.text();
    let body;
    try {
      body = JSON.parse(rawBody);
    } catch (parseError) {
      return NextResponse.json(
        { error: 'Invalid JSON in request body' },
        { status: 400 }
      );
    }

    const { content, api_key } = body;

    if (!content) {
      return NextResponse.json(
        { error: 'Missing required field: content' },
        { status: 400 }
      );
    }

    if (!api_key) {
      return NextResponse.json(
        { error: 'Missing required field: api_key' },
        { status: 400 }
      );
    }

    // Authenticate user
    const user = await db.users.findByApiKey(api_key);
    if (!user) {
      return NextResponse.json(
        { error: 'Invalid API key' },
        { status: 401 }
      );
    }

    // Get user's Nostr keypair
    let keyData = await nostrKeys.getByUserId(user.id);
    if (!keyData) {
      return NextResponse.json(
        { error: 'No Nostr identity found. Send a DM first to create one.' },
        { status: 400 }
      );
    }

    // Create kind 1 (text note) event
    const secretKey = Uint8Array.from(Buffer.from(keyData.secretKeyHex, 'hex'));
    
    const eventTemplate = {
      kind: 1,
      created_at: Math.floor(Date.now() / 1000),
      tags: [],
      content: content
    };

    const event = finalizeEvent(eventTemplate, secretKey);

    // Publish to relays
    const publishResult = await publishEvent(event, DEFAULT_RELAYS);

    if (!publishResult.success) {
      console.error('Failed to publish to any relay:', publishResult.errors);
      return NextResponse.json(
        {
          error: 'Failed to publish note to relays',
          details: publishResult.errors
        },
        { status: 500 }
      );
    }

    // Increment message counter
    await nostrKeys.incrementMessageCount(user.id, 'sent');

    return NextResponse.json({
      success: true,
      event_id: event.id,
      from: {
        pubkey: keyData.pubkey,
        npub: hexToNpub(keyData.pubkey),
        nip05: keyData.nip05_name ? `${keyData.nip05_name}@keykeeper.world` : null
      },
      content: content,
      relays_published: publishResult.relays,
      timestamp: event.created_at,
      note_url: `https://njump.me/${event.id}`
    });

  } catch (error) {
    console.error('Error posting Nostr note:', error);
    return NextResponse.json(
      { error: 'Internal server error', details: error.message },
      { status: 500 }
    );
  }
}
