#!/usr/bin/env node

/**
 * Mail System Comprehensive Fix Tool
 * 
 * This script attempts to fix all common issues with the mail system
 * by applying the most likely fixes based on our diagnostics.
 * 
 * Usage: node fix-mail-system.js <user_id>
 */

const fs = require('fs').promises;
const path = require('path');
const mysql = require('mysql2/promise');
const util = require('util');
const execAsync = util.promisify(require('child_process').exec);
require('dotenv').config();

// Main function
async function main() {
  // Get user ID from command line
  const userId = process.argv[2];
  if (!userId) {
    console.error('Error: User ID is required');
    console.error('Usage: node fix-mail-system.js <user_id>');
    process.exit(1);
  }

  console.log('====== MAIL SYSTEM COMPREHENSIVE FIX TOOL ======');
  console.log(`Applying fixes for mail system (User ID: ${userId})`);
  console.log('===============================================');

  // 1. Check current environment settings
  console.log('\n===== ENVIRONMENT VARIABLES =====');
  const envVars = [
    'USE_MAIN_DB_FOR_MAIL',
    'MAIL_USERS_TABLE',
    'USE_REAL_MAIL_SERVER',
    'MAIL_HOST',
    'MAIL_IMAP_PORT',
    'MAIL_IMAP_SECURE',
    'NODE_ENV'
  ];
  
  const envSettings = {};
  
  for (const varName of envVars) {
    envSettings[varName] = process.env[varName];
    console.log(`${varName}: ${process.env[varName] || 'not set'}`);
  }

  // 2. Check if .env file exists and parse it
  const envPath = path.join(process.cwd(), '.env');
  let envFileExists = false;
  let envFileContent = {};
  
  try {
    const envContent = await fs.readFile(envPath, 'utf8');
    envFileExists = true;
    
    // Parse .env file
    envContent.split('\n').forEach(line => {
      if (line.trim() && !line.startsWith('#')) {
        const [key, ...valueParts] = line.split('=');
        const value = valueParts.join('=');
        if (key && value !== undefined) {
          envFileContent[key.trim()] = value.trim();
        }
      }
    });
    
    console.log(`✅ Found .env file with ${Object.keys(envFileContent).length} settings`);
  } catch (error) {
    if (error.code === 'ENOENT') {
      console.log('⚠️ No .env file found');
    } else {
      console.error(`❌ Error reading .env file: ${error.message}`);
    }
  }

  // 3. Test database connections
  console.log('\n===== DATABASE CONNECTIONS =====');
  let mainDbConnection = null;
  let mailDbConnection = null;
  
  // Connect to main database
  try {
    if (!process.env.DATABASE_URL) {
      throw new Error('DATABASE_URL environment variable not set');
    }
    
    // Parse DATABASE_URL
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
    
    mainDbConnection = await mysql.createConnection({
      host: hostname,
      port: parsedPort,
      user: username,
      password: password,
      database: database
    });
    
    console.log('✅ Main database connection successful');
    
    // Test if user exists
    const [userRows] = await mainDbConnection.execute(
      'SELECT id, email FROM users WHERE id = ?',
      [userId]
    );
    
    if (userRows.length > 0) {
      console.log(`✅ Found user: ${userRows[0].email} (ID: ${userRows[0].id})`);
    } else {
      console.error(`❌ User with ID ${userId} not found in main database!`);
    }
    
    // Check if virtual_users table exists in main database
    const [mainTables] = await mainDbConnection.execute(
      'SELECT COUNT(*) as count FROM information_schema.tables WHERE table_schema = DATABASE() AND table_name = ?',
      [process.env.MAIL_USERS_TABLE || 'virtual_users']
    );
    
    if (mainTables[0].count > 0) {
      console.log(`✅ Table ${process.env.MAIL_USERS_TABLE || 'virtual_users'} exists in main database`);
    } else {
      console.error(`❌ Table ${process.env.MAIL_USERS_TABLE || 'virtual_users'} does not exist in main database!`);
    }
  } catch (error) {
    console.error(`❌ Main database connection error: ${error.message}`);
  }
  
  // Connect to mail database if separate
  if (process.env.USE_MAIN_DB_FOR_MAIL !== 'true') {
    try {
      const dbConfig = {
        host: process.env.MAIL_DB_HOST || 'localhost',
        user: process.env.MAIL_DB_USER,
        password: process.env.MAIL_DB_PASSWORD,
        database: process.env.MAIL_DB_NAME || 'vmail'
      };
      
      console.log(`Connecting to mail database at ${dbConfig.host}/${dbConfig.database}`);
      
      mailDbConnection = await mysql.createConnection(dbConfig);
      console.log('✅ Mail database connection successful');
    } catch (error) {
      console.error(`❌ Mail database connection error: ${error.message}`);
    }
  }

  // 4. Apply fixes
  console.log('\n===== APPLYING FIXES =====');
  
  const fixes = [
    // Fix 1: Ensure USE_MAIN_DB_FOR_MAIL is set to true
    {
      name: 'Set USE_MAIN_DB_FOR_MAIL=true',
      condition: () => mainDbConnection && (process.env.USE_MAIN_DB_FOR_MAIL !== 'true'),
      fix: () => {
        console.log('Setting USE_MAIN_DB_FOR_MAIL=true');
        return { 'USE_MAIN_DB_FOR_MAIL': 'true' };
      }
    },
    
    // Fix 2: Ensure MAIL_USERS_TABLE is set correctly
    {
      name: 'Set MAIL_USERS_TABLE=virtual_users',
      condition: () => process.env.MAIL_USERS_TABLE !== 'virtual_users' && !process.env.MAIL_USERS_TABLE,
      fix: () => {
        console.log('Setting MAIL_USERS_TABLE=virtual_users');
        return { 'MAIL_USERS_TABLE': 'virtual_users' };
      }
    },
    
    // Fix 3: Ensure USE_REAL_MAIL_SERVER is set to true
    {
      name: 'Set USE_REAL_MAIL_SERVER=true',
      condition: () => process.env.USE_REAL_MAIL_SERVER !== 'true',
      fix: () => {
        console.log('Setting USE_REAL_MAIL_SERVER=true');
        return { 'USE_REAL_MAIL_SERVER': 'true' };
      }
    },
    
    // Fix 4: Remove unnecessary mail database settings if using main DB
    {
      name: 'Remove unnecessary mail database settings',
      condition: () => process.env.USE_MAIN_DB_FOR_MAIL === 'true' && 
                       (process.env.MAIL_DB_HOST || process.env.MAIL_DB_USER || 
                        process.env.MAIL_DB_PASSWORD || process.env.MAIL_DB_NAME),
      fix: () => {
        console.log('Removing unnecessary mail database settings');
        return { 
          'MAIL_DB_HOST': null, 
          'MAIL_DB_USER': null, 
          'MAIL_DB_PASSWORD': null, 
          'MAIL_DB_NAME': null 
        };
      }
    },
    
    // Fix 5: Set mail server connection settings if missing
    {
      name: 'Set mail server connection settings',
      condition: () => !process.env.MAIL_HOST,
      fix: () => {
        console.log('Setting default mail server connection settings');
        return { 
          'MAIL_HOST': 'localhost',
          'MAIL_IMAP_PORT': '993',
          'MAIL_IMAP_SECURE': 'true'
        };
      }
    }
  ];
  
  // Apply needed fixes
  const fixesToApply = {};
  
  for (const fix of fixes) {
    try {
      if (fix.condition()) {
        console.log(`Applying fix: ${fix.name}`);
        const fixSettings = fix.fix();
        Object.assign(fixesToApply, fixSettings);
      } else {
        console.log(`Not needed: ${fix.name}`);
      }
    } catch (error) {
      console.error(`Error checking/applying fix "${fix.name}": ${error.message}`);
    }
  }
  
  // Check if we have any fixes to apply
  if (Object.keys(fixesToApply).length === 0) {
    console.log('No environment variable fixes needed!');
  } else {
    console.log('\nEnvironment variable fixes to apply:');
    for (const [key, value] of Object.entries(fixesToApply)) {
      if (value === null) {
        console.log(`- Remove ${key}`);
      } else {
        console.log(`- Set ${key}=${value}`);
      }
    }
  }
  
  // 5. Update .env file if requested
  if (Object.keys(fixesToApply).length > 0) {
    console.log('\n===== UPDATING ENVIRONMENT =====');
    
    // Update in-memory environment variables
    for (const [key, value] of Object.entries(fixesToApply)) {
      if (value === null) {
        delete process.env[key];
      } else {
        process.env[key] = value;
      }
    }
    
    console.log('Environment variables updated in memory');
    
    if (envFileExists) {
      console.log('\nTo update your .env file with these changes, run:');
      
      // Create updated .env content
      const updatedEnvContent = { ...envFileContent };
      for (const [key, value] of Object.entries(fixesToApply)) {
        if (value === null) {
          delete updatedEnvContent[key];
        } else {
          updatedEnvContent[key] = value;
        }
      }
      
      // Format as string
      const envString = Object.entries(updatedEnvContent)
        .map(([key, value]) => `${key}=${value}`)
        .join('\n');
      
      console.log(`\necho "${envString.replace(/"/g, '\\"')}" > .env`);
    }
    
    console.log('\nFor Coolify deployment, add these environment variables:');
    for (const [key, value] of Object.entries(fixesToApply)) {
      if (value !== null) {
        console.log(`${key}=${value}`);
      }
    }
  }
  
  // 6. Check for mail account and create if missing
  console.log('\n===== CHECKING MAIL ACCOUNT =====');
  
  if (mainDbConnection) {
    try {
      const tableName = process.env.MAIL_USERS_TABLE || 'virtual_users';
      
      // Check if user has a mail account
      const [accounts] = await mainDbConnection.execute(
        `SELECT id, email, username, user_id FROM ${tableName} WHERE user_id = ?`,
        [userId]
      );
      
      if (accounts.length > 0) {
        console.log(`✅ Found ${accounts.length} mail account(s) for user ${userId}`);
        accounts.forEach(account => {
          console.log(`   - ID: ${account.id}, Email: ${account.email}, Username: ${account.username}`);
        });
      } else {
        console.error(`❌ No mail accounts found for user ${userId}!`);
        
        // Get user info for creating mail account
        const [userInfo] = await mainDbConnection.execute(
          `SELECT email FROM users WHERE id = ?`,
          [userId]
        );
        
        if (userInfo.length > 0) {
          const userEmail = userInfo[0].email;
          
          console.log(`Would you like to create a mail account for ${userEmail}?`);
          console.log('To create the account, you would need to run a command like:');
          console.log(`
CREATE MAIL ACCOUNT SQL:
-----------------------
INSERT INTO ${tableName} (domain_id, username, password, email, user_id)
VALUES (
  1, 
  '${userEmail.split('@')[0]}',
  '{SHA512-CRYPT}$6$salt$hash', -- Generate proper hash with \`doveadm pw -s SHA512-CRYPT\`
  '${userEmail}',
  '${userId}'
);
          `);
        }
      }
    } catch (error) {
      console.error(`❌ Error checking mail account: ${error.message}`);
    }
  }
  
  // 7. Test IMAP connection if possible
  console.log('\n===== TESTING IMAP CONNECTION =====');
  
  // This would require ImapFlow, which we're not importing in this script
  // Instead, show the command that would test it
  console.log('To test IMAP connection after applying fixes:');
  console.log(`1. Restart your application with the updated environment variables`);
  console.log(`2. Visit the mail diagnostics page: https://keykeeper.world/admin/diagnostics/mail`);
  console.log(`3. Enter the user ID: ${userId}`);
  console.log(`4. Check if the mail account is found and IMAP tests pass`);

  // 8. Clean up
  if (mainDbConnection) {
    try {
      await mainDbConnection.end();
    } catch (err) {
      // Ignore cleanup errors
    }
  }
  
  if (mailDbConnection) {
    try {
      await mailDbConnection.end();
    } catch (err) {
      // Ignore cleanup errors
    }
  }

  console.log('\n====== FIX TOOL COMPLETED ======');
  console.log('Summary of actions:');
  console.log('1. Identified required environment variable changes');
  console.log('2. Provided commands to update .env file and deployment');
  console.log('3. Checked for mail account existence and provided creation SQL if needed');
  console.log('4. Provided steps to test the fixes');
  
  console.log('\nNext steps:');
  console.log('1. Apply the environment variable changes');
  console.log('2. Restart your application');
  console.log('3. Test the mail diagnostics page again');
  console.log('4. If issues persist, examine mail server logs for auth failures');
}

// Run the main function
main().catch(err => {
  console.error('Fatal error:', err);
  process.exit(1);
});