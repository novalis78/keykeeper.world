import { NextResponse } from 'next/server';
import db from '@/lib/db';

export const dynamic = 'force-dynamic';

/**
 * Escrow Release — Release held funds to the worker
 *
 * Called by KeyWork when an agent approves a completed job.
 * Marks the hold as released. Credits have already been deducted.
 *
 * Body: { hold_id: string }
 * Returns: { status: "released" }
 */
export async function POST(request) {
  try {
    const authHeader = request.headers.get('authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Missing Authorization header' }, { status: 401 });
    }

    const apiKey = authHeader.substring(7);
    const user = await db.users.findByApiKey(apiKey);
    if (!user) {
      return NextResponse.json({ error: 'Invalid API key' }, { status: 401 });
    }

    const body = await request.json();
    const { hold_id } = body;

    if (!hold_id) {
      return NextResponse.json({ error: 'hold_id is required' }, { status: 400 });
    }

    // Find the hold
    const holds = await db.query(
      'SELECT * FROM escrow_holds WHERE id = ? AND user_id = ?',
      [hold_id, user.id]
    );

    if (holds.length === 0) {
      return NextResponse.json({ error: 'Hold not found' }, { status: 404 });
    }

    const hold = holds[0];

    if (hold.status !== 'held') {
      return NextResponse.json({ error: `Hold already ${hold.status}` }, { status: 409 });
    }

    // Mark as released
    await db.query(
      'UPDATE escrow_holds SET status = ?, released_at = NOW() WHERE id = ?',
      ['released', hold_id]
    );

    console.log(`[Escrow] Released ${hold_id}: ${hold.credits_held} credits ($${hold.amount_usd})`);

    return NextResponse.json({
      hold_id,
      status: 'released',
      amount_usd: parseFloat(hold.amount_usd),
      credits_released: hold.credits_held
    });
  } catch (error) {
    console.error('Escrow release error:', error);
    return NextResponse.json({ error: 'Failed to release escrow: ' + error.message }, { status: 500 });
  }
}
