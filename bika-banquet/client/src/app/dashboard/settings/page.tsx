'use client';

import { FormEvent, Suspense, useEffect, useMemo, useState } from 'react';
import { api } from '@/lib/api';
import { toast } from 'sonner';
import {
  Building2,
  Eye,
  EyeOff,
  KeyRound,
  Save,
  Search,
  Settings2,
  Shield,
  Trash2,
  Users,
} from 'lucide-react';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import EmptyState from '@/components/EmptyState';
import FormPromptModal from '@/components/FormPromptModal';
import { TableSkeleton } from '@/components/Skeletons';

interface UserRow {
  id: string;
  name?: string | null;
  email: string;
  createdAt?: string;
  userRoles?: Array<{
    role: {
      id: string;
      name: string;
    };
  }>;
}

interface BanquetOption {
  id: string;
  name: string;
  location?: string;
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
  user: 'Users',
  customer: 'Customers',
  role: 'Roles',
  permission: 'Permissions',
  item: 'Items',
  itemtype: 'Item Types',
  hall: 'Halls',
  banquet: 'Banquets',
  booking: 'Bookings',
  enquiry: 'Enquiries',
  templatemenu: 'Template Menus',
  calendar: 'Calendar',
  dashboard: 'Dashboard',
  report: 'Reports',
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

function formatPermissionLabel(name: string): string {
  const { action, subject } = parsePermissionName(name);
  const normalizedSubject = normalizeSubject(subject);
  const subjectLabel = SUBJECT_LABELS[normalizedSubject] || normalizedSubject.replace(/_/g, ' ');
  const singularSubject = subjectLabel.endsWith('s')
    ? subjectLabel.slice(0, -1)
    : subjectLabel;
  return `${formatAction(action)} ${singularSubject.toLowerCase()}`;
}

function arraysMatchAsSet(left: string[], right: string[]): boolean {
  if (left.length !== right.length) return false;
  const rightSet = new Set(right);
  return left.every((item) => rightSet.has(item));
}

function formatJoinedDate(value?: string): string | null {
  if (!value) return null;
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return null;
  return `Joined ${date.toLocaleDateString('en-IN', {
    month: 'short',
    year: 'numeric',
  })}`;
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
  confirmPassword: '',
  roleId: '',
  banquetAccess: [] as string[],
};
type SettingsSection = 'access' | 'users' | 'roles' | 'permissions';

function isSettingsSection(value: string | null): value is SettingsSection {
  return (
    value === 'access' ||
    value === 'users' ||
    value === 'roles' ||
    value === 'permissions'
  );
}

function SettingsPageContent() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
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
  const [userSearch, setUserSearch] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const [roleForm, setRoleForm] = useState(initialRoleForm);
  const [permissionForm, setPermissionForm] = useState(initialPermissionForm);
  const [userForm, setUserForm] = useState(initialUserForm);

  const [banquets, setBanquets] = useState<BanquetOption[]>([]);
  const [selectedUserId, setSelectedUserId] = useState('');
  const [selectedRoleIds, setSelectedRoleIds] = useState<string[]>([]);
  const [selectedUserBanquetIds, setSelectedUserBanquetIds] = useState<string[]>([]);
  const [savedUserBanquetIds, setSavedUserBanquetIds] = useState<string[]>([]);
  const [savingUserBanquets, setSavingUserBanquets] = useState(false);
  const [selectedRoleId, setSelectedRoleId] = useState('');
  const [selectedPermissionIds, setSelectedPermissionIds] = useState<string[]>([]);
  const [newRolePermissionIds, setNewRolePermissionIds] = useState<string[]>([]);
  const [activeSettingsSection, setActiveSettingsSection] =
    useState<SettingsSection>('access');
  const sectionParam = searchParams.get('section');

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

  const filteredUsers = useMemo(() => {
    const query = userSearch.trim().toLowerCase();
    if (!query) return users;
    return users.filter((user) => {
      const haystack = `${user.name || ''} ${user.email}`.toLowerCase();
      return haystack.includes(query);
    });
  }, [userSearch, users]);

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

  const availableSettingsSections = useMemo<SettingsSection[]>(() => {
    const availableSections: SettingsSection[] = [];
    if (canViewAccessSection) availableSections.push('access');
    if (canAccessUsersSection) availableSections.push('users');
    if (canAccessRolesSection) availableSections.push('roles');
    if (canAccessPermissionsSection) availableSections.push('permissions');
    return availableSections;
  }, [
    canAccessPermissionsSection,
    canAccessRolesSection,
    canAccessUsersSection,
    canViewAccessSection,
  ]);

  useEffect(() => {
    if (availableSettingsSections.length === 0) return;

    const requestedSection = isSettingsSection(sectionParam) ? sectionParam : null;
    const nextSection =
      requestedSection && availableSettingsSections.includes(requestedSection)
        ? requestedSection
        : availableSettingsSections[0];

    if (activeSettingsSection !== nextSection) {
      setActiveSettingsSection(nextSection);
    }

    if (sectionParam !== nextSection) {
      const params = new URLSearchParams(searchParams.toString());
      params.set('section', nextSection);
      router.replace(`${pathname}?${params.toString()}`, { scroll: false });
    }
  }, [
    activeSettingsSection,
    availableSettingsSections,
    pathname,
    router,
    searchParams,
    sectionParam,
  ]);

  const navigateToSettingsSection = (section: SettingsSection) => {
    if (!availableSettingsSections.includes(section)) return;
    const params = new URLSearchParams(searchParams.toString());
    params.set('section', section);
    router.replace(`${pathname}?${params.toString()}`, { scroll: false });
  };

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
    if (!selectedUserId) return;
    api.getUserBanquets(selectedUserId)
      .then((res) => {
        const ids: string[] = res.data?.data?.banquetIds || [];
        setSelectedUserBanquetIds(ids);
        setSavedUserBanquetIds(ids);
      })
      .catch(() => {});
  }, [selectedUserId]);

  useEffect(() => {
    if (!selectedRole) return;
    setSelectedPermissionIds(selectedRole.permissions?.map((rp) => rp.permission.id) || []);
  }, [selectedRole]);

  const selectedUserRoleIds = useMemo(
    () => selectedUser?.userRoles?.map((ur) => ur.role.id) || [],
    [selectedUser]
  );
  const selectedRolePermissionIds = useMemo(
    () => selectedRole?.permissions?.map((rp) => rp.permission.id) || [],
    [selectedRole]
  );
  const userRolesDirty = useMemo(
    () => !arraysMatchAsSet(selectedRoleIds, selectedUserRoleIds),
    [selectedRoleIds, selectedUserRoleIds]
  );
  const userBanquetsDirty = useMemo(
    () => !arraysMatchAsSet(selectedUserBanquetIds, savedUserBanquetIds),
    [selectedUserBanquetIds, savedUserBanquetIds]
  );
  const rolePermissionsDirty = useMemo(
    () => !arraysMatchAsSet(selectedPermissionIds, selectedRolePermissionIds),
    [selectedPermissionIds, selectedRolePermissionIds]
  );

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

      const [usersRes, rolesRes, permissionsRes, banquetsRes] = await Promise.all([
        canReadUsers ? api.getUsers({ page: 1, limit: 5000 }) : Promise.resolve(null),
        canReadRoles ? api.getRoles() : Promise.resolve(null),
        canReadPermissions ? api.getPermissions() : Promise.resolve(null),
        api.getBanquets({ page: 1, limit: 500 }),
      ]);

      setUsers(usersRes?.data?.data?.users || []);
      setRoles(rolesRes?.data?.data?.roles || []);
      setPermissions(permissionsRes?.data?.data?.permissions || []);
      setBanquets(banquetsRes?.data?.data?.banquets || []);
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

  const saveUserBanquets = async () => {
    if (!selectedUserId) { toast.error('Select a user first'); return; }
    try {
      setSavingUserBanquets(true);
      await api.setUserBanquets(selectedUserId, selectedUserBanquetIds);
      setSavedUserBanquetIds([...selectedUserBanquetIds]);
      toast.success(
        selectedUserBanquetIds.length === 0
          ? 'User now has access to all banquets'
          : `Banquet access restricted to ${selectedUserBanquetIds.length} banquet(s)`
      );
    } catch (error: any) {
      toast.error(error?.response?.data?.error || 'Failed to update banquet access');
    } finally {
      setSavingUserBanquets(false);
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
    if (id === currentUser?.id) {
      toast.error('You cannot delete your own account');
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
    if (userForm.password !== userForm.confirmPassword) {
      toast.error('Passwords do not match');
      return;
    }

    try {
      setSavingUser(true);
      const created = await api.createUser({
        name: userForm.name.trim(),
        email: userForm.email.trim(),
        password: userForm.password,
        roleId: userForm.roleId || undefined,
      });
      const newUserId = created?.data?.data?.user?.id;
      if (newUserId && userForm.banquetAccess.length > 0) {
        await api.setUserBanquets(newUserId, userForm.banquetAccess);
      }
      toast.success('User created');
      setShowUserPrompt(false);
      setUserForm(initialUserForm);
      setShowPassword(false);
      setShowConfirmPassword(false);
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
    const role = roles.find((item) => item.id === id);
    const assignedUsers = role?._count?.userRoles || 0;
    const message =
      assignedUsers > 0
        ? `This role is assigned to ${assignedUsers} user${assignedUsers === 1 ? '' : 's'}. Deleting it will remove their access. Continue?`
        : 'Delete this role?';
    if (!confirm(message)) return;
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
        <h1 className="text-2xl font-bold text-[var(--text-1)]">Settings & Access</h1>
        <p className="text-[var(--text-2)] mt-1">
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
            <p className="text-sm font-semibold text-[var(--text-1)]">Permissions</p>
            {!canManageRolePermissions || !canViewPermissions ? (
              <p className="text-sm text-[var(--text-4)]">
                Role permissions can be assigned later by users with permission access.
              </p>
            ) : permissionGroups.length === 0 ? (
              <div className="empty-state" style={{ padding: '20px 12px' }}>
                <div className="empty-state-icon">
                  <Shield size={22} />
                </div>
                <p className="empty-state-title">No permissions available</p>
                <p className="empty-state-desc">Create permissions to assign to this role.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {permissionGroups.map((group) => {
                  const groupPermissionIds = group.permissions.map((permission) => permission.id);
                  const groupSelected = groupPermissionIds.every((id) =>
                    newRolePermissionIds.includes(id)
                  );
                  return (
                    <div key={group.key} className="rounded-xl border border-[var(--border)] p-3">
                      <div className="flex items-center justify-between mb-3">
                        <p className="text-sm font-semibold text-[var(--text-1)]">{group.label}</p>
                        <label className="inline-flex items-center gap-2 text-xs text-[var(--text-2)]">
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
                          const label = formatPermissionLabel(permission.name);
                          return (
                            <label
                              key={permissionId}
                              className="flex items-center gap-2 text-sm text-[var(--text-2)]"
                              title={permission.name}
                            >
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
                type={showPassword ? 'text' : 'password'}
                className="input"
                value={userForm.password}
                onChange={(e) =>
                  setUserForm((prev) => ({ ...prev, password: e.target.value }))
                }
                required
              />
              <button
                type="button"
                className="mt-2 inline-flex items-center gap-2 text-xs text-[var(--text-2)]"
                onClick={() => setShowPassword((prev) => !prev)}
              >
                {showPassword ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                {showPassword ? 'Hide password' : 'Show password'}
              </button>
              <p className="mt-1 text-xs text-[var(--text-4)]">
                Use at least 8 characters for staff accounts.
              </p>
            </div>
            <div>
              <label className="label">Confirm password</label>
              <input
                type={showConfirmPassword ? 'text' : 'password'}
                className="input"
                value={userForm.confirmPassword}
                onChange={(e) =>
                  setUserForm((prev) => ({ ...prev, confirmPassword: e.target.value }))
                }
                required
              />
              <button
                type="button"
                className="mt-2 inline-flex items-center gap-2 text-xs text-[var(--text-2)]"
                onClick={() => setShowConfirmPassword((prev) => !prev)}
              >
                {showConfirmPassword ? (
                  <EyeOff className="w-3.5 h-3.5" />
                ) : (
                  <Eye className="w-3.5 h-3.5" />
                )}
                {showConfirmPassword ? 'Hide confirmation' : 'Show confirmation'}
              </button>
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

          {banquets.length > 0 && (
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <Building2 className="w-4 h-4 text-[var(--text-3)]" />
                <label className="label m-0">Banquet Access</label>
                <span className="text-xs text-[var(--text-4)]">
                  {userForm.banquetAccess.length === 0
                    ? '— all banquets (no restriction)'
                    : `— ${userForm.banquetAccess.length} selected`}
                </span>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 rounded-xl border border-[var(--border-2)] p-3 bg-slate-50">
                {banquets.map((b) => (
                  <label key={b.id} className="flex items-center gap-2 text-sm text-[var(--text-2)] cursor-pointer">
                    <input
                      type="checkbox"
                      checked={userForm.banquetAccess.includes(b.id)}
                      onChange={() =>
                        setUserForm((prev) => ({
                          ...prev,
                          banquetAccess: prev.banquetAccess.includes(b.id)
                            ? prev.banquetAccess.filter((id) => id !== b.id)
                            : [...prev.banquetAccess, b.id],
                        }))
                      }
                    />
                    {b.name}
                    {b.location ? <span className="text-[var(--text-4)] text-xs">({b.location})</span> : null}
                  </label>
                ))}
              </div>
              <p className="text-xs text-[var(--text-4)]">
                Leave all unchecked = access to all banquets
              </p>
            </div>
          )}

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
              onClick={() => navigateToSettingsSection('access')}
              className={`px-4 py-2.5 rounded-xl text-sm font-semibold transition ${
                activeSettingsSection === 'access'
                  ? 'bg-primary-600 text-white shadow'
                  : 'bg-white text-[var(--text-2)] border border-[var(--border)] hover:border-primary-200'
              }`}
            >
              Access Mapping
            </button>
          )}
          {canAccessUsersSection && (
            <button
              type="button"
              onClick={() => navigateToSettingsSection('users')}
              className={`px-4 py-2.5 rounded-xl text-sm font-semibold transition ${
                activeSettingsSection === 'users'
                  ? 'bg-primary-600 text-white shadow'
                  : 'bg-white text-[var(--text-2)] border border-[var(--border)] hover:border-primary-200'
              }`}
            >
              Users
            </button>
          )}
          {canAccessRolesSection && (
            <button
              type="button"
              onClick={() => navigateToSettingsSection('roles')}
              className={`px-4 py-2.5 rounded-xl text-sm font-semibold transition ${
                activeSettingsSection === 'roles'
                  ? 'bg-primary-600 text-white shadow'
                  : 'bg-white text-[var(--text-2)] border border-[var(--border)] hover:border-primary-200'
              }`}
            >
              Roles
            </button>
          )}
          {canAccessPermissionsSection && (
            <button
              type="button"
              onClick={() => navigateToSettingsSection('permissions')}
              className={`px-4 py-2.5 rounded-xl text-sm font-semibold transition ${
                activeSettingsSection === 'permissions'
                  ? 'bg-primary-600 text-white shadow'
                  : 'bg-white text-[var(--text-2)] border border-[var(--border)] hover:border-primary-200'
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
          <p className="text-sm text-[var(--text-2)]">
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
            <h2 className="text-lg font-semibold text-[var(--text-1)]">Assign roles to user</h2>
          </div>
          {!canViewUsers || !canViewRoles ? (
            <p className="text-sm text-[var(--text-4)]">
              Assigning roles requires both <code>view_user</code> and <code>view_role</code> permissions.
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
                  <label key={role.id} className="flex items-center gap-2 text-sm text-[var(--text-2)]">
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
                  className={`btn w-full sm:w-auto ${userRolesDirty ? 'btn-primary' : 'btn-secondary'}`}
                  onClick={updateUserRoles}
                  disabled={savingUserRoles || !canAssignRoles || !userRolesDirty}
                >
                  <span className="inline-flex items-center gap-2">
                    {userRolesDirty ? (
                      <span className="inline-block h-2 w-2 rounded-full bg-current" aria-hidden="true" />
                    ) : null}
                    {savingUserRoles ? 'Saving...' : userRolesDirty ? 'Save User Roles' : 'Saved'}
                  </span>
                </button>
              </div>
              {!canAssignRoles && (
                <p className="text-sm text-[var(--text-4)]">
                  You can view user-role mapping but cannot modify it.
                </p>
              )}
            </>
          )}
        </div>

        {banquets.length > 0 && canViewUsers && (
          <div className="card space-y-4">
            <div className="flex items-center gap-2">
              <Building2 className="w-4 h-4 text-primary-600" />
              <h2 className="text-lg font-semibold text-[var(--text-1)]">Banquet access per user</h2>
            </div>
            <p className="text-sm text-[var(--text-3)]">
              Restrict which banquets a user can view and create bookings for. Leave all unchecked = unrestricted.
            </p>
            {!canViewUsers ? (
              <p className="text-sm text-[var(--text-4)]">Requires <code>view_user</code> permission.</p>
            ) : (
              <>
                <div>
                  <label className="label">User</label>
                  <select
                    className="input"
                    value={selectedUserId}
                    onChange={(e) => setSelectedUserId(e.target.value)}
                    disabled={users.length === 0}
                  >
                    {users.map((user) => (
                      <option key={user.id} value={user.id}>
                        {user.name || 'Unnamed'} ({user.email})
                      </option>
                    ))}
                  </select>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {banquets.map((b) => (
                    <label key={b.id} className="flex items-center gap-2 text-sm text-[var(--text-2)] cursor-pointer">
                      <input
                        type="checkbox"
                        checked={selectedUserBanquetIds.includes(b.id)}
                        onChange={() =>
                          setSelectedUserBanquetIds((prev) =>
                            prev.includes(b.id)
                              ? prev.filter((id) => id !== b.id)
                              : [...prev, b.id]
                          )
                        }
                        disabled={!canAssignRoles}
                      />
                      {b.name}
                      {b.location ? <span className="text-xs text-[var(--text-4)]">({b.location})</span> : null}
                    </label>
                  ))}
                </div>
                <p className="text-xs text-[var(--text-4)]">
                  {selectedUserBanquetIds.length === 0
                    ? 'No restriction — user can access all banquets'
                    : `User restricted to: ${banquets.filter((b) => selectedUserBanquetIds.includes(b.id)).map((b) => b.name).join(', ')}`}
                </p>
                <div className="flex justify-end">
                  <button
                    className={`btn w-full sm:w-auto ${userBanquetsDirty ? 'btn-primary' : 'btn-secondary'}`}
                    onClick={saveUserBanquets}
                    disabled={savingUserBanquets || !canAssignRoles || !userBanquetsDirty}
                  >
                    <span className="inline-flex items-center gap-2">
                      {userBanquetsDirty ? <span className="inline-block h-2 w-2 rounded-full bg-current" /> : null}
                      {savingUserBanquets ? 'Saving...' : userBanquetsDirty ? 'Save Banquet Access' : 'Saved'}
                    </span>
                  </button>
                </div>
              </>
            )}
          </div>
        )}

        <div className="card space-y-4">
          <div className="flex items-center gap-2">
            <Settings2 className="w-4 h-4 text-primary-600" />
            <h2 className="text-lg font-semibold text-[var(--text-1)]">Assign permissions to role</h2>
          </div>
          {!canViewRoles || !canViewPermissions ? (
            <p className="text-sm text-[var(--text-4)]">
              Managing role permissions requires both <code>view_role</code> and <code>view_permission</code> permissions.
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
                <div className="empty-state" style={{ padding: '20px 12px' }}>
                  <div className="empty-state-icon">
                    <Shield size={22} />
                  </div>
                  <p className="empty-state-title">No permissions available</p>
                  <p className="empty-state-desc">Create permissions before mapping them to roles.</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {permissionGroups.map((group) => {
                    const groupPermissionIds = group.permissions.map((permission) => permission.id);
                    const groupSelected = groupPermissionIds.every((id) =>
                      selectedPermissionIds.includes(id)
                    );
                    return (
                      <div key={group.key} className="rounded-xl border border-[var(--border)] p-3">
                        <div className="flex items-center justify-between mb-3">
                          <p className="text-sm font-semibold text-[var(--text-1)]">{group.label}</p>
                          <label className="inline-flex items-center gap-2 text-xs text-[var(--text-2)]">
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
                            const label = formatPermissionLabel(permission.name);
                            return (
                              <label
                                key={permissionId}
                                className="flex items-center gap-2 text-sm text-[var(--text-2)]"
                                title={permission.name}
                              >
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
                  className={`btn w-full sm:w-auto ${rolePermissionsDirty ? 'btn-primary' : 'btn-secondary'}`}
                  onClick={updateRolePermissions}
                  disabled={savingRolePermissions || !canManageRolePermissions || !rolePermissionsDirty}
                >
                  <span className="inline-flex items-center gap-2">
                    {rolePermissionsDirty ? (
                      <span className="inline-block h-2 w-2 rounded-full bg-current" aria-hidden="true" />
                    ) : null}
                    {savingRolePermissions
                      ? 'Saving...'
                      : rolePermissionsDirty
                        ? 'Save Role Permissions'
                        : 'Saved'}
                  </span>
                </button>
              </div>
              {!canManageRolePermissions && (
                <p className="text-sm text-[var(--text-4)]">
                  You can view role permissions but cannot modify them.
                </p>
              )}
            </>
          )}
        </div>
      </div>

      <div className="space-y-6">
        {activeSettingsSection === 'users' && canAccessUsersSection && (
        <div className="card">
          <div className="page-head mb-4">
            <h2 className="text-lg font-semibold text-[var(--text-1)]">Users</h2>
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
          {canViewUsers && (
            <div className="relative mb-4">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--text-4)]" />
              <input
                className="input pl-9"
                value={userSearch}
                onChange={(e) => setUserSearch(e.target.value)}
                placeholder="Search users by name or email"
              />
            </div>
          )}
          {loading ? (
            <TableSkeleton rows={5} />
          ) : !canViewUsers ? (
            <p className="text-sm text-[var(--text-4)]">
              You can create or delete users, but you do not have permission to view user records.
            </p>
          ) : filteredUsers.length === 0 ? (
            <EmptyState
              icon={Users}
              title={userSearch.trim() ? 'No users match this search' : 'No users yet'}
              description={
                userSearch.trim()
                  ? 'Try a different name or email.'
                  : 'Create the first staff account to start assigning access.'
              }
              action={
                userSearch.trim()
                  ? {
                      label: 'Clear search',
                      onClick: () => setUserSearch(''),
                    }
                  : undefined
              }
            />
          ) : (
            <div className="space-y-3">
              {filteredUsers.map((user) => (
                <div key={user.id} className="border border-[var(--border)] rounded-lg p-3">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <div className="flex items-center gap-2">
                        <p className="text-sm font-medium text-[var(--text-1)]">{user.name || 'Unnamed user'}</p>
                        {user.id === currentUser?.id ? (
                          <span className="rounded-full bg-primary-50 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-primary-700">
                            You
                          </span>
                        ) : null}
                      </div>
                      <p className="text-xs text-[var(--text-4)] mt-1">{user.email}</p>
                      <p className="text-xs text-[var(--text-4)] mt-1">
                        {(user.userRoles || []).map((ur) => ur.role.name).join(', ') || 'No roles'}
                      </p>
                      {formatJoinedDate(user.createdAt) ? (
                        <p className="text-xs text-[var(--text-4)] mt-1">{formatJoinedDate(user.createdAt)}</p>
                      ) : null}
                    </div>
                    {canDeleteUsers && (
                      <button
                        className="p-2 text-[var(--text-4)] hover:text-red-700 hover:bg-red-50 rounded-lg disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:bg-transparent disabled:hover:text-[var(--text-4)]"
                        onClick={() => removeUser(user.id)}
                        disabled={user.id === currentUser?.id}
                        title={user.id === currentUser?.id ? 'You cannot delete your own account' : 'Delete user'}
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
        )}

        {activeSettingsSection === 'roles' && canAccessRolesSection && (
        <div className="card">
          <div className="page-head mb-4">
            <h2 className="text-lg font-semibold text-[var(--text-1)]">Roles</h2>
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
            <TableSkeleton rows={5} />
          ) : !canViewRoles ? (
            <p className="text-sm text-[var(--text-4)]">
              You can create or delete roles, but you do not have permission to view role records.
            </p>
          ) : roles.length === 0 ? (
            <EmptyState
              icon={Shield}
              title="No roles yet"
              description="Create the first role before mapping access for staff."
            />
          ) : (
            <div className="space-y-3">
              {roles.map((role) => (
                <div key={role.id} className="border border-[var(--border)] rounded-lg p-3">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <p className="text-sm font-medium text-[var(--text-1)]">{role.name}</p>
                      {role.description ? (
                        <p className="text-xs text-[var(--text-3)] mt-1">{role.description}</p>
                      ) : null}
                      <p className="text-xs text-[var(--text-4)] mt-1">
                        {role.permissions?.length || 0} permissions • {role._count?.userRoles || 0} users
                      </p>
                    </div>
                    {canDeleteRoles && (
                      <button
                        className="p-2 text-[var(--text-4)] hover:text-red-700 hover:bg-red-50 rounded-lg"
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
        )}

        {activeSettingsSection === 'permissions' && canAccessPermissionsSection && (
        <div className="card">
          <div className="page-head mb-4">
            <h2 className="text-lg font-semibold text-[var(--text-1)]">Permissions</h2>
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
            <TableSkeleton rows={5} />
          ) : !canViewPermissions ? (
            <p className="text-sm text-[var(--text-4)]">
              You can manage permission definitions, but you do not have permission to view permission records.
            </p>
          ) : permissions.length === 0 ? (
            <EmptyState
              icon={KeyRound}
              title="No permissions yet"
              description="Add permission definitions before attaching them to roles."
            />
          ) : (
            <div className="space-y-3">
              {permissions.map((permission) => (
                <div key={permission.id} className="border border-[var(--border)] rounded-lg p-3">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <p className="text-sm font-medium text-[var(--text-1)]">{permission.name}</p>
                      {permission.description ? (
                        <p className="text-xs text-[var(--text-3)] mt-1">{permission.description}</p>
                      ) : null}
                      <p className="text-xs text-[var(--text-4)] mt-1">
                        {(permission._count?.roles || 0).toLocaleString('en-IN')} linked roles
                      </p>
                    </div>
                    {canDeletePermissions && (
                      <button
                        className="p-2 text-[var(--text-4)] hover:text-red-700 hover:bg-red-50 rounded-lg"
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
        )}
      </div>
    </div>
  );
}

function SettingsPageFallback() {
  return (
    <div className="card py-12 text-center">
      <p className="text-sm text-[var(--text-2)]">Loading settings workspace...</p>
    </div>
  );
}

export default function SettingsPage() {
  return (
    <Suspense fallback={<SettingsPageFallback />}>
      <SettingsPageContent />
    </Suspense>
  );
}
