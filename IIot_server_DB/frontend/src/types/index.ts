export interface User {
  user_id: number;
  university_id: string;
  first_name: string;
  last_name: string;
  role: string;
  created_at?: string;
  last_login_at?: string;
  is_delete?: boolean;
}

export interface DashboardStats {
  total_tags: string;
  active_tags: string;
  total_devices: string;
  scans_today: string;
}

export interface RecentScan {
  log_id: number;
  epc: string;
  equipment_name: string | null;
  tag_status: 'active' | 'pending' | 'stolen' | string;
  distance: number | null;
  time_stamp: string;
  scanned_by_device: string;
  device_type: string;
  location: string;
  latest_image: string | null;
  camera_name?: string | null;
  camera_type?: string | null;
  camera_ip?: string | null;
  ip_cam_id?: number | null;
  mcu_cam_id?: number | null;
}

export interface LogRecord {
  log_id: number;
  device_id: number;
  epc_id: number;
  distance: number | null;
  time_stamp: string;
  image_path?: string | null;
  // Enriched client-side from devices and tags list
  epc?: string;
  equipment_name?: string | null;
  tag_status?: string;
  scanned_by_device?: string;
  device_type?: string;
  location?: string;
}

export interface JoinedIPCam {
  ip_cam_id: number;
  cam_name: string;
  brand?: string | null;
  model?: string | null;
  mac?: string;
  ip: string;
  group_id?: number | null;
  group_name?: string | null;
  local?: string;
  status?: boolean;
  up_time?: number;
  last_active_at?: string | null;
  snapshot_url?: string | null;
  rtsp_url?: string | null;
  onvif_url?: string | null;
  cam_username?: string | null;
  auth?: string | null;
  keep_alive_port?: number | string | null;
  created_at?: string | null;
  by_user_name?: string | null;
  is_delete?: boolean;
}

export interface GroupInfo {
  group_id: number;
  group_name: string;
  by_user_id?: number | null;
  by_user_name?: string | null;
  created_at?: string;
  is_delete?: boolean;
  device_count?: number;
  ip_cam_count?: number;
}

export interface MqttInfo {
  mqtt_id: number;
  by_user_id?: number | null;
  by_user_name?: string | null;
  group_id: number;
  group_name?: string | null;
  topic: string;
  user_mqtt?: string | null;
  pass_mqtt?: string | null;
  created_at?: string;
  is_delete?: boolean;
}

export interface DeviceInfo {
  device_id: number;
  device_name: string;
  device_type: string;
  group_id?: number | null;
  group_name?: string | null;
  mac: string;
  ip: string;
  subnet?: string;
  gate_way?: string;
  local: string;
  hw_uptime: number;
  last_active_at: string | null;
  created_at?: string | null;
  by_user_name?: string | null;
  key_api?: string | null;
  status?: boolean;
  ip_cameras?: JoinedIPCam[];
}

export interface TagInfo {
  epc_id: number;
  epc: string;
  tag: string | null;
  status: 'active' | 'pending' | 'stolen' | string;
  by_user_id?: number | null;
  by_user_name?: string | null;
  created_at: string;
  is_delete?: boolean;
}

export type SystemLogSearchBy = 'all' | 'user' | 'target_id' | 'payload';

export interface SystemLogRecord {
  activity_id: number;
  user_id: number | null;
  action_type: string;
  target_table: string | null;
  target_id: number | null;
  payload: Record<string, unknown> | null;
  time_action: string;
  first_name?: string | null;
  last_name?: string | null;
  university_id?: string | null;
  role?: string | null;
}

export interface SystemLogPageData {
  items: SystemLogRecord[];
  total: number;
  page: number;
  limit: number;
}

export interface ApiResponse<T = any> {
  success: boolean;
  status?: number;
  data?: T;
  token?: string;
  user?: User;
  error?: string;
  message?: string;
}

export type SseConnectionStatus = 'connecting' | 'connected' | 'disconnected';

export type SseDeviceUpdateEvent =
  | {
      kind: 'device';
      device_id: number;
      status: boolean;
      last_active_at: string;
    }
  | {
      kind: 'ip_camera';
      ip_cam_id: number;
      status: boolean;
      last_active_at: string | null;
    };
