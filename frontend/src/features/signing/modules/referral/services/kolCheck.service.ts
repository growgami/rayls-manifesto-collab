import { readFileSync } from 'fs';
import { join } from 'path';

interface KolEntry {
  username: string;
  xId: string;
  position: number;
}

export class KolCheckService {
  private static kolsCache: KolEntry[] | null = null;

  /**
   * Load KOL data from kols.json file
   * Caches the result to avoid repeated file reads
   */
  private static loadKols(): KolEntry[] {
    if (this.kolsCache !== null) {
      return this.kolsCache;
    }

    try {
      // Read from project root data directory
      const kolsPath = join(process.cwd(), 'data', 'kols', 'kols.json');
      const fileContent = readFileSync(kolsPath, 'utf-8');
      this.kolsCache = JSON.parse(fileContent) as KolEntry[];
      return this.kolsCache;
    } catch (error) {
      console.error('Failed to load KOL data:', error);
      this.kolsCache = [];
      return [];
    }
  }

  /**
   * Check if a Twitter user ID (xId) is in the KOL list
   * @param xId - Twitter user ID
   * @returns KOL entry if found, null otherwise
   */
  static checkIsKol(xId: string): KolEntry | null {
    const kols = this.loadKols();
    const kol = kols.find(entry => entry.xId === xId);
    return kol || null;
  }

  /**
   * Get KOL position from kols.json
   * @param xId - Twitter user ID
   * @returns Position number or null if not a KOL
   */
  static getKolPosition(xId: string): number | null {
    const kol = this.checkIsKol(xId);
    return kol?.position || null;
  }
}
