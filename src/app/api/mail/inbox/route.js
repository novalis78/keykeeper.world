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
  try {
    // Get user info and credentials from the request
    const body = await request.json();
    const { userId, credentials } = body;
    
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
      // If no credentials provided, check if user has any mail accounts
      // This is for backward compatibility and will be deprecated
      const hasMailAccount = await passwordManager.hasMailAccount(userId);
      if (!hasMailAccount) {
        return NextResponse.json(
          { error: 'User does not have a mail account' },
          { status: 404 }
        );
      }
      
      // Get the primary mail account for the user
      const mailAccount = await passwordManager.getPrimaryMailAccount(userId);
      if (!mailAccount) {
        return NextResponse.json(
          { error: 'Could not retrieve mail account information' },
          { status: 500 }
        );
      }
      
      // Get the mail password for the user (legacy method)
      const mailPassword = await passwordManager.getMailPassword(userId);
      if (!mailPassword) {
        return NextResponse.json(
          { error: 'Mail credentials required', requireCredentials: true },
          { status: 401 }
        );
      }
    }
    
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
      console.log(`[Mail API] Using user-provided credentials for ${mailAddress}`);
    } else {
      // Use legacy stored credentials (backward compatibility)
      mailAddress = mailAccount.email;
      mailPass = mailPassword;
      imapHost = process.env.MAIL_HOST || 'localhost';
      imapPort = parseInt(process.env.MAIL_IMAP_PORT || '993');
      imapSecure = process.env.MAIL_IMAP_SECURE !== 'false';
      console.log(`[Mail API] Using stored credentials for ${mailAddress}`);
    }
    
    // Set up IMAP client
    const client = new ImapFlow({
      host: imapHost,
      port: imapPort,
      secure: imapSecure,
      auth: {
        user: mailAddress,
        pass: mailPass
      },
      logger: false,
      tls: {
        rejectUnauthorized: process.env.NODE_ENV === 'production'
      }
    });
    
    // Connect to the server
    await client.connect();
    console.log(`[Mail API] Connected to IMAP server for ${mailAddress}`);
    
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
      
      // Fetch messages in the range
      for await (const message of client.fetch(`${startSeq}:${endSeq}`, {
        uid: true,
        flags: true,
        envelope: true,
        bodyStructure: true,
        bodyParts: ['TEXT', 'HEADER']
      })) {
        try {
          // Get message header and body
          const headerPart = message.bodyParts.get('HEADER');
          const textPart = message.bodyParts.get('TEXT');
          
          // Parse the complete message
          const parsedMessage = await simpleParser(headerPart + '\r\n\r\n' + textPart);
          
          // Extract message data
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
            read: message.flags.includes('\\Seen'),
            flagged: message.flags.includes('\\Flagged'),
            answered: message.flags.includes('\\Answered'),
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
          if (message.flags.includes('\\Flagged')) {
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
    
    // Logout from the server
    await client.logout();
    
    return NextResponse.json({ messages });
    
  } catch (error) {
    console.error('[Mail API] Error fetching inbox:', error);
    
    return NextResponse.json(
      { error: 'Error fetching inbox', details: error.message },
      { status: 500 }
    );
  }
}