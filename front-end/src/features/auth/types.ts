import {
  AccountStatus,
  AuthProviderType,
  CertLevel,
  SubscriptionPlanType,
  UserRole as DotNetUserRole,
} from '@/types/enums';

export type UserRole = 'teacher' | 'student';
export type Plan = 'free' | 'pro' | 'premium';

export interface Profile {
  id: string;
  email: string;
  full_name: string;
  avatar_url?: string;
  role: UserRole;
  created_at: string;
  daily_goal?: number;
  notification_hour?: number;
  fcm_token?: string | null;
  plan?: Plan;
  plan_expires_at?: string | null;
  province?: string | null;
  city?: string | null;
}

/** Token dài hạn cho Chrome Extension — DB chỉ lưu SHA-256 hash (service-role only). */
export interface ExtensionToken {
  id: string;
  user_id: string;
  token_hash: string;
  created_at: string;
  last_used_at?: string | null;
}

export interface UserGamification {
  user_id: string;
  total_xp: number;
  current_streak: number;
  longest_streak: number;
  last_active_date: string | null;
  daily_goal: number;
  today_xp: number;
  today_date: string | null;
}

/**
 * Mode of the unified authentication page. The values match the `?mode=` query parameter used by the server login page.
 */
export enum AuthMode {
  Login = 'login',
  Signup = 'signup',
}

/**
 * Represents the authenticated learner, teacher, or administrator profile.
 */
export interface UserProfileDto {
  id: string;
  email: string;
  fullName: string;
  avatarUrl: string | null;
  role: DotNetUserRole;
  authProvider: AuthProviderType;
  accountStatus: AccountStatus;
  targetCertLevel: CertLevel;
  subscriptionPlan: SubscriptionPlanType;
  streakDays: number;
  totalXp: number;
  learningGoal?: string | null;
  dailyTargetMins?: number;
}

/**
 * Client-side view of the authenticated session.
 */
export interface AuthSessionDto {
  user: UserProfileDto;
}

/**
 * Token and identity fields returned by the server's AuthTokensDto (camelCase JSON).
 */
export interface AuthTokensPayload {
  userId: string;
  email: string;
  fullName: string;
  role: DotNetUserRole | string;
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
}

/**
 * Represents the detected in-app browser or WebView context where Google OAuth is restricted.
 */
export interface InAppBrowserInfo {
  isInApp: boolean;
  appName: string | null;
  isAndroid: boolean;
  isIOS: boolean;
}

/**
 * Request payload for email and password authentication.
 */
export interface LoginRequestDto {
  email: string;
  password: string;
  redirectTo?: string;
}

/**
 * Request payload for registering a new LingoPro account.
 */
export interface RegisterRequestDto {
  fullName: string;
  email: string;
  password: string;
  role: DotNetUserRole;
  targetCertLevel: CertLevel;
}

export type SelectableRole = DotNetUserRole.Student | DotNetUserRole.Teacher;

/**
 * Profile payload returned by GET /api/v1/auth/profile (backend ProfileDto, camelCase JSON).
 */
export interface ServerProfilePayload {
  id: string;
  email: string;
  fullName: string;
  avatarUrl: string | null;
  role: DotNetUserRole | string;
  plan?: SubscriptionPlanType | string;
  subscriptionPlan?: SubscriptionPlanType;
  totalXp?: number;
  currentStreak?: number;
  streakDays?: number;
  learningGoal?: string | null;
  dailyTargetMins?: number;
  targetCertLevel?: CertLevel;
}
