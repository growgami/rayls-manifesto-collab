import { NextAuthOptions, getServerSession as nextAuthGetServerSession } from "next-auth";
import TwitterProvider from "next-auth/providers/twitter";
import { TwitterUserData } from "@/features/signing/modules/auth/types/user.types";
import { AuthUserService } from "@/features/signing/services/signing.service";
import { getDatabase } from "@/shared/lib/mongodb.lib";
import { WalletModel } from "@/features/signing/modules/wallet/models/wallet.model";
import { ReferralModel } from "@/features/signing/modules/referral/models/referral.model";

/**
 * Upgrades Twitter profile image URL from low-res to original high-res
 * Removes _normal suffix to get the original resolution image
 */
const upgradeTwitterImageUrl = (url: string): string => {
  if (!url) return url;
  return url.replace(/_normal\.(jpg|jpeg|png|gif|webp)$/i, '.$1');
};

/**
 * Retry helper for Twitter API calls with exponential backoff
 * Handles rate limiting (429) and temporary errors (403, 500, 502, 503)
 */
async function retryTwitterApiCall<T>(
  apiCall: () => Promise<T>,
  maxRetries: number = 3,
  initialDelayMs: number = 1000
): Promise<T> {
  let lastError: Error | null = null;

  for (let attempt = 0; attempt < maxRetries; attempt++) {
    try {
      return await apiCall();
    } catch (error: any) {
      lastError = error;
      const statusCode = error?.status || error?.response?.status;

      // Log the error with details
      console.error(`[TWITTER-API-RETRY] Attempt ${attempt + 1}/${maxRetries} failed:`, {
        status: statusCode,
        message: error?.message,
        timestamp: new Date().toISOString()
      });

      // Don't retry on client errors except rate limit (429) and forbidden (403)
      if (statusCode && statusCode >= 400 && statusCode < 500 && statusCode !== 403 && statusCode !== 429) {
        console.error(`[TWITTER-API-RETRY] Non-retryable error (${statusCode}), aborting`);
        throw error;
      }

      // If this was the last attempt, throw
      if (attempt === maxRetries - 1) {
        console.error(`[TWITTER-API-RETRY] Max retries reached, giving up`);
        throw error;
      }

      // Exponential backoff: 1s, 2s, 4s
      const delayMs = initialDelayMs * Math.pow(2, attempt);
      console.log(`[TWITTER-API-RETRY] Retrying in ${delayMs}ms...`);
      await new Promise(resolve => setTimeout(resolve, delayMs));
    }
  }

  throw lastError || new Error('Twitter API call failed after retries');
}

export const authOptions: NextAuthOptions = {
  providers: [
    TwitterProvider({
      clientId: process.env.TWITTER_CLIENT_ID!,
      clientSecret: process.env.TWITTER_CLIENT_SECRET!,
      version: "2.0",
      userinfo: {
        url: "https://api.twitter.com/2/users/me",
        params: {
          "user.fields": "created_at,description,name,profile_image_url,public_metrics,url,username,verified",
        },
        // Add custom request function with retry logic
        async request({ tokens }) {
          // Retry wrapper for userinfo fetch
          return await retryTwitterApiCall(async () => {
            console.log(`[TWITTER-USERINFO] Fetching user info...`);
            const response = await fetch(
              `https://api.twitter.com/2/users/me?user.fields=created_at,description,name,profile_image_url,public_metrics,url,username,verified`,
              {
                headers: {
                  Authorization: `Bearer ${tokens.access_token}`,
                },
              }
            );

            if (!response.ok) {
              const errorText = await response.text();
              console.error(`[TWITTER-USERINFO] HTTP ${response.status}:`, errorText);

              const error: any = new Error(`Twitter API error: ${response.status} ${response.statusText}`);
              error.status = response.status;
              error.response = { status: response.status, data: errorText };
              throw error;
            }

            const data = await response.json();
            console.log(`[TWITTER-USERINFO] Successfully fetched user: @${data.data?.username}`);
            return data;
          }, 3, 1000); // 3 retries, 1 second initial delay
        },
      },
      profile(profile) {
        console.log(`[TWITTER-PROFILE] Processing profile for user: @${profile.data?.username}`);
        const userData = profile.data;
        const highResImageUrl = upgradeTwitterImageUrl(userData.profile_image_url || "");
        const followersCount = userData.public_metrics?.followers_count || 0;
        console.log(`[TWITTER-PROFILE] Followers count: ${followersCount}`);

        const twitterData: TwitterUserData = {
          created_at: userData.created_at || "",
          description: userData.description || "",
          id: userData.id,
          name: userData.name,
          profile_image_url: highResImageUrl,
          url: userData.url || "",
          username: userData.username,
          followers_count: followersCount,
        };

        return {
          id: userData.id,
          name: userData.name,
          email: undefined,
          image: highResImageUrl,
          twitterData,
        };
      },
    }),
  ],
  session: {
    strategy: "jwt",
  },
  callbacks: {
    async jwt({ token, user }) {
      // Initial sign-in: process user data
      if (user) {
        try {
          const userData = {
            id: user.id!,
            name: user.name!,
            email: user.email,
            image: user.image,
            twitterData: user.twitterData as TwitterUserData,
          };

          const xId = userData.twitterData.id;

          // SYNCHRONOUS PATH: Create user + referral together - completes OAuth in one go
          const [userResult, db] = await Promise.race([
            Promise.all([
              AuthUserService.createUserOnly(userData),
              getDatabase()
            ]),
            new Promise<never>((_, reject) =>
              setTimeout(() => reject(new Error('User creation timeout')), 5000)
            )
          ]);

          // Store user data immediately
          token.twitterData = userData.twitterData;
          token.dbUserId = userResult.user._id?.toString();
          token.isNewUser = userResult.isNewUser;
          token.insufficientFollowers = userResult.insufficientFollowers || false;

          // For new users, try to create referral synchronously
          if (userResult.needsReferralCreation && !userResult.insufficientFollowers) {
            console.log(`🔄 Creating referral synchronously for @${userData.twitterData.username}`);

            const referralCode = await Promise.race([
              AuthUserService.createUserReferral(userData),
              new Promise<null>((resolve) => setTimeout(() => {
                console.warn(`⏱️ Referral creation timeout in OAuth - will retry in session callback`);
                resolve(null);
              }, 4000))
            ]);

            if (referralCode) {
              console.log(`✅ Referral created in OAuth: ${referralCode}`);
              // Fetch the created referral data
              const referral = await new ReferralModel(db).findByXId(xId);
              if (referral) {
                token.referralData = {
                  referralCode: referral.referralCode,
                  position: referral.position,
                  referralCount: referral.referralCount,
                  linkVisits: referral.linkVisits,
                  isKOL: referral.isKOL
                };
                token.position = referral.position;
                token.referralCode = referral.referralCode;
              }
            } else {
              // Referral creation timed out - mark for retry in session callback
              console.warn(`⚠️ Referral creation timed out - marking for session retry`);
              token.needsReferralCreation = true;
              token.tempUserData = userData;
            }
          } else {
            // Existing user or insufficient followers - fetch referral data
            const referral = await Promise.race([
              new ReferralModel(db).findByXId(xId),
              new Promise<null>((resolve) => setTimeout(() => resolve(null), 1500))
            ]);

            token.referralData = referral ? {
              referralCode: referral.referralCode,
              position: referral.position,
              referralCount: referral.referralCount,
              linkVisits: referral.linkVisits,
              isKOL: referral.isKOL
            } : null;
            token.position = referral?.position;
            token.referralCode = referral?.referralCode;
          }

          // Fetch wallet data
          const wallet = await Promise.race([
            new WalletModel(db).findByXId(xId),
            new Promise<null>((resolve) => setTimeout(() => resolve(null), 1500))
          ]);

          token.wallet = wallet ? {
            walletAddress: wallet.walletAddress,
            blockchainType: wallet.blockchainType,
            createdAt: wallet.createdAt
          } : null;

          token.processingComplete = true;
          token.needsProcessing = false;

        } catch (error) {
          console.error('Failed to process authenticated user during OAuth:', error);

          // Still allow authentication to succeed - defer processing
          token.twitterData = user.twitterData;
          token.tempUserId = user.id;
          token.tempUserData = {
            id: user.id!,
            name: user.name!,
            email: user.email,
            image: user.image,
            twitterData: user.twitterData as TwitterUserData,
          };
          token.needsProcessing = true;
          token.processingComplete = false;
        }
      }

      // Deferred user creation processing (fallback from old flow)
      else if (token.needsProcessing && token.tempUserData && !token.processingComplete) {
        try {
          const result = await Promise.race([
            AuthUserService.createUserOnly(token.tempUserData),
            new Promise<never>((_, reject) =>
              setTimeout(() => reject(new Error('Deferred processing timeout')), 2000)
            )
          ]);

          // Update token
          token.dbUserId = result.user._id?.toString();
          token.isNewUser = result.isNewUser;
          token.needsProcessing = false;
          token.processingComplete = true;

          // If new user, mark for referral creation
          if (result.needsReferralCreation) {
            token.needsReferralCreation = true;
          } else {
            delete token.tempUserData;
            delete token.tempUserId;
          }
        } catch (error) {
          console.error('Failed deferred user processing:', error);
          // Keep needsProcessing true to retry on next request
        }
      }

      return token;
    },
    async session({ session, token }) {
      // Include only necessary Twitter data (minimize exposure)
      if (token.twitterData) {
        const fullData = token.twitterData as TwitterUserData;
        // Only expose fields actually used in the UI
        session.user.twitterData = {
          id: fullData.id,
          name: fullData.name,
          username: fullData.username,
          profile_image_url: fullData.profile_image_url,
          // Excluded: created_at, description, url (not displayed in UI)
          created_at: '',
          description: '',
          url: '',
        } as TwitterUserData;
      }

      // CRITICAL: Ensure referral exists before returning session (BLOCKING)
      // This prevents users from ever seeing position #0
      if (token.needsReferralCreation && token.tempUserData && token.twitterData) {
        const xId = token.twitterData.id;
        try {
          const db = await getDatabase();
          const referralModel = new ReferralModel(db);

          // Check if referral exists
          let referral = await referralModel.findByXId(xId);

          // If no referral exists and user should have one, create it NOW (BLOCKING)
          if (!referral && !token.insufficientFollowers) {
            console.log(`🔧 [SESSION-BLOCKING] Referral missing for xId: ${xId} - creating now...`);

            // Create referral with extended timeout (15 seconds)
            const referralCode = await Promise.race([
              AuthUserService.createUserReferral(token.tempUserData),
              new Promise<null>((resolve) => setTimeout(() => {
                console.error(`❌ [SESSION-BLOCKING] Referral creation timeout for xId: ${xId}`);
                resolve(null);
              }, 15000))
            ]);

            if (referralCode) {
              console.log(`✅ [SESSION-BLOCKING] Referral created: ${referralCode}`);
              // Fetch the newly created referral
              referral = await referralModel.findByXId(xId);
            } else {
              console.error(`❌ [SESSION-BLOCKING] Failed to create referral for xId: ${xId}`);
            }
          }

          // Update token with referral data
          if (referral) {
            token.referralData = {
              referralCode: referral.referralCode,
              position: referral.position,
              referralCount: referral.referralCount,
              linkVisits: referral.linkVisits,
              isKOL: referral.isKOL
            };
            token.position = referral.position;
            token.referralCode = referral.referralCode;
            token.needsReferralCreation = false;
            // Clear temp data once referral is confirmed
            delete token.tempUserData;
          }
        } catch (error) {
          console.error('[SESSION-BLOCKING] Error ensuring referral exists:', error);
        }
      }

      // Transfer processed data to session
      if (token.processingComplete || token.dbUserId) {
        if (token.dbUserId) {
          session.user.dbUserId = token.dbUserId as string;
        }
        if (token.isNewUser !== undefined) {
          session.user.isNewUser = token.isNewUser as boolean;
        }
        if (token.referralCode) {
          session.user.referralCode = token.referralCode as string;
        }
        // Transfer wallet data to session
        if (token.wallet) {
          session.user.wallet = token.wallet as {
            walletAddress: string;
            blockchainType: any;
            createdAt: Date;
          };
        }
        // Transfer referral data to session
        if (token.referralData) {
          session.user.referralData = token.referralData as {
            referralCode: string;
            position: number;
            referralCount: number;
            linkVisits: number;
            isKOL: boolean;
          };
        }
        // Transfer position to session
        if (token.position !== undefined) {
          session.user.position = token.position as number;
        }
        // Transfer insufficient followers flag
        if (token.insufficientFollowers) {
          session.user.insufficientFollowers = token.insufficientFollowers as boolean;
        }
      } else if (token.needsProcessing) {
        // Signal to client that background processing may be needed
        session.user.needsBackgroundProcessing = true;
      }

      return session;
    },
  },
  debug: process.env.NEXTAUTH_DEBUG === "true",
  // Event handlers for logging and monitoring
  events: {
    async signIn({ user, profile }) {
      console.log(`✅ [AUTH-EVENT] User signed in:`, {
        username: (profile as any)?.data?.username,
        xId: user.id,
        timestamp: new Date().toISOString()
      });
    },
  },
  // Error handling and logging
  logger: {
    error(code: any, metadata?: any) {
      // Enhanced logging for OAuth callback errors
      if (code?.error === 'OAuthCallbackError' || code?.name === 'OAuthCallbackError') {
        const errorMessage = code?.message || String(code);
        console.error(`❌ [OAUTH-ERROR] ${errorMessage}`, {
          error: code?.error || code?.name,
          providerId: metadata?.providerId,
          message: errorMessage,
          timestamp: new Date().toISOString(),
          metadata: metadata
        });

        // Special handling for 403 errors
        if (errorMessage?.includes('403') || errorMessage?.includes('Forbidden')) {
          console.error(`🚫 [TWITTER-403] Twitter API returned 403 Forbidden:`, {
            possibleCauses: [
              'Rate limiting (75 requests per 15 min)',
              'User revoked app permissions',
              'Missing required OAuth scopes',
              'Twitter API temporary issue'
            ],
            recommendedAction: 'Check Twitter Developer Portal for rate limits and app status',
            timestamp: new Date().toISOString()
          });
        }
      } else {
        console.error(`❌ [AUTH-ERROR]`, code, metadata);
      }
    },
    warn(code: any) {
      console.warn(`⚠️ [AUTH-WARN]`, code);
    },
    debug(code: any, metadata?: any) {
      if (process.env.NEXTAUTH_DEBUG === "true") {
        console.log(`🔍 [AUTH-DEBUG]`, code, metadata);
      }
    },
  },
  // Cookie configuration for PKCE
  cookies: {
    pkceCodeVerifier: {
      name: "next-auth.pkce.code_verifier",
      options: {
        httpOnly: true,
        sameSite: "lax",
        path: "/",
        domain: ".raylsmanifesto.com",
        secure: process.env.NODE_ENV === "production",
      },
    },
    state: {
      name: "next-auth.state",
      options: {
        httpOnly: true,
        sameSite: "lax",
        path: "/",
        domain: ".raylsmanifesto.com",
        secure: process.env.NODE_ENV === "production",
      },
    },
  },
};

export const getServerSession = () => nextAuthGetServerSession(authOptions);