import { getDatabase } from '@/shared/lib/mongodb.lib';
import { ReferralModel, IReferralCreate } from '@/features/signing/modules/referral/models/referral.model';
import { PositionCounterService } from '@/features/signing/modules/referral/utils/positionCounter.util';

export class ReferralDbService {
  static async createReferralRecord(userData: {
    xId: string;
    referralCode: string;
    username: string;
    referredByCode?: string;
  }): Promise<void> {
    const db = await getDatabase();
    const referralModel = new ReferralModel(db);

    // Get next position (unified counter starting at 501)
    const position = await PositionCounterService.getNextPosition();

    // Check if user was referred
    let referredBy: string | null = null;
    let referrerXId: string | null = null;
    if (userData.referredByCode) {
      console.log(`🔍 Looking up referrer with code: ${userData.referredByCode}`);
      const referrer = await referralModel.findByReferralCode(userData.referredByCode);
      if (referrer) {
        referredBy = referrer.referralCode;
        referrerXId = referrer.xId;
        console.log(`✅ Found referrer - User: ${userData.username} referred by ${referrer.referralCode} (xId: ${referrer.xId})`);
      } else {
        console.warn(`⚠️ Referrer not found for code: ${userData.referredByCode}`);
      }
    }

    const referralData: IReferralCreate = {
      xId: userData.xId,
      referralCode: userData.referralCode,
      referredBy: referredBy,
      referralCount: 0,
      linkVisits: 0,
      position: position,
      isKOL: false // Deprecated field, kept for backward compatibility
    };

    console.log(`📝 Creating referral record:`, {
      xId: userData.xId,
      username: userData.username,
      referralCode: userData.referralCode,
      position,
      referredBy: referredBy || 'none'
    });

    const newUser = await referralModel.create(referralData);
    console.log(`✅ Referral record created successfully for ${userData.username} at position ${position}`);

    // Increment referrer's count if they exist
    if (referrerXId) {
      try {
        console.log(`🔄 Incrementing referral count for referrer xId: ${referrerXId}`);
        const updated = await referralModel.incrementReferralCountByXId(referrerXId);
        if (updated) {
          console.log(`✅ Successfully incremented referral count for ${referrerXId}. New count: ${updated.referralCount}`);
        } else {
          console.warn(`⚠️ Failed to find referrer with xId: ${referrerXId} for increment`);
        }
      } catch (error) {
        console.error('❌ Error incrementing referrer count:', error);
        // Don't fail the whole operation
      }
    }
  }

  static async checkReferralCodeExists(referralCode: string): Promise<boolean> {
    const db = await getDatabase();
    const referralModel = new ReferralModel(db);
    const existingReferral = await referralModel.findByReferralCode(referralCode);
    return !!existingReferral;
  }
}