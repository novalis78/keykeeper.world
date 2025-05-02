/**
 * API endpoint to get the user's email from the virtual_users table
 */
import { NextResponse } from 'next/server';
import { getUserEmailByUserId } from '@/lib/mail/accountManager';

/**
 * POST handler for retrieving user email from virtual_users
 */
export async function POST(request) {
  try {
    // Parse the request body
    const body = await request.json();
    const { userId } = body;

    if (!userId) {
      return NextResponse.json(
        { success: false, message: 'User ID is required' },
        { status: 400 }
      );
    }

    // Get the user's email from the virtual_users table
    const email = await getUserEmailByUserId(userId);

    if (!email) {
      return NextResponse.json(
        { 
          success: false, 
          message: 'No email found for user',
          requiresSetup: true 
        },
        { status: 404 }
      );
    }

    // Return the email
    return NextResponse.json({ success: true, email });
  } catch (error) {
    console.error('Error in user-email API:', error);
    return NextResponse.json(
      { success: false, message: error.message || 'An error occurred' },
      { status: 500 }
    );
  }
}