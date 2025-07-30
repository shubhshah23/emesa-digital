import axios from 'axios';

const API_BASE = import.meta.env.VITE_API_URL || '/api/';

export const login = async (username: string, password: string) => {
  const res = await axios.post(
    `${API_BASE}auth/login/`,
    { username, password }
  );
  return res.data;
};

export const logout = async () => {
  const res = await axios.post(`${API_BASE}auth/logout/`);
  return res.data;
};

export const register = async (data: {
  username: string;
  email: string;
  password: string;
  first_name?: string;
  last_name?: string;
}) => {
  const res = await axios.post(`${API_BASE}auth/register/`, data);
  return res.data;
};

export const getProfile = async () => {
  const res = await axios.get(`${API_BASE}auth/me/`);
  return res.data;
};

export const updateProfile = async (data: any) => {
  const res = await axios.patch(`${API_BASE}auth/me/`, data);
  return res.data;
};

// Orders
export const getOrders = async () => {
  const res = await axios.get(`${API_BASE}orders/`);
  return res.data;
};

export const createOrder = async (orderData: FormData) => {
  const res = await axios.post(`${API_BASE}orders/`, orderData, {
    headers: { 'Content-Type': 'multipart/form-data' }
  });
  return res.data;
};

export const updateOrder = async (id: number, data: any) => {
  const res = await axios.patch(`${API_BASE}orders/${id}/`, data);
  return res.data;
};

export const deleteOrder = async (id: number) => {
  await axios.delete(`${API_BASE}orders/${id}/`);
};

// Order Actions
export const approveOrder = async (orderId: number, data: {
  machine_id?: number;
  expected_completion_date?: string;
  price_estimate?: number;
  admin_notes?: string;
}) => {
  const res = await axios.post(`${API_BASE}orders/${orderId}/approve_order/`, data);
  return res.data;
};

export const rejectOrder = async (orderId: number, rejectionReason: string) => {
  const res = await axios.post(`${API_BASE}orders/${orderId}/reject_order/`, {
    rejection_reason: rejectionReason
  });
  return res.data;
};

export const startProduction = async (orderId: number) => {
  const res = await axios.post(`${API_BASE}orders/${orderId}/start_production/`);
  return res.data;
};

export const completeOrder = async (orderId: number, actualCost?: number) => {
  const res = await axios.post(`${API_BASE}orders/${orderId}/complete_order/`, {
    actual_cost: actualCost
  });
  return res.data;
};

export const assignMachine = async (orderId: number, machineId: number) => {
  const res = await axios.post(`${API_BASE}orders/${orderId}/assign_machine/`, {
    machine_id: machineId
  });
  return res.data;
};

export const confirmOrderAtPrice = async (orderId: number) => {
  const res = await axios.post(`${API_BASE}orders/${orderId}/confirm_price/`);
  return res.data;
};

// Suppliers and Machines
export const getSuppliers = async () => {
  const res = await axios.get(`${API_BASE}suppliers/`);
  return res.data;
};

export const getMachines = async () => {
  const res = await axios.get(`${API_BASE}machines/`);
  return res.data;
};

export const getAvailableMachines = async () => {
  const res = await axios.get(`${API_BASE}machines/available/`);
  return res.data;
};

export const createSupplier = async (data: {
  name: string;
  contact_info?: string;
  email?: string;
  phone?: string;
  address?: string;
}) => {
  const res = await axios.post(`${API_BASE}suppliers/`, data);
  return res.data;
};

export const createMachine = async (formData: FormData) => {
  const res = await axios.post(`${API_BASE}machines/`, formData);
  return res.data;
};

export const updateSupplier = async (id: number, data: any) => {
  const res = await axios.patch(`${API_BASE}suppliers/${id}/`, data);
  return res.data;
};

export const deleteSupplier = async (id: number) => {
  await axios.delete(`${API_BASE}suppliers/${id}/`);
};

export const updateMachine = async (id: number, data: any) => {
  const res = await axios.patch(`${API_BASE}machines/${id}/`, data);
  return res.data;
};

export const deleteMachine = async (id: number) => {
  await axios.delete(`${API_BASE}machines/${id}/`);
};

// JWT login
export const jwtLogin = async (email: string, password: string) => {
  const res = await axios.post(`${API_BASE}auth/jwt/create/`, {
    email,
    password,
  });
  return res.data; // { access, refresh }
};

export const jwtRefresh = async (refresh: string) => {
  const res = await axios.post(`${API_BASE}auth/jwt/refresh/`, {
    refresh,
  });
  return res.data; // { access }
};

// Set up axios interceptor to add JWT token to all requests
axios.interceptors.request.use((config) => {
  const token = localStorage.getItem('access_token');
  if (token) {
    if (config.headers) {
      config.headers['Authorization'] = `Bearer ${token}`;
    }
  }
  return config;
});

// Axios response interceptor for token refresh
axios.interceptors.response.use(
  response => response,
  async error => {
    const originalRequest = error.config;
    if (error.response && error.response.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;
      const refresh = localStorage.getItem('refresh_token');
      if (refresh) {
        try {
          const { access } = await jwtRefresh(refresh);
          localStorage.setItem('access_token', access);
          originalRequest.headers['Authorization'] = `Bearer ${access}`;
          return axios(originalRequest);
        } catch (refreshError) {
          // Refresh failed, log out
          localStorage.removeItem('access_token');
          localStorage.removeItem('refresh_token');
          window.location.reload();
        }
      } else {
        // No refresh token, log out
        localStorage.removeItem('access_token');
        localStorage.removeItem('refresh_token');
        window.location.reload();
      }
    }
    return Promise.reject(error);
  }
);

export const getOrderMessages = async (orderId: number) => {
  const res = await axios.get(`${API_BASE}orders/${orderId}/messages/`);
  return res.data;
};

export const sendOrderMessage = async (orderId: number, message: string) => {
  const res = await axios.post(`${API_BASE}orders/${orderId}/messages/`, { message });
  return res.data;
};

export const sendCounterOffer = async (orderId: number, amount: number, message?: string) => {
  const res = await axios.post(`${API_BASE}orders/${orderId}/send_counter_offer/`, { amount, message });
  return res.data;
};

export const acceptCounterOffer = async (orderId: number) => {
  const res = await axios.post(`${API_BASE}orders/${orderId}/accept_counter_offer/`);
  return res.data;
};

export const confirmOrderPayment = async (orderId: number) => {
  const res = await axios.post(`${API_BASE}orders/${orderId}/confirm_payment/`);
  return res.data;
};

// Replace getClientProfile to fetch the client profile for the current user
export const getClientProfile = async () => {
  const res = await axios.get(`${API_BASE}clients/me/`);
  return res.data;
}; 