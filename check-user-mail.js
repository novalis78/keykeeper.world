// check-user-mail.js
// This script checks if a user has a mail account
// Usage: node check-user-mail.js <user_id or email>

const mysql = require('mysql2/promise');

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

// Main function
async function checkUserMail() {
  const args = process.argv.slice(2);
  
  if (args.length < 1) {
    console.error('Usage: node check-user-mail.js <user_id or email>');
    process.exit(1);
  }
  
  const userIdOrEmail = args[0];
  const isEmail = userIdOrEmail.includes('@');
  
  console.log(`Checking mail account for ${isEmail ? 'email' : 'user ID'}: ${userIdOrEmail}`);
  
  try {
    // Connect to database
    const connection = await getDbConnection();
    console.log('Connected to database');
    
    // Get user information
    let user;
    if (isEmail) {
      const [userRows] = await connection.execute(
        'SELECT id, email, name, mail_password FROM users WHERE email = ?',
        [userIdOrEmail]
      );
      
      if (userRows.length === 0) {
        console.error(`User with email ${userIdOrEmail} not found`);
        process.exit(1);
      }
      
      user = userRows[0];
    } else {
      const [userRows] = await connection.execute(
        'SELECT id, email, name, mail_password FROM users WHERE id = ?',
        [userIdOrEmail]
      );
      
      if (userRows.length === 0) {
        console.error(`User with ID ${userIdOrEmail} not found`);
        process.exit(1);
      }
      
      user = userRows[0];
    }
    
    console.log(`Found user: ${user.email} (ID: ${user.id})`);
    console.log(`Mail password stored in user record: ${user.mail_password ? 'Yes' : 'No'}`);
    
    // Check if mail account exists in virtual_users table
    const mailConnection = await getMailDbConnection();
    const tableName = process.env.MAIL_USERS_TABLE || 'virtual_users';
    
    // Check by user_id
    const [mailUserIdRows] = await mailConnection.execute(
      `SELECT * FROM ${tableName} WHERE user_id = ?`,
      [user.id]
    );
    
    console.log(`Mail accounts linked by user_id: ${mailUserIdRows.length}`);
    
    if (mailUserIdRows.length > 0) {
      mailUserIdRows.forEach((mailAccount, index) => {
        console.log(`Mail account #${index + 1}:`);
        console.log(`  Email: ${mailAccount.email}`);
        console.log(`  Username: ${mailAccount.username}`);
        console.log(`  Password hash: ${mailAccount.password ? mailAccount.password.substring(0, 20) + '...' : 'None'}`);
      });
    }
    
    // Check by email
    const [mailEmailRows] = await mailConnection.execute(
      `SELECT * FROM ${tableName} WHERE email = ?`,
      [user.email]
    );
    
    console.log(`Mail accounts matched by email: ${mailEmailRows.length}`);
    
    if (mailEmailRows.length > 0) {
      mailEmailRows.forEach((mailAccount, index) => {
        console.log(`Mail account #${index + 1}:`);
        console.log(`  Email: ${mailAccount.email}`);
        console.log(`  Username: ${mailAccount.username}`);
        console.log(`  Linked user_id: ${mailAccount.user_id || 'None'}`);
        console.log(`  Password hash: ${mailAccount.password ? mailAccount.password.substring(0, 20) + '...' : 'None'}`);
      });
      
      // Check if the account is linked to the correct user
      if (mailEmailRows[0].user_id && mailEmailRows[0].user_id !== user.id) {
        console.log(`WARNING: Mail account is linked to a different user ID: ${mailEmailRows[0].user_id}`);
      } else if (!mailEmailRows[0].user_id) {
        console.log('WARNING: Mail account is not linked to any user - missing user_id');
      }
    }
    
    // Provide a summary
    if (mailUserIdRows.length === 0 && mailEmailRows.length === 0) {
      console.log('RESULT: User does not have a mail account in the virtual_users table');
      console.log('Run create-mail-account.js to create one');
    } else if (mailUserIdRows.length > 0) {
      console.log('RESULT: User has properly linked mail account(s)');
    } else if (mailEmailRows.length > 0 && !mailEmailRows[0].user_id) {
      console.log('RESULT: User has a mail account by email match, but it is not properly linked (missing user_id)');
      console.log('Run create-mail-account.js to link the existing account to the user');
    } else if (mailEmailRows.length > 0 && mailEmailRows[0].user_id !== user.id) {
      console.log('RESULT: User\'s email is used in a mail account that is linked to a different user');
      console.log('This is unusual - you may need to manually fix this in the database');
    }
    
    await connection.end();
    await mailConnection.end();
    
  } catch (error) {
    console.error('Error checking mail account:', error);
    process.exit(1);
  }
}

// Run the script
checkUserMail();