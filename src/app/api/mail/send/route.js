import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { sendEmail } from '@/lib/mail/mailbox';
import { verifyToken, extractTokenFromHeader, extractTokenFromCookies } from '@/lib/auth/jwt';

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
  // Check for authentication token in header or cookies
  let token = extractTokenFromHeader(request);
  
  if (!token) {
    // Try to get token from cookies
    const cookieStore = cookies();
    token = extractTokenFromCookies(cookieStore);
  }
  
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
      console.log(`[Mail Send API] Processing ${data.attachments.length} attachments`);
      cleanAttachments = data.attachments.map(att => {
        console.log(`[Mail Send API] Processing attachment:`, {
          filename: att.filename,
          name: att.name,
          hasContent: !!att.content,
          contentLength: att.content ? att.content.length : 0,
          contentType: att.contentType || att.type
        });
        
        const cleanAtt = {
          filename: att.filename || att.name,
          size: att.size,
          contentType: att.contentType || att.type
        };
        
        // Preserve content for all attachments that have it
        if (att.content) {
          cleanAtt.content = att.content;
          cleanAtt.encoding = att.encoding || 'base64';
          console.log(`[Mail Send API] Preserving attachment content for ${cleanAtt.filename}`);
        }
        
        // Special handling for PGP key attachments
        if (att.filename && att.filename.includes('public_key.asc')) {
          console.log(`[Mail Send API] Found public key attachment: ${att.filename}`);
          console.log(`[Mail Send API] Key content preview: ${att.content ? att.content.substring(0, 100) : 'NO CONTENT'}`);
        }
        
        return cleanAtt;
      });
    } else {
      console.log(`[Mail Send API] No attachments in request`);
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
      console.log(`Password provided: ${data.credentials.password ? 'YES' : 'NO'}`);
      
      // Log a warning if password is provided but empty
      if (!data.credentials.password) {
        console.warn('Credentials object provided but password is empty');
      }
    } else {
      console.log('No SMTP credentials provided, will use default config');
      // No credentials required - will use default config
    }
    
    const result = await sendEmail(emailData, {
      pgpEncrypted: data.pgpEncrypted || false,
      recipientPublicKey: data.recipientPublicKey || null,
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