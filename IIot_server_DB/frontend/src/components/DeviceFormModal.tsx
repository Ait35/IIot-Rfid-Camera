import React, { useState, useEffect } from 'react';
import { X, Save, Plus, Cpu, Video, Radar } from 'lucide-react';
import { api } from '../services/api';
import type { GroupInfo } from '../types';

export interface EditableHardwareItem {
  kind: 'device' | 'ip_cam';
  id: number;
  name: string;
  device_type: string; // 'RFID' | 'CAM' | 'ip_cam'
  brand?: string | null;
  model?: string | null;
  group_id?: number | null;
  mac?: string | null;
  ip?: string | null;
  subnet?: string | null;
  gate_way?: string | null;
  local?: string | null;
  status?: boolean;
  rtsp_url?: string | null;
  snapshot_url?: string | null;
  onvif_url?: string | null;
  cam_username?: string | null;
  auth?: string | null;
  keep_alive_port?: number | string | null;
}

interface DeviceFormModalProps {
  isOpen: boolean;
  mode: 'create' | 'edit';
  initialItem: EditableHardwareItem | null;
  groups: GroupInfo[];
  onClose: () => void;
  onSubmitDevice: (payload: any, isEdit: boolean) => Promise<boolean>;
  onSubmitIPCam: (payload: any, isEdit: boolean) => Promise<boolean>;
}

export const DeviceFormModal: React.FC<DeviceFormModalProps> = ({
  isOpen,
  mode,
  initialItem,
  groups,
  onClose,
  onSubmitDevice,
  onSubmitIPCam,
}) => {
  const [kind, setKind] = useState<'device' | 'ip_cam'>('device');

  const [name, setName] = useState('');
  const [groupId, setGroupId] = useState<string>('1');
  const [mac, setMac] = useState('');
  const [ip, setIp] = useState('');
  const [subnet, setSubnet] = useState('');
  const [gateway, setGateway] = useState('');
  const [local, setLocal] = useState('');

  const [deviceType, setDeviceType] = useState<'RFID' | 'CAM'>('RFID');

  const [brand, setBrand] = useState('');
  const [model, setModel] = useState('');
  const [rtspUrl, setRtspUrl] = useState('');
  const [snapshotUrl, setSnapshotUrl] = useState('');
  const [onvifUrl, setOnvifUrl] = useState('');
  const [camUsername, setCamUsername] = useState('');
  const [camPassword, setCamPassword] = useState('');
  const [authMode, setAuthMode] = useState<'auto' | 'query' | 'basic' | 'digest'>('auto');
  const [keepAlivePort, setKeepAlivePort] = useState('auto');

  const [isSaving, setIsSaving] = useState(false);
  const [isProbing, setIsProbing] = useState(false);

  useEffect(() => {
    if (!isOpen) return;
    if (mode === 'edit' && initialItem) {
      setKind(initialItem.kind);
      setName(initialItem.name || '');
      setGroupId(
        initialItem.group_id
          ? String(initialItem.group_id)
          : groups[0]?.group_id
          ? String(groups[0].group_id)
          : '1'
      );
      setMac(initialItem.mac && initialItem.mac !== '-' ? initialItem.mac : '');
      setIp(initialItem.ip && initialItem.ip !== '-' ? initialItem.ip : '');
      setSubnet(initialItem.subnet || '255.255.255.0');
      setGateway(initialItem.gate_way || '127.0.0.1');
      setLocal(initialItem.local && initialItem.local !== '-' ? initialItem.local : '');
      setDeviceType(initialItem.device_type?.toUpperCase() === 'CAM' ? 'CAM' : 'RFID');
      setBrand(initialItem.brand || '');
      setModel(initialItem.model || '');
      setRtspUrl(initialItem.rtsp_url || '');
      setSnapshotUrl(initialItem.snapshot_url || '');
      setOnvifUrl(initialItem.onvif_url || '');
      setCamUsername(initialItem.cam_username || '');
      setCamPassword('');
      setAuthMode((initialItem.auth as any) || 'auto');
      setKeepAlivePort(
        initialItem.keep_alive_port != null ? String(initialItem.keep_alive_port) : 'auto'
      );
    } else {
      setKind('device');
      setName('');
      setGroupId(groups[0]?.group_id ? String(groups[0].group_id) : '1');
      setMac('');
      setIp('');
      setSubnet('255.255.255.0');
      setGateway('');
      setLocal('');
      setDeviceType('RFID');
      setBrand('');
      setModel('');
      setRtspUrl('');
      setSnapshotUrl('');
      setOnvifUrl('');
      setCamUsername('');
      setCamPassword('');
      setAuthMode('auto');
      setKeepAlivePort('auto');
    }
  }, [isOpen, mode, initialItem, groups]);

  if (!isOpen) return null;

  const handleProbeCamera = async () => {
    if (!ip.trim() && !onvifUrl.trim() && !initialItem?.id) return;
    setIsProbing(true);
    try {
      const payload: any = {};
      if (initialItem?.id && mode === 'edit') payload.ip_cam_id = initialItem.id;
      if (ip.trim()) payload.ip = ip.trim();
      if (onvifUrl.trim()) payload.ONVIF_url = onvifUrl.trim();
      if (camUsername.trim()) payload.cam_username = camUsername.trim();
      if (camPassword.trim()) payload.cam_password = camPassword.trim();

      const res = await api.probeIPCam(payload);
      if (res.success && res.data) {
        const d = res.data;
        if (d.brand) setBrand(d.brand);
        if (d.model) setModel(d.model);
        if (d.rtsp_url) setRtspUrl(d.rtsp_url);
        if (d.snapshot_url) setSnapshotUrl(d.snapshot_url);
        if (d.ONVIF_url) setOnvifUrl(d.ONVIF_url);
      }
    } finally {
      setIsProbing(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    try {
      let ok = false;
      const numericGroupId = Number(groupId);

      if (kind === 'device') {
        if (mode === 'create') {
          ok = await onSubmitDevice(
            {
              device_name: name.trim(),
              mac: mac.trim(),
              local: local.trim(),
              group_id: numericGroupId,
              type: deviceType,
              ip: ip.trim(),
              subnet: subnet.trim(),
              gate_way: gateway.trim(),
            },
            false
          );
        } else if (initialItem) {
          ok = await onSubmitDevice(
            {
              device_id: initialItem.id,
              device_name: name.trim(),
              device_type: deviceType,
              group_id: numericGroupId,
              local: local.trim(),
              ip: ip.trim(),
              subnet: subnet.trim(),
              gate_way: gateway.trim(),
            },
            true
          );
        }
      } else {
        const portVal =
          keepAlivePort.trim() === '' || keepAlivePort.trim().toLowerCase() === 'auto'
            ? 'auto'
            : Number(keepAlivePort.trim());

        if (mode === 'create') {
          const payload: Record<string, any> = {
            cam_name: name.trim(),
            ip: ip.trim(),
            local: local.trim(),
            group_id: numericGroupId,
            auth: authMode,
            keep_alive_port: portVal,
          };
          if (mac.trim()) payload.mac = mac.trim();
          if (brand.trim()) payload.brand = brand.trim();
          if (model.trim()) payload.model = model.trim();
          if (rtspUrl.trim()) payload.rtsp_url = rtspUrl.trim();
          if (snapshotUrl.trim()) payload.snapshot_url = snapshotUrl.trim();
          if (onvifUrl.trim()) payload.ONVIF_url = onvifUrl.trim();
          if (camUsername.trim()) payload.cam_username = camUsername.trim();
          if (camPassword.trim()) payload.cam_password = camPassword.trim();
          ok = await onSubmitIPCam(payload, false);
        } else if (initialItem) {
          const payload: Record<string, any> = {
            ip_cam_id: initialItem.id,
            cam_name: name.trim(),
            group_id: numericGroupId,
            ip: ip.trim(),
            local: local.trim(),
            auth: authMode,
            keep_alive_port: portVal,
          };
          if (brand.trim()) payload.brand = brand.trim();
          if (model.trim()) payload.model = model.trim();
          if (rtspUrl.trim()) payload.rtsp_url = rtspUrl.trim();
          if (snapshotUrl.trim()) payload.snapshot_url = snapshotUrl.trim();
          if (onvifUrl.trim()) payload.ONVIF_url = onvifUrl.trim();
          if (camUsername.trim()) payload.cam_username = camUsername.trim();
          if (camPassword.trim()) payload.cam_password = camPassword.trim();
          ok = await onSubmitIPCam(payload, true);
        }
      }

      if (ok) {
        onClose();
      }
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="modal-backdrop active" onClick={() => !isSaving && onClose()}>
      <div
        className="modal-card"
        style={{ maxWidth: '580px', width: '95%', maxHeight: '90vh', overflowY: 'auto' }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="modal-head">
          <div className="modal-title-wrap">
            {mode === 'create' ? <Plus size={18} className="text-pink" /> : <Save size={18} className="text-pink" />}
            <div>
              <h3>
                {mode === 'create'
                  ? 'เพิ่มอุปกรณ์ใหม่เข้าระบบ'
                  : kind === 'ip_cam'
                  ? `แก้ไขกล้อง IP Camera (#${initialItem?.id})`
                  : `แก้ไขอุปกรณ์ MCU / RFID (#${initialItem?.id})`}
              </h3>
              <p className="modal-sub">
                {mode === 'create'
                  ? 'เลือกประเภทอุปกรณ์และกรอกข้อมูลที่จำเป็น'
                  : 'ปรับปรุงข้อมูลเครือข่าย ตำแหน่ง และค่าตั้งของอุปกรณ์'}
              </p>
            </div>
          </div>
          <button className="btn-ghost icon-btn" onClick={onClose} disabled={isSaving} aria-label="Close modal">
            <X size={18} />
          </button>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="modal-body-form" style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            {mode === 'create' && (
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                <button
                  type="button"
                  className={`btn btn-sm ${kind === 'device' ? 'btn-primary' : 'btn-secondary'}`}
                  onClick={() => setKind('device')}
                >
                  <Cpu size={16} />
                  <span>MCU / RFID Reader</span>
                </button>
                <button
                  type="button"
                  className={`btn btn-sm ${kind === 'ip_cam' ? 'btn-primary' : 'btn-secondary'}`}
                  onClick={() => setKind('ip_cam')}
                >
                  <Video size={16} />
                  <span>IP Camera</span>
                </button>
              </div>
            )}

            {/* Section 1: General Info */}
            <div className="form-section-box">
              <div className="form-section-title">ข้อมูลทั่วไปและตำแหน่งติดตั้ง</div>

              <div className="form-group">
                <label>{kind === 'ip_cam' ? 'ชื่อกล้อง (Camera Name) *' : 'ชื่ออุปกรณ์ (Device Name) *'}</label>
                <input
                  type="text"
                  required
                  minLength={2}
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder={kind === 'ip_cam' ? 'เช่น IP-Cam Building 11' : 'เช่น ESP32-RFID-Door1'}
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                {kind === 'device' ? (
                  <div className="form-group">
                    <label>ประเภทอุปกรณ์ *</label>
                    <select value={deviceType} onChange={(e) => setDeviceType(e.target.value as 'RFID' | 'CAM')}>
                      <option value="RFID">RFID (เครื่องอ่านบัตร)</option>
                      <option value="CAM">CAM (กล้อง MCU)</option>
                    </select>
                  </div>
                ) : (
                  <div className="form-group">
                    <label>IP Address *</label>
                    <input
                      type="text"
                      required
                      value={ip}
                      onChange={(e) => setIp(e.target.value)}
                      placeholder="192.168.1.50"
                    />
                  </div>
                )}

                <div className="form-group">
                  <label>กลุ่มอุปกรณ์ (Group) *</label>
                  {groups.length > 0 ? (
                    <select value={groupId} onChange={(e) => setGroupId(e.target.value)}>
                      {groups.map((g) => (
                        <option key={g.group_id} value={String(g.group_id)}>
                          Group #{g.group_id} ({g.group_name})
                        </option>
                      ))}
                    </select>
                  ) : (
                    <input
                      type="number"
                      min={1}
                      required
                      value={groupId}
                      onChange={(e) => setGroupId(e.target.value)}
                    />
                  )}
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                {kind === 'device' && mode === 'create' ? (
                  <div className="form-group">
                    <label>MAC Address *</label>
                    <input
                      type="text"
                      required
                      value={mac}
                      onChange={(e) => setMac(e.target.value)}
                      placeholder="F4:65:0B:47:B4:70"
                    />
                  </div>
                ) : (
                  <div className="form-group">
                    <label>MAC Address</label>
                    <input
                      type="text"
                      value={mac}
                      disabled={mode === 'edit'}
                      onChange={(e) => setMac(e.target.value)}
                      placeholder="AA:BB:CC:DD:EE:FF"
                    />
                  </div>
                )}

                <div className="form-group">
                  <label>สถานที่ติดตั้ง (Location) *</label>
                  <input
                    type="text"
                    required
                    value={local}
                    onChange={(e) => setLocal(e.target.value)}
                    placeholder="เช่น Building 11 Room 101"
                  />
                </div>
              </div>
            </div>

            {/* Section 2: Network Config for MCU/RFID */}
            {kind === 'device' && (
              <div className="form-section-box">
                <div className="form-section-title">การตั้งค่าเครือข่าย (Network)</div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '12px' }}>
                  <div className="form-group">
                    <label>IP Address *</label>
                    <input
                      type="text"
                      required
                      value={ip}
                      onChange={(e) => setIp(e.target.value)}
                      placeholder="192.168.1.100"
                    />
                  </div>
                  <div className="form-group">
                    <label>Subnet Mask *</label>
                    <input
                      type="text"
                      required
                      value={subnet}
                      onChange={(e) => setSubnet(e.target.value)}
                      placeholder="255.255.255.0"
                    />
                  </div>
                  <div className="form-group">
                    <label>Gateway *</label>
                    <input
                      type="text"
                      required
                      value={gateway}
                      onChange={(e) => setGateway(e.target.value)}
                      placeholder="192.168.1.1"
                    />
                  </div>
                </div>
              </div>
            )}

            {/* Section 3: IP Camera Media & Probe */}
            {kind === 'ip_cam' && (
              <div className="form-section-box">
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
                  <div className="form-section-title" style={{ borderBottom: 'none', paddingBottom: 0 }}>
                    ข้อมูลกล้อง IP Camera &amp; การเชื่อมต่อ
                  </div>
                  <button
                    type="button"
                    className="btn btn-secondary btn-sm"
                    onClick={handleProbeCamera}
                    disabled={isProbing}
                  >
                    <Radar size={14} className={isProbing ? 'spin' : ''} />
                    <span>{isProbing ? 'กำลัง Probe...' : 'ดึงข้อมูลอัตโนมัติ'}</span>
                  </button>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                  <div className="form-group">
                    <label>ยี่ห้อ (Brand)</label>
                    <input
                      type="text"
                      value={brand}
                      onChange={(e) => setBrand(e.target.value)}
                      placeholder="Hikvision, TP-Link"
                    />
                  </div>
                  <div className="form-group">
                    <label>รุ่น (Model)</label>
                    <input
                      type="text"
                      value={model}
                      onChange={(e) => setModel(e.target.value)}
                      placeholder="Tapo C200"
                    />
                  </div>
                </div>

                <div className="form-group">
                  <label>Snapshot URL</label>
                  <input
                    type="text"
                    value={snapshotUrl}
                    onChange={(e) => setSnapshotUrl(e.target.value)}
                    placeholder="http://192.168.1.50/snap.jpg"
                  />
                </div>
                <div className="form-group">
                  <label>RTSP URL</label>
                  <input
                    type="text"
                    value={rtspUrl}
                    onChange={(e) => setRtspUrl(e.target.value)}
                    placeholder="rtsp://192.168.1.50:554/stream1"
                  />
                </div>
                <div className="form-group">
                  <label>ONVIF URL</label>
                  <input
                    type="text"
                    value={onvifUrl}
                    onChange={(e) => setOnvifUrl(e.target.value)}
                    placeholder="http://192.168.1.50:80/onvif/device_service"
                  />
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                  <div className="form-group">
                    <label>Cam User</label>
                    <input
                      type="text"
                      value={camUsername}
                      onChange={(e) => setCamUsername(e.target.value)}
                      placeholder="admin"
                    />
                  </div>
                  <div className="form-group">
                    <label>Cam Password</label>
                    <input
                      type="password"
                      value={camPassword}
                      onChange={(e) => setCamPassword(e.target.value)}
                      placeholder={mode === 'edit' ? '(คงเดิม)' : '••••••'}
                    />
                  </div>
                  <div className="form-group">
                    <label>Auth Mode</label>
                    <select value={authMode} onChange={(e) => setAuthMode(e.target.value as any)}>
                      <option value="auto">auto</option>
                      <option value="digest">digest</option>
                      <option value="basic">basic</option>
                      <option value="query">query</option>
                    </select>
                  </div>
                  <div className="form-group">
                    <label>Keep-Alive Port</label>
                    <input
                      type="text"
                      value={keepAlivePort}
                      onChange={(e) => setKeepAlivePort(e.target.value)}
                      placeholder="auto หรือ 80"
                    />
                  </div>
                </div>
              </div>
            )}
          </div>

          <div className="modal-foot" style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
            <button type="button" className="btn btn-secondary btn-sm" onClick={onClose} disabled={isSaving}>
              ยกเลิก
            </button>
            <button type="submit" className="btn btn-primary btn-sm" disabled={isSaving}>
              <Save size={15} />
              <span>{isSaving ? 'กำลังบันทึก...' : mode === 'create' ? 'เพิ่มอุปกรณ์' : 'บันทึกการแก้ไข'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
