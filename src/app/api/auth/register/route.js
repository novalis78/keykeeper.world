import { NextResponse } from 'next/server';
import db from '@/lib/db';
import validation from '@/lib/utils/validation';

/**
 * User registration API endpoint
 * 
 * This endpoint receives a new user's information and PGP public key,
 * validates the information, and creates a new user account in the database.
 */
export async function POST(request) {
  try {
    // Parse request body
    const body = await request.json();
    
    // Extract required fields
    const { email, name, publicKey, keyId, fingerprint, authMethod } = body;
    
    // Validate required fields
    if (!email || !publicKey || !keyId || !fingerprint || !authMethod) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }
    
    // Validate email format
    if (!validation.isValidEmail(email)) {
      return NextResponse.json(
        { error: 'Invalid email address format' },
        { status: 400 }
      );
    }
    
    // Validate public key format
    if (!validation.isValidPublicKey(publicKey)) {
      return NextResponse.json(
        { error: 'Invalid PGP public key format' },
        { status: 400 }
      );
    }
    
    // Validate key ID format
    if (!validation.isValidKeyId(keyId)) {
      return NextResponse.json(
        { error: 'Invalid PGP key ID format' },
        { status: 400 }
      );
    }
    
    // Validate fingerprint format
    if (!validation.isValidFingerprint(fingerprint)) {
      return NextResponse.json(
        { error: 'Invalid PGP fingerprint format' },
        { status: 400 }
      );
    }
    
    // Sanitize authentication method
    const sanitizedAuthMethod = validation.sanitizeAuthMethod(authMethod);
    if (!sanitizedAuthMethod) {
      return NextResponse.json(
        { error: 'Invalid authentication method' },
        { status: 400 }
      );
    }
    
    // Check if user already exists
    const existingUser = await db.users.findByEmail(email);
    if (existingUser) {
      return NextResponse.json(
        { error: 'User with this email already exists' },
        { status: 409 }
      );
    }
    
    // Check if fingerprint is already in use
    const existingFingerprint = await db.users.findByFingerprint(fingerprint);
    if (existingFingerprint) {
      return NextResponse.json(
        { error: 'PGP key fingerprint already registered to another account' },
        { status: 409 }
      );
    }
    
    // Create new user
    const userId = await db.users.create({
      email,
      name: name || null,
      publicKey,
      keyId,
      fingerprint,
      authMethod: sanitizedAuthMethod,
      // Default to 'pending' until email verification
      status: 'pending'
    });
    
    // Log user registration
    await db.activityLogs.create(userId, 'user_registration', {
      ipAddress: request.headers.get('x-forwarded-for') || request.ip,
      details: {
        email,
        keyId,
        authMethod: sanitizedAuthMethod
      }
    });
    
    // Return success response
    return NextResponse.json(
      { 
        success: true, 
        message: 'User registered successfully',
        userId,
        status: 'pending'
      },
      { status: 201 }
    );
    
  } catch (error) {
    console.error('Registration error:', error);
    
    return NextResponse.json(
      { error: 'Server error during registration' },
      { status: 500 }
    );
  }
}