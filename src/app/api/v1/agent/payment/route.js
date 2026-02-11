import { NextResponse } from 'next/server';
import crypto from 'crypto';
import { MultiChainPaymentService } from '@/lib/payment/MultiChainPaymentService';
import db from '@/lib/db';

export const dynamic = 'force-dynamic';

const multiChain = new MultiChainPaymentService();

/**
 * Initiate Multi-Chain Payment for Credits
 *
 * Supports: Polygon (USDC), Solana (USDC), Ethereum (USDC), Bitcoin (BTC)
 * Returns payment token and deposit address
 */
export async function POST(request) {
  try {
    const body = await request.json();
    const { credits, chain, apiKey } = body;

    console.log('[Payment] Received request:', { credits, chain, apiKey: apiKey ? 'provided' : 'none' });

    // Validate credits amount
    const validAmounts = [10, 1000, 10000, 100000];
    if (!validAmounts.includes(credits)) {
      return NextResponse.json(
        {
          error: 'Invalid credit amount',
          validAmounts,
          availableChains: multiChain.getAvailableChains()
        },
        { status: 400 }
      );
    }

    // Default to polygon if no chain specified
    const blockchain = chain || 'polygon';
    console.log('[Payment] Selected blockchain:', blockchain);

    // Validate blockchain
    try {
      multiChain.getService(blockchain);
    } catch (error) {
      return NextResponse.json(
        {
          error: error.message,
          availableChains: multiChain.getAvailableChains()
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

    // Initiate payment on chosen blockchain
    const payment = await multiChain.initiatePayment(credits, blockchain);
    const service = multiChain.getService(blockchain);

    // Extract payment details - getPricing returns paymentAddress, not depositAddress
    const depositAddress = payment.paymentAddress;
    const amountUsd = payment.usd || 0;
    const creditsPurchased = payment.credits || credits;
    const amountBtc = blockchain === 'bitcoin' ? (payment.btc || 0) : 0;
    const tokenSymbol = payment.token || (blockchain === 'bitcoin' ? 'BTC' : 'USDC');
    const payableAmount = payment.amount || amountUsd;

    // Store payment request in database
    const paymentId = crypto.randomUUID();
    await db.query(
      `INSERT INTO crypto_payments (
        id, user_id, payment_address, amount_btc, amount_usd,
        credits_purchased, status, metadata, blockchain
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        paymentId,
        userId,
        depositAddress,
        amountBtc,
        amountUsd,
        creditsPurchased,
        'pending',
        JSON.stringify({
          paymentToken: payment.paymentToken,
          chain: blockchain,
          token: tokenSymbol,
          requiredAmount: payableAmount
        }),
        blockchain
      ]
    );

    console.log(`[Payment] Created ${blockchain} payment request: ${paymentId} for ${credits} credits`);

    // Get payment instructions
    const instructions = multiChain.getPaymentInstructions(
      blockchain,
      depositAddress,
      payableAmount,
      tokenSymbol,
      payment.paymentToken
    );

    // Return payment details
    return NextResponse.json({
      paymentToken: payment.paymentToken,
      chain: blockchain,
      depositAddress: depositAddress,
      token: tokenSymbol,
      amount: {
        credits: creditsPurchased,
        usd: amountUsd,
        [tokenSymbol.toLowerCase()]: payableAmount
      },
      instructions,
      statusUrl: `/v1/agent/payment/status/${payment.paymentToken}`,
      claimUrl: `/v1/agent/payment/claim/${payment.paymentToken}`,
      availableChains: payment.availableChains
    });
  } catch (error) {
    console.error('Payment initiation error:', error);
    return NextResponse.json(
      { error: 'Failed to initiate payment: ' + error.message },
      { status: 500 }
    );
  }
}
