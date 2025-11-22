/**
 * API endpoint to get the user's email from the virtual_users table
 * Falls back to the users table if not found in virtual_users
 */
import { NextResponse } from 'next/server';
import { getUserEmailByUserId } from '@/lib/mail/accountManager';
import db from '@/lib/db';

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

    // First try to get the user's email from the virtual_users table (mail account)
    let email = await getUserEmailByUserId(userId);

    // If not found in virtual_users, fall back to the users table
    if (!email) {
      console.log(`No email found in virtual_users for user ${userId}, checking users table`);

      try {
        const user = await db.users.findById(userId);
        if (user && user.email) {
          email = user.email;
          console.log(`Found email in users table: ${email}`);
        }
      } catch (userError) {
        console.error('Error fetching user from users table:', userError);
      }
    }

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