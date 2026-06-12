import axios from 'axios';
import type { AxiosError, AxiosInstance } from 'axios';
import { isAuthHydrationComplete } from './authSession';
import type {
  ApiEnvelope,
  AuditLog,
  AuthUser,
  Banquet,
  BanquetInput,
  Booking,
  BookingInput,
  BookingPayment,
  BookingPaymentInput,
  BookingsListData,
  Customer,
  CustomerInput,
  CustomersListData,
  EnquiriesListData,
  Enquiry,
  EnquiryInput,
  Hall,
  HallInput,
  Ingredient,
  IngredientInput,
  Item,
  ItemInput,
  ItemRecipe,
  ItemRecipeInput,
  ItemType,
  ItemTypeInput,
  PaginationMeta,
  Permission,
  Role,
  TemplateMenu,
  TemplateMenuInput,
  User,
  Vendor,
  VendorInput,
  VendorSupply,
  VendorSupplyInput,
} from '@/types/api';

/** Query-string params (page/limit/search/filters). Values are serialized by axios. */
export type QueryParams = Record<string, string | number | boolean | undefined>;

const API_URL = process.env.NEXT_PUBLIC_API_URL || '/api';

const apiClient: AxiosInstance = axios.create({
  baseURL: API_URL,
  timeout: 30_000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// React Query is the only client-side cache. Requests always reach the
// network; freshness and invalidation live in lib/query (queryKeys + staleTime).
apiClient.interceptors.request.use(
  (config) => {
    if (typeof window !== 'undefined') {
      const token = localStorage.getItem('auth_token');
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }
    }

    if (config.method?.toLowerCase() === 'get') {
      // Bypass the browser's HTTP cache so mutations immediately reflect in
      // subsequent fetches (the server sets max-age=120 on GET routes).
      config.headers['Cache-Control'] = 'no-cache';
      config.headers['Pragma'] = 'no-cache';
    }

    return config;
  },
  (error) => Promise.reject(error)
);

apiClient.interceptors.response.use(
  (response) => response,
  (error: AxiosError<any>) => {
    const requestUrl = String(error.config?.url || '');
    const isLoginRequest =
      requestUrl.includes('/auth/login') || requestUrl.endsWith('auth/login');
    const isRegisterRequest =
      requestUrl.includes('/auth/register') || requestUrl.endsWith('auth/register');
    const isMeRequest =
      requestUrl.includes('/auth/me') || requestUrl.endsWith('auth/me');

    if (
      error.response?.status === 401 &&
      typeof window !== 'undefined' &&
      isAuthHydrationComplete() &&
      !isLoginRequest &&
      !isRegisterRequest &&
      !isMeRequest
    ) {
      localStorage.removeItem('auth_token');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

export const api = {
  // Auth
  login: (email: string, password: string) =>
    apiClient.post('/auth/login', { email, password }),
  register: (data: { email: string; password: string; name?: string }) =>
    apiClient.post('/auth/register', data),
  getCurrentUser: () => apiClient.get<ApiEnvelope<{ user: AuthUser }>>('/auth/me'),
  getSseToken: () => apiClient.get<{ token: string }>('/auth/sse-token'),
  logout: () => apiClient.post('/auth/logout'),
  changePassword: (data: { currentPassword: string; newPassword: string }) =>
    apiClient.post('/auth/change-password', data),

  // Customers
  getCustomers: (params?: QueryParams) =>
    apiClient.get<ApiEnvelope<CustomersListData>>('/customers', { params }),
  getCustomer: (id: string) =>
    apiClient.get<ApiEnvelope<{ customer: Customer }>>(`/customers/${id}`),
  createCustomer: (data: CustomerInput) => apiClient.post('/customers', data),
  updateCustomer: (id: string, data: CustomerInput) =>
    apiClient.put(`/customers/${id}`, data),
  deleteCustomer: (id: string) => apiClient.delete(`/customers/${id}`),

  // Enquiries
  getEnquiries: (params?: QueryParams) =>
    apiClient.get<ApiEnvelope<EnquiriesListData>>('/enquiries', { params }),
  getEnquiry: (id: string) =>
    apiClient.get<ApiEnvelope<{ enquiry: Enquiry }>>(`/enquiries/${id}`),
  createEnquiry: (data: EnquiryInput) => apiClient.post('/enquiries', data),
  updateEnquiry: (id: string, data: EnquiryInput) =>
    apiClient.put(`/enquiries/${id}`, data),
  deleteEnquiry: (id: string) => apiClient.delete(`/enquiries/${id}`),

  // Bookings
  getBookings: (params?: QueryParams) =>
    apiClient.get<ApiEnvelope<BookingsListData>>('/bookings', { params }),
  getBooking: (id: string) =>
    apiClient.get<ApiEnvelope<{ booking: Booking }>>(`/bookings/${id}`),
  createBooking: (data: BookingInput) => apiClient.post('/bookings', data),
  updateBooking: (id: string, data: BookingInput) =>
    apiClient.put(`/bookings/${id}`, data),
  deleteBooking: (id: string) => apiClient.delete(`/bookings/${id}`),
  getBookingMenuPdf: (id: string, packId?: string) =>
    apiClient.get(`/bookings/${id}/menu-pdf`, {
      params: packId ? { packId } : undefined,
      responseType: 'blob',
    }),
  getBookingPdf: (id: string) =>
    apiClient.get(`/bookings/${id}/booking-pdf`, { responseType: 'blob' }),
  finalizeBooking: (id: string) => apiClient.post(`/bookings/${id}/finalize`),
  partyOverBooking: (
    id: string,
    data: {
      packs: Array<{ bookingPackId: string; extraPlate: number; extraRate?: number }>;
      settlementDiscountPercent?: number;
      settlementDiscountAmount?: number;
      settlementTotalAmount?: number;
    }
  ) => apiClient.post(`/bookings/${id}/party-over`, data),
  getBookingHistory: (id: string) => apiClient.get(`/bookings/${id}/history`),
  cancelBooking: (id: string) => apiClient.post(`/bookings/${id}/cancel`),
  addPayment: (id: string, data: BookingPaymentInput) =>
    apiClient.post<ApiEnvelope<{ payment: BookingPayment }>>(
      `/bookings/${id}/payments`,
      data
    ),
  updatePayment: (id: string, paymentId: string, data: BookingPaymentInput) =>
    apiClient.patch<ApiEnvelope<{ payment: BookingPayment }>>(
      `/bookings/${id}/payments/${paymentId}`,
      data
    ),
  checkBookingAvailability: (params?: QueryParams) =>
    apiClient.get('/bookings/check-availability', { params }),

  // Banquets
  getBanquets: (params?: QueryParams) =>
    apiClient.get<ApiEnvelope<{ banquets: Banquet[]; pagination?: PaginationMeta }>>(
      '/banquets',
      { params }
    ),
  getBanquet: (id: string) =>
    apiClient.get<ApiEnvelope<{ banquet: Banquet }>>(`/banquets/${id}`),
  createBanquet: (data: BanquetInput) => apiClient.post('/banquets', data),
  updateBanquet: (id: string, data: BanquetInput) =>
    apiClient.put(`/banquets/${id}`, data),
  deleteBanquet: (id: string) => apiClient.delete(`/banquets/${id}`),

  // Halls
  getHalls: (params?: QueryParams) =>
    apiClient.get<ApiEnvelope<{ halls: Hall[]; pagination?: PaginationMeta }>>('/halls', {
      params,
    }),
  getHall: (id: string) => apiClient.get<ApiEnvelope<{ hall: Hall }>>(`/halls/${id}`),
  createHall: (data: HallInput) => apiClient.post('/halls', data),
  updateHall: (id: string, data: HallInput) => apiClient.put(`/halls/${id}`, data),
  deleteHall: (id: string) => apiClient.delete(`/halls/${id}`),

  // Menu
  getItemTypes: (params?: QueryParams) =>
    apiClient.get<ApiEnvelope<{ itemTypes: ItemType[]; pagination?: PaginationMeta }>>(
      '/item-types',
      { params }
    ),
  getItemType: (id: string) =>
    apiClient.get<ApiEnvelope<{ itemType: ItemType }>>(`/item-types/${id}`),
  createItemType: (data: ItemTypeInput) => apiClient.post('/item-types', data),
  updateItemType: (id: string, data: ItemTypeInput) =>
    apiClient.put(`/item-types/${id}`, data),
  deleteItemType: (id: string) => apiClient.delete(`/item-types/${id}`),

  getItems: (params?: QueryParams) =>
    apiClient.get<ApiEnvelope<{ items: Item[]; pagination?: PaginationMeta }>>('/items', {
      params,
    }),
  getItem: (id: string) => apiClient.get<ApiEnvelope<{ item: Item }>>(`/items/${id}`),
  createItem: (data: ItemInput) => apiClient.post('/items', data),
  updateItem: (id: string, data: ItemInput) => apiClient.put(`/items/${id}`, data),
  deleteItem: (id: string) => apiClient.delete(`/items/${id}`),

  getTemplateMenus: (params?: QueryParams) =>
    apiClient.get<
      ApiEnvelope<{ templateMenus: TemplateMenu[]; pagination?: PaginationMeta }>
    >('/template-menus', { params }),
  getTemplateMenu: (id: string) =>
    apiClient.get<ApiEnvelope<{ templateMenu: TemplateMenu }>>(`/template-menus/${id}`),
  createTemplateMenu: (data: TemplateMenuInput) => apiClient.post('/template-menus', data),
  updateTemplateMenu: (id: string, data: TemplateMenuInput) =>
    apiClient.put(`/template-menus/${id}`, data),
  deleteTemplateMenu: (id: string) => apiClient.delete(`/template-menus/${id}`),

  // Ingredients
  getIngredients: (params?: QueryParams) =>
    apiClient.get<
      ApiEnvelope<{ ingredients: Ingredient[]; pagination?: PaginationMeta }>
    >('/ingredients', { params }),
  getIngredient: (id: string) =>
    apiClient.get<ApiEnvelope<{ ingredient: Ingredient }>>(`/ingredients/${id}`),
  createIngredient: (data: IngredientInput) => apiClient.post('/ingredients', data),
  updateIngredient: (id: string, data: IngredientInput) =>
    apiClient.put(`/ingredients/${id}`, data),
  deleteIngredient: (id: string) => apiClient.delete(`/ingredients/${id}`),
  addIngredientVendor: (id: string, data: VendorSupplyInput) =>
    apiClient.post(`/ingredients/${id}/vendors`, data),
  updateIngredientVendor: (id: string, supplyId: string, data: VendorSupplyInput) =>
    apiClient.put(`/ingredients/${id}/vendors/${supplyId}`, data),
  deleteIngredientVendor: (id: string, supplyId: string) =>
    apiClient.delete(`/ingredients/${id}/vendors/${supplyId}`),

  // Vendors
  getVendors: (params?: QueryParams) =>
    apiClient.get<ApiEnvelope<{ vendors: Vendor[]; pagination?: PaginationMeta }>>(
      '/vendors',
      { params }
    ),
  getVendor: (id: string) =>
    apiClient.get<ApiEnvelope<{ vendor: Vendor }>>(`/vendors/${id}`),
  createVendor: (data: VendorInput) => apiClient.post('/vendors', data),
  updateVendor: (id: string, data: VendorInput) => apiClient.put(`/vendors/${id}`, data),
  deleteVendor: (id: string) => apiClient.delete(`/vendors/${id}`),
  addVendorSupply: (id: string, data: VendorSupplyInput) =>
    apiClient.post(`/vendors/${id}/supplies`, data),
  updateVendorSupply: (id: string, supplyId: string, data: VendorSupplyInput) =>
    apiClient.put(`/vendors/${id}/supplies/${supplyId}`, data),
  deleteVendorSupply: (id: string, supplyId: string) =>
    apiClient.delete(`/vendors/${id}/supplies/${supplyId}`),

  // Item recipes & vendor supplies
  getItemRecipes: (id: string) =>
    apiClient.get<ApiEnvelope<{ recipes: ItemRecipe[] }>>(`/items/${id}/recipes`),
  addItemRecipe: (id: string, data: ItemRecipeInput) =>
    apiClient.post(`/items/${id}/recipes`, data),
  updateItemRecipe: (id: string, recipeId: string, data: ItemRecipeInput) =>
    apiClient.put(`/items/${id}/recipes/${recipeId}`, data),
  deleteItemRecipe: (id: string, recipeId: string) =>
    apiClient.delete(`/items/${id}/recipes/${recipeId}`),
  getItemVendors: (id: string) =>
    apiClient.get<ApiEnvelope<{ supplies: VendorSupply[] }>>(`/items/${id}/vendors`),
  addItemVendor: (id: string, data: VendorSupplyInput) =>
    apiClient.post(`/items/${id}/vendors`, data),
  updateItemVendor: (id: string, supplyId: string, data: VendorSupplyInput) =>
    apiClient.put(`/items/${id}/vendors/${supplyId}`, data),
  deleteItemVendor: (id: string, supplyId: string) =>
    apiClient.delete(`/items/${id}/vendors/${supplyId}`),

  // Users & RBAC
  getUsers: (params?: QueryParams) =>
    apiClient.get<ApiEnvelope<{ users: User[]; pagination?: PaginationMeta }>>('/users', {
      params,
    }),
  getUsersSimple: () => apiClient.get('/users/simple'),
  getUser: (id: string) => apiClient.get<ApiEnvelope<{ user: User }>>(`/users/${id}`),
  createUser: (data: { email: string; password: string; name?: string; roleId?: string }) =>
    apiClient.post('/users', data),
  deleteUser: (id: string) => apiClient.delete(`/users/${id}`),
  resetUserPassword: (id: string, data: { newPassword: string }) =>
    apiClient.post(`/users/${id}/reset-password`, data),
  updateUser: (id: string, data: { name?: string; email?: string }) =>
    apiClient.put(`/users/${id}`, data),
  setUserStatus: (id: string, data: { isActive: boolean; reason?: string }) =>
    apiClient.patch(`/users/${id}/status`, data),
  setUserAllVenues: (id: string, hasAllVenueAccess: boolean) =>
    apiClient.put(`/users/${id}/all-venues`, { hasAllVenueAccess }),
  getUserDirectPermissions: (id: string) =>
    apiClient.get(`/users/${id}/direct-permissions`),
  setUserDirectPermissions: (
    id: string,
    data: { grants: string[]; denies: string[] }
  ) => apiClient.put(`/users/${id}/direct-permissions`, data),
  getUserBanquets: (id: string) => apiClient.get(`/users/${id}/banquets`),
  setUserBanquets: (id: string, banquetIds: string[]) =>
    apiClient.put(`/users/${id}/banquets`, { banquetIds }),

  getRoles: () => apiClient.get<ApiEnvelope<{ roles: Role[] }>>('/roles'),
  createRole: (data: { name: string; description?: string }) =>
    apiClient.post('/roles', data),
  updateRole: (id: string, data: { name?: string; description?: string }) =>
    apiClient.put(`/roles/${id}`, data),
  deleteRole: (id: string) => apiClient.delete(`/roles/${id}`),

  getPermissions: () =>
    apiClient.get<ApiEnvelope<{ permissions: Permission[] }>>('/permissions'),
  createPermission: (data: { name: string; description?: string }) =>
    apiClient.post('/permissions', data),
  updatePermission: (id: string, data: { name?: string; description?: string }) =>
    apiClient.put(`/permissions/${id}`, data),
  deletePermission: (id: string) => apiClient.delete(`/permissions/${id}`),

  updateUserRoles: (data: { userId: string; roleIds: string[] }) =>
    apiClient.post('/rbac/update-roles', data),
  updateRolePermissions: (data: { roleId: string; permissionIds: string[] }) =>
    apiClient.post('/rbac/update-permissions', data),
  getUserPermissions: (userId: string) => apiClient.get(`/rbac/user-permissions/${userId}`),

  // Analytics
  getDashboardSummary: (params?: QueryParams) =>
    apiClient.get('/analytics/dashboard', { params }),

  // Calendar
  getGoogleCalendarEvents: (params?: QueryParams) =>
    apiClient.get('/calendar/google-events', { params }),

  // Audit Logs
  getAuditLogs: (params?: QueryParams) =>
    apiClient.get<ApiEnvelope<{ logs: AuditLog[]; pagination?: PaginationMeta }>>(
      '/audit-logs',
      { params }
    ),
};

/** Fetches every customer page (for dropdowns / typeahead). */
export async function fetchAllCustomers(params?: { search?: string }): Promise<Customer[]> {
  const rows: Customer[] = [];
  const limit = 500;
  let page = 1;
  let totalPages = 1;

  while (page <= totalPages) {
    const response = await api.getCustomers({ page, limit, ...params });
    const data = response.data?.data;
    rows.push(...(data?.customers || []));
    totalPages = Math.max(1, Number(data?.pagination?.totalPages || 1));
    page += 1;
    if (page > 100) break;
  }

  return rows;
}

export default apiClient;
