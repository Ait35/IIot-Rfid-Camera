import type { DeviceInfo, JoinedIPCam } from '../types';
import type { HardwareDetailItem } from '../components/DeviceDetailModal';

/**
 * ปรับ Path รูปภาพให้ถูกต้องตามที่ Express Static File เสิร์ฟไว้ที่ /uploads
 * ป้องกันปัญหา Path ค้างใน Database เช่น /app/public/uploadsImg/...
 */
export function normalizeImageUrl(path?: string | null): string {
  if (!path) return '';
  const trimmed = path.trim();
  if (!trimmed) return '';

  if (trimmed.includes('/app/public/uploadsImg/')) {
    return trimmed.replace('/app/public/uploadsImg/', '/uploads/');
  }
  if (trimmed.startsWith('/uploads/')) {
    return trimmed;
  }
  if (trimmed.startsWith('public/uploadsImg/')) {
    return '/' + trimmed.replace('public/uploadsImg/', 'uploads/');
  }
  if (trimmed.startsWith('uploadsImg/')) {
    return '/' + trimmed.replace('uploadsImg/', 'uploads/');
  }
  if (trimmed.startsWith('IP_cam') || trimmed.startsWith('M_cam') || trimmed.startsWith('cam_')) {
    return `/uploads/${trimmed}`;
  }
  return trimmed;
}

export interface DeviceStatusResult {
  isOnline: boolean;
  statusLabel: 'ออนไลน์ (Online)' | 'ออฟไลน์ (Offline)';
  badgeClass: string;
  detail: string;
}

/**
 * วิเคราะห์สถานะออนไลน์/ออฟไลน์ของอุปกรณ์ฮาร์ดแวร์จริง
 * คืนค่า statusLabel เพียง 2 สถานะคือ ออนไลน์ (Online) และ ออฟไลน์ (Offline)
 */
export function checkDeviceStatus(device: Pick<DeviceInfo, 'status' | 'last_active_at'>): DeviceStatusResult {
  if (!device.status) {
    return {
      isOnline: false,
      statusLabel: 'ออฟไลน์ (Offline)',
      badgeClass: 'badge-offline',
      detail: device.last_active_at
        ? `ติดต่อล่าสุด ${new Date(device.last_active_at).toLocaleDateString('th-TH')}`
        : 'ยังไม่เคยเชื่อมต่อ',
    };
  }

  if (!device.last_active_at) {
    return {
      isOnline: false,
      statusLabel: 'ออฟไลน์ (Offline)',
      badgeClass: 'badge-offline',
      detail: 'ไม่มีบันทึกเวลา Active ล่าสุด',
    };
  }

  const lastActiveTime = new Date(device.last_active_at).getTime();
  if (isNaN(lastActiveTime)) {
    return {
      isOnline: false,
      statusLabel: 'ออฟไลน์ (Offline)',
      badgeClass: 'badge-offline',
      detail: 'เวลารายงานไม่ถูกต้อง',
    };
  }

  const diffMinutes = (Date.now() - lastActiveTime) / (1000 * 60);
  if (diffMinutes > 10) {
    return {
      isOnline: false,
      statusLabel: 'ออฟไลน์ (Offline)',
      badgeClass: 'badge-offline',
      detail: `ขาดการติดต่อ (${Math.round(diffMinutes)} นาทีที่แล้ว)`,
    };
  }

  return {
    isOnline: true,
    statusLabel: 'ออนไลน์ (Online)',
    badgeClass: 'badge-online',
    detail: `พร้อมทำงาน (Active ${Math.round(diffMinutes)} นาทีที่แล้ว)`,
  };
}

/**
 * แปลงเวลา Hardware Uptime (วินาที) ให้เป็นข้อความอ่านง่าย
 */
export function formatUptime(seconds: number): string {
  if (!seconds || seconds <= 0) return '0 วินาที';
  const days = Math.floor(seconds / 86400);
  const hours = Math.floor((seconds % 86400) / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const secs = Math.floor(seconds % 60);

  if (days > 0) return `${days} วัน ${hours} ชม.`;
  if (hours > 0) return `${hours} ชม. ${minutes} นาที`;
  if (minutes > 0) return `${minutes} นาที ${secs} วินาที`;
  return `${secs} วินาที`;
}

export interface UnifiedHardwareRow extends HardwareDetailItem {
  rowKey: string;
}

export function mapDeviceToHardware(
  d: DeviceInfo,
  fallbackGroupName?: string | null
): UnifiedHardwareRow {
  return {
    rowKey: `device-${d.device_id}`,
    kind: 'device',
    id: d.device_id,
    name: d.device_name,
    device_type: d.device_type || 'RFID',
    group_id: d.group_id,
    group_name: d.group_name ?? fallbackGroupName ?? null,
    mac: d.mac || '-',
    ip: d.ip || '-',
    subnet: d.subnet,
    gate_way: d.gate_way,
    local: d.local || '-',
    uptime: d.hw_uptime || 0,
    last_active_at: d.last_active_at,
    created_at: d.created_at,
    by_user_name: d.by_user_name,
    key_api: d.key_api,
    status: d.status,
  };
}

export function mapIPCamToHardware(
  c: JoinedIPCam,
  groupId?: number | null,
  groupName?: string | null
): UnifiedHardwareRow {
  return {
    rowKey: `ip_cam-${c.ip_cam_id}`,
    kind: 'ip_cam',
    id: c.ip_cam_id,
    name: c.cam_name,
    device_type: 'ip_cam',
    brand: c.brand,
    model: c.model,
    group_id: c.group_id ?? groupId ?? null,
    group_name: c.group_name ?? groupName ?? null,
    mac: c.mac || '-',
    ip: c.ip || '-',
    local: c.local || '-',
    uptime: c.up_time || 0,
    last_active_at: c.last_active_at || null,
    created_at: c.created_at,
    by_user_name: c.by_user_name,
    rtsp_url: c.rtsp_url,
    snapshot_url: c.snapshot_url,
    onvif_url: c.onvif_url,
    cam_username: c.cam_username,
    auth: c.auth,
    keep_alive_port: c.keep_alive_port,
    status: c.status,
  };
}

export function extractGroupOptions(
  rows: Array<{ group_id?: number | null; group_name?: string | null }>
): Array<[number, string]> {
  const map = new Map<number, string>();
  for (const r of rows) {
    if (r.group_id != null && !map.has(r.group_id)) {
      map.set(r.group_id, r.group_name || '');
    }
  }
  return Array.from(map.entries()).sort((a, b) => a[0] - b[0]);
}
