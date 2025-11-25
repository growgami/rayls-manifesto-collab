import {
  IMilestone,
  IMilestoneLookupResult,
} from "@/modules/Home/SignatureModal/SignatureCard/types/milestone.types";
import { MILESTONES, DEFAULT_MILESTONE } from "./milestone.constants";

/**
 * Milestone Configuration Utility
 *
 * Provides functions for milestone lookup and validation.
 */
export class MilestoneConfig {
  /**
   * Finds the appropriate milestone for a given signature number
   *
   * @param signatureNumber - The signature number to lookup
   * @returns Milestone configuration and whether it's the default fallback
   */
  static getMilestoneForSignature(
    signatureNumber: number
  ): IMilestoneLookupResult {
    // Validate input
    if (!Number.isInteger(signatureNumber) || signatureNumber < 1) {
      console.warn(
        `Invalid signature number: ${signatureNumber}. Using default milestone.`
      );
      return {
        milestone: DEFAULT_MILESTONE,
        isDefault: true,
      };
    }

    // Linear search through milestones
    // Note: Array is expected to be small (~10-20 entries max)
    for (const milestone of MILESTONES) {
      if (
        signatureNumber >= milestone.min &&
        signatureNumber <= milestone.max
      ) {
        return {
          milestone,
          isDefault: false,
        };
      }
    }

    // No matching milestone found - use default
    console.info(
      `No milestone found for signature #${signatureNumber}. Using default.`
    );
    return {
      milestone: DEFAULT_MILESTONE,
      isDefault: true,
    };
  }

  /**
   * Gets the badge gradient CSS value for a milestone
   *
   * @param milestone - The milestone configuration
   * @returns CSS linear-gradient string
   */
  static getBadgeGradientCSS(milestone: IMilestone): string {
    const { startColor, endColor, angle = 135 } = milestone.badgeGradient;
    return `linear-gradient(${angle}deg, ${startColor} 0%, ${endColor} 100%)`;
  }

  /**
   * Validates milestone configuration on app initialization
   * Checks for overlapping ranges and proper ordering
   *
   * @returns Array of validation error messages (empty if valid)
   */
  static validateMilestones(): string[] {
    const errors: string[] = [];

    // Check each milestone
    for (let i = 0; i < MILESTONES.length; i++) {
      const milestone = MILESTONES[i];

      // Validate min < max
      if (milestone.min >= milestone.max) {
        errors.push(
          `Milestone ${i}: min (${milestone.min}) must be less than max (${milestone.max})`
        );
      }

      // Check for overlaps with subsequent milestones
      for (let j = i + 1; j < MILESTONES.length; j++) {
        const otherMilestone = MILESTONES[j];

        const hasOverlap =
          (milestone.min >= otherMilestone.min &&
            milestone.min <= otherMilestone.max) ||
          (milestone.max >= otherMilestone.min &&
            milestone.max <= otherMilestone.max) ||
          (otherMilestone.min >= milestone.min &&
            otherMilestone.min <= milestone.max);

        if (hasOverlap) {
          errors.push(
            `Milestone ${i} (${milestone.min}-${milestone.max}) overlaps with Milestone ${j} (${otherMilestone.min}-${otherMilestone.max})`
          );
        }
      }
    }

    return errors;
  }

  /**
   * Gets all configured milestones
   * Useful for debugging or displaying milestone information
   */
  static getAllMilestones(): IMilestone[] {
    return [...MILESTONES];
  }

  /**
   * Gets the default milestone
   */
  static getDefaultMilestone(): IMilestone {
    return DEFAULT_MILESTONE;
  }
}

// Validate milestones on module load (development only)
if (process.env.NODE_ENV === "development") {
  const validationErrors = MilestoneConfig.validateMilestones();
  if (validationErrors.length > 0) {
    console.error("Milestone configuration errors detected:");
    validationErrors.forEach((error) => console.error(`  - ${error}`));
  }
}
