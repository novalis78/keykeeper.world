/**
 * Postfix mail server connector
 * 
 * This module provides direct integration with the Postfix mail server
 * using SMTP for sending emails and IMAP for receiving/fetching emails.
 * 
 * WARNING: This module is only meant to be imported in server components or API routes.
 * It contains Node.js-specific code that will not run in the browser.
 * 
 * ========================================================================
 * EMAIL DELIVERABILITY RECOMMENDATIONS
 * ========================================================================
 * 
 * For maximum email deliverability, implement the following:
 * 
 * 1. DKIM (DomainKeys Identified Mail)
 *    - Set up DKIM signatures for all outgoing mail
 *    - Add this to Postfix with OpenDKIM (see opendkim.org)
 *    - Example DNS record:
 *      selector._domainkey.keykeeper.world. IN TXT "v=DKIM1; k=rsa; p=MIGfMA0GCSqGSIb3DQEBA..."
 * 
 * 2. SPF (Sender Policy Framework)
 *    - Create an SPF record to authorize sending servers
 *    - Example DNS record:
 *      keykeeper.world. IN TXT "v=spf1 ip4:107.170.27.222 ~all"
 * 
 * 3. DMARC (Domain-based Message Authentication, Reporting & Conformance)
 *    - Configure DMARC policy to handle SPF/DKIM failures
 *    - Example DNS record:
 *      _dmarc.keykeeper.world. IN TXT "v=DMARC1; p=quarantine; rua=mailto:dmarc@keykeeper.world"
 * 
 * 4. PTR (Reverse DNS)
 *    - Set proper PTR record for the server IP (107.170.27.222)
 *    - Should resolve to mail.keykeeper.world
 * 
 * 5. Bounce Handling
 *    - Implement automated handling of bounced emails
 *    - Keep bounce rate below 2% for good reputation
 * 
 * These configurations will significantly improve email deliverability
 * and reduce the likelihood of being flagged as spam.
 */

// These imports are for server-side only
const nodemailer = typeof window === 'undefined' ? require('nodemailer') : null;
const ImapFlow = typeof window === 'undefined' ? require('imapflow').ImapFlow : null;
const simpleParser = typeof window === 'undefined' ? require('mailparser').simpleParser : null;
const fs = typeof window === 'undefined' ? require('fs/promises') : null;
const path = typeof window === 'undefined' ? require('path') : null;
import crypto from 'crypto';

// Configuration - in production, these would come from environment variables
const SMTP_CONFIG = {
  host: process.env.MAIL_HOST || '107.170.27.222',
  port: 587,
  secure: false, // true for 465, false for other ports
  auth: {
    user: process.env.MAIL_USER || 'lennart@keykeeper.world',
    pass: process.env.MAIL_PASSWORD, // Must be provided via environment variable
    type: 'LOGIN' // Use uppercase LOGIN instead of lowercase login
  },
  tls: {
    rejectUnauthorized: false // Allow self-signed certificates
  },
  authMethod: 'LOGIN' // Force LOGIN auth method instead of PLAIN
};

const IMAP_CONFIG = {
  host: process.env.MAIL_HOST || '107.170.27.222',
  port: 993,
  secure: true,
  auth: {
    user: process.env.MAIL_USER || 'lennart@keykeeper.world',
    pass: process.env.MAIL_PASSWORD, // Must be provided via environment variable
    type: 'LOGIN' // Use uppercase LOGIN instead of lowercase login
  },
  tls: {
    rejectUnauthorized: false // Allow self-signed certificates
  },
  authMethod: 'LOGIN' // Force LOGIN auth method instead of PLAIN
};

// Create reusable transporter object for SMTP
let smtpTransporter = null;

/**
 * Initialize the SMTP transporter
 * 
 * @param {Object} config Custom configuration (optional)
 * @returns {Object} Nodemailer transporter instance
 */
export function initSMTP(config = {}) {
  smtpTransporter = nodemailer.createTransport({
    ...SMTP_CONFIG,
    ...config
  });
  
  return smtpTransporter;
}

/**
 * Get the SMTP transporter, initializing if needed
 * 
 * @param {Object} config Custom configuration (optional)
 * @returns {Object} Nodemailer transporter instance
 */
export function getSMTPTransporter(config = {}) {
  if (!smtpTransporter) {
    return initSMTP(config);
  }
  
  // If auth is provided in config, update the transporter's auth
  if (config.auth) {
    smtpTransporter.options.auth = {
      ...smtpTransporter.options.auth,
      ...config.auth,
      // Always ensure we have the login type and not PLAIN
      type: 'LOGIN' // Use uppercase LOGIN instead of lowercase login
    };
    
    // Ensure we're using LOGIN auth method
    smtpTransporter.options.authMethod = 'LOGIN';
    
    // Log but don't reveal full credentials
    console.log(`[Mail Connector] Using SMTP credentials for: ${smtpTransporter.options.auth.user}`);
    console.log(`[Mail Connector] Auth method: ${smtpTransporter.options.authMethod}`);
    console.log(`[Mail Connector] Auth type: ${smtpTransporter.options.auth.type}`);
  }
  
  return smtpTransporter;
}

/**
 * Create an IMAP client for fetching emails
 * 
 * @param {Object} config Custom configuration (optional)
 * @returns {Object} ImapFlow client instance
 */
export function createIMAPClient(config = {}) {
  console.log('[Mail Connector] Creating IMAP client with rejectUnauthorized: false');
  
  // Make sure we respect any auth credentials passed in the config
  const mergedConfig = {
    ...IMAP_CONFIG,
    ...config
  };
  
  // Always ensure rejectUnauthorized is false for TLS
  mergedConfig.tls = {
    ...mergedConfig.tls,
    rejectUnauthorized: false // Always allow self-signed certificates
  };
  
  // If auth credentials were passed in config, make sure they take precedence
  if (config.auth) {
    mergedConfig.auth = {
      ...IMAP_CONFIG.auth,
      ...config.auth
    };
  }
  
  console.log(`[Mail Connector] Using IMAP credentials for: ${mergedConfig.auth.user}`);
  
  return new ImapFlow(mergedConfig);
}

/**
 * Send an email through Postfix using SMTP
 * 
 * @param {Object} emailData Email data including from, to, subject, html/text
 * @param {Object} options Additional options like attachments
 * @returns {Promise<Object>} Result of the send operation
 */
export async function sendEmail(emailData, options = {}) {
  try {
    const transporter = getSMTPTransporter(options.smtpConfig);
    
    // Properly format email addresses to be RFC 5322 compliant and maximize deliverability
    const formatEmailAddress = (address) => {
      if (typeof address === 'string') {
        // If it's already a properly formatted address, return it
        if (address.includes('<') && address.includes('>')) {
          return address;
        }
        // If it's just an email, return it
        return address;
      }
      
      if (typeof address === 'object') {
        if (address.name && address.email) {
          // Sanitize the name: remove quotes, control chars, and other problematic chars
          const sanitizedName = address.name
            .replace(/["\r\n\t<>()[\]\\.,;:@]/g, '')  // Remove quotes and special chars
            .replace(/\s+/g, ' ')                      // Normalize whitespace
            .trim();                                   // Trim extra spaces
          
          // If name is empty after sanitization, just use the email
          if (!sanitizedName) {
            return address.email;
          }
          
          // Format with quotes around the name
          return `"${sanitizedName}" <${address.email}>`;
        } else if (address.email) {
          return address.email;
        }
      }
      
      // Fallback case - shouldn't reach here with proper data
      console.warn('Invalid email address format, using fallback');
      return process.env.MAIL_USER || 'noreply@keykeeper.world';
    };
    
    // Format arrays of addresses
    const formatAddressList = (addresses) => {
      if (!addresses) return undefined;
      
      if (typeof addresses === 'string') {
        return addresses; // Already a string, assume it's formatted
      }
      
      if (Array.isArray(addresses)) {
        return addresses.map(addr => 
          typeof addr === 'string' ? addr : formatEmailAddress(addr)
        ).join(', ');
      }
      
      return formatEmailAddress(addresses);
    };
    
    // Prepare email data for nodemailer with optimal formatting for deliverability
    const mailOptions = {
      from: formatEmailAddress(emailData.from),
      to: formatAddressList(emailData.to),
      cc: emailData.cc ? formatAddressList(emailData.cc) : undefined,
      bcc: emailData.bcc ? formatAddressList(emailData.bcc) : undefined,
      subject: emailData.subject,
      text: emailData.text || convertHtmlToText(emailData.body),
      html: emailData.body,
      attachments: formatAttachments(emailData.attachments),
      // Add standard headers to improve reputation for personal emails
      headers: {
        'X-Mailer': 'KeyKeeper Secure Email',
        'X-Priority': '3',  // Normal priority
        'Message-ID': `<${crypto.randomBytes(16).toString('hex')}@keykeeper.world>`
      }
    };
    
    // Add debug logging for the from field
    console.log(`Sending email with From: ${mailOptions.from}`);
    console.log(`To: ${mailOptions.to}`);
    
    // Add optional headers while preserving existing ones
    if (options.headers) {
      mailOptions.headers = {
        ...mailOptions.headers,
        ...options.headers
      };
    }
    
    // Add PGP encryption if recipient public key is provided
    if (options.recipientPublicKey) {
      try {
        // Import OpenPGP
        const openpgp = await import('openpgp');
        
        console.log('[Mail] Encrypting email with recipient public key');
        
        // Read the recipient's public key
        const publicKey = await openpgp.readKey({ armoredKey: options.recipientPublicKey });
        
        // Encrypt the message
        const encrypted = await openpgp.encrypt({
          message: await openpgp.createMessage({ text: mailOptions.text || mailOptions.html }),
          encryptionKeys: publicKey,
          format: 'armored'
        });
        
        // Replace the body with encrypted content
        mailOptions.text = encrypted;
        mailOptions.html = `<pre>${encrypted}</pre>`;
        
        // Add PGP headers
        mailOptions.headers = { 
          ...mailOptions.headers,
          'X-PGP-Encrypted': 'true',
          'Content-Type': 'multipart/encrypted; protocol="application/pgp-encrypted"'
        };
        
        console.log('[Mail] Email encrypted successfully');
      } catch (encryptError) {
        console.error('[Mail] Failed to encrypt email:', encryptError);
        // Continue sending unencrypted if encryption fails
      }
    }
    
    // Log mail options for diagnostics (excluding sensitive content)
    console.log('SMTP Mail Options:', {
      from: mailOptions.from,
      to: mailOptions.to,
      subject: mailOptions.subject,
      hasHtml: !!mailOptions.html,
      hasText: !!mailOptions.text,
      headerKeys: Object.keys(mailOptions.headers || {}),
      hasAttachments: !!(mailOptions.attachments && mailOptions.attachments.length > 0),
      attachmentCount: mailOptions.attachments ? mailOptions.attachments.length : 0
    });
    
    // Send mail with defined transport object
    const info = await transporter.sendMail(mailOptions);
    
    console.log(`Email sent successfully: ${info.messageId}`);
    
    // Save to Sent folder if SMTP credentials are provided
    if (options.smtpConfig && options.smtpConfig.auth) {
      try {
        console.log('[Mail] Attempting to save email to Sent folder');
        
        // Connect to IMAP to save the sent message
        const { ImapFlow } = await import('imapflow');
        
        const client = new ImapFlow({
          host: process.env.MAIL_SERVER_HOST || 'mail',
          port: 993,
          secure: true,
          auth: {
            user: options.smtpConfig.auth.user,
            pass: options.smtpConfig.auth.pass
          },
          tls: {
            rejectUnauthorized: false
          },
          logger: false
        });
        
        await client.connect();
        
        // Find or create Sent folder
        let sentFolder = 'Sent';
        const mailboxes = await client.list();
        
        // Look for existing Sent folder
        const sentNames = ['Sent', 'Sent Messages', 'Sent Items', 'INBOX.Sent'];
        for (const name of sentNames) {
          if (mailboxes.find(mb => mb.path === name)) {
            sentFolder = name;
            break;
          }
        }
        
        // Open or create the Sent folder
        try {
          await client.mailboxOpen(sentFolder);
        } catch (e) {
          console.log(`[Mail] Creating ${sentFolder} folder`);
          await client.mailboxCreate(sentFolder);
          await client.mailboxOpen(sentFolder);
        }
        
        // Build the raw email message
        const date = new Date().toUTCString();
        let rawMessage = `Date: ${date}\r\n`;
        rawMessage += `From: ${mailOptions.from}\r\n`;
        rawMessage += `To: ${mailOptions.to}\r\n`;
        if (mailOptions.cc) rawMessage += `Cc: ${mailOptions.cc}\r\n`;
        rawMessage += `Subject: ${mailOptions.subject}\r\n`;
        rawMessage += `Message-ID: ${info.messageId}\r\n`;
        
        // Add content type
        if (mailOptions.html) {
          rawMessage += `Content-Type: text/html; charset=utf-8\r\n`;
        } else {
          rawMessage += `Content-Type: text/plain; charset=utf-8\r\n`;
        }
        
        // Add custom headers if any
        if (mailOptions.headers) {
          for (const [key, value] of Object.entries(mailOptions.headers)) {
            if (!key.toLowerCase().startsWith('content-')) {
              rawMessage += `${key}: ${value}\r\n`;
            }
          }
        }
        
        // Add blank line before body
        rawMessage += `\r\n`;
        
        // Add body
        rawMessage += mailOptions.html || mailOptions.text || '';
        
        // Append to Sent folder with Seen flag
        await client.append(sentFolder, rawMessage, ['\\Seen']);
        console.log('[Mail] Email saved to Sent folder successfully');
        
        await client.logout();
      } catch (saveError) {
        console.error('[Mail] Failed to save to Sent folder:', saveError.message);
        // Don't fail the send operation if we can't save to Sent
      }
    }
    
    return {
      success: true,
      messageId: info.messageId,
      response: info.response,
      envelope: info.envelope,
      accepted: info.accepted,
      rejected: info.rejected
    };
  } catch (error) {
    console.error('Error sending email:', error);
    return {
      success: false,
      error: error.message
    };
  }
}

/**
 * Fetch emails from IMAP server
 * 
 * @param {string} folder Folder name to fetch from (INBOX, Sent, etc.)
 * @param {Object} options Options like limit, offset, query
 * @param {Object} config Custom IMAP configuration
 * @returns {Promise<Array>} Array of email objects
 */
export async function fetchEmails(folder = 'INBOX', options = {}, config = {}) {
  const client = createIMAPClient(config);
  const emails = [];
  
  try {
    // Connect to the server
    await client.connect();
    
    // Select the mailbox
    const mailbox = await client.mailboxOpen(folder);
    
    // Default limit
    const limit = options.limit || 50;
    
    // Get the sequence range for fetching
    // Start from the latest emails
    const from = Math.max(1, mailbox.exists - limit - (options.offset || 0) + 1);
    const to = Math.max(1, mailbox.exists - (options.offset || 0));
    
    // If there are no messages, return empty array
    if (mailbox.exists === 0 || from > to) {
      await client.logout();
      return [];
    }
    
    // Fetch emails
    const messages = client.fetch(`${from}:${to}`, {
      uid: true,
      flags: true,
      envelope: true,
      bodyStructure: true,
      internalDate: true,
      bodyParts: options.fetchBody ? ['TEXT', 'HEADER'] : ['HEADER']
    });
    
    for await (const message of messages) {
      const parsedEmail = {
        id: message.uid,
        subject: message.envelope.subject,
        from: formatAddress(message.envelope.from),
        to: formatAddressArray(message.envelope.to),
        cc: formatAddressArray(message.envelope.cc),
        bcc: formatAddressArray(message.envelope.bcc),
        date: message.internalDate,
        flags: message.flags,
        isRead: message.flags.includes('\\Seen'),
        isStarred: message.flags.includes('\\Flagged'),
        hasAttachments: hasAttachments(message.bodyStructure),
        folder: folder.toLowerCase(),
        // More detailed parsing would happen in fetchEmail
        preview: options.fetchBody ? await getMessagePreview(client, message.uid) : null
      };
      
      emails.push(parsedEmail);
    }
    
    // Emails are fetched in ascending order (oldest first)
    // So we reverse to get newest first
    emails.reverse();
    
    await client.logout();
    return emails;
  } catch (error) {
    console.error('Error fetching emails:', error);
    
    if (client && client.authenticated) {
      await client.logout();
    }
    
    throw error;
  }
}

/**
 * Fetch a single email by UID
 * 
 * @param {number} uid Email UID
 * @param {string} folder Folder containing the email
 * @param {boolean} markAsRead Whether to mark the email as read
 * @param {Object} config Custom IMAP configuration
 * @returns {Promise<Object>} Full email object
 */
export async function fetchEmail(uid, folder = 'INBOX', markAsRead = true, config = {}) {
  const client = createIMAPClient(config);
  
  try {
    // Connect to the server
    await client.connect();
    
    // Select the mailbox
    await client.mailboxOpen(folder);
    
    // Fetch the message
    const message = await client.fetchOne(uid, {
      uid: true,
      flags: true,
      envelope: true,
      bodyStructure: true,
      internalDate: true,
      source: true
    });
    
    if (!message) {
      throw new Error('Email not found');
    }
    
    // Parse the raw email
    const parsedEmail = await simpleParser(message.source);
    
    // Extract attachments
    const attachments = parseAttachments(message.bodyStructure, parsedEmail);
    
    // Create the email object
    const email = {
      id: message.uid,
      subject: message.envelope.subject,
      from: formatAddress(message.envelope.from),
      to: formatAddressArray(message.envelope.to),
      cc: formatAddressArray(message.envelope.cc),
      bcc: formatAddressArray(message.envelope.bcc),
      date: message.internalDate,
      flags: message.flags,
      isRead: message.flags.includes('\\Seen'),
      isStarred: message.flags.includes('\\Flagged'),
      body: parsedEmail.html || parsedEmail.textAsHtml || parsedEmail.text,
      plainText: parsedEmail.text,
      hasAttachments: attachments.length > 0,
      attachments,
      folder: folder.toLowerCase(),
      headers: parsedEmail.headers,
      messageId: parsedEmail.messageId
    };
    
    // Mark as read if requested
    if (markAsRead && !email.isRead) {
      await client.messageFlagsAdd(uid, ['\\Seen']);
      email.isRead = true;
    }
    
    await client.logout();
    return email;
  } catch (error) {
    console.error('Error fetching email:', error);
    
    if (client && client.authenticated) {
      await client.logout();
    }
    
    throw error;
  }
}

/**
 * Update email flags (read status, starred, etc.)
 * 
 * @param {number} uid Email UID
 * @param {string} folder Folder containing the email
 * @param {Object} updates Changes to apply (isRead, isStarred, etc.)
 * @param {Object} config Custom IMAP configuration
 * @returns {Promise<Object>} Result of the update operation
 */
export async function updateEmail(uid, folder = 'INBOX', updates = {}, config = {}) {
  const client = createIMAPClient(config);
  
  try {
    // Connect to the server
    await client.connect();
    
    // Select the mailbox
    await client.mailboxOpen(folder);
    
    // Apply flag updates
    if (updates.isRead !== undefined) {
      if (updates.isRead) {
        await client.messageFlagsAdd(uid, ['\\Seen']);
      } else {
        await client.messageFlagsRemove(uid, ['\\Seen']);
      }
    }
    
    if (updates.isStarred !== undefined) {
      if (updates.isStarred) {
        await client.messageFlagsAdd(uid, ['\\Flagged']);
      } else {
        await client.messageFlagsRemove(uid, ['\\Flagged']);
      }
    }
    
    // Move to another folder if specified
    if (updates.folder && updates.folder !== folder) {
      await client.messageMove(uid, updates.folder);
    }
    
    await client.logout();
    return { success: true, uid };
  } catch (error) {
    console.error('Error updating email:', error);
    
    if (client && client.authenticated) {
      await client.logout();
    }
    
    return { success: false, error: error.message };
  }
}

/**
 * Delete an email (move to Trash or permanently delete)
 * 
 * @param {number} uid Email UID
 * @param {string} folder Folder containing the email
 * @param {boolean} permanent Whether to permanently delete
 * @param {Object} config Custom IMAP configuration
 * @returns {Promise<Object>} Result of the delete operation
 */
export async function deleteEmail(uid, folder = 'INBOX', permanent = false, config = {}) {
  const client = createIMAPClient(config);
  
  try {
    // Connect to the server
    await client.connect();
    
    // Select the mailbox
    await client.mailboxOpen(folder);
    
    if (permanent) {
      // Permanently delete
      await client.messageDelete(uid);
    } else {
      // Move to Trash
      await client.messageMove(uid, 'Trash');
    }
    
    await client.logout();
    return { 
      success: true, 
      deleted: permanent, 
      movedToTrash: !permanent 
    };
  } catch (error) {
    console.error('Error deleting email:', error);
    
    if (client && client.authenticated) {
      await client.logout();
    }
    
    return { success: false, error: error.message };
  }
}

/**
 * Get mailbox statistics
 * 
 * @param {Object} config Custom IMAP configuration
 * @returns {Promise<Object>} Mailbox statistics
 */
export async function getMailboxStats(config = {}) {
  const client = createIMAPClient(config);
  const stats = {
    folders: {},
    storage: {
      used: 0,
      total: 0,
      percentage: 0
    },
    lastRefreshed: new Date()
  };
  
  try {
    // Connect to the server
    await client.connect();
    
    // Get list of mailboxes/folders
    const mailboxes = await client.list();
    
    // Process each mailbox
    for (const mailbox of mailboxes) {
      if (mailbox.flags.includes('\\Noselect')) {
        continue; // Skip mailboxes that can't be selected
      }
      
      // Open the mailbox to get stats
      const status = await client.status(mailbox.path, {
        messages: true,
        unseen: true
      });
      
      // Normalize folder name
      const normalizedName = mailbox.path.toLowerCase();
      const folderName = getFolderDisplayName(normalizedName);
      
      stats.folders[folderName] = {
        total: status.messages,
        unread: status.unseen
      };
    }
    
    // Add special combined counts
    stats.inbox = stats.folders.inbox || { total: 0, unread: 0 };
    stats.unread = Object.values(stats.folders).reduce((sum, folder) => sum + folder.unread, 0);
    stats.total = Object.values(stats.folders).reduce((sum, folder) => sum + folder.total, 0);
    
    // TODO: Implement storage quota check if needed
    // This would typically involve a QUOTA command if supported by the server
    
    await client.logout();
    return stats;
  } catch (error) {
    console.error('Error getting mailbox stats:', error);
    
    if (client && client.authenticated) {
      await client.logout();
    }
    
    throw error;
  }
}

// ========== Utility Functions ==========

/**
 * Format a single email address from IMAP
 * 
 * @param {Array} address Array containing a single address
 * @returns {Object} Formatted address object
 */
function formatAddress(address) {
  if (!address || !address.length) {
    return { name: '', email: '' };
  }
  
  const addr = address[0];
  return {
    name: addr.name || '',
    email: `${addr.mailbox}@${addr.host}`
  };
}

/**
 * Format an array of email addresses from IMAP
 * 
 * @param {Array} addresses Array of addresses
 * @returns {Array} Array of formatted address objects
 */
function formatAddressArray(addresses) {
  if (!addresses || !addresses.length) {
    return [];
  }
  
  return addresses.map(addr => ({
    name: addr.name || '',
    email: `${addr.mailbox}@${addr.host}`
  }));
}

/**
 * Check if a message has attachments
 * 
 * @param {Object} bodyStructure Message body structure
 * @returns {boolean} True if message has attachments
 */
function hasAttachments(bodyStructure) {
  if (!bodyStructure) return false;
  
  if (bodyStructure.disposition === 'attachment') {
    return true;
  }
  
  if (bodyStructure.childNodes && bodyStructure.childNodes.length) {
    return bodyStructure.childNodes.some(node => 
      node.disposition === 'attachment' || hasAttachments(node)
    );
  }
  
  return false;
}

/**
 * Parse attachments from email
 * 
 * @param {Object} bodyStructure Message body structure
 * @param {Object} parsedEmail Parsed email from simpleParser
 * @returns {Array} Array of attachment objects
 */
function parseAttachments(bodyStructure, parsedEmail) {
  if (!parsedEmail.attachments || !parsedEmail.attachments.length) {
    return [];
  }
  
  return parsedEmail.attachments.map(attachment => ({
    id: `att-${crypto.randomBytes(8).toString('hex')}`,
    name: attachment.filename,
    size: attachment.size,
    type: attachment.contentType,
    content: attachment.content // This is a Buffer
  }));
}

/**
 * Get message preview text
 * 
 * @param {Object} client IMAP client
 * @param {number} uid Message UID
 * @returns {Promise<string>} Preview text
 */
async function getMessagePreview(client, uid) {
  try {
    const text = await client.download(uid, 'TEXT', {
      uid: true
    });
    
    if (!text) return '';
    
    const parser = await simpleParser(text);
    const preview = parser.text || '';
    
    // Return first few characters
    return preview.substring(0, 150).trim();
  } catch (error) {
    console.error('Error getting message preview:', error);
    return '';
  }
}

/**
 * Convert HTML to plain text
 * 
 * @param {string} html HTML content
 * @returns {string} Plain text content
 */
function convertHtmlToText(html) {
  if (!html) return '';
  
  // Simple conversion - could be improved with a library like html-to-text
  return html
    .replace(/<[^>]*>/g, '') // Remove HTML tags
    .replace(/&nbsp;/g, ' ') // Replace non-breaking spaces
    .replace(/&amp;/g, '&') // Replace &amp;
    .replace(/&lt;/g, '<') // Replace &lt;
    .replace(/&gt;/g, '>') // Replace &gt;
    .replace(/&quot;/g, '"') // Replace &quot;
    .replace(/&#39;/g, "'") // Replace &#39;
    .trim();
}

/**
 * Format attachments for nodemailer
 * 
 * @param {Array} attachments Array of attachment objects
 * @returns {Array} Formatted attachments for nodemailer
 */
function formatAttachments(attachments) {
  if (!attachments || !attachments.length) {
    return [];
  }
  
  return attachments.map(attachment => {
    // If attachment has a path, use that
    if (attachment.path) {
      return {
        filename: attachment.name,
        path: attachment.path,
        contentType: attachment.type
      };
    }
    
    // If attachment has content (Buffer), use that
    if (attachment.content) {
      return {
        filename: attachment.name,
        content: attachment.content,
        contentType: attachment.type
      };
    }
    
    // If attachment has a content string, convert to Buffer
    if (attachment.contentString) {
      return {
        filename: attachment.name,
        content: Buffer.from(attachment.contentString),
        contentType: attachment.type
      };
    }
    
    return attachment;
  });
}

/**
 * Get displayable folder name
 * 
 * @param {string} folderPath IMAP folder path
 * @returns {string} Normalized folder name
 */
function getFolderDisplayName(folderPath) {
  const lowerPath = folderPath.toLowerCase();
  
  if (lowerPath === 'inbox') return 'inbox';
  if (lowerPath === 'sent' || lowerPath === 'sent items') return 'sent';
  if (lowerPath === 'drafts') return 'drafts';
  if (lowerPath === 'trash') return 'trash';
  if (lowerPath === 'junk' || lowerPath === 'spam') return 'spam';
  
  // Return last segment of path for all others
  return folderPath.split('/').pop().toLowerCase();
}

export default {
  sendEmail,
  fetchEmails,
  fetchEmail,
  updateEmail,
  deleteEmail,
  getMailboxStats,
  initSMTP,
  getSMTPTransporter,
  createIMAPClient
};