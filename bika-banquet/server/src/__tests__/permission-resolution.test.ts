import {
  resolveEffectivePermissions,
  canAccess,
} from '../utils/permissions';

describe('resolveEffectivePermissions', () => {
  it('unions role and granted permissions, de-duplicated', () => {
    const { permissions } = resolveEffectivePermissions(
      ['view_booking', 'edit_booking'],
      ['view_reports', 'view_booking'],
      []
    );
    expect(permissions.sort()).toEqual(
      ['edit_booking', 'view_booking', 'view_reports'].sort()
    );
  });

  it('removes denied permissions from the effective set (deny wins over role)', () => {
    const { permissions, deniedPermissions } = resolveEffectivePermissions(
      ['view_customer', 'delete_customer', 'manage_customers'],
      [],
      ['delete_customer']
    );
    expect(permissions).not.toContain('delete_customer');
    expect(permissions).toContain('manage_customers');
    expect(deniedPermissions).toEqual(['delete_customer']);
  });

  it('removes denied permissions even when also granted (deny wins over grant)', () => {
    const { permissions } = resolveEffectivePermissions(
      [],
      ['delete_booking'],
      ['delete_booking']
    );
    expect(permissions).not.toContain('delete_booking');
  });

  it('returns empty effective set when no roles, grants, or denies', () => {
    const { permissions, deniedPermissions } = resolveEffectivePermissions(
      [],
      [],
      []
    );
    expect(permissions).toEqual([]);
    expect(deniedPermissions).toEqual([]);
  });
});

describe('canAccess', () => {
  const denied = ['delete_user'];

  it('allows when a required permission is present and none denied', () => {
    expect(canAccess(['view_user', 'manage_users'], ['view_user'], [])).toBe(true);
  });

  it('blocks when none of the required permissions is held', () => {
    expect(canAccess(['view_user'], ['view_booking'], [])).toBe(false);
  });

  it('blocks when a required permission is denied, even under an umbrella', () => {
    // user holds manage_users (umbrella) but delete_user is explicitly denied
    expect(canAccess(['delete_user', 'manage_users'], ['manage_users'], denied)).toBe(
      false
    );
  });

  it('allows umbrella-only routes when an unrelated permission is denied', () => {
    expect(canAccess(['manage_users'], ['manage_users'], denied)).toBe(true);
  });
});
