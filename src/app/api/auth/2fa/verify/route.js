import { NextResponse } from 'next/server';
import * as OTPAuth from 'otpauth';
import jwt from '@/lib/auth/jwt';
import db from '@/lib/db';

export const dynamic = 'force-dynamic';

/**
 * Verify and enable 2FA after setup
 */
export async function POST(request) {
  try {
    // Verify user is authenticated
    const authHeader = request.headers.get('authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const token = authHeader.substring(7);
    const decoded = await jwt.verifyToken(token);

    if (!decoded || !decoded.userId) {
      return NextResponse.json(
        { error: 'Invalid token' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { totpCode } = body;

    if (!totpCode) {
      return NextResponse.json(
        { error: '2FA code is required' },
        { status: 400 }
      );
    }

    // Get user from database
    const user = await db.users.findById(decoded.userId);
    if (!user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

    if (!user.totp_secret) {
      return NextResponse.json(
        { error: '2FA not set up. Call /api/auth/2fa/setup first' },
        { status: 400 }
      );
    }

    // Verify TOTP code
    const totp = new OTPAuth.TOTP({
      secret: user.totp_secret,
      digits: 6,
      period: 30
    });

    const isValid = totp.validate({ token: totpCode, window: 1 }) !== null;

    if (!isValid) {
      return NextResponse.json(
        { error: 'Invalid 2FA code' },
        { status: 401 }
      );
    }

    // Enable 2FA for this user
    await db.users.enableTOTP(user.id);

    // Log 2FA enabled
    await db.activityLogs.create(user.id, '2fa_enabled', {
      ipAddress: request.headers.get('x-forwarded-for') || request.ip
    });

    return NextResponse.json({
      success: true,
      message: '2FA has been successfully enabled for your account'
    });
  } catch (error) {
    console.error('2FA verification error:', error);
    return NextResponse.json(
      { error: 'Failed to verify 2FA: ' + error.message },
      { status: 500 }
    );
  }
}
