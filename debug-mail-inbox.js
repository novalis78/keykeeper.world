// debug-mail-inbox.js
// This script diagnoses why mail inbox is not loading
// Usage: node debug-mail-inbox.js <user_id or email>

const mysql = require('mysql2/promise');
const { ImapFlow } = require('imapflow');
const { promisify } = require('util');
const exec = promisify(require('child_process').exec);

// Function to get main database connection
async function getDbConnection() {
  if (!process.env.DATABASE_URL) {
    throw new Error('DATABASE_URL environment variable is not set');
  }
  
  // Parse connection string
  let url = process.env.DATABASE_URL;
  if (!url.startsWith('mysql://') && !url.startsWith('mysql2://')) {
    throw new Error('Invalid connection string protocol. Must begin with mysql:// or mysql2://');
  }
  
  // Extract components - very simplified parsing
  const withoutProtocol = url.replace(/^mysql2?:\/\//, '');
  const [userPart, hostPart] = withoutProtocol.split('@');
  const [username, password] = userPart.split(':');
  const [host, dbPart] = hostPart.split('/');
  const [hostname, port] = host.split(':');
  
  // Split port if present, otherwise use default MySQL port
  const parsedPort = port ? parseInt(port, 10) : 3306;
  
  // Parse database name
  let database = dbPart;
  if (dbPart && dbPart.includes('?')) {
    database = dbPart.split('?')[0];
  }
  
  return await mysql.createConnection({
    host: hostname,
    port: parsedPort,
    user: username,
    password: password,
    database: database
  });
}

// Function to get mail database connection
async function getMailDbConnection() {
  if (process.env.USE_MAIN_DB_FOR_MAIL === 'true') {
    return getDbConnection();
  }
  
  const dbConfig = {
    host: process.env.MAIL_DB_HOST || 'localhost',
    user: process.env.MAIL_DB_USER || process.env.DATABASE_USER,
    password: process.env.MAIL_DB_PASSWORD || process.env.DATABASE_PASSWORD,
    database: process.env.MAIL_DB_NAME || 'vmail'
  };
  
  return await mysql.createConnection(dbConfig);
}

// Function to try getting mail password from user record
async function getMailPasswordFromUser(userId, connection) {
  console.log(`Getting mail password from user record (ID: ${userId})`);
  
  try {
    const [userRows] = await connection.execute(
      'SELECT mail_password FROM users WHERE id = ?',
      [userId]
    );
    
    if (userRows.length === 0 || !userRows[0].mail_password) {
      console.log('❌ No mail password found in user record');
      return null;
    }
    
    // Try to decrypt the mail password
    try {
      const crypto = require('crypto');
      
      // Split IV and encrypted data
      const [ivHex, encryptedHex] = userRows[0].mail_password.split(':');
      if (!ivHex || !encryptedHex) {
        console.log('❌ Invalid encrypted password format');
        return null;
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
      
      console.log('✅ Successfully decrypted mail password');
      return decrypted;
    } catch (decryptError) {
      console.log('❌ Error decrypting mail password:', decryptError.message);
      
      // For development, use fallback
      if (process.env.NODE_ENV !== 'production') {
        console.log('Using fallback password for development');
        return 'development-password';
      }
      
      return null;
    }
  } catch (error) {
    console.error('❌ Error querying user mail_password:', error.message);
    return null;
  }
}

// Function to get mail account from virtual_users
async function getMailAccount(userId, mailConnection) {
  console.log(`Getting mail account from virtual_users (user_id: ${userId})`);
  
  try {
    const tableName = process.env.MAIL_USERS_TABLE || 'virtual_users';
    
    // Try to find by user_id first
    const [rows] = await mailConnection.execute(
      `SELECT id, email, username, password FROM ${tableName} WHERE user_id = ?`,
      [userId]
    );
    
    if (rows.length === 0) {
      console.log('❌ No mail account found by user_id in virtual_users table');
      return null;
    }
    
    console.log(`✅ Mail account found by user_id: ${rows[0].email}`);
    return rows[0];
  } catch (error) {
    console.error('❌ Error querying mail account:', error.message);
    return null;
  }
}

// Test IMAP connection
async function testImapConnection(email, password) {
  console.log(`\n📬 Testing IMAP connection for ${email}`);
  console.log('Mail server settings:');
  console.log(`- Host: ${process.env.MAIL_HOST || 'localhost'}`);
  console.log(`- IMAP Port: ${process.env.MAIL_IMAP_PORT || '993'}`);
  console.log(`- IMAP Secure: ${process.env.MAIL_IMAP_SECURE !== 'false'}`);
  
  try {
    // Set up IMAP client
    const client = new ImapFlow({
      host: process.env.MAIL_HOST || 'localhost',
      port: parseInt(process.env.MAIL_IMAP_PORT || '993'),
      secure: process.env.MAIL_IMAP_SECURE !== 'false',
      auth: {
        user: email,
        pass: password
      },
      tls: {
        rejectUnauthorized: false // For testing, we'll disable certificate validation
      },
      logger: false
    });
    
    console.log('Connecting to IMAP server...');
    
    // Connect to the server with a timeout
    const connectPromise = client.connect();
    const timeoutPromise = new Promise((_, reject) => {
      setTimeout(() => reject(new Error('Connection timeout after 10 seconds')), 10000);
    });
    
    await Promise.race([connectPromise, timeoutPromise]);
    console.log('✅ Connected to IMAP server successfully');
    
    // Try to open the inbox
    console.log('Opening INBOX...');
    const mailbox = await client.mailboxOpen('INBOX');
    console.log(`✅ Mailbox opened successfully. Messages: ${mailbox.exists}`);
    
    // List a few messages if any exist
    if (mailbox.exists > 0) {
      console.log(`Fetching the last ${Math.min(5, mailbox.exists)} messages...`);
      
      const startSeq = Math.max(1, mailbox.exists - 4);
      const endSeq = mailbox.exists;
      
      let count = 0;
      for await (const message of client.fetch(`${startSeq}:${endSeq}`, {
        uid: true,
        envelope: true
      })) {
        count++;
        console.log(`Message #${count}:`);
        console.log(`  Subject: ${message.envelope.subject || '(No Subject)'}`);
        console.log(`  From: ${message.envelope.from[0]?.name || message.envelope.from[0]?.address || 'Unknown'}`);
        console.log(`  Date: ${message.envelope.date?.toISOString() || 'Unknown'}`);
      }
    } else {
      console.log('Mailbox is empty');
    }
    
    // Logout
    await client.logout();
    console.log('✅ IMAP connection test completed successfully');
    return true;
  } catch (error) {
    console.error('❌ IMAP connection error:', error.message);
    return false;
  }
}

// Check mail connection directly
async function testMailCommand() {
  console.log('\nTesting mail server connection via telnet:');
  try {
    const { stdout, stderr } = await exec(`echo "QUIT" | telnet ${process.env.MAIL_HOST || 'localhost'} ${process.env.MAIL_IMAP_PORT || '993'}`);
    console.log(stdout);
    if (stderr) console.error(stderr);
  } catch (error) {
    console.log('Could not test with telnet:', error.message);
  }
}

// Main function
async function debugMailInbox() {
  const args = process.argv.slice(2);
  
  if (args.length < 1) {
    console.error('Usage: node debug-mail-inbox.js <user_id or email>');
    process.exit(1);
  }
  
  const userIdOrEmail = args[0];
  const isEmail = userIdOrEmail.includes('@');
  let userId, userEmail;
  
  console.log(`\n🔍 Debugging mail inbox for ${isEmail ? 'email' : 'user ID'}: ${userIdOrEmail}`);
  console.log('====================================================');
  
  try {
    // Connect to database
    const connection = await getDbConnection();
    console.log('✅ Connected to main database');
    
    // Get user information
    if (isEmail) {
      const [userRows] = await connection.execute(
        'SELECT id, email, name FROM users WHERE email = ?',
        [userIdOrEmail]
      );
      
      if (userRows.length === 0) {
        console.error(`❌ User with email ${userIdOrEmail} not found`);
        process.exit(1);
      }
      
      userId = userRows[0].id;
      userEmail = userRows[0].email;
    } else {
      const [userRows] = await connection.execute(
        'SELECT id, email, name FROM users WHERE id = ?',
        [userIdOrEmail]
      );
      
      if (userRows.length === 0) {
        console.error(`❌ User with ID ${userIdOrEmail} not found`);
        process.exit(1);
      }
      
      userId = userRows[0].id;
      userEmail = userRows[0].email;
    }
    
    console.log(`✅ Found user: ${userEmail} (ID: ${userId})`);
    
    // Get mail database connection
    const mailConnection = await getMailDbConnection();
    console.log('✅ Connected to mail database');
    
    // Check for mail password in user record
    const mailPassword = await getMailPasswordFromUser(userId, connection);
    
    // Check for mail account in virtual_users
    const mailAccount = await getMailAccount(userId, mailConnection);
    
    if (!mailAccount) {
      console.log('\n❌ DIAGNOSIS: User does not have a mail account in virtual_users table');
      console.log('Run create-mail-account.js to create one');
      return;
    }
    
    console.log('\n=== Mail Account Info ===');
    console.log(`Email: ${mailAccount.email}`);
    console.log(`Username: ${mailAccount.username || '(not set)'}`);
    console.log(`Password hash type: ${mailAccount.password ? mailAccount.password.substring(0, 15) : 'None'}`);
    
    // Test connection with actual credentials
    if (mailPassword) {
      console.log('\n=== Testing with stored password ===');
      const imapSuccess = await testImapConnection(mailAccount.email, mailPassword);
      
      if (!imapSuccess) {
        // If we couldn't connect with the stored password, check environment vars for test credentials
        if (process.env.MAIL_TEST_USER && process.env.MAIL_TEST_PASSWORD) {
          console.log('\n=== Testing with environment test credentials ===');
          await testImapConnection(process.env.MAIL_TEST_USER, process.env.MAIL_TEST_PASSWORD);
        }
        
        // Try a telnet test as well
        await testMailCommand();
      }
    } else {
      console.log('❌ No mail password available for testing IMAP connection');
      
      // Try with development password if in dev mode
      if (process.env.NODE_ENV !== 'production') {
        console.log('\n=== Testing with development fallback password ===');
        await testImapConnection(mailAccount.email, 'development-password');
      }
      
      // Try with environment test credentials if available
      if (process.env.MAIL_TEST_USER && process.env.MAIL_TEST_PASSWORD) {
        console.log('\n=== Testing with environment test credentials ===');
        await testImapConnection(process.env.MAIL_TEST_USER, process.env.MAIL_TEST_PASSWORD);
      }
    }
    
    console.log('\n=== Environment Variables ===');
    console.log(`NODE_ENV: ${process.env.NODE_ENV || 'not set'}`);
    console.log(`MAIL_HOST: ${process.env.MAIL_HOST || 'not set'}`);
    console.log(`MAIL_IMAP_PORT: ${process.env.MAIL_IMAP_PORT || 'not set'}`);
    console.log(`MAIL_IMAP_SECURE: ${process.env.MAIL_IMAP_SECURE || 'not set'}`);
    console.log(`USE_MAIN_DB_FOR_MAIL: ${process.env.USE_MAIN_DB_FOR_MAIL || 'not set'}`);
    console.log(`MAIL_DB_HOST: ${process.env.MAIL_DB_HOST || 'not set'}`);
    console.log(`MAIL_DB_NAME: ${process.env.MAIL_DB_NAME || 'not set'}`);
    console.log(`MAIL_USERS_TABLE: ${process.env.MAIL_USERS_TABLE || 'not set (using default: virtual_users)'}`);
    
    // Clean up connections
    await connection.end();
    await mailConnection.end();
    
  } catch (error) {
    console.error('❌ Error during debugging:', error);
  }
}

// Run the script
debugMailInbox();