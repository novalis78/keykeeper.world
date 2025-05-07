#!/usr/bin/env node

/**
 * Mail DB Configuration Fixer
 * 
 * This script helps fix the environment configuration to correctly
 * point to the mail tables in the main database, based on your database structure.
 * 
 * Usage: node fix-mail-db-config.js
 */

const fs = require('fs').promises;
const path = require('path');
require('dotenv').config();

// Main function
async function main() {
  console.log('====== MAIL DATABASE CONFIGURATION FIXER ======');
  console.log('This script will update your .env file to fix mail database configuration');
  console.log('=================================================');

  // 1. Check if .env file exists
  const envPath = path.join(process.cwd(), '.env');
  let envContent = '';
  let currentSettings = {};
  
  try {
    envContent = await fs.readFile(envPath, 'utf8');
    console.log('✅ Found .env file');
    
    // Parse current settings
    envContent.split('\n').forEach(line => {
      if (line.trim() && !line.startsWith('#')) {
        const [key, ...valueParts] = line.split('=');
        const value = valueParts.join('=');
        if (key && value !== undefined) {
          currentSettings[key.trim()] = value.trim();
        }
      }
    });
  } catch (error) {
    if (error.code === 'ENOENT') {
      console.log('⚠️ No .env file found, will create a new one');
      envContent = '';
    } else {
      console.error(`❌ Error reading .env file: ${error.message}`);
      process.exit(1);
    }
  }

  // 2. Determine current settings and necessary changes
  console.log('\n===== CURRENT CONFIGURATION =====');
  
  // Main database configuration
  const databaseUrl = currentSettings.DATABASE_URL || process.env.DATABASE_URL;
  console.log(`DATABASE_URL: ${databaseUrl ? '[SET]' : '[NOT SET]'}`);
  
  // Mail database configuration
  const useMainDbForMail = currentSettings.USE_MAIN_DB_FOR_MAIL === 'true' || process.env.USE_MAIN_DB_FOR_MAIL === 'true';
  const mailDbHost = currentSettings.MAIL_DB_HOST || process.env.MAIL_DB_HOST;
  const mailDbUser = currentSettings.MAIL_DB_USER || process.env.MAIL_DB_USER;
  const mailDbPassword = currentSettings.MAIL_DB_PASSWORD || process.env.MAIL_DB_PASSWORD;
  const mailDbName = currentSettings.MAIL_DB_NAME || process.env.MAIL_DB_NAME;
  const mailUsersTable = currentSettings.MAIL_USERS_TABLE || process.env.MAIL_USERS_TABLE || 'virtual_users';
  
  console.log(`USE_MAIN_DB_FOR_MAIL: ${useMainDbForMail ? 'true' : 'false'}`);
  console.log(`MAIL_DB_HOST: ${mailDbHost || '[NOT SET]'}`);
  console.log(`MAIL_DB_USER: ${mailDbUser ? '[SET]' : '[NOT SET]'}`);
  console.log(`MAIL_DB_PASSWORD: ${mailDbPassword ? '[SET]' : '[NOT SET]'}`);
  console.log(`MAIL_DB_NAME: ${mailDbName || '[NOT SET]'}`);
  console.log(`MAIL_USERS_TABLE: ${mailUsersTable}`);
  
  // 3. Recommend changes
  console.log('\n===== RECOMMENDED CHANGES =====');
  
  // If both tables are in the same database, USE_MAIN_DB_FOR_MAIL should be true
  const recommendUseMainDb = true;
  console.log(`✓ Set USE_MAIN_DB_FOR_MAIL=true (tables are in the same database)`);
  
  // No need for separate mail database settings if using main DB
  if (recommendUseMainDb) {
    console.log(`✓ Remove MAIL_DB_HOST, MAIL_DB_USER, MAIL_DB_PASSWORD, MAIL_DB_NAME if present`);
  }
  
  // Keep the virtual_users table name
  console.log(`✓ Ensure MAIL_USERS_TABLE=virtual_users (confirm this is the correct table name)`);
  
  // 4. Prepare updated configuration
  const updatedSettings = {
    ...currentSettings,
    USE_MAIN_DB_FOR_MAIL: 'true'
  };
  
  // Ensure the virtual_users table name is set properly
  if (!updatedSettings.MAIL_USERS_TABLE) {
    updatedSettings.MAIL_USERS_TABLE = 'virtual_users';
  }
  
  // If using main DB, we don't need separate mail DB settings
  if (recommendUseMainDb) {
    delete updatedSettings.MAIL_DB_HOST;
    delete updatedSettings.MAIL_DB_USER;
    delete updatedSettings.MAIL_DB_PASSWORD;
    delete updatedSettings.MAIL_DB_NAME;
  }
  
  // 5. Generate new .env content
  const newEnvContent = Object.entries(updatedSettings)
    .map(([key, value]) => `${key}=${value}`)
    .join('\n');
  
  // 6. Show changes
  console.log('\n===== WHAT WILL BE CHANGED =====');
  console.log('New .env file content:');
  console.log('--------------------------');
  console.log(newEnvContent);
  console.log('--------------------------');
  
  // 7. Ask for confirmation (simulate in this environment)
  console.log('\nTo apply these changes, run:');
  console.log(`echo "${newEnvContent.replace(/"/g, '\\"')}" > .env`);
  
  console.log('\nOr add the following to your environment variables:');
  console.log('USE_MAIN_DB_FOR_MAIL=true');
  console.log('MAIL_USERS_TABLE=virtual_users');
  
  // 8. Configuration for Coolify deployment
  console.log('\n===== COOLIFY CONFIGURATION =====');
  console.log('If using Coolify for deployment, add these environment variables:');
  console.log('```');
  console.log('USE_MAIN_DB_FOR_MAIL=true');
  console.log('MAIL_USERS_TABLE=virtual_users');
  console.log('```');
  
  console.log('\n===== DOCKER CONFIGURATION =====');
  console.log('If using Docker directly, add these environment variables to your docker-compose.yml or docker run command:');
  console.log('```');
  console.log('  environment:');
  console.log('    - USE_MAIN_DB_FOR_MAIL=true');
  console.log('    - MAIL_USERS_TABLE=virtual_users');
  console.log('```');
  
  console.log('\n===== TESTING THE CHANGE =====');
  console.log('After applying these changes, restart your application and check:');
  console.log('1. Visit the mail diagnostics page again to see if the mail DB connection succeeds');
  console.log('2. Check if your inbox loads properly');
  console.log('3. If still having issues, run the debug-mail-db.js script to get more details');
}

// Run the main function
main().catch(err => {
  console.error('Fatal error:', err);
  process.exit(1);
});