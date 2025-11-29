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

          // FAST PATH: Create user only (no referral) - completes OAuth quickly
          const [userResult, db] = await Promise.race([
            Promise.all([
              AuthUserService.createUserOnly(userData),
              getDatabase()
            ]),
            new Promise<never>((_, reject) =>
              setTimeout(() => reject(new Error('User creation timeout')), 3000)
            )
          ]);

          // Store user data immediately
          token.twitterData = userData.twitterData;
          token.dbUserId = userResult.user._id?.toString();
          token.isNewUser = userResult.isNewUser;
          token.insufficientFollowers = userResult.insufficientFollowers || false;

          // Fetch wallet data quickly
          const wallet = await Promise.race([
            new WalletModel(db).findByXId(xId),
            new Promise<null>((resolve) => setTimeout(() => resolve(null), 1500))
          ]);

          token.wallet = wallet ? {
            walletAddress: wallet.walletAddress,
            blockchainType: wallet.blockchainType,
            createdAt: wallet.createdAt
          } : null;

          // NON-BLOCKING: Start referral creation in background if needed
          if (userResult.needsReferralCreation && !userResult.insufficientFollowers) {
            console.log(`🔄 Starting background referral creation for @${userData.twitterData.username}`);
            token.needsReferralCreation = true;
            token.tempUserData = userData;

            // Fire and forget - create referral async (with longer timeout)
            AuthUserService.createUserReferral(userData)
              .then(async (referralCode) => {
                if (referralCode) {
                  console.log(`✅ Background referral created: ${referralCode}`);
                } else {
                  console.error(`❌ Background referral creation failed - will retry on next session`);
                }
              })
              .catch((error) => {
                console.error('❌ Background referral creation error:', error);
              });
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

      // Subsequent requests: repair missing referrals if needed
      else if (token.needsReferralCreation && token.tempUserData) {
        try {
          const xId = token.tempUserData.twitterData.id;
          const db = await getDatabase();
          const referralModel = new ReferralModel(db);

          // Check if referral was created (might have completed in background)
          const existingReferral = await referralModel.findByXId(xId);

          if (existingReferral) {
            console.log(`✅ Referral found during repair check: ${existingReferral.referralCode}`);
            // Referral exists - update token
            token.referralData = {
              referralCode: existingReferral.referralCode,
              position: existingReferral.position,
              referralCount: existingReferral.referralCount,
              linkVisits: existingReferral.linkVisits,
              isKOL: existingReferral.isKOL
            };
            token.position = existingReferral.position;
            token.referralCode = existingReferral.referralCode;
            token.needsReferralCreation = false;
            delete token.tempUserData;
          } else {
            console.log(`🔧 Attempting to repair missing referral for xId: ${xId}`);
            // Referral still missing - try to create it now
            const referralCode = await Promise.race([
              AuthUserService.createUserReferral(token.tempUserData),
              new Promise<null>((resolve) => setTimeout(() => resolve(null), 5000))
            ]);

            if (referralCode) {
              console.log(`✅ Referral repaired successfully: ${referralCode}`);
              // Fetch the newly created referral
              const newReferral = await referralModel.findByXId(xId);
              if (newReferral) {
                token.referralData = {
                  referralCode: newReferral.referralCode,
                  position: newReferral.position,
                  referralCount: newReferral.referralCount,
                  linkVisits: newReferral.linkVisits,
                  isKOL: newReferral.isKOL
                };
                token.position = newReferral.position;
                token.referralCode = newReferral.referralCode;
                token.needsReferralCreation = false;
                delete token.tempUserData;
              }
            } else {
              console.error(`❌ Referral repair failed - will retry on next session`);
              // Keep needsReferralCreation true to retry again
            }
          }
        } catch (error) {
          console.error('Failed referral repair:', error);
          // Keep needsReferralCreation true to retry on next request
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