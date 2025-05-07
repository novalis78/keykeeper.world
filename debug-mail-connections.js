#!/usr/bin/env node

/**
 * Mail Connection Debugging Tool
 * 
 * This script tests every step of the mail inbox retrieval process to identify
 * where the issue is occurring. It checks:
 * 
 * 1. Database connections (both main DB and mail DB)
 * 2. User retrieval from main DB
 * 3. Mail account retrieval from mail DB
 * 4. Mail password decryption
 * 5. IMAP connection
 * 6. Mail server environment variables
 * 
 * Usage: node debug-mail-connections.js <user_id>
 */

const mysql = require('mysql2/promise');
const { ImapFlow } = require('imapflow');
const crypto = require('crypto');
const util = require('util');
const exec = util.promisify(require('child_process').exec);
require('dotenv').config();

// Main function
async function main() {
  // Get user ID from command line
  const userId = process.argv[2];
  if (!userId) {
    console.error('Error: User ID is required');
    console.error('Usage: node debug-mail-connections.js <user_id>');
    process.exit(1);
  }

  console.log('====== MAIL CONNECTION DIAGNOSTIC TOOL ======');
  console.log(`Testing mail connections for user ID: ${userId}`);
  console.log('============================================');

  // Test 1: Environment variables
  console.log('\n===== ENVIRONMENT VARIABLES =====');
  const envVars = [
    'DATABASE_URL',
    'MAIL_DB_HOST',
    'MAIL_DB_USER',
    'MAIL_DB_PASSWORD',
    'MAIL_DB_NAME',
    'MAIL_HOST',
    'MAIL_IMAP_PORT',
    'MAIL_IMAP_SECURE',
    'MAIL_USERS_TABLE',
    'USE_MAIN_DB_FOR_MAIL',
    'APP_SECRET',
    'USE_REAL_MAIL_SERVER'
  ];

  for (const varName of envVars) {
    const value = process.env[varName];
    console.log(`${varName}: ${value ? (varName.includes('PASSWORD') || varName.includes('SECRET') ? '******** (set)' : value) : 'NOT SET'}`);
  }

  // Test 2: Main database connection
  console.log('\n===== MAIN DATABASE CONNECTION =====');
  let mainPool;
  let user;
  try {
    if (!process.env.DATABASE_URL) {
      throw new Error('DATABASE_URL environment variable not set');
    }

    // Parse connection string (simplified)
    const url = process.env.DATABASE_URL;
    const withoutProtocol = url.replace(/^mysql2?:\/\//, '');
    const [userPart, hostPart] = withoutProtocol.split('@');
    const [username, password] = userPart.split(':');
    const [host, dbPart] = hostPart.split('/');
    const [hostname, port] = host.split(':');
    const parsedPort = port ? parseInt(port, 10) : 3306;
    
    let database = dbPart;
    if (dbPart && dbPart.includes('?')) {
      database = dbPart.split('?')[0];
    }

    console.log(`Connecting to main database at ${hostname}:${parsedPort}/${database}`);
    
    mainPool = mysql.createPool({
      host: hostname,
      port: parsedPort,
      user: username,
      password: password,
      database: database,
      waitForConnections: true,
      connectionLimit: 10,
      queueLimit: 0
    });

    // Test connection with a simple query
    const [rows] = await mainPool.execute('SELECT 1 as test');
    console.log(`Connection successful, result: ${rows[0].test}`);
    
    // Get user from main database
    console.log(`Looking up user with ID: ${userId}`);
    const [userRows] = await mainPool.execute(
      'SELECT id, email, name, status, auth_method, mail_password FROM users WHERE id = ?',
      [userId]
    );
    
    if (userRows.length === 0) {
      console.error(`❌ User with ID ${userId} not found in main database`);
    } else {
      user = userRows[0];
      console.log(`✅ Found user: ${user.email} (${user.name || 'no name'})`);
      console.log(`Status: ${user.status}, Auth method: ${user.auth_method}`);
      console.log(`Mail password stored: ${user.mail_password ? 'YES' : 'NO'}`);
      
      if (user.mail_password) {
        try {
          // Try to decrypt the mail password
          const [ivHex, encryptedHex] = user.mail_password.split(':');
          
          if (!ivHex || !encryptedHex) {
            console.error('❌ Invalid encrypted password format');
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
            
            console.log(`✅ Successfully decrypted mail password (length: ${decrypted.length})`);
          }
        } catch (decryptError) {
          console.error(`❌ Error decrypting mail password: ${decryptError.message}`);
        }
      }
    }
  } catch (error) {
    console.error(`❌ Main database connection error: ${error.message}`);
  }

  // Test 3: Mail database connection
  console.log('\n===== MAIL DATABASE CONNECTION =====');
  let mailConnection;
  let mailAccount;
  try {
    // If we're using the main database for mail
    if (process.env.USE_MAIN_DB_FOR_MAIL === 'true') {
      console.log('Using main database connection for mail operations');
      
      if (mainPool) {
        console.log('✅ Using main database connection (already established)');
        mailConnection = mainPool;
      } else {
        console.error('❌ Main database connection not available');
      }
    } else {
      // Configure MySQL connection for mail database
      const dbConfig = {
        host: process.env.MAIL_DB_HOST || 'localhost',
        user: process.env.MAIL_DB_USER || (process.env.DATABASE_URL ? process.env.DATABASE_URL.split('://')[1].split(':')[0] : ''),
        password: process.env.MAIL_DB_PASSWORD || (process.env.DATABASE_URL ? process.env.DATABASE_URL.split(':')[2].split('@')[0] : ''),
        database: process.env.MAIL_DB_NAME || 'vmail'
      };

      console.log(`Connecting to mail database at ${dbConfig.host}/${dbConfig.database}`);
      
      try {
        mailConnection = await mysql.createConnection(dbConfig);
        console.log('✅ Mail database connection successful');
      } catch (mailDbError) {
        console.error(`❌ Mail database connection error: ${mailDbError.message}`);
      }
    }
    
    // Now that we have a connection, check for user's mail account
    if (mailConnection && userId) {
      const tableName = process.env.MAIL_USERS_TABLE || 'virtual_users';
      
      console.log(`Looking up mail accounts in ${tableName} for user with ID: ${userId}`);
      
      try {
        const [rows] = await mailConnection.execute(
          `SELECT id, domain_id, username, email, password FROM ${tableName} WHERE user_id = ?`,
          [userId]
        );
        
        if (rows.length === 0) {
          console.error(`❌ No mail accounts found for user with ID ${userId} in ${tableName} table`);
        } else {
          console.log(`✅ Found ${rows.length} mail account(s):`);
          
          for (const account of rows) {
            console.log(`- ID: ${account.id}, Username: ${account.username}, Email: ${account.email}`);
            console.log(`  Domain ID: ${account.domain_id}, Password hash set: ${account.password ? 'YES' : 'NO'}`);
            
            if (account.password) {
              console.log(`  Password hash type: ${account.password.substring(0, 20)}...`);
              
              // Test if it's a proper Dovecot hash format
              if (account.password.startsWith('{SHA512-CRYPT}')) {
                console.log('  ✅ Password is in valid Dovecot SHA512-CRYPT format');
              } else if (account.password.startsWith('{PLAIN}')) {
                console.log('  ✓ Password is in PLAIN format (less secure but functional)');
              } else {
                console.warn('  ⚠️ Password format may not be compatible with Dovecot');
              }
            }
            
            // Save first account for IMAP test
            if (!mailAccount) {
              mailAccount = account;
            }
          }
        }
      } catch (queryError) {
        console.error(`❌ Error querying mail accounts: ${queryError.message}`);
      }
    }
  } catch (error) {
    console.error(`❌ Mail database connection error: ${error.message}`);
  }

  // Test 4: Try different ways to retrieve mail password
  console.log('\n===== MAIL PASSWORD RETRIEVAL =====');
  let mailPass = null;
  
  if (user && user.mail_password) {
    try {
      // Try to decrypt the mail password from user record
      const [ivHex, encryptedHex] = user.mail_password.split(':');
      
      if (!ivHex || !encryptedHex) {
        console.error('❌ Invalid encrypted password format in user record');
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
        
        console.log(`✅ Successfully decrypted mail password from user record`);
        mailPass = decrypted;
      }
    } catch (decryptError) {
      console.error(`❌ Error decrypting mail password from user record: ${decryptError.message}`);
    }
  } else {
    console.log('No encrypted mail password found in user record');
  }
  
  // Fallback: Try development password in non-production
  if (!mailPass && process.env.NODE_ENV !== 'production') {
    console.log('Using fallback "development-password" for testing');
    mailPass = 'development-password';
  }
  
  // Test 5: IMAP connection test
  console.log('\n===== IMAP CONNECTION TEST =====');
  
  if (mailAccount && (mailPass || process.env.NODE_ENV !== 'production')) {
    const imapHost = process.env.MAIL_HOST || 'localhost';
    const imapPort = parseInt(process.env.MAIL_IMAP_PORT || '993');
    const imapSecure = process.env.MAIL_IMAP_SECURE !== 'false';
    
    console.log(`Testing IMAP connection to ${imapHost}:${imapPort} (secure: ${imapSecure})`);
    console.log(`Using account: ${mailAccount.email}`);
    
    // Try to connect to IMAP server
    try {
      // Test connection with decrypted password first
      if (mailPass) {
        try {
          console.log(`Attempting IMAP connection with decrypted password...`);
          
          const client = new ImapFlow({
            host: imapHost,
            port: imapPort,
            secure: imapSecure,
            auth: {
              user: mailAccount.email,
              pass: mailPass
            },
            logger: false,
            tls: {
              rejectUnauthorized: process.env.NODE_ENV === 'production'
            }
          });
          
          await client.connect();
          console.log(`✅ IMAP connection successful using decrypted password!`);
          
          // List mailboxes
          const mailboxes = await client.list();
          console.log(`Found ${mailboxes.length} mailboxes:`);
          for (const box of mailboxes.slice(0, 5)) {
            console.log(`- ${box.path}`);
          }
          if (mailboxes.length > 5) {
            console.log(`  ... and ${mailboxes.length - 5} more`);
          }
          
          // Try to open INBOX
          try {
            const inbox = await client.mailboxOpen('INBOX');
            console.log(`INBOX opened with ${inbox.exists} messages`);
          } catch (inboxError) {
            console.error(`❌ Error opening INBOX: ${inboxError.message}`);
          }
          
          await client.logout();
        } catch (imapError) {
          console.error(`❌ IMAP connection error with decrypted password: ${imapError.message}`);
          
          // If we're in development mode, try plain password too
          if (process.env.NODE_ENV !== 'production' && mailAccount.password && mailAccount.password.startsWith('{PLAIN}')) {
            try {
              console.log(`Trying with PLAIN password from virtual_users table...`);
              const plainPass = mailAccount.password.substring(7); // Remove {PLAIN} prefix
              
              const client = new ImapFlow({
                host: imapHost,
                port: imapPort,
                secure: imapSecure,
                auth: {
                  user: mailAccount.email,
                  pass: plainPass
                },
                logger: false,
                tls: {
                  rejectUnauthorized: false
                }
              });
              
              await client.connect();
              console.log(`✅ IMAP connection successful using PLAIN password!`);
              await client.logout();
            } catch (plainError) {
              console.error(`❌ IMAP connection error with PLAIN password: ${plainError.message}`);
            }
          }
        }
      } else {
        console.error('❌ No mail password available for IMAP test');
      }
    } catch (error) {
      console.error(`❌ IMAP test error: ${error.message}`);
    }
  } else {
    console.error('❌ Cannot test IMAP connection without mail account or password');
  }

  // Check if Dovecot is running
  console.log('\n===== MAIL SERVER STATUS =====');
  try {
    const { stdout, stderr } = await exec('ps aux | grep -i dovecot | grep -v grep');
    if (stdout) {
      console.log('✅ Dovecot processes found:');
      const processes = stdout.split('\n').filter(line => line.trim());
      processes.slice(0, 3).forEach(proc => console.log(`- ${proc.substring(0, 80)}...`));
      if (processes.length > 3) {
        console.log(`  ... and ${processes.length - 3} more`);
      }
    } else {
      console.error('❌ No Dovecot processes found!');
    }
  } catch (error) {
    console.error(`❌ Error checking Dovecot status: ${error.message}`);
  }

  // Check mail port status
  try {
    const imapPort = process.env.MAIL_IMAP_PORT || '993';
    const { stdout, stderr } = await exec(`netstat -tuln | grep ":${imapPort}"`);
    if (stdout) {
      console.log(`✅ Port ${imapPort} is open and listening:`);
      console.log(`- ${stdout.trim()}`);
    } else {
      console.error(`❌ No service found listening on port ${imapPort}!`);
    }
  } catch (error) {
    console.log(`ℹ️ Port status check: No service found listening on IMAP port`);
  }

  // Cleanup
  try {
    if (mainPool && typeof mainPool.end === 'function') {
      await mainPool.end();
    }
    
    if (mailConnection && mailConnection !== mainPool && typeof mailConnection.end === 'function') {
      await mailConnection.end();
    }
  } catch (cleanupError) {
    console.error(`Error during cleanup: ${cleanupError.message}`);
  }

  console.log('\n====== DIAGNOSTIC TOOL COMPLETE ======');
  
  if (mailAccount) {
    console.log('\nTry this manual IMAP connection command:');
    console.log(`openssl s_client -connect ${process.env.MAIL_HOST || 'localhost'}:${process.env.MAIL_IMAP_PORT || 993} -crlf`);
    console.log('Then enter these commands:');
    console.log(`a LOGIN ${mailAccount.email} "your_password_here"`);
    console.log('a SELECT INBOX');
    console.log('a LOGOUT');
  }
  
  console.log('\nRecommendations:');
  console.log('1. Check that Dovecot is running and properly configured');
  console.log('2. Verify the mail database connection settings');
  console.log('3. Ensure the user has a valid mail account with the correct password');
  console.log('4. Check for firewall rules blocking IMAP connections');
  console.log('5. Look at the Dovecot logs for authentication failures');
}

// Run the diagnostics
main().catch(error => {
  console.error(`Fatal error: ${error.message}`);
  process.exit(1);
});