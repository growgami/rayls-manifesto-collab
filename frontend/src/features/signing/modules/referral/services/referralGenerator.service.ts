import { randomBytes } from 'crypto';
import { ReferralDbService } from '@/features/signing/modules/referral/utils/referralDb.util';

export interface ReferralCodeOptions {
  length?: number;
  prefix?: string;
  username?: string;
}

export class ReferralCodeGenerator {
  private static readonly DEFAULT_PREFIX = 'RAYLS';
  private static readonly DEFAULT_LENGTH = 8;
  private static readonly CHARACTERS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';

  static generateCode(options: ReferralCodeOptions = {}): string {
    const {
      length = this.DEFAULT_LENGTH,
      prefix = this.DEFAULT_PREFIX,
      username
    } = options;

    // Format username: take first 5 letters, capitalize, remove non-alphanumeric
    const formattedUsername = username
      ? username.slice(0, 5).toUpperCase().replace(/[^A-Z0-9]/g, '')
      : '';

    const randomCode = this.generateRandomString(length);

    if (formattedUsername) {
      return `${prefix}-${formattedUsername}-${randomCode}`;
    } else {
      return `${prefix}-${randomCode}`;
    }
  }

  static generateApiKey(length: number = 64): string {
    return randomBytes(length / 2).toString('hex');
  }

  private static generateRandomString(length: number): string {
    const bytes = randomBytes(length);
    let result = '';
    
    for (let i = 0; i < length; i++) {
      result += this.CHARACTERS[bytes[i] % this.CHARACTERS.length];
    }
    
    return result;
  }

  static validateReferralCode(code: string): boolean {
    // Pattern: RAYLS-[USERNAME]-[8CHARS] or RAYLS-[8CHARS] (legacy)
    const patternWithUsername = /^RAYLS-[A-Z0-9]{1,5}-[A-Za-z0-9]{8}$/;
    const patternLegacy = /^RAYLS-[A-Za-z0-9]{8}$/;
    return patternWithUsername.test(code) || patternLegacy.test(code);
  }

  static extractCodeFromRef(ref: string): string | null {
    if (this.validateReferralCode(ref)) {
      return ref;
    }
    return null;
  }

  static isValidFormat(code: string): { valid: boolean; error?: string } {
    if (!code) {
      return { valid: false, error: 'Referral code is required' };
    }

    if (!this.validateReferralCode(code)) {
      return {
        valid: false,
        error: 'Invalid format. Expected: RAYLS-[USERNAME]-[8 characters] or RAYLS-[8 characters]'
      };
    }

    return { valid: true };
  }

  static async createUserReferral(userData: {
    xId: string;
    username: string;
    referredByCode?: string;
  }): Promise<string> {
    let referralCode = '';
    let isUnique = false;
    let attempts = 0;
    const maxAttempts = 10;

    // Generate unique referral code with retry logic
    while (!isUnique && attempts < maxAttempts) {
      referralCode = this.generateCode({
        username: userData.username
      });

      const exists = await ReferralDbService.checkReferralCodeExists(referralCode);

      if (!exists) {
        isUnique = true;
      }
      attempts++;
    }

    if (!isUnique) {
      throw new Error('Unable to generate unique referral code. Please try again.');
    }

    // Create referral database record
    await ReferralDbService.createReferralRecord({
      xId: userData.xId,
      referralCode: referralCode,
      username: userData.username,
      referredByCode: userData.referredByCode
    });

    return referralCode;
  }
}

export interface ReferralContext {
  referralCode: string;
  timestamp: number;
  referrerXId?: string;
}

export class ReferralCookieManager {
  private static readonly COOKIE_NAME = 'sentient_ref';
  private static readonly COOKIE_MAX_AGE = 30 * 24 * 60 * 60 * 1000; // 30 days

  static setCookie(response: Response, context: ReferralContext): void {
    const cookieValue = this.encodeCookieValue(context);
    const expires = new Date(Date.now() + this.COOKIE_MAX_AGE);
    
    response.headers.set('Set-Cookie', 
      `${this.COOKIE_NAME}=${cookieValue}; ` +
      `Path=/; ` +
      `Expires=${expires.toUTCString()}; ` +
      `HttpOnly; ` +
      `SameSite=Lax; ` +
      `Secure`
    );
  }

  static getCookie(request: Request): ReferralContext | null {
    const cookieHeader = request.headers.get('cookie');
    if (!cookieHeader) return null;

    const cookies = cookieHeader.split(';').reduce((acc, cookie) => {
      const [key, value] = cookie.trim().split('=');
      acc[key] = value;
      return acc;
    }, {} as Record<string, string>);

    const cookieValue = cookies[this.COOKIE_NAME];
    if (!cookieValue) return null;

    return this.decodeCookieValue(cookieValue);
  }

  static clearCookie(response: Response): void {
    response.headers.set('Set-Cookie', 
      `${this.COOKIE_NAME}=; ` +
      `Path=/; ` +
      `Expires=Thu, 01 Jan 1970 00:00:00 GMT; ` +
      `HttpOnly; ` +
      `SameSite=Lax`
    );
  }

  private static encodeCookieValue(context: ReferralContext): string {
    return Buffer.from(JSON.stringify(context)).toString('base64');
  }

  static decodeCookieValue(value: string): ReferralContext | null {
    try {
      const decoded = Buffer.from(value, 'base64').toString('utf-8');
      const context = JSON.parse(decoded) as ReferralContext;
      
      // Check if cookie is expired
      const now = Date.now();
      if (now - context.timestamp > this.COOKIE_MAX_AGE) {
        return null;
      }
      
      return context;
    } catch {
      return null;
    }
  }

  static isValidContext(context: ReferralContext | null): boolean {
    if (!context) return false;
    
    const validation = ReferralCodeGenerator.isValidFormat(context.referralCode);
    return validation.valid;
  }
}