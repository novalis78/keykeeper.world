/**
 * Email Account Manager
 * 
 * This module handles the creation and management of email accounts
 * in the mail server (Postfix/Dovecot).
 */

import { exec } from 'child_process';
import { promisify } from 'util';
import * as fs from 'fs/promises';
import path from 'path';

// Promisify exec
const execAsync = promisify(exec);

/**
 * Create a new email account in the mail server
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
  
  // Determine which command to use based on mail server setup
  let command = '';
  
  // Option 1: Docker with postfixadmin-cli
  if (process.env.MAIL_SERVER_TYPE === 'postfixadmin-docker') {
    command = `docker exec ${process.env.MAIL_CONTAINER_NAME || 'mail_server'} /usr/bin/postfixadmin-cli mailbox add ${email} --password "${password}" --name "${name || username}" --quota ${quota}`;
  } 
  // Option 2: Direct postfixadmin-cli on host
  else if (process.env.MAIL_SERVER_TYPE === 'postfixadmin-direct') {
    command = `/usr/bin/postfixadmin-cli mailbox add ${email} --password "${password}" --name "${name || username}" --quota ${quota}`;
  }
  // Option 3: Traditional postfix/dovecot with virtual users
  else {
    // Create virtual mailbox directories
    const mailDir = process.env.MAIL_DIR || '/var/mail/vhosts';
    const userDir = `${mailDir}/${domain}/${username}`;
    
    // Ensure domain directory exists
    const domainDir = `${mailDir}/${domain}`;
    try {
      await fs.mkdir(domainDir, { recursive: true });
    } catch (err) {
      console.warn(`[Account Manager] Error creating domain directory: ${err.message}`);
    }
    
    // Create user directory and required subdirectories
    command = `mkdir -p ${userDir}/{cur,new,tmp} && \\
      chmod -R 700 ${userDir} && \\
      chown -R ${process.env.MAIL_USER || 'vmail'}:${process.env.MAIL_GROUP || 'vmail'} ${userDir} && \\
      echo "${password}" | doveadm pw -s SHA512-CRYPT -p > /tmp/pw_${username} && \\
      echo "${email} $(cat /tmp/pw_${username})" >> /etc/postfix/virtual_mailbox_passwd && \\
      rm /tmp/pw_${username} && \\
      postmap /etc/postfix/virtual_mailbox_passwd`;
    
    // Check if we need to add the domain to virtual_mailbox_domains
    try {
      const domainsFile = '/etc/postfix/virtual_mailbox_domains';
      const domainsContent = await fs.readFile(domainsFile, 'utf8');
      
      if (!domainsContent.includes(domain)) {
        await fs.appendFile(domainsFile, `${domain}\n`);
        await execAsync('postmap /etc/postfix/virtual_mailbox_domains');
      }
    } catch (err) {
      console.warn(`[Account Manager] Error checking/updating domains file: ${err.message}`);
    }
  }
  
  console.log(`[Account Manager] Using command type: ${process.env.MAIL_SERVER_TYPE || 'standard postfix/dovecot'}`);
  
  // Execute the command
  try {
    const { stdout, stderr } = await execAsync(command);
    let commandOutput = stdout;
    
    if (stderr) {
      console.warn('[Account Manager] Command stderr:', stderr);
      commandOutput += `\nStderr: ${stderr}`;
    }
    
    return {
      success: true,
      email,
      domain,
      username,
      command: command.replace(/--password "[^"]*"/, '--password "******"'), // Mask password
      output: commandOutput
    };
  } catch (error) {
    console.error('[Account Manager] Command execution error:', error);
    throw new Error(`Failed to create mail account: ${error.message}`);
  }
}

/**
 * Delete an email account from the mail server
 * 
 * @param {string} email The email address to delete
 * @returns {Promise<Object>} Result of account deletion
 */
export async function deleteMailAccount(email) {
  console.log(`[Account Manager] Deleting mail account: ${email}`);
  
  if (!email) {
    throw new Error('Email is required');
  }
  
  // Parse email to extract username and domain
  const [username, domain] = email.split('@');
  
  if (!username || !domain) {
    throw new Error('Invalid email format');
  }
  
  // Determine which command to use based on mail server setup
  let command = '';
  
  // Option 1: Docker with postfixadmin-cli
  if (process.env.MAIL_SERVER_TYPE === 'postfixadmin-docker') {
    command = `docker exec ${process.env.MAIL_CONTAINER_NAME || 'mail_server'} /usr/bin/postfixadmin-cli mailbox delete ${email}`;
  } 
  // Option 2: Direct postfixadmin-cli on host
  else if (process.env.MAIL_SERVER_TYPE === 'postfixadmin-direct') {
    command = `/usr/bin/postfixadmin-cli mailbox delete ${email}`;
  }
  // Option 3: Traditional postfix/dovecot with virtual users
  else {
    const mailDir = process.env.MAIL_DIR || '/var/mail/vhosts';
    const userDir = `${mailDir}/${domain}/${username}`;
    
    command = `rm -rf ${userDir} && \\
      sed -i "/^${email} /d" /etc/postfix/virtual_mailbox_passwd && \\
      postmap /etc/postfix/virtual_mailbox_passwd`;
  }
  
  // Execute the command
  try {
    const { stdout, stderr } = await execAsync(command);
    let commandOutput = stdout;
    
    if (stderr) {
      console.warn('[Account Manager] Command stderr:', stderr);
      commandOutput += `\nStderr: ${stderr}`;
    }
    
    return {
      success: true,
      email,
      output: commandOutput
    };
  } catch (error) {
    console.error('[Account Manager] Command execution error:', error);
    throw new Error(`Failed to delete mail account: ${error.message}`);
  }
}

/**
 * Check if an email account exists in the mail server
 * 
 * @param {string} email The email address to check
 * @returns {Promise<boolean>} Whether the account exists
 */
export async function checkMailAccount(email) {
  console.log(`[Account Manager] Checking if mail account exists: ${email}`);
  
  if (!email) {
    throw new Error('Email is required');
  }
  
  // Parse email to extract username and domain
  const [username, domain] = email.split('@');
  
  if (!username || !domain) {
    throw new Error('Invalid email format');
  }
  
  // Determine which command to use based on mail server setup
  let command = '';
  let exists = false;
  
  // Option 1: Docker with postfixadmin-cli
  if (process.env.MAIL_SERVER_TYPE === 'postfixadmin-docker') {
    command = `docker exec ${process.env.MAIL_CONTAINER_NAME || 'mail_server'} /usr/bin/postfixadmin-cli mailbox view ${email}`;
    
    try {
      await execAsync(command);
      exists = true;
    } catch (error) {
      exists = false;
    }
  } 
  // Option 2: Direct postfixadmin-cli on host
  else if (process.env.MAIL_SERVER_TYPE === 'postfixadmin-direct') {
    command = `/usr/bin/postfixadmin-cli mailbox view ${email}`;
    
    try {
      await execAsync(command);
      exists = true;
    } catch (error) {
      exists = false;
    }
  }
  // Option 3: Traditional postfix/dovecot with virtual users
  else {
    // Check for the mailbox directory
    const mailDir = process.env.MAIL_DIR || '/var/mail/vhosts';
    const userDir = `${mailDir}/${domain}/${username}`;
    
    try {
      await fs.access(userDir);
      exists = true;
    } catch (error) {
      // Check in virtual_mailbox_passwd file as fallback
      try {
        const passwdFile = '/etc/postfix/virtual_mailbox_passwd';
        const passwdContent = await fs.readFile(passwdFile, 'utf8');
        
        exists = passwdContent.includes(`${email} `);
      } catch (err) {
        exists = false;
      }
    }
  }
  
  return exists;
}

/**
 * List all domains in the mail server
 * 
 * @returns {Promise<Array>} List of domains
 */
export async function listMailDomains() {
  console.log('[Account Manager] Listing mail domains');
  
  // Determine which command to use based on mail server setup
  let domains = [];
  
  // Option 1: Docker with postfixadmin-cli
  if (process.env.MAIL_SERVER_TYPE === 'postfixadmin-docker') {
    const command = `docker exec ${process.env.MAIL_CONTAINER_NAME || 'mail_server'} /usr/bin/postfixadmin-cli domain list`;
    
    try {
      const { stdout } = await execAsync(command);
      domains = stdout.split('\n')
        .filter(line => line.trim().length > 0)
        .map(line => line.trim());
    } catch (error) {
      console.error('[Account Manager] Error listing domains:', error);
      throw new Error(`Failed to list mail domains: ${error.message}`);
    }
  } 
  // Option 2: Direct postfixadmin-cli on host
  else if (process.env.MAIL_SERVER_TYPE === 'postfixadmin-direct') {
    const command = `/usr/bin/postfixadmin-cli domain list`;
    
    try {
      const { stdout } = await execAsync(command);
      domains = stdout.split('\n')
        .filter(line => line.trim().length > 0)
        .map(line => line.trim());
    } catch (error) {
      console.error('[Account Manager] Error listing domains:', error);
      throw new Error(`Failed to list mail domains: ${error.message}`);
    }
  }
  // Option 3: Traditional postfix/dovecot with virtual users
  else {
    try {
      // Try to read from virtual_mailbox_domains file
      const domainsFile = '/etc/postfix/virtual_mailbox_domains';
      const domainsContent = await fs.readFile(domainsFile, 'utf8');
      
      domains = domainsContent.split('\n')
        .filter(line => line.trim().length > 0 && !line.startsWith('#'))
        .map(line => line.trim());
      
      // Also check directories in mail directory
      const mailDir = process.env.MAIL_DIR || '/var/mail/vhosts';
      
      try {
        const dirEntries = await fs.readdir(mailDir, { withFileTypes: true });
        const dirDomains = dirEntries
          .filter(entry => entry.isDirectory())
          .map(entry => entry.name);
        
        // Merge domains from both sources
        domains = [...new Set([...domains, ...dirDomains])];
      } catch (err) {
        console.warn(`[Account Manager] Error reading mail directory: ${err.message}`);
      }
    } catch (error) {
      console.error('[Account Manager] Error listing domains:', error);
      throw new Error(`Failed to list mail domains: ${error.message}`);
    }
  }
  
  return domains;
}

export default {
  createMailAccount,
  deleteMailAccount,
  checkMailAccount,
  listMailDomains
};