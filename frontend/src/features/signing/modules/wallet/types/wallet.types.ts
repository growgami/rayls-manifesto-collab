import { ObjectId } from 'mongodb';

// Blockchain type enum (EVM-compatible chains only)
export type BlockchainType = 'ETH';

// Main wallet interface (database document)
export interface IWallet {
  _id?: ObjectId;
  xId: string;                    // Twitter user ID (unique identifier)
  walletAddress: string;          // Full wallet address
  blockchainType: BlockchainType; // Blockchain network
  createdAt: Date;                // Timestamp of creation
}

// Create type (omit auto-generated fields)
export type IWalletCreate = Omit<IWallet, '_id' | 'createdAt'>;

// Error codes enum
export enum WalletErrorCode {
  UNAUTHORIZED = 'UNAUTHORIZED',
  INVALID_ADDRESS = 'INVALID_ADDRESS',
  INVALID_BLOCKCHAIN = 'INVALID_BLOCKCHAIN',
  WALLET_ALREADY_EXISTS = 'WALLET_ALREADY_EXISTS',
  WALLET_NOT_FOUND = 'WALLET_NOT_FOUND',
  VALIDATION_FAILED = 'VALIDATION_FAILED',
  SERVER_ERROR = 'SERVER_ERROR',
}

// API response types
export interface WalletAPIResponse {
  success: true;
  wallet: IWallet;
}

export interface WalletErrorResponse {
  success: false;
  error: WalletErrorCode;
  message: string;
}

// Validation result type
export interface ValidationResult {
  valid: boolean;
  error?: string;
}
