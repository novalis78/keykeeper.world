import { NextResponse } from 'next/server';
import { MultiChainPaymentService } from '@/lib/payment/MultiChainPaymentService';
import db from '@/lib/db';

export const dynamic = 'force-dynamic';

const multiChain = new MultiChainPaymentService();

/**
 * Check Payment Status
 *
 * Agent polls this endpoint to check if their payment has been confirmed.
 * Uses the correct blockchain service based on the payment's chain.
 */
export async function GET(request, { params }) {
  try {
    const paymentToken = params.token;

    // Find payment in database by paymentToken stored in metadata
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
    const metadata = JSON.parse(payment.metadata);
    const blockchain = metadata.chain || payment.blockchain || 'bitcoin';

    // If already confirmed and claimed, return that status
    if (payment.status === 'confirmed' && payment.claimed_at) {
      return NextResponse.json({
        status: 'claimed',
        blockchain,
        credits: parseFloat(payment.credits_purchased),
        message: 'Payment confirmed and credits already claimed'
      });
    }

    // Get the correct service for this blockchain
    const service = multiChain.getService(blockchain);

    // Determine required amount based on chain type
    const requiredAmount = blockchain === 'bitcoin'
      ? metadata.requiredSats
      : metadata.requiredAmount; // USD amount for stablecoins (USDC is 1:1)

    try {
      const paymentStatus = await service.checkPaymentStatus(
        payment.payment_address,
        requiredAmount
      );

      // Update payment record if confirmed
      if (paymentStatus.isConfirmed && payment.status !== 'confirmed') {
        await db.query(
          `UPDATE crypto_payments
           SET status = ?, confirmations = ?, confirmed_at = NOW()
           WHERE id = ?`,
          ['confirmed', paymentStatus.confirmations, payment.id]
        );

        console.log(`[Payment] Payment ${payment.id} confirmed on ${blockchain} with ${paymentStatus.confirmations} confirmations`);
      }

      // Build response based on chain type
      const response = {
        status: paymentStatus.isConfirmed ? 'confirmed' : 'pending',
        blockchain,
        paymentAddress: payment.payment_address,
        confirmations: paymentStatus.confirmations,
        isPaid: paymentStatus.isPaid,
        isConfirmed: paymentStatus.isConfirmed,
        canClaim: paymentStatus.isConfirmed && !payment.claimed_at,
        credits: parseFloat(payment.credits_purchased),
        message: paymentStatus.isConfirmed
          ? 'Payment confirmed! You can now claim your credits.'
          : paymentStatus.isPaid
          ? 'Payment detected, waiting for confirmations...'
          : 'Waiting for payment...',
        transactions: paymentStatus.transactions || []
      };

      // Add chain-specific amount info
      if (blockchain === 'bitcoin') {
        response.required = {
          sats: metadata.requiredSats,
          btc: metadata.requiredSats / 100000000
        };
        response.received = {
          totalSats: paymentStatus.totalReceivedSats || 0,
          confirmedSats: paymentStatus.confirmedSats || 0,
          pendingSats: paymentStatus.pendingSats || 0,
          btc: (paymentStatus.totalReceivedSats || 0) / 100000000
        };
        response.percentPaid = paymentStatus.percentPaid
          ? paymentStatus.percentPaid.toFixed(2)
          : '0.00';
      } else {
        response.required = {
          amount: metadata.requiredAmount,
          token: metadata.token || 'USDC'
        };
        response.received = {
          total: paymentStatus.totalReceived || 0,
          token: metadata.token || 'USDC'
        };
        response.percentPaid = metadata.requiredAmount > 0
          ? ((paymentStatus.totalReceived || 0) / metadata.requiredAmount * 100).toFixed(2)
          : '0.00';
      }

      return NextResponse.json(response);
    } catch (blockchainError) {
      console.error(`[Payment] Error checking ${blockchain} blockchain:`, blockchainError);

      return NextResponse.json({
        status: payment.status,
        blockchain,
        paymentAddress: payment.payment_address,
        message: 'Unable to check blockchain. Please try again.',
        lastChecked: payment.confirmed_at || payment.created_at
      });
    }
  } catch (error) {
    console.error('Payment status check error:', error);
    return NextResponse.json(
      { error: 'Failed to check payment status: ' + error.message },
      { status: 500 }
    );
  }
}
