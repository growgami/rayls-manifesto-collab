import fs from 'fs';
import path from 'path';
import { IKolList, IKolEntry } from '@/features/signing/modules/kol/types/kol.types';

/**
 * KOL Service
 *
 * Manages Key Opinion Leader (KOL) detection and reservation list.
 * Uses in-memory caching for O(1) lookup performance.
 */
export class KolService {
  private static kolList: IKolEntry[] | null = null;
  private static xIdSet: Set<string> | null = null;
  private static usernameSet: Set<string> | null = null;
  private static readonly KOL_JSON_PATH = path.join(process.cwd(), 'data', 'kols', 'kol.reserve.json');

  /**
   * Loads the KOL list from JSON file into memory
   * Called once on server startup
   * Creates Sets for O(1) lookup performance
   */
  static async loadKolList(): Promise<void> {
    try {
      // Check if file exists
      if (!fs.existsSync(this.KOL_JSON_PATH)) {
        console.warn(`KOL list not found at ${this.KOL_JSON_PATH}. All users will be treated as regular users.`);
        this.kolList = [];
        this.xIdSet = new Set();
        this.usernameSet = new Set();
        return;
      }

      // Read and parse JSON file
      const fileContent = fs.readFileSync(this.KOL_JSON_PATH, 'utf-8');
      const data: IKolList = JSON.parse(fileContent);

      // Validate structure
      if (!data.kols || !Array.isArray(data.kols)) {
        console.error('Invalid KOL list structure. Expected { "kols": [...] }');
        this.kolList = [];
        this.xIdSet = new Set();
        this.usernameSet = new Set();
        return;
      }

      // Store list and create lookup Sets
      this.kolList = data.kols;
      this.xIdSet = new Set(data.kols.map(kol => kol.xId.toLowerCase()));
      this.usernameSet = new Set(data.kols.map(kol => kol.username.toLowerCase()));

      console.log(`✅ KOL list loaded successfully: ${this.kolList.length} KOLs`);
    } catch (error) {
      console.error('Error loading KOL list:', error);
      // Fallback to empty list on error
      this.kolList = [];
      this.xIdSet = new Set();
      this.usernameSet = new Set();
    }
  }

  /**
   * Checks if a user is a KOL
   * Primary check: Twitter ID (xId)
   * Fallback check: Twitter username
   *
   * @param xId - Twitter user ID
   * @param username - Twitter username/handle
   * @returns true if user is a KOL, false otherwise
   */
  static async isKol(xId: string, username: string): Promise<boolean> {
    // Ensure KOL list is loaded
    if (this.kolList === null) {
      await this.loadKolList();
    }

    // Check if empty list (no KOLs or file not found)
    if (!this.xIdSet || !this.usernameSet) {
      return false;
    }

    // Primary check: xId (case-insensitive)
    if (this.xIdSet.has(xId.toLowerCase())) {
      return true;
    }

    // Fallback check: username (case-insensitive)
    if (this.usernameSet.has(username.toLowerCase())) {
      return true;
    }

    return false;
  }

  /**
   * Gets the cached KOL list
   * @returns Array of KOL entries, or empty array if not loaded
   */
  static getKolList(): IKolEntry[] {
    if (this.kolList === null) {
      console.warn('KOL list not yet loaded. Call loadKolList() first.');
      return [];
    }
    return this.kolList;
  }

  /**
   * Forces a reload of the KOL list from disk
   * Useful for future admin features to update KOL list without restart
   */
  static async reloadKolList(): Promise<void> {
    this.kolList = null;
    this.xIdSet = null;
    this.usernameSet = null;
    await this.loadKolList();
  }

  /**
   * Gets the total number of KOLs in the list
   * @returns Number of KOLs
   */
  static getKolCount(): number {
    if (this.kolList === null) {
      return 0;
    }
    return this.kolList.length;
  }

  /**
   * Checks if KOL list is loaded
   * @returns true if loaded, false otherwise
   */
  static isLoaded(): boolean {
    return this.kolList !== null;
  }
}
