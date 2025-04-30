/**
 * Postfix mail server connector
 * 
 * This module provides direct integration with the Postfix mail server
 * using SMTP for sending emails and IMAP for receiving/fetching emails.
 */

import nodemailer from 'nodemailer';
import { ImapFlow } from 'imapflow';
import { simpleParser } from 'mailparser';
import fs from 'fs/promises';
import path from 'path';
import crypto from 'crypto';

// Configuration - in production, these would come from environment variables
const SMTP_CONFIG = {
  host: 'mail.keykeeper.world',
  port: 587,
  secure: false, // true for 465, false for other ports
  auth: {
    user: 'test@keykeeper.world', // default user for testing
    pass: process.env.MAIL_PASSWORD || 'your_password_here' // Using environment variable
  }
};

const IMAP_CONFIG = {
  host: 'mail.keykeeper.world',
  port: 993,
  secure: true,
  auth: {
    user: 'test@keykeeper.world',
    pass: process.env.MAIL_PASSWORD || 'your_password_here' // Using environment variable
  }
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
  return smtpTransporter;
}

/**
 * Create an IMAP client for fetching emails
 * 
 * @param {Object} config Custom configuration (optional)
 * @returns {Object} ImapFlow client instance
 */
export function createIMAPClient(config = {}) {
  return new ImapFlow({
    ...IMAP_CONFIG,
    ...config
  });
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
    
    // Prepare email data for nodemailer
    const mailOptions = {
      from: emailData.from,
      to: Array.isArray(emailData.to) 
        ? emailData.to.map(r => r.email || r).join(',') 
        : emailData.to,
      cc: emailData.cc ? Array.isArray(emailData.cc) 
        ? emailData.cc.map(r => r.email || r).join(',') 
        : emailData.cc : undefined,
      bcc: emailData.bcc ? Array.isArray(emailData.bcc) 
        ? emailData.bcc.map(r => r.email || r).join(',') 
        : emailData.bcc : undefined,
      subject: emailData.subject,
      text: emailData.text || convertHtmlToText(emailData.body),
      html: emailData.body,
      attachments: formatAttachments(emailData.attachments)
    };
    
    // Add optional headers
    if (options.headers) {
      mailOptions.headers = options.headers;
    }
    
    // Add PGP encryption headers if needed
    if (options.pgpEncrypted) {
      mailOptions.headers = { 
        ...mailOptions.headers,
        'X-PGP-Encrypted': 'true'
      };
      
      // In a real implementation, we would encrypt the content here
      // but for now we're just adding the header
    }
    
    // Send mail with defined transport object
    const info = await transporter.sendMail(mailOptions);
    
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