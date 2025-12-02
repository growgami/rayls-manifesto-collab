import { getDatabase } from '@/shared/lib/mongodb.lib';
import { CounterModel } from '@/features/signing/modules/referral/models/counter.model';
import { MILESTONE_BOUNDARIES } from '@/features/signing/config/milestone-boundaries.constants';

export class PositionCounterService {
  private static readonly COUNTER_ID = 'position';
  private static readonly INITIAL_POSITION = 500; // First user gets position 501

  /**
   * Checks if position is at a milestone boundary and returns next valid position
   * @param position The current position to check
   * @returns The next valid position (same if not at boundary, or skipped to next milestone)
   */
  private static getNextValidPosition(position: number): number {
    for (const boundary of MILESTONE_BOUNDARIES) {
      if (position === boundary.max) {
        console.log(`Position ${position} hit milestone boundary. Skipping to ${boundary.nextStart}`);
        return boundary.nextStart;
      }
    }
    return position;
  }

  /**
   * Gets the next position atomically (positions 501+)
   * Auto-initializes counter starting at 500 if it doesn't exist
   * Automatically skips reserved gaps between milestones
   * @returns The next position number
   */
  static async getNextPosition(): Promise<number> {
    const db = await getDatabase();
    const counterModel = new CounterModel(db);

    // Check if counter exists
    const currentValue = await counterModel.getCurrentValue(this.COUNTER_ID);

    if (currentValue === null || currentValue < this.INITIAL_POSITION) {
      // Counter doesn't exist or is below initial position, initialize
      console.log('Position counter not initialized, initializing at 500...');
      await this.initializeCounter();
    }

    // Get next position atomically
    let nextPosition = await counterModel.getNextSequence(this.COUNTER_ID);

    // Check if we hit a milestone boundary and need to skip gap
    const validPosition = this.getNextValidPosition(nextPosition);

    if (validPosition !== nextPosition) {
      // We hit a boundary, update counter to the new milestone start - 1
      // (because next call will increment it)
      await counterModel.initializeCounter(this.COUNTER_ID, validPosition - 1);
      nextPosition = validPosition;
    }

    return nextPosition;
  }

  /**
   * Initializes the position counter
   * Starts from 500 (first user will get position 501)
   */
  static async initializeCounter(): Promise<void> {
    const db = await getDatabase();
    const counterModel = new CounterModel(db);

    console.log('Initializing position counter at 500');
    await counterModel.initializeCounter(this.COUNTER_ID, this.INITIAL_POSITION);
  }

  /**
   * Initializes counter from existing referral data
   * Finds the maximum position >= 501 in the referrals collection
   * This ensures new positions continue from where existing data left off
   * Used for migration scenarios
   */
  static async initializeFromExisting(): Promise<void> {
    const db = await getDatabase();
    const referralsCollection = db.collection('referrals');

    // Find the highest position >= 501 (ignore reserved range 1-500)
    const maxPositionDoc = await referralsCollection
      .find({ position: { $gte: 501 } })
      .sort({ position: -1 })
      .limit(1)
      .toArray();

    const maxPosition = maxPositionDoc[0]?.position || this.INITIAL_POSITION;

    console.log(`Initializing position counter with max position: ${maxPosition}`);

    // Initialize counter
    const counterModel = new CounterModel(db);
    await counterModel.initializeCounter(this.COUNTER_ID, maxPosition);
  }

  /**
   * Gets the total number of signatures from the position counter
   * @returns The current position counter value (represents total signatures)
   */
  static async getTotalSignatures(): Promise<number> {
    const db = await getDatabase();
    const counterModel = new CounterModel(db);

    // Get the current position counter value
    // This represents the total number of signatures (counter increments with each new user)
    const currentPosition = await counterModel.getCurrentValue(this.COUNTER_ID);

    // If counter doesn't exist or is at initial value, return 0
    // Otherwise, return the counter value minus the initial position (500)
    // This gives us the actual number of signatures (e.g., position 501 = 1 signature)
    if (currentPosition === null || currentPosition <= this.INITIAL_POSITION) {
      return 0;
    }

    return currentPosition - this.INITIAL_POSITION;
  }
}
