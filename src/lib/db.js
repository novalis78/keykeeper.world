import mysql from 'mysql2/promise';

// Parse the connection string - needed to fix possible uri vs url param confusion
function parseConnectionString(connectionString) {
  try {
    // Handle both mysql:// and mysql2:// protocols
    let url = connectionString;
    if (!url.startsWith('mysql://') && !url.startsWith('mysql2://')) {
      throw new Error('Invalid connection string protocol. Must begin with mysql:// or mysql2://');
    }

    // Extract components - very simplified parsing
    const withoutProtocol = url.replace(/^mysql2?:\/\//, '');
    const [userPart, hostPart] = withoutProtocol.split('@');
    if (!userPart || !hostPart) throw new Error('Invalid connection string format');
    
    const [username, password] = userPart.split(':');
    const [host, dbPart] = hostPart.split('/');
    const [hostname, port] = host.split(':');
    
    // Split port if present, otherwise use default MySQL port
    const parsedPort = port ? parseInt(port, 10) : 3306;
    
    // Parse database name and any query parameters
    let database = dbPart;
    let query = '';
    if (dbPart && dbPart.includes('?')) {
      [database, query] = dbPart.split('?');
    }
    
    return {
      host: hostname,
      port: parsedPort,
      user: username,
      password: password,
      database: database,
      uri: connectionString // Keep the original string too
    };
  } catch (error) {
    console.error('Error parsing connection string:', error.message);
    throw error;
  }
}

// Connection pool configuration
let pool;

try {
  // Create connection pool only if DATABASE_URL is provided
  if (process.env.DATABASE_URL) {
    // Parse the connection string for better error handling
    const config = parseConnectionString(process.env.DATABASE_URL);
    
    pool = mysql.createPool({
      host: config.host,
      port: config.port,
      user: config.user,
      password: config.password,
      database: config.database,
      waitForConnections: true,
      connectionLimit: 10,
      queueLimit: 0,
      connectTimeout: 10000 // 10 seconds timeout
    });
    
    console.log(`MySQL connection pool created for ${config.host}:${config.port}/${config.database}`);
  } else {
    console.warn('DATABASE_URL environment variable not set');
  }
} catch (error) {
  console.error('Error creating MySQL connection pool:', error.message);
}

/**
 * Execute a database query
 * @param {string} sql - SQL query to execute
 * @param {Array} params - Query parameters
 * @returns {Promise<Array>} - Query results
 */
export async function query(sql, params) {
  // Check if pool exists
  if (!pool) {
    throw new Error('Database connection not available. Make sure DATABASE_URL is properly configured.');
  }
  
  try {
    const [results] = await pool.execute(sql, params);
    return results;
  } catch (error) {
    console.error('Database error:', error);
    throw error;
  }
}

/**
 * Generate a UUID v4 for use as database IDs
 * @returns {string} - Generated UUID
 */
export function generateUuid() {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
    const r = Math.random() * 16 | 0, v = c === 'x' ? r : (r & 0x3 | 0x8);
    return v.toString(16);
  });
}

/**
 * User-related database operations
 */
export const users = {
  /**
   * Create a new user
   * @param {Object} user - User data
   * @returns {Promise<string>} - New user ID
   */
  async create(user) {
    const id = generateUuid();
    
    const sql = `
      INSERT INTO users (
        id, email, name, public_key, key_id, fingerprint, auth_method, status
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `;
    
    await query(sql, [
      id,
      user.email,
      user.name || null,
      user.publicKey,
      user.keyId,
      user.fingerprint,
      user.authMethod,
      user.status || 'pending'
    ]);
    
    return id;
  },
  
  /**
   * Find a user by email
   * @param {string} email - User email
   * @returns {Promise<Object|null>} - User object or null if not found
   */
  async findByEmail(email) {
    const sql = `SELECT * FROM users WHERE email = ?`;
    const results = await query(sql, [email]);
    return results.length > 0 ? results[0] : null;
  },
  
  /**
   * Find a user by ID
   * @param {string} id - User ID
   * @returns {Promise<Object|null>} - User object or null if not found
   */
  async findById(id) {
    const sql = `SELECT * FROM users WHERE id = ?`;
    const results = await query(sql, [id]);
    return results.length > 0 ? results[0] : null;
  },
  
  /**
   * Find a user by key fingerprint
   * @param {string} fingerprint - PGP key fingerprint
   * @returns {Promise<Object|null>} - User object or null if not found
   */
  async findByFingerprint(fingerprint) {
    const sql = `SELECT * FROM users WHERE fingerprint = ?`;
    const results = await query(sql, [fingerprint]);
    return results.length > 0 ? results[0] : null;
  },
  
  /**
   * Update a user's profile
   * @param {string} id - User ID
   * @param {Object} updates - Fields to update
   * @returns {Promise<boolean>} - Success status
   */
  async update(id, updates) {
    const allowedFields = ['name', 'public_key', 'key_id', 'fingerprint', 'status', 'auth_method'];
    
    // Build update SQL dynamically based on provided fields
    const fields = Object.keys(updates)
      .filter(key => allowedFields.includes(key))
      .map(key => `${key} = ?`);
    
    if (fields.length === 0) return false;
    
    const values = Object.keys(updates)
      .filter(key => allowedFields.includes(key))
      .map(key => updates[key]);
    
    values.push(id);
    
    const sql = `UPDATE users SET ${fields.join(', ')} WHERE id = ?`;
    const result = await query(sql, values);
    
    return result.affectedRows > 0;
  },
  
  /**
   * Update mail account password for a user
   * @param {string} id - User ID
   * @param {string} password - Mail account password to store (will be encrypted)
   * @returns {Promise<boolean>} - Success status
   */
  async updateMailPassword(id, password) {
    try {
      // Import crypto module
      const crypto = await import('crypto');
      
      // Generate a random encryption key using the app secret as basis
      const secret = process.env.APP_SECRET || 'keykeeper-default-secret';
      const encKey = crypto.createHash('sha256').update(secret).digest();
      
      // Generate a random IV
      const iv = crypto.randomBytes(16);
      
      // Create cipher and encrypt the password
      const cipher = crypto.createCipheriv('aes-256-cbc', encKey, iv);
      let encrypted = cipher.update(password, 'utf8', 'hex');
      encrypted += cipher.final('hex');
      
      // Store the encrypted password with the IV
      const encryptedData = `${iv.toString('hex')}:${encrypted}`;
      
      // Update the user record with the encrypted password
      const sql = `UPDATE users SET mail_password = ? WHERE id = ?`;
      const result = await query(sql, [encryptedData, id]);
      
      return result.affectedRows > 0;
    } catch (error) {
      console.error('Error updating mail password:', error);
      throw new Error('Failed to update mail password');
    }
  },
  
  /**
   * Update last login timestamp
   * @param {string} id - User ID
   * @returns {Promise<boolean>} - Success status
   */
  async updateLastLogin(id) {
    const sql = `UPDATE users SET last_login = CURRENT_TIMESTAMP WHERE id = ?`;
    const result = await query(sql, [id]);
    return result.affectedRows > 0;
  }
};

/**
 * Authentication challenge operations
 */
export const challenges = {
  /**
   * Create a new authentication challenge
   * @param {string} userId - User ID
   * @param {string} challenge - Challenge string
   * @param {number} expiresInMinutes - Minutes until expiration
   * @returns {Promise<string>} - Challenge ID
   */
  async create(userId, challenge, expiresInMinutes = 10) {
    const id = generateUuid();
    
    const sql = `
      INSERT INTO auth_challenges (
        id, user_id, challenge, expires_at
      ) VALUES (?, ?, ?, DATE_ADD(NOW(), INTERVAL ? MINUTE))
    `;
    
    await query(sql, [id, userId, challenge, expiresInMinutes]);
    return id;
  },
  
  /**
   * Verify a challenge is valid and unused
   * @param {string} challenge - Challenge string
   * @param {string} userId - User ID
   * @returns {Promise<boolean>} - Whether challenge is valid
   */
  async verify(challenge, userId) {
    const sql = `
      SELECT id FROM auth_challenges 
      WHERE challenge = ? AND user_id = ? AND expires_at > NOW() AND used = FALSE
      LIMIT 1
    `;
    
    const results = await query(sql, [challenge, userId]);
    
    if (results.length === 0) return false;
    
    // Mark challenge as used
    await query(
      `UPDATE auth_challenges SET used = TRUE WHERE id = ?`,
      [results[0].id]
    );
    
    return true;
  },
  
  /**
   * Clean up expired challenges
   * @returns {Promise<number>} - Number of deleted challenges
   */
  async cleanupExpired() {
    const sql = `DELETE FROM auth_challenges WHERE expires_at < NOW()`;
    const result = await query(sql);
    return result.affectedRows;
  }
};

/**
 * Session management operations
 */
export const sessions = {
  /**
   * Create a new session
   * @param {string} userId - User ID
   * @param {string} token - Session token
   * @param {Object} details - Session details
   * @param {number} expiresInHours - Hours until expiration
   * @returns {Promise<string>} - Session ID
   */
  async create(userId, token, details = {}, expiresInHours = 24) {
    const id = generateUuid();
    
    const sql = `
      INSERT INTO sessions (
        id, user_id, token, ip_address, user_agent, expires_at
      ) VALUES (?, ?, ?, ?, ?, DATE_ADD(NOW(), INTERVAL ? HOUR))
    `;
    
    await query(sql, [
      id,
      userId,
      token,
      details.ipAddress || null,
      details.userAgent || null,
      expiresInHours
    ]);
    
    return id;
  },
  
  /**
   * Find session by token
   * @param {string} token - Session token
   * @returns {Promise<Object|null>} - Session object or null if not found
   */
  async findByToken(token) {
    const sql = `
      SELECT s.*, u.email, u.name, u.status, u.key_id, u.fingerprint
      FROM sessions s
      JOIN users u ON s.user_id = u.id
      WHERE s.token = ? AND s.expires_at > NOW()
    `;
    
    const results = await query(sql, [token]);
    
    if (results.length > 0) {
      // Update last active time
      await query(
        `UPDATE sessions SET last_active = CURRENT_TIMESTAMP WHERE id = ?`,
        [results[0].id]
      );
      return results[0];
    }
    
    return null;
  },
  
  /**
   * Delete a session
   * @param {string} token - Session token
   * @returns {Promise<boolean>} - Success status
   */
  async delete(token) {
    const sql = `DELETE FROM sessions WHERE token = ?`;
    const result = await query(sql, [token]);
    return result.affectedRows > 0;
  },
  
  /**
   * Delete all sessions for a user
   * @param {string} userId - User ID
   * @returns {Promise<number>} - Number of deleted sessions
   */
  async deleteAllForUser(userId) {
    const sql = `DELETE FROM sessions WHERE user_id = ?`;
    const result = await query(sql, [userId]);
    return result.affectedRows;
  },
  
  /**
   * Clean up expired sessions
   * @returns {Promise<number>} - Number of deleted sessions
   */
  async cleanupExpired() {
    const sql = `DELETE FROM sessions WHERE expires_at < NOW()`;
    const result = await query(sql);
    return result.affectedRows;
  }
};

/**
 * Activity logging operations
 */
export const activityLogs = {
  /**
   * Log user activity
   * @param {string} userId - User ID
   * @param {string} activityType - Type of activity
   * @param {Object} details - Activity details
   * @returns {Promise<string>} - Log entry ID
   */
  async create(userId, activityType, details = {}) {
    const id = generateUuid();
    
    const sql = `
      INSERT INTO activity_logs (
        id, user_id, activity_type, ip_address, details
      ) VALUES (?, ?, ?, ?, ?)
    `;
    
    await query(sql, [
      id,
      userId,
      activityType,
      details.ipAddress || null,
      details.details ? JSON.stringify(details.details) : null
    ]);
    
    return id;
  },
  
  /**
   * Get recent activity for a user
   * @param {string} userId - User ID
   * @param {number} limit - Maximum number of records to return
   * @returns {Promise<Array>} - Activity records
   */
  async getForUser(userId, limit = 50) {
    const sql = `
      SELECT * FROM activity_logs
      WHERE user_id = ?
      ORDER BY created_at DESC
      LIMIT ?
    `;
    
    return await query(sql, [userId, limit]);
  }
};

/**
 * Get connection to the mail database (for virtual_users table)
 * @returns {Promise<Object>} MySQL connection
 */
export async function getMailDbConnection() {
  // IMPORTANT: First check if USE_MAIN_DB_FOR_MAIL is true
  // This takes precedence over MAIL_DB_HOST setting
  if (process.env.USE_MAIN_DB_FOR_MAIL === 'true' && pool) {
    console.log('Using main database connection for mail (USE_MAIN_DB_FOR_MAIL=true)');
    return pool;
  }
  
  // If we're using the main database for mail as well (legacy check)
  if (!process.env.MAIL_DB_HOST && pool) {
    console.log('Using main database connection for mail (MAIL_DB_HOST not set)');
    return pool;
  }
  
  // Otherwise, create a new connection to the mail database
  try {
    console.log(`Creating new mail database connection to ${process.env.MAIL_DB_HOST || 'localhost'}`);
    const dbConfig = {
      host: process.env.MAIL_DB_HOST || 'localhost',
      user: process.env.MAIL_DB_USER || process.env.DATABASE_USER,
      password: process.env.MAIL_DB_PASSWORD || process.env.DATABASE_PASSWORD,
      database: process.env.MAIL_DB_NAME || 'vmail'
    };
    
    return await mysql.createConnection(dbConfig);
  } catch (error) {
    console.error('Error connecting to mail database:', error);
    return null;
  }
}

// Export the database library with a version marker
// that can be used to verify which version of the code is running
const dbInterface = {
  query,
  generateUuid,
  users,
  challenges,
  sessions,
  activityLogs,
  getMailDbConnection,
  isConnected: () => !!pool,
  test: {
    version: '2.0.2',
    initialized: new Date().toISOString(),
    poolCreated: !!pool
  }
};

// Log database connection status on startup
console.log(`Database module loaded - connection status: ${dbInterface.isConnected() ? 'CONNECTED' : 'NOT CONNECTED'}`);
console.log(`Database version: ${dbInterface.test.version}, initialized at: ${dbInterface.test.initialized}`);

export default dbInterface;