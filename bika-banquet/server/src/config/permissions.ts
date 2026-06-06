/**
 * Single source of truth for application permissions and the default
 * permission sets granted to built-in roles.
 *
 * This registry is consumed by:
 *   - src/utils/syncPermissions.ts (idempotent boot/CLI sync)
 *   - src/seed.ts (initial database seed)
 *
 * When adding a new permission, add it here only. The sync utility will
 * create it and grant it to the Admin role automatically.
 */

export interface PermissionDef {
  name: string;
  description: string;
}

export const PERMISSIONS: PermissionDef[] = [
  { name: 'view_dashboard', description: 'View dashboard' },
  { name: 'view_reports', description: 'View analytics and reports' },
  { name: 'view_calendar', description: 'View calendar' },
  { name: 'add_user', description: 'Add users' },
  { name: 'view_user', description: 'View users' },
  { name: 'edit_user', description: 'Edit users' },
  { name: 'delete_user', description: 'Delete users' },
  { name: 'add_customer', description: 'Add customers' },
  { name: 'view_customer', description: 'View customers' },
  { name: 'edit_customer', description: 'Edit customers' },
  { name: 'delete_customer', description: 'Delete customers' },
  { name: 'assign_role', description: 'Assign roles' },
  { name: 'add_role', description: 'Add roles' },
  { name: 'view_role', description: 'View roles' },
  { name: 'edit_role', description: 'Edit roles' },
  { name: 'delete_role', description: 'Delete roles' },
  { name: 'manage_permission', description: 'Manage permissions' },
  { name: 'add_permission', description: 'Add permissions' },
  { name: 'view_permission', description: 'View permissions' },
  { name: 'edit_permission', description: 'Edit permissions' },
  { name: 'delete_permission', description: 'Delete permissions' },
  { name: 'add_item', description: 'Add items' },
  { name: 'view_item', description: 'View items' },
  { name: 'edit_item', description: 'Edit items' },
  { name: 'delete_item', description: 'Delete items' },
  { name: 'add_itemtype', description: 'Add item types' },
  { name: 'view_itemtype', description: 'View item types' },
  { name: 'edit_itemtype', description: 'Edit item types' },
  { name: 'delete_itemtype', description: 'Delete item types' },
  { name: 'add_hall', description: 'Add halls' },
  { name: 'view_hall', description: 'View halls' },
  { name: 'edit_hall', description: 'Edit halls' },
  { name: 'delete_hall', description: 'Delete halls' },
  { name: 'add_banquet', description: 'Add banquets' },
  { name: 'view_banquet', description: 'View banquets' },
  { name: 'edit_banquet', description: 'Edit banquets' },
  { name: 'delete_banquet', description: 'Delete banquets' },
  { name: 'add_booking', description: 'Add bookings' },
  { name: 'view_booking', description: 'View bookings' },
  { name: 'edit_booking', description: 'Edit bookings' },
  { name: 'delete_booking', description: 'Delete bookings' },
  { name: 'add_enquiry', description: 'Add enquiries' },
  { name: 'view_enquiry', description: 'View enquiries' },
  { name: 'edit_enquiry', description: 'Edit enquiries' },
  { name: 'delete_enquiry', description: 'Delete enquiries' },
  { name: 'send_templatemenu', description: 'Send template menu' },
  { name: 'download_templatemenu', description: 'Download template menu' },
  { name: 'add_templatemenu', description: 'Add template menu' },
  { name: 'view_templatemenu', description: 'View template menu' },
  { name: 'edit_templatemenu', description: 'Edit template menu' },
  { name: 'delete_templatemenu', description: 'Delete template menu' },
  { name: 'manage_payments', description: 'Manage payments' },
  { name: 'manage_enquiries', description: 'Manage enquiries' },
  { name: 'manage_bookings', description: 'Manage bookings' },
  { name: 'manage_customers', description: 'Manage customers' },
  { name: 'manage_users', description: 'Manage users' },
  { name: 'manage_roles', description: 'Manage roles and permissions' },
  // New permissions introduced by the user-management overhaul.
  { name: 'manage_menu', description: 'Manage menu: items, item types, templates, ingredients, vendors' },
  { name: 'manage_halls', description: 'Manage halls and banquets' },
  { name: 'cancel_booking', description: 'Cancel bookings' },
  { name: 'view_audit_logs', description: 'View audit logs' },
];

/** Set of every permission name, for parity checks. */
export const PERMISSION_NAMES: Set<string> = new Set(PERMISSIONS.map((p) => p.name));

/**
 * Default permission sets for built-in non-admin roles.
 * Admin always receives ALL permissions and is therefore not listed here.
 * These defaults are only applied when a role has zero permissions assigned,
 * so an operator's customizations are never overwritten.
 */
export const DEFAULT_ROLE_PERMISSIONS: Record<string, string[]> = {
  Manager: [
    'view_dashboard',
    'view_reports',
    'view_calendar',
    'view_customer',
    'add_customer',
    'edit_customer',
    'manage_customers',
    'view_enquiry',
    'add_enquiry',
    'edit_enquiry',
    'manage_enquiries',
    'view_booking',
    'add_booking',
    'edit_booking',
    'cancel_booking',
    'manage_bookings',
    'manage_payments',
    'view_hall',
    'view_banquet',
    'view_item',
    'view_itemtype',
    'view_templatemenu',
  ],
  Employee: [
    'view_dashboard',
    'view_calendar',
    'view_customer',
    'add_customer',
    'edit_customer',
    'view_enquiry',
    'add_enquiry',
    'view_booking',
    'add_booking',
    'view_hall',
    'view_banquet',
    'view_item',
    'view_itemtype',
    'view_templatemenu',
  ],
};
