import { NextResponse } from 'next/server';
import crypto from 'crypto';
import db from '@/lib/db';

export const dynamic = 'force-dynamic';

/**
 * Escrow Hold — Reserve credits from an agent's balance
 *
 * Called by KeyWork when an agent posts a job.
 * Deducts credits from the agent's balance and creates a hold record.
 *
 * Body: { amount_usd: number, reference: string, service: string }
 * Returns: { hold_id: string, status: "held" }
 */
// Auto-create table on first use
let tableReady = false;
async function ensureTable() {
  if (tableReady) return;
  await db.query(`CREATE TABLE IF NOT EXISTS escrow_holds (
    id VARCHAR(64) PRIMARY KEY,
    user_id VARCHAR(64) NOT NULL,
    amount_usd DECIMAL(10, 2) NOT NULL,
    credits_held INT NOT NULL,
    reference VARCHAR(255),
    service VARCHAR(64),
    status VARCHAR(16) DEFAULT 'held',
    refund_percent INT DEFAULT NULL,
    refunded_credits INT DEFAULT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    released_at DATETIME DEFAULT NULL,
    voided_at DATETIME DEFAULT NULL,
    INDEX idx_escrow_user (user_id),
    INDEX idx_escrow_status (status)
  )`);
  tableReady = true;
}

export async function POST(request) {
  try {
    await ensureTable();
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
    const { amount_usd, reference, service } = body;

    if (!amount_usd || amount_usd <= 0) {
      return NextResponse.json({ error: 'amount_usd must be positive' }, { status: 400 });
    }

    // Convert USD to credits (1 credit = $0.10)
    const creditsRequired = Math.ceil(amount_usd * 10);
    const currentCredits = parseFloat(user.credits || 0);

    if (currentCredits < creditsRequired) {
      return NextResponse.json({
        error: 'Insufficient balance',
        message: `Need ${creditsRequired} credits ($${amount_usd}) but only have ${currentCredits} credits ($${(currentCredits / 10).toFixed(2)})`,
        credits_required: creditsRequired,
        credits_available: currentCredits
      }, { status: 402 });
    }

    // Deduct credits
    await db.users.updateCredits(user.id, -creditsRequired);

    // Create hold record
    const holdId = `hold_${crypto.randomBytes(16).toString('hex')}`;
    await db.query(
      `INSERT INTO escrow_holds (id, user_id, amount_usd, credits_held, reference, service, status, created_at)
       VALUES (?, ?, ?, ?, ?, ?, 'held', NOW())`,
      [holdId, user.id, amount_usd, creditsRequired, reference || null, service || null]
    );

    console.log(`[Escrow] Hold ${holdId}: ${creditsRequired} credits ($${amount_usd}) from user ${user.id} for ${reference || 'unknown'}`);

    return NextResponse.json({
      hold_id: holdId,
      status: 'held',
      amount_usd,
      credits_held: creditsRequired
    });
  } catch (error) {
    console.error('Escrow hold error:', error);
    return NextResponse.json({ error: 'Failed to create escrow hold: ' + error.message }, { status: 500 });
  }
}
