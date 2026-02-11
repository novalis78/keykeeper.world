/**
 * Polygon Payment Service
 * Handles USDC payments on Polygon network
 * Uses deterministic HD address derivation for unique per-payment addresses
 *
 * Derivation: HMAC-SHA256(masterSecret, paymentToken) → private key → ECDH pubkey → keccak256 → address
 * Uses only Node.js built-in crypto + @noble/hashes (no WASM dependencies)
 */

import crypto from 'crypto';
import { BasePaymentService } from './BasePaymentService.js';
import { keccak_256 } from '@noble/hashes/sha3.js';

export class PolygonPaymentService extends BasePaymentService {
  constructor(config = {}) {
    super(config);
    this.blockchain = 'polygon';
    this.nativeToken = 'MATIC';

    // Master secret for deterministic address derivation
    // HMAC(masterSecret, identifier) → private key → public key → ETH address
    this.masterSecret = process.env.PAYMENT_MASTER_SECRET || 'keykeeper-payment-hd-master-2025';

    // USDC contract on Polygon
    this.usdcContract = '0x2791Bca1f2de4661ED88A30C99A7a9449Aa84174';

    // Polygonscan API (free tier)
    this.apiKey = process.env.POLYGONSCAN_API_KEY || 'YourApiKeyToken';
    this.apiUrl = 'https://api.polygonscan.com/api';

    // Address cache: paymentToken -> { address, privateKey }
    this.addressCache = new Map();
  }

  /**
   * Derive a private key deterministically from an identifier
   * Uses HMAC-SHA256(masterSecret, identifier) → 32-byte private key
   */
  derivePrivateKey(identifier) {
    return crypto.createHmac('sha256', this.masterSecret)
      .update(identifier)
      .digest();
  }

  /**
   * Derive an EVM address from a private key using Node.js built-in ECDH
   */
  deriveEvmAddressFromPrivateKey(privateKey) {
    // Use Node.js built-in ECDH for secp256k1 public key derivation
    const ecdh = crypto.createECDH('secp256k1');
    ecdh.setPrivateKey(privateKey);

    // Get uncompressed public key (65 bytes, starts with 0x04)
    const uncompressedPubKey = ecdh.getPublicKey();

    // Keccak256 of public key bytes (without the 0x04 prefix)
    const pubKeyWithoutPrefix = uncompressedPubKey.slice(1); // 64 bytes
    const hash = keccak_256(pubKeyWithoutPrefix);

    // Last 20 bytes = Ethereum address
    const addrHex = Buffer.from(hash).slice(-20).toString('hex');

    // Apply EIP-55 checksum
    return this.toChecksumAddress(addrHex);
  }

  /**
   * EIP-55 mixed-case checksum encoding
   */
  toChecksumAddress(addrHex) {
    const lower = addrHex.toLowerCase();
    const hashHex = Buffer.from(keccak_256(Buffer.from(lower, 'ascii'))).toString('hex');

    let checksummed = '0x';
    for (let i = 0; i < 40; i++) {
      checksummed += parseInt(hashHex[i], 16) >= 8
        ? lower[i].toUpperCase()
        : lower[i];
    }
    return checksummed;
  }

  /**
   * Generate a unique payment address for a specific payment
   * Each payment gets its own derived address
   */
  generatePaymentAddress(paymentToken, identifier = null) {
    if (this.addressCache.has(paymentToken)) {
      return this.addressCache.get(paymentToken).address;
    }

    const privateKey = this.derivePrivateKey(identifier || paymentToken);
    const address = this.deriveEvmAddressFromPrivateKey(privateKey);

    this.addressCache.set(paymentToken, { address, privateKey: privateKey.toString('hex') });
    console.log(`[PolygonService] Generated address ${address} for token ${paymentToken.substring(0, 20)}...`);

    return address;
  }

  /**
   * Get payment address for a specific customer (deterministic)
   */
  getPaymentAddressForCustomer(identifier) {
    const privateKey = this.derivePrivateKey(identifier);
    const address = this.deriveEvmAddressFromPrivateKey(privateKey);
    return { address };
  }

  /**
   * Get default payment address (for backward compat)
   */
  getPaymentAddress() {
    return this.deriveEvmAddressFromPrivateKey(this.derivePrivateKey('default'));
  }

  getRequiredConfirmations() { return 128; }
  getConfirmationTime() { return '2-3 minutes'; }
  getEstimatedFee() { return '~$0.01'; }
  getExplorerUrl(address) { return `https://polygonscan.com/address/${address}`; }
  formatAmount(amount) { return (amount / 1000000).toFixed(2); }

  async convertUsdToToken(usd) {
    return {
      amount: usd,
      amountSmallestUnit: Math.floor(usd * 1000000),
      token: 'USDC',
      contract: this.usdcContract
    };
  }

  /**
   * Check payment status using Polygonscan API
   */
  async checkPaymentStatus(address, requiredAmount, options = {}) {
    try {
      const url = `${this.apiUrl}?module=account&action=tokentx&contractaddress=${this.usdcContract}&address=${address}&page=1&offset=100&sort=desc&apikey=${this.apiKey}`;

      const response = await fetch(url);
      const data = await response.json();

      if (data.status !== '1') {
        return {
          totalReceived: 0,
          totalReceivedSmallestUnit: 0,
          confirmations: 0,
          isPaid: false,
          isConfirmed: false,
          transactions: []
        };
      }

      // Filter transactions TO this specific payment address
      const relevantTxs = data.result.filter(tx =>
        tx.to.toLowerCase() === address.toLowerCase()
      );

      if (relevantTxs.length === 0) {
        return {
          totalReceived: 0,
          totalReceivedSmallestUnit: 0,
          confirmations: 0,
          isPaid: false,
          isConfirmed: false,
          transactions: []
        };
      }

      let totalReceivedSmallestUnit = 0;
      let minConfirmations = Infinity;

      const blockResponse = await fetch(`${this.apiUrl}?module=proxy&action=eth_blockNumber&apikey=${this.apiKey}`);
      const blockData = await blockResponse.json();
      const currentBlock = parseInt(blockData.result, 16);

      for (const tx of relevantTxs) {
        totalReceivedSmallestUnit += parseInt(tx.value);
        const txBlock = parseInt(tx.blockNumber);
        const txConfirmations = currentBlock - txBlock + 1;
        minConfirmations = Math.min(minConfirmations, txConfirmations);
      }

      const totalReceived = totalReceivedSmallestUnit / 1000000;
      const requiredWithTolerance = requiredAmount * 0.95;
      const isPaid = totalReceivedSmallestUnit >= requiredWithTolerance;
      const isConfirmed = isPaid && minConfirmations >= this.getRequiredConfirmations();

      return {
        totalReceived,
        totalReceivedSmallestUnit,
        confirmations: minConfirmations === Infinity ? 0 : minConfirmations,
        isPaid,
        isConfirmed,
        transactions: relevantTxs.map(tx => ({
          hash: tx.hash,
          amount: parseInt(tx.value) / 1000000,
          blockNumber: parseInt(tx.blockNumber),
          timestamp: new Date(parseInt(tx.timeStamp) * 1000).toISOString()
        }))
      };
    } catch (error) {
      console.error('Error checking Polygon payment status:', error);
      throw new Error(`Failed to verify payment: ${error.message}`);
    }
  }

  /**
   * Get pricing with unique per-payment address
   */
  async getPricing(credits) {
    const basePricing = await super.getPricing(credits);
    const tokenInfo = await this.convertUsdToToken(basePricing.usd);

    const paymentToken = this.generatePaymentToken();
    const paymentAddress = this.generatePaymentAddress(paymentToken);

    return {
      ...basePricing,
      blockchain: this.blockchain,
      token: 'USDC',
      amount: tokenInfo.amount,
      amountSmallestUnit: tokenInfo.amountSmallestUnit,
      contract: tokenInfo.contract,
      decimals: 6,
      paymentAddress,
      paymentToken,
      requiredConfirmations: this.getRequiredConfirmations(),
      estimatedTime: this.getConfirmationTime(),
      estimatedFee: this.getEstimatedFee(),
      explorerUrl: this.getExplorerUrl(paymentAddress)
    };
  }
}
