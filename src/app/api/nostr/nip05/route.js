import { NextResponse } from 'next/server';
import { query } from '@/lib/db';
import { v4 as uuidv4 } from 'uuid';
import crypto from 'crypto';
import db from '@/lib/db';
import { generateKeypair, hexToNpub as nostrHexToNpub } from '@/lib/nostr/nostrService';
import { nostrKeys } from '@/lib/nostr/nostrDb';

export const dynamic = 'force-dynamic';

/**
 * Generate a secure API key
 */
function generateApiKey() {
  return 'kk_' + crypto.randomBytes(32).toString('hex');
}

/**
 * NIP-05 Registration API
 *
 * Allows agents to register a human-readable Nostr identity
 * e.g., agentbob@keykeeper.world -> npub1abc123...
 *
 * NEW: Also creates a unified user account with API key for HTTP bridge access
 */

/**
 * GET /api/nostr/nip05
 * List registered identities (public, limited)
 */
export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const name = searchParams.get('name');

    if (name) {
      // Check if name is available
      const results = await query(
        'SELECT name, pubkey, created_at FROM nostr_identities WHERE name = ?',
        [name.toLowerCase()]
      );

      if (results.length > 0) {
        return NextResponse.json({
          available: false,
          identity: `${results[0].name}@keykeeper.world`,
          pubkey: results[0].pubkey
        });
      }

      return NextResponse.json({
        available: true,
        name: name.toLowerCase()
      });
    }

    // Return stats
    const countResult = await query(
      'SELECT COUNT(*) as count FROM nostr_identities'
    );

    return NextResponse.json({
      service: 'KeyKeeper NIP-05',
      description: 'Free Nostr identity for AI agents',
      registered_identities: countResult[0].count,
      register_endpoint: 'POST /api/nostr/nip05',
      verify_endpoint: '/.well-known/nostr.json?name={name}'
    });

  } catch (error) {
    console.error('[NIP-05 API] Error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch NIP-05 data' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/nostr/nip05
 * Register a new NIP-05 identity with unified account
 *
 * Body:
 * {
 *   "name": "agentbob",
 *   "pubkey": "npub1..." or hex format (OPTIONAL - we'll generate if not provided),
 *   "api_key": "kk_..." (optional, links to existing account)
 * }
 *
 * Returns:
 * - NIP-05 identity
 * - API key (for HTTP bridge and future email)
 * - Nostr keypair (if we generated it)
 */
export async function POST(request) {
  try {
    const body = await request.json();
    let { name, pubkey, api_key } = body;

    // Validate name
    if (!name || typeof name !== 'string') {
      return NextResponse.json(
        { error: 'Name is required' },
        { status: 400 }
      );
    }

    // Normalize name
    name = name.toLowerCase().trim();

    // Validate name format (alphanumeric, underscores, hyphens, 3-32 chars)
    if (!/^[a-z0-9_-]{3,32}$/.test(name)) {
      return NextResponse.json(
        {
          error: 'Invalid name format',
          requirements: 'Must be 3-32 characters, lowercase alphanumeric, underscores, or hyphens'
        },
        { status: 400 }
      );
    }

    // Reserved names
    const reserved = ['admin', 'root', 'system', 'keykeeper', 'support', 'help', 'info', 'nostr', 'relay'];
    if (reserved.includes(name)) {
      return NextResponse.json(
        { error: 'This name is reserved' },
        { status: 400 }
      );
    }

    // Check if name is already taken
    const existingName = await query(
      'SELECT id FROM nostr_identities WHERE name = ?',
      [name]
    );

    if (existingName.length > 0) {
      return NextResponse.json(
        { error: 'This name is already registered' },
        { status: 409 }
      );
    }

    // Handle keypair - either use provided or generate new one
    let hexPubkey;
    let generatedKeypair = null;
    let secretKeyHex = null;

    if (pubkey && typeof pubkey === 'string' && pubkey.trim()) {
      // User provided their own pubkey
      hexPubkey = pubkey;
      if (pubkey.startsWith('npub1')) {
        try {
          hexPubkey = npubToHex(pubkey);
        } catch (e) {
          return NextResponse.json(
            { error: 'Invalid npub format' },
            { status: 400 }
          );
        }
      }

      // Validate hex pubkey (64 hex chars)
      if (!/^[a-f0-9]{64}$/i.test(hexPubkey)) {
        return NextResponse.json(
          {
            error: 'Invalid pubkey format',
            expected: '64 character hex string or npub1... bech32 format'
          },
          { status: 400 }
        );
      }

      hexPubkey = hexPubkey.toLowerCase();

      // Check if pubkey is already registered
      const existingPubkey = await query(
        'SELECT name FROM nostr_identities WHERE pubkey = ?',
        [hexPubkey]
      );

      if (existingPubkey.length > 0) {
        return NextResponse.json(
          {
            error: 'This pubkey is already registered',
            existing_identity: `${existingPubkey[0].name}@keykeeper.world`
          },
          { status: 409 }
        );
      }
    } else {
      // Generate keypair for the user (custodial mode)
      generatedKeypair = generateKeypair();
      hexPubkey = generatedKeypair.publicKey;
      secretKeyHex = generatedKeypair.secretKeyHex;
    }

    // Find or create user account
    let userId = null;
    let userApiKey = null;
    let isNewAccount = false;

    if (api_key) {
      // Link to existing account
      const user = await db.users.findByApiKey(api_key);
      if (user) {
        userId = user.id;
        userApiKey = api_key;
      } else {
        return NextResponse.json(
          { error: 'Invalid API key provided' },
          { status: 401 }
        );
      }
    } else {
      // Create new user account
      userId = uuidv4();
      userApiKey = generateApiKey();
      isNewAccount = true;

      await db.users.createAgent({
        id: userId,
        email: `${name}@keykeeper.world`,  // Use NIP-05 as email
        name: name,
        apiKey: userApiKey,
        credits: 0  // Free tier
      });

      console.log(`[NIP-05] Created new agent account: ${name} (${userId})`);
    }

    // Store Nostr keypair if we generated one (custodial)
    if (secretKeyHex) {
      await nostrKeys.create(userId, hexPubkey, secretKeyHex, name);
      console.log(`[NIP-05] Stored custodial keypair for ${name}`);
    }

    // Create the NIP-05 identity
    const id = uuidv4();
    await query(
      'INSERT INTO nostr_identities (id, name, pubkey, user_id) VALUES (?, ?, ?, ?)',
      [id, name, hexPubkey, userId]
    );

    console.log(`[NIP-05] Registered: ${name}@keykeeper.world -> ${hexPubkey.substring(0, 16)}...`);

    // Build response
    const response = {
      success: true,
      identity: `${name}@keykeeper.world`,
      name,
      pubkey: hexPubkey,
      npub: hexToNpub(hexPubkey),
      verify_url: `https://keykeeper.world/.well-known/nostr.json?name=${name}`,

      // Unified API key - works for Nostr HTTP bridge AND email (once credits added)
      api_key: userApiKey,
      account: {
        user_id: userId,
        is_new: isNewAccount,
        email_credits: 0,
        nostr_messages_per_day: 100,  // Free tier
      },

      // Relay info
      recommended_relays: [
        'wss://relay.keykeeper.world',
        'wss://relay.damus.io',
        'wss://nos.lol',
        'wss://relay.nostr.band'
      ],
      home_relay: 'wss://relay.keykeeper.world',

      // Clear next steps
      next_steps: {
        send_nostr_dm: `POST /api/nostr/send with {"to": "recipient@domain", "message": "Hello!", "api_key": "${userApiKey}"}`,
        check_inbox: `GET /api/nostr/inbox?api_key=${userApiKey}`,
        add_email_credits: 'POST /api/v1/agent/payment to add credits for email sending',
        send_email: `Once you have credits: POST /api/v1/agent/send with Authorization: Bearer ${userApiKey}`
      },

      note: `Your identity ${name}@keykeeper.world is now active! You can immediately send/receive Nostr DMs using the HTTP bridge.`
    };

    // Include secret key ONLY if we generated it (custodial mode)
    // User should save this - we store it encrypted but they may want their own copy
    if (generatedKeypair) {
      response.keypair = {
        warning: 'SAVE THIS! We store it securely, but you may want a backup.',
        secret_key_hex: secretKeyHex,
        nsec: generatedKeypair.nsec,
        public_key_hex: hexPubkey,
        npub: generatedKeypair.npub
      };
    }

    return NextResponse.json(response, { status: 201 });

  } catch (error) {
    console.error('[NIP-05 API] Registration error:', error);
    return NextResponse.json(
      { error: 'Failed to register identity: ' + error.message },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/nostr/nip05
 * Remove a NIP-05 identity (requires API key that owns it)
 */
export async function DELETE(request) {
  try {
    const body = await request.json();
    const { name, api_key } = body;

    if (!name || !api_key) {
      return NextResponse.json(
        { error: 'Name and api_key are required' },
        { status: 400 }
      );
    }

    // Find the user
    const user = await db.users.findByApiKey(api_key);
    if (!user) {
      return NextResponse.json(
        { error: 'Invalid API key' },
        { status: 401 }
      );
    }

    // Check if identity belongs to this user
    const identity = await query(
      'SELECT id, user_id FROM nostr_identities WHERE name = ?',
      [name.toLowerCase()]
    );

    if (identity.length === 0) {
      return NextResponse.json(
        { error: 'Identity not found' },
        { status: 404 }
      );
    }

    if (identity[0].user_id !== user.id) {
      return NextResponse.json(
        { error: 'You do not own this identity' },
        { status: 403 }
      );
    }

    // Delete the identity
    await query(
      'DELETE FROM nostr_identities WHERE id = ?',
      [identity[0].id]
    );

    return NextResponse.json({
      success: true,
      message: `Identity ${name}@keykeeper.world has been removed`
    });

  } catch (error) {
    console.error('[NIP-05 API] Delete error:', error);
    return NextResponse.json(
      { error: 'Failed to delete identity' },
      { status: 500 }
    );
  }
}

/**
 * Convert npub (bech32) to hex
 * Simplified implementation - in production use nostr-tools
 */
function npubToHex(npub) {
  // bech32 decoding for npub
  const ALPHABET = 'qpzry9x8gf2tvdw0s3jn54khce6mua7l';

  if (!npub.startsWith('npub1')) {
    throw new Error('Invalid npub prefix');
  }

  const data = npub.slice(5);
  const values = [];

  for (const char of data) {
    const index = ALPHABET.indexOf(char);
    if (index === -1) throw new Error('Invalid character in npub');
    values.push(index);
  }

  // Remove checksum (last 6 chars worth of 5-bit values)
  const dataValues = values.slice(0, -6);

  // Convert from 5-bit to 8-bit
  let bits = '';
  for (const v of dataValues) {
    bits += v.toString(2).padStart(5, '0');
  }

  // Take 256 bits (32 bytes) for the pubkey
  const hexBytes = [];
  for (let i = 0; i < 256; i += 8) {
    hexBytes.push(parseInt(bits.slice(i, i + 8), 2).toString(16).padStart(2, '0'));
  }

  return hexBytes.join('');
}

/**
 * Convert hex to npub (bech32)
 * Simplified implementation
 */
function hexToNpub(hex) {
  const ALPHABET = 'qpzry9x8gf2tvdw0s3jn54khce6mua7l';

  // Convert hex to bits
  let bits = '';
  for (let i = 0; i < hex.length; i += 2) {
    bits += parseInt(hex.slice(i, i + 2), 16).toString(2).padStart(8, '0');
  }

  // Convert to 5-bit values
  const values = [];
  for (let i = 0; i < bits.length; i += 5) {
    values.push(parseInt(bits.slice(i, i + 5).padEnd(5, '0'), 2));
  }

  // Calculate checksum (simplified - proper bech32 checksum is more complex)
  // For now, we'll use a placeholder that works for display
  const checksumValues = calculateBech32Checksum('npub', values);
  const allValues = [...values, ...checksumValues];

  // Convert to bech32 string
  let result = 'npub1';
  for (const v of allValues) {
    result += ALPHABET[v];
  }

  return result;
}

/**
 * Calculate bech32 checksum
 */
function calculateBech32Checksum(hrp, values) {
  const GEN = [0x3b6a57b2, 0x26508e6d, 0x1ea119fa, 0x3d4233dd, 0x2a1462b3];

  function polymod(values) {
    let chk = 1;
    for (const v of values) {
      const top = chk >> 25;
      chk = ((chk & 0x1ffffff) << 5) ^ v;
      for (let i = 0; i < 5; i++) {
        if ((top >> i) & 1) {
          chk ^= GEN[i];
        }
      }
    }
    return chk;
  }

  function hrpExpand(hrp) {
    const ret = [];
    for (const c of hrp) {
      ret.push(c.charCodeAt(0) >> 5);
    }
    ret.push(0);
    for (const c of hrp) {
      ret.push(c.charCodeAt(0) & 31);
    }
    return ret;
  }

  const expanded = [...hrpExpand(hrp), ...values];
  const pm = polymod([...expanded, 0, 0, 0, 0, 0, 0]) ^ 1;

  const checksum = [];
  for (let i = 0; i < 6; i++) {
    checksum.push((pm >> (5 * (5 - i))) & 31);
  }

  return checksum;
}
