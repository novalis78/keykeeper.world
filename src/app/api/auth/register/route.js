import { NextResponse } from 'next/server';
import { createToken } from '../../../../lib/auth/jwt';

/**
 * Register a new user with their PGP public key
 */
export async function POST(request) {
  try {
    // Parse request body
    const { email, publicKey, name } = await request.json();
    
    // Validate required fields
    if (!email || !publicKey) {
      return NextResponse.json(
        { error: 'Email and public key are required' },
        { status: 400 }
      );
    }
    
    // In a real app, validate email format and check if it's already registered
    if (email.indexOf('@') === -1) {
      return NextResponse.json(
        { error: 'Invalid email format' },
        { status: 400 }
      );
    }
    
    // In a real app, validate PGP key format
    if (!publicKey.includes('-----BEGIN PGP PUBLIC KEY BLOCK-----')) {
      return NextResponse.json(
        { error: 'Invalid PGP public key format' },
        { status: 400 }
      );
    }
    
    // In a real app, we would:
    // 1. Store the user details in the database
    // 2. Extract and store the key fingerprint/ID
    // 3. Set up email verification flow
    
    // Generate JWT token for immediate login
    const token = await createToken({
      email,
      // Store a fingerprint or hash of the public key for reference
      keyId: 'mock-key-fingerprint', // In a real app, we'd compute this
    });
    
    // Return success with token
    return NextResponse.json({
      message: 'Registration successful',
      token,
      user: {
        email,
        name: name || '',
        // Include other non-sensitive user info
      },
    });
    
  } catch (error) {
    console.error('Registration error:', error);
    
    return NextResponse.json(
      { error: 'Registration failed' },
      { status: 500 }
    );
  }
}
