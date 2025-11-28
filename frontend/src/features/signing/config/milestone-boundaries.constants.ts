/**
 * Position Skip Range Configuration
 *
 * Defines ranges of positions that should be skipped (reserved) during
 * automatic position assignment. These positions can only be assigned manually.
 *
 * Tier structure:
 * - Mythical: 1-300 (manually assigned, counter starts after this)
 * - Legendary: 301-5,000 (501-701 held back)
 * - Epic: 5,001-20,000 (19,800-20,000 saved)
 * - Rare: 20,001-50,000 (49,800-50,000 saved)
 * - Common: 50,001+
 */

export interface SkipRange {
  /** First position to skip (inclusive) */
  start: number;
  /** Last position to skip (inclusive) */
  end: number;
  /** Position to jump to after this range */
  jumpTo: number;
}

/**
 * Reserved position ranges that are skipped during auto-generation.
 * When the counter reaches the start of a skip range, it jumps to jumpTo.
 */
export const SKIP_RANGES: SkipRange[] = [
  // Legendary tier: hold back 501-701
  {
    start: 501,
    end: 701,
    jumpTo: 702,
  },
  // Epic tier: save last 201 positions (19,800-20,000)
  {
    start: 19800,
    end: 20000,
    jumpTo: 20001,
  },
  // Rare tier: save last 201 positions (49,800-50,000)
  {
    start: 49800,
    end: 50000,
    jumpTo: 50001,
  },
];

/**
 * Starting position for the auto-counter.
 * First auto-assigned user gets position 301 (after Mythical range 1-300).
 */
export const COUNTER_START_POSITION = 300;
