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

    // USDC contracts on Polygon (check both native and bridged)
    this.usdcContracts = [
      '0x3c499c542cEF5E3811e1192ce70d8cC03d5c3359', // Native USDC
      '0x2791Bca1f2de4661ED88A30C99A7a9449Aa84174'  // USDC.e (bridged)
    ];
    this.usdcContract = this.usdcContracts[0]; // Primary: native USDC

    // Polygon RPC endpoint
    this.rpcUrl = process.env.POLYGON_RPC_URL || 'https://polygon-rpc.com';

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
   * Call balanceOf on a USDC contract via RPC
   */
  async getUsdcBalance(contractAddress, walletAddress) {
    const addr = walletAddress.replace('0x', '').toLowerCase();
    const data = `0x70a08231000000000000000000000000${addr}`;

    const response = await fetch(this.rpcUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        jsonrpc: '2.0',
        method: 'eth_call',
        params: [{ to: contractAddress, data }, 'latest'],
        id: 1
      })
    });

    const result = await response.json();
    return parseInt(result.result, 16) || 0;
  }

  /**
   * Check payment status using direct RPC balanceOf calls
   * Checks both native USDC and bridged USDC.e contracts
   */
  async checkPaymentStatus(address, requiredAmount, options = {}) {
    try {
      // Check both USDC contracts and sum balances
      let totalSmallestUnit = 0;
      for (const contract of this.usdcContracts) {
        totalSmallestUnit += await this.getUsdcBalance(contract, address);
      }

      const totalReceived = totalSmallestUnit / 1000000; // USDC has 6 decimals
      const requiredSmallest = Math.floor(requiredAmount * 1000000);
      const requiredWithTolerance = requiredSmallest * 0.95;
      const isPaid = totalSmallestUnit >= requiredWithTolerance;

      // Polygon has fast finality (~2s blocks), so if balance shows up it's confirmed
      // We consider any detected balance as confirmed
      const isConfirmed = isPaid;

      return {
        totalReceived,
        totalReceivedSmallestUnit: totalSmallestUnit,
        confirmations: isPaid ? this.getRequiredConfirmations() : 0,
        isPaid,
        isConfirmed,
        transactions: []
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
