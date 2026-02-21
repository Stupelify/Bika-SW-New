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
    if (error.response?.status === 401 && typeof window !== 'undefined') {
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
  cancelBooking: (id: string) => apiClient.post(`/bookings/${id}/cancel`),
  addPayment: (id: string, data: any) => apiClient.post(`/bookings/${id}/payments`, data),

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
};

export default apiClient;
