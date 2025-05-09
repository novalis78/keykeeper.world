'use client';

/**
 * Dovecot Authentication Utilities
 * 
 * This module provides utilities for generating deterministic passwords
 * from PGP keys that can be used for authenticating with Dovecot IMAP/SMTP services.
 * 
 * The concept:
 * 1. A stable input (email + server name) is signed with the user's private key
 * 2. The signature is hashed to create a deterministic password
 * 3. This password is used for Dovecot IMAP/SMTP authentication
 * 4. The same password can be regenerated whenever needed as long as the user has their private key
 */

import pgpUtils from '@/lib/auth/pgp';

// Constants
const DOVECOT_AUTH_SALT = 'keykeeper-dovecot-auth';
const DOVECOT_AUTH_VERSION = 'v1';

/**
 * Derive a deterministic password for Dovecot authentication
 * @param {string} email - User's email address 
 * @param {string} privateKey - User's PGP private key
 * @param {string} passphrase - Passphrase for private key (optional)
 * @returns {Promise<string>} - Derived password for Dovecot authentication
 */
export async function deriveDovecotPassword(email, privateKey, passphrase = '') {
  try {
    console.log('=== KEYKEEPER: Starting Dovecot password derivation ===');
    
    if (!email || !privateKey) {
      console.error('Missing required parameters for password derivation');
      throw new Error('Email and private key are required for Dovecot password derivation');
    }
    
    console.log(`Deriving password for email: ${email}`);
    console.log(`Private key provided: ${privateKey ? 'YES (length: ' + privateKey.length + ')' : 'NO'}`);
    console.log(`Passphrase provided: ${passphrase ? 'YES' : 'NO'}`);
    
    // Create a stable input for signing
    const input = `${DOVECOT_AUTH_SALT}:${email}:${DOVECOT_AUTH_VERSION}`;
    console.log(`Input string for signing: "${input}"`);
    
    // Sign the input with the private key
    console.log('Calling pgpUtils.signMessage to sign the input...');
    const signature = await pgpUtils.signMessage(input, privateKey, passphrase);
    console.log(`Signature generated successfully (length: ${signature.length})`);
    
    // Hash the signature to create a password of appropriate length
    // We use SHA-256 and then take a subset of the resulting hash
    console.log('Hashing the signature with SHA-256...');
    const encoder = new TextEncoder();
    const data = encoder.encode(signature);
    const hashBuffer = await crypto.subtle.digest('SHA-256', data);
    
    // Convert the hash to a string that can be used as a password
    // We'll use base64 encoding for better compatibility with mail servers
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    const hashBase64 = btoa(String.fromCharCode.apply(null, hashArray));
    console.log(`Base64 hash generated (length: ${hashBase64.length})`);
    
    // Create a password of reasonable length (32 chars) that meets complexity requirements
    // Replace any chars that might cause issues with mail servers
    const cleanPassword = hashBase64
      .substring(0, 32)
      .replace(/\+/g, 'A')  // Replace '+' with 'A'
      .replace(/\//g, 'B')  // Replace '/' with 'B'
      .replace(/=/g, 'C');  // Replace '=' with 'C'
    
    console.log(`Clean password generated (length: ${cleanPassword.length})`);
    console.log('=== KEYKEEPER: Dovecot password derivation completed successfully ===');
    
    return cleanPassword;
  } catch (error) {
    console.error('=== KEYKEEPER ERROR: Failed to derive Dovecot password ===');
    console.error('Error details:', error);
    console.error('Stack trace:', error.stack);
    throw new Error('Failed to derive Dovecot password: ' + error.message);
  }
}

/**
 * Generate a deterministic password hash for server-side storage
 * This would be used during account creation to store the hash in the database
 * 
 * @param {string} email - User's email address
 * @param {string} publicKey - User's PGP public key
 * @returns {Promise<string>} - Password hash string (for storage in virtual_users.password)
 */
export async function generateServerPasswordHash(email, publicKey) {
  try {
    if (!email || !publicKey) {
      throw new Error('Email and public key are required for password hash generation');
    }
    
    // In a real implementation, this would:
    // 1. Extract key information from the public key
    // 2. Generate a server-side challenge
    // 3. Create a deterministic hash that can be verified against client-generated passwords
    
    // For now, we'll return a mock password hash that would work in development
    // This would be replaced with a secure implementation that integrates with your mail server
    return '{SHA512-CRYPT}$6$salt$mockHashForDevelopment';
  } catch (error) {
    console.error('Error generating server password hash:', error);
    throw new Error('Failed to generate server password hash');
  }
}

/**
 * Verify a deterministic password against the public key
 * This would be used server-side to verify the client-derived password
 * 
 * @param {string} password - The derived password to verify
 * @param {string} email - User's email address
 * @param {string} publicKey - User's PGP public key
 * @returns {Promise<boolean>} - Whether the password is valid
 */
export async function verifyDovecotPassword(password, email, publicKey) {
  try {
    if (!password || !email || !publicKey) {
      return false;
    }
    
    // In a real implementation, this would:
    // 1. Extract key information from the public key
    // 2. Recreate the expected password hash
    // 3. Compare with the provided password
    
    // For now, we'll return true for testing
    return true;
  } catch (error) {
    console.error('Error verifying Dovecot password:', error);
    return false;
  }
}

export default {
  deriveDovecotPassword,
  generateServerPasswordHash,
  verifyDovecotPassword
};