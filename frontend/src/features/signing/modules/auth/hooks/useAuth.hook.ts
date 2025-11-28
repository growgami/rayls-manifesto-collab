import { useSession, signIn, signOut } from "next-auth/react";
import { AuthSession, TwitterUserData, MIN_FOLLOWERS_REQUIRED } from "@/features/signing/modules/auth/types/user.types";

export const useAuth = () => {
  const { data: session, status } = useSession();

  const isLoading = status === "loading";
  const isAuthenticated = status === "authenticated";
  const user = session?.user;
  const twitterData = session?.user?.twitterData as TwitterUserData | undefined;
  const referralCode = session?.user?.referralCode;
  const insufficientFollowers = session?.user?.insufficientFollowers || false;

  const handleSignIn = () => signIn("twitter");
  const handleSignOut = () => signOut();

  return {
    session: session as AuthSession | null,
    user,
    twitterData,
    referralCode,
    isLoading,
    isAuthenticated,
    insufficientFollowers,
    minFollowersRequired: MIN_FOLLOWERS_REQUIRED,
    signIn: handleSignIn,
    signOut: handleSignOut,
  };
};