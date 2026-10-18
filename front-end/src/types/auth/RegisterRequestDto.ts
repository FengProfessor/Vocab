import { CertLevel } from '@/types/enums/CertLevel';
import { UserRole } from '@/types/enums/UserRole';

/**
 * Request payload for registering a new LingoPro account.
 */
export interface RegisterRequestDto {
  /** Full display name of the user. */
  fullName: string;

  /** Email address used for login and verification. */
  email: string;

  /** Account password (minimum 8 characters). */
  password: string;

  /** Requested initial role (Student or Teacher). */
  role: UserRole;

  /** Initial target certification level. */
  targetCertLevel: CertLevel;
}
