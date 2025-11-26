import { Db, Collection, ObjectId, IndexSpecification } from 'mongodb';

export interface IReferral {
  _id?: ObjectId;
  xId: string;
  referralCode: string;
  referredBy: string | null;
  referralCount: number;
  linkVisits: number;
  position: number;
  isKOL: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export type IReferralCreate = Omit<IReferral, '_id' | 'createdAt' | 'updatedAt'>;

export interface IReferralUpdate extends Partial<Omit<IReferral, '_id' | 'createdAt'>> {
  updatedAt: Date;
}

export class ReferralModel {
  private db: Db;
  private collection: Collection<IReferral>;

  constructor(db: Db) {
    this.db = db;
    this.collection = db.collection<IReferral>('referrals');
    this.createIndexes();
  }

  private async createIndexes(): Promise<void> {
    const indexes: IndexSpecification[] = [
      { xId: 1 },
      { referralCode: 1 },
      { referredBy: 1 },
      { position: 1 },
      { createdAt: -1 },
      { isKOL: 1 }
    ];

    const indexOptions = [
      { unique: true, name: 'xId_unique' },
      { unique: true, name: 'referralCode_unique' },
      { name: 'referredBy_index' },
      { name: 'position_index' },
      { name: 'createdAt_desc' },
      { name: 'isKOL_index' }
    ];

    try {
      for (let i = 0; i < indexes.length; i++) {
        await this.collection.createIndex(indexes[i], indexOptions[i]);
      }
    } catch (error) {
      console.error('Error creating indexes:', error);
    }
  }

  async create(referralData: IReferralCreate): Promise<IReferral> {
    const now = new Date();
    const document: Omit<IReferral, '_id'> = {
      ...referralData,
      createdAt: now,
      updatedAt: now
    };

    const result = await this.collection.insertOne(document as IReferral);
    return { ...document, _id: result.insertedId };
  }

  async findById(id: string | ObjectId): Promise<IReferral | null> {
    return await this.collection.findOne({ _id: new ObjectId(id) });
  }

  async findByXId(xId: string): Promise<IReferral | null> {
    return await this.collection.findOne({ xId });
  }

  async findByReferralCode(referralCode: string): Promise<IReferral | null> {
    return await this.collection.findOne({ referralCode });
  }

  async findByReferrer(referredBy: string): Promise<IReferral[]> {
    return await this.collection.find({ referredBy }).toArray();
  }

  async incrementReferralCountByXId(xId: string): Promise<IReferral | null> {
    const result = await this.collection.findOneAndUpdate(
      { xId },
      {
        $inc: { referralCount: 1 },
        $set: { updatedAt: new Date() }
      },
      { returnDocument: 'after' }
    );
    return result || null;
  }

  async createWithReferrer(referralData: IReferralCreate, referrerXId: string): Promise<{ newUser: IReferral; referrer: IReferral | null }> {
    const now = new Date();
    const document: Omit<IReferral, '_id'> = {
      ...referralData,
      referredBy: referrerXId,
      createdAt: now,
      updatedAt: now
    };

    const result = await this.collection.insertOne(document as IReferral);
    const newUser = { ...document, _id: result.insertedId };

    const referrer = await this.incrementReferralCountByXId(referrerXId);

    return { newUser, referrer };
  }

  async updateById(id: string | ObjectId, updateData: IReferralUpdate): Promise<IReferral | null> {
    const result = await this.collection.findOneAndUpdate(
      { _id: new ObjectId(id) },
      { 
        $set: { 
          ...updateData, 
          updatedAt: new Date() 
        } 
      },
      { returnDocument: 'after' }
    );
    return result || null;
  }

  async incrementReferralCount(id: string | ObjectId): Promise<IReferral | null> {
    const result = await this.collection.findOneAndUpdate(
      { _id: new ObjectId(id) },
      { 
        $inc: { referralCount: 1 },
        $set: { updatedAt: new Date() }
      },
      { returnDocument: 'after' }
    );
    return result || null;
  }

  async incrementLinkVisits(referralCode: string): Promise<IReferral | null> {
    const result = await this.collection.findOneAndUpdate(
      { referralCode },
      { 
        $inc: { linkVisits: 1 },
        $set: { updatedAt: new Date() }
      },
      { returnDocument: 'after' }
    );
    return result || null;
  }

  async deleteById(id: string | ObjectId): Promise<boolean> {
    const result = await this.collection.deleteOne({ _id: new ObjectId(id) });
    return result.deletedCount === 1;
  }

  async getLeaderboard(limit: number = 100): Promise<IReferral[]> {
    return await this.collection
      .find({})
      .sort({ position: 1 })
      .limit(limit)
      .toArray();
  }

  async getReferralStats(referralCode: string): Promise<{ 
    referral: IReferral | null; 
    referredUsers: IReferral[];
    totalReferred: number;
  }> {
    const referral = await this.findByReferralCode(referralCode);
    if (!referral) {
      return { referral: null, referredUsers: [], totalReferred: 0 };
    }

    // Find users who were referred by this referral's xId
    const referredUsers = await this.findByReferrer(referral.referralCode);
    return {
      referral,
      referredUsers,
      totalReferred: referredUsers.length
    };
  }
}