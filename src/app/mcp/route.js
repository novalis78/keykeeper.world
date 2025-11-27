import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

/**
 * Redirect /mcp to /api/mcp for discoverability
 */
export async function GET(request) {
  const url = new URL(request.url);
  return NextResponse.redirect(new URL('/api/mcp', url.origin));
}
