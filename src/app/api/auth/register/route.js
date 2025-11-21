import { NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import db from '@/lib/db';
import validation from '@/lib/utils/validation';
import accountManager from '@/lib/mail/accountManager';
import { generateEmailEncryptionKeys, deriveMailPasswordFromHash } from '@/lib/auth/serverPgp';
import crypto from 'crypto';

export const dynamic = 'force-dynamic';

/**
 * Simplified user registration with email/password
 * Generates PGP keys server-side for email encryption
 */
export async function POST(request) {
  console.log('[Register API] Simplified registration request received');
  
  try {
    const body = await request.json();
    const { email, password, name } = body;
    
    // Validate required fields
    if (!email || !password) {
      return NextResponse.json(
        { error: 'Email and password are required' },
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
    
    // Validate password strength
    if (password.length < 8) {
      return NextResponse.json(
        { error: 'Password must be at least 8 characters long' },
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
    
    // Hash password
    const passwordHash = await bcrypt.hash(password, 12);
    
    // Generate user ID
    const userId = crypto.randomUUID();
    
    // Generate PGP keys for email encryption
    let pgpKeys;
    try {
      pgpKeys = await generateEmailEncryptionKeys(email, name);
      console.log(`Generated PGP keys for ${email}`);
    } catch (pgpError) {
      console.error('Failed to generate PGP keys:', pgpError);
      // Continue without PGP for now - can be added later
    }
    
    // Create user account with password auth
    await db.users.createSimple({
      id: userId,
      email,
      name: name || null,
      passwordHash,
      accountType: 'human',
      status: 'active'
    });
    
    // If PGP keys were generated, store them
    if (pgpKeys) {
      try {
        await db.users.update(userId, {
          public_key: pgpKeys.publicKey,
          key_id: pgpKeys.keyId,
          fingerprint: pgpKeys.fingerprint,
          auth_method: 'password'
        });
        console.log(`Stored PGP keys for user ${userId}`);
      } catch (updateError) {
        console.error('Failed to store PGP keys:', updateError);
        // Non-fatal - user account still exists
      }
    }
    
    // Generate mail password from password hash
    let mailPassword;
    try {
      mailPassword = await deriveMailPasswordFromHash(email, passwordHash);
      console.log(`Derived mail password for ${email}`);
    } catch (deriveError) {
      console.error('Failed to derive mail password:', deriveError);
      // Generate random password as fallback
      mailPassword = crypto.randomBytes(32).toString('hex');
    }
    
    // Create mail account
    let mailAccountCreated = false;
    try {
      await accountManager.createMailAccount(
        email,
        mailPassword,
        name || email.split('@')[0],
        parseInt(process.env.DEFAULT_MAIL_QUOTA || '1024'),
        userId
      );
      
      // Store mail password (encrypted)
      await db.users.updateMailPassword(userId, mailPassword);
      
      mailAccountCreated = true;
      console.log(`Created mail account for ${email}`);
      
      // Log mail account creation
      await db.activityLogs.create(userId, 'mail_account_creation', {
        email,
        success: true
      });
    } catch (mailError) {
      console.error('Error creating mail account:', mailError);
      // Continue anyway - user can set up mail later
      await db.activityLogs.create(userId, 'mail_account_creation', {
        email,
        success: false,
        error: mailError.message
      });
    }
    
    // Log user registration
    await db.activityLogs.create(userId, 'user_registration_simple', {
      ipAddress: request.headers.get('x-forwarded-for') || request.ip,
      details: { email, accountType: 'human', hasPgpKeys: !!pgpKeys }
    });
    
    return NextResponse.json(
      {
        success: true,
        message: 'Account created successfully',
        userId,
        email,
        mailAccountCreated,
        hasPgpKeys: !!pgpKeys
      },
      { status: 201 }
    );
  } catch (error) {
    console.error('Registration error:', error);
    return NextResponse.json(
      { error: 'Server error during registration: ' + error.message },
      { status: 500 }
    );
  }
}