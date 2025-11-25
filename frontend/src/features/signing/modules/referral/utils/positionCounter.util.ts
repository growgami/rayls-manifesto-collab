import { getDatabase } from '@/shared/lib/mongodb.lib';
import { CounterModel } from '@/features/signing/modules/referral/models/counter.model';

export class PositionCounterService {
  private static readonly KOL_COUNTER_ID = 'kol_position';
  private static readonly REGULAR_COUNTER_ID = 'regular_position';
  private static readonly KOL_MAX_POSITION = 75;
  private static readonly REGULAR_START_POSITION = 76;

  /**
   * Gets the next KOL position atomically (positions 1-75)
   * Auto-initializes counter if it doesn't exist
   * @returns The next KOL position number
   */
  static async getNextKolPosition(): Promise<number> {
    const db = await getDatabase();
    const counterModel = new CounterModel(db);

    // Check if counter exists
    const currentValue = await counterModel.getCurrentValue(this.KOL_COUNTER_ID);

    if (currentValue === null || currentValue === 0) {
      // Counter doesn't exist or is at 0, initialize
      console.log('KOL counter not initialized, initializing...');
      await this.initializeKolCounter();
    }

    // Get next position atomically
    return await counterModel.getNextSequence(this.KOL_COUNTER_ID);
  }

  /**
   * Gets the next regular user position atomically (positions 76+)
   * Auto-initializes counter starting at 76 if it doesn't exist
   * @returns The next regular user position number
   */
  static async getNextRegularPosition(): Promise<number> {
    const db = await getDatabase();
    const counterModel = new CounterModel(db);

    // Check if counter exists
    const currentValue = await counterModel.getCurrentValue(this.REGULAR_COUNTER_ID);

    if (currentValue === null || currentValue === 0) {
      // Counter doesn't exist or is at 0, initialize from position 75
      console.log('Regular counter not initialized, initializing from position 76...');
      await this.initializeRegularCounter();
    }

    // Get next position atomically
    return await counterModel.getNextSequence(this.REGULAR_COUNTER_ID);
  }

  /**
   * Initializes the KOL counter
   * Starts from 0 (first KOL will get position 1)
   */
  static async initializeKolCounter(): Promise<void> {
    const db = await getDatabase();
    const counterModel = new CounterModel(db);

    console.log('Initializing KOL counter at 0');
    await counterModel.initializeCounter(this.KOL_COUNTER_ID, 0);
  }

  /**
   * Initializes the regular user counter
   * Starts from 75 (first regular user will get position 76)
   */
  static async initializeRegularCounter(): Promise<void> {
    const db = await getDatabase();
    const counterModel = new CounterModel(db);

    console.log(`Initializing regular counter at ${this.REGULAR_START_POSITION - 1}`);
    await counterModel.initializeCounter(this.REGULAR_COUNTER_ID, this.REGULAR_START_POSITION - 1);
  }

  /**
   * Initializes both counters from existing referral data
   * Finds the maximum positions in the referrals collection
   * This ensures new positions continue from where existing data left off
   * Used for migration scenarios
   */
  static async initializeFromExisting(): Promise<void> {
    const db = await getDatabase();
    const referralsCollection = db.collection('referrals');

    // Find the highest KOL position (isKOL = true, position <= 75)
    const maxKolPositionDoc = await referralsCollection
      .find({ isKOL: true, position: { $lte: this.KOL_MAX_POSITION } })
      .sort({ position: -1 })
      .limit(1)
      .toArray();

    const maxKolPosition = maxKolPositionDoc[0]?.position || 0;

    // Find the highest regular position (position >= 76)
    const maxRegularPositionDoc = await referralsCollection
      .find({ position: { $gte: this.REGULAR_START_POSITION } })
      .sort({ position: -1 })
      .limit(1)
      .toArray();

    const maxRegularPosition = maxRegularPositionDoc[0]?.position || (this.REGULAR_START_POSITION - 1);

    console.log(`Initializing KOL counter with max position: ${maxKolPosition}`);
    console.log(`Initializing regular counter with max position: ${maxRegularPosition}`);

    // Initialize both counters
    const counterModel = new CounterModel(db);
    await counterModel.initializeCounter(this.KOL_COUNTER_ID, maxKolPosition);
    await counterModel.initializeCounter(this.REGULAR_COUNTER_ID, maxRegularPosition);
  }

  /**
   * Gets the total number of signatures (sum of both counters)
   * @returns The total signature count
   */
  static async getTotalSignatures(): Promise<number> {
    const db = await getDatabase();
    const counterModel = new CounterModel(db);

    const kolValue = await counterModel.getCurrentValue(this.KOL_COUNTER_ID);
    const regularValue = await counterModel.getCurrentValue(this.REGULAR_COUNTER_ID);

    // If counters don't exist yet, fall back to counting documents
    if (kolValue === null && regularValue === null) {
      const referralsCollection = db.collection('referrals');
      return await referralsCollection.countDocuments();
    }

    // Return sum of both counters (handle null cases)
    const kolCount = kolValue || 0;
    const regularCount = regularValue ? regularValue - this.REGULAR_START_POSITION + 1 : 0;

    return kolCount + regularCount;
  }
}
