import { getDatabase } from '@/shared/lib/mongodb.lib';
import { ReferralModel, IReferralCreate } from '@/features/referral/models/referral.model';

export class ReferralDbService {
  static async createReferralRecord(userData: {
    xId: string;
    referralCode: string;
  }): Promise<void> {
    const db = await getDatabase();
    const referralModel = new ReferralModel(db);

    // Calculate position based on total referrals
    const referralsCollection = db.collection('referrals');
    const totalReferrals = await referralsCollection.countDocuments();

    const referralData: IReferralCreate = {
      xId: userData.xId,
      referralCode: userData.referralCode,
      referredBy: null,
      referralCount: 0,
      linkVisits: 0,
      position: totalReferrals + 1
    };

    await referralModel.create(referralData);
  }

  static async checkReferralCodeExists(referralCode: string): Promise<boolean> {
    const db = await getDatabase();
    const referralModel = new ReferralModel(db);
    const existingReferral = await referralModel.findByReferralCode(referralCode);
    return !!existingReferral;
  }
}