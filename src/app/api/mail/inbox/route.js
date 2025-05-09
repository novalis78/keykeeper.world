import { NextResponse } from 'next/server';
import { ImapFlow } from 'imapflow';
import { simpleParser } from 'mailparser';
import db from '@/lib/db';
import passwordManager from '@/lib/users/passwordManager';

export const dynamic = 'force-dynamic';

/**
 * Fetches emails from the user's inbox via IMAP
 * 
 * @param {Request} request The incoming request object
 * @returns {Promise<NextResponse>} JSON response with inbox messages
 */
export async function POST(request) {
  // Reference for client that needs to be closed in finally block
  let client = null;
  
  try {
    // Get user info and credentials from the request
    const body = await request.json();
    const { userId, credentials } = body;
    
    console.log(`[Mail API] Got request for user ID: ${userId}`);
    console.log(`[Mail API] Credentials provided: ${credentials ? 'YES' : 'NO'}`);
    
    if (credentials) {
      // Log credential info without exposing the password
      const credInfo = {
        email: credentials.email,
        hasPassword: !!credentials.password,
        server: credentials.imapServer,
        port: credentials.imapPort,
        secure: credentials.imapSecure
      };
      console.log(`[Mail API] Credential details:`, credInfo);
    }
    
    if (!userId) {
      return NextResponse.json(
        { error: 'User ID is required' },
        { status: 400 }
      );
    }
    
    // Get user details from the database
    const user = await db.users.findById(userId);
    if (!user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }
    
    // Check if credentials are provided directly
    if (!credentials || !credentials.email || !credentials.password) {
      console.log(`[Mail API] No credentials provided for user ${userId}, checking mail account status...`);
      
      // If no credentials provided, check if user has any mail accounts
      const hasMailAccount = await passwordManager.hasMailAccount(userId);
      if (!hasMailAccount) {
        console.log(`[Mail API] User ${userId} does not have a mail account in virtual_users table`);
        return NextResponse.json(
          { error: 'User does not have a mail account' },
          { status: 404 }
        );
      }
      
      console.log(`[Mail API] User ${userId} has a mail account, retrieving details...`);
      
      // Get the primary mail account for the user
      const mailAccount = await passwordManager.getPrimaryMailAccount(userId);
      if (!mailAccount) {
        console.log(`[Mail API] Could not retrieve mail account info for user ${userId}`);
        return NextResponse.json(
          { error: 'Could not retrieve mail account information' },
          { status: 500 }
        );
      }
      
      console.log(`[Mail API] Found mail account: ${mailAccount.email} for user ${userId}`);
      console.log(`[Mail API] Need client-side derived password - returning 401 with account info`);
      
      // Client must provide deterministically derived password
      // This is part of the passwordless approach where the password
      // is derived from the private key on the client side
      return NextResponse.json(
        { 
          error: 'Mail credentials required',
          requireCredentials: true,
          mailAccount: {
            email: mailAccount.email,
            username: mailAccount.username,
            server: process.env.MAIL_HOST || 'mail.keykeeper.world',
            port: parseInt(process.env.MAIL_IMAP_PORT || '993'),
            secure: process.env.MAIL_IMAP_SECURE !== 'false'
          },
          authInfo: {
            saltValue: process.env.DOVECOT_AUTH_SALT || 'keykeeper-dovecot-auth',
            version: process.env.DOVECOT_AUTH_VERSION || 'v1'
          }
        },
        { status: 401 }
      );
    }
    
    console.log(`[Mail API] Credentials provided for mail access: ${credentials.email}`);
    
    // Determine which credentials to use
    let mailAddress;
    let mailPass;
    let imapHost;
    let imapPort;
    let imapSecure;
    
    if (credentials) {
      // Use provided credentials
      mailAddress = credentials.email;
      mailPass = credentials.password;
      imapHost = credentials.imapServer || process.env.MAIL_HOST || 'localhost';
      imapPort = credentials.imapPort || parseInt(process.env.MAIL_IMAP_PORT || '993');
      imapSecure = credentials.imapSecure !== undefined ? credentials.imapSecure : process.env.MAIL_IMAP_SECURE !== 'false';
      
      // Log credential info for debugging (mask password)
      console.log(`[Mail API] Using user-provided credentials for ${mailAddress}`);
      console.log(`[Mail API] Password provided: ${mailPass ? 'YES (length: ' + mailPass.length + ', first chars: ' + mailPass.substring(0, 3) + '...)' : 'NO'}`);
      console.log(`[Mail API] IMAP server: ${imapHost}:${imapPort} (secure: ${imapSecure ? 'YES' : 'NO'})`);
    } else {
      // This branch shouldn't be reached due to the check above, but keeping it for safety
      return NextResponse.json(
        { error: 'Mail credentials required', requireCredentials: true },
        { status: 401 }
      );
    }
    
    // Set up IMAP client
    console.log(`[Mail API] Setting up IMAP client with rejectUnauthorized: ${process.env.NODE_ENV === 'production'}`);
    
    client = new ImapFlow({
      host: imapHost,
      port: imapPort,
      secure: imapSecure,
      auth: {
        user: mailAddress,
        pass: mailPass
      },
      logger: false,
      tls: {
        // Allow self-signed certificates in development
        rejectUnauthorized: false // Set to false for development to allow self-signed certs
      }
    });
    
    // Connect to the server
    try {
      console.log(`[Mail API] Attempting to connect to IMAP server ${imapHost}:${imapPort} for ${mailAddress}...`);
      console.log(`[Mail API] Using secure connection: ${imapSecure ? 'YES' : 'NO'}`);
      console.log(`[Mail API] Using rejectUnauthorized: ${process.env.NODE_ENV === 'production'}`);
      console.log(`[Mail API] Password length: ${mailPass?.length || 0}, first chars: ${mailPass ? mailPass.substring(0, 3) : 'none'}...`);
      
      try {
        await client.connect();
        console.log(`[Mail API] ✅ Successfully connected to IMAP server for ${mailAddress}`);
      } catch (innerError) {
        console.error(`[Mail API] ❌ IMAP connection inner error:`, innerError);
        console.error(`[Mail API] Error code:`, innerError.code);
        console.error(`[Mail API] Error name:`, innerError.name);
        console.error(`[Mail API] Error response:`, innerError.response);
        console.error(`[Mail API] Error details:`, JSON.stringify(innerError, Object.getOwnPropertyNames(innerError)));
        throw innerError;
      }
    } catch (connectError) {
      console.error(`[Mail API] ❌ IMAP connection error for ${mailAddress}:`, connectError.message);
      console.error(`[Mail API] Error details:`, JSON.stringify(connectError, Object.getOwnPropertyNames(connectError)));
      
      // Return a more detailed error response
      return NextResponse.json(
        { 
          error: 'Error fetching inbox', 
          details: connectError.message,
          authFailed: connectError.authenticationFailed || false,
          responseText: connectError.responseText || null,
          serverResponseCode: connectError.serverResponseCode || null
        },
        { status: 500 }
      );
    }
    
    // Select the mailbox to open
    const mailbox = await client.mailboxOpen('INBOX');
    console.log(`[Mail API] Opened INBOX with ${mailbox.exists} messages`);
    
    // Fetch the most recent 20 messages
    const messages = [];
    const messageCount = mailbox.exists;
    
    if (messageCount > 0) {
      // Get the range of message numbers to fetch (most recent 20 messages)
      const startSeq = Math.max(1, messageCount - 19);
      const endSeq = messageCount;
      
      // Fetch messages in the range - get full message content
      for await (const message of client.fetch(`${startSeq}:${endSeq}`, {
        uid: true,
        flags: true,
        envelope: true,
        bodyStructure: true,
        source: true // Get the full RFC822 source of the message
      })) {
        try {
          // Debug log the message object structure without exposing sensitive data
          console.log(`[Mail API] Processing message ${message.uid}, has flags: ${!!message.flags}, flags type: ${typeof message.flags}`);
          if (message.flags) {
            console.log(`[Mail API] Flags: ${JSON.stringify(Array.isArray(message.flags) ? message.flags : Object.keys(message.flags))}`);
          }
          
          // Get full message source - this is the RFC822 complete message
          const source = message.source || '';
          
          if (!source) {
            console.log(`[Mail API] Warning: Message ${message.uid} has no source content`);
          } else {
            console.log(`[Mail API] Message ${message.uid} source length: ${source.length}`);
            // Debug - show the first part of the message to troubleshoot
            console.log(`[Mail API] Message ${message.uid} source preview: ${source.substring(0, 200)}...`);
          }
          
          // Parse the complete message using the full RFC822 source
          const parsedMessage = await simpleParser(source);
          
          // Log what we managed to extract
          console.log(`[Mail API] Parsed message ${message.uid}:`);
          console.log(`  Subject: ${parsedMessage.subject || '(No Subject)'}`);
          console.log(`  From: ${parsedMessage.from?.text || 'Unknown'}`);
          console.log(`  To: ${parsedMessage.to?.text || 'Unknown'}`);
          console.log(`  Date: ${parsedMessage.date?.toISOString() || 'Unknown'}`);
          console.log(`  Text body length: ${parsedMessage.text?.length || 0}`);
          console.log(`  HTML body length: ${parsedMessage.html?.length || 0}`);
          
          // Extract message data
          // CRITICAL FIX: Force flags to be always treated as an array to avoid includes errors
          const flags = message.flags || [];
          const flagsArray = Array.isArray(flags) ? flags : 
                             (typeof flags === 'string' ? [flags] : 
                             (typeof flags === 'object' ? Object.keys(flags) : []));
          
          console.log(`[Mail API] Message ${message.uid} flags converted to array: ${JSON.stringify(flagsArray)}`);
                       
          const messageData = {
            id: message.uid,
            subject: parsedMessage.subject || '(No Subject)',
            from: {
              name: parsedMessage.from?.value[0]?.name || parsedMessage.from?.value[0]?.address || 'Unknown',
              email: parsedMessage.from?.value[0]?.address || ''
            },
            to: {
              name: parsedMessage.to?.value[0]?.name || user.email,
              email: user.email
            },
            // Use indexOf for maximum compatibility instead of includes
            read: flagsArray.indexOf('\\Seen') >= 0,
            flagged: flagsArray.indexOf('\\Flagged') >= 0,
            answered: flagsArray.indexOf('\\Answered') >= 0,
            labels: [],
            timestamp: parsedMessage.date?.toISOString() || new Date().toISOString(),
            snippet: parsedMessage.text?.substring(0, 120) + '...' || '',
            encryptedBody: false,
            attachments: parsedMessage.attachments?.map(att => ({
              name: att.filename,
              size: att.size || 0,
              contentType: att.contentType
            })) || []
          };
          
          // Add any special labels based on flags or headers
          // Use the safe flagsArray instead of direct flag access
          if (flagsArray.indexOf('\\Flagged') >= 0) {
            messageData.labels.push('important');
          }
          
          // Check for PGP encrypted content
          if (parsedMessage.text && parsedMessage.text.includes('-----BEGIN PGP MESSAGE-----')) {
            messageData.encryptedBody = true;
            messageData.labels.push('encrypted');
          }
          
          // Add the message to our array
          messages.push(messageData);
        } catch (parseError) {
          console.error(`[Mail API] Error parsing message ${message.uid}:`, parseError);
        }
      }
      
      // Sort messages by date (newest first)
      messages.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
    }
    
    // Connection will be closed in finally block
    
    // Safely serialize the messages to avoid circular references
    try {
      // Convert to a plain object to avoid circular references 
      const safeMessages = JSON.parse(JSON.stringify(messages));
      return NextResponse.json({ messages: safeMessages });
    } catch (serializeError) {
      console.error('[Mail API] Error serializing messages:', serializeError);
      
      // Create a manually sanitized version of the messages if JSON.stringify fails
      const sanitizedMessages = messages.map(msg => ({
        id: msg.id,
        subject: msg.subject,
        from: {
          name: msg.from?.name || 'Unknown',
          email: msg.from?.email || ''
        },
        to: {
          name: msg.to?.name || '',
          email: msg.to?.email || ''
        },
        read: !!msg.read,
        flagged: !!msg.flagged,
        answered: !!msg.answered,
        labels: Array.isArray(msg.labels) ? [...msg.labels] : [],
        timestamp: msg.timestamp,
        snippet: msg.snippet || '',
        encryptedBody: !!msg.encryptedBody,
        attachments: (msg.attachments || []).map(att => ({
          name: att.name || 'attachment',
          size: att.size || 0,
          contentType: att.contentType || 'application/octet-stream'
        }))
      }));
      
      return NextResponse.json({ messages: sanitizedMessages });
    }
    
  } catch (error) {
    console.error('[Mail API] Error fetching inbox:', error);
    
    // Special handling for authentication errors - return empty inbox instead of error
    if (error.authenticationFailed || error.message.includes('authentication') || 
        error.message.includes('AUTHENTICATE') || error.message.includes('AUTHENTICATIONFAILED')) {
      console.log('[Mail API] Authentication issue detected, returning empty inbox instead of error');
      return NextResponse.json({ 
        messages: [], 
        warning: 'Authentication issue detected, showing empty inbox',
        authIssue: true
      });
    }
      
    return NextResponse.json(
      { error: 'Error fetching inbox', details: error.message },
      { status: 500 }
    );
  } finally {
    // Always ensure the IMAP client is properly closed to avoid connection issues
    if (client) {
      try {
        if (client.authenticated) {
          await client.logout();
          console.log('[Mail API] Successfully logged out and closed IMAP connection');
        } else if (client.socket && client.socket.readable) {
          await client.close();
          console.log('[Mail API] Successfully closed IMAP connection');
        }
      } catch (closeError) {
        console.error('[Mail API] Error closing IMAP connection:', closeError.message);
      }
    }
  }
}