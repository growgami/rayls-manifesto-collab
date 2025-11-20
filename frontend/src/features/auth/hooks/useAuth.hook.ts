import { useSession, signIn, signOut } from "next-auth/react";
import { AuthSession, TwitterUserData } from "@/features/auth/types/user.types";

export const useAuth = () => {
  const { data: session, status } = useSession();

  const isLoading = status === "loading";
  const isAuthenticated = status === "authenticated";
  const user = session?.user;
  const twitterData = session?.user?.twitterData as TwitterUserData | undefined;

  const handleSignIn = () => signIn("twitter");
  const handleSignOut = () => signOut();

  return {
    session: session as AuthSession | null,
    user,
    twitterData,
    isLoading,
    isAuthenticated,
    signIn: handleSignIn,
    signOut: handleSignOut,
  };
};