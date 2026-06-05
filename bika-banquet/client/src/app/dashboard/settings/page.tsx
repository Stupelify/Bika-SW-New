'use client';

import { FormEvent, Suspense, useEffect, useMemo, useState } from 'react';
import { api } from '@/lib/api';
import { toast } from 'sonner';
import {
  Building2,
  Eye,
  EyeOff,
  Globe,
  KeyRound,
  Pencil,
  Save,
  Search,
  Settings2,
  Shield,
  ShieldPlus,
  Trash2,
  Users,
} from 'lucide-react';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import EmptyState from '@/components/EmptyState';
import FormPromptModal from '@/components/FormPromptModal';
import { TableSkeleton } from '@/components/Skeletons';
import { formatDateTimeLabel } from '@/lib/date';

interface UserRow {
  id: string;
  name?: string | null;
  email: string;
  createdAt?: string;
  isActive?: boolean;
  hasAllVenueAccess?: boolean;
  lastLoginAt?: string | null;
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

const initialResetPasswordForm = {
  newPassword: '',
  confirmPassword: '',
};

const initialEditUserForm = {
  name: '',
  email: '',
};

const PASSWORD_RULE_HINT = 'At least 8 characters, including both letters and numbers';

/** Mirrors the backend rule: min 8 chars and contains both letters and numbers. */
function validatePassword(password: string): string | null {
  if (password.length < 8) {
    return 'Password must be at least 8 characters';
  }
  if (!/[a-zA-Z]/.test(password) || !/[0-9]/.test(password)) {
    return 'Password must include both letters and numbers';
  }
  return null;
}

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

  // ── Per-user management state ────────────────────────────────────────────────
  // Password reset modal
  const [resetPasswordUser, setResetPasswordUser] = useState<UserRow | null>(null);
  const [resetPasswordForm, setResetPasswordForm] = useState(initialResetPasswordForm);
  const [showResetPassword, setShowResetPassword] = useState(false);
  const [showResetConfirmPassword, setShowResetConfirmPassword] = useState(false);
  const [savingUserPasswordReset, setSavingUserPasswordReset] = useState(false);

  // Active toggle
  const [savingUserStatus, setSavingUserStatus] = useState(false);

  // All-venues access
  const [userAllVenues, setUserAllVenues] = useState(false);
  const [savingUserAllVenues, setSavingUserAllVenues] = useState(false);

  // Edit name/email modal
  const [editUserForm, setEditUserForm] = useState(initialEditUserForm);
  const [showEditUserPrompt, setShowEditUserPrompt] = useState(false);
  const [savingEditUser, setSavingEditUser] = useState(false);

  // Direct (per-user) permissions
  const [directPermissionIds, setDirectPermissionIds] = useState<string[]>([]);
  const [savedDirectPermissionIds, setSavedDirectPermissionIds] = useState<string[]>([]);
  const [savingDirectPermissions, setSavingDirectPermissions] = useState(false);
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
  const canManageUsers = currentPermissionSet.has('manage_users');
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

  // Reflect the selected user's all-venues access from the list payload.
  useEffect(() => {
    setUserAllVenues(Boolean(selectedUser?.hasAllVenueAccess));
  }, [selectedUser]);

  // Load the selected user's direct (per-user) permission grants.
  useEffect(() => {
    if (!selectedUserId || !canManageUsers) {
      setDirectPermissionIds([]);
      setSavedDirectPermissionIds([]);
      return;
    }
    api.getUserDirectPermissions(selectedUserId)
      .then((res) => {
        const ids: string[] = res.data?.data?.permissionIds || [];
        setDirectPermissionIds(ids);
        setSavedDirectPermissionIds(ids);
      })
      .catch(() => {
        setDirectPermissionIds([]);
        setSavedDirectPermissionIds([]);
      });
  }, [selectedUserId, canManageUsers]);

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
  const directPermissionsDirty = useMemo(
    () => !arraysMatchAsSet(directPermissionIds, savedDirectPermissionIds),
    [directPermissionIds, savedDirectPermissionIds]
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

  // Open the password-reset modal for a specific user.
  const openResetPasswordModal = (user: UserRow) => {
    if (!canManageUsers) {
      toast.error('You do not have permission to reset passwords');
      return;
    }
    setResetPasswordUser(user);
    setResetPasswordForm(initialResetPasswordForm);
    setShowResetPassword(false);
    setShowResetConfirmPassword(false);
  };

  const submitResetPassword = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!resetPasswordUser) return;
    if (!canManageUsers) {
      toast.error('You do not have permission to reset passwords');
      return;
    }

    const newPassword = resetPasswordForm.newPassword;
    const validationError = validatePassword(newPassword);
    if (validationError) {
      toast.error(validationError);
      return;
    }
    if (newPassword !== resetPasswordForm.confirmPassword) {
      toast.error('Passwords do not match');
      return;
    }

    try {
      setSavingUserPasswordReset(true);
      await api.resetUserPassword(resetPasswordUser.id, { newPassword });
      toast.success(`Password reset for ${resetPasswordUser.email}. They have been signed out of all devices.`);
      setResetPasswordUser(null);
      setResetPasswordForm(initialResetPasswordForm);
      setShowResetPassword(false);
      setShowResetConfirmPassword(false);
    } catch (error: any) {
      toast.error(error?.response?.data?.error || 'Failed to reset password');
    } finally {
      setSavingUserPasswordReset(false);
    }
  };

  // Enable/disable the selected user. Disabling signs them out everywhere.
  const toggleUserStatus = async (user: UserRow) => {
    if (!canManageUsers) {
      toast.error('You do not have permission to change user status');
      return;
    }
    if (user.id === currentUser?.id) {
      toast.error('You cannot disable your own account');
      return;
    }
    const nextActive = !user.isActive;
    if (
      !nextActive &&
      !confirm(`Disable ${user.email}? They will be signed out of all devices and cannot log in until re-enabled.`)
    ) {
      return;
    }
    try {
      setSavingUserStatus(true);
      await api.setUserStatus(user.id, { isActive: nextActive });
      toast.success(nextActive ? 'User enabled' : 'User disabled');
      await loadData();
    } catch (error: any) {
      toast.error(error?.response?.data?.error || 'Failed to update user status');
    } finally {
      setSavingUserStatus(false);
    }
  };

  // Grant/revoke all-venues access for the selected user.
  const saveUserAllVenues = async (nextValue: boolean) => {
    if (!selectedUserId) {
      toast.error('Select a user first');
      return;
    }
    if (!canManageUsers) {
      toast.error('You do not have permission to manage venue access');
      return;
    }
    const previous = userAllVenues;
    setUserAllVenues(nextValue);
    try {
      setSavingUserAllVenues(true);
      const res = await api.setUserAllVenues(selectedUserId, nextValue);
      const applied = Boolean(res.data?.data?.hasAllVenueAccess ?? nextValue);
      setUserAllVenues(applied);
      setUsers((prev) =>
        prev.map((u) =>
          u.id === selectedUserId ? { ...u, hasAllVenueAccess: applied } : u
        )
      );
      toast.success(
        applied
          ? 'User granted access to all venues'
          : 'All-venues access revoked'
      );
    } catch (error: any) {
      setUserAllVenues(previous);
      toast.error(error?.response?.data?.error || 'Failed to update venue access');
    } finally {
      setSavingUserAllVenues(false);
    }
  };

  // Open the edit-profile modal for a specific user.
  const openEditUserModal = (user: UserRow) => {
    if (!canManageUsers) {
      toast.error('You do not have permission to edit users');
      return;
    }
    setSelectedUserId(user.id);
    setEditUserForm({ name: user.name || '', email: user.email });
    setShowEditUserPrompt(true);
  };

  const submitEditUser = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!selectedUserId) return;
    if (!canManageUsers) {
      toast.error('You do not have permission to edit users');
      return;
    }
    if (!editUserForm.name.trim() || !editUserForm.email.trim()) {
      toast.error('Name and email are required');
      return;
    }
    try {
      setSavingEditUser(true);
      await api.updateUser(selectedUserId, {
        name: editUserForm.name.trim(),
        email: editUserForm.email.trim(),
      });
      toast.success('User profile updated');
      setShowEditUserPrompt(false);
      await loadData();
    } catch (error: any) {
      toast.error(error?.response?.data?.error || 'Failed to update user');
    } finally {
      setSavingEditUser(false);
    }
  };

  // Persist the selected user's direct (per-user) permission grants.
  const saveDirectPermissions = async () => {
    if (!selectedUserId) {
      toast.error('Select a user first');
      return;
    }
    if (!canManageUsers) {
      toast.error('You do not have permission to manage user permissions');
      return;
    }
    try {
      setSavingDirectPermissions(true);
      const res = await api.setUserDirectPermissions(selectedUserId, directPermissionIds);
      const ids: string[] = res.data?.data?.permissionIds || directPermissionIds;
      setDirectPermissionIds(ids);
      setSavedDirectPermissionIds(ids);
      toast.success(
        ids.length === 0
          ? 'Extra permissions cleared'
          : `Saved ${ids.length} extra permission(s)`
      );
    } catch (error: any) {
      toast.error(error?.response?.data?.error || 'Failed to update permissions');
    } finally {
      setSavingDirectPermissions(false);
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
        <h1 className="page-title">Settings & Access</h1>
      </div>

      {resetPasswordUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4" role="dialog" aria-modal="true">
          <div className="card w-full max-w-md space-y-4">
            <div className="flex items-center gap-2">
              <KeyRound className="w-4 h-4 text-primary-600" />
              <h2 className="text-lg font-semibold text-[var(--text-1)]">Reset password</h2>
            </div>
            <p className="text-sm text-[var(--text-3)]">
              Set a new password for <span className="font-medium">{resetPasswordUser.email}</span>. They will be signed out of all devices and must sign in with the new password.
            </p>
            <form className="space-y-3" onSubmit={submitResetPassword}>
              <div>
                <label className="label">New password</label>
                <div className="relative">
                  <input
                    type={showResetPassword ? 'text' : 'password'}
                    className="input pr-9"
                    value={resetPasswordForm.newPassword}
                    onChange={(e) => setResetPasswordForm((prev) => ({ ...prev, newPassword: e.target.value }))}
                    autoFocus
                    required
                  />
                  <button type="button" className="absolute right-2 top-1/2 -translate-y-1/2 text-[var(--text-4)]" onClick={() => setShowResetPassword((v) => !v)}>
                    {showResetPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
                <p className="text-xs text-[var(--text-4)] mt-1">At least 8 characters, including letters and numbers.</p>
              </div>
              <div>
                <label className="label">Confirm new password</label>
                <div className="relative">
                  <input
                    type={showResetConfirmPassword ? 'text' : 'password'}
                    className="input pr-9"
                    value={resetPasswordForm.confirmPassword}
                    onChange={(e) => setResetPasswordForm((prev) => ({ ...prev, confirmPassword: e.target.value }))}
                    required
                  />
                  <button type="button" className="absolute right-2 top-1/2 -translate-y-1/2 text-[var(--text-4)]" onClick={() => setShowResetConfirmPassword((v) => !v)}>
                    {showResetConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>
              <div className="flex justify-end gap-2 pt-2">
                <button type="button" className="btn btn-secondary" onClick={() => setResetPasswordUser(null)} disabled={savingUserPasswordReset}>
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary" disabled={savingUserPasswordReset}>
                  {savingUserPasswordReset ? 'Resetting...' : 'Reset password'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {showEditUserPrompt && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4" role="dialog" aria-modal="true">
          <div className="card w-full max-w-md space-y-4">
            <h2 className="text-lg font-semibold text-[var(--text-1)]">Edit user</h2>
            <form className="space-y-3" onSubmit={submitEditUser}>
              <div>
                <label className="label">Name</label>
                <input
                  className="input"
                  value={editUserForm.name}
                  onChange={(e) => setEditUserForm((prev) => ({ ...prev, name: e.target.value }))}
                  required
                />
              </div>
              <div>
                <label className="label">Email</label>
                <input
                  type="email"
                  className="input"
                  value={editUserForm.email}
                  onChange={(e) => setEditUserForm((prev) => ({ ...prev, email: e.target.value }))}
                  required
                />
              </div>
              <div className="flex justify-end gap-2 pt-2">
                <button type="button" className="btn btn-secondary" onClick={() => setShowEditUserPrompt(false)} disabled={savingEditUser}>
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary" disabled={savingEditUser}>
                  {savingEditUser ? 'Saving...' : 'Save'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

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
                autoComplete="off"
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
                autoComplete="off"
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
                autoComplete="new-password"
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
                autoComplete="new-password"
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
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 rounded-xl border border-[var(--border-2)] p-3 bg-slate-50 dark:bg-slate-500/10">
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
                  : 'bg-[var(--surface)] text-[var(--text-2)] border border-[var(--border)] hover:border-primary-200'
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
                  : 'bg-[var(--surface)] text-[var(--text-2)] border border-[var(--border)] hover:border-primary-200'
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
                  : 'bg-[var(--surface)] text-[var(--text-2)] border border-[var(--border)] hover:border-primary-200'
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
                  : 'bg-[var(--surface)] text-[var(--text-2)] border border-[var(--border)] hover:border-primary-200'
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
              Restrict which banquets a user can view and create bookings for. With no banquets selected and &quot;All venues&quot; off, the user can access nothing until granted (fail-closed).
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
                <label className="flex items-center justify-between gap-3 rounded-lg border border-[var(--border)] p-3">
                  <span className="text-sm text-[var(--text-2)]">
                    <span className="font-medium">All venues</span>
                    <span className="block text-xs text-[var(--text-4)]">Owner / org-wide access to every banquet (overrides the selection below).</span>
                  </span>
                  <input
                    type="checkbox"
                    checked={userAllVenues}
                    onChange={(e) => saveUserAllVenues(e.target.checked)}
                    disabled={!canManageUsers || !selectedUserId}
                  />
                </label>
                <div className={`grid grid-cols-1 sm:grid-cols-2 gap-2 ${userAllVenues ? 'opacity-40 pointer-events-none' : ''}`}>
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
                  {userAllVenues
                    ? 'All venues — user can access every banquet'
                    : selectedUserBanquetIds.length === 0
                      ? 'No access — assign banquets or enable All venues'
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

        {canManageUsers && permissions.length > 0 && (
          <div className="card space-y-4">
            <div className="flex items-center gap-2">
              <KeyRound className="w-4 h-4 text-primary-600" />
              <h2 className="text-lg font-semibold text-[var(--text-1)]">Extra permissions (per user)</h2>
            </div>
            <p className="text-sm text-[var(--text-3)]">
              Grant individual permissions to a user on top of their role(s). These are added to whatever their roles already allow. Use sparingly — roles are the primary mechanism.
            </p>
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
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-72 overflow-auto">
              {permissions.map((permission) => (
                <label key={permission.id} className="flex items-center gap-2 text-sm text-[var(--text-2)] cursor-pointer">
                  <input
                    type="checkbox"
                    checked={directPermissionIds.includes(permission.id)}
                    onChange={() =>
                      setDirectPermissionIds((prev) =>
                        prev.includes(permission.id)
                          ? prev.filter((id) => id !== permission.id)
                          : [...prev, permission.id]
                      )
                    }
                    disabled={!selectedUserId}
                  />
                  <span>{permission.name}</span>
                </label>
              ))}
            </div>
            <div className="flex justify-end">
              <button
                className={`btn w-full sm:w-auto ${directPermissionsDirty ? 'btn-primary' : 'btn-secondary'}`}
                onClick={saveDirectPermissions}
                disabled={savingDirectPermissions || !directPermissionsDirty || !selectedUserId}
              >
                {savingDirectPermissions ? 'Saving...' : directPermissionsDirty ? 'Save Extra Permissions' : 'Saved'}
              </button>
            </div>
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
                        {user.isActive === false ? (
                          <span className="rounded-full bg-red-50 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-red-700 dark:bg-red-500/10 dark:text-red-200">
                            Disabled
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
                      <p className="text-xs text-[var(--text-4)] mt-1">
                        Last login: {user.lastLoginAt ? new Date(user.lastLoginAt).toLocaleString() : 'Never'}
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      {currentPermissionSet.has('manage_users') ? (
                        <button
                          className="px-2 py-1 text-xs rounded-lg border border-[var(--border)] text-[var(--text-3)] hover:bg-[var(--surface-2)]"
                          onClick={() => openEditUserModal(user)}
                          title="Edit name / email"
                        >
                          Edit
                        </button>
                      ) : null}
                      {currentPermissionSet.has('manage_users') && user.id !== currentUser?.id ? (
                        <button
                          className="p-2 text-[var(--text-4)] hover:text-amber-700 dark:text-amber-200 hover:bg-amber-50 dark:bg-amber-500/10 rounded-lg"
                          onClick={() => openResetPasswordModal(user)}
                          disabled={savingUserPasswordReset}
                          title="Reset password"
                        >
                          <KeyRound className="w-4 h-4" />
                        </button>
                      ) : null}
                      {currentPermissionSet.has('manage_users') && user.id !== currentUser?.id ? (
                        <button
                          className="px-2 py-1 text-xs rounded-lg border border-[var(--border)] text-[var(--text-3)] hover:bg-[var(--surface-2)]"
                          onClick={() => toggleUserStatus(user)}
                          title={user.isActive === false ? 'Enable user (allow login)' : 'Disable user (sign out of all devices)'}
                        >
                          {user.isActive === false ? 'Enable' : 'Disable'}
                        </button>
                      ) : null}
                      {canDeleteUsers && (
                        <button
                          className="p-2 text-[var(--text-4)] hover:text-red-700 dark:text-red-200 hover:bg-red-50 dark:bg-red-500/10 rounded-lg disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:bg-transparent disabled:hover:text-[var(--text-4)]"
                          onClick={() => removeUser(user.id)}
                          disabled={user.id === currentUser?.id}
                          title={user.id === currentUser?.id ? 'You cannot delete your own account' : 'Delete user'}
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      )}
                    </div>
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
                        className="p-2 text-[var(--text-4)] hover:text-red-700 dark:text-red-200 hover:bg-red-50 dark:bg-red-500/10 rounded-lg"
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
                        className="p-2 text-[var(--text-4)] hover:text-red-700 dark:text-red-200 hover:bg-red-50 dark:bg-red-500/10 rounded-lg"
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
