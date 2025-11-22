import { NextResponse } from 'next/server';
import { query } from '@/lib/db';
import bcrypt from 'bcryptjs';
import { v4 as uuidv4 } from 'uuid';
import jwt from 'jsonwebtoken';
import crypto from 'crypto';
import accountManager from '@/lib/mail/accountManager';
import db from '@/lib/db';

export const dynamic = 'force-dynamic';

export async function POST(request) {
  try {
    const body = await request.json();
    const { email, password, name } = body;

    // Validate input
    if (!email || !password) {
      return NextResponse.json(
        { error: 'Email and password are required' },
        { status: 400 }
      );
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return NextResponse.json(
        { error: 'Invalid email format' },
        { status: 400 }
      );
    }

    // Validate password strength
    if (password.length < 8) {
      return NextResponse.json(
        { error: 'Password must be at least 8 characters' },
        { status: 400 }
      );
    }

    // Check if user already exists
    const existingUsers = await query(
      'SELECT id FROM users WHERE email = ?',
      [email]
    );

    if (existingUsers.length > 0) {
      return NextResponse.json(
        { error: 'An account with this email already exists' },
        { status: 409 }
      );
    }

    // Hash password
    const passwordHash = await bcrypt.hash(password, 10);

    // Create user
    const userId = uuidv4();
    await query(
      `INSERT INTO users (
        id, email, name, password_hash,
        account_type, auth_method, created_at
      ) VALUES (?, ?, ?, ?, 'human', 'password', NOW())`,
      [userId, email, name || null, passwordHash]
    );

    // Auto-provision mail account for the user
    // Generate a secure mail password
    const mailPassword = crypto.randomBytes(32).toString('hex');

    try {
      // Create the mail account in virtual_users table
      await accountManager.createMailAccount(
        email,
        mailPassword,
        name || email.split('@')[0],
        parseInt(process.env.DEFAULT_MAIL_QUOTA || '1024'),
        userId
      );

      // Store mail password (encrypted)
      await db.users.updateMailPassword(userId, mailPassword);

      // Log mail account creation
      await db.activityLogs.create(userId, 'mail_account_creation', {
        email,
        success: true
      });

      console.log(`Mail account created successfully for: ${email}`);
    } catch (mailError) {
      console.error('Error creating mail account:', mailError);
      // Continue anyway - user can set up mail later
      await db.activityLogs.create(userId, 'mail_account_creation', {
        email,
        success: false,
        error: mailError.message
      });
    }

    // Generate JWT token
    const token = jwt.sign(
      {
        userId,
        email,
        accountType: 'human'
      },
      process.env.JWT_SECRET || 'your-secret-key-change-this',
      { expiresIn: '7d' }
    );

    console.log('User registered successfully:', email);

    return NextResponse.json(
      {
        success: true,
        token,
        user: {
          id: userId,
          email,
          name: name || null,
          accountType: 'human'
        }
      },
      { status: 201 }
    );
  } catch (error) {
    console.error('Registration error:', error);
    return NextResponse.json(
      { error: 'Failed to create account. Please try again.' },
      { status: 500 }
    );
  }
}