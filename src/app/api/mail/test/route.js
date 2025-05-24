import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

export async function GET(request) {
  console.log('=== MAIL TEST API: GET request received ===');
  return NextResponse.json({
    status: 'ok',
    message: 'Mail API is reachable',
    version: 'v2.1',
    timestamp: new Date().toISOString()
  });
}

export async function POST(request) {
  console.log('=== MAIL TEST API: POST request received ===');
  return NextResponse.json({
    status: 'ok',
    message: 'Mail API POST endpoint is reachable',
    version: 'v2.1',
    timestamp: new Date().toISOString()
  });
}