import { NextResponse } from 'next/server';
import db from '@/lib/db';
import { verifyToken } from '@/lib/auth/jwt';

// Mark this route as dynamically rendered
export const dynamic = 'force-dynamic';

/**
 * GET handler to retrieve the user's public key
 * Requires authentication token
 */
export async function GET(request) {
  try {
    // Verify authentication token
    const authHeader = request.headers.get('authorization');
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }
    
    const token = authHeader.split(' ')[1];
    
    // Verify JWT token
    const payload = await verifyToken(token);
    
    if (!payload || !payload.userId) {
      return NextResponse.json(
        { error: 'Invalid authentication token' },
        { status: 401 }
      );
    }
    
    // Get user info from database by ID
    const user = await db.users.findById(payload.userId);
    
    if (!user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }
    
    // Return the public key
    return NextResponse.json({
      success: true,
      publicKey: user.publicKey,
      keyId: user.keyId,
      fingerprint: user.fingerprint
    });
    
  } catch (error) {
    console.error('Error retrieving public key:', error);
    
    return NextResponse.json(
      { 
        error: 'Server error', 
        details: process.env.NODE_ENV === 'development' ? error.message : undefined
      },
      { status: 500 }
    );
  }
}