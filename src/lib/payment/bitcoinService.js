/**
 * Bitcoin Payment Service
 *
 * Self-service payment system for AI agents
 * - Generates deterministic BTC addresses from xpub using BIP32
 * - Verifies payments via mempool.space API
 * - No payment gateway needed!
 */

import crypto from 'crypto';
import * as bitcoin from 'bitcoinjs-lib';
import BIP32Factory from 'bip32';
import * as ecc from 'tiny-secp256k1';

// Initialize BIP32 with secp256k1 implementation
const bip32 = BIP32Factory(ecc);

export class BitcoinPaymentService {
  constructor() {
    // XPUB for deterministic address generation (your actual xpub)
    this.xpub = process.env.BITCOIN_XPUB || 'xpub6CUGRUonZSQ4TWtTMmzXdrXDtypWKiKrhko4egpiMZbpiaQL2jkwSB1icqYh2cfDfVxdx4df189oLKnC5fSwqPfgyP3hooxujYzAu3fDVmz';

    // Track the next derivation index (in production, persist this)
    this.nextIndex = 0;
    this.addressCache = new Map(); // paymentToken -> { address, index }

    // Pricing in USD
    this.pricingTiers = {
      10: { usd: 1, credits: 10 },
      1000: { usd: 100, credits: 1000 },
      10000: { usd: 800, credits: 10000 },
      100000: { usd: 5000, credits: 100000 }
    };

    // Current BTC price (will be fetched)
    this.btcPriceUSD = 0;

    // Bitcoin network (mainnet)
    this.network = bitcoin.networks.bitcoin;
  }

  /**
   * Generate a unique payment token for tracking
   */
  generatePaymentToken() {
    return `pmt_${crypto.randomBytes(32).toString('hex')}`;
  }

  /**
   * Derive a deterministic index from email/agentId for consistent address generation
   */
  deriveIndexFromIdentifier(identifier) {
    // Create a deterministic index from the identifier
    const hash = crypto.createHash('sha256').update(identifier).digest();
    // Use first 4 bytes as index (up to ~4 billion unique addresses)
    const index = hash.readUInt32BE(0) % 2147483647; // Keep under BIP32 limit
    return index;
  }

  /**
   * Generate deterministic Bitcoin address from xpub using BIP32
   * Each customer gets a unique address based on their identifier (email/agentId)
   */
  generateBitcoinAddress(paymentToken, identifier = null) {
    try {
      // If we have a cached address for this token, return it
      if (this.addressCache.has(paymentToken)) {
        return this.addressCache.get(paymentToken).address;
      }

      // Derive index - either from identifier or incrementing counter
      let index;
      if (identifier) {
        index = this.deriveIndexFromIdentifier(identifier);
      } else {
        index = this.nextIndex++;
      }

      // Parse the xpub and derive child key
      const node = bip32.fromBase58(this.xpub, this.network);

      // Derive using standard BIP44 path: m/0/index (external chain)
      const child = node.derive(0).derive(index);

      // Generate P2PKH address (legacy, starts with 1)
      const { address } = bitcoin.payments.p2pkh({
        pubkey: child.publicKey,
        network: this.network
      });

      // Cache the result
      this.addressCache.set(paymentToken, { address, index });

      console.log(`[BitcoinService] Generated address ${address} at index ${index} for token ${paymentToken.substring(0, 20)}...`);

      return address;
    } catch (error) {
      console.error('[BitcoinService] Error generating address:', error);
      throw new Error(`Failed to generate Bitcoin address: ${error.message}`);
    }
  }

  /**
   * Get payment address for a specific identifier (email/agentId)
   * This ensures the same customer always gets the same address
   */
  getPaymentAddressForCustomer(identifier) {
    const index = this.deriveIndexFromIdentifier(identifier);

    try {
      const node = bip32.fromBase58(this.xpub, this.network);
      const child = node.derive(0).derive(index);

      const { address } = bitcoin.payments.p2pkh({
        pubkey: child.publicKey,
        network: this.network
      });

      return { address, index };
    } catch (error) {
      console.error('[BitcoinService] Error generating customer address:', error);
      throw error;
    }
  }

  /**
   * Fetch current Bitcoin price from mempool.space
   */
  async fetchBitcoinPrice() {
    try {
      const response = await fetch('https://mempool.space/api/v1/prices');
      if (!response.ok) {
        throw new Error(`Failed to fetch BTC price: ${response.status}`);
      }

      const data = await response.json();
      this.btcPriceUSD = data.USD;

      console.log(`[BitcoinService] Current BTC price: $${this.btcPriceUSD}`);
      return this.btcPriceUSD;
    } catch (error) {
      console.error('[BitcoinService] Error fetching BTC price:', error);
      // Return cached price or default
      return this.btcPriceUSD || 100000; // Default fallback
    }
  }

  /**
   * Calculate BTC amount required for a credit tier
   */
  async calculateBtcAmount(credits) {
    // Get current BTC price
    if (this.btcPriceUSD === 0) {
      await this.fetchBitcoinPrice();
    }

    // Find pricing tier
    const tier = this.pricingTiers[credits];
    if (!tier) {
      throw new Error('Invalid credit amount');
    }

    const btcAmount = tier.usd / this.btcPriceUSD;
    const sats = Math.ceil(btcAmount * 100000000);

    return {
      credits: tier.credits,
      usd: tier.usd,
      btc: btcAmount,
      sats
    };
  }

  /**
   * Check payment status for an address via mempool.space API
   */
  async checkPaymentStatus(address, requiredSats) {
    try {
      console.log(`[BitcoinService] Checking payment for address: ${address}`);

      const response = await fetch(`https://mempool.space/api/address/${address}`);
      if (!response.ok) {
        throw new Error(`Failed to fetch address info: ${response.status}`);
      }

      const data = await response.json();

      // Calculate total received (confirmed + unconfirmed)
      const confirmedReceived = data.chain_stats.funded_txo_sum;
      const confirmedSpent = data.chain_stats.spent_txo_sum;
      const pendingReceived = data.mempool_stats.funded_txo_sum;
      const pendingSpent = data.mempool_stats.spent_txo_sum;

      const totalReceivedSats = confirmedReceived + pendingReceived - confirmedSpent - pendingSpent;
      const confirmedSats = confirmedReceived - confirmedSpent;

      console.log(`[BitcoinService] Payment status:
        Confirmed: ${confirmedSats} sats
        Pending: ${pendingReceived - pendingSpent} sats
        Total: ${totalReceivedSats} sats
        Required: ${requiredSats} sats
      `);

      // Allow 5% tolerance
      const lowerBound = Math.floor(requiredSats * 0.95);

      return {
        address,
        totalReceivedSats,
        confirmedSats,
        pendingSats: pendingReceived - pendingSpent,
        requiredSats,
        isPaid: totalReceivedSats >= lowerBound,
        isConfirmed: confirmedSats >= lowerBound,
        confirmations: data.chain_stats.tx_count,
        percentPaid: (totalReceivedSats / requiredSats) * 100
      };
    } catch (error) {
      console.error('[BitcoinService] Error checking payment:', error);
      throw error;
    }
  }

  /**
   * Get transactions for an address
   */
  async getAddressTransactions(address) {
    try {
      const response = await fetch(`https://mempool.space/api/address/${address}/txs`);
      if (!response.ok) {
        throw new Error(`Failed to fetch transactions: ${response.status}`);
      }

      const transactions = await response.json();
      return transactions;
    } catch (error) {
      console.error('[BitcoinService] Error fetching transactions:', error);
      return [];
    }
  }

  // Methods required by MultiChainPaymentService

  /**
   * Get payment address (for Bitcoin, generate from identifier)
   */
  getPaymentAddress() {
    // Bitcoin uses per-customer addresses, so this returns a placeholder
    // The actual address is generated per payment via generateBitcoinAddress
    return 'btc-dynamic-address';
  }

  /**
   * Get required confirmations (6 for Bitcoin)
   */
  getRequiredConfirmations() {
    return 6;
  }

  /**
   * Get estimated confirmation time
   */
  getConfirmationTime() {
    return '30-60 minutes';
  }

  /**
   * Get estimated transaction fee
   */
  getEstimatedFee() {
    return '$1-$5';
  }

  /**
   * Get blockchain explorer URL
   */
  getExplorerUrl(address) {
    return `https://mempool.space/address/${address}`;
  }

  /**
   * Format satoshi amount for display
   */
  formatAmount(sats) {
    return (sats / 100000000).toFixed(8);
  }

  /**
   * Convert USD to BTC
   */
  async convertUsdToToken(usd) {
    if (this.btcPriceUSD === 0) {
      await this.fetchBitcoinPrice();
    }
    const btc = usd / this.btcPriceUSD;
    return {
      amount: btc,
      amountSmallestUnit: Math.ceil(btc * 100000000), // sats
      token: 'BTC'
    };
  }

  /**
   * Get pricing with Bitcoin-specific information
   */
  async getPricing(credits) {
    const tier = this.pricingTiers[credits];
    if (!tier) {
      throw new Error('Invalid credit amount. Must be 10, 1000, 10000, or 100000');
    }

    // Fetch current BTC price
    await this.fetchBitcoinPrice();

    const btcAmount = tier.usd / this.btcPriceUSD;
    const sats = Math.ceil(btcAmount * 100000000);

    // Generate a unique address for this payment
    const paymentToken = this.generatePaymentToken();
    const paymentAddress = this.generateBitcoinAddress(paymentToken);

    return {
      ...tier,
      blockchain: 'bitcoin',
      token: 'BTC',
      amount: btcAmount,
      btc: btcAmount,
      sats,
      amountSmallestUnit: sats,
      btcPrice: this.btcPriceUSD,
      paymentAddress,
      paymentToken,
      requiredConfirmations: this.getRequiredConfirmations(),
      estimatedTime: this.getConfirmationTime(),
      estimatedFee: this.getEstimatedFee(),
      explorerUrl: this.getExplorerUrl(paymentAddress)
    };
  }
}

export default new BitcoinPaymentService();
