import { getDatabase } from '@/shared/lib/mongodb.lib';
import { CounterModel } from '@/features/signing/modules/referral/models/counter.model';
import { SKIP_RANGES, COUNTER_START_POSITION } from '@/features/signing/config/milestone-boundaries.constants';

export class PositionCounterService {
  private static readonly COUNTER_ID = 'position';

  /**
   * Checks if a position falls within a skip range and returns the jump destination.
   * @param position The position to check
   * @returns The valid position (same if not in skip range, or jumpTo if in range)
   */
  private static getValidPosition(position: number): number {
    for (const range of SKIP_RANGES) {
      if (position >= range.start && position <= range.end) {
        console.log(`Position ${position} is in reserved range ${range.start}-${range.end}. Jumping to ${range.jumpTo}`);
        return range.jumpTo;
      }
    }
    return position;
  }

  /**
   * Gets the next position atomically (positions 301+)
   * Auto-initializes counter starting at 300 if it doesn't exist
   * Automatically skips reserved ranges (501-701, 19800-20000, 49800-50000)
   * @returns The next position number
   */
  static async getNextPosition(): Promise<number> {
    const db = await getDatabase();
    const counterModel = new CounterModel(db);

    // Check if counter exists
    const currentValue = await counterModel.getCurrentValue(this.COUNTER_ID);

    if (currentValue === null || currentValue < COUNTER_START_POSITION) {
      // Counter doesn't exist or is below initial position, initialize
      console.log(`Position counter not initialized, initializing at ${COUNTER_START_POSITION}...`);
      await this.initializeCounter();
    }

    // Get next position atomically
    let nextPosition = await counterModel.getNextSequence(this.COUNTER_ID);

    // Check if we're in a skip range and need to jump
    const validPosition = this.getValidPosition(nextPosition);

    if (validPosition !== nextPosition) {
      // We're in a skip range, update counter to the jump destination - 1
      // (because next call will increment it)
      await counterModel.initializeCounter(this.COUNTER_ID, validPosition - 1);
      nextPosition = validPosition;
    }

    return nextPosition;
  }

  /**
   * Initializes the position counter
   * Starts from 300 (first user will get position 301)
   */
  static async initializeCounter(): Promise<void> {
    const db = await getDatabase();
    const counterModel = new CounterModel(db);

    console.log(`Initializing position counter at ${COUNTER_START_POSITION}`);
    await counterModel.initializeCounter(this.COUNTER_ID, COUNTER_START_POSITION);
  }

  /**
   * Initializes counter from existing referral data
   * Finds the maximum position >= 301 in the referrals collection
   * This ensures new positions continue from where existing data left off
   * Used for migration scenarios
   */
  static async initializeFromExisting(): Promise<void> {
    const db = await getDatabase();
    const referralsCollection = db.collection('referrals');

    // Find the highest position >= 301 (ignore Mythical range 1-300)
    const maxPositionDoc = await referralsCollection
      .find({ position: { $gte: COUNTER_START_POSITION + 1 } })
      .sort({ position: -1 })
      .limit(1)
      .toArray();

    const maxPosition = maxPositionDoc[0]?.position || COUNTER_START_POSITION;

    console.log(`Initializing position counter with max position: ${maxPosition}`);

    // Initialize counter
    const counterModel = new CounterModel(db);
    await counterModel.initializeCounter(this.COUNTER_ID, maxPosition);
  }

  /**
   * Gets the total number of signatures
   * @returns The total signature count (actual number of users who signed)
   */
  static async getTotalSignatures(): Promise<number> {
    const db = await getDatabase();
    const referralsCollection = db.collection('referrals');

    // Simply count the documents in the referrals collection
    // This gives us the actual number of users who have signed
    return await referralsCollection.countDocuments();
  }
}
