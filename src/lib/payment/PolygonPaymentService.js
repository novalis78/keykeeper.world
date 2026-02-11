/**
 * Polygon Payment Service
 * Handles USDC payments on Polygon network
 * Uses BIP32 HD wallet derivation for unique per-payment addresses
 */

import crypto from 'crypto';
import { BasePaymentService } from './BasePaymentService.js';
import BIP32Factory from 'bip32';
import * as ecc from 'tiny-secp256k1';
import { keccak_256 } from '@noble/hashes/sha3';

// Initialize BIP32 with secp256k1
const bip32 = BIP32Factory(ecc);

export class PolygonPaymentService extends BasePaymentService {
  constructor(config = {}) {
    super(config);
    this.blockchain = 'polygon';
    this.nativeToken = 'MATIC';

    // EVM xpub for HD address derivation (m/44'/60'/0')
    this.xpub = process.env.EVM_XPUB || 'xpub6DJGAZykKQ4XNDseX3oJ9g499RqBqHmFrR97i56w3msfgE3LiZUNG6xkhoqtnbEWFm7TgyUqEJkDVmbXdhHz4EXhM4GdPXG727mhd8fvHUU';

    // USDC contract on Polygon
    this.usdcContract = '0x2791Bca1f2de4661ED88A30C99A7a9449Aa84174';

    // Polygonscan API (free tier)
    this.apiKey = process.env.POLYGONSCAN_API_KEY || 'YourApiKeyToken';
    this.apiUrl = 'https://api.polygonscan.com/api';

    // Address cache: paymentToken -> { address, index }
    this.addressCache = new Map();
  }

  /**
   * Derive a deterministic index from an identifier (paymentToken, agentId, etc.)
   */
  deriveIndexFromIdentifier(identifier) {
    const hash = crypto.createHash('sha256').update(identifier).digest();
    return hash.readUInt32BE(0) % 2147483647; // Keep under BIP32 limit
  }

  /**
   * Derive an EVM (Ethereum/Polygon) address from the xpub at a given index
   * Uses BIP32 derivation + keccak256 for address computation
   */
  deriveEvmAddress(index) {
    // Parse xpub and derive child key: m/0/index (external chain)
    const node = bip32.fromBase58(this.xpub);
    const child = node.derive(0).derive(index);

    // Get uncompressed public key (65 bytes, starts with 0x04)
    const uncompressed = Buffer.from(ecc.pointCompress(child.publicKey, false));

    // Keccak256 of public key bytes (without the 0x04 prefix)
    const hash = keccak_256(uncompressed.slice(1));

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
    const hashHex = Buffer.from(keccak_256(lower)).toString('hex');

    let checksummed = '0x';
    for (let i = 0; i < 40; i++) {
      checksummed += parseInt(hashHex[i], 16) >= 8
        ? lower[i].toUpperCase()
        : lower[i];
    }
    return checksummed;
  }

  /**
   * Generate a unique payment address for a specific payment/agent
   * Each payment gets its own derived address (like Bitcoin)
   */
  generatePaymentAddress(paymentToken, identifier = null) {
    if (this.addressCache.has(paymentToken)) {
      return this.addressCache.get(paymentToken).address;
    }

    const index = this.deriveIndexFromIdentifier(identifier || paymentToken);
    const address = this.deriveEvmAddress(index);

    this.addressCache.set(paymentToken, { address, index });
    console.log(`[PolygonService] Generated address ${address} at index ${index} for token ${paymentToken.substring(0, 20)}...`);

    return address;
  }

  /**
   * Get payment address for a specific customer (deterministic)
   */
  getPaymentAddressForCustomer(identifier) {
    const index = this.deriveIndexFromIdentifier(identifier);
    const address = this.deriveEvmAddress(index);
    return { address, index };
  }

  /**
   * Get default payment address (index 0, for backward compat)
   */
  getPaymentAddress() {
    return this.deriveEvmAddress(0);
  }

  /**
   * Get required confirmations (128 blocks ~2-3 minutes on Polygon)
   */
  getRequiredConfirmations() {
    return 128;
  }

  /**
   * Get estimated confirmation time
   */
  getConfirmationTime() {
    return '2-3 minutes';
  }

  /**
   * Get estimated gas fee
   */
  getEstimatedFee() {
    return '~$0.01';
  }

  /**
   * Get blockchain explorer URL
   */
  getExplorerUrl(address) {
    return `https://polygonscan.com/address/${address}`;
  }

  /**
   * Format amount for display
   */
  formatAmount(amount) {
    // USDC has 6 decimals
    return (amount / 1000000).toFixed(2);
  }

  /**
   * Convert USD to USDC (1:1 for stablecoins)
   */
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
   * Checks for USDC transfers to the specific derived address
   */
  async checkPaymentStatus(address, requiredAmount, options = {}) {
    try {
      // Get USDC token transfers to the specific payment address
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

      // Sum up all USDC received
      let totalReceivedSmallestUnit = 0;
      let minConfirmations = Infinity;

      // Get current block number
      const blockResponse = await fetch(`${this.apiUrl}?module=proxy&action=eth_blockNumber&apikey=${this.apiKey}`);
      const blockData = await blockResponse.json();
      const currentBlock = parseInt(blockData.result, 16);

      for (const tx of relevantTxs) {
        totalReceivedSmallestUnit += parseInt(tx.value);
        const txBlock = parseInt(tx.blockNumber);
        const txConfirmations = currentBlock - txBlock + 1;
        minConfirmations = Math.min(minConfirmations, txConfirmations);
      }

      const totalReceived = totalReceivedSmallestUnit / 1000000; // Convert from 6 decimals
      const requiredWithTolerance = requiredAmount * 0.95; // 5% tolerance
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

    // Generate unique payment address for this payment
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
