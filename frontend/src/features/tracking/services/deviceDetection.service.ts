export type DeviceType = 'mobile' | 'tablet' | 'desktop' | 'unknown';

export interface DeviceInfo {
  type: DeviceType;
  isMobile: boolean;
  isTablet: boolean;
  isDesktop: boolean;
}

/**
 * Service for detecting device type from user agent string
 */
export class DeviceDetectionService {
  /**
   * Detect device type from user agent string
   */
  static detectFromUserAgent(userAgent: string): DeviceInfo {
    if (!userAgent) {
      return this.createDeviceInfo('unknown');
    }

    const ua = userAgent.toLowerCase();

    // Check for tablet first (more specific patterns)
    if (this.isTablet(ua)) {
      return this.createDeviceInfo('tablet');
    }

    // Then check for mobile
    if (this.isMobile(ua)) {
      return this.createDeviceInfo('mobile');
    }

    // Default to desktop
    return this.createDeviceInfo('desktop');
  }

  /**
   * Detect device type from browser (client-side only)
   */
  static detectFromBrowser(): DeviceInfo {
    if (typeof window === 'undefined' || typeof navigator === 'undefined') {
      return this.createDeviceInfo('unknown');
    }

    return this.detectFromUserAgent(navigator.userAgent);
  }

  /**
   * Check if user agent indicates mobile device
   */
  private static isMobile(ua: string): boolean {
    const mobilePatterns = [
      /android/i,
      /webos/i,
      /iphone/i,
      /ipod/i,
      /blackberry/i,
      /windows phone/i,
      /mobile/i,
    ];

    return mobilePatterns.some(pattern => pattern.test(ua));
  }

  /**
   * Check if user agent indicates tablet device
   */
  private static isTablet(ua: string): boolean {
    const tabletPatterns = [
      /ipad/i,
      /android(?!.*mobile)/i, // Android without 'mobile' keyword
      /tablet/i,
      /kindle/i,
      /playbook/i,
      /silk/i,
    ];

    return tabletPatterns.some(pattern => pattern.test(ua));
  }

  /**
   * Create standardized device info object
   */
  private static createDeviceInfo(type: DeviceType): DeviceInfo {
    return {
      type,
      isMobile: type === 'mobile',
      isTablet: type === 'tablet',
      isDesktop: type === 'desktop',
    };
  }

  /**
   * Get human-readable device category for analytics
   */
  static getDeviceCategory(userAgent: string): string {
    const info = this.detectFromUserAgent(userAgent);
    return info.type.charAt(0).toUpperCase() + info.type.slice(1);
  }
}
