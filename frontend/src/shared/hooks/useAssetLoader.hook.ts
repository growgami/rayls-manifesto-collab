import { useState, useEffect, useCallback, useRef } from "react";
import {
  assetLoaderService,
  IAssetConfig,
  IAssetLoadProgress,
  IAssetLoadResult,
} from "@/shared/services/assetLoader.service";

export interface IUseAssetLoaderOptions {
  assets: IAssetConfig[];
  onComplete?: (results: IAssetLoadResult[]) => void;
  onError?: (failedAssets: Map<string, string>) => void;
}

export interface IUseAssetLoaderReturn {
  isLoading: boolean;
  progress: IAssetLoadProgress;
  results: IAssetLoadResult[];
  retry: () => void;
}

/**
 * React hook for asset preloading with progress tracking
 *
 * @param options - Configuration options
 * @returns Loading state, progress, results, and retry function
 *
 * @example
 * ```tsx
 * const { isLoading, progress } = useAssetLoader({
 *   assets: [
 *     { src: '/images/bg.webp', priority: AssetPriority.CRITICAL },
 *     { src: '/images/card.webp', priority: AssetPriority.HIGH },
 *   ],
 * });
 * ```
 */
export const useAssetLoader = ({
  assets,
  onComplete,
  onError,
}: IUseAssetLoaderOptions): IUseAssetLoaderReturn => {
  const [isLoading, setIsLoading] = useState(true);
  const [progress, setProgress] = useState<IAssetLoadProgress>({
    total: 0,
    loaded: 0,
    failed: 0,
    percentage: 0,
  });
  const [results, setResults] = useState<IAssetLoadResult[]>([]);

  // Store callbacks in refs to avoid dependency issues
  const onCompleteRef = useRef(onComplete);
  const onErrorRef = useRef(onError);

  // Update refs when callbacks change
  useEffect(() => {
    onCompleteRef.current = onComplete;
    onErrorRef.current = onError;
  }, [onComplete, onError]);

  const loadAssets = useCallback(async () => {
    if (assets.length === 0) {
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    setProgress({
      total: assets.length,
      loaded: 0,
      failed: 0,
      percentage: 0,
    });

    try {
      const loadResults = await assetLoaderService.preloadAssets(
        assets,
        (progressUpdate) => {
          setProgress(progressUpdate);
        }
      );

      setResults(loadResults);
      setIsLoading(false);

      // Check for failures
      const failedAssets = assetLoaderService.getFailedAssets();
      if (failedAssets.size > 0 && onErrorRef.current) {
        onErrorRef.current(failedAssets);
      }

      // Call completion callback
      if (onCompleteRef.current) {
        onCompleteRef.current(loadResults);
      }
    } catch (error) {
      console.error("Asset loading error:", error);
      setIsLoading(false);

      if (onErrorRef.current) {
        onErrorRef.current(new Map([["unknown", String(error)]]));
      }
    }
  }, [assets]);

  useEffect(() => {
    loadAssets();
    // Only run once on mount
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const retry = useCallback(() => {
    assetLoaderService.clearCache();
    loadAssets();
  }, [loadAssets]);

  return {
    isLoading,
    progress,
    results,
    retry,
  };
};
