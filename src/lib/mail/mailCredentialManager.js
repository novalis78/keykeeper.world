'use client';

/**
 * Mail Credential Manager
 * 
 * This module provides utilities for securely managing mail account credentials
 * on the client side. It uses client-side encryption to protect credentials
 * and integrates with the PGP authentication flow.
 */

import pgpUtils from '@/lib/auth/pgp';
import * as openpgp from 'openpgp';
import { deriveDovecotPassword } from '@/lib/mail/dovecotAuth';

// Constants for storage
const STORAGE_PREFIX = 'kk_mail_';
const SESSION_KEY = 'kk_session_key';
const CREDENTIAL_EXPIRY = 7 * 24 * 60 * 60 * 1000; // 7 days in milliseconds

/**
 * Derive a session key from the authentication information
 * @param {string} authToken - JWT authentication token
 * @param {string} keyFingerprint - User's PGP key fingerprint
 * @returns {Promise<string>} - Derived session key for encryption
 */
export async function deriveSessionKey(authToken, keyFingerprint) {
  try {
    // Create a message combining auth token and fingerprint
    const encoder = new TextEncoder();
    const data = encoder.encode(`${authToken}:${keyFingerprint}`);
    
    // Use SHA-256 to derive a key
    const hashBuffer = await crypto.subtle.digest('SHA-256', data);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    const hashHex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
    
    return hashHex;
  } catch (error) {
    console.error('Error deriving session key:', error);
    throw new Error('Failed to derive session key');
  }
}

/**
 * Encrypt data with the session key
 * @param {string} sessionKey - Session encryption key
 * @param {string} data - Data to encrypt (usually JSON string)
 * @returns {Promise<string>} - Encrypted data
 */
export async function encryptWithSessionKey(sessionKey, data) {
  try {
    // Convert the session key to a proper format for encryption
    const encoder = new TextEncoder();
    const keyData = encoder.encode(sessionKey);
    
    // Create a random initialization vector
    const iv = window.crypto.getRandomValues(new Uint8Array(12));
    
    // Import the key
    const key = await window.crypto.subtle.importKey(
      'raw',
      keyData.slice(0, 32), // Use first 32 bytes of the hash as the key
      { name: 'AES-GCM', length: 256 },
      false,
      ['encrypt']
    );
    
    // Encrypt the data
    const dataBuffer = encoder.encode(data);
    const encryptedBuffer = await window.crypto.subtle.encrypt(
      { name: 'AES-GCM', iv },
      key,
      dataBuffer
    );
    
    // Convert to Base64 string for storage
    const encryptedArray = new Uint8Array(encryptedBuffer);
    const ivString = Array.from(iv).map(b => String.fromCharCode(b)).join('');
    const encryptedString = Array.from(encryptedArray).map(b => String.fromCharCode(b)).join('');
    
    // Return combined IV and encrypted data
    return btoa(`${ivString}:${encryptedString}`);
  } catch (error) {
    console.error('Error encrypting data:', error);
    throw new Error('Failed to encrypt data');
  }
}

/**
 * Decrypt data with the session key
 * @param {string} sessionKey - Session encryption key
 * @param {string} encryptedData - Encrypted data to decrypt
 * @returns {Promise<string>} - Decrypted data
 */
export async function decryptWithSessionKey(sessionKey, encryptedData) {
  try {
    // Convert the session key to a proper format for decryption
    const encoder = new TextEncoder();
    const keyData = encoder.encode(sessionKey);
    
    // Decode the Base64 string
    const decoded = atob(encryptedData);
    const [ivString, encryptedString] = decoded.split(':');
    
    // Convert strings back to Uint8Arrays
    const iv = new Uint8Array(ivString.split('').map(c => c.charCodeAt(0)));
    const encryptedBuffer = new Uint8Array(encryptedString.split('').map(c => c.charCodeAt(0)));
    
    // Import the key
    const key = await window.crypto.subtle.importKey(
      'raw',
      keyData.slice(0, 32), // Use first 32 bytes of the hash as the key
      { name: 'AES-GCM', length: 256 },
      false,
      ['decrypt']
    );
    
    // Decrypt the data
    const decryptedBuffer = await window.crypto.subtle.decrypt(
      { name: 'AES-GCM', iv },
      key,
      encryptedBuffer
    );
    
    // Convert the decrypted data back to a string
    const decoder = new TextDecoder();
    return decoder.decode(decryptedBuffer);
  } catch (error) {
    console.error('Error decrypting data:', error);
    throw new Error('Failed to decrypt data');
  }
}

/**
 * Encrypt mail credentials with user's public key for extra security
 * @param {Object} credentials - Mail credentials object
 * @param {string} publicKey - User's PGP public key
 * @returns {Promise<string>} - PGP encrypted credentials
 */
export async function encryptWithPublicKey(credentials, publicKey) {
  try {
    const credentialsJson = JSON.stringify(credentials);
    return await pgpUtils.encryptMessage(credentialsJson, publicKey);
  } catch (error) {
    console.error('Error encrypting with public key:', error);
    throw new Error('Failed to encrypt credentials with public key');
  }
}

/**
 * Decrypt mail credentials with user's private key
 * @param {string} encryptedCredentials - PGP encrypted credentials
 * @param {string} privateKey - User's PGP private key
 * @param {string} passphrase - Passphrase for private key (if any)
 * @returns {Promise<Object>} - Decrypted credentials object
 */
export async function decryptWithPrivateKey(encryptedCredentials, privateKey, passphrase = '') {
  try {
    const credentialsJson = await pgpUtils.decryptMessage(encryptedCredentials, privateKey, passphrase);
    return JSON.parse(credentialsJson);
  } catch (error) {
    console.error('Error decrypting with private key:', error);
    throw new Error('Failed to decrypt credentials with private key');
  }
}

/**
 * Store mail account credentials securely
 * @param {string} accountId - Unique identifier for the mail account
 * @param {Object} credentials - Credentials to store
 * @param {string} sessionKey - Session encryption key
 * @param {boolean} rememberDevice - Whether to remember for long term
 * @returns {Promise<void>}
 */
export async function storeCredentials(accountId, credentials, sessionKey, rememberDevice = false) {
  try {
    // Add metadata to credentials
    const credentialsWithMeta = {
      ...credentials,
      timestamp: Date.now(),
      expiry: rememberDevice ? Date.now() + CREDENTIAL_EXPIRY : null
    };
    
    // Encrypt credentials
    const encrypted = await encryptWithSessionKey(sessionKey, JSON.stringify(credentialsWithMeta));
    
    // Store in the appropriate storage
    const storageKey = `${STORAGE_PREFIX}${accountId}`;
    
    if (rememberDevice) {
      localStorage.setItem(storageKey, encrypted);
    } else {
      sessionStorage.setItem(storageKey, encrypted);
    }
  } catch (error) {
    console.error('Error storing credentials:', error);
    throw new Error('Failed to store credentials securely');
  }
}

/**
 * Retrieve mail account credentials
 * @param {string} accountId - Unique identifier for the mail account
 * @param {string} sessionKey - Session encryption key
 * @returns {Promise<Object|null>} - Credentials object or null if not found/expired
 */
export async function getCredentials(accountId, sessionKey) {
  try {
    const storageKey = `${STORAGE_PREFIX}${accountId}`;
    
    // Try session storage first
    let encrypted = sessionStorage.getItem(storageKey);
    let storage = 'session';
    
    // If not in session storage, try local storage
    if (!encrypted) {
      encrypted = localStorage.getItem(storageKey);
      storage = 'local';
    }
    
    // If not found in either storage, return null
    if (!encrypted) {
      return null;
    }
    
    // Decrypt the credentials
    const decrypted = await decryptWithSessionKey(sessionKey, encrypted);
    const credentials = JSON.parse(decrypted);
    
    // Check if credentials have expired
    if (credentials.expiry && Date.now() > credentials.expiry) {
      // Remove expired credentials
      if (storage === 'local') {
        localStorage.removeItem(storageKey);
      } else {
        sessionStorage.removeItem(storageKey);
      }
      return null;
    }
    
    return credentials;
  } catch (error) {
    console.error('Error retrieving credentials:', error);
    return null;
  }
}

/**
 * Clear all stored credentials
 * @returns {void}
 */
export function clearAllCredentials() {
  try {
    // Clear session key
    sessionStorage.removeItem(SESSION_KEY);
    
    // Find all credential items in storages
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key.startsWith(STORAGE_PREFIX)) {
        localStorage.removeItem(key);
      }
    }
    
    for (let i = 0; i < sessionStorage.length; i++) {
      const key = sessionStorage.key(i);
      if (key.startsWith(STORAGE_PREFIX)) {
        sessionStorage.removeItem(key);
      }
    }
  } catch (error) {
    console.error('Error clearing credentials:', error);
  }
}

/**
 * Initialize the session key and store it for the current session
 * @param {string} authToken - JWT authentication token
 * @param {string} keyFingerprint - User's PGP key fingerprint
 * @returns {Promise<string>} - The derived session key
 */
export async function initializeSessionKey(authToken, keyFingerprint) {
  try {
    const sessionKey = await deriveSessionKey(authToken, keyFingerprint);
    sessionStorage.setItem(SESSION_KEY, sessionKey);
    return sessionKey;
  } catch (error) {
    console.error('Error initializing session key:', error);
    throw new Error('Failed to initialize session key');
  }
}

/**
 * Get the current session key or derive a new one
 * @param {string} authToken - JWT authentication token
 * @param {string} keyFingerprint - User's PGP key fingerprint
 * @returns {Promise<string>} - The session key
 */
export async function getSessionKey(authToken, keyFingerprint) {
  const existingKey = sessionStorage.getItem(SESSION_KEY);
  
  if (existingKey) {
    return existingKey;
  }
  
  return await initializeSessionKey(authToken, keyFingerprint);
}

/**
 * Derive the user's mail password from their private key
 * This password is used for IMAP/SMTP authentication
 * 
 * @param {string} email - User's email address
 * @param {string} privateKey - User's private PGP key
 * @param {string} passphrase - Optional passphrase for private key
 * @returns {Promise<string>} - Derived password for mail server
 */
export async function getDovecotPassword(email, privateKey, passphrase = '') {
  try {
    if (!email || !privateKey) {
      throw new Error('Email and private key are required for mail password derivation');
    }
    
    // Use the dovecotAuth utility to derive the password
    const mailPassword = await deriveDovecotPassword(email, privateKey, passphrase);
    
    return mailPassword;
  } catch (error) {
    console.error('Error deriving mail password:', error);
    throw new Error('Failed to derive mail password');
  }
}

export default {
  deriveSessionKey,
  encryptWithSessionKey,
  decryptWithSessionKey,
  encryptWithPublicKey,
  decryptWithPrivateKey,
  storeCredentials,
  getCredentials,
  clearAllCredentials,
  initializeSessionKey,
  getSessionKey,
  getDovecotPassword
};