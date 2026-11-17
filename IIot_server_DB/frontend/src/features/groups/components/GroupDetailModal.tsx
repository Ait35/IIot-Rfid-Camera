import React, { useMemo } from 'react';
import { X, Layers, Edit3, Info, Cpu, Video } from 'lucide-react';
import type { GroupInfo, DeviceInfo } from '../../../types';
import { checkDeviceStatus } from '../../../services/utils';
import { DeviceTypeBadge } from '../../devices/components/DeviceTypeBadge';

interface GroupDetailModalProps {
  isOpen: boolean;
  group: GroupInfo | null;
  devices: DeviceInfo[];
  onClose: () => void;
  onEdit?: () => void;
}

export const GroupDetailModal: React.FC<GroupDetailModalProps> = ({
  isOpen,
  group,
  devices,
  onClose,
  onEdit,
}) => {
  const groupHardware = useMemo(() => {
    if (!group) return { mcus: [], ipCams: [] };
    const mcus = devices.filter((d) => d.group_id === group.group_id);
    const seenCams = new Set<number>();
    const ipCams: Array<{
      ip_cam_id: number;
      cam_name: string;
      ip: string;
      local: string;
      status: boolean;
      last_active_at?: string | null;
    }> = [];

    for (const d of devices) {
      if (Array.isArray(d.ip_cameras)) {
        for (const cam of d.ip_cameras) {
          if (cam.group_id === group.group_id && !seenCams.has(cam.ip_cam_id)) {
            seenCams.add(cam.ip_cam_id);
            ipCams.push({
              ip_cam_id: cam.ip_cam_id,
              cam_name: cam.cam_name,
              ip: cam.ip || '',
              local: cam.local || '',
              status: Boolean(cam.status),
              last_active_at: cam.last_active_at,
            });
          }
        }
      }
    }
    return { mcus, ipCams };
  }, [group, devices]);

  if (!isOpen || !group) return null;

  const deviceCount = group.device_count ?? groupHardware.mcus.length;
  const ipCamCount = group.ip_cam_count ?? groupHardware.ipCams.length;

  return (
    <div className="modal-backdrop active" onClick={onClose}>
      <div
        className="modal-card"
        style={{ maxWidth: '720px', width: '95%', maxHeight: '90vh', overflowY: 'auto' }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="modal-head">
          <div className="modal-title-wrap">
            <Layers size={19} className="text-pink" />
            <div>
              <h3>{group.group_name}</h3>
              <p className="modal-sub">
                Group ID #{group.group_id} · อุปกรณ์ทั้งหมด {deviceCount + ipCamCount} รายการ
              </p>
            </div>
          </div>
          <button className="btn-ghost icon-btn" onClick={onClose} aria-label="Close modal">
            <X size={18} />
          </button>
        </div>

        <div className="modal-body-form" style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {/* Group Summary Cards */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '12px' }}>
            <div className="summary-stat-box" style={{ padding: '12px 14px' }}>
              <span className="stat-num" style={{ fontSize: '20px' }}>#{group.group_id}</span>
              <span className="stat-label">รหัสกลุ่ม (Group ID)</span>
            </div>
            <div className="summary-stat-box" style={{ padding: '12px 14px' }}>
              <span className="stat-num" style={{ fontSize: '20px' }}>{deviceCount}</span>
              <span className="stat-label">เครื่อง MCU / RFID</span>
            </div>
            <div className="summary-stat-box" style={{ padding: '12px 14px' }}>
              <span className="stat-num" style={{ fontSize: '20px' }}>{ipCamCount}</span>
              <span className="stat-label">กล้อง IP Camera</span>
            </div>
          </div>

          {/* Group Metadata */}
          <div className="form-section-box">
            <div className="form-section-title" style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <Info size={14} className="text-pink" />
              <span>ข้อมูลทั่วไปของกลุ่ม</span>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px 16px', fontSize: '13px' }}>
              <div>
                <div className="text-muted" style={{ fontSize: '12px' }}>ชื่อกลุ่ม</div>
                <div style={{ fontWeight: 700, marginTop: '2px' }}>{group.group_name}</div>
              </div>
              <div>
                <div className="text-muted" style={{ fontSize: '12px' }}>สถานะกลุ่ม</div>
                <div style={{ marginTop: '2px' }}>
                  {group.is_delete ? (
                    <span className="badge badge-stolen">ถูกลบ (Archived)</span>
                  ) : (
                    <span className="badge badge-active">ใช้งานอยู่ (Active)</span>
                  )}
                </div>
              </div>
              <div>
                <div className="text-muted" style={{ fontSize: '12px' }}>ผู้สร้าง</div>
                <div style={{ fontWeight: 600, marginTop: '2px' }}>{group.by_user_name || '-'}</div>
              </div>
              <div>
                <div className="text-muted" style={{ fontSize: '12px' }}>วันที่สร้าง</div>
                <div style={{ marginTop: '2px' }}>
                  {group.created_at ? new Date(group.created_at).toLocaleString('th-TH') : '-'}
                </div>
              </div>
            </div>
          </div>

          {/* Member Devices List */}
          <div className="form-section-box">
            <div className="form-section-title" style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <Cpu size={14} className="text-pink" />
              <span>อุปกรณ์ภายในกลุ่ม ({groupHardware.mcus.length + groupHardware.ipCams.length})</span>
            </div>

            {groupHardware.mcus.length === 0 && groupHardware.ipCams.length === 0 ? (
              <p className="text-muted" style={{ fontSize: '13px', margin: 0 }}>
                ยังไม่มีอุปกรณ์ที่ผูกกับกลุ่มนี้ในระบบปัจจุบัน
              </p>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                {groupHardware.mcus.map((d) => {
                  const st = checkDeviceStatus(d);
                  return (
                    <div
                      key={`mcu-${d.device_id}`}
                      style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        padding: '8px 12px',
                        background: '#ffffff',
                        border: '1px solid var(--line)',
                        borderRadius: '8px',
                        fontSize: '13px',
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                        <DeviceTypeBadge type={d.device_type} />
                        <div>
                          <div style={{ fontWeight: 700 }}>{d.device_name}</div>
                          <div className="text-muted" style={{ fontSize: '11px' }}>
                            IP: {d.ip || '-'} · {d.local || '-'}
                          </div>
                        </div>
                      </div>
                      <span className={`badge ${st.badgeClass}`}>{st.statusLabel}</span>
                    </div>
                  );
                })}

                {groupHardware.ipCams.map((cam) => {
                  const st = checkDeviceStatus({ status: cam.status, last_active_at: cam.last_active_at ?? null });
                  return (
                    <div
                      key={`cam-${cam.ip_cam_id}`}
                      style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        padding: '8px 12px',
                        background: '#ffffff',
                        border: '1px solid var(--line)',
                        borderRadius: '8px',
                        fontSize: '13px',
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                        <span className="badge badge-pink" style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                          <Video size={12} /> IP-CAM
                        </span>
                        <div>
                          <div style={{ fontWeight: 700 }}>{cam.cam_name}</div>
                          <div className="text-muted" style={{ fontSize: '11px' }}>
                            IP: {cam.ip || '-'} · {cam.local || '-'}
                          </div>
                        </div>
                      </div>
                      <span className={`badge ${st.badgeClass}`}>{st.statusLabel}</span>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        <div className="modal-foot" style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
          {onEdit && !group.is_delete && (
            <button type="button" className="btn btn-primary btn-sm" onClick={onEdit}>
              <Edit3 size={14} />
              <span>แก้ไขชื่อกลุ่ม</span>
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
