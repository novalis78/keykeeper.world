import { NextResponse } from 'next/server';
import db from '@/lib/db';

export const dynamic = 'force-dynamic';

/**
 * Escrow Void — Refund held credits back to the agent
 *
 * Called by KeyWork when a job is cancelled.
 * Refunds credits (full or partial based on refund_percent).
 *
 * Body: { hold_id: string, refund_percent?: number }
 * Returns: { status: "voided", refunded_credits: number }
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
    const { hold_id, refund_percent = 100 } = body;

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

    // Calculate refund
    const refundCredits = Math.floor(hold.credits_held * (refund_percent / 100));

    // Refund credits to user
    if (refundCredits > 0) {
      await db.users.updateCredits(user.id, refundCredits);
    }

    // Mark as voided
    await db.query(
      'UPDATE escrow_holds SET status = ?, refund_percent = ?, refunded_credits = ?, voided_at = NOW() WHERE id = ?',
      ['voided', refund_percent, refundCredits, hold_id]
    );

    console.log(`[Escrow] Voided ${hold_id}: refunded ${refundCredits}/${hold.credits_held} credits (${refund_percent}%)`);

    return NextResponse.json({
      hold_id,
      status: 'voided',
      refund_percent,
      refunded_credits: refundCredits,
      amount_usd: parseFloat(hold.amount_usd)
    });
  } catch (error) {
    console.error('Escrow void error:', error);
    return NextResponse.json({ error: 'Failed to void escrow: ' + error.message }, { status: 500 });
  }
}
