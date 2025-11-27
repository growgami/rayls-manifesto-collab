/**
 * Data Transfer Objects (DTOs) for API Responses
 *
 * These types define the MAXIMUM data that should ever be sent to the client.
 * They explicitly exclude sensitive fields like database IDs and internal identifiers.
 *
 * Security principle: If a field isn't in the DTO, it can't be leaked.
 */

import { BlockchainType } from '@/features/signing/modules/wallet/types/wallet.types';

/**
 * Wallet DTO - Safe subset of wallet data for client
 * NEVER include: xId, _id, or any internal database identifiers
 */
export interface WalletDTO {
  walletAddress: string;
  blockchainType: BlockchainType;
  createdAt: Date;
}

/**
 * Public aggregate data (signature count)
 * Safe to expose - no user-specific information
 */
export interface PublicCountDTO {
  success: boolean;
  count: number;
}

/**
 * API Response wrapper
 * Standard format for all API responses
 */
export interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}
