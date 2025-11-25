import { getDatabase } from '@/shared/lib/mongodb.lib';
import { CounterModel } from '@/features/signing/modules/referral/models/counter.model';

export class PositionCounterService {
  private static readonly COUNTER_ID = 'referral_position';

  /**
   * Gets the next position number atomically
   * Auto-initializes counter from existing data if it doesn't exist
   * @returns The next position number
   */
  static async getNextPosition(): Promise<number> {
    const db = await getDatabase();
    const counterModel = new CounterModel(db);

    // Check if counter exists
    const currentValue = await counterModel.getCurrentValue(this.COUNTER_ID);

    if (currentValue === null || currentValue === 0) {
      // Counter doesn't exist or is at 0, initialize from existing data
      console.log('Counter not initialized, initializing from existing referrals...');
      await this.initializeFromExisting();
    }

    // Get next position atomically
    return await counterModel.getNextSequence(this.COUNTER_ID);
  }

  /**
   * Initializes the counter from existing referral data
   * Finds the maximum position in the referrals collection and sets counter to that value
   * This ensures new positions continue from where existing data left off
   */
  static async initializeFromExisting(): Promise<void> {
    const db = await getDatabase();
    const referralsCollection = db.collection('referrals');

    // Find the highest position in existing referrals
    const maxPositionDoc = await referralsCollection
      .find({})
      .sort({ position: -1 })
      .limit(1)
      .toArray();

    const maxPosition = maxPositionDoc[0]?.position || 0;

    console.log(`Initializing counter with max position: ${maxPosition}`);

    // Initialize counter with max position
    const counterModel = new CounterModel(db);
    await counterModel.initializeCounter(this.COUNTER_ID, maxPosition);
  }

  /**
   * Gets the total number of signatures (current counter value)
   * @returns The total signature count
   */
  static async getTotalSignatures(): Promise<number> {
    const db = await getDatabase();
    const counterModel = new CounterModel(db);

    const currentValue = await counterModel.getCurrentValue(this.COUNTER_ID);

    // If counter doesn't exist yet, fall back to counting documents
    if (currentValue === null) {
      const referralsCollection = db.collection('referrals');
      return await referralsCollection.countDocuments();
    }

    return currentValue;
  }
}
