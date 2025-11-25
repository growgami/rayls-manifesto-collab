/**
 * KOL (Key Opinion Leader) Type Definitions
 *
 * Defines the structure for managing reserved signature positions
 * for key opinion leaders in the manifesto signing system.
 */

/**
 * Represents a single KOL entry in the reservation list
 */
export interface IKolEntry {
  /**
   * Twitter user ID (xId) - Primary identifier
   * This is immutable and preferred for identification
   */
  xId: string;

  /**
   * Twitter username/handle - Fallback identifier
   * Can change over time, used as secondary identification
   */
  username: string;
}

/**
 * Represents the complete KOL reservation list
 * Loaded from kol.reserve.json
 */
export interface IKolList {
  /**
   * Array of KOL entries
   * Maximum 75 entries recommended (matches reserved positions 1-75)
   */
  kols: IKolEntry[];
}
