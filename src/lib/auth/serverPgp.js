/**
 * Server-side PGP Key Generation for Email Encryption
 * 
 * This module generates PGP keys on the server for email encryption
 * while using simple password-based authentication for users.
 */

import * as openpgp from 'openpgp';
import crypto from 'crypto';

/**
 * Generate PGP key pair for email encryption
 * @param {string} email - User's email address
 * @param {string} name - User's name
 * @returns {Promise<Object>} - Generated key pair info
 */
export async function generateEmailEncryptionKeys(email, name = null) {
  try {
    console.log(`Generating PGP keys for email: ${email}`);
    
    // Generate key pair
    const { privateKey, publicKey, revocationCertificate } = await openpgp.generateKey({
      type: 'ecc', // ECC keys are modern and smaller
      curve: 'curve25519',
      userIDs: [{ 
        name: name || email.split('@')[0], 
        email: email 
      }],
      format: 'armored',
      passphrase: '', // No passphrase - server will manage securely
      keyExpirationTime: 0, // Never expire
    });
    
    // Extract key info
    const publicKeyObj = await openpgp.readKey({ armoredKey: publicKey });
    const keyId = publicKeyObj.getKeyID().toHex().toUpperCase();
    const fingerprint = publicKeyObj.getFingerprint().toUpperCase();
    
    console.log(`Generated PGP keys - Key ID: ${keyId}, Fingerprint: ${fingerprint}`);
    
    return {
      publicKey,
      privateKey,
      revocationCertificate,
      keyId,
      fingerprint,
      email,
      name: name || email.split('@')[0]
    };
  } catch (error) {
    console.error('Error generating PGP keys:', error);
    throw new Error('Failed to generate encryption keys: ' + error.message);
  }
}

/**
 * Derive mail password from user password hash
 * This replaces the PGP-based deterministic password derivation
 * @param {string} email - User's email
 * @param {string} passwordHash - Bcrypt hash of user password
 * @returns {Promise<string>} - Derived mail password
 */
export async function deriveMailPasswordFromHash(email, passwordHash) {
  try {
    console.log(`Deriving mail password for: ${email}`);
    
    // Create deterministic password using HMAC-SHA256
    // Input: email + passwordHash + constant salt
    const salt = 'keykeeper-mail-password-v1';
    const input = `${email}:${passwordHash}:${salt}`;
    
    // Use HMAC with the password hash as key
    const hmac = crypto.createHmac('sha256', passwordHash);
    hmac.update(input);
    const digest = hmac.digest('hex');
    
    // Create a mail-compatible password (base64, URL-safe)
    const password = Buffer.from(digest, 'hex')
      .toString('base64')
      .replace(/[+/=]/g, '') // Remove problematic chars
      .substring(0, 32); // Fixed length
    
    console.log(`Derived mail password (length: ${password.length})`);
    
    return password;
  } catch (error) {
    console.error('Error deriving mail password:', error);
    throw new Error('Failed to derive mail password');
  }
}

/**
 * Encrypt email content for a recipient
 * @param {string} message - Message content
 * @param {string} recipientPublicKey - Recipient's PGP public key
 * @returns {Promise<string>} - Encrypted message
 */
export async function encryptEmail(message, recipientPublicKey) {
  try {
    const publicKeyObj = await openpgp.readKey({ armoredKey: recipientPublicKey });
    const messageObj = await openpgp.createMessage({ text: message });
    
    const encrypted = await openpgp.encrypt({
      message: messageObj,
      encryptionKeys: publicKeyObj
    });
    
    return encrypted;
  } catch (error) {
    console.error('Error encrypting email:', error);
    throw new Error('Failed to encrypt email: ' + error.message);
  }
}

/**
 * Decrypt email content for a user
 * @param {string} encryptedMessage - Encrypted message
 * @param {string} userPrivateKey - User's PGP private key
 * @returns {Promise<string>} - Decrypted message
 */
export async function decryptEmail(encryptedMessage, userPrivateKey) {
  try {
    const privateKeyObj = await openpgp.readPrivateKey({ armoredKey: userPrivateKey });
    const messageObj = await openpgp.readMessage({ armoredMessage: encryptedMessage });
    
    const decrypted = await openpgp.decrypt({
      message: messageObj,
      decryptionKeys: privateKeyObj
    });
    
    return decrypted.data;
  } catch (error) {
    console.error('Error decrypting email:', error);
    throw new Error('Failed to decrypt email: ' + error.message);
  }
}

export default {
  generateEmailEncryptionKeys,
  deriveMailPasswordFromHash,
  encryptEmail,
  decryptEmail
};