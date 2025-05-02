/**
 * Password Management Utilities
 * 
 * This module provides functions for securely retrieving and managing
 * virtual mail accounts and their passwords for user operations.
 */

import db from '@/lib/db';

const passwordManager = {
  /**
   * Get all virtual mail accounts for a user
   * @param {string} userId - User ID
   * @returns {Promise<Array>} - Array of virtual mail accounts
   */
  async getMailAccounts(userId) {
    try {
      // Check if there are entries in the virtual_users table with this user_id
      const connection = await db.getMailDbConnection();
      if (!connection) {
        console.error('Could not connect to mail database');
        return [];
      }
      
      try {
        // Get the table name from env or use default
        const tableName = process.env.MAIL_USERS_TABLE || 'virtual_users';
        
        const [rows] = await connection.execute(
          `SELECT id, email, username, password FROM ${tableName} WHERE user_id = ?`,
          [userId]
        );
        
        return rows || [];
      } catch (error) {
        console.error('Error querying virtual_users:', error);
        return [];
      } finally {
        // Only release if it's a pool connection, close if it's a direct connection
        if (connection.release) {
          connection.release();
        } else if (connection.end) {
          await connection.end();
        }
      }
    } catch (error) {
      console.error('Error retrieving mail accounts:', error);
      return [];
    }
  },
  
  /**
   * Get a specific mail account password for a user by email
   * @param {string} userId - User ID
   * @param {string} email - Email address of the account (optional)
   * @returns {Promise<string|null>} - The password or null if not found
   */
  async getMailPassword(userId, email = null) {
    try {
      // First check if we have a stored plaintext password in the users table
      // This is the safest approach since we can't easily recover the password from SHA512-CRYPT hash
      const user = await db.users.findById(userId);
      
      if (user && user.mail_password) {
        // If we have a mail_password field, use that
        try {
          // Import crypto module
          const crypto = await import('crypto');
          
          // Split IV and encrypted data
          const [ivHex, encryptedHex] = user.mail_password.split(':');
          if (!ivHex || !encryptedHex) {
            console.warn('Invalid encrypted password format');
            // Continue to fallback
          } else {
            // Reconstruct encryption key
            const secret = process.env.APP_SECRET || 'keykeeper-default-secret';
            const encKey = crypto.createHash('sha256').update(secret).digest();
            
            // Convert hex IV back to Buffer
            const iv = Buffer.from(ivHex, 'hex');
            
            // Create decipher and decrypt the password
            const decipher = crypto.createDecipheriv('aes-256-cbc', encKey, iv);
            let decrypted = decipher.update(encryptedHex, 'hex', 'utf8');
            decrypted += decipher.final('utf8');
            
            return decrypted;
          }
        } catch (decryptError) {
          console.error('Error decrypting mail password:', decryptError);
          // Continue to fallback mechanism
        }
      }
      
      // Fallback: If we are in a development environment, use a test password
      if (process.env.NODE_ENV !== 'production') {
        console.warn('Using fallback password for development environment');
        return 'development-password';
      }
      
      // In production, we should have stored the password properly
      console.error('No mail password found for user in production environment');
      return null;
    } catch (error) {
      console.error('Error retrieving mail password:', error);
      return null;
    }
  },
  
  /**
   * Get the primary mail account for a user (usually first created)
   * @param {string} userId - User ID
   * @returns {Promise<Object|null>} - Mail account info or null if not found
   */
  async getPrimaryMailAccount(userId) {
    try {
      const accounts = await this.getMailAccounts(userId);
      return accounts.length > 0 ? accounts[0] : null;
    } catch (error) {
      console.error('Error getting primary mail account:', error);
      return null;
    }
  },
  
  /**
   * Check if a user has any mail accounts
   * @param {string} userId - User ID
   * @returns {Promise<boolean>} - Whether the user has any mail accounts
   */
  async hasMailAccount(userId) {
    try {
      // First check if the user exists
      if (!userId) {
        console.error('No user ID provided to hasMailAccount');
        return false;
      }
      
      // Get the mail accounts for the user
      const accounts = await this.getMailAccounts(userId);
      
      // Check if any accounts were found
      if (accounts && accounts.length > 0) {
        console.log(`Found ${accounts.length} mail accounts for user ${userId}`);
        return true;
      }
      
      // No accounts found
      console.log(`No mail accounts found for user ${userId}`);
      
      // If in development mode, return true for testing
      if (process.env.NODE_ENV !== 'production' && process.env.MOCK_MAIL_ACCOUNTS === 'true') {
        console.log('Using mock mail account for development');
        return true;
      }
      
      return false;
    } catch (error) {
      console.error('Error checking for mail accounts:', error);
      return false;
    }
  },
  
  /**
   * Reset a mail account password (generates a new one)
   * @param {string} userId - User ID
   * @param {string} email - User's email address
   * @returns {Promise<string|null>} - New password or null if failed
   */
  async resetMailPassword(userId, email) {
    try {
      // Import needed modules
      const crypto = await import('crypto');
      const accountManager = await import('@/lib/mail/accountManager').then(mod => mod.default);
      
      // Generate a new secure random password
      const newPassword = crypto.randomBytes(16).toString('hex');
      
      // Update the password in the mail server
      await accountManager.updateMailAccountPassword(email, newPassword);
      
      return newPassword;
    } catch (error) {
      console.error('Error resetting mail password:', error);
      return null;
    }
  }
};

export default passwordManager;