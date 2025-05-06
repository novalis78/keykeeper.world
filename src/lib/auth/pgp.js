/**
 * PGP Authentication Utilities
 * 
 * This module provides utilities for PGP-based authentication in KeyKeeper.world,
 * including key generation, challenge signing, and verification.
 */

import * as openpgp from 'openpgp';

const pgpUtils = {
  /**
   * Generate a new PGP key pair
   * @param {string} name - User's name
   * @param {string} email - User's email
   * @param {Object} options - Key generation options
   * @returns {Promise<Object>} - Object containing public and private keys
   */
  generateKey: async (name, email, options = {}) => {
    console.log(`Generating PGP key for ${name} <${email}>`);
    
    try {
      // Configure key generation parameters
      const config = {
        type: options.type || 'ecc', // Use ECC keys by default (curve25519)
        curve: options.curve || 'curve25519', // Modern, secure, smaller keys
        userIDs: [{ name, email }],
        format: 'armored', // ASCII armor format
        passphrase: options.passphrase || '', // Optional passphrase protection
        keyExpirationTime: options.keyExpirationTime || 0, // Default: never expire
      };
      
      // Generate actual PGP key pair
      const { privateKey, publicKey, revocationCertificate } = 
        await openpgp.generateKey(config);
      
      // Read key details for ID and fingerprint
      const publicKeyObj = await openpgp.readKey({ armoredKey: publicKey });
      const keyId = publicKeyObj.getKeyID().toHex().toUpperCase();
      const fingerprint = publicKeyObj.getFingerprint().toUpperCase();
      
      return {
        publicKey,
        privateKey,
        revocationCertificate,
        keyId,
        fingerprint
      };
    } catch (error) {
      console.error('Error generating PGP key:', error);
      throw new Error('Failed to generate PGP key: ' + error.message);
    }
  },
  
  /**
   * Generate a challenge for authentication
   * @returns {string} - Random challenge string
   */
  generateChallenge: () => {
    // Generate a random challenge string
    const random = new Uint8Array(32);
    window.crypto.getRandomValues(random);
    return Array.from(random).map(b => b.toString(16).padStart(2, '0')).join('');
  },
  
  /**
   * Sign a challenge with a private key
   * @param {string} challenge - Challenge to sign
   * @param {string} privateKey - User's private key
   * @param {string} passphrase - Optional passphrase for private key
   * @returns {Promise<string>} - Signed challenge
   */
  signChallenge: async (challenge, privateKey, passphrase = '') => {
    console.log('Signing challenge with private key');
    
    try {
      // Parse the private key
      const privateKeyObj = await openpgp.readPrivateKey({
        armoredKey: privateKey,
        passphrase
      });
      
      // Create a message from the challenge
      const message = await openpgp.createMessage({ text: challenge });
      
      // Sign the message
      const signature = await openpgp.sign({
        message,
        signingKeys: privateKeyObj,
        detached: true
      });
      
      return signature;
    } catch (error) {
      console.error('Error signing challenge:', error);
      throw new Error('Failed to sign challenge: ' + error.message);
    }
  },
  
  /**
   * Verify a signed challenge
   * @param {string} challenge - Original challenge
   * @param {string} signature - Signed challenge
   * @param {string} publicKey - User's public key
   * @returns {Promise<boolean>} - Whether signature is valid
   */
  verifySignature: async (challenge, signature, publicKey) => {
    console.log('Verifying signature against public key');
    
    try {
      // Parse the public key
      const publicKeyObj = await openpgp.readKey({ armoredKey: publicKey });
      
      // Parse the signature
      const signatureObj = await openpgp.readSignature({
        armoredSignature: signature
      });
      
      // Create a message from the challenge
      const message = await openpgp.createMessage({ text: challenge });
      
      // Verify the signature
      const verificationResult = await openpgp.verify({
        message,
        signature: signatureObj,
        verificationKeys: publicKeyObj
      });
      
      // Check the verification result
      const { valid } = verificationResult.signatures[0];
      return valid;
    } catch (error) {
      console.error('Error verifying signature:', error);
      return false;
    }
  },
  
  /**
   * Extract key information
   * @param {string} publicKey - PGP public key
   * @returns {Promise<Object>} - Key information (id, fingerprint, etc)
   */
  getKeyInfo: async (publicKey) => {
    try {
      // Parse the public key
      const publicKeyObj = await openpgp.readKey({ armoredKey: publicKey });
      
      // Extract primary key details
      const primaryKey = publicKeyObj.keyPacket;
      const keyId = publicKeyObj.getKeyID().toHex().toUpperCase();
      const fingerprint = publicKeyObj.getFingerprint().toUpperCase();
      const created = primaryKey.created;
      
      // Determine algorithm and bits
      let algorithm = 'Unknown';
      let bits = null;
      
      if (primaryKey.algorithm) {
        // Map algorithm ID to string
        const algoMap = {
          1: 'RSA',
          2: 'RSA',
          3: 'RSA',
          16: 'ElGamal',
          17: 'DSA',
          18: 'ECDH',
          19: 'ECDSA',
          22: 'EdDSA'
        };
        algorithm = algoMap[primaryKey.algorithm] || `Algorithm ${primaryKey.algorithm}`;
        
        // Get key strength info
        if (primaryKey.getBitSize) {
          bits = primaryKey.getBitSize();
        } else if (primaryKey.keySize) {
          bits = primaryKey.keySize;
        } else if (primaryKey.curve) {
          bits = primaryKey.curve;
        }
      }
      
      // Check expiration
      const expirationTime = await publicKeyObj.getExpirationTime();
      const expires = expirationTime !== Infinity ? expirationTime : null;
      
      // Get user IDs
      const userIds = publicKeyObj.users.map(user => {
        const { name, email } = user.userID.userID;
        return { name, email };
      });
      
      return {
        keyId,
        fingerprint,
        algorithm,
        bits,
        created,
        expires,
        userIds
      };
    } catch (error) {
      console.error('Error getting key info:', error);
      throw new Error('Failed to parse PGP key information');
    }
  },
  
  /**
   * Check if WebAuthn/FIDO2 is supported (for hardware security keys)
   * @returns {boolean} - Whether WebAuthn is supported
   */
  isWebAuthnSupported: () => {
    return typeof window !== 'undefined' && 
           window.PublicKeyCredential !== undefined;
  },
  
  /**
   * Check if a hardware security key is available
   * @returns {Promise<boolean>} - Whether a compatible device is available
   */
  isSecurityKeyAvailable: async () => {
    if (!pgpUtils.isWebAuthnSupported()) {
      return false;
    }
    
    try {
      return await PublicKeyCredential.isUserVerifyingPlatformAuthenticatorAvailable();
    } catch (error) {
      console.error('Error checking for security key:', error);
      return false;
    }
  },
  
  /**
   * Encrypt a message using a recipient's public key
   * @param {string} message - Message to encrypt
   * @param {string} publicKey - Recipient's public key
   * @returns {Promise<string>} - Encrypted message
   */
  encryptMessage: async (message, publicKey) => {
    console.log('Encrypting message with public key');
    
    try {
      // Parse the public key
      const publicKeyObj = await openpgp.readKey({ armoredKey: publicKey });
      
      // Create a message object from the plaintext
      const messageObj = await openpgp.createMessage({ text: message });
      
      // Encrypt the message
      const encrypted = await openpgp.encrypt({
        message: messageObj,
        encryptionKeys: publicKeyObj
      });
      
      return encrypted;
    } catch (error) {
      console.error('Error encrypting message:', error);
      throw new Error('Failed to encrypt message: ' + error.message);
    }
  },
  
  /**
   * Decrypt a message using the user's private key
   * @param {string} encryptedMessage - Encrypted message
   * @param {string} privateKey - User's private key
   * @param {string} passphrase - Optional passphrase for private key
   * @returns {Promise<string>} - Decrypted message
   */
  decryptMessage: async (encryptedMessage, privateKey, passphrase = '') => {
    console.log('Decrypting message with private key');
    
    try {
      // Parse the private key
      const privateKeyObj = await openpgp.readPrivateKey({
        armoredKey: privateKey,
        passphrase
      });
      
      // Parse the encrypted message
      const message = await openpgp.readMessage({
        armoredMessage: encryptedMessage
      });
      
      // Decrypt the message
      const { data: decrypted } = await openpgp.decrypt({
        message,
        decryptionKeys: privateKeyObj
      });
      
      return decrypted;
    } catch (error) {
      console.error('Error decrypting message:', error);
      throw new Error('Failed to decrypt message: ' + error.message);
    }
  },
  
  /**
   * Sign a message with a private key
   * @param {string} message - Message to sign
   * @param {string} privateKey - User's private key
   * @param {string} passphrase - Optional passphrase for private key
   * @returns {Promise<string>} - Signed message (cleartext with embedded signature)
   */
  signMessage: async (message, privateKey, passphrase = '') => {
    console.log('Signing message with private key');
    
    try {
      // Parse the private key
      const privateKeyObj = await openpgp.readPrivateKey({
        armoredKey: privateKey,
        passphrase
      });
      
      // Create a message object from the text
      const messageObj = await openpgp.createMessage({ text: message });
      
      // Sign the message
      const signedMessage = await openpgp.sign({
        message: messageObj,
        signingKeys: privateKeyObj,
        detached: false // We want the full signed message, not just the signature
      });
      
      return signedMessage;
    } catch (error) {
      console.error('Error signing message:', error);
      throw new Error('Failed to sign message: ' + error.message);
    }
  }
};

export default {
  ...pgpUtils,
  signMessage: pgpUtils.signMessage
};