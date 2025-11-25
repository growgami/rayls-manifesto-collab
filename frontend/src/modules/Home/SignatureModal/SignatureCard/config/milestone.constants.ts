import { IMilestone } from "@/modules/Home/SignatureModal/SignatureCard/types/milestone.types";

/**
 * Milestone Configuration Array
 *
 * Defines content and styling for each signature number range.
 * Ranges must not overlap and should be in ascending order for optimal lookup.
 */
export const MILESTONES: IMilestone[] = [
  // KOL/Founding Signatures (1-75)
  {
    min: 1,
    max: 75,
    content: {
      quote:
        "First to believe, first to act. The foundation of every movement is built by those who dare to lead.",
      attribution: "- Founding Signature",
      footerText:
        "You are among the elite founding signatures. Thank you for being a Key Opinion Leader in this revolution.",
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

  // First Regular Milestone (76-1000)
  {
    min: 76,
    max: 1000,
    content: {
      quote:
        "The rails are laid. The destination is clear. All aboard the future of finance.",
      attribution: "- The Rayls Manifesto",
      footerText:
        "Thank you for signing the manifesto and joining the movement.",
    },
    badgeGradient: {
      startColor: "#b49aff",
      endColor: "#ecfb3e",
      angle: 135,
    },
  },

  // Early Pioneer Milestone (1001-2000)
  {
    min: 1001,
    max: 2000,
    content: {
      quote:
        "Early believers become tomorrow's pioneers. The tracks ahead shine with possibility.",
      attribution: "- Pioneer Signature",
      footerText:
        "You're among the first 2,000 to join this revolution. Thank you for your early support.",
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

  // Momentum Builder Milestone (2001-5000)
  {
    min: 2001,
    max: 5000,
    content: {
      quote:
        "Momentum builds as more join the journey. Together, we accelerate toward the future.",
      attribution: "- Momentum Builder",
      footerText:
        "You're part of the growing wave that will reshape finance. Welcome aboard.",
    },
    badgeGradient: {
      startColor: "#4ecdc4",
      endColor: "#44a3f7",
      angle: 135,
    },
  },

  // Network Amplifier Milestone (5001-10000)
  {
    min: 5001,
    max: 10000,
    content: {
      quote:
        "The network effect is real. Every signature strengthens our collective voice.",
      attribution: "- Network Amplifier",
      footerText:
        "You're amplifying the signal. Thank you for standing with thousands.",
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
