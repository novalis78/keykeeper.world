import { NextResponse } from 'next/server';
import { sendEmail } from '@/lib/mail/mailbox';
import { verifyToken, extractTokenFromHeader } from '@/lib/auth/jwt';

/**
 * API route to send an email
 * Expects JSON payload with:
 * - from: sender info (name, email)
 * - to: array of recipients
 * - cc: optional array of cc recipients
 * - bcc: optional array of bcc recipients
 * - subject: email subject
 * - body: email body (HTML)
 * - attachments: optional array of attachments
 * - pgpEncrypted: optional boolean for PGP encryption
 */

// Mark this route as dynamically rendered
export const dynamic = 'force-dynamic';

// Needed to make Next.js correctly process OPTIONS requests for CORS
export async function OPTIONS(request) {
  return new NextResponse(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
      'Access-Control-Allow-Origin': '*',
    },
  });
}

export async function POST(request) {
  // Check for authentication token
  const token = extractTokenFromHeader(request);
  
  if (!token) {
    console.error('No authentication token provided for mail/send API');
    return NextResponse.json(
      { error: 'Authentication required' },
      { status: 401 }
    );
  }
  
  try {
    // Verify the token and get user data
    const payload = await verifyToken(token);
    
    // Add debug logging
    console.log('Token verified successfully. User:', payload.email || 'unknown');
  } catch (error) {
    console.error('Invalid authentication token:', error);
    return NextResponse.json(
      { error: 'Invalid authentication token' },
      { status: 403 }
    );
  }
  try {
    // Enable real mail server integration
    process.env.USE_REAL_MAIL_SERVER = 'true';
    
    // Don't hardcode passwords - credentials will be provided by the client
    
    // Parse the request body
    const data = await request.json();
    
    // Basic validation
    if (!data.from || !data.to || !data.subject || !data.body) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }
    
    // Prepare clean attachments array - preserve key attachment content
    let cleanAttachments = [];
    if (data.attachments && data.attachments.length > 0) {
      cleanAttachments = data.attachments.map(att => {
        const cleanAtt = {
          id: att.id,
          name: att.name,
          size: att.size,
          type: att.type
        };
        
        // Preserve content for PGP key attachments
        if (att.content && att.name === 'public_key.asc') {
          cleanAtt.content = att.content;
          // Set proper content type
          cleanAtt.contentType = 'application/pgp-keys';
          console.log(`Preserving public key attachment ${att.name} (${att.content.substring(0, 40)}...)`);
        }
        
        return cleanAtt;
      });
    }
    
    const emailData = {
      ...data,
      attachments: cleanAttachments
    };
    
    console.log('Sending email to:', data.to.map(r => r.email).join(', '));
    console.log('Sending email from:', data.from.email);
    
    // Include user's SMTP credentials if provided
    const smtpConfig = data.credentials ? {
      auth: {
        user: data.from.email,
        pass: data.credentials.password
      }
    } : undefined;
    
    // Log that we're attempting to use user's credentials (don't log the actual password)
    if (data.credentials) {
      console.log(`Using SMTP credentials for user: ${data.from.email}`);
    } else {
      console.log('No SMTP credentials provided, will use default config');
    }
    
    const result = await sendEmail(emailData, {
      pgpEncrypted: data.pgpEncrypted || false,
      smtpConfig: smtpConfig
    });
    
    if (!result.success) {
      console.error('Failed to send email:', result.error);
      return NextResponse.json(
        { error: result.error || 'Failed to send email' },
        { status: 500 }
      );
    }
    
    console.log('Email sent successfully, messageId:', result.messageId);
    
    return NextResponse.json({
      success: true,
      messageId: result.messageId,
      sentAt: result.sentAt || new Date()
    });
  } catch (error) {
    console.error('Error sending email:', error);
    return NextResponse.json(
      { error: 'Internal server error', details: error.message },
      { status: 500 }
    );
  }
}