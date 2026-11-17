import React, { useState } from 'react';
import type { DeviceInfo } from '../../../types';

interface MqttTopicBuilderProps {
  value: string;
  onChange: (roomTopic: string) => void;
  selectedGroupId: number | '';
  devices?: DeviceInfo[];
  disabled?: boolean;
}

const PREVIEW_CHANNELS = [
  { value: 'rfid', label: 'rfid (สแกนแท็ก)' },
  { value: 'CAM', label: 'CAM (สั่งกล้องถ่ายรูป)' },
];

export const MqttTopicBuilder: React.FC<MqttTopicBuilderProps> = ({
  value,
  onChange,
  selectedGroupId,
  disabled = false,
}) => {
  const [previewChannel, setPreviewChannel] = useState<'rfid' | 'CAM'>('rfid');

  const groupSegment = selectedGroupId ? `group${selectedGroupId}` : 'group?';
  const cleanRoomTopic = value.replace(/^\/+|\/+$/g, '').trim();
  const displayMiddle = cleanRoomTopic || '<room_topic>';

  const handleRoomTopicChange = (raw: string) => {
    const sanitized = raw.replace(/^\/+/, '');
    onChange(sanitized);
  };

  const autoSuffix = previewChannel === 'CAM' ? 'broadcast' : '<mac>';

  return (
    <div className="form-group">
      <label>
        โครงสร้าง MQTT Topic (กรอกเฉพาะส่วนกลาง ระบบประกอบที่เหลือให้อัตโนมัติ) *
      </label>

      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'auto auto auto minmax(160px, 1fr) auto',
          gap: '6px',
          alignItems: 'center',
        }}
      >
        {/* 1. Fixed SPU */}
        <div
          style={{
            minHeight: '42px',
            padding: '0 10px',
            display: 'flex',
            alignItems: 'center',
            background: 'var(--pink-soft)',
            color: 'var(--pink)',
            fontWeight: 700,
            fontSize: '13px',
            borderRadius: 'var(--radius-sm)',
            border: '1px solid var(--line)',
            whiteSpace: 'nowrap',
            userSelect: 'none',
          }}
          title="คำนำหน้าถาวร"
        >
          SPU /
        </div>

        {/* 2. Preview Channel (rfid / CAM only) */}
        <select
          value={previewChannel}
          onChange={(e) => setPreviewChannel(e.target.value as 'rfid' | 'CAM')}
          disabled={disabled}
          style={{ minWidth: '145px' }}
          title="เลือกดูตัวอย่างเส้นทาง RFID หรือ CAM (ระบบสร้างให้อัตโนมัติทั้งคู่)"
        >
          {PREVIEW_CHANNELS.map((c) => (
            <option key={c.value} value={c.value}>
              {c.label}
            </option>
          ))}
        </select>

        {/* 3. Fixed Group Segment */}
        <div
          style={{
            minHeight: '42px',
            padding: '0 10px',
            display: 'flex',
            alignItems: 'center',
            background: 'var(--surface-alt)',
            color: 'var(--ink-secondary)',
            fontWeight: 700,
            fontSize: '13px',
            borderRadius: 'var(--radius-sm)',
            border: '1px solid var(--line)',
            whiteSpace: 'nowrap',
            userSelect: 'none',
          }}
          title="ผูกตามกลุ่มอุปกรณ์ที่เลือก"
        >
          {groupSegment} /
        </div>

        {/* 4. Editable Middle Topic (Stored in DB) */}
        <input
          type="text"
          required
          maxLength={100}
          value={value}
          disabled={disabled}
          placeholder="ใส่เฉพาะส่วนกลาง เช่น b9/f1/room1"
          onChange={(e) => handleRoomTopicChange(e.target.value)}
          style={{ borderColor: 'var(--pink-bright)' }}
        />

        {/* 5. Fixed Auto Suffix */}
        <div
          style={{
            minHeight: '42px',
            padding: '0 10px',
            display: 'flex',
            alignItems: 'center',
            background: 'var(--surface-alt)',
            color: 'var(--muted)',
            fontWeight: 600,
            fontSize: '12.5px',
            borderRadius: 'var(--radius-sm)',
            border: '1px solid var(--line)',
            whiteSpace: 'nowrap',
            userSelect: 'none',
          }}
          title="Firmware และ Server เติม MAC / broadcast ให้อัตโนมัติ"
        >
          / {autoSuffix}
        </div>
      </div>

      {/* Live Preview of Stored Value + Auto-assembled Topics */}
      <div
        style={{
          marginTop: '10px',
          padding: '10px 12px',
          background: 'var(--canvas)',
          border: '1px dashed var(--line)',
          borderRadius: 'var(--radius-sm)',
          fontSize: '12px',
          display: 'flex',
          flexDirection: 'column',
          gap: '5px',
        }}
      >
        <div>
          <span className="text-muted">ค่าที่บันทึกลง DB (`mqtt.topic`): </span>
          <code style={{ fontWeight: 700, color: 'var(--pink)' }}>{displayMiddle}</code>
        </div>
        <div>
          <span className="text-muted">📡 RFID Scan: </span>
          <code>SPU/rfid/{groupSegment}/{displayMiddle}/&lt;mac&gt;</code>
        </div>
        <div>
          <span className="text-muted">📸 Camera Trigger: </span>
          <code>SPU/CAM/{groupSegment}/{displayMiddle}/broadcast</code>
        </div>
        <div className="text-muted" style={{ fontSize: '11.5px' }}>
          (ส่วน <code>status</code> และ <code>CMD</code> ระบบ Firmware &amp; Server ประกอบให้อัตโนมัติจากค่าเดียวกันนี้)
        </div>
      </div>
    </div>
  );
};
