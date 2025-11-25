import { Db, Collection } from 'mongodb';

export interface ICounter {
  _id: string;           // Counter name (e.g., "referral_position")
  sequence: number;      // Current counter value
  updatedAt: Date;
}

export class CounterModel {
  private db: Db;
  private collection: Collection<ICounter>;

  constructor(db: Db) {
    this.db = db;
    this.collection = db.collection<ICounter>('counters');
  }

  /**
   * Atomically increments the counter and returns the new value
   * Uses MongoDB's findOneAndUpdate with $inc for atomic operation
   * @param counterId - The identifier for the counter
   * @returns The new counter value after incrementing
   */
  async getNextSequence(counterId: string): Promise<number> {
    const result = await this.collection.findOneAndUpdate(
      { _id: counterId },
      {
        $inc: { sequence: 1 },
        $set: { updatedAt: new Date() }
      },
      {
        upsert: true,
        returnDocument: 'after'
      }
    );

    if (!result) {
      throw new Error(`Failed to increment counter: ${counterId}`);
    }

    return result.sequence;
  }

  /**
   * Initializes a counter with a specific value
   * Used during migration or recovery scenarios
   * @param counterId - The identifier for the counter
   * @param initialValue - The starting value for the counter
   */
  async initializeCounter(counterId: string, initialValue: number): Promise<void> {
    await this.collection.updateOne(
      { _id: counterId },
      {
        $set: {
          sequence: initialValue,
          updatedAt: new Date()
        }
      },
      { upsert: true }
    );
  }

  /**
   * Gets the current counter value without incrementing
   * @param counterId - The identifier for the counter
   * @returns The current counter value, or null if counter doesn't exist
   */
  async getCurrentValue(counterId: string): Promise<number | null> {
    const counter = await this.collection.findOne({ _id: counterId });
    return counter?.sequence ?? null;
  }
}
