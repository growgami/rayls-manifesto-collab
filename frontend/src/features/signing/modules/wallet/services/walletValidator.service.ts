import { BlockchainType, ValidationResult } from '../types/wallet.types';

export class WalletValidatorService {
  // Regex patterns
  private static readonly ETHEREUM_PATTERN = /^0x[a-fA-F0-9]{40}$/;
  private static readonly SOLANA_PATTERN = /^[1-9A-HJ-NP-Za-km-z]{32,44}$/;
  private static readonly BITCOIN_PATTERN = /^(1|3|bc1)[a-zA-HJ-NP-Z0-9]{25,62}$/;

  /**
   * Validate Ethereum/EVM address
   */
  static validateEthereumAddress(address: string): ValidationResult {
    if (!address) {
      return { valid: false, error: 'Ethereum address is required' };
    }
    if (!this.ETHEREUM_PATTERN.test(address)) {
      return {
        valid: false,
        error: 'Invalid Ethereum address format (must be 0x + 40 hex characters)',
      };
    }
    return { valid: true };
  }

  /**
   * Validate Solana address
   */
  static validateSolanaAddress(address: string): ValidationResult {
    if (!address) {
      return { valid: false, error: 'Solana address is required' };
    }
    if (!this.SOLANA_PATTERN.test(address)) {
      return {
        valid: false,
        error: 'Invalid Solana address format (32-44 base58 characters)',
      };
    }
    return { valid: true };
  }

  /**
   * Validate Bitcoin address (P2PKH, P2SH, Bech32)
   */
  static validateBitcoinAddress(address: string): ValidationResult {
    if (!address) {
      return { valid: false, error: 'Bitcoin address is required' };
    }
    if (!this.BITCOIN_PATTERN.test(address)) {
      return {
        valid: false,
        error: 'Invalid Bitcoin address format',
      };
    }
    return { valid: true };
  }

  /**
   * Validate wallet address based on blockchain type
   */
  static validateWalletAddress(
    address: string,
    blockchainType: BlockchainType
  ): ValidationResult {
    switch (blockchainType) {
      case 'ETH':
        return this.validateEthereumAddress(address);
      case 'SOL':
        return this.validateSolanaAddress(address);
      case 'BTC':
        return this.validateBitcoinAddress(address);
      default:
        return { valid: false, error: 'Invalid blockchain type' };
    }
  }

  /**
   * Validate blockchain type
   */
  static isValidBlockchainType(type: string): type is BlockchainType {
    return type === 'ETH' || type === 'SOL' || type === 'BTC';
  }
}
