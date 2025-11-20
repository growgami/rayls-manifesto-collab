import { Db, Collection, ObjectId, IndexSpecification } from 'mongodb';

export interface IReferral {
  _id?: ObjectId;
  email: string;
  referralCode: string;
  referredBy: string | null;
  referralCount: number;
  linkVisits: number;
  position: number;
  maxTarget: number;
  apiKey: string;
  ipAddress: string;
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
      { email: 1 },
      { referralCode: 1 },
      { apiKey: 1 },
      { referredBy: 1 },
      { position: 1 },
      { createdAt: -1 },
      { email: 1, referralCode: 1 },
      { ipAddress: 1 }
    ];

    const indexOptions = [
      { unique: true, name: 'email_unique' },
      { unique: true, name: 'referralCode_unique' },
      { unique: true, name: 'apiKey_unique' },
      { name: 'referredBy_index' },
      { name: 'position_index' },
      { name: 'createdAt_desc' },
      { unique: true, name: 'email_referralCode_compound' },
      { name: 'ipAddress_index' }
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

  async findByEmail(email: string): Promise<IReferral | null> {
    return await this.collection.findOne({ email });
  }

  async findByReferralCode(referralCode: string): Promise<IReferral | null> {
    return await this.collection.findOne({ referralCode });
  }

  async findByApiKey(apiKey: string): Promise<IReferral | null> {
    return await this.collection.findOne({ apiKey });
  }

  async findByIpAddress(ipAddress: string): Promise<IReferral | null> {
    return await this.collection.findOne({ ipAddress });
  }

  async countByIpAddressInTimeRange(ipAddress: string, hoursBack: number = 1): Promise<number> {
    const timeThreshold = new Date(Date.now() - (hoursBack * 60 * 60 * 1000));
    return await this.collection.countDocuments({ 
      ipAddress,
      createdAt: { $gte: timeThreshold }
    });
  }

  async findByReferrer(referredBy: string): Promise<IReferral[]> {
    return await this.collection.find({ referredBy }).toArray();
  }

  async incrementReferralCountByEmail(referrerEmail: string): Promise<IReferral | null> {
    const result = await this.collection.findOneAndUpdate(
      { email: referrerEmail },
      { 
        $inc: { referralCount: 1 },
        $set: { updatedAt: new Date() }
      },
      { returnDocument: 'after' }
    );
    return result || null;
  }

  async createWithReferrer(referralData: IReferralCreate, referrerEmail: string): Promise<{ newUser: IReferral; referrer: IReferral | null }> {
    const now = new Date();
    const document: Omit<IReferral, '_id'> = {
      ...referralData,
      referredBy: referrerEmail,
      createdAt: now,
      updatedAt: now
    };

    const result = await this.collection.insertOne(document as IReferral);
    const newUser = { ...document, _id: result.insertedId };
    
    const referrer = await this.incrementReferralCountByEmail(referrerEmail);
    
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

    const referredUsers = await this.findByReferrer(referral.email);
    return {
      referral,
      referredUsers,
      totalReferred: referredUsers.length
    };
  }
}