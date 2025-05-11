import { NextResponse } from 'next/server';
import { sendEmail } from '@/lib/mail/mailbox';

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

export async function POST(request) {
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
    
    // Prepare clean attachments array - strip file objects which can't be serialized
    let cleanAttachments = [];
    if (data.attachments && data.attachments.length > 0) {
      cleanAttachments = data.attachments.map(att => ({
        id: att.id,
        name: att.name,
        size: att.size,
        type: att.type,
        // File objects can't be sent as is, they would need to be uploaded separately
        // For now, we're not handling file attachments in this example
      }));
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