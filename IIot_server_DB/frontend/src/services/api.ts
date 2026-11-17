import type { ApiResponse, User, DashboardStats, RecentScan, DeviceInfo, JoinedIPCam, GroupInfo, MqttInfo, TagInfo, LogRecord, SystemLogPageData, SystemLogSearchBy } from '../types';

const TOKEN_KEY = 'iiot_auth_token';
const USER_KEY = 'iiot_user_profile';

let onUnauthorizedCallback: (() => void) | null = null;

export const setOnUnauthorized = (cb: () => void) => {
  onUnauthorizedCallback = cb;
};

export const getToken = (): string | null => {
  return localStorage.getItem(TOKEN_KEY);
};

export const setToken = (token: string | null) => {
  if (token) {
    localStorage.setItem(TOKEN_KEY, token);
  } else {
    localStorage.removeItem(TOKEN_KEY);
  }
};

export const getUser = (): User | null => {
  const data = localStorage.getItem(USER_KEY);
  if (!data) return null;
  try {
    return JSON.parse(data);
  } catch {
    return null;
  }
};

export const setUser = (user: User | null) => {
  if (user) {
    localStorage.setItem(USER_KEY, JSON.stringify(user));
  } else {
    localStorage.removeItem(USER_KEY);
  }
};

export async function request<T = any>(endpoint: string, options: RequestInit = {}): Promise<ApiResponse<T>> {
  const token = getToken();
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options.headers as Record<string, string> || {}),
  };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  try {
    const res = await fetch(endpoint, {
      ...options,
      headers,
    });

    if (res.status === 401) {
      setToken(null);
      setUser(null);
      if (onUnauthorizedCallback) {
        onUnauthorizedCallback();
      }
      return { success: false, status: 401, error: 'เซสชันหมดอายุ กรุณาเข้าสู่ระบบใหม่' };
    }

    const data = await res.json();
    return data;
  } catch (error: any) {
    console.error(`API Error on ${endpoint}:`, error);
    return {
      success: false,
      status: 500,
      error: error.message || 'ไม่สามารถเชื่อมต่อ Server ได้',
    };
  }
}

export const api = {
  // Auth
  async login(university_id: string, password: string): Promise<ApiResponse<User & { token: string }>> {
    return request('/iiot/login', {
      method: 'POST',
      body: JSON.stringify({ university_id, password }),
    });
  },

  async signin(university_id: string, password: string): Promise<ApiResponse<User & { token: string }>> {
    return request('/iiot/register-account', {
      method: 'POST',
      body: JSON.stringify({ university_id, password }),
    });
  },

  async logout(): Promise<ApiResponse> {
    const res = await request('/iiot/logout', { method: 'POST' });
    setToken(null);
    setUser(null);
    return res;
  },

  async getUsers(
    page = 1,
    limit = 100,
    isDelete = false,
    role?: string,
    search?: string,
    startDate?: string,
    endDate?: string
  ): Promise<ApiResponse<User[]>> {
    const params = new URLSearchParams({
      page: String(page),
      limit: String(limit),
      is_delete: String(isDelete),
    });
    if (role && role !== 'all') {
      params.set('role', role);
    }
    if (search && search.trim()) {
      params.set('search', search.trim());
    }
    if (startDate) {
      params.set('start_date', startDate);
    }
    if (endDate) {
      params.set('end_date', endDate);
    }
    return request<User[]>(`/iiot/get/users?${params.toString()}`);
  },

  async createAccount(payload: {
    university_id: string;
    password: string;
    role?: 'admin' | 'dev' | 'teacher';
  }): Promise<ApiResponse<User & { token: string }>> {
    return request('/iiot/register-account', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  },

  async patchAccount(payload: {
    traget_id: number;
    password?: string;
    role?: 'admin' | 'dev' | 'teacher';
    is_delete?: boolean;
  }): Promise<ApiResponse<User>> {
    return request<User>('/iiot/patch/account', {
      method: 'PATCH',
      body: JSON.stringify(payload),
    });
  },

  // Dashboard & Telemetry
  async getDashboard(): Promise<ApiResponse<{ stats: DashboardStats; recentScans: RecentScan[] }>> {
    return request('/iiot/get/dashboard');
  },

  // Devices & Tags
  async getDevices(page = 1, limit = 50, isDelete = false): Promise<ApiResponse<DeviceInfo[]>> {
    return request(`/iiot/get/device?page=${page}&limit=${limit}&is_delete=${isDelete}`);
  },

  async createDevice(payload: {
    device_name: string;
    mac: string;
    local: string;
    group_id: number;
    type: 'RFID' | 'CAM';
    ip?: string;
    subnet?: string;
    gate_way?: string;
  }): Promise<ApiResponse<DeviceInfo>> {
    return request('/iiot/post/device', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  },

  async patchDevice(payload: {
    device_id: number;
    device_name?: string;
    device_type?: 'RFID' | 'CAM';
    group_id?: number;
    ip?: string;
    local?: string;
    status?: boolean;
    is_delete?: boolean;
    refresh_key_api?: boolean;
  }): Promise<ApiResponse<DeviceInfo>> {
    return request('/iiot/patch/device', {
      method: 'PATCH',
      body: JSON.stringify(payload),
    });
  },

  async getIPCams(page = 1, limit = 50, isDelete = false): Promise<ApiResponse<JoinedIPCam[]>> {
    return request(`/iiot/get/ip_cam?page=${page}&limit=${limit}&is_delete=${isDelete}`);
  },

  async createIPCam(payload: Record<string, any>): Promise<ApiResponse<JoinedIPCam>> {
    return request('/iiot/post/ip_cam', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  },

  async patchIPCam(payload: Record<string, any>): Promise<ApiResponse<JoinedIPCam>> {
    return request('/iiot/patch/ip_cam', {
      method: 'PATCH',
      body: JSON.stringify(payload),
    });
  },

  async probeIPCam(payload: {
    ip?: string;
    ONVIF_url?: string;
    cam_username?: string;
    cam_password?: string;
    ip_cam_id?: number;
  }): Promise<ApiResponse<any>> {
    return request('/iiot/post/ip_cam/probe', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  },

  async getGroups(page = 1, limit = 100, isDelete = false): Promise<ApiResponse<GroupInfo[]>> {
    return request(`/iiot/get/group?page=${page}&limit=${limit}&is_delete=${isDelete}`);
  },

  async createGroup(payload: { group_name: string }): Promise<ApiResponse<GroupInfo>> {
    return request('/iiot/post/group', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  },

  async patchGroup(payload: {
    group_id: number;
    group_name?: string;
    is_delete?: boolean;
  }): Promise<ApiResponse<GroupInfo>> {
    return request('/iiot/patch/group', {
      method: 'PATCH',
      body: JSON.stringify(payload),
    });
  },

  async getMqtt(page = 1, limit = 100, isDelete = false): Promise<ApiResponse<MqttInfo[]>> {
    return request(`/iiot/get/mqtt?page=${page}&limit=${limit}&is_delete=${isDelete}`);
  },

  async getSystemLogs(
    page = 1,
    limit = 20,
    filters?: {
      action_type?: string;
      target_table?: string;
      search?: string;
      search_by?: SystemLogSearchBy;
      start_date?: string;
      end_date?: string;
    }
  ): Promise<ApiResponse<SystemLogPageData>> {
    const params = new URLSearchParams({
      page: String(page),
      limit: String(limit),
    });
    if (filters?.action_type) params.set('action_type', filters.action_type);
    if (filters?.target_table) params.set('target_table', filters.target_table);
    if (filters?.search) params.set('search', filters.search);
    if (filters?.search_by && filters.search_by !== 'all') params.set('search_by', filters.search_by);
    if (filters?.start_date) params.set('start_date', filters.start_date);
    if (filters?.end_date) params.set('end_date', filters.end_date);
    return request(`/iiot/get/system-log?${params.toString()}`);
  },

  async createMqtt(payload: {
    topic: string;
    group_id: number;
    user_mqtt?: string;
    pass_mqtt?: string;
  }): Promise<ApiResponse<MqttInfo>> {
    return request('/iiot/post/mqtt', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  },

  async patchMqtt(payload: {
    mqtt_id: number;
    topic?: string;
    group_id?: number;
    user_mqtt?: string;
    pass_mqtt?: string;
    is_delete?: boolean;
  }): Promise<ApiResponse<MqttInfo>> {
    return request('/iiot/patch/mqtt', {
      method: 'PATCH',
      body: JSON.stringify(payload),
    });
  },

  async getTags(
    page = 1,
    limit = 50,
    status?: string,
    search?: string
  ): Promise<ApiResponse<TagInfo[]>> {
    const params = new URLSearchParams({
      page: String(page),
      limit: String(limit),
    });
    if (status && status !== 'all') {
      params.set('status', status);
    }
    if (search && search.trim()) {
      params.set('search', search.trim());
    }
    return request(`/iiot/get/tag?${params.toString()}`);
  },

  async patchTag(payload: { epc_id: number; tag?: string; status?: 'active' | 'pending' | 'stolen'; is_delete?: boolean }): Promise<ApiResponse<TagInfo>> {
    return request<TagInfo>('/iiot/patch/tag', {
      method: 'PATCH',
      body: JSON.stringify(payload),
    });
  },

  // Scan History Logs (Dedicated log endpoint)
  async getLogs(
    page = 1,
    limit = 50,
    filters?: {
      device_id?: number;
      search?: string;
      start_date?: string;
      end_date?: string;
    }
  ): Promise<ApiResponse<LogRecord[]>> {
    const params = new URLSearchParams({
      page: String(page),
      limit: String(limit),
    });
    if (filters?.device_id) params.set('device_id', String(filters.device_id));
    if (filters?.search?.trim()) params.set('search', filters.search.trim());
    if (filters?.start_date) params.set('start_date', filters.start_date);
    if (filters?.end_date) params.set('end_date', filters.end_date);
    return request<LogRecord[]>(`/iiot/get/log?${params.toString()}`);
  },
};
