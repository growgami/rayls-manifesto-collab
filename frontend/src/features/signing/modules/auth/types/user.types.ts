export interface TwitterUserData {
  created_at: string;
  description: string;
  id: string;
  name: string;
  profile_image_url: string;
  url: string;
  username: string;
}

export interface User {
  id: string;
  name?: string;
  email?: string;
  image?: string;
  twitterData?: TwitterUserData;
  dbUserId?: string;
}

export interface AuthSession {
  user: User;
  expires: string;
}