/**
 * Email Account Manager
 * 
 * This module handles the creation and management of email accounts
 * in the mail server (Postfix/Dovecot) using direct MySQL integration.
 */

import mysql from 'mysql2/promise';
import { exec } from 'child_process';
import { promisify } from 'util';
import crypto from 'crypto';
import db from '@/lib/db';

// Promisify exec for test commands
const execAsync = promisify(exec);

/**
 * Get MySQL connection for mail database
 * @returns {Promise<mysql.Connection>} MySQL connection
 */
async function getMailDbConnection() {
  // First try to use the main database connection if available
  if (process.env.USE_MAIN_DB_FOR_MAIL === 'true') {
    try {
      // Just use the query function from the main db
      console.log('[Account Manager] Using main database connection for mail operations');
      return {
        execute: async (sql, params) => {
          try {
            const results = await db.query(sql, params);
            return [results];
          } catch (error) {
            throw error;
          }
        },
        query: async (sql, params) => {
          try {
            const results = await db.query(sql, params);
            return [results];
          } catch (error) {
            throw error;
          }
        },
        ping: async () => true,
        end: async () => {} // No-op since we're using the main connection pool
      };
    } catch (error) {
      console.error('[Account Manager] Error using main database:', error);
      console.log('[Account Manager] Falling back to dedicated mail database connection');
    }
  }

  // Fall back to dedicated mail database connection
  // Configure MySQL connection from environment variables
  const dbConfig = {
    host: process.env.MAIL_DB_HOST || 'localhost',
    user: process.env.MAIL_DB_USER || process.env.DATABASE_USER,
    password: process.env.MAIL_DB_PASSWORD || process.env.DATABASE_PASSWORD,
    database: process.env.MAIL_DB_NAME || 'vmail'
  };
  
  try {
    return await mysql.createConnection(dbConfig);
  } catch (error) {
    console.error('[Account Manager] MySQL connection error:', error);
    throw new Error(`Failed to connect to mail database: ${error.message}`);
  }
}

/**
 * Create a secure password hash for Dovecot
 * @param {string} password Plain text password
 * @returns {string} Hashed password in Dovecot format
 */
function hashPassword(password) {
  // Check if we should use a specific hash method from env
  const hashMethod = process.env.MAIL_PASSWORD_SCHEME || 'SHA512-CRYPT';
  
  // Generate a secure random salt
  const salt = crypto.randomBytes(8).toString('hex');
  
  switch (hashMethod) {
    case 'SHA512-CRYPT':
      // This is a simplified version - in production, use proper crypt library
      const hash = crypto.createHash('sha512')
        .update(password + salt)
        .digest('hex');
      
      return `{SHA512-CRYPT}$6$${salt}$${hash}`;
      
    case 'BCRYPT':
      // Note: In a real implementation, use bcrypt library
      // This is just a placeholder
      const bcryptHash = '$2y$10$' + salt + crypto.createHash('sha256').update(password).digest('hex');
      return `{BCRYPT}${bcryptHash}`;
      
    default:
      // Default to SHA512-CRYPT
      const defaultHash = crypto.createHash('sha512')
        .update(password + salt)
        .digest('hex');
      
      return `{SHA512-CRYPT}$6$${salt}$${defaultHash}`;
  }
}

/**
 * Create a new email account by inserting into MySQL database
 * Dovecot is configured to auto-create mail directories on first login
 * 
 * @param {string} email The email address
 * @param {string} password The password for the account
 * @param {string} name Display name for the account
 * @param {number} quota Mailbox quota in MB (default: 1024)
 * @returns {Promise<Object>} Result of account creation
 */
export async function createMailAccount(email, password, name = null, quota = 1024) {
  console.log(`[Account Manager] Creating mail account for: ${email}`);
  
  if (!email || !password) {
    throw new Error('Email and password are required');
  }
  
  // Parse email to extract username and domain
  const [username, domain] = email.split('@');
  
  if (!username || !domain) {
    throw new Error('Invalid email format');
  }
  
  // Get database connection
  const connection = await getMailDbConnection();
  
  try {
    // Hash the password according to dovecot config
    const passwordFormat = hashPassword(password);
    
    // Get the table name from env or use default
    const tableName = process.env.MAIL_USERS_TABLE || 'virtual_users';
    
    // Check if the table exists, if not, try to create it (when using main DB)
    if (process.env.USE_MAIN_DB_FOR_MAIL === 'true') {
      try {
        // Check if table exists
        const [tables] = await connection.query(
          `SHOW TABLES LIKE '${tableName}'`
        );
        
        if (tables.length === 0) {
          console.log(`[Account Manager] Table ${tableName} doesn't exist, creating it`);
          
          // Create the table if it doesn't exist
          await connection.execute(`
            CREATE TABLE IF NOT EXISTS ${tableName} (
              id INT AUTO_INCREMENT PRIMARY KEY,
              email VARCHAR(255) NOT NULL UNIQUE,
              password VARCHAR(255) NOT NULL,
              username VARCHAR(255) NOT NULL,
              domain VARCHAR(255) NOT NULL,
              created DATETIME DEFAULT CURRENT_TIMESTAMP,
              quota BIGINT DEFAULT 1073741824,
              active TINYINT(1) DEFAULT 1,
              INDEX (domain),
              INDEX (username)
            )
          `);
        }
      } catch (tableError) {
        console.warn(`[Account Manager] Error checking/creating table: ${tableError.message}`);
      }
    }
    
    // Insert the new mail account
    // Note: Column names might need adjustment based on your schema
    const [results] = await connection.execute(
      `INSERT INTO ${tableName} (email, password, username, domain, created, quota) 
       VALUES (?, ?, ?, ?, NOW(), ?)`,
      [email, passwordFormat, username, domain, quota * 1024 * 1024] // Convert quota to bytes
    );
    
    console.log(`[Account Manager] Mail account created successfully in database: ${email}`);
    
    return {
      success: true,
      email,
      domain,
      username,
      id: results.insertId,
      message: `Mail account ${email} created successfully`
    };
  } catch (error) {
    console.error('[Account Manager] Database error creating mail account:', error);
    throw new Error(`Failed to create mail account: ${error.message}`);
  } finally {
    // Close the connection
    await connection.end();
  }
}

/**
 * Delete an email account from the mail database
 * 
 * @param {string} email The email address to delete
 * @returns {Promise<Object>} Result of account deletion
 */
export async function deleteMailAccount(email) {
  console.log(`[Account Manager] Deleting mail account: ${email}`);
  
  if (!email) {
    throw new Error('Email is required');
  }
  
  // Get database connection
  const connection = await getMailDbConnection();
  
  try {
    // Get the table name from env or use default
    const tableName = process.env.MAIL_USERS_TABLE || 'virtual_users';
    
    // Delete the mail account
    const [results] = await connection.execute(
      `DELETE FROM ${tableName} WHERE email = ?`,
      [email]
    );
    
    if (results.affectedRows === 0) {
      throw new Error(`Mail account ${email} not found`);
    }
    
    console.log(`[Account Manager] Mail account deleted successfully: ${email}`);
    
    return {
      success: true,
      email,
      message: `Mail account ${email} deleted successfully`
    };
  } catch (error) {
    console.error('[Account Manager] Database error deleting mail account:', error);
    throw new Error(`Failed to delete mail account: ${error.message}`);
  } finally {
    // Close the connection
    await connection.end();
  }
}

/**
 * Check if an email account exists in the mail database
 * 
 * @param {string} email The email address to check
 * @returns {Promise<boolean>} Whether the account exists
 */
export async function checkMailAccount(email) {
  console.log(`[Account Manager] Checking if mail account exists: ${email}`);
  
  if (!email) {
    throw new Error('Email is required');
  }
  
  // Get database connection
  const connection = await getMailDbConnection();
  
  try {
    // Get the table name from env or use default
    const tableName = process.env.MAIL_USERS_TABLE || 'virtual_users';
    
    // Check if the mail account exists
    const [rows] = await connection.execute(
      `SELECT id FROM ${tableName} WHERE email = ?`,
      [email]
    );
    
    return rows.length > 0;
  } catch (error) {
    console.error('[Account Manager] Database error checking mail account:', error);
    throw new Error(`Failed to check mail account: ${error.message}`);
  } finally {
    // Close the connection
    await connection.end();
  }
}

/**
 * Update mail account password
 * 
 * @param {string} email The email address
 * @param {string} newPassword The new password
 * @returns {Promise<Object>} Result of password update
 */
export async function updateMailAccountPassword(email, newPassword) {
  console.log(`[Account Manager] Updating password for mail account: ${email}`);
  
  if (!email || !newPassword) {
    throw new Error('Email and new password are required');
  }
  
  // Get database connection
  const connection = await getMailDbConnection();
  
  try {
    // Hash the new password
    const passwordFormat = hashPassword(newPassword);
    
    // Get the table name from env or use default
    const tableName = process.env.MAIL_USERS_TABLE || 'virtual_users';
    
    // Update the password
    const [results] = await connection.execute(
      `UPDATE ${tableName} SET password = ? WHERE email = ?`,
      [passwordFormat, email]
    );
    
    if (results.affectedRows === 0) {
      throw new Error(`Mail account ${email} not found`);
    }
    
    console.log(`[Account Manager] Password updated successfully for: ${email}`);
    
    return {
      success: true,
      email,
      message: `Password updated successfully for ${email}`
    };
  } catch (error) {
    console.error('[Account Manager] Database error updating password:', error);
    throw new Error(`Failed to update password: ${error.message}`);
  } finally {
    // Close the connection
    await connection.end();
  }
}

/**
 * List all domains in the mail database
 * 
 * @returns {Promise<Array>} List of domains
 */
export async function listMailDomains() {
  console.log('[Account Manager] Listing mail domains');
  
  // Get database connection
  const connection = await getMailDbConnection();
  
  try {
    // Get the table name from env or use default
    const domainTable = process.env.MAIL_DOMAINS_TABLE || 'virtual_domains';
    
    // Try to get domains from domains table if it exists
    try {
      const [rows] = await connection.execute(
        `SELECT domain FROM ${domainTable}`
      );
      
      return rows.map(row => row.domain);
    } catch (tableError) {
      console.warn(`[Account Manager] Error accessing domains table: ${tableError.message}`);
      
      // Fall back to getting unique domains from users table
      const usersTable = process.env.MAIL_USERS_TABLE || 'virtual_users';
      
      const [rows] = await connection.execute(
        `SELECT DISTINCT domain FROM ${usersTable}`
      );
      
      return rows.map(row => row.domain);
    }
  } catch (error) {
    console.error('[Account Manager] Database error listing domains:', error);
    throw new Error(`Failed to list mail domains: ${error.message}`);
  } finally {
    // Close the connection
    await connection.end();
  }
}

/**
 * Test connection to mail server (SMTP/IMAP)
 * 
 * @returns {Promise<Object>} Connection test results
 */
export async function testMailConnection() {
  const results = {
    smtp: { success: false, error: null },
    imap: { success: false, error: null },
    database: { success: false, error: null }
  };
  
  // Test database connection
  try {
    const connection = await getMailDbConnection();
    await connection.ping();
    results.database.success = true;
    await connection.end();
  } catch (error) {
    results.database.error = error.message;
  }
  
  // Test SMTP connection
  if (process.env.MAIL_HOST) {
    try {
      const nodemailer = await import('nodemailer');
      
      const transporter = nodemailer.default.createTransport({
        host: process.env.MAIL_HOST,
        port: parseInt(process.env.MAIL_SMTP_PORT || '587'),
        secure: process.env.MAIL_SMTP_SECURE === 'true',
        auth: {
          user: process.env.MAIL_TEST_USER,
          pass: process.env.MAIL_TEST_PASSWORD
        },
        tls: {
          rejectUnauthorized: process.env.NODE_ENV === 'production'
        }
      });
      
      await transporter.verify();
      results.smtp.success = true;
    } catch (error) {
      results.smtp.error = error.message;
    }
  } else {
    results.smtp.error = 'MAIL_HOST not configured';
  }
  
  // Test IMAP connection
  if (process.env.MAIL_HOST && process.env.MAIL_TEST_USER) {
    try {
      const { ImapFlow } = await import('imapflow');
      
      const client = new ImapFlow({
        host: process.env.MAIL_HOST,
        port: parseInt(process.env.MAIL_IMAP_PORT || '993'),
        secure: process.env.MAIL_IMAP_SECURE !== 'false',
        auth: {
          user: process.env.MAIL_TEST_USER,
          pass: process.env.MAIL_TEST_PASSWORD
        },
        tls: {
          rejectUnauthorized: process.env.NODE_ENV === 'production'
        }
      });
      
      await client.connect();
      await client.logout();
      results.imap.success = true;
    } catch (error) {
      results.imap.error = error.message;
    }
  } else {
    results.imap.error = 'MAIL_HOST or MAIL_TEST_USER not configured';
  }
  
  return results;
}

export default {
  createMailAccount,
  deleteMailAccount,
  checkMailAccount,
  updateMailAccountPassword,
  listMailDomains,
  testMailConnection
};