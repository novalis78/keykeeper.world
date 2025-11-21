import { NextResponse } from 'next/server';
import crypto from 'crypto';
import bitcoinService from '@/lib/payment/bitcoinService';
import db from '@/lib/db';

export const dynamic = 'force-dynamic';

/**
 * Initiate Bitcoin Payment for Credits
 *
 * Returns a payment token and Bitcoin address
 * Agent sends BTC, then polls status endpoint
 */
export async function POST(request) {
  try {
    const body = await request.json();
    const { credits, apiKey } = body;

    // Validate credits amount
    const validAmounts = [1000, 10000, 100000];
    if (!validAmounts.includes(credits)) {
      return NextResponse.json(
        {
          error: 'Invalid credit amount',
          validAmounts
        },
        { status: 400 }
      );
    }

    // If API key provided, verify it's valid
    let userId = null;
    if (apiKey) {
      const user = await db.users.findByApiKey(apiKey);
      if (user) {
        userId = user.id;
      }
    }

    // Calculate BTC amount required
    const pricing = await bitcoinService.calculateBtcAmount(credits);

    // Generate payment token
    const paymentToken = bitcoinService.generatePaymentToken();

    // Generate deterministic Bitcoin address
    const bitcoinAddress = bitcoinService.generateBitcoinAddress(paymentToken);

    // Store payment request in database
    const paymentId = crypto.randomUUID();
    await db.query(
      `INSERT INTO crypto_payments (
        id, user_id, payment_address, amount_btc, amount_usd,
        credits_purchased, status, metadata
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        paymentId,
        userId,
        bitcoinAddress,
        pricing.btc,
        pricing.usd,
        pricing.credits,
        'pending',
        JSON.stringify({ token: paymentToken, requiredSats: pricing.sats })
      ]
    );

    console.log(`[Payment] Created payment request: ${paymentId} for ${credits} credits`);

    // Return payment instructions
    return NextResponse.json({
      paymentToken,
      bitcoinAddress,
      amount: {
        credits: pricing.credits,
        usd: pricing.usd,
        btc: pricing.btc,
        sats: pricing.sats
      },
      instructions: [
        `Send exactly ${pricing.btc.toFixed(8)} BTC to ${bitcoinAddress}`,
        `Wait for 3+ confirmations (typically 30-60 minutes)`,
        `Check status at /v1/agent/payment/status/${paymentToken}`,
        `Once confirmed, claim credits at /v1/agent/payment/claim/${paymentToken}`
      ],
      statusUrl: `/v1/agent/payment/status/${paymentToken}`,
      claimUrl: `/v1/agent/payment/claim/${paymentToken}`
    });
  } catch (error) {
    console.error('Payment initiation error:', error);
    return NextResponse.json(
      { error: 'Failed to initiate payment: ' + error.message },
      { status: 500 }
    );
  }
}
