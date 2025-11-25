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
   * Background color of the card container
   * Default: white (#ffffff)
   */
  backgroundColor?: HexColor;

  /**
   * Quote text color
   * Default: #27272a (zinc-800)
   */
  quoteColor?: HexColor;

  /**
   * Attribution text color
   * Default: #71717a (zinc-500)
   */
  attributionColor?: HexColor;

  /**
   * Footer text color
   * Default: #71717a (zinc-500)
   */
  footerColor?: HexColor;

  /**
   * Divider line color
   * Default: #e4e4e7 (zinc-200)
   */
  dividerColor?: HexColor;
}

/**
 * Text content for a milestone
 */
export interface IMilestoneContent {
  /**
   * The main quote text displayed on the card
   * Should be inspirational and relevant to the milestone
   */
  quote: string;

  /**
   * Attribution line below the quote
   * Example: "- The Rayls Manifesto" or "- Early Adopter"
   */
  attribution: string;

  /**
   * Footer message thanking the user
   * Should acknowledge their position in the milestone
   */
  footerText: string;
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
