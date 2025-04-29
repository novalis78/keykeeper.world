import { SignJWT, jwtVerify } from 'jose';

// Secret key for JWT signing and verification
const JWT_SECRET = new TextEncoder().encode(
  process.env.JWT_SECRET || 'your-secret-key-minimum-32-chars-long!!'
);

// Token expiration time
const EXPIRES_IN = '24h';

/**
 * Create a new JWT token
 * @param {Object} payload - The data to include in the token
 * @returns {Promise<string>} The JWT token
 */
export async function createToken(payload) {
  const token = await new SignJWT(payload)
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime(EXPIRES_IN)
    .setIssuer('keykeeper.world')
    .sign(JWT_SECRET);
  
  return token;
}

/**
 * Verify and decode a JWT token
 * @param {string} token - The JWT token to verify
 * @returns {Promise<Object>} The decoded token payload
 */
export async function verifyToken(token) {
  try {
    const { payload } = await jwtVerify(token, JWT_SECRET, {
      issuer: 'keykeeper.world',
    });
    
    return payload;
  } catch (error) {
    throw new Error('Invalid token');
  }
}

/**
 * Extract the JWT token from Authorization header
 * @param {Object} req - Next.js request object
 * @returns {string|null} The token or null if not found
 */
export function getTokenFromHeader(req) {
  const authHeader = req.headers.get('authorization');
  
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return null;
  }
  
  return authHeader.split(' ')[1];
}
