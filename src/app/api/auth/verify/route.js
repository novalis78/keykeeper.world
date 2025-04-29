import { NextResponse } from 'next/server';
import { verifyToken, getTokenFromHeader } from '../../../../lib/auth/jwt';

// Fix for static export by setting dynamic mode
export const dynamic = 'force-dynamic';

/**
 * Verify a JWT token is valid
 */
export async function GET(request) {
  try {
    // Extract token from Authorization header
    const token = getTokenFromHeader(request);
    
    if (!token) {
      return NextResponse.json(
        { error: 'Authorization token is required' },
        { status: 401 }
      );
    }
    
    // Verify the token
    const payload = await verifyToken(token);
    
    // Return the decoded payload (without sensitive info)
    return NextResponse.json({
      authenticated: true,
      user: {
        email: payload.email,
        keyId: payload.keyId,
        // Other non-sensitive user data
      },
    });
    
  } catch (error) {
    console.error('Token verification error:', error);
    
    return NextResponse.json(
      { 
        authenticated: false,
        error: 'Invalid or expired token'
      },
      { status: 401 }
    );
  }
}
