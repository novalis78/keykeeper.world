import { NextResponse } from 'next/server';
import { fetchEmails } from '@/lib/mail/mailbox';

/**
 * API route to fetch emails from a specific folder
 * Expects query parameters:
 * - email: the user's email address for authentication
 * - folder: (optional) the folder to fetch from (defaults to 'inbox')
 * - limit: (optional) number of emails to fetch
 * - offset: (optional) offset for pagination
 * - search: (optional) search term
 */

// Mark this route as dynamically rendered
export const dynamic = 'force-dynamic';

export async function GET(request) {
  try {
    // Enable real mail server integration
    process.env.USE_REAL_MAIL_SERVER = 'true';
    
    // Get the URL parameters
    const { searchParams } = new URL(request.url);
    const email = searchParams.get('email');
    const folder = searchParams.get('folder') || 'inbox';
    const limit = parseInt(searchParams.get('limit')) || 50;
    const offset = parseInt(searchParams.get('offset')) || 0;
    const search = searchParams.get('search') || '';
    
    // Basic validation
    if (!email) {
      return NextResponse.json(
        { error: 'Email address is required' },
        { status: 400 }
      );
    }
    
    const options = {
      limit,
      offset,
      search: search || undefined,
      fetchBody: true // Get preview text for each email
    };
    
    const emails = await fetchEmails(email, folder, options);
    
    return NextResponse.json({
      success: true,
      emails,
      meta: {
        folder,
        total: emails.length,
        limit,
        offset
      }
    });
  } catch (error) {
    console.error('Error fetching emails:', error);
    return NextResponse.json(
      { error: 'Internal server error', details: error.message },
      { status: 500 }
    );
  }
}