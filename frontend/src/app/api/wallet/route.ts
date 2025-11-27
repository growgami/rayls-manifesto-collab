import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from '@/features/signing/modules/auth/lib/auth.lib';
import { getDatabase } from '@/shared/lib/mongodb.lib';
import { WalletModel } from '@/features/signing/modules/wallet/models/wallet.model';
import { WalletValidatorService } from '@/features/signing/modules/wallet/services/walletValidator.service';
import { WalletErrorCode, BlockchainType } from '@/features/signing/modules/wallet/types/wallet.types';
import { DTOService } from '@/shared/services/dto.service';

/**
 * GET handler removed - wallet data now comes from session
 * This eliminates sensitive data exposure in network tab
 */

/**
 * POST /api/wallet
 * Create new wallet (one-time only)
 */
export async function POST(request: NextRequest) {
  try {
    // Auth check
    const session = await getServerSession();
    if (!session || !session.user?.twitterData) {
      return NextResponse.json(
        {
          success: false,
          error: WalletErrorCode.UNAUTHORIZED,
          message: 'Authentication required'
        },
        { status: 401 }
      );
    }

    const xId = session.user.twitterData.id;
    const body = await request.json();
    const { walletAddress, blockchainType } = body;

    // Validate blockchain type (ETH only)
    if (!WalletValidatorService.isValidBlockchainType(blockchainType)) {
      return NextResponse.json(
        {
          success: false,
          error: WalletErrorCode.INVALID_BLOCKCHAIN,
          message: 'Only EVM-compatible addresses (ETH) are supported'
        },
        { status: 400 }
      );
    }

    // Validate wallet address (server-side validation layer)
    const validation = WalletValidatorService.validateWalletAddress(
      walletAddress,
      blockchainType as BlockchainType
    );

    if (!validation.valid) {
      return NextResponse.json(
        {
          success: false,
          error: WalletErrorCode.INVALID_ADDRESS,
          message: validation.error || 'Invalid wallet address'
        },
        { status: 400 }
      );
    }

    const db = await getDatabase();
    const walletModel = new WalletModel(db);

    // Check if wallet already exists
    const existing = await walletModel.findByXId(xId);
    if (existing) {
      return NextResponse.json(
        {
          success: false,
          error: WalletErrorCode.WALLET_ALREADY_EXISTS,
          message: 'You have already submitted a wallet address'
        },
        { status: 409 }
      );
    }

    // Create wallet
    const wallet = await walletModel.create({
      xId,
      walletAddress,
      blockchainType: blockchainType as BlockchainType,
    });

    // Use DTO service to sanitize response (removes xId and _id)
    return NextResponse.json(
      {
        success: true,
        wallet: DTOService.sanitizeWallet(wallet),
      },
      { status: 201 }
    );
  } catch (error) {
    console.error('Error creating wallet:', error);

    // Handle specific error cases
    if (error instanceof Error) {
      if (error.message.includes('already exists')) {
        return NextResponse.json(
          {
            success: false,
            error: WalletErrorCode.WALLET_ALREADY_EXISTS,
            message: error.message
          },
          { status: 409 }
        );
      }
      if (error.message.includes('Invalid')) {
        return NextResponse.json(
          {
            success: false,
            error: WalletErrorCode.VALIDATION_FAILED,
            message: error.message
          },
          { status: 400 }
        );
      }
    }

    return NextResponse.json(
      {
        success: false,
        error: WalletErrorCode.SERVER_ERROR,
        message: 'Failed to create wallet'
      },
      { status: 500 }
    );
  }
}
