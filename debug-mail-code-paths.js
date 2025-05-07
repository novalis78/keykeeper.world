#!/usr/bin/env node

/**
 * Mail Code Path Debugging Tool
 * 
 * This script examines the code paths for mail account retrieval to identify
 * why connections might be failing despite correct configuration.
 * 
 * Usage: node debug-mail-code-paths.js <user_id>
 */

const mysql = require('mysql2/promise');
const fs = require('fs').promises;
const path = require('path');
require('dotenv').config();

// Main function
async function main() {
  // Get user ID from command line
  const userId = process.argv[2];
  if (!userId) {
    console.error('Error: User ID is required');
    console.error('Usage: node debug-mail-code-paths.js <user_id>');
    process.exit(1);
  }

  console.log('====== MAIL CODE PATHS DEBUGGING TOOL ======');
  console.log(`Analyzing code paths for mail account retrieval (User ID: ${userId})`);
  console.log('=============================================');

  // 1. Environment variables
  console.log('\n===== ENVIRONMENT VARIABLES =====');
  console.log(`NODE_ENV: ${process.env.NODE_ENV || 'not set'}`);
  console.log(`USE_MAIN_DB_FOR_MAIL: ${process.env.USE_MAIN_DB_FOR_MAIL || 'not set'}`);
  console.log(`MAIL_DB_HOST: ${process.env.MAIL_DB_HOST || 'not set'}`);
  console.log(`MAIL_DB_USER: ${process.env.MAIL_DB_USER ? '[SET]' : 'not set'}`);
  console.log(`MAIL_DB_PASSWORD: ${process.env.MAIL_DB_PASSWORD ? '[SET]' : 'not set'}`);
  console.log(`MAIL_DB_NAME: ${process.env.MAIL_DB_NAME || 'not set'}`);
  console.log(`MAIL_USERS_TABLE: ${process.env.MAIL_USERS_TABLE || 'virtual_users (default)'}`);
  console.log(`MAIL_HOST: ${process.env.MAIL_HOST || 'not set'}`);
  console.log(`APP_SECRET: ${process.env.APP_SECRET ? '[SET]' : 'not set'}`);
  console.log(`USE_REAL_MAIL_SERVER: ${process.env.USE_REAL_MAIL_SERVER || 'not set'}`);
  
  // 2. Test getMailDbConnection function from account manager
  console.log('\n===== TESTING getMailDbConnection FUNCTION =====');
  
  // Load the db.js module
  console.log('Simulating db.js getMailDbConnection function...');
  
  // Connect to the database to check actual behavior
  let mainConnection;
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
    
    // Create the connection
    mainConnection = await mysql.createConnection({
      host: hostname,
      port: parsedPort,
      user: username,
      password: password,
      database: database
    });
    
    console.log('✅ Main database connection successful');
    
    // If USE_MAIN_DB_FOR_MAIL is true, this should be used
    console.log(`USE_MAIN_DB_FOR_MAIL is ${process.env.USE_MAIN_DB_FOR_MAIL === 'true' ? 'true' : 'false or not set'}`);
    
    if (process.env.USE_MAIN_DB_FOR_MAIL === 'true') {
      console.log('✅ Should be using main database connection for mail operations');
      console.log('Let\'s test if virtual_users table exists in main database...');
      
      try {
        const [rows] = await mainConnection.execute(
          'SELECT COUNT(*) as count FROM information_schema.tables WHERE table_schema = DATABASE() AND table_name = ?',
          [process.env.MAIL_USERS_TABLE || 'virtual_users']
        );
        
        if (rows[0].count > 0) {
          console.log(`✅ Table ${process.env.MAIL_USERS_TABLE || 'virtual_users'} exists in main database`);
          
          // Check for user_id column
          const [columns] = await mainConnection.execute(
            'SELECT COLUMN_NAME FROM information_schema.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = ? AND COLUMN_NAME = ?',
            [process.env.MAIL_USERS_TABLE || 'virtual_users', 'user_id']
          );
          
          if (columns.length > 0) {
            console.log('✅ user_id column exists in virtual_users table');
          } else {
            console.error('❌ user_id column does not exist in virtual_users table!');
          }
          
          // Try to find the user's mail account
          const tableName = process.env.MAIL_USERS_TABLE || 'virtual_users';
          const [accounts] = await mainConnection.execute(
            `SELECT id, email, username FROM ${tableName} WHERE user_id = ?`,
            [userId]
          );
          
          if (accounts.length > 0) {
            console.log(`✅ Found ${accounts.length} mail account(s) for user ${userId} in main database`);
            accounts.forEach(account => {
              console.log(`   - ID: ${account.id}, Email: ${account.email}, Username: ${account.username}`);
            });
          } else {
            console.error(`❌ No mail accounts found for user ${userId} in main database!`);
            
            // Check if the user_id format is different
            console.log('Checking if user_id might be in a different format...');
            
            const [similarAccounts] = await mainConnection.execute(
              `SELECT id, email, username, user_id FROM ${tableName} LIMIT 5`
            );
            
            if (similarAccounts.length > 0) {
              console.log('Sample accounts from the virtual_users table:');
              similarAccounts.forEach(account => {
                console.log(`   - ID: ${account.id}, Email: ${account.email}, User ID: ${account.user_id}`);
              });
              
              // Check if the user ID format might be different (e.g., with or without dashes)
              const cleanUserId = userId.replace(/-/g, '');
              const [noHyphenAccounts] = await mainConnection.execute(
                `SELECT id, email, username, user_id FROM ${tableName} WHERE REPLACE(user_id, '-', '') = ?`,
                [cleanUserId]
              );
              
              if (noHyphenAccounts.length > 0) {
                console.log('✅ Found accounts with matching user_id (after removing hyphens):');
                noHyphenAccounts.forEach(account => {
                  console.log(`   - ID: ${account.id}, Email: ${account.email}, User ID: ${account.user_id}`);
                });
              }
            }
          }
        } else {
          console.error(`❌ Table ${process.env.MAIL_USERS_TABLE || 'virtual_users'} does not exist in main database!`);
        }
      } catch (error) {
        console.error(`❌ Error testing main database: ${error.message}`);
      }
    } else {
      console.log('⚠️ Not using main database for mail operations, would attempt separate connection');
    }
    
    // Separate mail database connection
    if (process.env.USE_MAIN_DB_FOR_MAIL !== 'true') {
      console.log('\nAttempting separate mail database connection...');
      
      // Configure database connection
      const dbConfig = {
        host: process.env.MAIL_DB_HOST || 'localhost',
        user: process.env.MAIL_DB_USER || username, // Fall back to main DB user
        password: process.env.MAIL_DB_PASSWORD || password, // Fall back to main DB password
        database: process.env.MAIL_DB_NAME || 'vmail'
      };
      
      console.log(`Connecting to mail database at ${dbConfig.host}/${dbConfig.database}`);
      
      try {
        const mailConnection = await mysql.createConnection(dbConfig);
        console.log('✅ Separate mail database connection successful');
        
        // Check if the virtual_users table exists
        const [tables] = await mailConnection.execute('SHOW TABLES');
        const tableName = process.env.MAIL_USERS_TABLE || 'virtual_users';
        const tableExists = tables.some(table => Object.values(table)[0] === tableName);
        
        if (tableExists) {
          console.log(`✅ Table ${tableName} exists in separate mail database`);
          
          // Check for user's mail account
          try {
            const [accounts] = await mailConnection.execute(
              `SELECT id, email, username FROM ${tableName} WHERE user_id = ?`,
              [userId]
            );
            
            if (accounts.length > 0) {
              console.log(`✅ Found ${accounts.length} mail account(s) for user ${userId} in separate mail database`);
              accounts.forEach(account => {
                console.log(`   - ID: ${account.id}, Email: ${account.email}, Username: ${account.username}`);
              });
            } else {
              console.error(`❌ No mail accounts found for user ${userId} in separate mail database!`);
            }
          } catch (error) {
            console.error(`❌ Error querying mail accounts: ${error.message}`);
          }
        } else {
          console.error(`❌ Table ${tableName} does not exist in separate mail database!`);
        }
        
        await mailConnection.end();
      } catch (error) {
        console.error(`❌ Separate mail database connection error: ${error.message}`);
      }
    }
  } catch (error) {
    console.error(`❌ Main database connection error: ${error.message}`);
  }
  
  // 3. Check if db.query works correctly
  console.log('\n===== TESTING db.query FUNCTION =====');
  
  try {
    if (mainConnection) {
      console.log('Simulating db.query function...');
      
      const tableName = process.env.MAIL_USERS_TABLE || 'virtual_users';
      
      // Test if a direct query works
      try {
        const [directResults] = await mainConnection.execute(
          `SELECT * FROM ${tableName} WHERE user_id = ?`,
          [userId]
        );
        
        if (directResults.length > 0) {
          console.log(`✅ Direct query found ${directResults.length} results in main database`);
        } else {
          console.error(`❌ Direct query found no results in main database`);
          
          // Try a broader query
          const [allResults] = await mainConnection.execute(
            `SELECT * FROM ${tableName} LIMIT 5`
          );
          
          if (allResults.length > 0) {
            console.log(`Found ${allResults.length} total rows in ${tableName} table (showing up to 5):`);
            allResults.forEach(row => {
              console.log(`   - ID: ${row.id}, Email: ${row.email || 'N/A'}, User ID: ${row.user_id || 'N/A'}`);
            });
          } else {
            console.error(`❌ Table ${tableName} appears to be empty!`);
          }
        }
      } catch (error) {
        console.error(`❌ Error with direct query: ${error.message}`);
      }
    }
  } catch (error) {
    console.error(`❌ Error testing db.query: ${error.message}`);
  }
  
  // 4. Check if IMAP connection would be possible
  console.log('\n===== TESTING IMAP CONNECTION POSSIBILITY =====');
  
  try {
    const imapHost = process.env.MAIL_HOST || 'localhost';
    const imapPort = parseInt(process.env.MAIL_IMAP_PORT || '993');
    const imapSecure = process.env.MAIL_IMAP_SECURE !== 'false';
    
    console.log(`IMAP configuration: ${imapHost}:${imapPort} (secure: ${imapSecure})`);
    console.log(`USE_REAL_MAIL_SERVER: ${process.env.USE_REAL_MAIL_SERVER || 'not set'}`);
    
    if (process.env.USE_REAL_MAIL_SERVER !== 'true') {
      console.warn('⚠️ USE_REAL_MAIL_SERVER is not set to "true" - might be using mock data instead of real server!');
      console.log('Set USE_REAL_MAIL_SERVER=true in your environment variables to use the real mail server.');
    }
  } catch (error) {
    console.error(`❌ Error checking IMAP configuration: ${error.message}`);
  }
  
  // 5. Check case sensitivity in user ID
  console.log('\n===== CHECKING USER ID CASE SENSITIVITY =====');
  
  try {
    if (mainConnection) {
      const tableName = process.env.MAIL_USERS_TABLE || 'virtual_users';
      
      // Check variations of the user ID
      const uppercaseId = userId.toUpperCase();
      const lowercaseId = userId.toLowerCase();
      
      console.log(`Original ID: ${userId}`);
      console.log(`Uppercase ID: ${uppercaseId}`);
      console.log(`Lowercase ID: ${lowercaseId}`);
      
      // Try case-insensitive search
      try {
        const [caseResults] = await mainConnection.execute(
          `SELECT id, email, username, user_id FROM ${tableName} WHERE LOWER(user_id) = LOWER(?)`,
          [userId]
        );
        
        if (caseResults.length > 0) {
          console.log(`✅ Found ${caseResults.length} mail account(s) using case-insensitive search`);
          caseResults.forEach(account => {
            console.log(`   - ID: ${account.id}, Email: ${account.email}, User ID: ${account.user_id}`);
          });
        } else {
          console.log('❌ No accounts found with case-insensitive search');
        }
      } catch (error) {
        console.error(`❌ Error with case-insensitive search: ${error.message}`);
      }
    }
  } catch (error) {
    console.error(`❌ Error checking user ID case sensitivity: ${error.message}`);
  }
  
  // 6. Test column alignment
  console.log('\n===== CHECKING COLUMN NAMES AND ALIGNENT =====');
  
  try {
    if (mainConnection) {
      const tableName = process.env.MAIL_USERS_TABLE || 'virtual_users';
      
      // Get table structure
      try {
        const [columns] = await mainConnection.execute(
          `DESCRIBE ${tableName}`
        );
        
        console.log(`Columns in ${tableName} table:`);
        columns.forEach(col => console.log(`   - ${col.Field} (${col.Type})`));
        
        // Check for the required columns
        const hasUserId = columns.some(col => col.Field.toLowerCase() === 'user_id');
        const hasEmail = columns.some(col => col.Field.toLowerCase() === 'email');
        const hasPassword = columns.some(col => col.Field.toLowerCase() === 'password');
        
        if (hasUserId && hasEmail && hasPassword) {
          console.log('✅ All required columns exist in the table');
        } else {
          console.error('❌ Missing required columns in the table!');
          if (!hasUserId) console.error('   - Missing user_id column');
          if (!hasEmail) console.error('   - Missing email column');
          if (!hasPassword) console.error('   - Missing password column');
        }
        
        // Check for possible case sensitivity issues
        const userIdColumn = columns.find(col => col.Field.toLowerCase() === 'user_id');
        if (userIdColumn && userIdColumn.Field !== 'user_id') {
          console.warn(`⚠️ user_id column has different case: ${userIdColumn.Field}`);
        }
      } catch (error) {
        console.error(`❌ Error describing table: ${error.message}`);
      }
    }
  } catch (error) {
    console.error(`❌ Error checking column alignment: ${error.message}`);
  }

  // 7. Clean up
  if (mainConnection) {
    try {
      await mainConnection.end();
    } catch (err) {
      // Ignore cleanup errors
    }
  }

  console.log('\n====== DEBUGGING COMPLETED ======');
  console.log('Possible issues:');
  console.log('1. USE_REAL_MAIL_SERVER is not set to "true" (check if using mock data)');
  console.log('2. User ID case sensitivity or format issues');
  console.log('3. Column name capitalization differences');
  console.log('4. Table structure differences between environments');
  console.log('5. Database query execution issues in the application code');
}

// Run the main function
main().catch(err => {
  console.error('Fatal error:', err);
  process.exit(1);
});