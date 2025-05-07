#!/usr/bin/env node

/**
 * Mail Database Connection Debug Tool
 * 
 * This script focuses specifically on the mail database connection
 * and the query to retrieve mail accounts for a user.
 * 
 * Usage: node debug-mail-db.js <user_id>
 */

const mysql = require('mysql2/promise');
require('dotenv').config();

// Main function
async function main() {
  // Get user ID from command line
  const userId = process.argv[2];
  if (!userId) {
    console.error('Error: User ID is required');
    console.error('Usage: node debug-mail-db.js <user_id>');
    process.exit(1);
  }

  console.log('====== MAIL DATABASE CONNECTION DEBUG TOOL ======');
  console.log(`Testing mail database connection for user ID: ${userId}`);
  console.log('================================================');

  // Get environment variables
  console.log('\n===== ENVIRONMENT VARIABLES =====');
  const mailDbHost = process.env.MAIL_DB_HOST || 'localhost';
  const mailDbUser = process.env.MAIL_DB_USER || getDbUserFromDatabaseUrl();
  const mailDbPassword = process.env.MAIL_DB_PASSWORD || getDbPasswordFromDatabaseUrl();
  const mailDbName = process.env.MAIL_DB_NAME || 'vmail';
  const mailUsersTable = process.env.MAIL_USERS_TABLE || 'virtual_users';
  const useMainDbForMail = process.env.USE_MAIN_DB_FOR_MAIL === 'true';
  
  console.log(`MAIL_DB_HOST: ${mailDbHost}`);
  console.log(`MAIL_DB_USER: ${mailDbUser ? '[SET]' : '[NOT SET]'}`);
  console.log(`MAIL_DB_PASSWORD: ${mailDbPassword ? '[SET]' : '[NOT SET]'}`);
  console.log(`MAIL_DB_NAME: ${mailDbName}`);
  console.log(`MAIL_USERS_TABLE: ${mailUsersTable}`);
  console.log(`USE_MAIN_DB_FOR_MAIL: ${useMainDbForMail}`);
  console.log(`DATABASE_URL: ${process.env.DATABASE_URL ? '[SET]' : '[NOT SET]'}`);

  // 1. Try to connect to main database
  console.log('\n===== MAIN DATABASE CONNECTION =====');
  let mainPool;
  
  try {
    if (!process.env.DATABASE_URL) {
      throw new Error('DATABASE_URL environment variable not set');
    }

    // Parse the URL
    const dbUrl = process.env.DATABASE_URL;
    const withoutProtocol = dbUrl.replace(/^mysql2?:\/\//, '');
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
    
    // Create main database connection
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

    // Test the connection
    const [rows] = await mainPool.execute('SELECT 1 as test');
    console.log(`✅ Main database connection successful, result: ${rows[0].test}`);
    
    // Get basic user info from main database
    const [userRows] = await mainPool.execute(
      'SELECT id, email FROM users WHERE id = ?',
      [userId]
    );
    
    if (userRows.length === 0) {
      console.error(`❌ User with ID ${userId} not found in main database`);
    } else {
      console.log(`✅ Found user: ${userRows[0].email} (ID: ${userRows[0].id})`);
    }
  } catch (error) {
    console.error(`❌ Main database connection error: ${error.message}`);
  }

  // 2. Try the mail database connection exactly as it's used in the system
  console.log('\n===== MAIL DATABASE CONNECTION =====');
  
  // Using main DB for mail
  if (useMainDbForMail) {
    console.log('Using main database for mail operations (USE_MAIN_DB_FOR_MAIL=true)');
    
    if (!mainPool) {
      console.error('❌ Cannot test mail operations - main database connection failed');
    } else {
      try {
        console.log(`Testing query: SELECT id, username, email FROM ${mailUsersTable} WHERE user_id = ?`);
        
        try {
          const [mailUserRows] = await mainPool.execute(
            `SELECT id, username, email FROM ${mailUsersTable} WHERE user_id = ?`,
            [userId]
          );
          
          if (mailUserRows.length === 0) {
            console.error(`❌ No mail accounts found for user ${userId} in table ${mailUsersTable}`);
          } else {
            console.log(`✅ Found ${mailUserRows.length} mail account(s) using main database connection:`);
            mailUserRows.forEach(account => {
              console.log(`   ID: ${account.id}, Email: ${account.email}, Username: ${account.username}`);
            });
          }
        } catch (queryError) {
          console.error(`❌ Query error: ${queryError.message}`);
          
          // Check if the table exists
          try {
            const [tables] = await mainPool.execute('SHOW TABLES');
            console.log('Available tables in main database:');
            tables.forEach(table => console.log(`   - ${Object.values(table)[0]}`));
            
            // Check if the users table exists
            const tableExists = tables.some(table => Object.values(table)[0] === mailUsersTable);
            if (!tableExists) {
              console.error(`❌ Table ${mailUsersTable} does not exist in the main database!`);
              console.log('   This could be the reason for the connection failure.');
            }
          } catch (tablesError) {
            console.error(`❌ Error listing tables: ${tablesError.message}`);
          }
        }
      } catch (error) {
        console.error(`❌ Error testing mail operations through main database: ${error.message}`);
      }
    }
  } 
  // Using separate mail DB
  else {
    console.log('Using separate mail database connection');
    
    const dbConfig = {
      host: mailDbHost,
      user: mailDbUser,
      password: mailDbPassword,
      database: mailDbName
    };
    
    console.log(`Connecting to mail database at ${dbConfig.host}/${dbConfig.database}`);
    
    try {
      // Create mail database connection
      const mailConnection = await mysql.createConnection(dbConfig);
      console.log('✅ Mail database connection successful');
      
      // Test a simple query
      try {
        const [pingResult] = await mailConnection.execute('SELECT 1 as test');
        console.log(`✅ Mail database ping successful: ${pingResult[0].test}`);
      } catch (pingError) {
        console.error(`❌ Mail database ping failed: ${pingError.message}`);
      }
      
      // Check if the table exists
      try {
        const [tables] = await mailConnection.execute('SHOW TABLES');
        console.log('Available tables in mail database:');
        tables.forEach(table => console.log(`   - ${Object.values(table)[0]}`));
        
        // Check if the virtual_users table exists
        const tableExists = tables.some(table => Object.values(table)[0] === mailUsersTable);
        if (!tableExists) {
          console.error(`❌ Table ${mailUsersTable} does not exist in the mail database!`);
        } else {
          console.log(`✅ Found table ${mailUsersTable} in mail database`);
          
          // Try the actual query
          try {
            const [mailUserRows] = await mailConnection.execute(
              `SELECT id, username, email, user_id FROM ${mailUsersTable} WHERE user_id = ?`,
              [userId]
            );
            
            if (mailUserRows.length === 0) {
              console.error(`❌ No mail accounts found for user ${userId} in table ${mailUsersTable}`);
              
              // Let's do a broader search and see if the user exists at all
              const [allUsers] = await mailConnection.execute(
                `SELECT id, username, email, user_id FROM ${mailUsersTable} LIMIT 5`
              );
              
              console.log(`Found ${allUsers.length} accounts in the ${mailUsersTable} table (showing up to 5):`);
              allUsers.forEach(user => {
                console.log(`   ID: ${user.id}, Email: ${user.email}, User ID: ${user.user_id}`);
              });
              
              // Let's check if the user ID might be in a different format
              const [userIdSearch] = await mailConnection.execute(
                `SELECT id, username, email, user_id FROM ${mailUsersTable} WHERE user_id LIKE ?`,
                [`%${userId.substring(0, 8)}%`]
              );
              
              if (userIdSearch.length > 0) {
                console.log('✅ Found accounts with similar user_id:');
                userIdSearch.forEach(user => {
                  console.log(`   ID: ${user.id}, Email: ${user.email}, User ID: ${user.user_id}`);
                });
              }
              
              // Try a direct search by email (assuming we have user's email from main DB)
              if (mainPool) {
                const [userInfo] = await mainPool.execute('SELECT email FROM users WHERE id = ?', [userId]);
                if (userInfo.length > 0) {
                  const userEmail = userInfo[0].email;
                  const [emailSearch] = await mailConnection.execute(
                    `SELECT id, username, email, user_id FROM ${mailUsersTable} WHERE email = ?`,
                    [userEmail]
                  );
                  
                  if (emailSearch.length > 0) {
                    console.log(`✅ Found accounts with matching email (${userEmail}):`);
                    emailSearch.forEach(user => {
                      console.log(`   ID: ${user.id}, Email: ${user.email}, User ID: ${user.user_id}`);
                    });
                  }
                }
              }
            } else {
              console.log(`✅ Found ${mailUserRows.length} mail account(s):`);
              mailUserRows.forEach(account => {
                console.log(`   ID: ${account.id}, Email: ${account.email}, Username: ${account.username}`);
              });
            }
          } catch (queryError) {
            console.error(`❌ Query error: ${queryError.message}`);
            
            // Get the table structure
            try {
              const [columns] = await mailConnection.execute(`DESCRIBE ${mailUsersTable}`);
              console.log(`Columns in ${mailUsersTable} table:`);
              columns.forEach(col => console.log(`   - ${col.Field} (${col.Type})`));
              
              // Check if user_id column exists
              const userIdColumn = columns.find(col => col.Field === 'user_id');
              if (!userIdColumn) {
                console.error(`❌ Column 'user_id' does not exist in ${mailUsersTable} table!`);
              }
            } catch (describeError) {
              console.error(`❌ Error describing table: ${describeError.message}`);
            }
          }
        }
      } catch (tablesError) {
        console.error(`❌ Error listing tables: ${tablesError.message}`);
      }
      
      // Close the connection
      await mailConnection.end();
    } catch (connError) {
      console.error(`❌ Mail database connection error: ${connError.message}`);
      
      // Try a raw connection to the DB host to check if it's reachable
      try {
        const rawConnection = await mysql.createConnection({
          host: mailDbHost,
          user: mailDbUser,
          password: mailDbPassword,
        });
        
        console.log('✅ Raw connection to mail database host successful');
        
        // Check available databases
        const [databases] = await rawConnection.execute('SHOW DATABASES');
        console.log('Available databases on mail database host:');
        databases.forEach(db => console.log(`   - ${Object.values(db)[0]}`));
        
        // Check if our expected database exists
        const dbExists = databases.some(db => Object.values(db)[0] === mailDbName);
        if (!dbExists) {
          console.error(`❌ Database '${mailDbName}' does not exist on the mail database host!`);
        }
        
        await rawConnection.end();
      } catch (rawConnError) {
        console.error(`❌ Raw mail database host connection error: ${rawConnError.message}`);
      }
    }
  }

  // 3. Try with the mail database connection configured using the main DATABASE_URL
  if (!useMainDbForMail && process.env.DATABASE_URL) {
    console.log('\n===== ALTERNATIVE CONNECTION METHOD =====');
    console.log('Trying to connect to mail database using DATABASE_URL credentials but mail database name');
    
    try {
      const dbUrl = process.env.DATABASE_URL;
      const withoutProtocol = dbUrl.replace(/^mysql2?:\/\//, '');
      const [userPart, hostPart] = withoutProtocol.split('@');
      const [username, password] = userPart.split(':');
      const [host, dbPart] = hostPart.split('/');
      const [hostname, port] = host.split(':');
      const parsedPort = port ? parseInt(port, 10) : 3306;
      
      // Use the database name from the URL or the mail DB name
      let database = mailDbName || (dbPart && dbPart.includes('?') ? dbPart.split('?')[0] : dbPart);
      
      console.log(`Connecting to: ${hostname}:${parsedPort}/${database} with user ${username}`);
      
      const altConnection = await mysql.createConnection({
        host: hostname,
        port: parsedPort,
        user: username,
        password: password,
        database: database
      });
      
      console.log('✅ Alternative connection successful');
      
      // Check if the virtual_users table exists in this database
      try {
        const [tables] = await altConnection.execute('SHOW TABLES');
        console.log('Available tables in this database:');
        tables.forEach(table => console.log(`   - ${Object.values(table)[0]}`));
        
        const tableExists = tables.some(table => Object.values(table)[0] === mailUsersTable);
        if (!tableExists) {
          console.error(`❌ Table ${mailUsersTable} does not exist in this database!`);
        } else {
          console.log(`✅ Found table ${mailUsersTable}`);
          
          // Try the query with this connection
          const [mailUserRows] = await altConnection.execute(
            `SELECT id, username, email, user_id FROM ${mailUsersTable} WHERE user_id = ?`,
            [userId]
          );
          
          if (mailUserRows.length === 0) {
            console.error(`❌ No mail accounts found for user ${userId} using alternative connection`);
          } else {
            console.log(`✅ Found ${mailUserRows.length} mail account(s) using alternative connection:`);
            mailUserRows.forEach(account => {
              console.log(`   ID: ${account.id}, Email: ${account.email}, Username: ${account.username}`);
            });
          }
        }
      } catch (tablesError) {
        console.error(`❌ Error listing tables: ${tablesError.message}`);
      }
      
      await altConnection.end();
    } catch (altError) {
      console.error(`❌ Alternative connection error: ${altError.message}`);
    }
  }

  // 4. Direct raw query to verify the data exists (using connection string from both sources)
  console.log('\n===== DIRECT VERIFICATION QUERY =====');
  
  try {
    console.log('Attempting direct query to verify mail account data exists...');
    
    // Get a connection using main database credentials (most likely to work)
    if (process.env.DATABASE_URL) {
      const dbUrl = process.env.DATABASE_URL;
      const withoutProtocol = dbUrl.replace(/^mysql2?:\/\//, '');
      const [userPart, hostPart] = withoutProtocol.split('@');
      const [username, password] = userPart.split(':');
      const [host, dbPart] = hostPart.split('/');
      const [hostname, port] = host.split(':');
      const parsedPort = port ? parseInt(port, 10) : 3306;
      
      // Try with main database 
      console.log('Trying with main database first...');
      let database = dbPart && dbPart.includes('?') ? dbPart.split('?')[0] : dbPart;
      
      try {
        const mainConn = await mysql.createConnection({
          host: hostname,
          port: parsedPort,
          user: username,
          password: password,
          database: database
        });

        // Try a direct query
        const query = `
          SELECT EXISTS (
            SELECT 1 FROM information_schema.tables 
            WHERE table_schema = DATABASE() 
            AND table_name = ?
          ) as table_exists
        `;
        
        const [tableCheck] = await mainConn.execute(query, [mailUsersTable]);
        
        if (tableCheck[0].table_exists) {
          console.log(`✅ Table ${mailUsersTable} exists in main database`);
          
          // Try to query by user ID
          const [directResults] = await mainConn.execute(
            `SELECT * FROM ${mailUsersTable} WHERE user_id = ?`,
            [userId]
          );
          
          if (directResults.length > 0) {
            console.log(`✅ Direct query found ${directResults.length} results in main database!`);
            console.log('First result:');
            console.log(directResults[0]);
          } else {
            console.log(`❌ Direct query found no results in main database`);
          }
        } else {
          console.log(`❌ Table ${mailUsersTable} does not exist in main database`);
        }
        
        await mainConn.end();
      } catch (mainQueryError) {
        console.error(`❌ Error with main database query: ${mainQueryError.message}`);
      }
      
      // Try with mail database if it's different
      if (!useMainDbForMail && mailDbName) {
        console.log('\nTrying with mail database name...');
        try {
          const mailConn = await mysql.createConnection({
            host: mailDbHost || hostname,
            port: parsedPort,
            user: mailDbUser || username,
            password: mailDbPassword || password,
            database: mailDbName
          });
          
          // Check if the table exists
          const [tables] = await mailConn.execute('SHOW TABLES');
          const tableExists = tables.some(table => Object.values(table)[0] === mailUsersTable);
          
          if (tableExists) {
            console.log(`✅ Table ${mailUsersTable} exists in mail database`);
            
            // Try to query by user ID
            const [directResults] = await mailConn.execute(
              `SELECT * FROM ${mailUsersTable} WHERE user_id = ?`,
              [userId]
            );
            
            if (directResults.length > 0) {
              console.log(`✅ Direct query found ${directResults.length} results in mail database!`);
              console.log('First result:');
              console.log(directResults[0]);
            } else {
              console.log(`❌ Direct query found no results in mail database`);
            }
          } else {
            console.log(`❌ Table ${mailUsersTable} does not exist in mail database`);
          }
          
          await mailConn.end();
        } catch (mailQueryError) {
          console.error(`❌ Error with mail database query: ${mailQueryError.message}`);
        }
      }
    }
  } catch (error) {
    console.error(`❌ Error with direct verification: ${error.message}`);
  }

  // Clean up
  if (mainPool) {
    try {
      await mainPool.end();
    } catch (err) {
      // Ignore cleanup errors
    }
  }

  console.log('\n====== DEBUGGING COMPLETE ======');
  console.log('Overall diagnosis:');
  console.log('1. Main database connection appears to be ' + (mainPool ? 'working' : 'not working'));
  console.log('2. Check that MAIL_DB_HOST, MAIL_DB_USER, MAIL_DB_PASSWORD, and MAIL_DB_NAME are set correctly');
  console.log('3. Verify that USE_MAIN_DB_FOR_MAIL is set correctly for your setup');
  console.log('4. Ensure the virtual_users table exists and has a user_id column');
  console.log('5. Check that the user_id in virtual_users exactly matches the UUID format in the users table');
}

// Helper function to extract database user from DATABASE_URL
function getDbUserFromDatabaseUrl() {
  if (!process.env.DATABASE_URL) return null;
  try {
    const withoutProtocol = process.env.DATABASE_URL.replace(/^mysql2?:\/\//, '');
    const [userPart] = withoutProtocol.split('@');
    const [username] = userPart.split(':');
    return username;
  } catch (error) {
    return null;
  }
}

// Helper function to extract database password from DATABASE_URL
function getDbPasswordFromDatabaseUrl() {
  if (!process.env.DATABASE_URL) return null;
  try {
    const withoutProtocol = process.env.DATABASE_URL.replace(/^mysql2?:\/\//, '');
    const [userPart] = withoutProtocol.split('@');
    const [, password] = userPart.split(':');
    return password;
  } catch (error) {
    return null;
  }
}

// Run the main function
main().catch(err => {
  console.error('Fatal error:', err);
  process.exit(1);
});