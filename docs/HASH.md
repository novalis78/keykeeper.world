# KeyKeeper Mail Password Hashing

This document outlines the password hashing approach used in KeyKeeper for mail account credentials.

## Overview

KeyKeeper uses a deterministic password approach for mail accounts, with robust hashing mechanisms for storing credentials in the `virtual_users` table. The system is designed to work with Dovecot's authentication mechanisms while maintaining strong security.

## Password Storage Formats

Dovecot supports multiple password formats, each with their own security implications:

1. `{SHA512-CRYPT}` - Uses the crypt(3) function with SHA-512 and salting
2. `{PLAIN}` - No hashing (used in development only)
3. `{MD5}` - Simple MD5 hashing (not recommended)

In production, KeyKeeper uses `{SHA512-CRYPT}` by default.

## Implementation Details

### Password Generation

1. **Deterministic Password Derivation**:
   - During registration, a deterministic password is derived from the user's PGP key
   - The same algorithm is used during login to ensure matching credentials
   - This allows seamless activation without requiring the user to remember a separate password

2. **Server-Side Hashing**:
   - The derived password is hashed using OpenSSL's implementation of SHA-512 with salt
   - Example command: `openssl passwd -6 -salt "$SALT" "$PASSWORD"`
   - The hash format is `$6$salt$hash` prefixed with `{SHA512-CRYPT}`

### Mail Account Activation

1. **Initial Account Creation**:
   - When a mail account is created, the `pending_activation` flag is set to `1`
   - A temporary password hash is stored in the `virtual_users` table

2. **First Login Activation**:
   - On first login, the user's client derives the mail password using the PGP private key
   - This password is sent to the `/api/mail/activate` endpoint
   - The endpoint updates the password hash and sets `pending_activation` to `0`

## Security Considerations

1. **No Plaintext Storage**:
   - Mail passwords are never stored in plaintext in the database
   - The password is temporarily stored in the `users` table (encrypted) to assist with activation

2. **Salt Generation**:
   - Each password has a unique salt generated using crypto's secure random functions
   - This prevents rainbow table attacks even if the database is compromised

3. **Client-Side Security**:
   - Clients can store credentials locally but should encrypt them
   - Session key derivation protects stored credentials

## Best Practices

1. Always use the strongest hashing algorithm available (`SHA512-CRYPT`)
2. Generate unique salts for each password
3. Never log or expose passwords in plaintext
4. Rotate passwords periodically (upcoming feature)
5. Use encrypted connections (TLS) for all authentication attempts