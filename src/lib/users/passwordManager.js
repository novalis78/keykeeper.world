/**
 * Password Management Utilities
 * 
 * This module provides functions for securely retrieving and decrypting
 * stored mail account passwords for user operations.
 */

import db from '@/lib/db';

const passwordManager = {
  /**
   * Get a user's mail account password
   * @param {string} userId - User ID
   * @returns {Promise<string|null>} - Decrypted password or null if not found
   */
  async getMailPassword(userId) {
    try {
      // Get user record with encrypted password
      const user = await db.users.findById(userId);
      if (!user || !user.mail_password) {
        return null;
      }
      
      // Import crypto module
      const crypto = await import('crypto');
      
      // Split IV and encrypted data
      const [ivHex, encryptedHex] = user.mail_password.split(':');
      if (!ivHex || !encryptedHex) {
        throw new Error('Invalid encrypted password format');
      }
      
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
    } catch (error) {
      console.error('Error retrieving mail password:', error);
      throw new Error('Failed to retrieve mail password');
    }
  },
  
  /**
   * Check if a user has a mail account
   * @param {string} userId - User ID
   * @returns {Promise<boolean>} - Whether the user has a mail account
   */
  async hasMailAccount(userId) {
    try {
      const user = await db.users.findById(userId);
      return !!(user && user.mail_password);
    } catch (error) {
      console.error('Error checking for mail account:', error);
      return false;
    }
  },
  
  /**
   * Reset a user's mail account password (generates a new one)
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
      
      // Store the new password in the database
      await db.users.updateMailPassword(userId, newPassword);
      
      return newPassword;
    } catch (error) {
      console.error('Error resetting mail password:', error);
      return null;
    }
  }
};

export default passwordManager;