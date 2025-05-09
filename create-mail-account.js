// create-mail-account.js
// This script creates a mail account for an existing user
// Usage: node create-mail-account.js <user_id> <email> <password>

const accountManager = require('./src/lib/mail/accountManager').default;
const mysql = require('mysql2/promise');
const crypto = require('crypto');

// Function to get database connection
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

// Main function
async function createMailAccount() {
  const args = process.argv.slice(2);
  
  if (args.length < 1) {
    console.error('Usage: node create-mail-account.js <user_id> [email] [password]');
    process.exit(1);
  }
  
  const userId = args[0];
  let email, password;
  
  console.log(`Creating mail account for user ID: ${userId}`);
  
  try {
    // Connect to database
    const connection = await getDbConnection();
    console.log('Connected to database');
    
    // Get user information
    const [userRows] = await connection.execute(
      'SELECT id, email, public_key, name FROM users WHERE id = ?',
      [userId]
    );
    
    if (userRows.length === 0) {
      console.error(`User with ID ${userId} not found`);
      process.exit(1);
    }
    
    const user = userRows[0];
    console.log(`Found user: ${user.email}`);
    
    // Use provided email or default to user's email
    email = args[1] || user.email;
    
    // Use provided password or generate one
    if (args[2]) {
      password = args[2];
      console.log('Using provided password');
    } else {
      // Generate a secure password
      const passwordBase = crypto.createHash('sha256')
        .update(user.id + new Date().toISOString())
        .digest('hex');
      const randomBits = crypto.randomBytes(8).toString('hex');
      password = passwordBase.substring(0, 24) + randomBits;
      console.log(`Generated password for mail account`);
    }
    
    // Check if mail account already exists
    console.log(`Checking if mail account already exists for: ${email}`);
    const exists = await accountManager.checkMailAccount(email);
    
    if (exists) {
      console.log(`Mail account for ${email} already exists`);
      
      // Check if it's linked to the user
      const connection = await accountManager.getMailDbConnection();
      const tableName = process.env.MAIL_USERS_TABLE || 'virtual_users';
      
      const [mailUserRows] = await connection.execute(
        `SELECT * FROM ${tableName} WHERE email = ?`,
        [email]
      );
      
      if (mailUserRows.length > 0) {
        const mailUser = mailUserRows[0];
        
        // Update the user_id if it's not already set
        if (!mailUser.user_id) {
          console.log(`Updating mail account to link with user ID: ${userId}`);
          await connection.execute(
            `UPDATE ${tableName} SET user_id = ? WHERE email = ?`,
            [userId, email]
          );
          console.log('Mail account linked to user successfully');
        } else if (mailUser.user_id !== userId) {
          console.log(`WARNING: Mail account is linked to a different user ID: ${mailUser.user_id}`);
        } else {
          console.log('Mail account is already correctly linked to this user');
        }
      }
      
      await connection.end();
    } else {
      // Create mail account
      console.log(`Creating new mail account for: ${email}`);
      const result = await accountManager.createMailAccount(
        email,
        password,
        user.name || email.split('@')[0],
        parseInt(process.env.DEFAULT_MAIL_QUOTA || '1024'),
        userId // Link to user
      );
      
      console.log('Mail account created successfully');
      console.log(result);
      
      // Store the mail password in the user record
      await connection.execute(
        'UPDATE users SET mail_password = ? WHERE id = ?',
        [password, userId]
      );
      console.log('Mail password stored in user record');
    }
    
    await connection.end();
    console.log('Done');
    
  } catch (error) {
    console.error('Error creating mail account:', error);
    process.exit(1);
  }
}

// Run the script
createMailAccount();