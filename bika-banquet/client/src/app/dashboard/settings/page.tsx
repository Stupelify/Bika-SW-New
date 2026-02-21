'use client';

import { FormEvent, useEffect, useMemo, useState } from 'react';
import { api } from '@/lib/api';
import { toast } from 'sonner';
import { KeyRound, Save, Settings2, Shield, Trash2, Users } from 'lucide-react';
import FormPromptModal from '@/components/FormPromptModal';

interface UserRow {
  id: string;
  name?: string | null;
  email: string;
  userRoles?: Array<{
    role: {
      id: string;
      name: string;
    };
  }>;
}

interface RoleRow {
  id: string;
  name: string;
  description?: string | null;
  permissions?: Array<{
    permission: {
      id: string;
      name: string;
    };
  }>;
  _count?: {
    userRoles: number;
  };
}

interface PermissionRow {
  id: string;
  name: string;
  description?: string | null;
  _count?: {
    roles: number;
  };
}

interface CurrentUser {
  id: string;
  email: string;
  name?: string | null;
  roles: string[];
  permissions: string[];
}

interface PermissionGroup {
  key: string;
  label: string;
  permissions: PermissionRow[];
}

const ACTION_TOKENS = new Set([
  'add',
  'view',
  'edit',
  'delete',
  'manage',
  'assign',
  'send',
  'download',
]);

const ACTION_ORDER = ['assign', 'manage', 'add', 'view', 'edit', 'delete', 'send', 'download'];
const KEEP_MANAGE_ACTION_SUBJECTS = new Set(['permission', 'payment']);

const SUBJECT_ALIASES: Record<string, string> = {
  users: 'user',
  user: 'user',
  customers: 'customer',
  customer: 'customer',
  roles: 'role',
  role: 'role',
  permissions: 'permission',
  permission: 'permission',
  items: 'item',
  item: 'item',
  itemtypes: 'itemtype',
  itemtype: 'itemtype',
  halls: 'hall',
  hall: 'hall',
  banquets: 'banquet',
  banquet: 'banquet',
  bookings: 'booking',
  booking: 'booking',
  enquiries: 'enquiry',
  enquiry: 'enquiry',
  templatemenus: 'templatemenu',
  templatemenu: 'templatemenu',
  calendars: 'calendar',
  calendar: 'calendar',
  dashboards: 'dashboard',
  dashboard: 'dashboard',
  reports: 'report',
  report: 'report',
};

const SUBJECT_LABELS: Record<string, string> = {
  user: 'USER',
  customer: 'CUSTOMER',
  role: 'ROLE',
  permission: 'PERMISSION',
  item: 'ITEM',
  itemtype: 'ITEMTYPE',
  hall: 'HALL',
  banquet: 'BANQUET',
  booking: 'BOOKING',
  enquiry: 'ENQUIRY',
  templatemenu: 'TEMPLATEMENU',
  calendar: 'CALENDAR',
  dashboard: 'DASHBOARD',
  report: 'REPORTS',
};

const SUBJECT_ORDER = [
  'user',
  'customer',
  'role',
  'permission',
  'item',
  'itemtype',
  'hall',
  'banquet',
  'booking',
  'enquiry',
  'templatemenu',
  'calendar',
  'dashboard',
  'report',
];

function normalizeSubject(subject: string): string {
  const key = subject.toLowerCase();
  return SUBJECT_ALIASES[key] || key;
}

function actionOrder(action: string): number {
  const index = ACTION_ORDER.indexOf(action.toLowerCase());
  return index === -1 ? ACTION_ORDER.length : index;
}

function formatAction(action: string): string {
  const clean = action.trim();
  if (!clean) return 'Manage';
  return clean.charAt(0).toUpperCase() + clean.slice(1).toLowerCase();
}

function parsePermissionName(name: string): { action: string; subject: string } {
  const parts = name.split('_').filter(Boolean);
  if (parts.length === 0) {
    return { action: 'manage', subject: 'general' };
  }
  if (ACTION_TOKENS.has(parts[0])) {
    return { action: parts[0], subject: parts.slice(1).join('_') || 'general' };
  }
  if (ACTION_TOKENS.has(parts[parts.length - 1])) {
    return {
      action: parts[parts.length - 1],
      subject: parts.slice(0, -1).join('_') || 'general',
    };
  }
  return { action: parts[0], subject: parts.slice(1).join('_') || 'general' };
}

const initialRoleForm = {
  name: '',
  description: '',
};

const initialPermissionForm = {
  name: '',
  description: '',
};

const initialUserForm = {
  name: '',
  email: '',
  password: '',
  roleId: '',
};

export default function SettingsPage() {
  const [users, setUsers] = useState<UserRow[]>([]);
  const [roles, setRoles] = useState<RoleRow[]>([]);
  const [permissions, setPermissions] = useState<PermissionRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [savingRole, setSavingRole] = useState(false);
  const [savingPermission, setSavingPermission] = useState(false);
  const [savingUserRoles, setSavingUserRoles] = useState(false);
  const [savingRolePermissions, setSavingRolePermissions] = useState(false);
  const [savingUser, setSavingUser] = useState(false);
  const [showRolePrompt, setShowRolePrompt] = useState(false);
  const [showPermissionPrompt, setShowPermissionPrompt] = useState(false);
  const [showUserPrompt, setShowUserPrompt] = useState(false);
  const [currentUser, setCurrentUser] = useState<CurrentUser | null>(null);

  const [roleForm, setRoleForm] = useState(initialRoleForm);
  const [permissionForm, setPermissionForm] = useState(initialPermissionForm);
  const [userForm, setUserForm] = useState(initialUserForm);

  const [selectedUserId, setSelectedUserId] = useState('');
  const [selectedRoleIds, setSelectedRoleIds] = useState<string[]>([]);
  const [selectedRoleId, setSelectedRoleId] = useState('');
  const [selectedPermissionIds, setSelectedPermissionIds] = useState<string[]>([]);
  const [newRolePermissionIds, setNewRolePermissionIds] = useState<string[]>([]);
  const [activeSettingsSection, setActiveSettingsSection] = useState<
    'access' | 'users' | 'roles' | 'permissions'
  >('access');

  useEffect(() => {
    void loadData();
  }, []);

  useEffect(() => {
    if (!selectedUserId && users.length > 0) {
      setSelectedUserId(users[0].id);
    }
  }, [users, selectedUserId]);

  useEffect(() => {
    if (!selectedRoleId && roles.length > 0) {
      setSelectedRoleId(roles[0].id);
    }
  }, [roles, selectedRoleId]);

  const selectedUser = useMemo(
    () => users.find((user) => user.id === selectedUserId),
    [users, selectedUserId]
  );

  const selectedRole = useMemo(
    () => roles.find((role) => role.id === selectedRoleId),
    [roles, selectedRoleId]
  );

  const currentPermissionSet = useMemo(
    () => new Set(currentUser?.permissions || []),
    [currentUser]
  );

  const canViewUsers =
    currentPermissionSet.has('view_user') || currentPermissionSet.has('manage_users');
  const canAddUsers =
    currentPermissionSet.has('add_user') || currentPermissionSet.has('manage_users');
  const canDeleteUsers =
    currentPermissionSet.has('delete_user') || currentPermissionSet.has('manage_users');
  const canViewRoles =
    currentPermissionSet.has('view_role') || currentPermissionSet.has('manage_roles');
  const canAddRoles =
    currentPermissionSet.has('add_role') || currentPermissionSet.has('manage_roles');
  const canDeleteRoles =
    currentPermissionSet.has('delete_role') || currentPermissionSet.has('manage_roles');
  const canViewPermissions =
    currentPermissionSet.has('view_permission') ||
    currentPermissionSet.has('manage_permission') ||
    currentPermissionSet.has('manage_roles');
  const canAddPermissions =
    currentPermissionSet.has('add_permission') ||
    currentPermissionSet.has('manage_permission') ||
    currentPermissionSet.has('manage_roles');
  const canDeletePermissions =
    currentPermissionSet.has('delete_permission') ||
    currentPermissionSet.has('manage_permission') ||
    currentPermissionSet.has('manage_roles');
  const canAssignRoles =
    currentPermissionSet.has('assign_role') || currentPermissionSet.has('manage_roles');
  const canManagePermission =
    currentPermissionSet.has('manage_permission') || currentPermissionSet.has('manage_roles');
  const canManageRolePermissions = canManagePermission;

  const canAccessUsersSection = canViewUsers || canAddUsers || canDeleteUsers;
  const canAccessRolesSection = canViewRoles || canAddRoles || canDeleteRoles;
  const canAccessPermissionsSection =
    canViewPermissions || canAddPermissions || canDeletePermissions;
  const canViewAccessSection = canAssignRoles || canManageRolePermissions;

  useEffect(() => {
    const availableSections: Array<'access' | 'users' | 'roles' | 'permissions'> = [];
    if (canViewAccessSection) availableSections.push('access');
    if (canAccessUsersSection) availableSections.push('users');
    if (canAccessRolesSection) availableSections.push('roles');
    if (canAccessPermissionsSection) availableSections.push('permissions');
    if (availableSections.length === 0) return;
    if (!availableSections.includes(activeSettingsSection)) {
      setActiveSettingsSection(availableSections[0]);
    }
  }, [
    activeSettingsSection,
    canAccessPermissionsSection,
    canAccessRolesSection,
    canAccessUsersSection,
    canViewAccessSection,
  ]);

  const permissionGroups = useMemo<PermissionGroup[]>(() => {
    const groups = new Map<string, PermissionGroup>();
    const subjectsWithGranularActions = new Set<string>();

    permissions.forEach((permission) => {
      const { action, subject } = parsePermissionName(permission.name);
      const key = normalizeSubject(subject);
      if (action.toLowerCase() !== 'manage') {
        subjectsWithGranularActions.add(key);
      }
    });

    permissions.forEach((permission) => {
      const { action, subject } = parsePermissionName(permission.name);
      const key = normalizeSubject(subject);
      if (
        action.toLowerCase() === 'manage' &&
        subjectsWithGranularActions.has(key) &&
        !KEEP_MANAGE_ACTION_SUBJECTS.has(key)
      ) {
        return;
      }
      const label = SUBJECT_LABELS[key] || key.replace(/_/g, ' ').toUpperCase();
      const group = groups.get(key) || { key, label, permissions: [] };
      group.permissions.push(permission);
      groups.set(key, group);
    });

    const sortedGroups = Array.from(groups.values())
      .map((group) => ({
        ...group,
        permissions: [...group.permissions].sort((a, b) => {
          const actionA = parsePermissionName(a.name).action;
          const actionB = parsePermissionName(b.name).action;
          const orderDelta = actionOrder(actionA) - actionOrder(actionB);
          if (orderDelta !== 0) return orderDelta;
          return a.name.localeCompare(b.name);
        }),
      }))
      .sort((a, b) => {
        const indexA = SUBJECT_ORDER.indexOf(a.key);
        const indexB = SUBJECT_ORDER.indexOf(b.key);
        const safeA = indexA === -1 ? SUBJECT_ORDER.length : indexA;
        const safeB = indexB === -1 ? SUBJECT_ORDER.length : indexB;
        if (safeA !== safeB) return safeA - safeB;
        return a.label.localeCompare(b.label);
      });

    return sortedGroups;
  }, [permissions]);

  useEffect(() => {
    if (!selectedUser) return;
    setSelectedRoleIds(selectedUser.userRoles?.map((ur) => ur.role.id) || []);
  }, [selectedUser]);

  useEffect(() => {
    if (!selectedRole) return;
    setSelectedPermissionIds(selectedRole.permissions?.map((rp) => rp.permission.id) || []);
  }, [selectedRole]);

  const loadData = async () => {
    try {
      setLoading(true);
      const meRes = await api.getCurrentUser();
      const me = (meRes.data?.data?.user || null) as CurrentUser | null;
      setCurrentUser(me);

      const permissionSet = new Set(me?.permissions || []);
      const canReadUsers =
        permissionSet.has('view_user') ||
        permissionSet.has('manage_users') ||
        permissionSet.has('assign_role');
      const canReadRoles =
        permissionSet.has('view_role') ||
        permissionSet.has('manage_roles') ||
        permissionSet.has('assign_role') ||
        permissionSet.has('add_user') ||
        permissionSet.has('manage_permission');
      const canReadPermissions =
        permissionSet.has('view_permission') ||
        permissionSet.has('manage_permission') ||
        permissionSet.has('manage_roles') ||
        permissionSet.has('add_role');

      const [usersRes, rolesRes, permissionsRes] = await Promise.all([
        canReadUsers ? api.getUsers({ page: 1, limit: 200 }) : Promise.resolve(null),
        canReadRoles ? api.getRoles() : Promise.resolve(null),
        canReadPermissions ? api.getPermissions() : Promise.resolve(null),
      ]);

      setUsers(usersRes?.data?.data?.users || []);
      setRoles(rolesRes?.data?.data?.roles || []);
      setPermissions(permissionsRes?.data?.data?.permissions || []);
    } catch (error) {
      toast.error('Failed to load settings data');
    } finally {
      setLoading(false);
    }
  };

  const createRole = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!canAddRoles) {
      toast.error('You do not have permission to create roles');
      return;
    }
    if (!roleForm.name.trim()) {
      toast.error('Role name is required');
      return;
    }
    try {
      setSavingRole(true);
      const response = await api.createRole({
        name: roleForm.name.trim(),
        description: roleForm.description.trim() || undefined,
      });
      const createdRoleId = response.data?.data?.role?.id;
      if (createdRoleId && newRolePermissionIds.length > 0 && canManageRolePermissions) {
        await api.updateRolePermissions({
          roleId: createdRoleId,
          permissionIds: newRolePermissionIds,
        });
      }
      toast.success('Role created');
      setShowRolePrompt(false);
      setRoleForm(initialRoleForm);
      setNewRolePermissionIds([]);
      await loadData();
    } catch (error: any) {
      toast.error(error?.response?.data?.error || 'Failed to create role');
    } finally {
      setSavingRole(false);
    }
  };

  const createPermission = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!canAddPermissions) {
      toast.error('You do not have permission to create permissions');
      return;
    }
    if (!permissionForm.name.trim()) {
      toast.error('Permission name is required');
      return;
    }
    try {
      setSavingPermission(true);
      await api.createPermission({
        name: permissionForm.name.trim(),
        description: permissionForm.description.trim() || undefined,
      });
      toast.success('Permission created');
      setShowPermissionPrompt(false);
      setPermissionForm(initialPermissionForm);
      await loadData();
    } catch (error: any) {
      toast.error(error?.response?.data?.error || 'Failed to create permission');
    } finally {
      setSavingPermission(false);
    }
  };

  const updateUserRoles = async () => {
    if (!canAssignRoles) {
      toast.error('You do not have permission to assign roles');
      return;
    }
    if (!selectedUserId) {
      toast.error('Select a user first');
      return;
    }
    try {
      setSavingUserRoles(true);
      await api.updateUserRoles({
        userId: selectedUserId,
        roleIds: selectedRoleIds,
      });
      toast.success('User roles updated');
      await loadData();
    } catch (error: any) {
      toast.error(error?.response?.data?.error || 'Failed to update user roles');
    } finally {
      setSavingUserRoles(false);
    }
  };

  const updateRolePermissions = async () => {
    if (!canManageRolePermissions) {
      toast.error('You do not have permission to manage role permissions');
      return;
    }
    if (!selectedRoleId) {
      toast.error('Select a role first');
      return;
    }
    try {
      setSavingRolePermissions(true);
      await api.updateRolePermissions({
        roleId: selectedRoleId,
        permissionIds: selectedPermissionIds,
      });
      toast.success('Role permissions updated');
      await loadData();
    } catch (error: any) {
      toast.error(error?.response?.data?.error || 'Failed to update permissions');
    } finally {
      setSavingRolePermissions(false);
    }
  };

  const toggleRole = (roleId: string) => {
    setSelectedRoleIds((prev) =>
      prev.includes(roleId) ? prev.filter((id) => id !== roleId) : [...prev, roleId]
    );
  };

  const removeUser = async (id: string) => {
    if (!canDeleteUsers) {
      toast.error('You do not have permission to delete users');
      return;
    }
    if (!confirm('Delete this user?')) return;
    try {
      await api.deleteUser(id);
      toast.success('User deleted');
      await loadData();
    } catch (error: any) {
      toast.error(error?.response?.data?.error || 'Failed to delete user');
    }
  };

  const createUser = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!canAddUsers) {
      toast.error('You do not have permission to create users');
      return;
    }
    if (!userForm.name.trim() || !userForm.email.trim() || !userForm.password.trim()) {
      toast.error('Name, email and password are required');
      return;
    }

    try {
      setSavingUser(true);
      await api.createUser({
        name: userForm.name.trim(),
        email: userForm.email.trim(),
        password: userForm.password,
        roleId: userForm.roleId || undefined,
      });
      toast.success('User created');
      setShowUserPrompt(false);
      setUserForm(initialUserForm);
      await loadData();
    } catch (error: any) {
      toast.error(error?.response?.data?.error || 'Failed to create user');
    } finally {
      setSavingUser(false);
    }
  };

  const togglePermissionId = (permissionId: string, setter: (value: string[]) => void, current: string[]) => {
    setter(current.includes(permissionId) ? current.filter((id) => id !== permissionId) : [...current, permissionId]);
  };

  const togglePermissionGroup = (
    group: PermissionGroup,
    setter: (value: string[]) => void,
    current: string[]
  ) => {
    const groupPermissionIds = group.permissions.map((permission) => permission.id);
    const isAllSelected = groupPermissionIds.every((id) => current.includes(id));
    if (isAllSelected) {
      setter(current.filter((id) => !groupPermissionIds.includes(id)));
      return;
    }
    const merged = new Set([...current, ...groupPermissionIds]);
    setter(Array.from(merged));
  };

  const removeRole = async (id: string) => {
    if (!canDeleteRoles) {
      toast.error('You do not have permission to delete roles');
      return;
    }
    if (!confirm('Delete this role?')) return;
    try {
      await api.deleteRole(id);
      toast.success('Role deleted');
      await loadData();
    } catch (error: any) {
      toast.error(error?.response?.data?.error || 'Failed to delete role');
    }
  };

  const removePermission = async (id: string) => {
    if (!canDeletePermissions) {
      toast.error('You do not have permission to delete permissions');
      return;
    }
    if (!confirm('Delete this permission?')) return;
    try {
      await api.deletePermission(id);
      toast.success('Permission deleted');
      await loadData();
    } catch (error: any) {
      toast.error(error?.response?.data?.error || 'Failed to delete permission');
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Settings & Access</h1>
        <p className="text-gray-600 mt-1">
          Manage users, roles and permissions with role-based access control.
        </p>
      </div>

      <FormPromptModal
        open={showRolePrompt}
        title="Create Role"
        onClose={() => setShowRolePrompt(false)}
        widthClass="max-w-4xl"
      >
        <form className="space-y-4" onSubmit={createRole}>
          <div>
            <label className="label">Role name</label>
            <input
              className="input"
              value={roleForm.name}
              onChange={(e) => setRoleForm((prev) => ({ ...prev, name: e.target.value }))}
              required
            />
          </div>
          <div>
            <label className="label">Description</label>
            <textarea
              className="input min-h-[90px]"
              value={roleForm.description}
              onChange={(e) =>
                setRoleForm((prev) => ({ ...prev, description: e.target.value }))
              }
            />
          </div>
          <div className="space-y-3">
            <p className="text-sm font-semibold text-gray-900">Permissions</p>
            {!canManageRolePermissions || !canViewPermissions ? (
              <p className="text-sm text-gray-500">
                Role permissions can be assigned later by users with permission access.
              </p>
            ) : permissionGroups.length === 0 ? (
              <p className="text-sm text-gray-500">No permissions available yet.</p>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {permissionGroups.map((group) => {
                  const groupPermissionIds = group.permissions.map((permission) => permission.id);
                  const groupSelected = groupPermissionIds.every((id) =>
                    newRolePermissionIds.includes(id)
                  );
                  return (
                    <div key={group.key} className="rounded-xl border border-gray-200 p-3">
                      <div className="flex items-center justify-between mb-3">
                        <p className="text-sm font-semibold text-gray-900">{group.label}</p>
                        <label className="inline-flex items-center gap-2 text-xs text-gray-600">
                          <input
                            type="checkbox"
                            checked={groupSelected}
                            onChange={() =>
                              togglePermissionGroup(
                                group,
                                setNewRolePermissionIds,
                                newRolePermissionIds
                              )
                            }
                          />
                          All
                        </label>
                      </div>
                      <div className="grid grid-cols-2 gap-2">
                        {group.permissions.map((permission) => {
                          const permissionId = permission.id;
                          const label = formatAction(parsePermissionName(permission.name).action);
                          return (
                            <label key={permissionId} className="flex items-center gap-2 text-sm text-gray-700">
                              <input
                                type="checkbox"
                                checked={newRolePermissionIds.includes(permissionId)}
                                onChange={() =>
                                  togglePermissionId(
                                    permissionId,
                                    setNewRolePermissionIds,
                                    newRolePermissionIds
                                  )
                                }
                              />
                              {label}
                            </label>
                          );
                        })}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
          <div className="form-actions">
            <button
              type="button"
              className="btn btn-secondary"
              onClick={() => setShowRolePrompt(false)}
            >
              Cancel
            </button>
            <button className="btn btn-primary" type="submit" disabled={savingRole}>
              <span className="inline-flex items-center gap-2">
                <Save className="w-4 h-4" />
                {savingRole ? 'Saving...' : 'Create Role'}
              </span>
            </button>
          </div>
        </form>
      </FormPromptModal>

      <FormPromptModal
        open={showUserPrompt}
        title="Create User"
        onClose={() => setShowUserPrompt(false)}
        widthClass="max-w-3xl"
      >
        <form className="space-y-4" onSubmit={createUser}>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="label">Full name</label>
              <input
                className="input"
                value={userForm.name}
                onChange={(e) => setUserForm((prev) => ({ ...prev, name: e.target.value }))}
                required
              />
            </div>
            <div>
              <label className="label">Email</label>
              <input
                type="email"
                className="input"
                value={userForm.email}
                onChange={(e) => setUserForm((prev) => ({ ...prev, email: e.target.value }))}
                required
              />
            </div>
            <div>
              <label className="label">Password</label>
              <input
                type="password"
                className="input"
                value={userForm.password}
                onChange={(e) =>
                  setUserForm((prev) => ({ ...prev, password: e.target.value }))
                }
                required
              />
            </div>
            <div>
              <label className="label">Role</label>
              <select
                className="input"
                value={userForm.roleId}
                onChange={(e) => setUserForm((prev) => ({ ...prev, roleId: e.target.value }))}
                disabled={!canViewRoles || roles.length === 0}
              >
                <option value="">Select role</option>
                {roles.map((role) => (
                  <option key={role.id} value={role.id}>
                    {role.name}
                  </option>
                ))}
              </select>
            </div>
          </div>
          <div className="form-actions">
            <button
              type="button"
              className="btn btn-secondary"
              onClick={() => setShowUserPrompt(false)}
            >
              Cancel
            </button>
            <button className="btn btn-primary" type="submit" disabled={savingUser}>
              <span className="inline-flex items-center gap-2">
                <Save className="w-4 h-4" />
                {savingUser ? 'Saving...' : 'Create User'}
              </span>
            </button>
          </div>
        </form>
      </FormPromptModal>

      <FormPromptModal
        open={showPermissionPrompt}
        title="Create Permission"
        onClose={() => setShowPermissionPrompt(false)}
        widthClass="max-w-2xl"
      >
        <form className="space-y-4" onSubmit={createPermission}>
          <div>
            <label className="label">Permission key</label>
            <input
              className="input"
              value={permissionForm.name}
              onChange={(e) =>
                setPermissionForm((prev) => ({ ...prev, name: e.target.value }))
              }
              placeholder="manage_bookings"
              required
            />
          </div>
          <div>
            <label className="label">Description</label>
            <textarea
              className="input min-h-[90px]"
              value={permissionForm.description}
              onChange={(e) =>
                setPermissionForm((prev) => ({ ...prev, description: e.target.value }))
              }
            />
          </div>
          <div className="form-actions">
            <button
              type="button"
              className="btn btn-secondary"
              onClick={() => setShowPermissionPrompt(false)}
            >
              Cancel
            </button>
            <button className="btn btn-primary" type="submit" disabled={savingPermission}>
              <span className="inline-flex items-center gap-2">
                <Save className="w-4 h-4" />
                {savingPermission ? 'Saving...' : 'Create Permission'}
              </span>
            </button>
          </div>
        </form>
      </FormPromptModal>

      <div className="card p-2">
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-2">
          {canViewAccessSection && (
            <button
              type="button"
              onClick={() => setActiveSettingsSection('access')}
              className={`px-4 py-2.5 rounded-xl text-sm font-semibold transition ${
                activeSettingsSection === 'access'
                  ? 'bg-primary-600 text-white shadow'
                  : 'bg-white text-gray-700 border border-gray-200 hover:border-primary-200'
              }`}
            >
              Access Mapping
            </button>
          )}
          {canAccessUsersSection && (
            <button
              type="button"
              onClick={() => setActiveSettingsSection('users')}
              className={`px-4 py-2.5 rounded-xl text-sm font-semibold transition ${
                activeSettingsSection === 'users'
                  ? 'bg-primary-600 text-white shadow'
                  : 'bg-white text-gray-700 border border-gray-200 hover:border-primary-200'
              }`}
            >
              Users
            </button>
          )}
          {canAccessRolesSection && (
            <button
              type="button"
              onClick={() => setActiveSettingsSection('roles')}
              className={`px-4 py-2.5 rounded-xl text-sm font-semibold transition ${
                activeSettingsSection === 'roles'
                  ? 'bg-primary-600 text-white shadow'
                  : 'bg-white text-gray-700 border border-gray-200 hover:border-primary-200'
              }`}
            >
              Roles
            </button>
          )}
          {canAccessPermissionsSection && (
            <button
              type="button"
              onClick={() => setActiveSettingsSection('permissions')}
              className={`px-4 py-2.5 rounded-xl text-sm font-semibold transition ${
                activeSettingsSection === 'permissions'
                  ? 'bg-primary-600 text-white shadow'
                  : 'bg-white text-gray-700 border border-gray-200 hover:border-primary-200'
              }`}
            >
              Permissions
            </button>
          )}
        </div>
      </div>

      {!canViewAccessSection &&
        !canAccessUsersSection &&
        !canAccessRolesSection &&
        !canAccessPermissionsSection && (
        <div className="card py-12 text-center">
          <p className="text-sm text-gray-600">
            You do not have permission to view settings sections.
          </p>
        </div>
      )}

      <div
        className={`grid grid-cols-1 xl:grid-cols-2 gap-6 ${
          activeSettingsSection === 'access' && canViewAccessSection ? '' : 'hidden'
        }`}
      >
        <div className="card space-y-4">
          <div className="flex items-center gap-2">
            <Users className="w-4 h-4 text-primary-600" />
            <h2 className="text-lg font-semibold text-gray-900">Assign roles to user</h2>
          </div>
          {!canViewUsers || !canViewRoles ? (
            <p className="text-sm text-gray-500">
              Assigning roles requires both `view_user` and `view_role` permissions.
            </p>
          ) : (
            <>
              <div>
                <label className="label">User</label>
                <select
                  className="input"
                  value={selectedUserId}
                  onChange={(e) => setSelectedUserId(e.target.value)}
                  disabled={!canAssignRoles || users.length === 0}
                >
                  {users.map((user) => (
                    <option key={user.id} value={user.id}>
                      {user.name || 'Unnamed'} ({user.email})
                    </option>
                  ))}
                </select>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {roles.map((role) => (
                  <label key={role.id} className="flex items-center gap-2 text-sm text-gray-700">
                    <input
                      type="checkbox"
                      checked={selectedRoleIds.includes(role.id)}
                      onChange={() => toggleRole(role.id)}
                    />
                    {role.name}
                  </label>
                ))}
              </div>
              <div className="flex justify-end">
                <button
                  className="btn btn-primary w-full sm:w-auto"
                  onClick={updateUserRoles}
                  disabled={savingUserRoles || !canAssignRoles}
                >
                  {savingUserRoles ? 'Saving...' : 'Save User Roles'}
                </button>
              </div>
              {!canAssignRoles && (
                <p className="text-sm text-gray-500">
                  You can view user-role mapping but cannot modify it.
                </p>
              )}
            </>
          )}
        </div>

        <div className="card space-y-4">
          <div className="flex items-center gap-2">
            <Settings2 className="w-4 h-4 text-primary-600" />
            <h2 className="text-lg font-semibold text-gray-900">Assign permissions to role</h2>
          </div>
          {!canViewRoles || !canViewPermissions ? (
            <p className="text-sm text-gray-500">
              Managing role permissions requires both `view_role` and `view_permission`.
            </p>
          ) : (
            <>
              <div>
                <label className="label">Role</label>
                <select
                  className="input"
                  value={selectedRoleId}
                  onChange={(e) => setSelectedRoleId(e.target.value)}
                  disabled={!canManageRolePermissions || roles.length === 0}
                >
                  {roles.map((role) => (
                    <option key={role.id} value={role.id}>
                      {role.name}
                    </option>
                  ))}
                </select>
              </div>
              {permissionGroups.length === 0 ? (
                <p className="text-sm text-gray-500">No permissions available yet.</p>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {permissionGroups.map((group) => {
                    const groupPermissionIds = group.permissions.map((permission) => permission.id);
                    const groupSelected = groupPermissionIds.every((id) =>
                      selectedPermissionIds.includes(id)
                    );
                    return (
                      <div key={group.key} className="rounded-xl border border-gray-200 p-3">
                        <div className="flex items-center justify-between mb-3">
                          <p className="text-sm font-semibold text-gray-900">{group.label}</p>
                          <label className="inline-flex items-center gap-2 text-xs text-gray-600">
                            <input
                              type="checkbox"
                              checked={groupSelected}
                              onChange={() =>
                                togglePermissionGroup(
                                  group,
                                  setSelectedPermissionIds,
                                  selectedPermissionIds
                                )
                              }
                            />
                            All
                          </label>
                        </div>
                        <div className="grid grid-cols-2 gap-2">
                          {group.permissions.map((permission) => {
                            const permissionId = permission.id;
                            const label = formatAction(parsePermissionName(permission.name).action);
                            return (
                              <label key={permissionId} className="flex items-center gap-2 text-sm text-gray-700">
                                <input
                                  type="checkbox"
                                  checked={selectedPermissionIds.includes(permissionId)}
                                  onChange={() =>
                                    togglePermissionId(
                                      permissionId,
                                      setSelectedPermissionIds,
                                      selectedPermissionIds
                                    )
                                  }
                                />
                                {label}
                              </label>
                            );
                          })}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
              <div className="flex justify-end">
                <button
                  className="btn btn-primary w-full sm:w-auto"
                  onClick={updateRolePermissions}
                  disabled={savingRolePermissions || !canManageRolePermissions}
                >
                  {savingRolePermissions ? 'Saving...' : 'Save Role Permissions'}
                </button>
              </div>
              {!canManageRolePermissions && (
                <p className="text-sm text-gray-500">
                  You can view role permissions but cannot modify them.
                </p>
              )}
            </>
          )}
        </div>
      </div>

      <div
        className={`grid grid-cols-1 xl:grid-cols-3 gap-6 ${
          activeSettingsSection === 'access' ? 'hidden' : ''
        }`}
      >
        <div className={`card ${activeSettingsSection === 'users' && canAccessUsersSection ? '' : 'hidden'}`}>
          <div className="page-head mb-4">
            <h2 className="text-lg font-semibold text-gray-900">Users</h2>
            {canAddUsers && (
              <button
                type="button"
                className="btn btn-primary inline-flex items-center gap-2 w-full sm:w-auto justify-center"
                onClick={() => setShowUserPrompt(true)}
              >
                <Users className="w-4 h-4" />
                Add
              </button>
            )}
          </div>
          {loading ? (
            <div className="py-10 flex items-center justify-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
            </div>
          ) : !canViewUsers ? (
            <p className="text-sm text-gray-500">
              You can create or delete users, but you do not have permission to view user records.
            </p>
          ) : (
            <div className="space-y-3">
              {users.map((user) => (
                <div key={user.id} className="border border-gray-200 rounded-lg p-3">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <p className="text-sm font-medium text-gray-900">{user.name || 'Unnamed user'}</p>
                      <p className="text-xs text-gray-500 mt-1">{user.email}</p>
                      <p className="text-xs text-gray-500 mt-1">
                        {(user.userRoles || []).map((ur) => ur.role.name).join(', ') || 'No roles'}
                      </p>
                    </div>
                    {canDeleteUsers && (
                      <button
                        className="p-2 text-gray-500 hover:text-red-700 hover:bg-red-50 rounded-lg"
                        onClick={() => removeUser(user.id)}
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className={`card ${activeSettingsSection === 'roles' && canAccessRolesSection ? '' : 'hidden'}`}>
          <div className="page-head mb-4">
            <h2 className="text-lg font-semibold text-gray-900">Roles</h2>
            {canAddRoles && (
              <button
                type="button"
                className="btn btn-primary inline-flex items-center gap-2 w-full sm:w-auto justify-center"
                onClick={() => setShowRolePrompt(true)}
              >
                <Shield className="w-4 h-4" />
                Add
              </button>
            )}
          </div>
          {loading ? (
            <div className="py-10 flex items-center justify-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
            </div>
          ) : !canViewRoles ? (
            <p className="text-sm text-gray-500">
              You can create or delete roles, but you do not have permission to view role records.
            </p>
          ) : (
            <div className="space-y-3">
              {roles.map((role) => (
                <div key={role.id} className="border border-gray-200 rounded-lg p-3">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <p className="text-sm font-medium text-gray-900">{role.name}</p>
                      <p className="text-xs text-gray-500 mt-1">
                        {role.permissions?.length || 0} permissions • {role._count?.userRoles || 0} users
                      </p>
                    </div>
                    {canDeleteRoles && (
                      <button
                        className="p-2 text-gray-500 hover:text-red-700 hover:bg-red-50 rounded-lg"
                        onClick={() => removeRole(role.id)}
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className={`card ${activeSettingsSection === 'permissions' && canAccessPermissionsSection ? '' : 'hidden'}`}>
          <div className="page-head mb-4">
            <h2 className="text-lg font-semibold text-gray-900">Permissions</h2>
            {canAddPermissions && (
              <button
                type="button"
                className="btn btn-primary inline-flex items-center gap-2 w-full sm:w-auto justify-center"
                onClick={() => setShowPermissionPrompt(true)}
              >
                <KeyRound className="w-4 h-4" />
                Add
              </button>
            )}
          </div>
          {loading ? (
            <div className="py-10 flex items-center justify-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
            </div>
          ) : !canViewPermissions ? (
            <p className="text-sm text-gray-500">
              You can manage permission definitions, but you do not have permission to view permission records.
            </p>
          ) : (
            <div className="space-y-3">
              {permissions.map((permission) => (
                <div key={permission.id} className="border border-gray-200 rounded-lg p-3">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <p className="text-sm font-medium text-gray-900">{permission.name}</p>
                      <p className="text-xs text-gray-500 mt-1">
                        {(permission._count?.roles || 0).toLocaleString()} linked roles
                      </p>
                    </div>
                    {canDeletePermissions && (
                      <button
                        className="p-2 text-gray-500 hover:text-red-700 hover:bg-red-50 rounded-lg"
                        onClick={() => removePermission(permission.id)}
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
