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

/**
 * Retry helper for referral creation with exponential backoff
 * Treats "already exists" as success (idempotency)
 * More aggressive timeouts: 2s, 4s, 8s
 */
async function retryReferralCreation<T>(
  createFn: () => Promise<T>,
  context: string,
  maxRetries: number = 3,
  initialDelayMs: number = 2000
): Promise<{ success: boolean; data?: T }> {
  for (let attempt = 0; attempt < maxRetries; attempt++) {
    try {
      console.log(`🔄 [${context}] Attempt ${attempt + 1}/${maxRetries} - Creating referral...`);
      const result = await createFn();

      // If result indicates success (including "already exists"), return success
      if (result && typeof result === 'object' && ('success' in result || 'alreadyExists' in result)) {
        const typedResult = result as { success?: boolean; alreadyExists?: boolean; position?: number };
        console.log(`✅ [${context}] Referral creation successful (attempt ${attempt + 1})`, {
          alreadyExists: typedResult.alreadyExists,
          position: typedResult.position
        });
        return { success: true, data: result };
      }

      return { success: true, data: result };
    } catch (error) {
      const err = error as Error;

      console.error(`❌ [${context}] Attempt ${attempt + 1}/${maxRetries} failed:`, {
        message: err?.message,
        name: err?.name,
        timestamp: new Date().toISOString()
      });

      // If this was the last attempt, return failure
      if (attempt === maxRetries - 1) {
        console.error(`❌ [${context}] Max retries reached - referral creation failed`);
        return { success: false };
      }

      // Exponential backoff: 2s, 4s, 8s
      const delayMs = initialDelayMs * Math.pow(2, attempt);
      console.log(`⏳ [${context}] Retrying in ${delayMs}ms...`);
      await new Promise(resolve => setTimeout(resolve, delayMs));
    }
  }

  console.error(`❌ [${context}] All retry attempts exhausted`);
  return { success: false };
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

          // Queue referral creation instead of synchronous processing
          if (userResult.needsReferralCreation && !userResult.insufficientFollowers) {
            console.log(
              `🔄 [OAUTH] Queuing referral creation for @${userData.twitterData.username}`
            );

            try {
              const { getReferralQueue } = await import('@/shared/lib/queue.lib');
              const queue = await getReferralQueue();

              // Get referral cookie
              const cookies = await import('next/headers');
              const cookieStore = cookies.cookies();
              const referralCookie = (await cookieStore).get('sentient_ref');
              let referredByCode: string | undefined;

              if (referralCookie) {
                try {
                  const parsedCookie = JSON.parse(referralCookie.value);
                  referredByCode = parsedCookie.referralCode;
                  console.log(`🔗 [OAUTH] Found referral code: ${referredByCode}`);
                } catch {
                  console.log('⚠️ [OAUTH] Failed to parse referral cookie');
                }
              }

              // Add job to queue with deduplication
              const job = await queue.add(
                'create-referral',
                {
                  xId: userData.id,
                  username: userData.twitterData.username,
                  name: userData.name,
                  email: userData.email,
                  image: userData.image,
                  twitterData: userData.twitterData,
                  referredByCode,
                },
                {
                  jobId: `referral-${userData.id}`, // Deduplication key
                  removeOnComplete: true,
                  removeOnFail: false,
                }
              );

              console.log(`✅ [OAUTH] Referral job queued: ${job.id}`);
              token.referralProcessing = true;
              token.referralJobId = job.id;
            } catch (queueError) {
              console.error('❌ [OAUTH] Failed to queue:', queueError);
              token.needsReferralCreation = true; // Fallback retry
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

      // Check if referral is still processing
      else if (token.referralProcessing && token.referralJobId) {
        const db = await getDatabase();
        const referral = await new ReferralModel(db).findByXId(xId);

        if (referral) {
          // Completed - update token
          token.referralData = {
            referralCode: referral.referralCode,
            position: referral.position,
            isKOL: referral.isKOL,
            referralCount: referral.referralCount,
            linkVisits: referral.linkVisits,
          };
          token.position = referral.position;
          token.referralCode = referral.referralCode;
          token.referralProcessing = false;
          delete token.referralJobId;
          console.log(`✅ [JWT] Referral completed for @${existingUser.username}`);
        } else {
          // Check job status
          const { getReferralQueue } = await import('@/shared/lib/queue.lib');
          const queue = await getReferralQueue();
          const job = await queue.getJob(token.referralJobId as string);

          if (job) {
            const state = await job.getState();

            if (state === 'completed') {
              // Refetch referral
              const referralAfterJob = await new ReferralModel(db).findByXId(xId);
              if (referralAfterJob) {
                token.referralData = {
                  referralCode: referralAfterJob.referralCode,
                  position: referralAfterJob.position,
                  isKOL: referralAfterJob.isKOL,
                  referralCount: referralAfterJob.referralCount,
                  linkVisits: referralAfterJob.linkVisits,
                };
                token.position = referralAfterJob.position;
                token.referralCode = referralAfterJob.referralCode;
                token.referralProcessing = false;
                delete token.referralJobId;
              }
            } else if (state === 'failed') {
              token.referralFailed = true;
              token.referralProcessing = false;
              delete token.referralJobId;
              console.error(`❌ [JWT] Referral job failed for @${existingUser.username}`);
            }
            // Keep polling if waiting/active
          } else {
            // Job not found, mark as failed
            token.referralFailed = true;
            token.referralProcessing = false;
            delete token.referralJobId;
          }
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

      // Session callback runs after JWT callback - no token modifications here
      // All retry logic is handled in the JWT callback above
      if (token.needsReferralCreation) {
        // Log warning but don't block - JWT callback will retry on next request
        console.warn(`⚠️ [SESSION] User still needs referral creation - will retry on next request`);
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