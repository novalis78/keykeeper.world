/**
 * Nostr Database Operations
 * Handles custodial key storage and message caching
 */

import { query, generateUuid } from '../db.js';
import crypto from 'crypto';

/**
 * Encrypt a secret key for storage
 * @param {string} secretKeyHex - Hex-encoded secret key
 * @returns {string} Encrypted secret key with IV prefix
 */
function encryptSecretKey(secretKeyHex) {
  const secret = process.env.APP_SECRET || 'keykeeper-default-secret';
  const encKey = crypto.createHash('sha256').update(secret).digest();
  const iv = crypto.randomBytes(16);

  const cipher = crypto.createCipheriv('aes-256-cbc', encKey, iv);
  let encrypted = cipher.update(secretKeyHex, 'utf8', 'hex');
  encrypted += cipher.final('hex');

  return `${iv.toString('hex')}:${encrypted}`;
}

/**
 * Decrypt a stored secret key
 * @param {string} encryptedData - Encrypted secret key with IV prefix
 * @returns {string} Hex-encoded secret key
 */
function decryptSecretKey(encryptedData) {
  const secret = process.env.APP_SECRET || 'keykeeper-default-secret';
  const encKey = crypto.createHash('sha256').update(secret).digest();

  const [ivHex, encrypted] = encryptedData.split(':');
  const iv = Buffer.from(ivHex, 'hex');

  const decipher = crypto.createDecipheriv('aes-256-cbc', encKey, iv);
  let decrypted = decipher.update(encrypted, 'hex', 'utf8');
  decrypted += decipher.final('utf8');

  return decrypted;
}

/**
 * Nostr key operations
 */
export const nostrKeys = {
  /**
   * Store a new keypair for a user
   * @param {string} userId - User ID
   * @param {string} pubkey - Hex public key
   * @param {string} secretKeyHex - Hex secret key
   * @param {string} nip05Name - Optional NIP-05 name
   * @returns {Promise<string>} Key ID
   */
  async create(userId, pubkey, secretKeyHex, nip05Name = null) {
    const id = generateUuid();
    const encryptedKey = encryptSecretKey(secretKeyHex);

    const sql = `
      INSERT INTO nostr_keys (id, user_id, pubkey, secret_key_enc, nip05_name)
      VALUES (?, ?, ?, ?, ?)
    `;

    await query(sql, [id, userId, pubkey, encryptedKey, nip05Name]);
    return id;
  },

  /**
   * Get keypair for a user
   * @param {string} userId - User ID
   * @returns {Promise<Object|null>} Key data with decrypted secret
   */
  async getByUserId(userId) {
    const sql = `SELECT * FROM nostr_keys WHERE user_id = ?`;
    const results = await query(sql, [userId]);

    if (results.length === 0) return null;

    const keyData = results[0];
    return {
      ...keyData,
      secretKeyHex: decryptSecretKey(keyData.secret_key_enc)
    };
  },

  /**
   * Get keypair by pubkey
   * @param {string} pubkey - Hex public key
   * @returns {Promise<Object|null>} Key data with decrypted secret
   */
  async getByPubkey(pubkey) {
    const sql = `SELECT * FROM nostr_keys WHERE pubkey = ?`;
    const results = await query(sql, [pubkey]);

    if (results.length === 0) return null;

    const keyData = results[0];
    return {
      ...keyData,
      secretKeyHex: decryptSecretKey(keyData.secret_key_enc)
    };
  },

  /**
   * Update NIP-05 name for a key
   * @param {string} userId - User ID
   * @param {string} nip05Name - NIP-05 name
   * @returns {Promise<boolean>} Success
   */
  async updateNip05(userId, nip05Name) {
    const sql = `UPDATE nostr_keys SET nip05_name = ? WHERE user_id = ?`;
    const result = await query(sql, [nip05Name, userId]);
    return result.affectedRows > 0;
  },

  /**
   * Increment message counters
   * @param {string} userId - User ID
   * @param {'sent'|'received'} direction - Message direction
   * @returns {Promise<boolean>} Success
   */
  async incrementMessageCount(userId, direction) {
    const column = direction === 'sent' ? 'messages_sent' : 'messages_received';
    const sql = `UPDATE nostr_keys SET ${column} = ${column} + 1, last_used_at = NOW() WHERE user_id = ?`;
    const result = await query(sql, [userId]);
    return result.affectedRows > 0;
  },

  /**
   * Delete keypair for a user
   * @param {string} userId - User ID
   * @returns {Promise<boolean>} Success
   */
  async delete(userId) {
    const sql = `DELETE FROM nostr_keys WHERE user_id = ?`;
    const result = await query(sql, [userId]);
    return result.affectedRows > 0;
  }
};

/**
 * Nostr message cache operations
 */
export const nostrMessages = {
  /**
   * Store a message (sent or received)
   * @param {Object} message - Message data
   * @returns {Promise<string>} Message ID
   */
  async create(message) {
    const id = generateUuid();

    const sql = `
      INSERT INTO nostr_messages (id, event_id, user_id, sender_pubkey, sender_nip05, content, direction, created_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, FROM_UNIXTIME(?))
      ON DUPLICATE KEY UPDATE id = id
    `;

    await query(sql, [
      id,
      message.eventId,
      message.userId,
      message.senderPubkey,
      message.senderNip05 || null,
      message.content,
      message.direction,
      message.createdAt
    ]);

    return id;
  },

  /**
   * Get messages for a user (inbox)
   * @param {string} userId - User ID
   * @param {Object} options - Query options
   * @returns {Promise<Array>} Messages
   */
  async getInbox(userId, options = {}) {
    const { since, limit = 50, unreadOnly = false } = options;

    let sql = `
      SELECT * FROM nostr_messages
      WHERE user_id = ? AND direction = 'received'
    `;
    const params = [userId];

    if (since) {
      sql += ` AND created_at > FROM_UNIXTIME(?)`;
      params.push(since);
    }

    if (unreadOnly) {
      sql += ` AND read_at IS NULL`;
    }

    // Use template literal for LIMIT since mysql2 execute has issues with integer params for LIMIT
    sql += ` ORDER BY created_at DESC LIMIT ${parseInt(limit, 10)}`;

    return await query(sql, params);
  },

  /**
   * Get sent messages for a user
   * @param {string} userId - User ID
   * @param {Object} options - Query options
   * @returns {Promise<Array>} Messages
   */
  async getSent(userId, options = {}) {
    const { since, limit = 50 } = options;

    let sql = `
      SELECT * FROM nostr_messages
      WHERE user_id = ? AND direction = 'sent'
    `;
    const params = [userId];

    if (since) {
      sql += ` AND created_at > FROM_UNIXTIME(?)`;
      params.push(since);
    }

    // Use template literal for LIMIT since mysql2 execute has issues with integer params for LIMIT
    sql += ` ORDER BY created_at DESC LIMIT ${parseInt(limit, 10)}`;

    return await query(sql, params);
  },

  /**
   * Mark messages as read
   * @param {string} userId - User ID
   * @param {string[]} messageIds - Message IDs to mark read
   * @returns {Promise<number>} Number of messages marked
   */
  async markRead(userId, messageIds) {
    if (!messageIds || messageIds.length === 0) return 0;

    const placeholders = messageIds.map(() => '?').join(',');
    const sql = `UPDATE nostr_messages SET read_at = NOW() WHERE user_id = ? AND id IN (${placeholders})`;
    const result = await query(sql, [userId, ...messageIds]);
    return result.affectedRows;
  },

  /**
   * Get latest message timestamp for a user (for sync)
   * @param {string} userId - User ID
   * @returns {Promise<number|null>} Unix timestamp of latest message
   */
  async getLatestTimestamp(userId) {
    const sql = `SELECT UNIX_TIMESTAMP(MAX(created_at)) as latest FROM nostr_messages WHERE user_id = ?`;
    const results = await query(sql, [userId]);
    return results[0]?.latest || null;
  },

  /**
   * Delete old messages (for retention policy)
   * @param {number} olderThanDays - Delete messages older than this many days
   * @returns {Promise<number>} Number of deleted messages
   */
  async deleteOld(olderThanDays) {
    const sql = `DELETE FROM nostr_messages WHERE created_at < DATE_SUB(NOW(), INTERVAL ? DAY)`;
    const result = await query(sql, [olderThanDays]);
    return result.affectedRows;
  }
};

export default { nostrKeys, nostrMessages };
