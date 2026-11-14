import React, { useState, useEffect } from 'react';
import { PlusCircle, Cpu, Video, Save, ArrowLeft, Radar } from 'lucide-react';
import { api } from '../services/api';
import type { GroupInfo } from '../types';

interface AddDevicePageProps {
  onDevicesChanged: () => void;
  onNavigate: (tab: string) => void;
  showToast: (msg: string, type: 'success' | 'error' | 'info') => void;
}

export const AddDevicePage: React.FC<AddDevicePageProps> = ({
  onDevicesChanged,
  onNavigate,
  showToast,
}) => {
  const [kind, setKind] = useState<'device' | 'ip_cam'>('device');
  const [groups, setGroups] = useState<GroupInfo[]>([]);
  const [isSaving, setIsSaving] = useState(false);
  const [isProbing, setIsProbing] = useState(false);

  // Shared fields
  const [name, setName] = useState('');
  const [groupId, setGroupId] = useState('1');
  const [mac, setMac] = useState('');
  const [ip, setIp] = useState('');
  const [local, setLocal] = useState('');

  // Device-only
  const [deviceType, setDeviceType] = useState<'RFID' | 'CAM'>('RFID');
  const [subnet, setSubnet] = useState('');
  const [gateway, setGateway] = useState('');

  // IP-Cam-only
  const [brand, setBrand] = useState('');
  const [model, setModel] = useState('');
  const [rtspUrl, setRtspUrl] = useState('');
  const [snapshotUrl, setSnapshotUrl] = useState('');
  const [onvifUrl, setOnvifUrl] = useState('');
  const [camUsername, setCamUsername] = useState('');
  const [camPassword, setCamPassword] = useState('');
  const [authMode, setAuthMode] = useState<'auto' | 'query' | 'basic' | 'digest'>('auto');
  const [keepAlivePort, setKeepAlivePort] = useState('auto');

  useEffect(() => {
    api.getGroups(1, 100).then((res) => {
      if (res.success && Array.isArray(res.data) && res.data.length > 0) {
        setGroups(res.data);
        setGroupId(String(res.data[0].group_id));
      }
    });
  }, []);

  const resetForm = () => {
    setName('');
    setMac('');
    setIp('');
    setLocal('');
    setSubnet('');
    setGateway('');
    setBrand('');
    setModel('');
    setRtspUrl('');
    setSnapshotUrl('');
    setOnvifUrl('');
    setCamUsername('');
    setCamPassword('');
    setAuthMode('auto');
    setKeepAlivePort('auto');
  };

  const handleProbeCamera = async () => {
    if (!ip.trim() && !onvifUrl.trim()) {
      showToast('กรุณากรอก IP Address หรือ ONVIF URL ก่อนทำการ Probe', 'info');
      return;
    }
    setIsProbing(true);
    try {
      const payload: any = {};
      if (ip.trim()) payload.ip = ip.trim();
      if (onvifUrl.trim()) payload.ONVIF_url = onvifUrl.trim();
      if (camUsername.trim()) payload.cam_username = camUsername.trim();
      if (camPassword.trim()) payload.cam_password = camPassword.trim();

      const res = await api.probeIPCam(payload);
      if (res.success && res.data) {
        const d = res.data;
        if (d.mac && !mac.trim()) setMac(d.mac);
        if (d.brand) setBrand(d.brand);
        if (d.model) setModel(d.model);
        if (d.rtsp_url) setRtspUrl(d.rtsp_url);
        if (d.snapshot_url) setSnapshotUrl(d.snapshot_url);
        if (d.ONVIF_url) setOnvifUrl(d.ONVIF_url);
        showToast('ดึงข้อมูลกล้องอัตโนมัติสำเร็จ (Probe OK)', 'success');
      } else {
        showToast(res.error || 'ไม่สามารถ Probe ข้อมูลกล้องได้', 'error');
      }
    } catch (err: any) {
      showToast(err.message || 'เกิดข้อผิดพลาดในการ Probe กล้อง', 'error');
    } finally {
      setIsProbing(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    try {
      const numericGroupId = Number(groupId);
      let res;

      if (kind === 'device') {
        const payload: any = {
          device_name: name.trim(),
          mac: mac.trim(),
          local: local.trim(),
          group_id: numericGroupId,
          type: deviceType,
        };
        if (ip.trim()) payload.ip = ip.trim();
        if (subnet.trim()) payload.subnet = subnet.trim();
        if (gateway.trim()) payload.gate_way = gateway.trim();
        res = await api.createDevice(payload);
      } else {
        const payload: Record<string, any> = {
          cam_name: name.trim(),
          ip: ip.trim(),
          local: local.trim(),
          group_id: numericGroupId,
          auth: authMode,
          keep_alive_port: keepAlivePort.trim() === '' || keepAlivePort.trim().toLowerCase() === 'auto'
            ? 'auto'
            : Number(keepAlivePort.trim()),
        };
        if (mac.trim()) payload.mac = mac.trim();
        if (brand.trim()) payload.brand = brand.trim();
        if (model.trim()) payload.model = model.trim();
        if (rtspUrl.trim()) payload.rtsp_url = rtspUrl.trim();
        if (snapshotUrl.trim()) payload.snapshot_url = snapshotUrl.trim();
        if (onvifUrl.trim()) payload.ONVIF_url = onvifUrl.trim();
        if (camUsername.trim()) payload.cam_username = camUsername.trim();
        if (camPassword.trim()) payload.cam_password = camPassword.trim();
        res = await api.createIPCam(payload);
      }

      if (res.success) {
        showToast(
          kind === 'device' ? 'เพิ่มอุปกรณ์ MCU / RFID สำเร็จ' : 'เพิ่มกล้อง IP Camera สำเร็จ',
          'success'
        );
        resetForm();
        onDevicesChanged();
        onNavigate('device_manager');
      } else {
        showToast(res.error || 'ไม่สามารถเพิ่มอุปกรณ์ได้', 'error');
      }
    } catch (err: any) {
      showToast(err.message || 'เกิดข้อผิดพลาดในการเชื่อมต่อเซิร์ฟเวอร์', 'error');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="devices-page">
      <div className="page-header-row">
        <div>
          <h2 style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <PlusCircle size={22} className="text-pink" />
            <span>เพิ่มอุปกรณ์ใหม่เข้าระบบ (Add Device)</span>
          </h2>
          <p className="page-sub">
            ลงทะเบียนเครื่องอ่าน RFID, กล้อง MCU (ESP32-CAM) หรือกล้อง IP Camera เข้าสู่กลุ่มอุปกรณ์
          </p>
        </div>
        <button
          type="button"
          className="btn btn-secondary btn-sm"
          onClick={() => onNavigate('device_manager')}
        >
          <ArrowLeft size={15} />
          <span>กลับหน้า Manager</span>
        </button>
      </div>

      <div className="history-table-card" style={{ padding: '24px', maxWidth: '840px' }}>
        {/* Type Selector Cards */}
        <div className="form-section-box" style={{ marginBottom: '18px' }}>
          <div className="form-section-title">
            <span>1. เลือกประเภทฮาร์ดแวร์ที่ต้องการเพิ่ม</span>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, minmax(0, 1fr))', gap: '12px' }}>
            <button
              type="button"
              onClick={() => setKind('device')}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '12px',
                padding: '14px 16px',
                borderRadius: '10px',
                border: kind === 'device' ? '2px solid var(--pink)' : '1px solid var(--line)',
                background: kind === 'device' ? '#fff5f8' : '#fff',
                cursor: 'pointer',
                textAlign: 'left',
                transition: 'all 0.15s ease',
              }}
            >
              <Cpu size={24} className="text-pink" style={{ flexShrink: 0 }} />
              <div>
                <div style={{ fontWeight: 700, fontSize: '14px', color: 'var(--ink)' }}>
                  MCU / RFID Reader
                </div>
                <div style={{ fontSize: '12px', color: 'var(--muted)' }}>
                  บอร์ด ESP32-S3 เครื่องอ่าน RFID หรือกล้อง MCU
                </div>
              </div>
            </button>

            <button
              type="button"
              onClick={() => setKind('ip_cam')}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '12px',
                padding: '14px 16px',
                borderRadius: '10px',
                border: kind === 'ip_cam' ? '2px solid var(--pink)' : '1px solid var(--line)',
                background: kind === 'ip_cam' ? '#fff5f8' : '#fff',
                cursor: 'pointer',
                textAlign: 'left',
                transition: 'all 0.15s ease',
              }}
            >
              <Video size={24} className="text-pink" style={{ flexShrink: 0 }} />
              <div>
                <div style={{ fontWeight: 700, fontSize: '14px', color: 'var(--ink)' }}>
                  IP Camera (CCTV)
                </div>
                <div style={{ fontSize: '12px', color: 'var(--muted)' }}>
                  กล้องวงจรปิด IP ที่รองรับ Snapshot / RTSP / ONVIF
                </div>
              </div>
            </button>
          </div>
        </div>

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}>
          <div className="form-section-box">
            <div className="form-section-title">
              <span>2. ข้อมูลพื้นฐานและเครือข่าย</span>
            </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, minmax(0, 1fr))', gap: '14px' }}>
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

            {kind === 'device' ? (
              <div className="form-group">
                <label>ชนิดอุปกรณ์ *</label>
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
              <label>{kind === 'device' ? 'MAC Address *' : 'MAC Address (ไม่บังคับ - ดึงอัตโนมัติได้)'}</label>
              <input
                type="text"
                required={kind === 'device'}
                value={mac}
                onChange={(e) => setMac(e.target.value)}
                placeholder="F4:65:0B:47:B4:70"
              />
            </div>

            <div className="form-group" style={{ gridColumn: '1 / -1' }}>
              <label>สถานที่ติดตั้ง (Location) *</label>
              <input
                type="text"
                required
                value={local}
                onChange={(e) => setLocal(e.target.value)}
                placeholder="เช่น Building 11 Room 101"
              />
            </div>

            {kind === 'device' && (
              <>
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
              </>
            )}
          </div>
          </div>

          {kind === 'ip_cam' && (
            <div className="form-section-box">
              <div className="form-section-title">
                <span>3. ข้อมูลรุ่นกล้อง & การเชื่อมต่อ (ไม่บังคับ)</span>
                <button
                  type="button"
                  className="btn btn-secondary btn-sm"
                  onClick={handleProbeCamera}
                  disabled={isProbing}
                >
                  <Radar size={15} className={isProbing ? 'spin' : ''} />
                  <span>{isProbing ? 'กำลัง Probe...' : 'ดึงข้อมูลกล้องอัตโนมัติ (Probe)'}</span>
                </button>
              </div>
              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(2, minmax(0, 1fr))',
                  gap: '14px',
                }}
              >

              <div className="form-group">
                <label>ยี่ห้อกล้อง (Brand)</label>
                <input
                  type="text"
                  value={brand}
                  onChange={(e) => setBrand(e.target.value)}
                  placeholder="เช่น Hikvision, Dahua, TP-Link"
                />
              </div>

              <div className="form-group">
                <label>รุ่นกล้อง (Model)</label>
                <input
                  type="text"
                  value={model}
                  onChange={(e) => setModel(e.target.value)}
                  placeholder="เช่น Tapo C200, DS-2CD..."
                />
              </div>

              <div className="form-group" style={{ gridColumn: '1 / -1' }}>
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

              <div className="form-group">
                <label>Cam Username</label>
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
                  placeholder="••••••"
                />
              </div>

              <div className="form-group">
                <label>Auth Mode</label>
                <select value={authMode} onChange={(e) => setAuthMode(e.target.value as any)}>
                  <option value="auto">auto (ตรวจจับอัตโนมัติ)</option>
                  <option value="digest">digest</option>
                  <option value="basic">basic</option>
                  <option value="query">query</option>
                </select>
              </div>

              <div className="form-group">
                <label>Keep-Alive Port (auto หรือเลข Port)</label>
                <input
                  type="text"
                  value={keepAlivePort}
                  onChange={(e) => setKeepAlivePort(e.target.value)}
                  placeholder="auto หรือ 80 / 554"
                />
              </div>
              </div>
            </div>
          )}

          <div
            style={{
              display: 'flex',
              justifyContent: 'flex-end',
              gap: '12px',
              paddingTop: '12px',
              borderTop: '1px solid var(--line)',
            }}
          >
            <button
              type="button"
              className="btn btn-secondary"
              onClick={resetForm}
              disabled={isSaving}
            >
              ล้างค่า
            </button>
            <button type="submit" className="btn btn-primary" disabled={isSaving}>
              <Save size={16} />
              <span>{isSaving ? 'กำลังบันทึก...' : 'บันทึกอุปกรณ์'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
