import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

export async function POST(request) {
  try {
    console.log('Simple test endpoint called');
    
    const body = await request.json();
    console.log('Request body:', body);
    
    return NextResponse.json(
      {
        success: true,
        message: 'Test successful',
        received: body
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('Test error:', error);
    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    );
  }
}