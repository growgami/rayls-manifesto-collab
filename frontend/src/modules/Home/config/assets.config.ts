import { IAssetConfig, AssetPriority } from "@/shared/services/assetLoader.service";

/**
 * Home Module Asset Configuration
 *
 * Defines all images that need to be preloaded for the Home module.
 * Assets are prioritized to ensure critical content loads first.
 */

/**
 * Critical assets - must load before initial render
 * These are immediately visible on page load
 */
const CRITICAL_ASSETS: IAssetConfig[] = [
  {
    src: "/images/background.webp",
    priority: AssetPriority.CRITICAL,
    alt: "Desktop background image",
  },
  {
    src: "/images/for-mobile.webp",
    priority: AssetPriority.CRITICAL,
    alt: "Mobile background image",
  },
  {
    src: "/images/Rayls_Logo_Gradient.webp",
    priority: AssetPriority.CRITICAL,
    alt: "Rayls gradient logo",
  },
];

/**
 * High priority assets - load early but don't block render
 * These are likely to be shown when user interacts (modal opens)
 */
const HIGH_PRIORITY_ASSETS: IAssetConfig[] = [
  {
    src: "/images/cards/legendary-card.webp",
    priority: AssetPriority.HIGH,
    alt: "Legendary signature card background",
  },
  {
    src: "/images/cards/epic-card.webp",
    priority: AssetPriority.HIGH,
    alt: "Epic signature card background",
  },
  {
    src: "/images/cards/rare-card.webp",
    priority: AssetPriority.HIGH,
    alt: "Rare signature card background",
  },
  {
    src: "/images/cards/common-card.webp",
    priority: AssetPriority.HIGH,
    alt: "Common signature card background",
  },
  {
    src: "/images/cards/mythical-card.webp",
    priority: AssetPriority.HIGH,
    alt: "Mythical signature card background",
  },
];

/**
 * Normal priority assets - nice to have, load in background
 * These are rarely used or not immediately needed
 */
const NORMAL_PRIORITY_ASSETS: IAssetConfig[] = [
  // Add any additional assets here as needed
];

/**
 * All assets combined in priority order
 */
export const HOME_ASSETS: IAssetConfig[] = [
  ...CRITICAL_ASSETS,
  ...HIGH_PRIORITY_ASSETS,
  ...NORMAL_PRIORITY_ASSETS,
];

/**
 * Get only critical assets (for minimal loading)
 */
export const getCriticalAssets = (): IAssetConfig[] => CRITICAL_ASSETS;

/**
 * Get assets by priority level
 */
export const getAssetsByPriority = (
  priority: AssetPriority
): IAssetConfig[] => {
  return HOME_ASSETS.filter((asset) => asset.priority === priority);
};
