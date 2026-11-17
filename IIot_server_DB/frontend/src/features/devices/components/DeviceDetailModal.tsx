import React, { useState, useEffect } from 'react';
import { X, Radio, Camera, Video, Edit3, Info, Wifi, Film, Copy, Check, RefreshCw } from 'lucide-react';
import { checkDeviceStatus, formatUptime } from '../../../services/utils';

export interface HardwareDetailItem {
  kind: 'device' | 'ip_cam';
  id: number;
  name: string;
  device_type: string;
  brand?: string | null;
  model?: string | null;
  group_id?: number | null;
  group_name?: string | null;
  mac?: string | null;
  ip?: string | null;
  subnet?: string | null;
  gate_way?: string | null;
  local?: string | null;
  status?: boolean;
  uptime?: number;
  last_active_at?: string | null;
  created_at?: string | null;
  by_user_name?: string | null;
  key_api?: string | null;
  rtsp_url?: string | null;
  snapshot_url?: string | null;
  onvif_url?: string | null;
  cam_username?: string | null;
  auth?: string | null;
  keep_alive_port?: number | string | null;
}

interface DeviceDetailModalProps {
  isOpen: boolean;
  item: HardwareDetailItem | null;
  onClose: () => void;
  onEdit?: () => void;
  onRefreshApiKey?: (deviceId: number) => Promise<string | null>;
}

const SectionCard: React.FC<{
  title: string;
  icon: React.ReactNode;
  children: React.ReactNode;
}> = ({ title, icon, children }) => (
  <div
    style={{
      border: '1px solid var(--line)',
      borderRadius: '10px',
      padding: '14px 16px',
      background: 'var(--surface-alt)',
    }}
  >
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: '8px',
        fontWeight: 700,
        fontSize: '13px',
        color: 'var(--ink)',
        marginBottom: '12px',
        paddingBottom: '8px',
        borderBottom: '1px solid var(--line)',
      }}
    >
      {icon}
      <span>{title}</span>
    </div>
    <div
      style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(2, minmax(0, 1fr))',
        gap: '12px 16px',
      }}
    >
      {children}
    </div>
  </div>
);

const FieldItem: React.FC<{ label: string; value: string; mono?: boolean; fullWidth?: boolean }> = ({
  label,
  value,
  mono,
  fullWidth,
}) => (
  <div style={fullWidth ? { gridColumn: '1 / -1' } : undefined}>
    <div style={{ fontSize: '11.5px', color: 'var(--muted)', marginBottom: '2px' }}>{label}</div>
    <div
      className={mono ? 'mono' : ''}
      style={{
        fontSize: '13px',
        fontWeight: 600,
        color: 'var(--ink)',
        wordBreak: 'break-all',
      }}
    >
      {value || '-'}
    </div>
  </div>
);

export const DeviceDetailModal: React.FC<DeviceDetailModalProps> = ({
  isOpen,
  item,
  onClose,
  onEdit,
  onRefreshApiKey,
}) => {
  const [displayedKey, setDisplayedKey] = useState<string>('');
  const [copied, setCopied] = useState(false);
  const [isRefreshingKey, setIsRefreshingKey] = useState(false);

  useEffect(() => {
    setDisplayedKey(item?.key_api || '');
    setCopied(false);
  }, [item]);

  if (!isOpen || !item) return null;

  const isIpCam = item.kind === 'ip_cam' || item.device_type?.toLowerCase() === 'ip_cam';
  const isMcuCam = item.device_type?.toLowerCase() === 'cam';
  const statusInfo = checkDeviceStatus({
    status: item.status,
    last_active_at: item.last_active_at ?? null,
  });

  const handleCopyKey = async () => {
    if (!displayedKey) return;
    try {
      await navigator.clipboard.writeText(displayedKey);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // ignore clipboard errors
    }
  };

  const handleRefreshKey = async () => {
    if (!onRefreshApiKey) return;
    if (!window.confirm('ต้องการสร้าง API Key ใหม่ใช่หรือไม่? อุปกรณ์จะต้องใช้ Key ใหม่ในการเชื่อมต่อ')) {
      return;
    }
    setIsRefreshingKey(true);
    try {
      const newKey = await onRefreshApiKey(item.id);
      if (newKey) {
        setDisplayedKey(newKey);
        setCopied(false);
      }
    } finally {
      setIsRefreshingKey(false);
    }
  };

  return (
    <div className="modal-backdrop active" onClick={onClose}>
      <div
        className="modal-card"
        style={{ maxWidth: '660px', width: '95%', maxHeight: '90vh', overflowY: 'auto' }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="modal-head">
          <div className="modal-title-wrap">
            {isIpCam ? (
              <Video size={22} className="text-pink" />
            ) : isMcuCam ? (
              <Camera size={22} className="text-pink" />
            ) : (
              <Radio size={22} className="text-pink" />
            )}
            <div>
              <h3>{item.name}</h3>
              <p className="modal-sub">
                {isIpCam ? `IP Camera #${item.id}` : `Device #${item.id}`} · รายละเอียดข้อมูลอุปกรณ์
              </p>
            </div>
          </div>
          <button className="btn-ghost icon-btn" onClick={onClose} aria-label="Close modal">
            <X size={18} />
          </button>
        </div>

        <div className="modal-body-form" style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
          {/* Status Strip */}
          <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: '8px' }}>
            <span className={`badge ${statusInfo.isOnline ? 'badge-active' : 'badge-stolen'}`}>
              {statusInfo.statusLabel}
            </span>
            <span className={`badge ${isIpCam || isMcuCam ? 'badge-pink' : 'badge-gray'}`}>
              {isIpCam ? 'IP-CAM' : item.device_type?.toUpperCase() || '-'}
            </span>
            {item.group_id != null && (
              <span className="badge badge-gray mono">
                Group #{item.group_id}{item.group_name ? ` (${item.group_name})` : ''}
              </span>
            )}
            <span style={{ fontSize: '12px', color: 'var(--muted)', marginLeft: 'auto' }}>
              {statusInfo.detail}
            </span>
          </div>

          {/* Section 1: General */}
          <SectionCard title="ข้อมูลทั่วไป & ตำแหน่งติดตั้ง" icon={<Info size={15} className="text-pink" />}>
            <FieldItem label={isIpCam ? 'IP Cam ID' : 'Device ID'} value={`#${item.id}`} mono />
            <FieldItem
              label="กลุ่มอุปกรณ์ (Group)"
              value={
                item.group_id != null
                  ? `Group #${item.group_id}${item.group_name ? ` (${item.group_name})` : ''}`
                  : '-'
              }
            />
            <FieldItem label="สถานที่ติดตั้ง (Location)" value={item.local || '-'} />
            <FieldItem label="ผู้บันทึก / ผู้ดูแล" value={item.by_user_name || '-'} />
            <FieldItem
              label="วันที่สร้างในระบบ"
              value={item.created_at ? new Date(item.created_at).toLocaleString('th-TH') : '-'}
            />
            <FieldItem
              label="สถานะออนไลน์จริง"
              value={item.status ? 'ออนไลน์ (Online)' : 'ออฟไลน์ (Offline)'}
            />
          </SectionCard>

          {/* Section 2: Network & Telemetry */}
          <SectionCard title="เครือข่าย & สถานะการทำงาน" icon={<Wifi size={15} className="text-pink" />}>
            <FieldItem label="IP Address" value={item.ip || '-'} mono />
            <FieldItem label="MAC Address" value={item.mac || '-'} mono />
            <FieldItem label="Uptime" value={formatUptime(item.uptime || 0)} />
            <FieldItem
              label="Active ล่าสุด"
              value={item.last_active_at ? new Date(item.last_active_at).toLocaleString('th-TH') : '-'}
            />
            {!isIpCam && (
              <>
                <FieldItem label="Subnet Mask" value={item.subnet || '-'} mono />
                <FieldItem label="Gateway" value={item.gate_way || '-'} mono />
                <div style={{ gridColumn: '1 / -1' }}>
                  <div style={{ fontSize: '11.5px', color: 'var(--muted)', marginBottom: '4px' }}>
                    API Key
                  </div>
                  <div
                    style={{
                      display: 'flex',
                      flexWrap: 'wrap',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      gap: '8px',
                      padding: '8px 10px',
                      background: '#fff',
                      border: '1px solid var(--line)',
                      borderRadius: '8px',
                    }}
                  >
                    <span
                      className="mono"
                      style={{ fontSize: '12.5px', fontWeight: 600, wordBreak: 'break-all' }}
                    >
                      {displayedKey || '-'}
                    </span>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexShrink: 0 }}>
                      <button
                        type="button"
                        className="btn btn-secondary btn-sm"
                        onClick={handleCopyKey}
                        disabled={!displayedKey}
                        title="คัดลอก API Key"
                      >
                        {copied ? <Check size={14} className="text-green" /> : <Copy size={14} />}
                        <span>{copied ? 'คัดลอกแล้ว' : 'คัดลอก'}</span>
                      </button>
                      {onRefreshApiKey && (
                        <button
                          type="button"
                          className="btn btn-primary btn-sm"
                          onClick={handleRefreshKey}
                          disabled={isRefreshingKey}
                          title="สร้าง API Key ใหม่"
                        >
                          <RefreshCw size={14} className={isRefreshingKey ? 'spin' : ''} />
                          <span>{isRefreshingKey ? 'กำลังสร้าง...' : 'รีเฟรช Key'}</span>
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              </>
            )}
          </SectionCard>

          {/* Section 3: IP Cam Stream Config */}
          {isIpCam && (
            <SectionCard title="การตั้งค่าสตรีม & กล้อง IP" icon={<Film size={15} className="text-pink" />}>
              <FieldItem label="ยี่ห้อ (Brand)" value={item.brand || '-'} />
              <FieldItem label="รุ่น (Model)" value={item.model || '-'} />
              <FieldItem label="Snapshot URL" value={item.snapshot_url || '-'} mono fullWidth />
              <FieldItem label="RTSP URL" value={item.rtsp_url || '-'} mono fullWidth />
              <FieldItem label="ONVIF URL" value={item.onvif_url || '-'} mono fullWidth />
              <FieldItem label="Cam Username" value={item.cam_username || '-'} mono />
              <FieldItem label="Auth Mode" value={item.auth || '-'} mono />
              <FieldItem
                label="Keep-Alive Port"
                value={item.keep_alive_port != null ? String(item.keep_alive_port) : '-'}
                mono
              />
            </SectionCard>
          )}
        </div>

        <div className="modal-foot" style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
          {onEdit && (
            <button type="button" className="btn btn-primary btn-sm" onClick={onEdit}>
              <Edit3 size={15} />
              <span>แก้ไขอุปกรณ์นี้</span>
            </button>
          )}
          <button type="button" className="btn btn-secondary btn-sm" onClick={onClose}>
            ปิดหน้าต่าง
          </button>
        </div>
      </div>
    </div>
  );
};
