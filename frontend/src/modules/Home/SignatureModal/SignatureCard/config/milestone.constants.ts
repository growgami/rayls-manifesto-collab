import { IMilestone } from "@/modules/Home/SignatureModal/SignatureCard/types/milestone.types";
import { getMilestoneRanges } from "@/features/signing/config/milestone-boundaries.constants";

/**
 * Get milestone ranges from shared configuration
 * This ensures UI boundaries stay in sync with position counter logic
 */
const MILESTONE_RANGES = getMilestoneRanges();

/**
 * Milestone Configuration Array
 *
 * Defines content and styling for each signature number range.
 * Ranges are derived from the shared milestone boundary configuration.
 */
export const MILESTONES: IMilestone[] = [
  // Milestone 1: Founding Members (1-300, includes KOLs 1-75)
  // Gap: 301-500 reserved, never assigned
  {
    min: MILESTONE_RANGES[0].min,
    max: MILESTONE_RANGES[0].max,
    content: {},
    badgeGradient: {
      startColor: "#ffd700",
      endColor: "#ffed4e",
      angle: 135,
    },
    cardStyling: {
      backgroundImage: "/images/cards/legendary-card.webp",
    },
  },

  // Milestone 2: Early Pioneers (501-4800)
  // Gap: 4801-5000 reserved, never assigned
  {
    min: MILESTONE_RANGES[1].min,
    max: MILESTONE_RANGES[1].max,
    content: {},
    badgeGradient: {
      startColor: "#b49aff",
      endColor: "#ecfb3e",
      angle: 135,
    },
    cardStyling: {
      backgroundImage: "/images/cards/legendary-card.webp",
    },
  },

  // Milestone 3: Momentum Builders (5001-19800)
  // Gap: 19801-20000 reserved, never assigned
  {
    min: MILESTONE_RANGES[2].min,
    max: MILESTONE_RANGES[2].max,
    content: {},
    badgeGradient: {
      startColor: "#ff6b6b",
      endColor: "#ffd93d",
      angle: 135,
    },
    cardStyling: {
      backgroundImage: "/images/cards/epic-card.webp",
    },
  },

  // Milestone 4: Network Amplifiers (20001-49800)
  // Gap: 49801-50000 reserved, never assigned
  {
    min: MILESTONE_RANGES[3].min,
    max: MILESTONE_RANGES[3].max,
    content: {},
    badgeGradient: {
      startColor: "#4ecdc4",
      endColor: "#44a3f7",
      angle: 135,
    },
    cardStyling: {
      backgroundImage: "/images/cards/epic-card.webp",
    },
  },

  // Milestone 5: Movement Leaders (50001+)
  // No upper limit
  {
    min: MILESTONE_RANGES[4].min,
    max: MILESTONE_RANGES[4].max,
    content: {},
    badgeGradient: {
      startColor: "#a770ef",
      endColor: "#cf8bf3",
      angle: 135,
    },
    cardStyling: {
      backgroundImage: "/images/cards/common-card.webp",
    },
  },
];

/**
 * Default Milestone
 *
 * Used as fallback for signature numbers outside configured ranges
 * or when milestone lookup fails.
 */
export const DEFAULT_MILESTONE: IMilestone = {
  min: 0,
  max: Infinity,
  content: {},
  badgeGradient: {
    startColor: "#b49aff",
    endColor: "#ecfb3e",
    angle: 135,
  },
};

/**
 * Minimum regular signature number
 * Signatures 1-75 are reserved for KOLs
 * Re-exported from shared configuration for backward compatibility
 */
export { REGULAR_START_POSITION as MIN_REGULAR_SIGNATURE } from "@/features/signing/config/milestone-boundaries.constants";
