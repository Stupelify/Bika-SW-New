'use client';

import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/store/authStore';
import { hasAnyPermission } from '@/lib/permissions';

type ActiveTab = 'itemType' | 'item' | 'template' | 'ingredients' | 'vendors';

interface MenuSectionTabsProps {
  active: ActiveTab;
}

export default function MenuSectionTabs({ active }: MenuSectionTabsProps) {
  const router = useRouter();
  const { user } = useAuthStore();
  const permissionSet = user?.permissions || [];

  const canViewItemType = hasAnyPermission(permissionSet, ['view_itemtype', 'manage_menu']);
  const canViewItem = hasAnyPermission(permissionSet, ['view_item', 'manage_menu']);
  const canViewTemplate = hasAnyPermission(permissionSet, ['view_templatemenu', 'manage_menu']);

  const tabs: { key: ActiveTab; label: string; href: string; enabled: boolean }[] = [
    { key: 'itemType', label: 'Item Types', href: '/dashboard/menu?section=itemType', enabled: canViewItemType },
    { key: 'item', label: 'Items', href: '/dashboard/menu?section=item', enabled: canViewItem },
    { key: 'template', label: 'Template Menus', href: '/dashboard/menu?section=template', enabled: canViewTemplate },
    { key: 'ingredients', label: 'Ingredients', href: '/dashboard/menu/ingredients', enabled: canViewItem },
    { key: 'vendors', label: 'Vendors', href: '/dashboard/menu/vendors', enabled: canViewItem },
  ];

  return (
    <div className="card p-2">
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-2">
        {tabs.map((tab) => (
          <button
            key={tab.key}
            type="button"
            disabled={!tab.enabled}
            onClick={() => router.push(tab.href)}
            className={`px-4 py-2.5 rounded-xl text-sm font-semibold transition ${
              active === tab.key && tab.enabled
                ? 'bg-primary-600 text-white shadow'
                : 'bg-[var(--surface)] text-[var(--text-2)] border border-[var(--border)] hover:border-primary-200 disabled:opacity-50 disabled:cursor-not-allowed'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>
    </div>
  );
}
