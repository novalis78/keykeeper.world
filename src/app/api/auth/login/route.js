import { NextResponse } from 'next/server';
import { createToken } from '../../../../lib/auth/jwt';
import { verifySignature } from '../../../../lib/auth/pgp';

// Fix for static export by setting dynamic mode
export const dynamic = 'force-dynamic';

/**
 * Authenticate using PGP signature verification
 * 
 * The client should:
 * 1. Generate a random challenge or use a timestamp
 * 2. Sign it with their private key
 * 3. Send the original challenge, signature, and their public key
 */
export async function POST(request) {
  try {
    // Parse request body
    const { challenge, signature, publicKey, email } = await request.json();
    
    // Validate required fields
    if (!challenge || !signature || !publicKey || !email) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }
    
    // Verify the PGP signature against the public key
    const isValid = await verifySignature(challenge, signature, publicKey);
    
    if (!isValid) {
      return NextResponse.json(
        { error: 'Invalid signature' },
        { status: 401 }
      );
    }
    
    // In a real app, we would verify that this public key belongs to
    // a registered user in our database
    
    // Generate JWT token
    const token = await createToken({
      email,
      // Store a fingerprint or hash of the public key for reference
      keyId: 'mock-key-fingerprint', // In a real app, we'd compute this
    });
    
    // Return the token
    return NextResponse.json({
      token,
      user: {
        email,
        // Return additional user info from database
      },
    });
    
  } catch (error) {
    console.error('Login error:', error);
    
    return NextResponse.json(
      { error: 'Authentication failed' },
      { status: 500 }
    );
  }
}
