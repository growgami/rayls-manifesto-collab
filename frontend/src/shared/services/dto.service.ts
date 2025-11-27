/**
 * DTO Sanitization Service
 *
 * Defense-in-depth layer that strips sensitive fields from database models
 * before sending responses to clients.
 *
 * Purpose: Prevent accidental exposure of internal IDs, user identifiers,
 * or other sensitive data in API responses.
 */

import { IWallet } from '@/features/signing/modules/wallet/types/wallet.types';
import { WalletDTO } from '@/shared/types/dto.types';

/**
 * DTO Sanitizer Service
 *
 * Each method takes a full database model and returns only the safe fields
 * that are appropriate for client consumption.
 */
export class DTOService {
  /**
   * Sanitize wallet data for client response
   *
   * Removes: xId (Twitter user ID), _id (database ID)
   * Keeps: Only the wallet address, blockchain type, and creation date
   */
  static sanitizeWallet(wallet: IWallet): WalletDTO {
    return {
      walletAddress: wallet.walletAddress,
      blockchainType: wallet.blockchainType,
      createdAt: wallet.createdAt,
      // xId and _id deliberately excluded for security
    };
  }

  /**
   * Sanitize multiple wallets
   * Useful for batch operations or lists
   */
  static sanitizeWallets(wallets: IWallet[]): WalletDTO[] {
    return wallets.map(wallet => this.sanitizeWallet(wallet));
  }
}
