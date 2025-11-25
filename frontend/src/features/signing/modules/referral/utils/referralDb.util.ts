import { getDatabase } from '@/shared/lib/mongodb.lib';
import { ReferralModel, IReferralCreate } from '@/features/signing/modules/referral/models/referral.model';
import { PositionCounterService } from '@/features/signing/modules/referral/utils/positionCounter.util';

export class ReferralDbService {
  static async createReferralRecord(userData: {
    xId: string;
    referralCode: string;
  }): Promise<void> {
    const db = await getDatabase();
    const referralModel = new ReferralModel(db);

    // Get next position atomically (fixes race condition)
    const position = await PositionCounterService.getNextPosition();

    const referralData: IReferralCreate = {
      xId: userData.xId,
      referralCode: userData.referralCode,
      referredBy: null,
      referralCount: 0,
      linkVisits: 0,
      position: position
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