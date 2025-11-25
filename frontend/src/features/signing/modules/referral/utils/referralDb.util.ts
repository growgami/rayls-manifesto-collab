import { getDatabase } from '@/shared/lib/mongodb.lib';
import { ReferralModel, IReferralCreate } from '@/features/signing/modules/referral/models/referral.model';
import { PositionCounterService } from '@/features/signing/modules/referral/utils/positionCounter.util';
import { KolService } from '@/features/signing/modules/kol/services/kol.service';

export class ReferralDbService {
  static async createReferralRecord(userData: {
    xId: string;
    referralCode: string;
    username: string;
  }): Promise<void> {
    const db = await getDatabase();
    const referralModel = new ReferralModel(db);

    // Check if user is a KOL
    const isKol = await KolService.isKol(userData.xId, userData.username);

    // Get appropriate position based on KOL status
    let position: number;
    let actualIsKol: boolean;

    if (isKol) {
      const kolPosition = await PositionCounterService.getNextKolPosition();
      if (kolPosition <= 75) {
        position = kolPosition;
        actualIsKol = true;
        console.log(`✨ KOL detected: ${userData.username} assigned position ${position}`);
      } else {
        // KOL overflow - treat as regular user
        position = await PositionCounterService.getNextRegularPosition();
        actualIsKol = false;
        console.log(`⚠️ KOL overflow: ${userData.username} assigned regular position ${position}`);
      }
    } else {
      position = await PositionCounterService.getNextRegularPosition();
      actualIsKol = false;
    }

    const referralData: IReferralCreate = {
      xId: userData.xId,
      referralCode: userData.referralCode,
      referredBy: null,
      referralCount: 0,
      linkVisits: 0,
      position: position,
      isKOL: actualIsKol
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