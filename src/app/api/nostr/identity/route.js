import { NextResponse } from 'next/server';
import db, { query, generateUuid } from '@/lib/db';
import { nostrKeys } from '@/lib/nostr/nostrDb';
import { generateKeypair, hexToNpub } from '@/lib/nostr/nostrService';

export const dynamic = 'force-dynamic';

/**
 * GET /api/nostr/identity - Get agent's Nostr identity
 *
 * Query params:
 * - api_key: Required API key
 */
export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const apiKey = searchParams.get('api_key');

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

    // Get or create keypair
    let keyData = await nostrKeys.getByUserId(user.id);

    if (!keyData) {
      // Generate new keypair
      const keypair = generateKeypair();

      await nostrKeys.create(
        user.id,
        keypair.publicKey,
        keypair.secretKeyHex
      );

      keyData = {
        pubkey: keypair.publicKey,
        nip05_name: null,
        messages_sent: 0,
        messages_received: 0,
        created_at: new Date()
      };
    }

    return NextResponse.json({
      pubkey: keyData.pubkey,
      npub: hexToNpub(keyData.pubkey),
      nip05: keyData.nip05_name ? `${keyData.nip05_name}@keykeeper.world` : null,
      stats: {
        messages_sent: keyData.messages_sent || 0,
        messages_received: keyData.messages_received || 0
      },
      created_at: keyData.created_at
    });

  } catch (error) {
    console.error('Error getting Nostr identity:', error);
    return NextResponse.json(
      { error: 'Internal server error', details: error.message },
      { status: 500 }
    );
  }
}

/**
 * POST /api/nostr/identity - Claim a NIP-05 name for agent's Nostr identity
 *
 * Request body:
 * {
 *   "api_key": "kk_...",
 *   "name": "myagent"  // Will become myagent@keykeeper.world
 * }
 */
export async function POST(request) {
  try {
    const body = await request.json();
    const { api_key, name } = body;

    if (!api_key) {
      return NextResponse.json(
        { error: 'Missing required field: api_key' },
        { status: 400 }
      );
    }

    if (!name) {
      return NextResponse.json(
        { error: 'Missing required field: name' },
        { status: 400 }
      );
    }

    // Validate name format
    const nameRegex = /^[a-z0-9_-]{1,64}$/;
    if (!nameRegex.test(name.toLowerCase())) {
      return NextResponse.json(
        { error: 'Invalid name. Use 1-64 characters: lowercase letters, numbers, underscore, or hyphen.' },
        { status: 400 }
      );
    }

    const normalizedName = name.toLowerCase();

    // Authenticate user
    const user = await db.users.findByApiKey(api_key);
    if (!user) {
      return NextResponse.json(
        { error: 'Invalid API key' },
        { status: 401 }
      );
    }

    // Get or create keypair
    let keyData = await nostrKeys.getByUserId(user.id);

    if (!keyData) {
      // Generate new keypair
      const keypair = generateKeypair();

      await nostrKeys.create(
        user.id,
        keypair.publicKey,
        keypair.secretKeyHex,
        normalizedName
      );

      keyData = {
        pubkey: keypair.publicKey,
        nip05_name: normalizedName
      };
    } else {
      // Update existing keypair with NIP-05 name
      // First check if this user already has a different name
      if (keyData.nip05_name && keyData.nip05_name !== normalizedName) {
        return NextResponse.json(
          {
            error: 'You already have a NIP-05 identity',
            current_nip05: `${keyData.nip05_name}@keykeeper.world`
          },
          { status: 400 }
        );
      }
    }

    // Check if name is already taken in nostr_identities table
    const existingIdentity = await query(
      'SELECT id FROM nostr_identities WHERE name = ?',
      [normalizedName]
    );

    if (existingIdentity.length > 0) {
      return NextResponse.json(
        { error: 'Name already taken', name: normalizedName },
        { status: 409 }
      );
    }

    // Register in nostr_identities table (for .well-known/nostr.json)
    const identityId = generateUuid();
    await query(
      `INSERT INTO nostr_identities (id, name, pubkey, user_id)
       VALUES (?, ?, ?, ?)
       ON DUPLICATE KEY UPDATE pubkey = VALUES(pubkey)`,
      [identityId, normalizedName, keyData.pubkey, user.id]
    );

    // Update nostr_keys with the NIP-05 name
    await nostrKeys.updateNip05(user.id, normalizedName);

    return NextResponse.json({
      success: true,
      identity: `${normalizedName}@keykeeper.world`,
      pubkey: keyData.pubkey,
      npub: hexToNpub(keyData.pubkey),
      verify_url: `https://keykeeper.world/.well-known/nostr.json?name=${normalizedName}`
    });

  } catch (error) {
    console.error('Error claiming NIP-05 identity:', error);
    return NextResponse.json(
      { error: 'Internal server error', details: error.message },
      { status: 500 }
    );
  }
}
