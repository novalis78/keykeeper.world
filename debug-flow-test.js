#!/usr/bin/env node

/**
 * Complete Mail Authentication Flow Test
 * 
 * This script simulates the entire flow from login through password derivation 
 * to IMAP connection, to identify exactly where the issue occurs.
 * 
 * Usage: node debug-flow-test.js <user_id>
 */

const mysql = require('mysql2/promise');
const { ImapFlow } = require('imapflow');
const fs = require('fs').promises;
const path = require('path');
const util = require('util');
const exec = util.promisify(require('child_process').exec);
const crypto = require('crypto');
require('dotenv').config();

// Constants that should match those used in the application
const DOVECOT_AUTH_SALT = process.env.DOVECOT_AUTH_SALT || 'keykeeper-dovecot-auth';
const DOVECOT_AUTH_VERSION = process.env.DOVECOT_AUTH_VERSION || '1';

// Utility function to simulate password derivation
function derivePasswordSimulation(email, userId, fingerprint) {
  // Try different inputs for derivation
  const possibleInputs = [
    `${DOVECOT_AUTH_SALT}:${email}:${DOVECOT_AUTH_VERSION}`,
    `${DOVECOT_AUTH_SALT}:${email}`,
    `dovecot-auth:${email}`,
    `${email}:auth`,
    email,
    userId,
    fingerprint
  ];
  
  const derivedPasswords = [];
  
  for (const input of possibleInputs) {
    // Simulate a signature using a hash
    const simulatedSignature = crypto.createHash('sha256').update(input).digest('hex');
    
    // Derive password from signature
    const hashBuffer = crypto.createHash('sha256').update(simulatedSignature).digest();
    const hashBase64 = Buffer.from(hashBuffer).toString('base64');
    
    // Create clean password (like in client derivation)
    const cleanPassword = hashBase64
      .substring(0, 32)
      .replace(/\+/g, 'A')
      .replace(/\//g, 'B')
      .replace(/=/g, 'C');
    
    derivedPasswords.push({
      input,
      password: cleanPassword
    });
  }
  
  // Also include some static test passwords
  derivedPasswords.push({
    input: 'Static: development-password',
    password: 'development-password'
  });
  
  // In development, the password might simply be the email
  derivedPasswords.push({
    input: 'Static: email as password',
    password: email
  });
  
  // Some projects use user ID as password during development
  derivedPasswords.push({
    input: 'Static: user ID as password',
    password: userId
  });
  
  return derivedPasswords;
}

// Helper function to test IMAP connection
async function testImapConnection(email, password, imapHost, imapPort, imapSecure) {
  try {
    console.log(`Testing IMAP connection with email: ${email} and password: ${password.substring(0, 3)}...`);
    
    const client = new ImapFlow({
      host: imapHost,
      port: imapPort,
      secure: imapSecure,
      auth: {
        user: email,
        pass: password
      },
      logger: false,
      tls: {
        rejectUnauthorized: false // For testing
      },
      timeoutConnection: 10000 // 10 second timeout
    });
    
    // Connect and try to open INBOX
    await client.connect();
    console.log('✅ IMAP connection successful!');
    
    try {
      const mailbox = await client.mailboxOpen('INBOX');
      console.log(`✅ Opened INBOX with ${mailbox.exists} messages`);
    } catch (inboxError) {
      console.error(`❌ Error opening INBOX: ${inboxError.message}`);
    }
    
    await client.logout();
    return true;
  } catch (error) {
    console.error(`❌ IMAP connection error: ${error.message}`);
    return false;
  }
}

// Main function
async function main() {
  // Get user ID from command line
  const userId = process.argv[2];
  if (!userId) {
    console.error('Error: User ID is required');
    console.error('Usage: node debug-flow-test.js <user_id>');
    process.exit(1);
  }

  console.log('====== MAIL AUTHENTICATION FLOW TEST ======');
  console.log(`Testing full flow for user ID: ${userId}`);
  console.log('===========================================');
  
  // 1. Get user info from database
  console.log('\n===== USER INFORMATION =====');
  let mainPool;
  let user;
  
  try {
    if (!process.env.DATABASE_URL) {
      throw new Error('DATABASE_URL environment variable not set');
    }

    // Create database connection
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

    // Get user details
    console.log(`Looking up user with ID: ${userId}`);
    const [userRows] = await mainPool.execute(
      'SELECT id, email, name, status, key_id, fingerprint, auth_method, public_key FROM users WHERE id = ?',
      [userId]
    );
    
    if (userRows.length === 0) {
      console.error(`❌ User with ID ${userId} not found in database`);
      process.exit(1);
    }
    
    user = userRows[0];
    console.log(`✅ Found user: ${user.email} (${user.name || 'no name'})`);
    console.log(`Status: ${user.status}, Auth method: ${user.auth_method}`);
    console.log(`Key ID: ${user.key_id}, Fingerprint: ${user.fingerprint}`);
    
    // Save public key to file if needed for tests
    if (user.public_key) {
      await fs.writeFile(path.join(__dirname, 'temp-public-key.asc'), user.public_key);
      console.log('✅ Public key saved to temp-public-key.asc for testing');
    }
  } catch (error) {
    console.error(`❌ Database error: ${error.message}`);
    process.exit(1);
  }
  
  // 2. Get mail account info
  console.log('\n===== MAIL ACCOUNT =====');
  let mailConnection;
  let mailAccount;
  
  try {
    // Configure database connection for mail
    if (process.env.USE_MAIN_DB_FOR_MAIL === 'true') {
      console.log('Using main database connection for mail operations');
      mailConnection = mainPool;
    } else {
      const dbConfig = {
        host: process.env.MAIL_DB_HOST || 'localhost',
        user: process.env.MAIL_DB_USER || (process.env.DATABASE_URL ? process.env.DATABASE_URL.split('://')[1].split(':')[0] : ''),
        password: process.env.MAIL_DB_PASSWORD || (process.env.DATABASE_URL ? process.env.DATABASE_URL.split(':')[2].split('@')[0] : ''),
        database: process.env.MAIL_DB_NAME || 'vmail'
      };

      console.log(`Connecting to mail database at ${dbConfig.host}/${dbConfig.database}`);
      mailConnection = await mysql.createConnection(dbConfig);
    }
    
    // Get mail account info
    const tableName = process.env.MAIL_USERS_TABLE || 'virtual_users';
    console.log(`Looking up mail account in ${tableName} for user with ID: ${userId}`);
    
    const [rows] = await mailConnection.execute(
      `SELECT id, domain_id, username, email, password FROM ${tableName} WHERE user_id = ?`,
      [userId]
    );
    
    if (rows.length === 0) {
      console.error(`❌ No mail account found for user with ID ${userId}`);
      process.exit(1);
    }
    
    mailAccount = rows[0];
    console.log(`✅ Found mail account: ${mailAccount.email}`);
    console.log(`Password hash: ${mailAccount.password ? mailAccount.password.substring(0, 30) + '...' : 'NOT SET'}`);
  } catch (error) {
    console.error(`❌ Error retrieving mail account: ${error.message}`);
    process.exit(1);
  }
  
  // 3. Check mail server status
  console.log('\n===== MAIL SERVER STATUS =====');
  const imapHost = process.env.MAIL_HOST || 'localhost';
  const imapPort = parseInt(process.env.MAIL_IMAP_PORT || '993');
  const imapSecure = process.env.MAIL_IMAP_SECURE !== 'false';
  
  console.log(`Mail server configuration: ${imapHost}:${imapPort} (secure: ${imapSecure})`);
  
  try {
    // Check if we can connect to the port
    const command = `nc -z -v -w 5 ${imapHost} ${imapPort}`;
    try {
      const { stdout, stderr } = await exec(command);
      console.log(`✅ Mail server port is open: ${stdout || stderr || 'Success'}`);
    } catch (error) {
      if (error.message.includes('succeeded')) {
        console.log('✅ Mail server port is open');
      } else {
        console.error(`❌ Mail server port check failed: ${error.message}`);
        console.log(`Command used: ${command}`);
      }
    }
    
    // Check if Dovecot is running
    try {
      const { stdout } = await exec('ps aux | grep -i dovecot | grep -v grep');
      if (stdout) {
        console.log('✅ Dovecot processes found:');
        console.log(stdout.split('\n')[0]);
      } else {
        console.warn('⚠️ No Dovecot processes found!');
      }
    } catch (error) {
      console.warn('⚠️ Could not check Dovecot processes');
    }
  } catch (error) {
    console.error(`❌ Error checking mail server: ${error.message}`);
  }
  
  // 4. Simulate password derivation
  console.log('\n===== PASSWORD DERIVATION SIMULATION =====');
  
  if (user && user.email) {
    const derivedPasswords = derivePasswordSimulation(
      user.email,
      user.id,
      user.fingerprint
    );
    
    console.log(`Generated ${derivedPasswords.length} possible passwords to test`);
    
    // 5. Test IMAP connection with each password
    console.log('\n===== IMAP CONNECTION TESTS =====');
    
    let successfulPassword = null;
    for (const derived of derivedPasswords) {
      console.log(`\nTesting password derived from: ${derived.input}`);
      const success = await testImapConnection(
        mailAccount.email,
        derived.password,
        imapHost,
        imapPort,
        imapSecure
      );
      
      if (success) {
        console.log(`✅ SUCCESS! Found working password derived from: ${derived.input}`);
        console.log(`Working password: ${derived.password}`);
        successfulPassword = derived;
        break;
      }
    }
    
    // 6. Final diagnosis
    console.log('\n===== DIAGNOSIS SUMMARY =====');
    
    if (successfulPassword) {
      console.log('✅ Authentication flow test SUCCESSFUL');
      console.log(`Working input for derivation: ${successfulPassword.input}`);
      console.log(`Working derived password: ${successfulPassword.password}`);
      console.log('\nImplementation recommendations:');
      console.log('1. Use this exact derivation method in the application code');
      console.log('2. Ensure it is used consistently at signup and login');
    } else {
      console.log('❌ Authentication flow test FAILED');
      console.log('No working password found among the common derivation methods');
      console.log('\nPossible issues:');
      console.log('1. Dovecot password hash format is incorrect');
      console.log('2. The derivation method used during signup is different');
      console.log('3. There might be issues with the mail server configuration');
      console.log('4. Check Dovecot logs for specific authentication failures');
      
      console.log('\nPossible fixes:');
      console.log('1. Check /var/log/mail.log for authentication errors');
      console.log('2. Increase Dovecot debug logging: auth_debug=yes in dovecot.conf');
      console.log('3. Try setting password scheme to PLAIN for testing: MAIL_PASSWORD_SCHEME=PLAIN');
      console.log('4. Reset the mail account password with a known value for testing');
    }
  } else {
    console.error('❌ Cannot run tests without user information');
  }
  
  // Cleanup
  try {
    if (mainPool && typeof mainPool.end === 'function') {
      await mainPool.end();
    }
    
    if (mailConnection && mailConnection !== mainPool && typeof mailConnection.end === 'function') {
      await mailConnection.end();
    }
    
    // Clean up temporary files
    try {
      await fs.unlink(path.join(__dirname, 'temp-public-key.asc'));
    } catch (unlinkError) {
      // Ignore errors if file doesn't exist
    }
  } catch (error) {
    console.error(`Error during cleanup: ${error.message}`);
  }
}

// Run the test
main().catch(error => {
  console.error(`Fatal error: ${error.message}`);
  process.exit(1);
});