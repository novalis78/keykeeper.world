/**
 * Nostr Service - Handles key management, event signing, and relay communication
 * For the HTTP-to-Nostr bridge (Phase 2)
 */

import { generateSecretKey, getPublicKey, finalizeEvent, nip04, nip19 } from 'nostr-tools';
import { SimplePool } from 'nostr-tools/pool';
import crypto from 'crypto';

// Default relays for publishing and subscribing
// Our own relay is listed first for best performance with @keykeeper.world identities
const DEFAULT_RELAYS = [
  'wss://relay.keykeeper.world',
  'wss://relay.damus.io',
  'wss://nos.lol',
  'wss://relay.nostr.band',
  'wss://purplepag.es'
];

// In-memory pool for relay connections (reused across requests)
let pool = null;

function getPool() {
  if (!pool) {
    pool = new SimplePool();
  }
  return pool;
}

/**
 * Generate a new Nostr keypair
 * @returns {{ secretKey: Uint8Array, publicKey: string, nsec: string, npub: string }}
 */
export function generateKeypair() {
  const secretKey = generateSecretKey();
  const publicKey = getPublicKey(secretKey);

  return {
    secretKey,
    secretKeyHex: Buffer.from(secretKey).toString('hex'),
    publicKey,
    nsec: nip19.nsecEncode(secretKey),
    npub: nip19.npubEncode(publicKey)
  };
}

/**
 * Get public key from secret key
 * @param {string} secretKeyHex - Hex-encoded secret key
 * @returns {string} Hex-encoded public key
 */
export function getPublicKeyFromSecret(secretKeyHex) {
  const secretKey = Uint8Array.from(Buffer.from(secretKeyHex, 'hex'));
  return getPublicKey(secretKey);
}

/**
 * Convert between npub/nsec and hex formats
 */
export function npubToHex(npub) {
  try {
    const decoded = nip19.decode(npub);
    if (decoded.type === 'npub') {
      return decoded.data;
    }
  } catch (e) {
    // Already hex or invalid
  }
  return npub;
}

export function hexToNpub(hex) {
  return nip19.npubEncode(hex);
}

export function nsecToHex(nsec) {
  try {
    const decoded = nip19.decode(nsec);
    if (decoded.type === 'nsec') {
      return Buffer.from(decoded.data).toString('hex');
    }
  } catch (e) {
    // Already hex or invalid
  }
  return nsec;
}

/**
 * Encrypt a message for NIP-04 direct message
 * @param {string} secretKeyHex - Sender's secret key (hex)
 * @param {string} recipientPubkeyHex - Recipient's public key (hex)
 * @param {string} message - Plaintext message
 * @returns {Promise<string>} Encrypted content
 */
export async function encryptDM(secretKeyHex, recipientPubkeyHex, message) {
  const secretKey = Uint8Array.from(Buffer.from(secretKeyHex, 'hex'));
  return await nip04.encrypt(secretKey, recipientPubkeyHex, message);
}

/**
 * Decrypt a NIP-04 direct message
 * @param {string} secretKeyHex - Recipient's secret key (hex)
 * @param {string} senderPubkeyHex - Sender's public key (hex)
 * @param {string} encryptedContent - Encrypted content from event
 * @returns {Promise<string>} Decrypted message
 */
export async function decryptDM(secretKeyHex, senderPubkeyHex, encryptedContent) {
  const secretKey = Uint8Array.from(Buffer.from(secretKeyHex, 'hex'));
  return await nip04.decrypt(secretKey, senderPubkeyHex, encryptedContent);
}

/**
 * Create and sign a NIP-04 encrypted direct message event
 * @param {string} secretKeyHex - Sender's secret key (hex)
 * @param {string} recipientPubkeyHex - Recipient's public key (hex)
 * @param {string} message - Plaintext message
 * @returns {Promise<Object>} Signed Nostr event
 */
export async function createDMEvent(secretKeyHex, recipientPubkeyHex, message) {
  const secretKey = Uint8Array.from(Buffer.from(secretKeyHex, 'hex'));
  const publicKey = getPublicKey(secretKey);

  const encryptedContent = await encryptDM(secretKeyHex, recipientPubkeyHex, message);

  const eventTemplate = {
    kind: 4, // NIP-04 encrypted direct message
    pubkey: publicKey,
    created_at: Math.floor(Date.now() / 1000),
    tags: [['p', recipientPubkeyHex]],
    content: encryptedContent
  };

  return finalizeEvent(eventTemplate, secretKey);
}

/**
 * Publish an event to relays
 * @param {Object} event - Signed Nostr event
 * @param {string[]} relays - Optional custom relay list
 * @returns {Promise<{ success: boolean, relays: string[], errors: string[] }>}
 */
export async function publishEvent(event, relays = DEFAULT_RELAYS) {
  const p = getPool();
  const results = { success: false, relays: [], errors: [] };

  try {
    const publishPromises = relays.map(async (relay) => {
      try {
        await p.publish([relay], event);
        results.relays.push(relay);
        return { relay, success: true };
      } catch (err) {
        results.errors.push(`${relay}: ${err.message}`);
        return { relay, success: false, error: err.message };
      }
    });

    await Promise.allSettled(publishPromises);
    results.success = results.relays.length > 0;
  } catch (err) {
    results.errors.push(`Pool error: ${err.message}`);
  }

  return results;
}

/**
 * Fetch direct messages for a pubkey since a timestamp
 * @param {string} pubkeyHex - Public key to fetch DMs for
 * @param {number} since - Unix timestamp to fetch messages since (optional)
 * @param {string[]} relays - Optional custom relay list
 * @returns {Promise<Object[]>} Array of raw events
 */
export async function fetchDMs(pubkeyHex, since = null, relays = DEFAULT_RELAYS) {
  const p = getPool();

  const filter = {
    kinds: [4],
    '#p': [pubkeyHex], // Messages TO this pubkey
    limit: 100
  };

  if (since) {
    filter.since = since;
  }

  try {
    const events = await p.querySync(relays, filter);
    return events;
  } catch (err) {
    console.error('Error fetching DMs:', err);
    return [];
  }
}

/**
 * Fetch sent messages from a pubkey
 * @param {string} pubkeyHex - Public key to fetch sent messages for
 * @param {number} since - Unix timestamp
 * @param {string[]} relays - Optional custom relay list
 * @returns {Promise<Object[]>} Array of raw events
 */
export async function fetchSentDMs(pubkeyHex, since = null, relays = DEFAULT_RELAYS) {
  const p = getPool();

  const filter = {
    kinds: [4],
    authors: [pubkeyHex],
    limit: 100
  };

  if (since) {
    filter.since = since;
  }

  try {
    const events = await p.querySync(relays, filter);
    return events;
  } catch (err) {
    console.error('Error fetching sent DMs:', err);
    return [];
  }
}

/**
 * Resolve a NIP-05 identifier to a pubkey
 * @param {string} nip05 - NIP-05 identifier (e.g., "alice@keykeeper.world")
 * @param {Object} db - Optional database module for local lookups
 * @returns {Promise<string|null>} Hex pubkey or null
 */
export async function resolveNip05(nip05, db = null) {
  if (!nip05.includes('@')) {
    return null;
  }

  const [name, domain] = nip05.split('@');

  // For keykeeper.world identities, do a local database lookup
  if (domain === 'keykeeper.world' && db) {
    try {
      console.log(`[resolveNip05] Looking up local NIP-05: ${name}`);
      const results = await db.query(
        'SELECT pubkey FROM nostr_identities WHERE name = ?',
        [name.toLowerCase()]
      );
      console.log(`[resolveNip05] Local lookup results:`, results.length);
      if (results.length > 0) {
        console.log(`[resolveNip05] Found pubkey locally: ${results[0].pubkey}`);
        return results[0].pubkey;
      }
      console.log(`[resolveNip05] Not found locally, will try remote`);
    } catch (err) {
      console.error(`Error looking up local NIP-05 ${nip05}:`, err);
    }
  } else {
    console.log(`[resolveNip05] Skipping local lookup. domain=${domain}, db=${!!db}`);
  }

  try {
    const url = `https://${domain}/.well-known/nostr.json?name=${encodeURIComponent(name)}`;
    const response = await fetch(url);

    if (!response.ok) {
      return null;
    }

    const data = await response.json();
    return data.names?.[name] || null;
  } catch (err) {
    console.error(`Error resolving NIP-05 ${nip05}:`, err);
    return null;
  }
}

/**
 * Close the relay pool (for cleanup)
 */
export function closePool() {
  if (pool) {
    pool.close(DEFAULT_RELAYS);
    pool = null;
  }
}

export { DEFAULT_RELAYS };
