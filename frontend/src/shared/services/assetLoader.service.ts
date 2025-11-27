/**
 * Asset Loader Service
 *
 * Centralized service for preloading critical application images.
 * Supports priority-based loading and progress tracking.
 */

export enum AssetPriority {
  CRITICAL = 0, // Must load before app renders
  HIGH = 1,     // Should load early (card images)
  NORMAL = 2,   // Can load in background
}

export interface IAssetConfig {
  src: string;
  priority: AssetPriority;
  alt?: string;
}

export interface IAssetLoadProgress {
  total: number;
  loaded: number;
  failed: number;
  percentage: number;
}

export interface IAssetLoadResult {
  src: string;
  success: boolean;
  error?: string;
}

/**
 * Asset Loader Service
 * Handles preloading of images with priority-based queue system
 */
export class AssetLoaderService {
  private loadedAssets: Set<string> = new Set();
  private failedAssets: Map<string, string> = new Map();

  /**
   * Preload a single image
   * @param src - Image source URL
   * @returns Promise that resolves when image loads or rejects on error
   */
  private preloadImage(src: string): Promise<IAssetLoadResult> {
    return new Promise((resolve) => {
      // Skip if already loaded
      if (this.loadedAssets.has(src)) {
        resolve({ src, success: true });
        return;
      }

      const img = new Image();

      img.onload = () => {
        this.loadedAssets.add(src);
        resolve({ src, success: true });
      };

      img.onerror = () => {
        const errorMsg = `Failed to load image: ${src}`;
        this.failedAssets.set(src, errorMsg);
        console.warn(errorMsg);
        // Resolve anyway to not block other assets
        resolve({ src, success: false, error: errorMsg });
      };

      img.src = src;
    });
  }

  /**
   * Preload multiple images with priority-based loading
   * @param assets - Array of asset configurations
   * @param onProgress - Optional callback for progress updates
   * @returns Promise that resolves when all assets complete (success or failure)
   */
  async preloadAssets(
    assets: IAssetConfig[],
    onProgress?: (progress: IAssetLoadProgress) => void
  ): Promise<IAssetLoadResult[]> {
    // Sort by priority (lower number = higher priority)
    const sortedAssets = [...assets].sort(
      (a, b) => a.priority - b.priority
    );

    const total = sortedAssets.length;
    let loaded = 0;
    let failed = 0;
    const results: IAssetLoadResult[] = [];

    // Load critical assets first (blocking)
    const criticalAssets = sortedAssets.filter(
      (a) => a.priority === AssetPriority.CRITICAL
    );
    const nonCriticalAssets = sortedAssets.filter(
      (a) => a.priority !== AssetPriority.CRITICAL
    );

    // Sequential loading for critical assets
    for (const asset of criticalAssets) {
      const result = await this.preloadImage(asset.src);
      results.push(result);

      if (result.success) {
        loaded++;
      } else {
        failed++;
      }

      if (onProgress) {
        onProgress({
          total,
          loaded,
          failed,
          percentage: Math.round((loaded / total) * 100),
        });
      }
    }

    // Parallel loading for non-critical assets
    const nonCriticalPromises = nonCriticalAssets.map(async (asset) => {
      const result = await this.preloadImage(asset.src);

      if (result.success) {
        loaded++;
      } else {
        failed++;
      }

      if (onProgress) {
        onProgress({
          total,
          loaded,
          failed,
          percentage: Math.round((loaded / total) * 100),
        });
      }

      return result;
    });

    const nonCriticalResults = await Promise.all(nonCriticalPromises);
    results.push(...nonCriticalResults);

    return results;
  }

  /**
   * Check if an asset has been loaded
   * @param src - Image source URL
   * @returns True if asset was successfully loaded
   */
  isAssetLoaded(src: string): boolean {
    return this.loadedAssets.has(src);
  }

  /**
   * Get all failed assets with error messages
   * @returns Map of failed asset URLs to error messages
   */
  getFailedAssets(): Map<string, string> {
    return new Map(this.failedAssets);
  }

  /**
   * Clear the cache (useful for testing or forced reloading)
   */
  clearCache(): void {
    this.loadedAssets.clear();
    this.failedAssets.clear();
  }

  /**
   * Get loading statistics
   * @returns Object with loaded and failed counts
   */
  getStats() {
    return {
      loaded: this.loadedAssets.size,
      failed: this.failedAssets.size,
    };
  }
}

// Singleton instance
export const assetLoaderService = new AssetLoaderService();
