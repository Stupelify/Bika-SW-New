import axios, { AxiosError, AxiosInstance } from 'axios';

const API_URL = process.env.NEXT_PUBLIC_API_URL || '/api';

const apiClient: AxiosInstance = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

apiClient.interceptors.request.use(
  (config) => {
    if (typeof window !== 'undefined') {
      const token = localStorage.getItem('auth_token');
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }
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

    if (
      error.response?.status === 401 &&
      typeof window !== 'undefined' &&
      !isLoginRequest &&
      !isRegisterRequest
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
  register: (data: any) => apiClient.post('/auth/register', data),
  getCurrentUser: () => apiClient.get('/auth/me'),
  logout: () => apiClient.post('/auth/logout'),

  // Customers
  getCustomers: (params?: any) => apiClient.get('/customers', { params }),
  getCustomer: (id: string) => apiClient.get(`/customers/${id}`),
  createCustomer: (data: any) => apiClient.post('/customers', data),
  updateCustomer: (id: string, data: any) => apiClient.put(`/customers/${id}`, data),
  deleteCustomer: (id: string) => apiClient.delete(`/customers/${id}`),

  // Enquiries
  getEnquiries: (params?: any) => apiClient.get('/enquiries', { params }),
  getEnquiry: (id: string) => apiClient.get(`/enquiries/${id}`),
  createEnquiry: (data: any) => apiClient.post('/enquiries', data),
  updateEnquiry: (id: string, data: any) => apiClient.put(`/enquiries/${id}`, data),
  deleteEnquiry: (id: string) => apiClient.delete(`/enquiries/${id}`),

  // Bookings
  getBookings: (params?: any) => apiClient.get('/bookings', { params }),
  getBooking: (id: string) => apiClient.get(`/bookings/${id}`),
  createBooking: (data: any) => apiClient.post('/bookings', data),
  updateBooking: (id: string, data: any) => apiClient.put(`/bookings/${id}`, data),
  deleteBooking: (id: string) => apiClient.delete(`/bookings/${id}`),
  getBookingMenuPdf: (id: string, packId?: string) =>
    apiClient.get(`/bookings/${id}/menu-pdf`, {
      params: packId ? { packId } : undefined,
      responseType: 'blob',
    }),
  finalizeBooking: (id: string) => apiClient.post(`/bookings/${id}/finalize`),
  partyOverBooking: (
    id: string,
    data: { packs: Array<{ bookingPackId: string; extraPlate: number; extraRate?: number }> }
  ) => apiClient.post(`/bookings/${id}/party-over`, data),
  getBookingHistory: (id: string) => apiClient.get(`/bookings/${id}/history`),
  cancelBooking: (id: string) => apiClient.post(`/bookings/${id}/cancel`),
  addPayment: (id: string, data: any) => apiClient.post(`/bookings/${id}/payments`, data),
  checkBookingAvailability: (params?: any) =>
    apiClient.get('/bookings/check-availability', { params }),

  // Banquets
  getBanquets: (params?: any) => apiClient.get('/banquets', { params }),
  getBanquet: (id: string) => apiClient.get(`/banquets/${id}`),
  createBanquet: (data: any) => apiClient.post('/banquets', data),
  updateBanquet: (id: string, data: any) => apiClient.put(`/banquets/${id}`, data),
  deleteBanquet: (id: string) => apiClient.delete(`/banquets/${id}`),

  // Halls
  getHalls: (params?: any) => apiClient.get('/halls', { params }),
  getHall: (id: string) => apiClient.get(`/halls/${id}`),
  createHall: (data: any) => apiClient.post('/halls', data),
  updateHall: (id: string, data: any) => apiClient.put(`/halls/${id}`, data),
  deleteHall: (id: string) => apiClient.delete(`/halls/${id}`),

  // Menu
  getItemTypes: (params?: any) => apiClient.get('/item-types', { params }),
  getItemType: (id: string) => apiClient.get(`/item-types/${id}`),
  createItemType: (data: any) => apiClient.post('/item-types', data),
  updateItemType: (id: string, data: any) => apiClient.put(`/item-types/${id}`, data),
  deleteItemType: (id: string) => apiClient.delete(`/item-types/${id}`),

  getItems: (params?: any) => apiClient.get('/items', { params }),
  getItem: (id: string) => apiClient.get(`/items/${id}`),
  createItem: (data: any) => apiClient.post('/items', data),
  updateItem: (id: string, data: any) => apiClient.put(`/items/${id}`, data),
  deleteItem: (id: string) => apiClient.delete(`/items/${id}`),

  getTemplateMenus: (params?: any) => apiClient.get('/template-menus', { params }),
  getTemplateMenu: (id: string) => apiClient.get(`/template-menus/${id}`),
  createTemplateMenu: (data: any) => apiClient.post('/template-menus', data),
  updateTemplateMenu: (id: string, data: any) =>
    apiClient.put(`/template-menus/${id}`, data),
  deleteTemplateMenu: (id: string) => apiClient.delete(`/template-menus/${id}`),

  // Ingredients
  getIngredients: (params?: any) => apiClient.get('/ingredients', { params }),
  getIngredient: (id: string) => apiClient.get(`/ingredients/${id}`),
  createIngredient: (data: any) => apiClient.post('/ingredients', data),
  updateIngredient: (id: string, data: any) => apiClient.put(`/ingredients/${id}`, data),
  deleteIngredient: (id: string) => apiClient.delete(`/ingredients/${id}`),
  addIngredientVendor: (id: string, data: any) =>
    apiClient.post(`/ingredients/${id}/vendors`, data),
  updateIngredientVendor: (id: string, supplyId: string, data: any) =>
    apiClient.put(`/ingredients/${id}/vendors/${supplyId}`, data),
  deleteIngredientVendor: (id: string, supplyId: string) =>
    apiClient.delete(`/ingredients/${id}/vendors/${supplyId}`),

  // Vendors
  getVendors: (params?: any) => apiClient.get('/vendors', { params }),
  getVendor: (id: string) => apiClient.get(`/vendors/${id}`),
  createVendor: (data: any) => apiClient.post('/vendors', data),
  updateVendor: (id: string, data: any) => apiClient.put(`/vendors/${id}`, data),
  deleteVendor: (id: string) => apiClient.delete(`/vendors/${id}`),
  addVendorSupply: (id: string, data: any) => apiClient.post(`/vendors/${id}/supplies`, data),
  updateVendorSupply: (id: string, supplyId: string, data: any) =>
    apiClient.put(`/vendors/${id}/supplies/${supplyId}`, data),
  deleteVendorSupply: (id: string, supplyId: string) =>
    apiClient.delete(`/vendors/${id}/supplies/${supplyId}`),

  // Item recipes & vendor supplies
  getItemRecipes: (id: string) => apiClient.get(`/items/${id}/recipes`),
  addItemRecipe: (id: string, data: any) => apiClient.post(`/items/${id}/recipes`, data),
  updateItemRecipe: (id: string, recipeId: string, data: any) =>
    apiClient.put(`/items/${id}/recipes/${recipeId}`, data),
  deleteItemRecipe: (id: string, recipeId: string) =>
    apiClient.delete(`/items/${id}/recipes/${recipeId}`),
  getItemVendors: (id: string) => apiClient.get(`/items/${id}/vendors`),
  addItemVendor: (id: string, data: any) => apiClient.post(`/items/${id}/vendors`, data),
  updateItemVendor: (id: string, supplyId: string, data: any) =>
    apiClient.put(`/items/${id}/vendors/${supplyId}`, data),
  deleteItemVendor: (id: string, supplyId: string) =>
    apiClient.delete(`/items/${id}/vendors/${supplyId}`),

  // Users & RBAC
  getUsers: (params?: any) => apiClient.get('/users', { params }),
  getUsersSimple: () => apiClient.get('/users/simple'),
  getUser: (id: string) => apiClient.get(`/users/${id}`),
  createUser: (data: any) => apiClient.post('/users', data),
  deleteUser: (id: string) => apiClient.delete(`/users/${id}`),

  getRoles: () => apiClient.get('/roles'),
  createRole: (data: any) => apiClient.post('/roles', data),
  updateRole: (id: string, data: any) => apiClient.put(`/roles/${id}`, data),
  deleteRole: (id: string) => apiClient.delete(`/roles/${id}`),

  getPermissions: () => apiClient.get('/permissions'),
  createPermission: (data: any) => apiClient.post('/permissions', data),
  updatePermission: (id: string, data: any) => apiClient.put(`/permissions/${id}`, data),
  deletePermission: (id: string) => apiClient.delete(`/permissions/${id}`),

  updateUserRoles: (data: { userId: string; roleIds: string[] }) =>
    apiClient.post('/rbac/update-roles', data),
  updateRolePermissions: (data: { roleId: string; permissionIds: string[] }) =>
    apiClient.post('/rbac/update-permissions', data),
  getUserPermissions: (userId: string) => apiClient.get(`/rbac/user-permissions/${userId}`),

  // Analytics
  getDashboardSummary: (params?: any) => apiClient.get('/analytics/dashboard', { params }),

  // Calendar
  getGoogleCalendarEvents: (params?: any) =>
    apiClient.get('/calendar/google-events', { params }),
};

export default apiClient;
