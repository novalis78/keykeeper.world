#!/usr/bin/env node

/**
 * Direct Database Query Test Tool
 * 
 * This script bypasses all the application logic and directly queries
 * the database to verify mail account existence and retrieval.
 * 
 * Usage: node fix-query-path.js <user_id>
 */

const mysql = require('mysql2/promise');
require('dotenv').config();

// Main function
async function main() {
  // Get user ID from command line
  const userId = process.argv[2];
  if (!userId) {
    console.error('Error: User ID is required');
    console.error('Usage: node fix-query-path.js <user_id>');
    process.exit(1);
  }

  console.log('====== DIRECT DATABASE QUERY TEST ======');
  console.log(`Testing mail account queries for user ID: ${userId}`);
  console.log('=========================================');

  // Verify environment settings
  console.log('\n===== ENVIRONMENT VARIABLES =====');
  console.log(`DATABASE_URL: ${process.env.DATABASE_URL ? '[SET]' : 'not set'}`);
  console.log(`USE_MAIN_DB_FOR_MAIL: ${process.env.USE_MAIN_DB_FOR_MAIL || 'not set'}`);
  console.log(`MAIL_DB_HOST: ${process.env.MAIL_DB_HOST || 'not set'}`);
  console.log(`MAIL_USERS_TABLE: ${process.env.MAIL_USERS_TABLE || 'virtual_users (default)'}`);

  // Connect to the database
  let connection;
  try {
    if (!process.env.DATABASE_URL) {
      throw new Error('DATABASE_URL environment variable not set');
    }

    // Parse the database URL
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
    
    console.log(`\nConnecting to database at ${hostname}:${parsedPort}/${database}`);
    
    // Create connection
    connection = await mysql.createConnection({
      host: hostname,
      port: parsedPort,
      user: username,
      password: password,
      database: database
    });
    
    console.log('✅ Database connection successful');
    
    // Query for user
    console.log('\n===== USER QUERY =====');
    const [userRows] = await connection.execute(
      'SELECT id, email FROM users WHERE id = ?',
      [userId]
    );
    
    if (userRows.length === 0) {
      console.error(`❌ User with ID ${userId} not found in users table`);
    } else {
      console.log(`✅ Found user: ${userRows[0].email} (ID: ${userRows[0].id})`);
    }
    
    // Now test different variations of the mail account query
    console.log('\n===== MAIL ACCOUNT QUERY VARIATIONS =====');
    
    const tableName = process.env.MAIL_USERS_TABLE || 'virtual_users';
    
    // 1. Standard query
    await testQuery(connection, 
      `SELECT id, email FROM ${tableName} WHERE user_id = ?`,
      [userId],
      '1. Standard query'
    );
    
    // 2. Query with BINARY for case-sensitive comparison
    await testQuery(connection, 
      `SELECT id, email FROM ${tableName} WHERE BINARY user_id = ?`,
      [userId],
      '2. Case-sensitive query'
    );
    
    // 3. Query with lowercase
    await testQuery(connection, 
      `SELECT id, email FROM ${tableName} WHERE LOWER(user_id) = LOWER(?)`,
      [userId],
      '3. Case-insensitive query'
    );
    
    // 4. Query without dashes
    await testQuery(connection, 
      `SELECT id, email FROM ${tableName} WHERE REPLACE(user_id, '-', '') = REPLACE(?, '-', '')`,
      [userId],
      '4. Without dashes query'
    );
    
    // 5. Query with LIKE
    await testQuery(connection, 
      `SELECT id, email FROM ${tableName} WHERE user_id LIKE ?`,
      [userId],
      '5. LIKE query'
    );
    
    // 6. Query with wildcard LIKE
    await testQuery(connection, 
      `SELECT id, email FROM ${tableName} WHERE user_id LIKE ?`,
      [`%${userId.substring(0, 8)}%`],
      '6. Partial LIKE query (first 8 chars)'
    );
    
    // Get database info
    console.log('\n===== DATABASE INFO =====');
    
    // Check character set and collation
    const [charsetRows] = await connection.execute(
      'SELECT @@character_set_database, @@collation_database'
    );
    
    console.log(`Character set: ${charsetRows[0]['@@character_set_database']}`);
    console.log(`Collation: ${charsetRows[0]['@@collation_database']}`);
    
    // Check table structure
    const [columnsRows] = await connection.execute(
      `DESCRIBE ${tableName}`
    );
    
    console.log(`\nTable structure for ${tableName}:`);
    columnsRows.forEach(col => {
      console.log(`- ${col.Field} (${col.Type})${col.Key ? ' [' + col.Key + ']' : ''}`);
    });
    
    // Check for case-sensitive issues
    const userIdCol = columnsRows.find(col => col.Field.toLowerCase() === 'user_id');
    if (userIdCol && userIdCol.Field !== 'user_id') {
      console.warn(`⚠️ user_id column name has different case: ${userIdCol.Field}`);
    }
    
    // Check for collation of user_id column 
    if (userIdCol) {
      const [colCharset] = await connection.execute(
        `SELECT COLUMN_NAME, CHARACTER_SET_NAME, COLLATION_NAME 
         FROM INFORMATION_SCHEMA.COLUMNS 
         WHERE TABLE_SCHEMA = DATABASE() 
         AND TABLE_NAME = ? 
         AND COLUMN_NAME = ?`,
        [tableName, userIdCol.Field]
      );
      
      if (colCharset.length > 0) {
        console.log(`user_id column charset: ${colCharset[0].CHARACTER_SET_NAME || 'not set'}`);
        console.log(`user_id column collation: ${colCharset[0].COLLATION_NAME || 'not set'}`);
        
        // Check if collation is case-sensitive (_cs) or case-insensitive (_ci)
        if (colCharset[0].COLLATION_NAME && colCharset[0].COLLATION_NAME.includes('_cs')) {
          console.warn('⚠️ user_id column uses case-sensitive collation!');
          console.log('This may cause issues with case-sensitive user ID matching');
        }
      }
    }

    // Create code patch recommendations
    console.log('\n===== FIX RECOMMENDATIONS =====');
    
    // Check if any query worked
    if (queryResults.some(q => q.success)) {
      const bestQuery = queryResults.find(q => q.success);
      
      console.log(`The best working query was: ${bestQuery.name}`);
      console.log(`SQL: ${bestQuery.sql}`);
      
      // Generate code patch for passwordManager.js
      console.log('\nRecommended code patch for passwordManager.js:');
      console.log(`
In the getMailAccounts function, replace:

const [rows] = await connection.execute(
  \`SELECT id, email, username, password FROM \${tableName} WHERE user_id = ?\`,
  [userId]
);

With:

const [rows] = await connection.execute(
  \`${bestQuery.sql}\`,
  ${JSON.stringify(bestQuery.params)}
);
      `);
    } else {
      console.log('❌ None of the query variations worked');
      
      // Check if the mail account exists at all
      const [anyAccounts] = await connection.execute(
        `SELECT COUNT(*) as count FROM ${tableName}`
      );
      
      if (anyAccounts[0].count === 0) {
        console.log('⚠️ The mail accounts table is empty!');
      } else {
        // Show sample accounts
        const [sampleAccounts] = await connection.execute(
          `SELECT id, email, username, user_id FROM ${tableName} LIMIT 5`
        );
        
        console.log(`\nSample accounts from ${tableName} table:`);
        sampleAccounts.forEach(acc => {
          console.log(`- ID: ${acc.id}, Email: ${acc.email}, User ID: ${acc.user_id || 'NULL'}`);
        });
      }
    }

  } catch (error) {
    console.error(`❌ Error: ${error.message}`);
  } finally {
    if (connection) {
      await connection.end();
    }
  }
}

// Store query results
const queryResults = [];

// Test a database query and log results
async function testQuery(connection, sql, params, name) {
  try {
    const [rows] = await connection.execute(sql, params);
    
    if (rows.length > 0) {
      console.log(`✅ ${name} worked! Found ${rows.length} result(s)`);
      rows.forEach(row => {
        console.log(`   - ID: ${row.id}, Email: ${row.email}`);
      });
      
      queryResults.push({
        name,
        sql,
        params,
        success: true,
        results: rows.length
      });
    } else {
      console.log(`❌ ${name} found no results`);
      queryResults.push({
        name,
        sql,
        params,
        success: false,
        results: 0
      });
    }
  } catch (error) {
    console.error(`❌ ${name} failed with error: ${error.message}`);
    queryResults.push({
      name,
      sql,
      params,
      success: false,
      error: error.message
    });
  }
}

// Run the main function
main().catch(err => {
  console.error('Fatal error:', err);
  process.exit(1);
});