import { UserRole } from '@/types/enums/UserRole';

/**
 * Props for the RoleRouteGuard component.
 */
export interface RoleRouteGuardProps {
  /** Roles allowed to see the nested routes. */
  allowedRoles: readonly UserRole[];
}
