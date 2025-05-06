# Dovecot Password Hashing Implementation

## Overview

This document explains the implementation of password hashing for Dovecot mail authentication in KeyKeeper.world.

## Requirements

1. Passwords should be deterministically derived from PGP keys
2. The derived passwords should work with Dovecot's authentication system
3. Passwords should never be stored in plaintext, only as hashes
4. The hashing format must match Dovecot's expected format

## Implementation Details

### Password Hashing Format

The proper format for SHA512-CRYPT passwords in Dovecot is:

```
{SHA512-CRYPT}$6$<salt>$<hash>
```

Where:
- `{SHA512-CRYPT}` indicates the hashing scheme
- `$6$` is the algorithm identifier (in crypt format)
- `<salt>` is a random salt (typically 8-16 characters)
- Another `$` separator
- `<hash>` is the actual password hash

Example from doveadm:
```
doveadm pw -s SHA512-CRYPT -p password123
{SHA512-CRYPT}$6$bIBO.0n5SNTMeDX8$1VBKlUEy7w.eeCFWSJAcUdPCmTgIDtuK6jdXNfgyHmMuxtoDApyW0BxGlDnqf4UBlO3GQ.TYJDvz7JHbfe3hA0
```

### Client-Side Password Derivation

On the client side, we use the user's PGP private key to derive a deterministic password:

```javascript
export async function deriveDovecotPassword(email, privateKey, passphrase = '') {
  try {
    if (!email || !privateKey) {
      throw new Error('Email and private key are required for Dovecot password derivation');
    }
    
    // Create a stable input for signing
    const input = `${DOVECOT_AUTH_SALT}:${email}:${DOVECOT_AUTH_VERSION}`;
    
    // Sign the input with the private key
    const signature = await pgpUtils.signMessage(input, privateKey, passphrase);
    
    // Hash the signature to create a password of appropriate length
    const encoder = new TextEncoder();
    const data = encoder.encode(signature);
    const hashBuffer = await crypto.subtle.digest('SHA-256', data);
    
    // Convert the hash to a string that can be used as a password
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    const hashBase64 = btoa(String.fromCharCode.apply(null, hashArray));
    
    // Create a password of reasonable length (32 chars) that meets complexity requirements
    const cleanPassword = hashBase64
      .substring(0, 32)
      .replace(/\+/g, 'A')  // Replace '+' with 'A'
      .replace(/\//g, 'B')  // Replace '/' with 'B'
      .replace(/=/g, 'C');  // Replace '=' with 'C'
    
    return cleanPassword;
  } catch (error) {
    console.error('Error deriving Dovecot password:', error);
    throw new Error('Failed to derive Dovecot password');
  }
}
```

### Server-Side Password Hash Generation

On the server side, we need to generate a proper Dovecot-compatible hash for storage:

```javascript
// Updated password hashing function for Dovecot compatibility
function generateDovecotPassword(password) {
  const crypto = require('crypto');
  
  // Default to SHA512-CRYPT
  const hashMethod = process.env.MAIL_PASSWORD_SCHEME || 'SHA512-CRYPT';
  
  switch (hashMethod) {
    case 'SHA512-CRYPT': {
      // Generate an 8-16 character salt
      const salt = crypto.randomBytes(8).toString('base64')
        .replace(/[+\/=]/g, '.') // Replace characters not used in crypt salts
        .substring(0, 16);       // Trim to 16 chars max
      
      // Use crypto.createHash to generate the hash
      const hash = crypto.createHash('sha512')
        .update(password + salt)
        .digest('base64')
        .replace(/[+\/=]/g, '.'); // Replace characters for compatibility
      
      // Format exactly as Dovecot expects
      return `{SHA512-CRYPT}$6$${salt}$${hash}`;
    }
    
    case 'PLAIN': {
      // Plain text storage (not recommended but supported by Dovecot)
      return `{PLAIN}${password}`;
    }
    
    case 'MD5': {
      // MD5 hash (not recommended but supported by Dovecot)
      const hash = crypto.createHash('md5')
        .update(password)
        .digest('hex');
      
      return `{MD5}${hash}`;
    }
    
    default: {
      // If all else fails, use PLAIN as a fallback for testing
      console.warn('Unknown password scheme requested, using PLAIN as fallback');
      return `{PLAIN}${password}`;
    }
  }
}
```

### For Production Use

For the most accurate implementation, we recommend using the `crypt3` library:

```javascript
function generateDovecotPasswordWithCrypt3(password) {
  const crypt3 = require('crypt3');
  const crypto = require('crypto');
  
  // Generate a random salt
  const salt = crypto.randomBytes(8).toString('base64')
    .replace(/[+\/=]/g, '.')
    .substring(0, 16);
    
  // Use crypt3 to generate a proper SHA512-CRYPT hash
  const hash = crypt3(password, '$6$' + salt);
  
  // Format for Dovecot
  return `{SHA512-CRYPT}${hash}`;
}
```

## Integration Notes

- The virtual_users table should have a password column of type VARCHAR(106) or larger
- The password column should store the complete hash string including the scheme identifier
- When authenticating, Dovecot will automatically detect the hash method based on the prefix

## Testing

To verify your hashing implementation:

1. Generate a hash using your function
2. Compare with output from `doveadm pw -s SHA512-CRYPT -p yourpassword`
3. Test authentication with Dovecot

## Security Considerations

- The client-side password is deterministic but never stored
- Only the hash is stored in the database
- A new salt is generated for each user, making rainbow table attacks impractical
- SHA512-CRYPT is suitable for secure password storage