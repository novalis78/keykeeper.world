never push .env or .env.local files
never drop tables
git add,commit, push often for incremental checkpoints

## Deployment

Trigger Coolify deployment directly (no need for empty commits):
```bash
curl -X GET "http://107.170.27.222:8000/api/v1/deploy?uuid=qkg4okk4wk084g0cgs4g8co8&force=false" \
  -H "Authorization: Bearer 2|KiZcwJEyw2hap35PNde1yQllC49O3u6OTaWWbhkMb5026341"
```

Coolify dashboard: http://107.170.27.222:8000
Docs: https://coolify.io/docs/api-reference/api/operations/deploy-by-tag-or-uuid

## Environment

This machine runs:
- MySQL database (local)
- Postfix/Dovecot mail server
- Coolify deployment system
- The keykeeper.world codebase

## Key Architecture Notes

### PGP Key System
- Every user gets a PGP keypair generated during signup (`/signup/key-setup` → `pgpUtils.generateKey()`)
- Public key stored in `users.public_key` column in database
- Private key stays client-side only (browser storage or YubiKey)
- Outgoing emails auto-attach user's public key as `public_key.asc` (if available)
- API: `/api/user/public-key` returns current user's public key from DB

### Mail System
- Uses ImapFlow for IMAP, Nodemailer for SMTP
- Mail credentials stored in `virtual_users` table (Dovecot format with `{PLAIN}` prefix)
- Password lookup: `passwordManager.getPrimaryMailAccount(userId)` returns mail account with password
- Folder names vary by server - use `findActualFolderName()` to resolve (Sent, INBOX.Sent, etc.)
- ImapFlow returns flags as `Set` not `Array` - use `.has()` not `.includes()`

### Frontend Components
- `EmailRow` expects `message` prop (not `email`)
- `EmailDetail` expects `onBack` prop (not `onClose`)
- Both support `onReply`/`onForward` callbacks that open ComposeEmail modal

### Database Tables
- `users` - user accounts with PGP keys (public_key, fingerprint, key_id)
- `virtual_users` - mail server accounts (email, password with {PLAIN} prefix)
- `public_keys` - contacts' public keys for encryption