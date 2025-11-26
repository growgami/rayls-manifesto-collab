/**
 * Milestone Boundary Configuration
 *
 * Single source of truth for all milestone boundaries and gaps.
 * Used by both the position counter system and the UI milestone display.
 *
 * Structure:
 * - max: Last position in this milestone
 * - gapStart: First reserved position (never assigned)
 * - gapEnd: Last reserved position (never assigned)
 * - nextStart: First position of next milestone
 */

export interface MilestoneBoundary {
  max: number;
  gapStart: number;
  gapEnd: number;
  nextStart: number;
}

/**
 * Milestone boundaries with reserved gaps between them.
 * Each milestone has 200 reserved positions following its max.
 */
export const MILESTONE_BOUNDARIES: MilestoneBoundary[] = [
  {
    max: 300,
    gapStart: 301,
    gapEnd: 500,
    nextStart: 501,
  },
  {
    max: 4800,
    gapStart: 4801,
    gapEnd: 5000,
    nextStart: 5001,
  },
  {
    max: 19800,
    gapStart: 19801,
    gapEnd: 20000,
    nextStart: 20001,
  },
  {
    max: 49800,
    gapStart: 49801,
    gapEnd: 50000,
    nextStart: 50001,
  },
];

/**
 * KOL-specific constants
 */
export const KOL_MAX_POSITION = 75;
export const REGULAR_START_POSITION = 76;

/**
 * Helper function to get milestone ranges for UI display
 * Converts boundary data into min/max ranges
 */
export function getMilestoneRanges() {
  const ranges = [
    {
      min: 1,
      max: MILESTONE_BOUNDARIES[0].max,
    },
  ];

  for (let i = 0; i < MILESTONE_BOUNDARIES.length - 1; i++) {
    ranges.push({
      min: MILESTONE_BOUNDARIES[i].nextStart,
      max: MILESTONE_BOUNDARIES[i + 1].max,
    });
  }

  // Last milestone (no upper limit)
  ranges.push({
    min: MILESTONE_BOUNDARIES[MILESTONE_BOUNDARIES.length - 1].nextStart,
    max: Infinity,
  });

  return ranges;
}
