import type { DeviceInfo, JoinedIPCam, SseDeviceUpdateEvent } from '../types';
import type { HardwareDetailItem } from '../features/devices/components/DeviceDetailModal';

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

  let detail = 'พร้อมทำงาน';
  if (device.last_active_at) {
    const lastActiveTime = new Date(device.last_active_at).getTime();
    if (!isNaN(lastActiveTime)) {
      const diffMinutes = Math.max(0, Math.round((Date.now() - lastActiveTime) / (1000 * 60)));
      detail = `พร้อมทำงาน (Active ${diffMinutes} นาทีที่แล้ว)`;
    }
  }

  return {
    isOnline: true,
    statusLabel: 'ออนไลน์ (Online)',
    badgeClass: 'badge-online',
    detail,
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

/**
 * อัปเดตสถานะอุปกรณ์และกล้อง IP Camera ที่ซ้อนอยู่ภายในจาก Event `DevicesUpdate` ของ SSE
 */
export function applyDeviceSseUpdates(
  devices: DeviceInfo[],
  updates: SseDeviceUpdateEvent[]
): DeviceInfo[] {
  const deviceMap = new Map<number, Extract<SseDeviceUpdateEvent, { kind: 'device' }>>();
  const camMap = new Map<number, Extract<SseDeviceUpdateEvent, { kind: 'ip_camera' }>>();

  for (const item of updates) {
    if (item.kind === 'device') {
      deviceMap.set(item.device_id, item);
    } else if (item.kind === 'ip_camera') {
      camMap.set(item.ip_cam_id, item);
    }
  }

  return devices.map((dev) => {
    const devPatch = deviceMap.get(dev.device_id);
    let camsChanged = false;

    const nextCams = Array.isArray(dev.ip_cameras)
      ? dev.ip_cameras.map((cam) => {
          const camPatch = camMap.get(cam.ip_cam_id);
          if (!camPatch) return cam;
          camsChanged = true;
          return {
            ...cam,
            status: camPatch.status,
            last_active_at: camPatch.last_active_at,
          };
        })
      : dev.ip_cameras;

    if (!devPatch && !camsChanged) return dev;

    return {
      ...dev,
      ...(devPatch
        ? { status: devPatch.status, last_active_at: devPatch.last_active_at }
        : {}),
      ip_cameras: nextCams,
    };
  });
}

/**
 * แปลงเวลา ISO/DB เป็นรูปแบบวันที่-เวลาภาษาไทย
 */
export function formatThaiDateTime(
  dateStr?: string | null,
  withSeconds = false
): string {
  if (!dateStr) return '-';
  const parsed = new Date(dateStr);
  if (Number.isNaN(parsed.getTime())) return '-';
  return parsed.toLocaleString('th-TH', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    ...(withSeconds ? { second: '2-digit' } : {}),
  });
}

/**
 * รันการทำงานแบบกลุ่ม (Bulk Action) พร้อมนับจำนวนสำเร็จ/ล้มเหลว
 */
export async function runBulkAction<T>(
  items: T[],
  worker: (item: T) => Promise<{ success: boolean }>
): Promise<{ successCount: number; failCount: number }> {
  let successCount = 0;
  let failCount = 0;

  await Promise.all(
    items.map(async (item) => {
      try {
        const res = await worker(item);
        if (res.success) successCount++;
        else failCount++;
      } catch {
        failCount++;
      }
    })
  );

  return { successCount, failCount };
}
