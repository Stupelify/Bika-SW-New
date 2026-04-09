'use client';

import { FormEvent, Fragment, Suspense, useEffect, useMemo, useState } from 'react';
import { api } from '@/lib/api';
import { toast } from 'sonner';
import { ChevronDown, Edit, Layers, ListChecks, Save, Search, Soup, Trash2 } from 'lucide-react';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import FormPromptModal from '@/components/FormPromptModal';
import SortableHeader from '@/components/SortableHeader';
import TablePagination from '@/components/TablePagination';
import { TableSkeleton } from '@/components/Skeletons';
import {
  SortState,
  TableColumnConfig,
  filterAndSortRows,
  getNextSort,
} from '@/lib/tableUtils';
import { useAuthStore } from '@/store/authStore';
import { hasAnyPermission } from '@/lib/permissions';

interface ItemType {
  id: string;
  name: string;
  order?: number | null;
  displayOrder?: number | null;
  description?: string | null;
  _count?: {
    items: number;
  };
}

interface Item {
  id: string;
  name: string;
  itemTypeId: string;
  setupCost?: string | null;
  itemCost?: string | null;
  point?: number | null;
  photo?: string | null;
  description?: string | null;
  cost?: number | null;
  points?: number | null;
  isVeg: boolean;
  itemType?: {
    id: string;
    name: string;
  };
  _count?: {
    itemRecipes: number;
    vendorSupplies: number;
  };
}

interface IngredientOption {
  id: string;
  name: string;
  defaultUnit: string;
}

interface VendorOption {
  id: string;
  name: string;
}

interface ItemRecipeRow {
  id: string;
  ingredientId: string;
  quantity: number;
  unit: string;
  ingredient?: {
    id: string;
    name: string;
    defaultUnit?: string;
  };
}

interface ItemVendorSupplyRow {
  id: string;
  vendorId: string;
  price: number;
  unit: string;
  vendor?: {
    id: string;
    name: string;
  };
}

interface ItemVendorDraft {
  vendorId: string;
  price: string;
  unit: string;
}

interface TemplateMenu {
  id: string;
  name: string;
  category?: string | null;
  setupCost?: number | null;
  ratePerPlate?: number | null;
  itemCount?: number | null;
  items?: Array<{
    id: string;
    item: {
      id: string;
      name: string;
      itemType?: {
        name: string;
      };
    };
  }>;
}

const initialTypeForm = {
  name: '',
  order: '0',
};

const initialItemForm = {
  itemTypeId: '',
  name: '',
  setupCost: '',
  itemCost: '',
  points: '',
  description: '',
  photo: '',
  photoFileName: '',
};

const initialTemplateForm = {
  name: '',
  setupCost: '',
  ratePerPlate: '',
  itemIds: [] as string[],
};

const recipeUnits = ['kg', 'g', 'liter', 'ml', 'piece', 'packet', 'dozen', 'box'];

const initialTypeColumnSearch = {
  name: '',
  order: '',
  itemCount: '',
};

const initialItemColumnSearch = {
  name: '',
  type: '',
  cost: '',
};

const initialTemplateColumnSearch = {
  name: '',
  category: '',
  ratePerPlate: '',
  itemCount: '',
};

const ITEM_TYPES_PAGE_SIZE = 75;
const ITEMS_PAGE_SIZE = 75;
const TEMPLATE_MENUS_PAGE_SIZE = 75;
type MenuSection = 'itemType' | 'item' | 'template';

function isMenuSection(value: string | null): value is MenuSection {
  return value === 'itemType' || value === 'item' || value === 'template';
}

function MenuPageContent() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const { user } = useAuthStore();
  const permissionSet = useMemo(() => user?.permissions || [], [user?.permissions]);
  const canViewItemType = hasAnyPermission(permissionSet, ['view_itemtype', 'manage_menu']);
  const canAddItemType = hasAnyPermission(permissionSet, ['add_itemtype', 'manage_menu']);
  const canEditItemType = hasAnyPermission(permissionSet, ['edit_itemtype', 'manage_menu']);
  const canDeleteItemType = hasAnyPermission(permissionSet, ['delete_itemtype', 'manage_menu']);
  const canViewItem = hasAnyPermission(permissionSet, ['view_item', 'manage_menu']);
  const canAddItem = hasAnyPermission(permissionSet, ['add_item', 'manage_menu']);
  const canEditItem = hasAnyPermission(permissionSet, ['edit_item', 'manage_menu']);
  const canDeleteItem = hasAnyPermission(permissionSet, ['delete_item', 'manage_menu']);
  const canViewTemplate = hasAnyPermission(permissionSet, ['view_templatemenu', 'manage_menu']);
  const canAddTemplate = hasAnyPermission(permissionSet, ['add_templatemenu', 'manage_menu']);
  const canEditTemplate = hasAnyPermission(permissionSet, ['edit_templatemenu', 'manage_menu']);
  const canDeleteTemplate = hasAnyPermission(permissionSet, ['delete_templatemenu', 'manage_menu']);

  const [itemTypes, setItemTypes] = useState<ItemType[]>([]);
  const [items, setItems] = useState<Item[]>([]);
  const [templateMenus, setTemplateMenus] = useState<TemplateMenu[]>([]);
  const [loading, setLoading] = useState(true);
  const [savingType, setSavingType] = useState(false);
  const [savingItem, setSavingItem] = useState(false);
  const [savingTemplate, setSavingTemplate] = useState(false);
  const [showTypePrompt, setShowTypePrompt] = useState(false);
  const [showItemPrompt, setShowItemPrompt] = useState(false);
  const [showTemplatePrompt, setShowTemplatePrompt] = useState(false);
  const [editingTypeId, setEditingTypeId] = useState<string | null>(null);
  const [editingItemId, setEditingItemId] = useState<string | null>(null);
  const [editingTemplateId, setEditingTemplateId] = useState<string | null>(null);

  const [typeForm, setTypeForm] = useState(initialTypeForm);
  const [itemForm, setItemForm] = useState(initialItemForm);
  const [templateForm, setTemplateForm] = useState(initialTemplateForm);
  const [itemVendorDrafts, setItemVendorDrafts] = useState<ItemVendorDraft[]>([]);
  const [originalItemVendorSupplies, setOriginalItemVendorSupplies] = useState<
    ItemVendorSupplyRow[]
  >([]);
  const [itemVendorSearch, setItemVendorSearch] = useState('');

  const [itemTypeGlobalSearch, setItemTypeGlobalSearch] = useState('');
  const [itemTypeColumnSearch, setItemTypeColumnSearch] = useState(
    initialTypeColumnSearch
  );
  const [itemsGlobalSearch, setItemsGlobalSearch] = useState('');
  const [itemsColumnSearch, setItemsColumnSearch] = useState(initialItemColumnSearch);
  const [templateGlobalSearch, setTemplateGlobalSearch] = useState('');
  const [templateColumnSearch, setTemplateColumnSearch] = useState(
    initialTemplateColumnSearch
  );
  const [templateItemSearch, setTemplateItemSearch] = useState('');
  const [ingredientOptions, setIngredientOptions] = useState<IngredientOption[]>([]);
  const [vendorOptions, setVendorOptions] = useState<VendorOption[]>([]);

  const [showRecipePrompt, setShowRecipePrompt] = useState(false);
  const [recipeItem, setRecipeItem] = useState<Item | null>(null);
  const [itemRecipes, setItemRecipes] = useState<ItemRecipeRow[]>([]);
  const [recipeForm, setRecipeForm] = useState({
    ingredientId: '',
    quantity: '',
    unit: 'g',
  });
  const [editingRecipeId, setEditingRecipeId] = useState<string | null>(null);
  const [savingRecipe, setSavingRecipe] = useState(false);

  const [showItemVendorsPrompt, setShowItemVendorsPrompt] = useState(false);
  const [vendorItem, setVendorItem] = useState<Item | null>(null);
  const [itemVendors, setItemVendors] = useState<ItemVendorSupplyRow[]>([]);
  const [itemVendorForm, setItemVendorForm] = useState({
    vendorId: '',
    price: '',
    unit: 'piece',
  });
  const [editingItemVendorId, setEditingItemVendorId] = useState<string | null>(null);
  const [savingItemVendor, setSavingItemVendor] = useState(false);

  const [itemTypeSort, setItemTypeSort] = useState<SortState>({
    key: 'order',
    direction: 'asc',
  });
  const [itemSort, setItemSort] = useState<SortState>({ key: 'name', direction: 'asc' });
  const [templateSort, setTemplateSort] = useState<SortState>({
    key: 'name',
    direction: 'asc',
  });
  const [itemTypePage, setItemTypePage] = useState(1);
  const [itemPage, setItemPage] = useState(1);
  const [templatePage, setTemplatePage] = useState(1);
  const [collapsedItemTypeGroups, setCollapsedItemTypeGroups] = useState<
    Record<string, boolean>
  >({});
  const [activeMenuSection, setActiveMenuSection] = useState<MenuSection>('itemType');
  const sectionParam = searchParams.get('section');
  const isIngredientsPage = pathname === '/dashboard/menu/ingredients';
  const isVendorsPage = pathname === '/dashboard/menu/vendors';

  const itemTypeColumns = useMemo<TableColumnConfig<ItemType>[]>(
    () => [
      { key: 'name', accessor: (itemType) => itemType.name },
      {
        key: 'order',
        accessor: (itemType) => itemType.order ?? itemType.displayOrder ?? 0,
      },
      { key: 'itemCount', accessor: (itemType) => itemType._count?.items || 0 },
    ],
    []
  );

  const itemColumns = useMemo<TableColumnConfig<Item>[]>(
    () => [
      {
        key: 'name',
        accessor: (item) => `${item.name} ${item.isVeg ? 'Veg' : 'Non-veg'}`,
      },
      { key: 'type', accessor: (item) => item.itemType?.name || '' },
      { key: 'cost', accessor: (item) => item.cost ?? 0 },
    ],
    []
  );

  const templateColumns = useMemo<TableColumnConfig<TemplateMenu>[]>(
    () => [
      { key: 'name', accessor: (menu) => menu.name },
      { key: 'category', accessor: (menu) => menu.category || 'General' },
      { key: 'ratePerPlate', accessor: (menu) => menu.ratePerPlate ?? 0 },
      {
        key: 'itemCount',
        accessor: (menu) => (menu.itemCount ?? menu.items?.length) || 0,
      },
    ],
    []
  );

  const filteredItemTypes = useMemo(
    () =>
      filterAndSortRows(
        itemTypes,
        itemTypeColumns,
        itemTypeGlobalSearch,
        itemTypeColumnSearch,
        itemTypeSort
      ),
    [
      itemTypes,
      itemTypeColumns,
      itemTypeGlobalSearch,
      itemTypeColumnSearch,
      itemTypeSort,
    ]
  );

  const filteredItems = useMemo(
    () =>
      filterAndSortRows(
        items,
        itemColumns,
        itemsGlobalSearch,
        itemsColumnSearch,
        itemSort
      ),
    [items, itemColumns, itemsGlobalSearch, itemsColumnSearch, itemSort]
  );

  const filteredTemplateMenus = useMemo(
    () =>
      filterAndSortRows(
        templateMenus,
        templateColumns,
        templateGlobalSearch,
        templateColumnSearch,
        templateSort
      ),
    [
      templateMenus,
      templateColumns,
      templateGlobalSearch,
      templateColumnSearch,
      templateSort,
    ]
  );

  const itemTypeTotalPages = useMemo(
    () => Math.max(1, Math.ceil(filteredItemTypes.length / ITEM_TYPES_PAGE_SIZE)),
    [filteredItemTypes.length]
  );

  const itemTotalPages = useMemo(
    () => Math.max(1, Math.ceil(filteredItems.length / ITEMS_PAGE_SIZE)),
    [filteredItems.length]
  );

  const templateTotalPages = useMemo(
    () =>
      Math.max(1, Math.ceil(filteredTemplateMenus.length / TEMPLATE_MENUS_PAGE_SIZE)),
    [filteredTemplateMenus.length]
  );

  const paginatedItemTypes = useMemo(() => {
    const safePage = Math.min(Math.max(itemTypePage, 1), itemTypeTotalPages);
    const startIndex = (safePage - 1) * ITEM_TYPES_PAGE_SIZE;
    return filteredItemTypes.slice(startIndex, startIndex + ITEM_TYPES_PAGE_SIZE);
  }, [filteredItemTypes, itemTypePage, itemTypeTotalPages]);

  const paginatedItems = useMemo(() => {
    const safePage = Math.min(Math.max(itemPage, 1), itemTotalPages);
    const startIndex = (safePage - 1) * ITEMS_PAGE_SIZE;
    return filteredItems.slice(startIndex, startIndex + ITEMS_PAGE_SIZE);
  }, [filteredItems, itemPage, itemTotalPages]);

  const groupedPaginatedItems = useMemo(() => {
    const itemTypeMeta = new Map<string, { name: string; order: number }>();
    itemTypes.forEach((itemType) => {
      itemTypeMeta.set(itemType.id, {
        name: itemType.name || 'Other',
        order: itemType.order ?? itemType.displayOrder ?? Number.MAX_SAFE_INTEGER,
      });
    });

    const groupedMap = new Map<
      string,
      { key: string; label: string; order: number; rows: Item[] }
    >();

    paginatedItems.forEach((item) => {
      const fallbackLabel = item.itemType?.name || 'Other';
      const meta = item.itemTypeId ? itemTypeMeta.get(item.itemTypeId) : undefined;
      const groupKey = item.itemTypeId || `other-${fallbackLabel}`;
      const groupLabel = meta?.name || fallbackLabel;
      const groupOrder = meta?.order ?? Number.MAX_SAFE_INTEGER;

      const existing = groupedMap.get(groupKey);
      if (existing) {
        existing.rows.push(item);
        return;
      }
      groupedMap.set(groupKey, {
        key: groupKey,
        label: groupLabel,
        order: groupOrder,
        rows: [item],
      });
    });

    return Array.from(groupedMap.values()).sort((a, b) => {
      if (a.order !== b.order) return a.order - b.order;
      return a.label.localeCompare(b.label, undefined, { sensitivity: 'base' });
    });
  }, [itemTypes, paginatedItems]);

  const paginatedTemplateMenus = useMemo(() => {
    const safePage = Math.min(Math.max(templatePage, 1), templateTotalPages);
    const startIndex = (safePage - 1) * TEMPLATE_MENUS_PAGE_SIZE;
    return filteredTemplateMenus.slice(
      startIndex,
      startIndex + TEMPLATE_MENUS_PAGE_SIZE
    );
  }, [filteredTemplateMenus, templatePage, templateTotalPages]);

  useEffect(() => {
    void loadData();
  }, [canViewItemType, canViewItem, canViewTemplate]);

  const firstAllowedMenuSection = useMemo<MenuSection | null>(() => {
    if (canViewItemType) return 'itemType';
    if (canViewItem) return 'item';
    if (canViewTemplate) return 'template';
    return null;
  }, [canViewItemType, canViewItem, canViewTemplate]);

  useEffect(() => {
    if (!firstAllowedMenuSection) return;

    const requestedSection = isMenuSection(sectionParam) ? sectionParam : null;
    const requestedSectionAllowed =
      requestedSection === 'itemType'
        ? canViewItemType
        : requestedSection === 'item'
          ? canViewItem
          : requestedSection === 'template'
            ? canViewTemplate
            : false;

    const nextSection =
      requestedSection && requestedSectionAllowed
        ? requestedSection
        : firstAllowedMenuSection;

    if (activeMenuSection !== nextSection) {
      setActiveMenuSection(nextSection);
    }

    if (sectionParam !== nextSection) {
      const params = new URLSearchParams(searchParams.toString());
      params.set('section', nextSection);
      router.replace(`${pathname}?${params.toString()}`, { scroll: false });
    }
  }, [
    activeMenuSection,
    canViewItem,
    canViewItemType,
    canViewTemplate,
    firstAllowedMenuSection,
    pathname,
    router,
    searchParams,
    sectionParam,
  ]);

  const navigateToMenuSection = (section: MenuSection) => {
    const allowed =
      section === 'itemType'
        ? canViewItemType
        : section === 'item'
          ? canViewItem
          : canViewTemplate;
    if (!allowed) return;
    const params = new URLSearchParams(searchParams.toString());
    params.set('section', section);
    router.replace(`${pathname}?${params.toString()}`, { scroll: false });
  };

  useEffect(() => {
    setItemTypePage(1);
  }, [itemTypeGlobalSearch, itemTypeColumnSearch, itemTypeSort]);

  useEffect(() => {
    setItemPage(1);
  }, [itemsGlobalSearch, itemsColumnSearch, itemSort]);

  useEffect(() => {
    setTemplatePage(1);
  }, [templateGlobalSearch, templateColumnSearch, templateSort]);

  useEffect(() => {
    if (itemTypePage <= itemTypeTotalPages) return;
    setItemTypePage(itemTypeTotalPages);
  }, [itemTypePage, itemTypeTotalPages]);

  useEffect(() => {
    if (itemPage <= itemTotalPages) return;
    setItemPage(itemTotalPages);
  }, [itemPage, itemTotalPages]);

  useEffect(() => {
    if (templatePage <= templateTotalPages) return;
    setTemplatePage(templateTotalPages);
  }, [templatePage, templateTotalPages]);

  const loadData = async () => {
    try {
      setLoading(true);
      const [typesRes, itemsRes, templatesRes, ingredientsRes, vendorsRes] =
        await Promise.all([
        canViewItemType ? api.getItemTypes({ page: 1, limit: 5000 }) : Promise.resolve(null),
        canViewItem ? api.getItems({ page: 1, limit: 5000 }) : Promise.resolve(null),
        canViewTemplate
          ? api.getTemplateMenus({ page: 1, limit: 5000, includeItems: false })
          : Promise.resolve(null),
        canViewItem ? api.getIngredients({ page: 1, limit: 5000 }) : Promise.resolve(null),
        canViewItem ? api.getVendors({ page: 1, limit: 5000 }) : Promise.resolve(null),
      ]);

      const types = typesRes?.data?.data?.itemTypes || [];
      setItemTypes(types);
      setItems(itemsRes?.data?.data?.items || []);
      setTemplateMenus(templatesRes?.data?.data?.templateMenus || []);
      setIngredientOptions(ingredientsRes?.data?.data?.ingredients || []);
      setVendorOptions(vendorsRes?.data?.data?.vendors || []);

      if (types.length > 0) {
        setItemForm((prev) => ({ ...prev, itemTypeId: prev.itemTypeId || types[0].id }));
      }
    } catch (error) {
      toast.error('Failed to load menu data');
    } finally {
      setLoading(false);
    }
  };

  const openCreateType = () => {
    setEditingTypeId(null);
    setTypeForm(initialTypeForm);
    setShowTypePrompt(true);
  };

  const openEditType = (itemType: ItemType) => {
    setEditingTypeId(itemType.id);
    setTypeForm({
      name: itemType.name || '',
      order: String(itemType.order ?? itemType.displayOrder ?? 0),
    });
    setShowTypePrompt(true);
  };

  const submitType = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!typeForm.name.trim()) {
      toast.error('Item type name is required');
      return;
    }
    try {
      setSavingType(true);
      const payload = {
        name: typeForm.name.trim(),
        order: Number(typeForm.order || 0),
        displayOrder: Number(typeForm.order || 0),
      };
      if (editingTypeId) {
        await api.updateItemType(editingTypeId, payload);
      } else {
        await api.createItemType(payload);
      }
      toast.success(editingTypeId ? 'Item type updated' : 'Item type created');
      setShowTypePrompt(false);
      setEditingTypeId(null);
      setTypeForm(initialTypeForm);
      await loadData();
    } catch (error: any) {
      toast.error(
        error?.response?.data?.error ||
          (editingTypeId ? 'Failed to update item type' : 'Failed to create item type')
      );
    } finally {
      setSavingType(false);
    }
  };

  const openCreateItem = () => {
    setEditingItemId(null);
    setItemForm((prev) => ({
      ...initialItemForm,
      itemTypeId: prev.itemTypeId || itemTypes[0]?.id || '',
    }));
    setItemVendorDrafts([]);
    setOriginalItemVendorSupplies([]);
    setItemVendorSearch('');
    setShowItemPrompt(true);
  };

  const openEditItem = async (item: Item) => {
    setEditingItemId(item.id);
    setItemForm({
      itemTypeId: item.itemTypeId || '',
      name: item.name || '',
      setupCost: item.setupCost || '',
      itemCost:
        item.itemCost ||
        (item.cost !== null && item.cost !== undefined ? String(item.cost) : ''),
      points:
        item.points !== null && item.points !== undefined
          ? String(item.points)
          : item.point !== null && item.point !== undefined
          ? String(item.point)
          : '',
      description: item.description || '',
      photo: item.photo || '',
      photoFileName: item.photo ? 'Existing image' : '',
    });
    try {
      const response = await api.getItemVendors(item.id);
      const linkedSupplies = (response.data?.data?.supplies || []) as ItemVendorSupplyRow[];
      const draftMap = new Map<string, ItemVendorDraft>();
      linkedSupplies.forEach((supply) => {
        if (!draftMap.has(supply.vendorId)) {
          draftMap.set(supply.vendorId, {
            vendorId: supply.vendorId,
            price: String(supply.price ?? ''),
            unit: supply.unit || 'piece',
          });
        }
      });
      setOriginalItemVendorSupplies(linkedSupplies);
      setItemVendorDrafts(Array.from(draftMap.values()));
    } catch (error) {
      setOriginalItemVendorSupplies([]);
      setItemVendorDrafts([]);
      toast.error('Unable to load item vendor mappings');
    }
    setItemVendorSearch('');
    setShowItemPrompt(true);
  };

  const getItemVendorDraft = (vendorId: string) =>
    itemVendorDrafts.find((draft) => draft.vendorId === vendorId);

  const isItemVendorSelected = (vendorId: string) => Boolean(getItemVendorDraft(vendorId));

  const toggleItemVendorDraft = (vendorId: string) => {
    setItemVendorDrafts((prev) => {
      const exists = prev.some((draft) => draft.vendorId === vendorId);
      if (exists) {
        return prev.filter((draft) => draft.vendorId !== vendorId);
      }
      return [...prev, { vendorId, price: '', unit: 'piece' }];
    });
  };

  const updateItemVendorDraft = (
    vendorId: string,
    patch: Partial<Pick<ItemVendorDraft, 'price' | 'unit'>>
  ) => {
    setItemVendorDrafts((prev) =>
      prev.map((draft) => {
        if (draft.vendorId !== vendorId) return draft;
        return { ...draft, ...patch };
      })
    );
  };

  const syncItemVendors = async (itemId: string) => {
    const existingByVendorId = new Map<string, ItemVendorSupplyRow[]>();
    originalItemVendorSupplies.forEach((supply) => {
      const bucket = existingByVendorId.get(supply.vendorId) || [];
      bucket.push(supply);
      existingByVendorId.set(supply.vendorId, bucket);
    });

    const desiredVendorIds = new Set<string>();

    for (const draft of itemVendorDrafts) {
      desiredVendorIds.add(draft.vendorId);
      const price = Number(draft.price);
      if (!Number.isFinite(price) || price < 0) {
        throw new Error('Invalid price in selected vendors');
      }

      const payload = {
        vendorId: draft.vendorId,
        price,
        unit: draft.unit,
      };

      const existingSuppliesForVendor = existingByVendorId.get(draft.vendorId) || [];
      const matchingUnitSupply = existingSuppliesForVendor.find(
        (supply) => supply.unit === draft.unit
      );

      if (matchingUnitSupply) {
        await api.updateItemVendor(itemId, matchingUnitSupply.id, payload);
      } else {
        await api.addItemVendor(itemId, payload);
      }

      for (const staleSupply of existingSuppliesForVendor) {
        if (!matchingUnitSupply || staleSupply.id !== matchingUnitSupply.id) {
          await api.deleteItemVendor(itemId, staleSupply.id);
        }
      }
    }

    for (const [vendorId, existingSuppliesForVendor] of Array.from(existingByVendorId.entries())) {
      if (!desiredVendorIds.has(vendorId)) {
        for (const staleSupply of existingSuppliesForVendor) {
          await api.deleteItemVendor(itemId, staleSupply.id);
        }
      }
    }
  };

  const submitItem = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!itemForm.itemTypeId || !itemForm.name.trim() || !itemForm.points) {
      toast.error('Item type, item name and points are required');
      return;
    }

    for (const draft of itemVendorDrafts) {
      if (draft.price === '') {
        toast.error('Please enter price for every selected vendor');
        return;
      }
      const price = Number(draft.price);
      if (!Number.isFinite(price) || price < 0) {
        toast.error('Vendor price must be 0 or greater');
        return;
      }
    }

    try {
      setSavingItem(true);
      const payload = {
        itemTypeId: itemForm.itemTypeId,
        name: itemForm.name.trim(),
        description: itemForm.description.trim() || undefined,
        setupCost: itemForm.setupCost || undefined,
        itemCost: itemForm.itemCost || undefined,
        point: Number(itemForm.points),
        points: Number(itemForm.points),
        cost: itemForm.itemCost ? Number(itemForm.itemCost) : undefined,
        photo: itemForm.photo || undefined,
        isVeg: true,
      };
      let itemId = editingItemId;
      if (editingItemId) {
        await api.updateItem(editingItemId, payload);
      } else {
        const response = await api.createItem(payload);
        itemId = response.data?.data?.item?.id;
      }

      if (!itemId) {
        throw new Error('Item ID not available');
      }

      await syncItemVendors(itemId);

      toast.success(editingItemId ? 'Item updated' : 'Item created');
      setShowItemPrompt(false);
      setEditingItemId(null);
      setItemForm((prev) => ({
        ...initialItemForm,
        itemTypeId: prev.itemTypeId,
      }));
      setItemVendorDrafts([]);
      setOriginalItemVendorSupplies([]);
      setItemVendorSearch('');
      await loadData();
    } catch (error: any) {
      toast.error(
        error?.response?.data?.error ||
          (editingItemId ? 'Failed to update item' : 'Failed to create item')
      );
    } finally {
      setSavingItem(false);
    }
  };

  const openCreateTemplate = () => {
    setEditingTemplateId(null);
    setTemplateForm(initialTemplateForm);
    setTemplateItemSearch('');
    setShowTemplatePrompt(true);
  };

  const openEditTemplate = async (template: TemplateMenu) => {
    try {
      const response = await api.getTemplateMenu(template.id);
      const fullTemplate = response.data?.data?.templateMenu;
      if (!fullTemplate) {
        toast.error('Template details not found');
        return;
      }

      setEditingTemplateId(fullTemplate.id);
      setTemplateForm({
        name: fullTemplate.name || '',
        setupCost:
          fullTemplate.setupCost !== null && fullTemplate.setupCost !== undefined
            ? String(fullTemplate.setupCost)
            : '',
        ratePerPlate:
          fullTemplate.ratePerPlate !== null && fullTemplate.ratePerPlate !== undefined
            ? String(fullTemplate.ratePerPlate)
            : '',
        itemIds: fullTemplate.items?.map((entry: any) => entry.item?.id).filter(Boolean) || [],
      });
      setTemplateItemSearch('');
      setShowTemplatePrompt(true);
    } catch (error) {
      toast.error('Failed to load template menu details');
    }
  };

  const submitTemplate = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!templateForm.name.trim() || templateForm.itemIds.length === 0) {
      toast.error('Template menu name and selected items are required');
      return;
    }
    try {
      setSavingTemplate(true);
      const payload = {
        name: templateForm.name.trim(),
        setupCost: templateForm.setupCost ? Number(templateForm.setupCost) : undefined,
        ratePerPlate: templateForm.ratePerPlate ? Number(templateForm.ratePerPlate) : undefined,
        itemIds: templateForm.itemIds,
      };
      if (editingTemplateId) {
        await api.updateTemplateMenu(editingTemplateId, payload);
      } else {
        await api.createTemplateMenu(payload);
      }
      toast.success(editingTemplateId ? 'Template menu updated' : 'Template menu created');
      setShowTemplatePrompt(false);
      setEditingTemplateId(null);
      setTemplateForm(initialTemplateForm);
      await loadData();
    } catch (error: any) {
      toast.error(
        error?.response?.data?.error ||
          (editingTemplateId
            ? 'Failed to update template menu'
            : 'Failed to create template menu')
      );
    } finally {
      setSavingTemplate(false);
    }
  };

  const toggleTemplateItem = (itemId: string) => {
    setTemplateForm((prev) => {
      const exists = prev.itemIds.includes(itemId);
      return {
        ...prev,
        itemIds: exists
          ? prev.itemIds.filter((id) => id !== itemId)
          : [...prev.itemIds, itemId],
      };
    });
  };

  const handleItemImageUpload = (file: File | undefined) => {
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      setItemForm((prev) => ({
        ...prev,
        photo: typeof reader.result === 'string' ? reader.result : '',
        photoFileName: file.name,
      }));
    };
    reader.readAsDataURL(file);
  };

  const filteredTemplateSourceItems = useMemo(() => {
    const query = templateItemSearch.trim().toLowerCase();
    if (!query) return items;
    return items.filter((item) => {
      const itemTypeName = item.itemType?.name || '';
      return (
        item.name.toLowerCase().includes(query) ||
        itemTypeName.toLowerCase().includes(query)
      );
    });
  }, [items, templateItemSearch]);

  const filteredItemVendorOptions = useMemo(() => {
    const query = itemVendorSearch.trim().toLowerCase();
    if (!query) return vendorOptions;
    return vendorOptions.filter((vendor) => vendor.name.toLowerCase().includes(query));
  }, [vendorOptions, itemVendorSearch]);

  const groupedTemplateItems = useMemo(() => {
    const map = new Map<string, Item[]>();
    filteredTemplateSourceItems.forEach((item) => {
      const group = item.itemType?.name || 'Other';
      const bucket = map.get(group) || [];
      bucket.push(item);
      map.set(group, bucket);
    });
    return Array.from(map.entries()).sort(([a], [b]) => a.localeCompare(b));
  }, [filteredTemplateSourceItems]);

  const selectedTemplateItemsByGroup = useMemo(() => {
    const selected = items.filter((item) => templateForm.itemIds.includes(item.id));
    const map = new Map<string, Item[]>();
    selected.forEach((item) => {
      const group = item.itemType?.name || 'Other';
      const bucket = map.get(group) || [];
      bucket.push(item);
      map.set(group, bucket);
    });
    return Array.from(map.entries()).sort(([a], [b]) => a.localeCompare(b));
  }, [items, templateForm.itemIds]);

  const removeItemType = async (id: string) => {
    if (!confirm('Delete this item type?')) return;
    try {
      await api.deleteItemType(id);
      toast.success('Item type deleted');
      await loadData();
    } catch (error: any) {
      toast.error(error?.response?.data?.error || 'Failed to delete item type');
    }
  };

  const removeItem = async (id: string) => {
    if (!confirm('Delete this item?')) return;
    try {
      await api.deleteItem(id);
      toast.success('Item deleted');
      await loadData();
    } catch (error: any) {
      toast.error(error?.response?.data?.error || 'Failed to delete item');
    }
  };

  const removeTemplateMenu = async (id: string) => {
    if (!confirm('Delete this template menu?')) return;
    try {
      await api.deleteTemplateMenu(id);
      toast.success('Template menu deleted');
      await loadData();
    } catch (error: any) {
      toast.error(error?.response?.data?.error || 'Failed to delete template menu');
    }
  };

  const openItemRecipeManager = async (item: Item) => {
    try {
      const response = await api.getItemRecipes(item.id);
      setRecipeItem(item);
      setItemRecipes(response.data?.data?.recipes || []);
      setRecipeForm({
        ingredientId: ingredientOptions[0]?.id || '',
        quantity: '',
        unit: 'g',
      });
      setEditingRecipeId(null);
      setShowRecipePrompt(true);
    } catch (error) {
      toast.error('Failed to load recipe details');
    }
  };

  const editRecipe = (recipe: ItemRecipeRow) => {
    setEditingRecipeId(recipe.id);
    setRecipeForm({
      ingredientId: recipe.ingredientId,
      quantity: String(recipe.quantity),
      unit: recipe.unit,
    });
  };

  const submitRecipe = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!recipeItem) return;
    if (!recipeForm.ingredientId || !recipeForm.quantity) {
      toast.error('Ingredient and quantity are required');
      return;
    }

    try {
      setSavingRecipe(true);
      const payload = {
        ingredientId: recipeForm.ingredientId,
        quantity: Number(recipeForm.quantity),
        unit: recipeForm.unit,
      };
      if (editingRecipeId) {
        await api.updateItemRecipe(recipeItem.id, editingRecipeId, payload);
      } else {
        await api.addItemRecipe(recipeItem.id, payload);
      }
      const refreshed = await api.getItemRecipes(recipeItem.id);
      setItemRecipes(refreshed.data?.data?.recipes || []);
      setRecipeForm({
        ingredientId: ingredientOptions[0]?.id || '',
        quantity: '',
        unit: 'g',
      });
      setEditingRecipeId(null);
      await loadData();
      toast.success(editingRecipeId ? 'Recipe updated' : 'Recipe ingredient added');
    } catch (error: any) {
      toast.error(error?.response?.data?.error || 'Failed to save recipe');
    } finally {
      setSavingRecipe(false);
    }
  };

  const removeRecipe = async (recipeId: string) => {
    if (!recipeItem) return;
    if (!confirm('Delete this recipe ingredient?')) return;
    try {
      await api.deleteItemRecipe(recipeItem.id, recipeId);
      const refreshed = await api.getItemRecipes(recipeItem.id);
      setItemRecipes(refreshed.data?.data?.recipes || []);
      await loadData();
      toast.success('Recipe ingredient deleted');
    } catch (error: any) {
      toast.error(error?.response?.data?.error || 'Failed to delete recipe ingredient');
    }
  };

  const openItemVendorsManager = async (item: Item) => {
    try {
      const response = await api.getItemVendors(item.id);
      setVendorItem(item);
      setItemVendors(response.data?.data?.supplies || []);
      setItemVendorForm({
        vendorId: vendorOptions[0]?.id || '',
        price: '',
        unit: 'piece',
      });
      setEditingItemVendorId(null);
      setShowItemVendorsPrompt(true);
    } catch (error) {
      toast.error('Failed to load item vendors');
    }
  };

  const editItemVendor = (supply: ItemVendorSupplyRow) => {
    setEditingItemVendorId(supply.id);
    setItemVendorForm({
      vendorId: supply.vendorId,
      price: String(supply.price),
      unit: supply.unit,
    });
  };

  const submitItemVendor = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!vendorItem) return;
    if (!itemVendorForm.vendorId || !itemVendorForm.price) {
      toast.error('Vendor and price are required');
      return;
    }
    try {
      setSavingItemVendor(true);
      const payload = {
        vendorId: itemVendorForm.vendorId,
        price: Number(itemVendorForm.price),
        unit: itemVendorForm.unit,
      };
      if (editingItemVendorId) {
        await api.updateItemVendor(vendorItem.id, editingItemVendorId, payload);
      } else {
        await api.addItemVendor(vendorItem.id, payload);
      }
      const refreshed = await api.getItemVendors(vendorItem.id);
      setItemVendors(refreshed.data?.data?.supplies || []);
      setItemVendorForm({
        vendorId: vendorOptions[0]?.id || '',
        price: '',
        unit: 'piece',
      });
      setEditingItemVendorId(null);
      await loadData();
      toast.success(editingItemVendorId ? 'Item vendor updated' : 'Item vendor added');
    } catch (error: any) {
      toast.error(error?.response?.data?.error || 'Failed to save item vendor');
    } finally {
      setSavingItemVendor(false);
    }
  };

  const removeItemVendor = async (supplyId: string) => {
    if (!vendorItem) return;
    if (!confirm('Delete this item vendor mapping?')) return;
    try {
      await api.deleteItemVendor(vendorItem.id, supplyId);
      const refreshed = await api.getItemVendors(vendorItem.id);
      setItemVendors(refreshed.data?.data?.supplies || []);
      await loadData();
      toast.success('Item vendor mapping deleted');
    } catch (error: any) {
      toast.error(error?.response?.data?.error || 'Failed to delete item vendor mapping');
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Menu & Items</h1>
        <p className="text-gray-600 mt-1">
          Manage item categories, individual dishes, ingredients, vendors and reusable template menus.
        </p>
      </div>

      {!canViewItemType && !canViewItem && !canViewTemplate && (
        <div className="card border-amber-200 bg-amber-50 text-amber-800 text-sm">
          You do not have permission to view menu tables.
        </div>
      )}

      <FormPromptModal
        open={showTypePrompt}
        title={editingTypeId ? 'Edit Item Type' : 'Item Types'}
        onClose={() => {
          setShowTypePrompt(false);
          setEditingTypeId(null);
          setTypeForm(initialTypeForm);
        }}
        widthClass="max-w-2xl"
      >
        <form className="space-y-4" onSubmit={submitType}>
          <div className="grid grid-cols-1 gap-4">
            <div>
              <label className="label">
                Item Type Name <span className="text-red-500">*</span>
              </label>
              <input
                className="input"
                placeholder="Item Type Name"
                value={typeForm.name}
                onChange={(e) => setTypeForm((prev) => ({ ...prev, name: e.target.value }))}
                required
              />
            </div>
            <div>
              <label className="label">
                Order <span className="text-red-500">*</span>
              </label>
              <input
                className="input"
                type="number"
                min={0}
                value={typeForm.order}
                onChange={(e) => setTypeForm((prev) => ({ ...prev, order: e.target.value }))}
                required
              />
            </div>
          </div>
          <div className="form-actions">
            <button
              type="button"
              className="btn btn-secondary"
              onClick={() => {
                setShowTypePrompt(false);
                setEditingTypeId(null);
                setTypeForm(initialTypeForm);
              }}
            >
              Cancel
            </button>
            <button className="btn btn-primary" type="submit" disabled={savingType}>
              <span className="inline-flex items-center gap-2">
                <Save className="w-4 h-4" />
                {savingType ? 'Saving...' : 'Submit'}
              </span>
            </button>
          </div>
        </form>
      </FormPromptModal>

      <FormPromptModal
        open={showItemPrompt}
        title={editingItemId ? 'Edit Item' : 'Items'}
        onClose={() => {
          setShowItemPrompt(false);
          setEditingItemId(null);
          setItemVendorDrafts([]);
          setOriginalItemVendorSupplies([]);
          setItemVendorSearch('');
        }}
        widthClass="max-w-5xl"
      >
        <form className="space-y-4" onSubmit={submitItem}>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="label">
                Item Name <span className="text-red-500">*</span>
              </label>
              <input
                className="input"
                placeholder="Item Name"
                value={itemForm.name}
                onChange={(e) => setItemForm((prev) => ({ ...prev, name: e.target.value }))}
                required
              />
            </div>
            <div>
              <label className="label">
                Select Item Type <span className="text-red-500">*</span>
              </label>
              <select
                className="input"
                value={itemForm.itemTypeId}
                onChange={(e) => setItemForm((prev) => ({ ...prev, itemTypeId: e.target.value }))}
                required
              >
                <option value="">Select item type</option>
                {itemTypes.map((itemType) => (
                  <option key={itemType.id} value={itemType.id}>
                    {itemType.name}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="label">Setup Cost</label>
              <input
                className="input"
                placeholder="Setup Cost"
                value={itemForm.setupCost}
                onChange={(e) =>
                  setItemForm((prev) => ({ ...prev, setupCost: e.target.value }))
                }
              />
            </div>
            <div>
              <label className="label">Item Cost</label>
              <input
                className="input"
                placeholder="Item Cost"
                value={itemForm.itemCost}
                onChange={(e) =>
                  setItemForm((prev) => ({ ...prev, itemCost: e.target.value }))
                }
              />
            </div>
            <div className="md:col-span-2">
              <label className="label">
                Points <span className="text-red-500">*</span>
              </label>
              <input
                className="input"
                type="number"
                min={0}
                placeholder="Points"
                value={itemForm.points}
                onChange={(e) => setItemForm((prev) => ({ ...prev, points: e.target.value }))}
                required
              />
            </div>
            <div className="md:col-span-2">
              <label className="label">Description</label>
              <textarea
                className="input min-h-[90px]"
                placeholder="Description"
                value={itemForm.description}
                onChange={(e) =>
                  setItemForm((prev) => ({ ...prev, description: e.target.value }))
                }
              />
            </div>
            <div className="md:col-span-2">
              <label className="label">Image</label>
              <label className="block rounded-2xl border-2 border-dashed border-gray-300 bg-gray-50 p-4 hover:border-primary-300 transition cursor-pointer">
                <div className="text-sm text-gray-600">
                  {itemForm.photoFileName
                    ? `Selected: ${itemForm.photoFileName}`
                    : 'Drag and drop or select image file'}
                </div>
                <input
                  type="file"
                  accept="image/*"
                  className="sr-only"
                  onChange={(e) => handleItemImageUpload(e.target.files?.[0])}
                />
              </label>
            </div>
            <div className="md:col-span-2 rounded-xl border border-gray-200 bg-white">
              <div className="px-3 py-2 border-b border-gray-200">
                <p className="text-sm font-semibold text-gray-800">Link Vendors</p>
                <p className="text-xs text-gray-500 mt-0.5">
                  Search, select multiple vendors and set per-unit rates.
                </p>
              </div>
              <div className="px-3 py-2 border-b border-gray-100">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <input
                    className="input h-9 pl-9"
                    placeholder="Search vendors..."
                    value={itemVendorSearch}
                    onChange={(event) => setItemVendorSearch(event.target.value)}
                  />
                </div>
              </div>
              <div className="max-h-72 overflow-y-auto divide-y divide-gray-100">
                {filteredItemVendorOptions.length === 0 ? (
                  <div className="empty-state" style={{ padding: '20px 12px' }}>
                    <div className="empty-state-icon">
                      <ListChecks size={20} />
                    </div>
                    <p className="empty-state-title">No vendors available</p>
                    <p className="empty-state-desc">Add vendors to link them to this item.</p>
                  </div>
                ) : (
                  filteredItemVendorOptions.map((vendor) => {
                    const selected = isItemVendorSelected(vendor.id);
                    const draft = getItemVendorDraft(vendor.id);
                    return (
                      <div
                        key={`item-vendor-draft-${vendor.id}`}
                        className="px-3 py-2 grid grid-cols-1 md:grid-cols-[minmax(0,1fr)_120px_120px] gap-2 items-center"
                      >
                        <label className="inline-flex items-center gap-2 text-sm text-gray-700">
                          <input
                            type="checkbox"
                            checked={selected}
                            onChange={() => toggleItemVendorDraft(vendor.id)}
                          />
                          <span>{vendor.name}</span>
                        </label>
                        {selected ? (
                          <>
                            <input
                              className="input h-9"
                              type="number"
                              min={0}
                              step="0.01"
                              placeholder="Price"
                              value={draft?.price || ''}
                              onChange={(event) =>
                                updateItemVendorDraft(vendor.id, {
                                  price: event.target.value,
                                })
                              }
                            />
                            <select
                              className="input h-9"
                              value={draft?.unit || 'piece'}
                              onChange={(event) =>
                                updateItemVendorDraft(vendor.id, {
                                  unit: event.target.value,
                                })
                              }
                            >
                              {recipeUnits.map((unit) => (
                                <option key={`item-vendor-unit-${vendor.id}-${unit}`} value={unit}>
                                  {unit}
                                </option>
                              ))}
                            </select>
                          </>
                        ) : (
                          <>
                            <span className="text-xs text-gray-400">Not selected</span>
                            <span />
                          </>
                        )}
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          </div>
          <div className="form-actions">
            <button
              type="button"
              className="btn btn-secondary"
              onClick={() => {
                setShowItemPrompt(false);
                setEditingItemId(null);
                setItemVendorDrafts([]);
                setOriginalItemVendorSupplies([]);
                setItemVendorSearch('');
              }}
            >
              Cancel
            </button>
            <button className="btn btn-primary" type="submit" disabled={savingItem}>
              <span className="inline-flex items-center gap-2">
                <Save className="w-4 h-4" />
                {savingItem ? 'Saving...' : 'Submit'}
              </span>
            </button>
          </div>
        </form>
      </FormPromptModal>

      <FormPromptModal
        open={showTemplatePrompt}
        title={editingTemplateId ? 'Edit Menu Template' : 'Menu Template'}
        onClose={() => {
          setShowTemplatePrompt(false);
          setEditingTemplateId(null);
          setTemplateForm(initialTemplateForm);
          setTemplateItemSearch('');
        }}
        widthClass="max-w-6xl"
      >
        <form className="space-y-4" onSubmit={submitTemplate}>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="label">
                Menu Name <span className="text-red-500">*</span>
              </label>
              <input
                className="input"
                placeholder="Menu Name"
                value={templateForm.name}
                onChange={(e) =>
                  setTemplateForm((prev) => ({ ...prev, name: e.target.value }))
                }
                required
              />
            </div>
            <div>
              <label className="label">
                Setup Cost (Auto: ₹0) <span className="text-red-500">*</span>
              </label>
              <input
                className="input"
                type="number"
                min={0}
                value={templateForm.setupCost}
                onChange={(e) =>
                  setTemplateForm((prev) => ({ ...prev, setupCost: e.target.value }))
                }
              />
            </div>
            <div>
              <label className="label">
                Rate Per Plate (Auto: ₹0) <span className="text-red-500">*</span>
              </label>
              <input
                className="input"
                type="number"
                min={0}
                value={templateForm.ratePerPlate}
                onChange={(e) =>
                  setTemplateForm((prev) => ({ ...prev, ratePerPlate: e.target.value }))
                }
              />
            </div>
          </div>

          <div>
            <label className="label">
              Select Items <span className="text-red-500">*</span>
            </label>
            <p className="text-sm text-primary-700 mb-2">
              {templateForm.itemIds.length} selected
            </p>
            <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
              <div className="border border-gray-200 rounded-xl p-3">
                <input
                  className="input mb-3"
                  placeholder="Search..."
                  value={templateItemSearch}
                  onChange={(e) => setTemplateItemSearch(e.target.value)}
                />
                <div className="max-h-[340px] overflow-y-auto rounded-lg border border-gray-200">
                  {groupedTemplateItems.length === 0 ? (
                    <div className="empty-state" style={{ padding: '20px 12px' }}>
                      <div className="empty-state-icon">
                        <Search size={20} />
                      </div>
                      <p className="empty-state-title">No matching items</p>
                      <p className="empty-state-desc">Try another keyword.</p>
                    </div>
                  ) : (
                    groupedTemplateItems.map(([group, grouped]) => (
                      <div key={group}>
                        <div className="px-3 py-2 text-sm font-semibold text-gray-800 bg-primary-50 border-b border-gray-200">
                          {group}
                        </div>
                        {grouped.map((item) => (
                          <label
                            key={item.id}
                            className="flex items-center gap-2 px-3 py-2 text-sm text-gray-700 border-b border-gray-100 last:border-b-0"
                          >
                            <input
                              type="checkbox"
                              checked={templateForm.itemIds.includes(item.id)}
                              onChange={() => toggleTemplateItem(item.id)}
                            />
                            <span>{item.name}</span>
                          </label>
                        ))}
                      </div>
                    ))
                  )}
                </div>
              </div>

              <div className="border border-gray-200 rounded-xl p-3">
                <div className="max-h-[340px] overflow-y-auto space-y-3">
                  {selectedTemplateItemsByGroup.length === 0 ? (
                    <div className="empty-state" style={{ padding: '20px 12px' }}>
                      <div className="empty-state-icon">
                        <Soup size={20} />
                      </div>
                      <p className="empty-state-title">No items selected</p>
                      <p className="empty-state-desc">Choose items to build this template.</p>
                    </div>
                  ) : (
                    selectedTemplateItemsByGroup.map(([group, grouped]) => (
                      <div key={`selected-${group}`} className="space-y-2">
                        <p className="text-sm font-semibold text-gray-800">{group.toUpperCase()}</p>
                        <div className="flex flex-wrap gap-2">
                          {grouped.map((item) => (
                            <span
                              key={`chip-${item.id}`}
                              className="inline-flex items-center gap-2 rounded-full border border-gray-300 bg-white px-3 py-1.5 text-sm"
                            >
                              {item.name}
                              <button
                                type="button"
                                className="text-red-600"
                                onClick={() => toggleTemplateItem(item.id)}
                                aria-label={`Remove ${item.name}`}
                              >
                                ×
                              </button>
                            </span>
                          ))}
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>
          </div>
          <div className="form-actions">
            <button
              type="button"
              className="btn btn-secondary"
              onClick={() => {
                setShowTemplatePrompt(false);
                setEditingTemplateId(null);
                setTemplateForm(initialTemplateForm);
                setTemplateItemSearch('');
              }}
            >
              Cancel
            </button>
            <button className="btn btn-primary" type="submit" disabled={savingTemplate}>
              <span className="inline-flex items-center gap-2">
                <Save className="w-4 h-4" />
                {savingTemplate ? 'Saving...' : 'Submit'}
              </span>
            </button>
          </div>
        </form>
      </FormPromptModal>

      <FormPromptModal
        open={showRecipePrompt}
        title={recipeItem ? `Recipe · ${recipeItem.name}` : 'Item Recipe'}
        onClose={() => {
          setShowRecipePrompt(false);
          setRecipeItem(null);
          setItemRecipes([]);
          setEditingRecipeId(null);
          setRecipeForm({
            ingredientId: ingredientOptions[0]?.id || '',
            quantity: '',
            unit: 'g',
          });
        }}
        widthClass="max-w-5xl"
      >
        {!recipeItem ? null : (
          <div className="space-y-4">
            <div className="table-shell">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Ingredient</th>
                    <th>Quantity</th>
                    <th>Unit</th>
                    <th className="text-right">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {itemRecipes.length === 0 ? (
                    <tr>
                      <td colSpan={4} className="text-center py-4 text-sm text-gray-500">
                        No ingredients mapped in this recipe.
                      </td>
                    </tr>
                  ) : (
                    itemRecipes.map((recipe) => (
                      <tr key={recipe.id}>
                        <td>{recipe.ingredient?.name || '-'}</td>
                        <td>{recipe.quantity}</td>
                        <td>{recipe.unit}</td>
                        <td className="text-right">
                          <div className="flex items-center justify-end gap-2">
                            <button
                              type="button"
                              className="p-2 text-gray-500 hover:text-blue-700 hover:bg-blue-50 rounded-lg"
                              onClick={() => editRecipe(recipe)}
                            >
                              <Edit className="w-4 h-4" />
                            </button>
                            <button
                              type="button"
                              className="p-2 text-gray-500 hover:text-red-700 hover:bg-red-50 rounded-lg"
                              onClick={() => removeRecipe(recipe.id)}
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>

            <form className="grid grid-cols-1 md:grid-cols-4 gap-3" onSubmit={submitRecipe}>
              <div>
                <label className="label">Ingredient</label>
                <select
                  className="input"
                  value={recipeForm.ingredientId}
                  onChange={(e) =>
                    setRecipeForm((prev) => ({ ...prev, ingredientId: e.target.value }))
                  }
                  required
                >
                  <option value="">Select ingredient</option>
                  {ingredientOptions.map((ingredient) => (
                    <option key={ingredient.id} value={ingredient.id}>
                      {ingredient.name}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="label">Quantity</label>
                <input
                  className="input"
                  type="number"
                  min={0}
                  step="0.01"
                  value={recipeForm.quantity}
                  onChange={(e) =>
                    setRecipeForm((prev) => ({ ...prev, quantity: e.target.value }))
                  }
                  required
                />
              </div>
              <div>
                <label className="label">Unit</label>
                <select
                  className="input"
                  value={recipeForm.unit}
                  onChange={(e) =>
                    setRecipeForm((prev) => ({ ...prev, unit: e.target.value }))
                  }
                >
                  {recipeUnits.map((unit) => (
                    <option key={unit} value={unit}>
                      {unit}
                    </option>
                  ))}
                </select>
              </div>
              <div className="flex items-end">
                <button type="submit" className="btn btn-primary w-full" disabled={savingRecipe}>
                  {savingRecipe ? 'Saving...' : editingRecipeId ? 'Update' : 'Add Ingredient'}
                </button>
              </div>
            </form>
          </div>
        )}
      </FormPromptModal>

      <FormPromptModal
        open={showItemVendorsPrompt}
        title={vendorItem ? `Vendors · ${vendorItem.name}` : 'Item Vendors'}
        onClose={() => {
          setShowItemVendorsPrompt(false);
          setVendorItem(null);
          setItemVendors([]);
          setEditingItemVendorId(null);
          setItemVendorForm({
            vendorId: vendorOptions[0]?.id || '',
            price: '',
            unit: 'piece',
          });
        }}
        widthClass="max-w-5xl"
      >
        {!vendorItem ? null : (
          <div className="space-y-4">
            <div className="table-shell">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Vendor</th>
                    <th>Price</th>
                    <th>Unit</th>
                    <th className="text-right">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {itemVendors.length === 0 ? (
                    <tr>
                      <td colSpan={4} className="text-center py-4 text-sm text-gray-500">
                        No vendors linked to this item.
                      </td>
                    </tr>
                  ) : (
                    itemVendors.map((supply) => (
                      <tr key={supply.id}>
                        <td>{supply.vendor?.name || '-'}</td>
                        <td>INR {Number(supply.price || 0).toLocaleString('en-IN')}</td>
                        <td>{supply.unit}</td>
                        <td className="text-right">
                          <div className="flex items-center justify-end gap-2">
                            <button
                              type="button"
                              className="p-2 text-gray-500 hover:text-blue-700 hover:bg-blue-50 rounded-lg"
                              onClick={() => editItemVendor(supply)}
                            >
                              <Edit className="w-4 h-4" />
                            </button>
                            <button
                              type="button"
                              className="p-2 text-gray-500 hover:text-red-700 hover:bg-red-50 rounded-lg"
                              onClick={() => removeItemVendor(supply.id)}
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>

            <form className="grid grid-cols-1 md:grid-cols-4 gap-3" onSubmit={submitItemVendor}>
              <div>
                <label className="label">Vendor</label>
                <select
                  className="input"
                  value={itemVendorForm.vendorId}
                  onChange={(e) =>
                    setItemVendorForm((prev) => ({ ...prev, vendorId: e.target.value }))
                  }
                  required
                >
                  <option value="">Select vendor</option>
                  {vendorOptions.map((vendor) => (
                    <option key={vendor.id} value={vendor.id}>
                      {vendor.name}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="label">Price</label>
                <input
                  className="input"
                  type="number"
                  min={0}
                  step="0.01"
                  value={itemVendorForm.price}
                  onChange={(e) =>
                    setItemVendorForm((prev) => ({ ...prev, price: e.target.value }))
                  }
                  required
                />
              </div>
              <div>
                <label className="label">Unit</label>
                <select
                  className="input"
                  value={itemVendorForm.unit}
                  onChange={(e) =>
                    setItemVendorForm((prev) => ({ ...prev, unit: e.target.value }))
                  }
                >
                  {recipeUnits.map((unit) => (
                    <option key={unit} value={unit}>
                      {unit}
                    </option>
                  ))}
                </select>
              </div>
              <div className="flex items-end">
                <button
                  type="submit"
                  className="btn btn-primary w-full"
                  disabled={savingItemVendor}
                >
                  {savingItemVendor ? 'Saving...' : editingItemVendorId ? 'Update' : 'Add Vendor'}
                </button>
              </div>
            </form>
          </div>
        )}
      </FormPromptModal>

      {(canViewItemType || canViewItem || canViewTemplate) && (
        <div className="card p-2">
          <div className="grid grid-cols-2 lg:grid-cols-5 gap-2">
            <button
              type="button"
              onClick={() => navigateToMenuSection('itemType')}
              disabled={!canViewItemType}
              className={`px-4 py-2.5 rounded-xl text-sm font-semibold transition ${
                activeMenuSection === 'itemType' && canViewItemType && !isIngredientsPage && !isVendorsPage
                  ? 'bg-primary-600 text-white shadow'
                  : 'bg-white text-gray-700 border border-gray-200 hover:border-primary-200 disabled:opacity-50 disabled:cursor-not-allowed'
              }`}
            >
              Item Types
            </button>
            <button
              type="button"
              onClick={() => navigateToMenuSection('item')}
              disabled={!canViewItem}
              className={`px-4 py-2.5 rounded-xl text-sm font-semibold transition ${
                activeMenuSection === 'item' && canViewItem && !isIngredientsPage && !isVendorsPage
                  ? 'bg-primary-600 text-white shadow'
                  : 'bg-white text-gray-700 border border-gray-200 hover:border-primary-200 disabled:opacity-50 disabled:cursor-not-allowed'
              }`}
            >
              Items
            </button>
            <button
              type="button"
              onClick={() => navigateToMenuSection('template')}
              disabled={!canViewTemplate}
              className={`px-4 py-2.5 rounded-xl text-sm font-semibold transition ${
                activeMenuSection === 'template' && canViewTemplate && !isIngredientsPage && !isVendorsPage
                  ? 'bg-primary-600 text-white shadow'
                  : 'bg-white text-gray-700 border border-gray-200 hover:border-primary-200 disabled:opacity-50 disabled:cursor-not-allowed'
              }`}
            >
              Template Menus
            </button>
            <button
              type="button"
              onClick={() => router.push('/dashboard/menu/ingredients')}
              disabled={!canViewItem}
              className={`px-4 py-2.5 rounded-xl text-sm font-semibold transition ${
                isIngredientsPage && canViewItem
                  ? 'bg-primary-600 text-white shadow'
                  : 'bg-white text-gray-700 border border-gray-200 hover:border-primary-200 disabled:opacity-50 disabled:cursor-not-allowed'
              }`}
            >
              Ingredients
            </button>
            <button
              type="button"
              onClick={() => router.push('/dashboard/menu/vendors')}
              disabled={!canViewItem}
              className={`px-4 py-2.5 rounded-xl text-sm font-semibold transition ${
                isVendorsPage && canViewItem
                  ? 'bg-primary-600 text-white shadow'
                  : 'bg-white text-gray-700 border border-gray-200 hover:border-primary-200 disabled:opacity-50 disabled:cursor-not-allowed'
              }`}
            >
              Vendors
            </button>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 gap-6">
        <div
          className={`card ${
            activeMenuSection === 'itemType' && canViewItemType ? '' : 'hidden'
          }`}
        >
          <div className="page-head mb-4">
            <h2 className="text-lg font-semibold text-gray-900">Item types</h2>
            {canAddItemType && (
              <button
                type="button"
                className="btn btn-primary inline-flex items-center gap-2 w-full sm:w-auto justify-center"
                onClick={openCreateType}
              >
                <Layers className="w-4 h-4" />
                Add
              </button>
            )}
          </div>
          <div className="relative mb-4">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              className="input pl-9"
              value={itemTypeGlobalSearch}
              onChange={(e) => setItemTypeGlobalSearch(e.target.value)}
              placeholder="Overall search in item types..."
            />
          </div>
          {loading ? (
            <TableSkeleton rows={5} />
          ) : (
            <div className="table-shell">
              <table className="data-table">
                <thead>
                  <tr className="border-b border-gray-200">
                    <SortableHeader
                      label="Type"
                      sortKey="name"
                      sort={itemTypeSort}
                      onSort={(key) => setItemTypeSort((prev) => getNextSort(prev, key))}
                      className="text-left py-3 px-2 text-sm font-semibold text-gray-700"
                    />
                    <SortableHeader
                      label="Order"
                      sortKey="order"
                      sort={itemTypeSort}
                      onSort={(key) => setItemTypeSort((prev) => getNextSort(prev, key))}
                      className="text-left py-3 px-2 text-sm font-semibold text-gray-700"
                    />
                    <SortableHeader
                      label="Items"
                      sortKey="itemCount"
                      sort={itemTypeSort}
                      onSort={(key) => setItemTypeSort((prev) => getNextSort(prev, key))}
                      className="text-left py-3 px-2 text-sm font-semibold text-gray-700"
                    />
                    <th className="text-right py-3 px-2 text-sm font-semibold text-gray-700">
                      Actions
                    </th>
                  </tr>
                  <tr className="table-search-row border-b border-gray-100 bg-gray-50">
                    <th className="py-2 px-2">
                      <input
                        className="input h-9"
                        placeholder="Search type"
                        value={itemTypeColumnSearch.name}
                        onChange={(e) =>
                          setItemTypeColumnSearch((prev) => ({
                            ...prev,
                            name: e.target.value,
                          }))
                        }
                      />
                    </th>
                    <th className="py-2 px-2">
                      <input
                        className="input h-9"
                        placeholder="Search order"
                        value={itemTypeColumnSearch.order}
                        onChange={(e) =>
                          setItemTypeColumnSearch((prev) => ({
                            ...prev,
                            order: e.target.value,
                          }))
                        }
                      />
                    </th>
                    <th className="py-2 px-2">
                      <input
                        className="input h-9"
                        placeholder="Search item count"
                        value={itemTypeColumnSearch.itemCount}
                        onChange={(e) =>
                          setItemTypeColumnSearch((prev) => ({
                            ...prev,
                            itemCount: e.target.value,
                          }))
                        }
                      />
                    </th>
                    <th className="py-2 px-2" />
                  </tr>
                </thead>
                <tbody>
                  {paginatedItemTypes.map((itemType) => (
                    <tr key={itemType.id} className="border-b border-gray-100">
                      <td className="py-3 px-2">
                        <p className="text-sm text-gray-900">{itemType.name}</p>
                      </td>
                      <td className="py-3 px-2 text-sm text-gray-700">
                        {itemType.order ?? itemType.displayOrder ?? 0}
                      </td>
                      <td className="py-3 px-2 text-sm text-gray-700">{itemType._count?.items || 0}</td>
                      <td className="py-3 px-2 text-right">
                        <div className="flex items-center justify-end gap-2">
                          {canEditItemType && (
                            <button
                              className="p-2 text-gray-500 hover:text-blue-700 hover:bg-blue-50 rounded-lg"
                              onClick={() => openEditType(itemType)}
                            >
                              <Edit className="w-4 h-4" />
                            </button>
                          )}
                          {canDeleteItemType && (
                            <button
                              className="p-2 text-gray-500 hover:text-red-700 hover:bg-red-50 rounded-lg"
                              onClick={() => removeItemType(itemType.id)}
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              <TablePagination
                currentPage={itemTypePage}
                totalPages={itemTypeTotalPages}
                totalItems={filteredItemTypes.length}
                pageSize={ITEM_TYPES_PAGE_SIZE}
                itemLabel="item types"
                onPageChange={setItemTypePage}
              />
            </div>
          )}
        </div>

        <div
          className={`card ${
            activeMenuSection === 'item' && canViewItem ? '' : 'hidden'
          }`}
        >
          <div className="page-head mb-4">
            <h2 className="text-lg font-semibold text-gray-900">Items</h2>
            {canAddItem && (
              <button
                type="button"
                className="btn btn-primary inline-flex items-center gap-2 w-full sm:w-auto justify-center"
                onClick={openCreateItem}
              >
                <Soup className="w-4 h-4" />
                Add
              </button>
            )}
          </div>
          <div className="relative mb-4">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              className="input pl-9"
              value={itemsGlobalSearch}
              onChange={(e) => setItemsGlobalSearch(e.target.value)}
              placeholder="Overall search in items..."
            />
          </div>
          {loading ? (
            <TableSkeleton rows={5} />
          ) : (
            <div className="table-shell">
              <table className="data-table">
                <thead>
                  <tr className="border-b border-gray-200">
                    <SortableHeader
                      label="Item"
                      sortKey="name"
                      sort={itemSort}
                      onSort={(key) => setItemSort((prev) => getNextSort(prev, key))}
                      className="text-left py-3 px-2 text-sm font-semibold text-gray-700"
                    />
                    <SortableHeader
                      label="Type"
                      sortKey="type"
                      sort={itemSort}
                      onSort={(key) => setItemSort((prev) => getNextSort(prev, key))}
                      className="text-left py-3 px-2 text-sm font-semibold text-gray-700"
                    />
                    <SortableHeader
                      label="Cost"
                      sortKey="cost"
                      sort={itemSort}
                      onSort={(key) => setItemSort((prev) => getNextSort(prev, key))}
                      className="text-left py-3 px-2 text-sm font-semibold text-gray-700"
                    />
                    <th className="text-right py-3 px-2 text-sm font-semibold text-gray-700">
                      Actions
                    </th>
                  </tr>
                  <tr className="table-search-row border-b border-gray-100 bg-gray-50">
                    <th className="py-2 px-2">
                      <input
                        className="input h-9"
                        placeholder="Search item"
                        value={itemsColumnSearch.name}
                        onChange={(e) =>
                          setItemsColumnSearch((prev) => ({
                            ...prev,
                            name: e.target.value,
                          }))
                        }
                      />
                    </th>
                    <th className="py-2 px-2">
                      <input
                        className="input h-9"
                        placeholder="Search type"
                        value={itemsColumnSearch.type}
                        onChange={(e) =>
                          setItemsColumnSearch((prev) => ({
                            ...prev,
                            type: e.target.value,
                          }))
                        }
                      />
                    </th>
                    <th className="py-2 px-2">
                      <input
                        className="input h-9"
                        placeholder="Search cost"
                        value={itemsColumnSearch.cost}
                        onChange={(e) =>
                          setItemsColumnSearch((prev) => ({
                            ...prev,
                            cost: e.target.value,
                          }))
                        }
                      />
                    </th>
                    <th className="py-2 px-2" />
                  </tr>
                </thead>
                <tbody>
                  {groupedPaginatedItems.map((group) => {
                    const collapsed = Boolean(collapsedItemTypeGroups[group.key]);
                    return (
                      <Fragment key={`group-${group.key}`}>
                        <tr className="border-b border-gray-200 bg-gray-50">
                          <td colSpan={4} className="py-2 px-2">
                            <button
                              type="button"
                              className="w-full flex items-center justify-between gap-2 rounded-lg px-2 py-1.5 text-left hover:bg-gray-100"
                              onClick={() =>
                                setCollapsedItemTypeGroups((prev) => ({
                                  ...prev,
                                  [group.key]: !prev[group.key],
                                }))
                              }
                            >
                              <span className="text-sm font-semibold text-gray-800">
                                {group.label}
                              </span>
                              <span className="inline-flex items-center gap-2 text-xs text-gray-500">
                                {group.rows.length} item{group.rows.length === 1 ? '' : 's'}
                                <ChevronDown
                                  className={`w-4 h-4 transition-transform ${collapsed ? '' : 'rotate-180'}`}
                                />
                              </span>
                            </button>
                          </td>
                        </tr>
                        {!collapsed &&
                          group.rows.map((item) => (
                            <tr key={item.id} className="border-b border-gray-100">
                              <td className="py-3 px-2">
                                <p className="text-sm text-gray-900">{item.name}</p>
                                <div className="mt-1 flex flex-wrap items-center gap-2 text-xs text-gray-500">
                                  <span>{item.isVeg ? 'Veg' : 'Non-veg'}</span>
                                  <span className="inline-flex items-center rounded-full bg-gray-100 px-2 py-0.5">
                                    Recipe: {item._count?.itemRecipes || 0}
                                  </span>
                                  <span className="inline-flex items-center rounded-full bg-gray-100 px-2 py-0.5">
                                    Vendors: {item._count?.vendorSupplies || 0}
                                  </span>
                                </div>
                              </td>
                              <td className="py-3 px-2 text-sm text-gray-700">
                                {group.label || '-'}
                              </td>
                              <td className="py-3 px-2 text-sm text-gray-700">
                                {item.cost ? `INR ${item.cost.toLocaleString('en-IN')}` : '-'}
                              </td>
                              <td className="py-3 px-2 text-right">
                                <div className="flex items-center justify-end gap-2">
                                  {canEditItem && (
                                    <button
                                      className="btn btn-secondary"
                                      onClick={() => openItemRecipeManager(item)}
                                    >
                                      Recipe
                                    </button>
                                  )}
                                  {canEditItem && (
                                    <button
                                      className="btn btn-secondary"
                                      onClick={() => openItemVendorsManager(item)}
                                    >
                                      Vendors
                                    </button>
                                  )}
                                  {canEditItem && (
                                    <button
                                      className="p-2 text-gray-500 hover:text-blue-700 hover:bg-blue-50 rounded-lg"
                                      onClick={() => {
                                        void openEditItem(item);
                                      }}
                                    >
                                      <Edit className="w-4 h-4" />
                                    </button>
                                  )}
                                  {canDeleteItem && (
                                    <button
                                      className="p-2 text-gray-500 hover:text-red-700 hover:bg-red-50 rounded-lg"
                                      onClick={() => removeItem(item.id)}
                                    >
                                      <Trash2 className="w-4 h-4" />
                                    </button>
                                  )}
                                </div>
                              </td>
                            </tr>
                          ))}
                      </Fragment>
                    );
                  })}
                </tbody>
              </table>
              <TablePagination
                currentPage={itemPage}
                totalPages={itemTotalPages}
                totalItems={filteredItems.length}
                pageSize={ITEMS_PAGE_SIZE}
                itemLabel="items"
                onPageChange={setItemPage}
              />
            </div>
          )}
        </div>

        <div
          className={`card ${
            activeMenuSection === 'template' && canViewTemplate ? '' : 'hidden'
          }`}
        >
          <div className="page-head mb-4">
            <h2 className="text-lg font-semibold text-gray-900">Template menus</h2>
            {canAddTemplate && (
              <button
                type="button"
                className="btn btn-primary inline-flex items-center gap-2 w-full sm:w-auto justify-center"
                onClick={openCreateTemplate}
              >
                <ListChecks className="w-4 h-4" />
                Add
              </button>
            )}
          </div>
          <div className="relative mb-4">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              className="input pl-9"
              value={templateGlobalSearch}
              onChange={(e) => setTemplateGlobalSearch(e.target.value)}
              placeholder="Overall search in template menus..."
            />
          </div>
          {loading ? (
            <TableSkeleton rows={5} />
          ) : (
            <div className="table-shell">
              <table className="data-table">
                <thead>
                  <tr className="border-b border-gray-200">
                    <SortableHeader
                      label="Name"
                      sortKey="name"
                      sort={templateSort}
                      onSort={(key) => setTemplateSort((prev) => getNextSort(prev, key))}
                      className="text-left py-3 px-2 text-sm font-semibold text-gray-700"
                    />
                    <SortableHeader
                      label="Category"
                      sortKey="category"
                      sort={templateSort}
                      onSort={(key) => setTemplateSort((prev) => getNextSort(prev, key))}
                      className="text-left py-3 px-2 text-sm font-semibold text-gray-700"
                    />
                    <SortableHeader
                      label="Rate / Plate"
                      sortKey="ratePerPlate"
                      sort={templateSort}
                      onSort={(key) => setTemplateSort((prev) => getNextSort(prev, key))}
                      className="text-left py-3 px-2 text-sm font-semibold text-gray-700"
                    />
                    <SortableHeader
                      label="Items"
                      sortKey="itemCount"
                      sort={templateSort}
                      onSort={(key) => setTemplateSort((prev) => getNextSort(prev, key))}
                      className="text-left py-3 px-2 text-sm font-semibold text-gray-700"
                    />
                    <th className="text-right py-3 px-2 text-sm font-semibold text-gray-700">
                      Actions
                    </th>
                  </tr>
                  <tr className="table-search-row border-b border-gray-100 bg-gray-50">
                    <th className="py-2 px-2">
                      <input
                        className="input h-9"
                        placeholder="Search name"
                        value={templateColumnSearch.name}
                        onChange={(e) =>
                          setTemplateColumnSearch((prev) => ({
                            ...prev,
                            name: e.target.value,
                          }))
                        }
                      />
                    </th>
                    <th className="py-2 px-2">
                      <input
                        className="input h-9"
                        placeholder="Search category"
                        value={templateColumnSearch.category}
                        onChange={(e) =>
                          setTemplateColumnSearch((prev) => ({
                            ...prev,
                            category: e.target.value,
                          }))
                        }
                      />
                    </th>
                    <th className="py-2 px-2">
                      <input
                        className="input h-9"
                        placeholder="Search rate"
                        value={templateColumnSearch.ratePerPlate}
                        onChange={(e) =>
                          setTemplateColumnSearch((prev) => ({
                            ...prev,
                            ratePerPlate: e.target.value,
                          }))
                        }
                      />
                    </th>
                    <th className="py-2 px-2">
                      <input
                        className="input h-9"
                        placeholder="Search item count"
                        value={templateColumnSearch.itemCount}
                        onChange={(e) =>
                          setTemplateColumnSearch((prev) => ({
                            ...prev,
                            itemCount: e.target.value,
                          }))
                        }
                      />
                    </th>
                    <th className="py-2 px-2" />
                  </tr>
                </thead>
                <tbody>
                  {paginatedTemplateMenus.map((template) => (
                    <tr key={template.id} className="border-b border-gray-100">
                      <td className="py-3 px-2 text-sm text-gray-900">{template.name}</td>
                      <td className="py-3 px-2 text-sm text-gray-700">{template.category || 'General'}</td>
                      <td className="py-3 px-2 text-sm text-gray-700">
                        INR {(template.ratePerPlate || 0).toLocaleString('en-IN')}
                      </td>
                      <td className="py-3 px-2 text-sm text-gray-700">
                        {(template.itemCount ?? template.items?.length) || 0}
                      </td>
                      <td className="py-3 px-2 text-right">
                        <div className="flex items-center justify-end gap-2">
                          {canEditTemplate && (
                            <button
                              className="p-2 text-gray-500 hover:text-blue-700 hover:bg-blue-50 rounded-lg"
                              onClick={() => {
                                void openEditTemplate(template);
                              }}
                            >
                              <Edit className="w-4 h-4" />
                            </button>
                          )}
                          {canDeleteTemplate && (
                            <button
                              className="p-2 text-gray-500 hover:text-red-700 hover:bg-red-50 rounded-lg"
                              onClick={() => removeTemplateMenu(template.id)}
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              <TablePagination
                currentPage={templatePage}
                totalPages={templateTotalPages}
                totalItems={filteredTemplateMenus.length}
                pageSize={TEMPLATE_MENUS_PAGE_SIZE}
                itemLabel="template menus"
                onPageChange={setTemplatePage}
              />
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function MenuPageFallback() {
  return (
    <div className="card py-12 text-center">
      <p className="text-sm text-gray-600">Loading menu workspace...</p>
    </div>
  );
}

export default function MenuPage() {
  return (
    <Suspense fallback={<MenuPageFallback />}>
      <MenuPageContent />
    </Suspense>
  );
}
