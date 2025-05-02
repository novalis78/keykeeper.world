# Mail System Integration

This document explains how the mail system works in KeyKeeper and how to set it up properly.

## Overview

KeyKeeper integrates with standard mail servers (Postfix/Dovecot) to provide email functionality. The system:

1. Creates mail accounts in a virtual_users table during user registration
2. Stores the mail password in the users table (encrypted)
3. Connects to IMAP to fetch emails and SMTP to send emails

## Database Setup

The mail system uses two key tables:

1. `virtual_users` - Stores mail accounts with:
   - email
   - password (hashed using SHA512-CRYPT for Dovecot)
   - user_id (links to the KeyKeeper users table)

2. `virtual_domains` - Stores domains for which mail accounts can be created

The `users` table also has a `mail_password` column that stores the encrypted mail password, as the hashed version in virtual_users can't be decrypted.

## Environment Configuration

For mail functionality to work properly, set these environment variables:

```
# Mail Server Settings
MAIL_HOST=mail.yourdomain.com
MAIL_IMAP_PORT=993
MAIL_IMAP_SECURE=true
MAIL_SMTP_PORT=587
MAIL_SMTP_SECURE=false

# Mail Database Settings
MAIL_DB_HOST=localhost
MAIL_DB_USER=vmail
MAIL_DB_PASSWORD=vmailpassword
MAIL_DB_NAME=vmail

# For using the main database instead of a separate mail database
USE_MAIN_DB_FOR_MAIL=true

# Mail Account Settings
CREATE_MAIL_ACCOUNTS=true
DEFAULT_MAIL_QUOTA=1024
MAIL_PASSWORD_SCHEME=SHA512-CRYPT

# For development/testing
MOCK_MAIL_ACCOUNTS=true
```

## How It Works

1. **User Registration**:
   - When a user registers, KeyKeeper creates a mail account in the virtual_users table
   - The password is hashed using SHA512-CRYPT for Dovecot
   - The plaintext password is encrypted and stored in the users table

2. **Email Fetching**:
   - When a user accesses their inbox, KeyKeeper:
     - Checks if the user has a mail account
     - Retrieves the decrypted mail password from the users table
     - Connects to the IMAP server using the user's email and password
     - Fetches and displays emails

3. **Email Sending**:
   - When a user sends an email, KeyKeeper:
     - Retrieves the decrypted mail password
     - Connects to the SMTP server
     - Sends the email using the user's credentials

## Troubleshooting

### "User does not have a mail account" Error

This error occurs when:
1. No virtual_users record exists with the user's user_id
2. The mail database connection is failing

Check:
- The user_id column exists in the virtual_users table
- The mail account was properly created during registration
- Database connection parameters are correct
- In development, set MOCK_MAIL_ACCOUNTS=true to bypass checks

### Email Sending Failures

If emails fail to send:
1. Verify SMTP settings are correct
2. Check the mail password is stored and retrieved correctly
3. Ensure the mail server accepts the credentials

## Development Mode

For development without a real mail server:
1. Set `MOCK_MAIL_ACCOUNTS=true` to bypass mail account checks
2. The system will use mock data for emails

## Production Setup

In production:
1. Ensure `mail_password` column exists in the users table
2. Set `CREATE_MAIL_ACCOUNTS=true` to auto-create mail accounts during registration
3. Configure proper mail server settings
4. Set `USER_MAIN_DB_FOR_MAIL=true` if your mail tables are in the main database