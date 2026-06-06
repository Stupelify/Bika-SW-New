/**
 * Pure permission-resolution helpers (no DB / no I/O) so they can be unit
 * tested in isolation.
 *
 * Effective access model:
 *   - A user's permissions come from their role(s).
 *   - Per-user GRANT overrides add extra permissions on top of roles.
 *   - Per-user DENY overrides remove permissions, and DENY wins: a denied
 *     permission is never effective and also blocks any route that requires
 *     it, even when an umbrella permission (e.g. `manage_users`) is present.
 */

export interface EffectivePermissions {
  /** Permissions the user effectively has: (role ∪ grant) minus deny. */
  permissions: string[];
  /** Permissions explicitly denied for this user. */
  deniedPermissions: string[];
}

/**
 * Compute a user's effective permissions from role permissions plus per-user
 * grant and deny overrides. Deny always wins over role/grant.
 */
export function resolveEffectivePermissions(
  rolePermissions: string[],
  grantedPermissions: string[],
  deniedPermissions: string[]
): EffectivePermissions {
  const denied = new Set(deniedPermissions);
  const effective = Array.from(
    new Set([...rolePermissions, ...grantedPermissions])
  ).filter((permission) => !denied.has(permission));
  return { permissions: effective, deniedPermissions: Array.from(denied) };
}

/**
 * Route guard decision: a request is allowed when it holds at least one of the
 * required permissions AND none of the required permissions is denied.
 *
 * Note: routes typically list a granular permission plus its `manage_*`
 * umbrella (e.g. `['delete_user', 'manage_users']`). Denying the granular
 * permission blocks the route as intended. Avoid denying an umbrella
 * permission directly, since it would block every route that lists it.
 */
export function canAccess(
  required: string[],
  permissions: string[],
  deniedPermissions: string[]
): boolean {
  if (required.some((permission) => deniedPermissions.includes(permission))) {
    return false;
  }
  return required.some((permission) => permissions.includes(permission));
}
