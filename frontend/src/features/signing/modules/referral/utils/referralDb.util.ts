import { getDatabase } from '@/shared/lib/mongodb.lib';
import { ReferralModel, IReferralCreate } from '@/features/signing/modules/referral/models/referral.model';
import { PositionCounterService } from '@/features/signing/modules/referral/utils/positionCounter.util';
import { KolCheckService } from '@/features/signing/modules/referral/services/kolCheck.service';

export interface ReferralCreationResult {
  success: boolean;
  alreadyExists: boolean;
  position?: number;
  referralCode?: string;
}

export class ReferralDbService {
  static async createReferralRecord(userData: {
    xId: string;
    referralCode: string;
    username: string;
    referredByCode?: string;
  }): Promise<ReferralCreationResult> {
    const db = await getDatabase();
    const referralModel = new ReferralModel(db);

    // CRITICAL: Check if referral already exists to prevent duplicate key errors
    const existingReferral = await referralModel.findByXId(userData.xId);
    if (existingReferral) {
      console.log(`✅ [IDEMPOTENT] Referral already exists for xId: ${userData.xId} (position: ${existingReferral.position}) - treating as success`);
      return {
        success: true,
        alreadyExists: true,
        position: existingReferral.position,
        referralCode: existingReferral.referralCode
      };
    }

    // Check if user is a KOL
    const kolEntry = KolCheckService.checkIsKol(userData.xId);
    const isKOL = !!kolEntry;

    // Use KOL position if available, otherwise get next auto-increment position
    let position: number;
    if (kolEntry) {
      position = kolEntry.position;
      console.log(`👑 KOL detected: ${userData.username} (xId: ${userData.xId}) - Assigned position ${position}`);
    } else {
      position = await PositionCounterService.getNextPosition();
      console.log(`📝 Regular user: ${userData.username} - Assigned position ${position}`);
    }

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
      isKOL: isKOL // Set to true for KOLs based on kols.json
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

    return {
      success: true,
      alreadyExists: false,
      position,
      referralCode: userData.referralCode
    };
  }

  static async checkReferralCodeExists(referralCode: string): Promise<boolean> {
    const db = await getDatabase();
    const referralModel = new ReferralModel(db);
    const existingReferral = await referralModel.findByReferralCode(referralCode);
    return !!existingReferral;
  }
}