export interface TwitterUserData {
  created_at: string;
  description: string;
  id: string;
  name: string;
  profile_image_url: string;
  url: string;
  username: string;
  followers_count?: number;
}

/** Minimum followers required to sign the manifesto */
export const MIN_FOLLOWERS_REQUIRED = 50;

export interface User {
  id: string;
  name?: string;
  email?: string;
  image?: string;
  twitterData?: TwitterUserData;
  dbUserId?: string;
  referralCode?: string;
}

export interface AuthSession {
  user: User;
  expires: string;
}