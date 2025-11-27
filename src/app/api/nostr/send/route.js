import { NextResponse } from 'next/server';
import db from '@/lib/db';
import { nostrKeys, nostrMessages } from '@/lib/nostr/nostrDb';
import {
  generateKeypair,
  createDMEvent,
  publishEvent,
  resolveNip05,
  npubToHex,
  hexToNpub,
  DEFAULT_RELAYS
} from '@/lib/nostr/nostrService';

export const dynamic = 'force-dynamic';

// Daily free message limit
const FREE_DAILY_LIMIT = 100;

/**
 * POST /api/nostr/send - Send a Nostr DM
 *
 * Request body:
 * {
 *   "to": "alice@keykeeper.world" | "npub1..." | "hex-pubkey",
 *   "message": "Hello!",
 *   "api_key": "kk_..."
 * }
 */
export async function POST(request) {
  try {
    console.log('[NOSTR SEND] Starting request parsing...');
    // Work around Next.js request body caching issues by reading text first
    const rawBody = await request.text();
    console.log('[NOSTR SEND] Raw body:', rawBody);
    let body;
    try {
      body = JSON.parse(rawBody);
    } catch (parseError) {
      console.error('[NOSTR SEND] JSON parse error:', parseError.message);
      return NextResponse.json(
        { error: 'Invalid JSON in request body' },
        { status: 400 }
      );
    }
    console.log('[NOSTR SEND] Body parsed:', JSON.stringify(body));
    const { to, message, api_key } = body;

    // Validate required fields
    if (!to) {
      return NextResponse.json(
        { error: 'Missing required field: to' },
        { status: 400 }
      );
    }

    if (!message) {
      return NextResponse.json(
        { error: 'Missing required field: message' },
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

    // Check if user has a Nostr keypair, create one if not
    let keyData = await nostrKeys.getByUserId(user.id);

    if (!keyData) {
      // Generate new keypair for this user
      const keypair = generateKeypair();

      // Store the keypair
      await nostrKeys.create(
        user.id,
        keypair.publicKey,
        keypair.secretKeyHex
      );

      keyData = {
        pubkey: keypair.publicKey,
        secretKeyHex: keypair.secretKeyHex,
        messages_sent: 0
      };

      console.log(`Generated new Nostr keypair for user ${user.id}: ${keypair.npub}`);
    }

    // Check daily limit for free users
    // TODO: Add proper rate limiting with daily reset
    // For now, use messages_sent as a rough counter
    if (user.credits <= 0 && keyData.messages_sent >= FREE_DAILY_LIMIT) {
      return NextResponse.json(
        {
          error: 'Daily message limit reached',
          limit: FREE_DAILY_LIMIT,
          upgrade: 'Add credits to send unlimited messages'
        },
        { status: 429 }
      );
    }

    // Resolve recipient pubkey
    let recipientPubkey;

    if (to.includes('@')) {
      // NIP-05 identifier - pass db for local keykeeper.world lookups
      recipientPubkey = await resolveNip05(to, db);
      if (!recipientPubkey) {
        return NextResponse.json(
          { error: `Could not resolve NIP-05 identifier: ${to}` },
          { status: 400 }
        );
      }
    } else if (to.startsWith('npub')) {
      // npub format
      recipientPubkey = npubToHex(to);
    } else if (/^[0-9a-f]{64}$/i.test(to)) {
      // Already hex format
      recipientPubkey = to.toLowerCase();
    } else {
      return NextResponse.json(
        { error: 'Invalid recipient format. Use NIP-05 (user@domain), npub, or hex pubkey.' },
        { status: 400 }
      );
    }

    // Create and sign the DM event
    const event = await createDMEvent(keyData.secretKeyHex, recipientPubkey, message);

    // Publish to relays
    const publishResult = await publishEvent(event, DEFAULT_RELAYS);

    if (!publishResult.success) {
      console.error('Failed to publish to any relay:', publishResult.errors);
      return NextResponse.json(
        {
          error: 'Failed to publish message to relays',
          details: publishResult.errors
        },
        { status: 500 }
      );
    }

    // Store in message cache
    await nostrMessages.create({
      eventId: event.id,
      userId: user.id,
      senderPubkey: recipientPubkey, // For sent messages, sender is the recipient
      senderNip05: to.includes('@') ? to : null,
      content: message,
      direction: 'sent',
      createdAt: event.created_at
    });

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
      to: {
        pubkey: recipientPubkey,
        npub: hexToNpub(recipientPubkey),
        nip05: to.includes('@') ? to : null
      },
      relays_published: publishResult.relays,
      timestamp: event.created_at
    });

  } catch (error) {
    console.error('Error sending Nostr message:', error);
    return NextResponse.json(
      { error: 'Internal server error', details: error.message },
      { status: 500 }
    );
  }
}
