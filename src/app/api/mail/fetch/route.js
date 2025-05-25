import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { fetchEmails } from '@/lib/mail/mailbox';
import { verifyToken, extractTokenFromHeader, extractTokenFromCookies } from '@/lib/auth/jwt';
import passwordManager from '@/lib/users/passwordManager';

/**
 * API route to fetch emails from a specific folder
 * Uses JWT authentication and passwordManager to get credentials
 */

// Mark this route as dynamically rendered
export const dynamic = 'force-dynamic';

export async function POST(request) {
  try {
    // Enable real mail server integration
    process.env.USE_REAL_MAIL_SERVER = 'true';
    
    // Check for authentication token
    let token = extractTokenFromHeader(request);
    
    if (!token) {
      const cookieStore = cookies();
      token = extractTokenFromCookies(cookieStore);
    }
    
    if (!token) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }
    
    // Verify the token
    const tokenPayload = await verifyToken(token);
    if (!tokenPayload) {
      return NextResponse.json(
        { error: 'Invalid authentication token' },
        { status: 403 }
      );
    }
    
    const userId = tokenPayload.userId;
    
    // Get request body
    const body = await request.json();
    const { folder = 'inbox', limit = 50, offset = 0, search = '' } = body;
    
    console.log(`[Mail API] Fetching emails from '${folder}' folder for user ${userId}`);
    
    // Get the user's mail account
    const mailAccount = await passwordManager.getPrimaryMailAccount(userId);
    if (!mailAccount) {
      console.log(`[Mail API] Could not retrieve mail account for user ${userId}`);
      return NextResponse.json(
        { error: 'Could not retrieve mail account information' },
        { status: 500 }
      );
    }
    
    console.log(`[Mail API] Found mail account: ${mailAccount.email}`);
    
    // Get the password
    const password = await passwordManager.getMailPassword(userId);
    if (!password) {
      console.log(`[Mail API] Could not retrieve mail password for user ${userId}`);
      return NextResponse.json(
        { error: 'Could not retrieve mail password' },
        { status: 500 }
      );
    }
    
    console.log(`[Mail API] Retrieved password for ${mailAccount.email}`);
    
    const options = {
      limit,
      offset,
      search: search || undefined,
      fetchBody: true,
      imapConfig: {
        auth: {
          user: mailAccount.email,
          pass: password
        }
      }
    };
    
    // Handle folder name case sensitivity
    const targetFolder = folder.toLowerCase() === 'sent' ? 'Sent' : folder;
    
    console.log(`[Mail API] Fetching from folder: ${targetFolder}`);
    const emails = await fetchEmails(mailAccount.email, targetFolder, options);
    
    console.log(`[Mail API] Found ${emails.length} emails in '${targetFolder}' folder`);
    
    return NextResponse.json({
      success: true,
      emails,
      meta: {
        folder: targetFolder,
        total: emails.length,
        limit,
        offset
      }
    });
  } catch (error) {
    console.error('[Mail API] Error fetching emails:', error);
    return NextResponse.json(
      { error: 'Internal server error', details: error.message },
      { status: 500 }
    );
  }
}

// Support GET method as well
export async function GET(request) {
  // Convert GET parameters to POST body format
  const { searchParams } = new URL(request.url);
  
  const mockBody = {
    folder: searchParams.get('folder') || 'inbox',
    limit: parseInt(searchParams.get('limit')) || 50,
    offset: parseInt(searchParams.get('offset')) || 0,
    search: searchParams.get('search') || ''
  };
  
  // Create a mock request with the body
  const mockRequest = new Request(request.url, {
    method: 'POST',
    headers: request.headers,
    body: JSON.stringify(mockBody)
  });
  
  return POST(mockRequest);
}