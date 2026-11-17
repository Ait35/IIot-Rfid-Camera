import React from 'react';
import { Radar } from 'lucide-react';
import type { GroupInfo } from '../../../types';
import type {
  HardwareFormState,
  McuDeviceType,
  CamAuthMode,
} from '../deviceFormHelpers';

interface SectionProps {
  form: HardwareFormState;
  onChange: <K extends keyof HardwareFormState>(field: K, value: HardwareFormState[K]) => void;
}

interface GeneralSectionProps extends SectionProps {
  groups: GroupInfo[];
  mode: 'create' | 'edit';
  title?: string;
}

export const GeneralHardwareSection: React.FC<GeneralSectionProps> = ({
  form,
  onChange,
  groups,
  mode,
  title = 'ข้อมูลทั่วไปและตำแหน่งติดตั้ง',
}) => {
  const isMacRequired = form.kind === 'device' && mode === 'create';

  return (
    <div className="form-section-box">
      <div className="form-section-title">{title}</div>

      <div className="form-group">
        <label>
          {form.kind === 'ip_cam' ? 'ชื่อกล้อง (Camera Name) *' : 'ชื่ออุปกรณ์ (Device Name) *'}
        </label>
        <input
          type="text"
          required
          minLength={2}
          value={form.name}
          onChange={(e) => onChange('name', e.target.value)}
          placeholder={form.kind === 'ip_cam' ? 'เช่น IP-Cam Building 11' : 'เช่น ESP32-RFID-Door1'}
        />
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
        {form.kind === 'device' ? (
          <div className="form-group">
            <label>ประเภทอุปกรณ์ *</label>
            <select
              value={form.deviceType}
              onChange={(e) => onChange('deviceType', e.target.value as McuDeviceType)}
            >
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
              value={form.ip}
              onChange={(e) => onChange('ip', e.target.value)}
              placeholder="192.168.1.50"
            />
          </div>
        )}

        <div className="form-group">
          <label>กลุ่มอุปกรณ์ (Group) *</label>
          {groups.length > 0 ? (
            <select value={form.groupId} onChange={(e) => onChange('groupId', e.target.value)}>
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
              value={form.groupId}
              onChange={(e) => onChange('groupId', e.target.value)}
            />
          )}
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
        <div className="form-group">
          <label>
            {isMacRequired
              ? 'MAC Address *'
              : mode === 'create'
                ? 'MAC Address (ไม่บังคับ - ดึงอัตโนมัติได้)'
                : 'MAC Address'}
          </label>
          <input
            type="text"
            required={isMacRequired}
            disabled={mode === 'edit'}
            value={form.mac}
            onChange={(e) => onChange('mac', e.target.value)}
            placeholder={isMacRequired ? 'F4:65:0B:47:B4:70' : 'AA:BB:CC:DD:EE:FF'}
          />
        </div>

        <div className="form-group">
          <label>สถานที่ติดตั้ง (Location) *</label>
          <input
            type="text"
            required
            value={form.local}
            onChange={(e) => onChange('local', e.target.value)}
            placeholder="เช่น Building 11 Room 101"
          />
        </div>
      </div>
    </div>
  );
};

export const McuNetworkSection: React.FC<SectionProps> = ({ form, onChange }) => (
  <div className="form-section-box">
    <div className="form-section-title">การตั้งค่าเครือข่าย (Network)</div>
    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '12px' }}>
      <div className="form-group">
        <label>IP Address *</label>
        <input
          type="text"
          required
          value={form.ip}
          onChange={(e) => onChange('ip', e.target.value)}
          placeholder="192.168.1.100"
        />
      </div>
      <div className="form-group">
        <label>Subnet Mask *</label>
        <input
          type="text"
          required
          value={form.subnet}
          onChange={(e) => onChange('subnet', e.target.value)}
          placeholder="255.255.255.0"
        />
      </div>
      <div className="form-group">
        <label>Gateway *</label>
        <input
          type="text"
          required
          value={form.gateway}
          onChange={(e) => onChange('gateway', e.target.value)}
          placeholder="192.168.1.1"
        />
      </div>
    </div>
  </div>
);

interface IpCamSectionProps extends SectionProps {
  mode: 'create' | 'edit';
  isProbing: boolean;
  onProbe: () => void;
}

export const IpCamConfigSection: React.FC<IpCamSectionProps> = ({
  form,
  onChange,
  mode,
  isProbing,
  onProbe,
}) => (
  <div className="form-section-box">
    <div
      style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: '4px',
      }}
    >
      <div className="form-section-title" style={{ borderBottom: 'none', paddingBottom: 0 }}>
        ข้อมูลกล้อง IP Camera &amp; การเชื่อมต่อ
      </div>
      <button
        type="button"
        className="btn btn-secondary btn-sm"
        onClick={onProbe}
        disabled={isProbing}
      >
        <Radar size={14} className={isProbing ? 'spin' : ''} />
        <span>{isProbing ? 'กำลัง Probe...' : 'ดึงข้อมูลอัตโนมัติ (Probe)'}</span>
      </button>
    </div>

    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
      <div className="form-group">
        <label>ยี่ห้อ (Brand)</label>
        <input
          type="text"
          value={form.brand}
          onChange={(e) => onChange('brand', e.target.value)}
          placeholder="Hikvision, Dahua, TP-Link"
        />
      </div>
      <div className="form-group">
        <label>รุ่น (Model)</label>
        <input
          type="text"
          value={form.model}
          onChange={(e) => onChange('model', e.target.value)}
          placeholder="Tapo C200"
        />
      </div>
    </div>

    <div className="form-group">
      <label>Snapshot URL</label>
      <input
        type="text"
        value={form.snapshotUrl}
        onChange={(e) => onChange('snapshotUrl', e.target.value)}
        placeholder="http://192.168.1.50/snap.jpg"
      />
    </div>
    <div className="form-group">
      <label>RTSP URL</label>
      <input
        type="text"
        value={form.rtspUrl}
        onChange={(e) => onChange('rtspUrl', e.target.value)}
        placeholder="rtsp://192.168.1.50:554/stream1"
      />
    </div>
    <div className="form-group">
      <label>ONVIF URL</label>
      <input
        type="text"
        value={form.onvifUrl}
        onChange={(e) => onChange('onvifUrl', e.target.value)}
        placeholder="http://192.168.1.50:80/onvif/device_service"
      />
    </div>

    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
      <div className="form-group">
        <label>Cam User</label>
        <input
          type="text"
          value={form.camUsername}
          onChange={(e) => onChange('camUsername', e.target.value)}
          placeholder="admin"
        />
      </div>
      <div className="form-group">
        <label>Cam Password</label>
        <input
          type="password"
          value={form.camPassword}
          onChange={(e) => onChange('camPassword', e.target.value)}
          placeholder={mode === 'edit' ? '(คงเดิม)' : '••••••'}
        />
      </div>
      <div className="form-group">
        <label>Auth Mode</label>
        <select
          value={form.authMode}
          onChange={(e) => onChange('authMode', e.target.value as CamAuthMode)}
        >
          <option value="auto">auto (ตรวจจับอัตโนมัติ)</option>
          <option value="digest">digest</option>
          <option value="basic">basic</option>
          <option value="query">query</option>
        </select>
      </div>
      <div className="form-group">
        <label>Keep-Alive Port</label>
        <input
          type="text"
          value={form.keepAlivePort}
          onChange={(e) => onChange('keepAlivePort', e.target.value)}
          placeholder="auto หรือ 80 / 554"
        />
      </div>
    </div>
  </div>
);
