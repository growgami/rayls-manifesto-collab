/**
 * Milestone System Type Definitions
 *
 * Defines the structure for milestone-based dynamic content
 * in signature cards. Each milestone range has unique styling
 * and content that displays based on the signature number.
 */

/**
 * Color definition - always hex format with #
 */
export type HexColor = `#${string}`;

/**
 * Badge gradient configuration
 * Applied to the signature number badge
 */
export interface IBadgeGradient {
  /**
   * Starting color of the gradient (left/top)
   */
  startColor: HexColor;

  /**
   * Ending color of the gradient (right/bottom)
   */
  endColor: HexColor;

  /**
   * Gradient angle in degrees (default: 135deg)
   * Optional - defaults to 135deg if not specified
   */
  angle?: number;
}

/**
 * Card styling configuration
 * Controls the visual appearance of the entire card
 */
export interface ICardStyling {
  /**
   * Background image URL for the card container
   * Path relative to /public directory
   * Example: "/images/cards/legendary-card.webp"
   */
  backgroundImage?: string;

  /**
   * Background color of the card container
   * Default: white (#ffffff)
   * Note: backgroundImage takes precedence if both are defined
   */
  backgroundColor?: HexColor;
}

/**
 * Text content for a milestone
 * Currently empty as all text content has been removed from cards
 */
export interface IMilestoneContent {
  // Placeholder - can be removed if no content is needed in the future
}

/**
 * Complete milestone definition
 * Represents a signature number range with its associated content and styling
 */
export interface IMilestone {
  /**
   * Minimum signature number (inclusive)
   * Must be >= 1
   */
  min: number;

  /**
   * Maximum signature number (inclusive)
   * Must be > min
   */
  max: number;

  /**
   * Text content for this milestone
   */
  content: IMilestoneContent;

  /**
   * Badge gradient styling
   */
  badgeGradient: IBadgeGradient;

  /**
   * Optional card styling overrides
   * If not specified, defaults from CSS will be used
   */
  cardStyling?: ICardStyling;
}

/**
 * Result of milestone lookup
 */
export interface IMilestoneLookupResult {
  milestone: IMilestone;
  isDefault: boolean;
}
