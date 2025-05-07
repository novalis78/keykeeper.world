#!/usr/bin/env node

/**
 * Mail Password Derivation Debug Tool
 * 
 * This script helps diagnose issues with the deterministic passwords
 * derived from PGP keys for Dovecot authentication. It checks:
 * 
 * 1. The derivation process
 * 2. The password hashing format
 * 3. The compatibility with Dovecot
 * 
 * Usage: node debug-mail-password.js <user_id>
 */

const mysql = require('mysql2/promise');
const crypto = require('crypto');
const util = require('util');
const { execSync } = require('child_process');
const exec = util.promisify(require('child_process').exec);
require('dotenv').config();

// Utility for formatting dovecot passwords
async function hashPasswordWithOpenSSL(password) {
  try {
    // Generate a random salt
    const salt = crypto.randomBytes(8).toString('base64')
      .replace(/[+\/=]/g, '.')  // Replace chars not typically used in salts
      .substring(0, 16);        // Limit to 16 chars
      
    // Use the openssl command to generate the password hash
    // This produces the exact same output as the crypt(3) function
    const command = `openssl passwd -6 -salt "${salt}" "${password}"`;
    const output = execSync(command).toString().trim();
    
    // The result will be in the format $6$salt$hash
    return `{SHA512-CRYPT}${output}`;
  } catch (error) {
    console.error('Error generating password hash with OpenSSL:', error);
    
    // Fall back to simple PLAIN scheme if OpenSSL fails
    return `{PLAIN}${password}`;
  }
}

// Main function
async function main() {
  // Get user ID from command line
  const userId = process.argv[2];
  if (!userId) {
    console.error('Error: User ID is required');
    console.error('Usage: node debug-mail-password.js <user_id>');
    process.exit(1);
  }

  console.log('====== MAIL PASSWORD DERIVATION DEBUG TOOL ======');
  console.log(`Testing mail password derivation for user ID: ${userId}`);
  console.log('=================================================');

  // Test environment variables
  console.log('\n===== ENVIRONMENT VARIABLES =====');
  const envVars = [
    'DATABASE_URL',
    'MAIL_DB_HOST',
    'MAIL_DB_USER',
    'MAIL_DB_PASSWORD',
    'MAIL_DB_NAME',
    'MAIL_USERS_TABLE',
    'USE_MAIN_DB_FOR_MAIL',
    'MAIL_PASSWORD_SCHEME',
    'DOVECOT_AUTH_SALT',
    'DOVECOT_AUTH_VERSION'
  ];

  for (const varName of envVars) {
    const value = process.env[varName];
    console.log(`${varName}: ${value ? (varName.includes('PASSWORD') || varName.includes('SECRET') || varName.includes('SALT') ? '******** (set)' : value) : 'NOT SET'}`);
  }

  // Define constants that might be used in password derivation
  const DOVECOT_AUTH_SALT = process.env.DOVECOT_AUTH_SALT || 'keykeeper-dovecot-auth';
  const DOVECOT_AUTH_VERSION = process.env.DOVECOT_AUTH_VERSION || '1';

  // Get user from main database
  console.log('\n===== USER INFORMATION =====');
  let mainPool;
  let user;
  
  try {
    if (!process.env.DATABASE_URL) {
      throw new Error('DATABASE_URL environment variable not set');
    }

    // Parse connection string
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

    // Get user from main database
    console.log(`Looking up user with ID: ${userId}`);
    const [userRows] = await mainPool.execute(
      'SELECT id, email, name, status, key_id, fingerprint, auth_method FROM users WHERE id = ?',
      [userId]
    );
    
    if (userRows.length === 0) {
      console.error(`❌ User with ID ${userId} not found in main database`);
    } else {
      user = userRows[0];
      console.log(`✅ Found user: ${user.email} (${user.name || 'no name'})`);
      console.log(`Status: ${user.status}, Auth method: ${user.auth_method}`);
      console.log(`Key ID: ${user.key_id}, Fingerprint: ${user.fingerprint}`);
    }
  } catch (error) {
    console.error(`❌ Database error: ${error.message}`);
  }

  // Get mail account from virtual_users table
  console.log('\n===== MAIL ACCOUNT =====');
  let mailConnection;
  let mailAccount;
  
  try {
    // Configure database connection
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
    
    // Check for mail account
    const tableName = process.env.MAIL_USERS_TABLE || 'virtual_users';
    console.log(`Looking up mail account in ${tableName} for user with ID: ${userId}`);
    
    const [rows] = await mailConnection.execute(
      `SELECT id, domain_id, username, email, password FROM ${tableName} WHERE user_id = ?`,
      [userId]
    );
    
    if (rows.length === 0) {
      console.error(`❌ No mail account found for user with ID ${userId}`);
    } else {
      mailAccount = rows[0];
      console.log(`✅ Found mail account: ${mailAccount.email}`);
      console.log(`Password hash: ${mailAccount.password ? mailAccount.password.substring(0, 30) + '...' : 'NOT SET'}`);
      
      // Check password hash format
      if (mailAccount.password) {
        if (mailAccount.password.startsWith('{SHA512-CRYPT}')) {
          console.log('✅ Password is in valid Dovecot SHA512-CRYPT format');
          
          // Further check hash structure
          const cryptPart = mailAccount.password.substring(14); // Remove {SHA512-CRYPT}
          if (cryptPart.startsWith('$6$') && cryptPart.split('$').length === 4) {
            console.log('✅ SHA512-CRYPT hash has correct structure ($6$salt$hash)');
          } else {
            console.error('❌ SHA512-CRYPT hash has incorrect structure!');
            console.log('Expected: $6$salt$hash');
            console.log(`Actual: ${cryptPart}`);
          }
        } else if (mailAccount.password.startsWith('{PLAIN}')) {
          console.log('⚠️ Password is stored in PLAIN format (less secure)');
        } else {
          console.error(`❌ Password is in unexpected format: ${mailAccount.password.split('}')[0]}}`);
        }
      }
    }
  } catch (error) {
    console.error(`❌ Error retrieving mail account: ${error.message}`);
  }

  // Simulate password derivation process
  console.log('\n===== PASSWORD DERIVATION SIMULATION =====');
  
  if (user && user.email) {
    console.log('Simulating deterministic password derivation based on user data:');
    
    // Define possible derivation inputs
    const possibleInputs = [
      `${DOVECOT_AUTH_SALT}:${user.email}:${DOVECOT_AUTH_VERSION}`,
      `${DOVECOT_AUTH_SALT}:${user.email}`,
      `dovecot-auth:${user.email}`,
      `${user.email}:auth`,
      user.email,
      user.id
    ];
    
    console.log('\nSimulating different derivation inputs:');
    
    for (const input of possibleInputs) {
      // Since we don't have access to the private key here, we just show what would be signed
      console.log(`\nInput to be signed: "${input}"`);
      
      // Simulate a signature using a hash of the input (just for demonstration)
      const simulatedSignature = crypto.createHash('sha256').update(input).digest('hex');
      console.log(`Simulated Signature (SHA256 hash for demo only): "${simulatedSignature.substring(0, 20)}..."`);
      
      // Derive test password from the simulated signature
      const encoder = new TextEncoder();
      const data = encoder.encode(simulatedSignature);
      const hashBuffer = crypto.createHash('sha256').update(data).digest();
      
      // Convert to base64 and create a password sample
      const hashArray = Array.from(new Uint8Array(hashBuffer));
      const hashBase64 = Buffer.from(hashArray).toString('base64');
      
      // Create a clean password (similar to client-side derivation)
      const cleanPassword = hashBase64
        .substring(0, 32)
        .replace(/\+/g, 'A')  // Replace '+' with 'A'
        .replace(/\//g, 'B')  // Replace '/' with 'B'
        .replace(/=/g, 'C');  // Replace '=' with 'C'
      
      console.log(`Derived password (simulated): "${cleanPassword}"`);
      
      // Generate a Dovecot hash from the simulated password
      try {
        const dovecotHash = await hashPasswordWithOpenSSL(cleanPassword);
        console.log(`Dovecot hash for this password: "${dovecotHash.substring(0, 40)}..."`);
      } catch (error) {
        console.error(`Error generating hash: ${error.message}`);
      }
    }
  } else {
    console.log('⚠️ Cannot simulate password derivation without user email');
  }

  // Test validation against actual stored hash
  console.log('\n===== PASSWORD VALIDATION SIMULATION =====');
  
  if (mailAccount && mailAccount.password) {
    console.log(`Testing validation of actual stored hash: ${mailAccount.password.substring(0, 30)}...`);
    
    // Extract the scheme
    const scheme = mailAccount.password.split('}')[0].substring(1);
    console.log(`Password hashing scheme: ${scheme}`);
    
    if (scheme === 'SHA512-CRYPT') {
      // Get the salt from the stored hash
      const hashContent = mailAccount.password.substring(mailAccount.password.indexOf('}') + 1);
      const saltMatch = hashContent.match(/^\$6\$([^$]+)\$.*/);
      
      if (saltMatch && saltMatch[1]) {
        const salt = saltMatch[1];
        console.log(`Extracted salt: ${salt}`);
        
        // For each test password, try to validate
        if (user && user.email) {
          console.log('\nTrying to validate against some test passwords:');
          
          // Simple test passwords (for demonstration only)
          const testPasswords = [
            'development-password',
            user.email,
            'password123',
            'dovecot-password',
            'mail-password'
          ];
          
          for (const testPassword of testPasswords) {
            try {
              // Use OpenSSL to hash with the same salt
              const command = `openssl passwd -6 -salt "${salt}" "${testPassword}"`;
              const generatedHash = execSync(command).toString().trim();
              
              // Check if hashes match
              const storedHash = hashContent;
              const match = generatedHash === storedHash;
              
              console.log(`Test password: "${testPassword}" - Match: ${match ? '✅ YES' : '❌ NO'}`);
            } catch (error) {
              console.error(`Error checking test password "${testPassword}": ${error.message}`);
            }
          }
        }
      } else {
        console.error('❌ Could not extract salt from hash!');
      }
    } else if (scheme === 'PLAIN') {
      // For PLAIN, we can directly see the password
      const plainPassword = mailAccount.password.substring(mailAccount.password.indexOf('}') + 1);
      console.log(`Plain password stored: "${plainPassword}"`);
      
      // Directly try any test inputs to see if they match
      if (user && user.email) {
        const testInputs = [
          user.email,
          user.id,
          'development-password'
        ];
        
        for (const input of testInputs) {
          const match = input === plainPassword;
          console.log(`Test input: "${input}" - Match: ${match ? '✅ YES' : '❌ NO'}`);
        }
      }
    } else {
      console.log(`Cannot simulate validation for scheme: ${scheme}`);
    }
  } else {
    console.log('⚠️ Cannot test validation without stored hash');
  }

  // Dovecot auth testing
  console.log('\n===== DOVECOT AUTH TESTING =====');
  
  if (mailAccount && mailAccount.email) {
    // Try checking dovecot auth directly
    try {
      console.log(`Testing basic connection to mail server...`);
      const { stdout, stderr } = await exec('nc -z -v -w 5 localhost 993');
      console.log(`Connection test result: ${stdout || 'Success'}`);
    } catch (error) {
      console.log(`Connection test result: ${error.message.includes('succeeded') ? 'Success' : '❌ Connection failed'}`);
    }
    
    console.log('\nTo manually test authentication:');
    console.log(`1. Connect to IMAP server: openssl s_client -connect localhost:993 -crlf`);
    console.log(`2. Try login: a LOGIN ${mailAccount.email} "your_password_here"`);
    console.log('3. If successful, you should see "a OK" response');
    
    console.log('\nFor debugging Dovecot authentication:');
    console.log('1. Check mail logs: tail -f /var/log/mail.log');
    console.log('2. Increase Dovecot logging: nano /etc/dovecot/conf.d/10-logging.conf');
    console.log('3. Restart Dovecot: service dovecot restart');
  }

  // Cleanup connections
  try {
    if (mainPool && typeof mainPool.end === 'function') {
      await mainPool.end();
    }
    
    if (mailConnection && mailConnection !== mainPool && typeof mailConnection.end === 'function') {
      await mailConnection.end();
    }
  } catch (error) {
    console.error(`Error during cleanup: ${error.message}`);
  }

  console.log('\n====== DIAGNOSIS SUMMARY ======');
  console.log('1. Check if password derivation is consistent between signup and login');
  console.log('2. Ensure the hash format in virtual_users matches what Dovecot expects');
  console.log('3. Verify the crypt3/openssl SHA512-CRYPT implementation is correct');
  console.log('4. Check Dovecot logs for specific authentication failure reasons');
  console.log('5. Compare stored hash with a freshly generated one using the same password');
  console.log('6. Ensure environment variables for auth salt and version are consistent');
}

// Run the diagnostics
main().catch(error => {
  console.error(`Fatal error: ${error.message}`);
  process.exit(1);
});