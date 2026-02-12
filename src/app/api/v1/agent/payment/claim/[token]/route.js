import { NextResponse } from 'next/server';
import crypto from 'crypto';
import { MultiChainPaymentService } from '@/lib/payment/MultiChainPaymentService';
import db from '@/lib/db';

export const dynamic = 'force-dynamic';

const multiChain = new MultiChainPaymentService();

/**
 * Claim Credits After Payment Confirmed
 *
 * Agent exchanges payment token for credits.
 * Uses the correct blockchain service to verify payment.
 * Can optionally provide API key to add to existing account,
 * or create a new agent account with the credits.
 */
export async function POST(request, { params }) {
  try {
    const paymentToken = params.token;
    const body = await request.json();
    const { apiKey, agentId } = body;

    // Find payment in database by paymentToken
    const payments = await db.query(
      `SELECT * FROM crypto_payments WHERE JSON_EXTRACT(metadata, '$.paymentToken') = ?`,
      [paymentToken]
    );

    if (payments.length === 0) {
      return NextResponse.json(
        { error: 'Payment token not found' },
        { status: 404 }
      );
    }

    const payment = payments[0];
    const metadata = typeof payment.metadata === 'string' ? JSON.parse(payment.metadata) : payment.metadata;
    const blockchain = metadata.chain || payment.blockchain || 'bitcoin';

    // Check if already claimed
    if (payment.claimed_at) {
      return NextResponse.json(
        { error: 'Credits already claimed for this payment' },
        { status: 400 }
      );
    }

    // Verify payment is confirmed
    if (payment.status !== 'confirmed') {
      // Double-check blockchain status using the correct service
      const service = multiChain.getService(blockchain);

      const requiredAmount = blockchain === 'bitcoin'
        ? metadata.requiredSats
        : metadata.requiredAmount;

      const paymentStatus = await service.checkPaymentStatus(
        payment.payment_address,
        requiredAmount
      );

      if (!paymentStatus.isConfirmed) {
        return NextResponse.json(
          {
            error: 'Payment not yet confirmed',
            blockchain,
            status: paymentStatus.isPaid ? 'awaiting_confirmations' : 'awaiting_payment',
            confirmations: paymentStatus.confirmations
          },
          { status: 402 }
        );
      }

      // Update payment status
      await db.query(
        `UPDATE crypto_payments SET status = ?, confirmations = ?, confirmed_at = NOW() WHERE id = ?`,
        ['confirmed', paymentStatus.confirmations, payment.id]
      );
    }

    let userId = payment.user_id;
    let newApiKey = null;

    // If API key provided, add credits to existing account
    if (apiKey) {
      const user = await db.users.findByApiKey(apiKey);
      if (!user) {
        return NextResponse.json(
          { error: 'Invalid API key' },
          { status: 401 }
        );
      }

      userId = user.id;

      // Add credits to user account
      await db.users.updateCredits(userId, parseFloat(payment.credits_purchased));

      console.log(`[Payment] Added ${payment.credits_purchased} credits to user ${userId} via ${blockchain}`);
    } else {
      // Create new agent account with credits
      userId = crypto.randomUUID();
      newApiKey = `kk_${crypto.randomBytes(32).toString('hex')}`;

      const agentEmail = `agent-${agentId || crypto.randomBytes(4).toString('hex')}@keykeeper.world`;

      await db.query(
        `INSERT INTO users (
          id, email, name, account_type, status, api_key, credits
        ) VALUES (?, ?, ?, ?, ?, ?, ?)`,
        [userId, agentEmail, agentId || 'AI Agent', 'agent', 'active', newApiKey, parseFloat(payment.credits_purchased)]
      );

      console.log(`[Payment] Created new agent account ${userId} with ${payment.credits_purchased} credits via ${blockchain}`);
    }

    // Mark payment as claimed
    await db.query(
      `UPDATE crypto_payments SET user_id = ?, claimed_at = NOW() WHERE id = ?`,
      [userId, payment.id]
    );

    // Log credit transaction
    await db.query(
      `INSERT INTO credit_transactions (
        id, user_id, transaction_type, amount, balance_after, description, related_payment_id
      ) VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [
        crypto.randomUUID(),
        userId,
        'purchase',
        parseFloat(payment.credits_purchased),
        parseFloat(payment.credits_purchased),
        `Purchased ${payment.credits_purchased} credits via ${blockchain}`,
        payment.id
      ]
    );

    // Log activity
    await db.activityLogs.create(userId, 'credits_purchased', {
      paymentId: payment.id,
      credits: payment.credits_purchased,
      blockchain,
      amount: blockchain === 'bitcoin' ? payment.amount_btc : payment.amount_usd
    });

    // Return success with credits
    const response = {
      success: true,
      credits: parseFloat(payment.credits_purchased),
      blockchain,
      message: `Successfully claimed ${payment.credits_purchased} credits`
    };

    // If new account created, include API key
    if (newApiKey) {
      const user = await db.users.findById(userId);
      response.apiKey = newApiKey;
      response.email = user.email;
      response.message += '. New agent account created.';
      response.note = 'Store your API key securely - it cannot be retrieved later';
    }

    return NextResponse.json(response);
  } catch (error) {
    console.error('Credit claim error:', error);
    return NextResponse.json(
      { error: 'Failed to claim credits: ' + error.message },
      { status: 500 }
    );
  }
}
