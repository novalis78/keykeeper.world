import { NextResponse } from 'next/server';
import * as OTPAuth from 'otpauth';
import jwt from '@/lib/auth/jwt';
import db from '@/lib/db';

export const dynamic = 'force-dynamic';

/**
 * Setup 2FA (TOTP) for a user account
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

    // Get user from database
    const user = await db.users.findById(decoded.userId);
    if (!user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

    // Generate TOTP secret
    const totp = new OTPAuth.TOTP({
      issuer: 'KeyKeeper.world',
      label: user.email,
      algorithm: 'SHA1',
      digits: 6,
      period: 30
    });

    // Get the secret
    const secret = totp.secret.base32;

    // Generate QR code URI
    const otpauthUrl = totp.toString();

    // Store the secret in database (not enabled yet)
    await db.users.updateTOTPSecret(user.id, secret);

    // Log 2FA setup initiated
    await db.activityLogs.create(user.id, '2fa_setup_initiated', {
      ipAddress: request.headers.get('x-forwarded-for') || request.ip
    });

    return NextResponse.json({
      secret,
      qrCodeUrl: otpauthUrl,
      message: 'Scan the QR code with your authenticator app, then verify with a code to enable 2FA'
    });
  } catch (error) {
    console.error('2FA setup error:', error);
    return NextResponse.json(
      { error: 'Failed to setup 2FA: ' + error.message },
      { status: 500 }
    );
  }
}
