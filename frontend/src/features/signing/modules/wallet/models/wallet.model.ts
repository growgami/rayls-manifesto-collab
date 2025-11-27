import { Db, Collection, IndexSpecification } from 'mongodb';
import { IWallet, IWalletCreate } from '../types/wallet.types';
import { WalletValidatorService } from '../services/walletValidator.service';

export class WalletModel {
  private db: Db;
  private collection: Collection<IWallet>;

  constructor(db: Db) {
    this.db = db;
    this.collection = db.collection<IWallet>('wallets');
    this.createIndexes();
  }

  /**
   * Create database indexes
   */
  private async createIndexes(): Promise<void> {
    const indexes: IndexSpecification[] = [
      { xId: 1 },        // Unique index for user lookup
      { createdAt: -1 }, // Descending index for time-based queries
    ];

    const indexOptions = [
      { unique: true, name: 'xId_unique' },
      { name: 'createdAt_desc' },
    ];

    try {
      for (let i = 0; i < indexes.length; i++) {
        await this.collection.createIndex(indexes[i], indexOptions[i]);
      }
    } catch (error) {
      console.error('Error creating wallet indexes:', error);
    }
  }

  /**
   * Create new wallet (one-time only)
   * @throws Error if validation fails or wallet already exists
   */
  async create(walletData: IWalletCreate): Promise<IWallet> {
    // Final validation at database layer
    const validation = WalletValidatorService.validateWalletAddress(
      walletData.walletAddress,
      walletData.blockchainType
    );

    if (!validation.valid) {
      throw new Error(validation.error || 'Invalid wallet address');
    }

    // Check if wallet already exists for this user
    const existing = await this.findByXId(walletData.xId);
    if (existing) {
      throw new Error('Wallet already exists for this user');
    }

    const now = new Date();
    const document: Omit<IWallet, '_id'> = {
      ...walletData,
      createdAt: now,
    };

    const result = await this.collection.insertOne(document as IWallet);
    return { ...document, _id: result.insertedId };
  }

  /**
   * Find wallet by xId (Twitter user ID)
   */
  async findByXId(xId: string): Promise<IWallet | null> {
    return await this.collection.findOne({ xId });
  }

  // NO update or delete methods - enforce immutability
}
