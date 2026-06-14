export interface UserProfile {
  id: string;
  bio: string | null;
  avatar: string | null;
  headline: string | null;
}

export interface SanitizedUser {
  id: number;
  userId: number;
  username: string;
  name: string;
  email: string;
  emailVerifiedAt: string | null;
  profile: UserProfile;
  bgType: string;
  bgColor: string;
  bgGradientStart: string;
  bgGradientEnd: string;
  textColor: string;
  buttonColor: string;
  createdAt: string;
  seoTitle: string | null;
  seoDescription: string | null;
  socialImage: string | null;
  customDomain: string | null;
  googleAnalyticsId: string | null;
  metaPixelId: string | null;
  tiktokPixelId: string | null;
}

export interface UpdateProfileInput {
  name?: string;
  bio?: string | null;
  avatar?: string | null;
  headline?: string | null;
}

export interface UpdateThemeInput {
  bgType?: "solid" | "gradient";
  bgColor?: string;
  bgGradientStart?: string;
  bgGradientEnd?: string;
  textColor?: string;
  buttonColor?: string;
}

export interface ThemeData {
  bgType: string;
  bgColor: string;
  bgGradientStart: string;
  bgGradientEnd: string;
  textColor: string;
  buttonColor: string;
}
