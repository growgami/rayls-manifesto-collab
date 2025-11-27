import { BlockchainType, ValidationResult } from '../types/wallet.types';

export class WalletValidatorService {
  // EVM address pattern: 0x + 40 hexadecimal characters
  private static readonly EVM_PATTERN = /^0x[a-fA-F0-9]{40}$/;

  /**
   * Validate EVM-compatible address (Ethereum, Polygon, BSC, Arbitrum, etc.)
   */
  static validateEVMAddress(address: string): ValidationResult {
    if (!address) {
      return {
        valid: false,
        error: 'EVM-compatible wallet address is required'
      };
    }

    if (!address.startsWith('0x')) {
      return {
        valid: false,
        error: 'EVM address must start with "0x"',
      };
    }

    if (address.length !== 42) {
      return {
        valid: false,
        error: 'EVM address must be exactly 42 characters (0x + 40 hex characters)',
      };
    }

    if (!this.EVM_PATTERN.test(address)) {
      return {
        valid: false,
        error: 'Invalid EVM address format. Must contain only hexadecimal characters (0-9, a-f, A-F)',
      };
    }

    return { valid: true };
  }

  /**
   * Validate wallet address (EVM-only)
   */
  static validateWalletAddress(
    address: string,
    blockchainType: BlockchainType
  ): ValidationResult {
    if (blockchainType !== 'ETH') {
      return {
        valid: false,
        error: 'Only EVM-compatible addresses are supported'
      };
    }
    return this.validateEVMAddress(address);
  }

  /**
   * Validate blockchain type (ETH only)
   */
  static isValidBlockchainType(type: string): type is BlockchainType {
    return type === 'ETH';
  }
}
