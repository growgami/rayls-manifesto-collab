import { IMilestone } from "@/modules/Home/SignatureModal/SignatureCard/types/milestone.types";

/**
 * Milestone Configuration Array
 *
 * Defines content and styling for each signature number range.
 *
 * Tier order (rarest to most common):
 * - Mythical: 1-300 (OG/Special members)
 * - Legendary: 301-5,000 (positions 501-701 held back for special allocation)
 * - Epic: 5,001-20,000 (last 200 positions 19,800-20,000 saved)
 * - Rare: 20,001-50,000 (last 200 positions 49,800-50,000 saved)
 * - Common: 50,001+ (scale phase)
 */
export const MILESTONES: IMilestone[] = [
  // Tier 1: Mythical (1-300) - RAREST TIER - OG/Special members
  {
    min: 1,
    max: 300,
    content: {},
    badgeGradient: {
      startColor: "#b49aff",
      endColor: "#ecfb3e",
      angle: 135,
    },
    cardStyling: {
      backgroundImage: "/images/cards/mythical-card.webp",
    },
  },

  // Tier 2: Legendary (301-5,000)
  // Note: Positions 501-701 held back for special allocation
  {
    min: 301,
    max: 5000,
    content: {},
    badgeGradient: {
      startColor: "#ff6b6b",
      endColor: "#ffd93d",
      angle: 135,
    },
    cardStyling: {
      backgroundImage: "/images/cards/legendary-card.webp",
    },
  },

  // Tier 3: Epic (5,001-20,000)
  // Note: Last 200 positions (19,800-20,000) saved for special allocation
  {
    min: 5001,
    max: 20000,
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

  // Tier 4: Rare (20,001-50,000)
  // Note: Last 200 positions (49,800-50,000) saved for special allocation
  {
    min: 20001,
    max: 50000,
    content: {},
    badgeGradient: {
      startColor: "#a770ef",
      endColor: "#cf8bf3",
      angle: 135,
    },
    cardStyling: {
      backgroundImage: "/images/cards/rare-card.webp",
    },
  },

  // Tier 5: Common (50,001+)
  {
    min: 50001,
    max: Infinity,
    content: {},
    badgeGradient: {
      startColor: "#6b7280",
      endColor: "#9ca3af",
      angle: 135,
    },
    cardStyling: {
      backgroundImage: "/images/cards/common-card.webp",
    },
  },
];

/**
 * Default Milestone (Common tier)
 *
 * Used as fallback for signature numbers outside configured ranges
 * (e.g., invalid positions like 0 or negative numbers) or when
 * milestone lookup fails.
 */
export const DEFAULT_MILESTONE: IMilestone = {
  min: 0,
  max: Infinity,
  content: {},
  badgeGradient: {
    startColor: "#6b7280",
    endColor: "#9ca3af",
    angle: 135,
  },
  cardStyling: {
    backgroundImage: "/images/cards/common-card.webp",
  },
};

