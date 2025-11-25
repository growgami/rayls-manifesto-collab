import { IMilestone } from "@/modules/Home/SignatureModal/SignatureCard/types/milestone.types";

/**
 * Milestone Configuration Array
 *
 * Defines content and styling for each signature number range.
 * Ranges must not overlap and should be in ascending order for optimal lookup.
 */
export const MILESTONES: IMilestone[] = [
  // Milestone 1: Founding Members (1-300, includes KOLs 1-75)
  // Gap: 301-500 reserved, never assigned
  {
    min: 1,
    max: 300,
    content: {
      quote:
        "First to believe, first to act. The foundation of every movement is built by those who dare to lead.",
      attribution: "- Founding Signature",
      footerText:
        "You are among the first 300 signatures. Thank you for being a founding member of this revolution.",
    },
    badgeGradient: {
      startColor: "#ffd700",
      endColor: "#ffed4e",
      angle: 135,
    },
    cardStyling: {
      quoteColor: "#1a1a1a",
    },
  },

  // Milestone 2: Early Pioneers (501-4800)
  // Gap: 4801-5000 reserved, never assigned
  {
    min: 501,
    max: 4800,
    content: {
      quote:
        "The rails are laid. The destination is clear. All aboard the future of finance.",
      attribution: "- Early Pioneer",
      footerText:
        "You're among the first 5,000 to join this movement. Thank you for your early belief.",
    },
    badgeGradient: {
      startColor: "#b49aff",
      endColor: "#ecfb3e",
      angle: 135,
    },
  },

  // Milestone 3: Momentum Builders (5001-19800)
  // Gap: 19801-20000 reserved, never assigned
  {
    min: 5001,
    max: 19800,
    content: {
      quote:
        "Momentum builds as more join the journey. Together, we accelerate toward the future.",
      attribution: "- Momentum Builder",
      footerText:
        "You're part of the growing wave that will reshape finance. Welcome aboard.",
    },
    badgeGradient: {
      startColor: "#ff6b6b",
      endColor: "#ffd93d",
      angle: 135,
    },
    cardStyling: {
      quoteColor: "#1a1a1a",
    },
  },

  // Milestone 4: Network Amplifiers (20001-49800)
  // Gap: 49801-50000 reserved, never assigned
  {
    min: 20001,
    max: 49800,
    content: {
      quote:
        "The network effect is real. Every signature strengthens our collective voice.",
      attribution: "- Network Amplifier",
      footerText:
        "You're amplifying the signal. Thank you for standing with tens of thousands.",
    },
    badgeGradient: {
      startColor: "#4ecdc4",
      endColor: "#44a3f7",
      angle: 135,
    },
  },

  // Milestone 5: Movement Leaders (50001+)
  // No upper limit
  {
    min: 50001,
    max: Infinity,
    content: {
      quote:
        "We are the movement. Together, we chart the course for the future of finance.",
      attribution: "- Movement Leader",
      footerText:
        "You are part of a global movement. Thank you for joining the revolution.",
    },
    badgeGradient: {
      startColor: "#a770ef",
      endColor: "#cf8bf3",
      angle: 135,
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
  content: {
    quote:
      "Every journey begins with a single step. Every revolution starts with a single voice.",
    attribution: "- The Rayls Manifesto",
    footerText: "Thank you for adding your voice to the movement.",
  },
  badgeGradient: {
    startColor: "#b49aff",
    endColor: "#ecfb3e",
    angle: 135,
  },
};

/**
 * Minimum regular signature number
 * Signatures 1-75 are reserved for KOLs
 */
export const MIN_REGULAR_SIGNATURE = 76;
