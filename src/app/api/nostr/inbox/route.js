import { NextResponse } from 'next/server';
import db from '@/lib/db';
import { nostrKeys, nostrMessages } from '@/lib/nostr/nostrDb';
import {
  generateKeypair,
  fetchDMs,
  decryptDM,
  hexToNpub,
  resolveNip05,
  DEFAULT_RELAYS
} from '@/lib/nostr/nostrService';

export const dynamic = 'force-dynamic';

// Cache TTL in seconds - auto-refresh if older than this
const AUTO_REFRESH_TTL = 60;

/**
 * GET /api/nostr/inbox - Fetch Nostr DMs
 *
 * Query params:
 * - api_key: Required API key
 * - since: Unix timestamp to fetch messages since (optional)
 * - limit: Max messages to return (default 50, max 100)
 * - unread_only: Only return unread messages (optional, default false)
 * - refresh: Force refresh from relays (optional, default: auto based on TTL)
 * - cached_only: Skip relay refresh entirely (optional, default false)
 */
export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const apiKey = searchParams.get('api_key');
    const since = searchParams.get('since') ? parseInt(searchParams.get('since')) : null;
    const limit = Math.min(parseInt(searchParams.get('limit') || '50'), 100);
    const unreadOnly = searchParams.get('unread_only') === 'true';
    const cachedOnly = searchParams.get('cached_only') === 'true';
    // Default: refresh unless explicitly set to false or cached_only is true
    let refresh = searchParams.get('refresh') !== 'false' && !cachedOnly;

    // Validate API key
    if (!apiKey) {
      return NextResponse.json(
        { error: 'Missing required parameter: api_key' },
        { status: 400 }
      );
    }

    // Authenticate user
    const user = await db.users.findByApiKey(apiKey);
    if (!user) {
      return NextResponse.json(
        { error: 'Invalid API key' },
        { status: 401 }
      );
    }

    // Check if user has a Nostr keypair
    let keyData = await nostrKeys.getByUserId(user.id);

    if (!keyData) {
      // Generate new keypair for this user
      const keypair = generateKeypair();

      await nostrKeys.create(
        user.id,
        keypair.publicKey,
        keypair.secretKeyHex
      );

      keyData = {
        pubkey: keypair.publicKey,
        secretKeyHex: keypair.secretKeyHex,
        nip05_name: null
      };

      console.log(`Generated new Nostr keypair for user ${user.id}: ${keypair.npub}`);

      // No messages yet for a new keypair
      return NextResponse.json({
        messages: [],
        identity: {
          pubkey: keyData.pubkey,
          npub: hexToNpub(keyData.pubkey),
          nip05: null
        },
        new_keypair: true
      });
    }

    // Optionally refresh from relays
    if (refresh) {
      const latestTimestamp = await nostrMessages.getLatestTimestamp(user.id);
      const fetchSince = since || latestTimestamp || Math.floor(Date.now() / 1000) - 86400; // Default: last 24 hours

      try {
        const events = await fetchDMs(keyData.pubkey, fetchSince, DEFAULT_RELAYS);

        // Process and store new messages
        for (const event of events) {
          try {
            // Decrypt the message
            const decryptedContent = await decryptDM(
              keyData.secretKeyHex,
              event.pubkey,
              event.content
            );

            // Try to resolve sender's NIP-05
            // (This is expensive, so we might want to cache or skip)
            let senderNip05 = null;

            // Store in database
            await nostrMessages.create({
              eventId: event.id,
              userId: user.id,
              senderPubkey: event.pubkey,
              senderNip05: senderNip05,
              content: decryptedContent,
              direction: 'received',
              createdAt: event.created_at
            });

            // Increment received counter
            await nostrKeys.incrementMessageCount(user.id, 'received');

          } catch (decryptError) {
            console.error(`Failed to decrypt message ${event.id}:`, decryptError.message);
            // Skip messages we can't decrypt
          }
        }
      } catch (fetchError) {
        console.error('Error fetching from relays:', fetchError);
        // Continue with cached messages
      }
    }

    // Fetch messages from cache
    const messages = await nostrMessages.getInbox(user.id, {
      since,
      limit,
      unreadOnly
    });

    // Format response
    const formattedMessages = messages.map(msg => ({
      id: msg.id,
      event_id: msg.event_id,
      from: {
        pubkey: msg.sender_pubkey,
        npub: hexToNpub(msg.sender_pubkey),
        nip05: msg.sender_nip05
      },
      message: msg.content,
      timestamp: Math.floor(new Date(msg.created_at).getTime() / 1000),
      read: !!msg.read_at
    }));

    // Get rate limit info
    const messagesSentToday = keyData.messages_sent || 0;
    const dailyLimit = 100; // Free tier limit

    return NextResponse.json({
      messages: formattedMessages,
      identity: {
        pubkey: keyData.pubkey,
        npub: hexToNpub(keyData.pubkey),
        nip05: keyData.nip05_name ? `${keyData.nip05_name}@keykeeper.world` : null
      },
      count: formattedMessages.length,
      rate_limit: {
        messages_sent_today: messagesSentToday,
        daily_limit: dailyLimit,
        remaining: Math.max(0, dailyLimit - messagesSentToday)
      },
      refreshed_from_relays: refresh
    });

  } catch (error) {
    console.error('Error fetching Nostr inbox:', error);
    return NextResponse.json(
      { error: 'Internal server error', details: error.message },
      { status: 500 }
    );
  }
}

/**
 * POST /api/nostr/inbox - Mark messages as read
 *
 * Request body:
 * {
 *   "api_key": "kk_...",
 *   "message_ids": ["id1", "id2", ...]
 * }
 */
export async function POST(request) {
  try {
    const body = await request.json();
    const { api_key, message_ids } = body;

    if (!api_key) {
      return NextResponse.json(
        { error: 'Missing required field: api_key' },
        { status: 400 }
      );
    }

    if (!message_ids || !Array.isArray(message_ids) || message_ids.length === 0) {
      return NextResponse.json(
        { error: 'Missing or invalid field: message_ids (must be non-empty array)' },
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

    // Mark messages as read
    const markedCount = await nostrMessages.markRead(user.id, message_ids);

    return NextResponse.json({
      success: true,
      marked_read: markedCount
    });

  } catch (error) {
    console.error('Error marking messages as read:', error);
    return NextResponse.json(
      { error: 'Internal server error', details: error.message },
      { status: 500 }
    );
  }
}
