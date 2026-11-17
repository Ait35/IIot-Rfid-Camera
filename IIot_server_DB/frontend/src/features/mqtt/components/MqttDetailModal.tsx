import React, { useState } from 'react';
import { X, Radio, Edit3, Info, Copy, Check, KeyRound } from 'lucide-react';
import type { MqttInfo } from '../../../types';
import { formatThaiDateTime } from '../../../services/utils';

interface MqttDetailModalProps {
  isOpen: boolean;
  mqtt: MqttInfo | null;
  onClose: () => void;
  onEdit?: () => void;
}

export const MqttDetailModal: React.FC<MqttDetailModalProps> = ({
  isOpen,
  mqtt,
  onClose,
  onEdit,
}) => {
  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  if (!isOpen || !mqtt) return null;

  const hasPassword = Boolean(mqtt.pass_mqtt && mqtt.pass_mqtt.length > 0);
  const formattedCreatedAt = formatThaiDateTime(mqtt.created_at);

  const groupSeg = `group${mqtt.group_id}`;
  const assembledTopics = [
    { key: 'rfid', label: 'RFID Scan (Pub)', value: `SPU/rfid/${groupSeg}/${mqtt.topic}/<mac>` },
    { key: 'status', label: 'Device Status (Pub)', value: `SPU/status/${groupSeg}/${mqtt.topic}/<mac>` },
    { key: 'cam', label: 'Camera Trigger (Sub)', value: `SPU/CAM/${groupSeg}/${mqtt.topic}/broadcast` },
    { key: 'cmd', label: 'Board Command (Sub)', value: `SPU/CMD/${groupSeg}/${mqtt.topic}/broadcast` },
  ];

  const handleCopy = async (key: string, text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedKey(key);
      setTimeout(() => setCopiedKey(null), 1800);
    } catch {
      // Ignore clipboard errors in non-HTTPS contexts
    }
  };

  return (
    <div className="modal-backdrop active" onClick={onClose}>
      <div
        className="modal-card"
        style={{ maxWidth: '680px', width: '95%', maxHeight: '90vh', overflowY: 'auto' }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="modal-head">
          <div className="modal-title-wrap">
            <Radio size={19} className="text-pink" />
            <div>
              <h3>SPU/.../{groupSeg}/{mqtt.topic}</h3>
              <p className="modal-sub">
                MQTT ID #{mqtt.mqtt_id} · กลุ่ม {mqtt.group_name || `#${mqtt.group_id}`}
              </p>
            </div>
          </div>
          <button className="btn-ghost icon-btn" onClick={onClose} aria-label="Close modal">
            <X size={18} />
          </button>
        </div>

        <div className="modal-body-form" style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '12px' }}>
            <div className="summary-stat-box" style={{ padding: '12px 14px' }}>
              <span className="stat-num" style={{ fontSize: '20px' }}>#{mqtt.mqtt_id}</span>
              <span className="stat-label">รหัส MQTT (ID)</span>
            </div>
            <div className="summary-stat-box" style={{ padding: '12px 14px' }}>
              <span className="stat-num" style={{ fontSize: '18px' }}>
                {mqtt.group_name || `#${mqtt.group_id}`}
              </span>
              <span className="stat-label">กลุ่มอุปกรณ์ ({groupSeg})</span>
            </div>
            <div className="summary-stat-box" style={{ padding: '12px 14px' }}>
              <span className="stat-num" style={{ fontSize: '16px' }}>
                {mqtt.is_delete ? 'ปิดใช้งาน' : 'ใช้งานอยู่'}
              </span>
              <span className="stat-label">สถานะการตั้งค่า</span>
            </div>
          </div>

          <div className="form-section-box">
            <div className="form-section-title">
              <Info size={14} style={{ display: 'inline', marginRight: '6px' }} />
              รายละเอียด Topic และการเชื่อมต่อ
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', fontSize: '13px' }}>
              <div style={{ gridColumn: '1 / -1' }}>
                <div className="text-muted">ค่า Topic ตรงกลางในฐานข้อมูล (mqtt.topic)</div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '4px' }}>
                  <code style={{ fontWeight: 700, fontSize: '14px', color: 'var(--pink)' }}>{mqtt.topic}</code>
                  <button
                    type="button"
                    className="btn btn-secondary btn-sm"
                    onClick={() => handleCopy('raw', mqtt.topic)}
                    title="คัดลอกค่า Topic"
                    style={{ padding: '2px 8px', fontSize: '12px' }}
                  >
                    {copiedKey === 'raw' ? <Check size={13} /> : <Copy size={13} />}
                    <span>{copiedKey === 'raw' ? 'คัดลอกแล้ว' : 'คัดลอก'}</span>
                  </button>
                </div>
              </div>

              <div style={{ gridColumn: '1 / -1' }}>
                <div className="text-muted" style={{ marginBottom: '6px' }}>
                  Topic เต็มที่ Firmware และ Server ประกอบใช้งานจริง
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                  {assembledTopics.map((item) => (
                    <div
                      key={item.key}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        gap: '8px',
                        padding: '6px 10px',
                        background: 'var(--canvas)',
                        borderRadius: 'var(--radius-sm)',
                        border: '1px solid var(--line)',
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                        <span className="badge badge-gray" style={{ minWidth: '130px', textAlign: 'center' }}>
                          {item.label}
                        </span>
                        <code style={{ fontSize: '12.5px', fontWeight: 600 }}>{item.value}</code>
                      </div>
                      <button
                        type="button"
                        className="btn-ghost icon-btn"
                        onClick={() => handleCopy(item.key, item.value)}
                        title={`คัดลอก ${item.label}`}
                      >
                        {copiedKey === item.key ? <Check size={14} className="text-pink" /> : <Copy size={14} />}
                      </button>
                    </div>
                  ))}
                </div>
              </div>

              <div>
                <div className="text-muted">MQTT Username</div>
                <div style={{ fontWeight: 600, marginTop: '2px' }}>
                  {mqtt.user_mqtt ? <code>{mqtt.user_mqtt}</code> : <span className="text-muted">- (ไม่ได้กำหนด)</span>}
                </div>
              </div>

              <div>
                <div className="text-muted">รหัสผ่าน (Password)</div>
                <div style={{ marginTop: '4px' }}>
                  {hasPassword ? (
                    <span className="badge badge-active" style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                      <KeyRound size={12} />
                      ตั้งรหัสผ่านแล้ว (เข้ารหัส Bcrypt)
                    </span>
                  ) : (
                    <span className="badge badge-gray">ไม่ได้ตั้งรหัสผ่าน</span>
                  )}
                </div>
              </div>

              <div>
                <div className="text-muted">ผู้สร้าง / อัปเดตล่าสุด</div>
                <div style={{ fontWeight: 500, marginTop: '2px' }}>{mqtt.by_user_name || '-'}</div>
              </div>

              <div>
                <div className="text-muted">วันที่สร้าง</div>
                <div style={{ fontWeight: 500, marginTop: '2px' }}>{formattedCreatedAt}</div>
              </div>
            </div>
          </div>
        </div>

        <div className="modal-foot">
          <button type="button" className="btn btn-secondary" onClick={onClose}>
            ปิดหน้าต่าง
          </button>
          {onEdit && (
            <button type="button" className="btn btn-primary" onClick={onEdit}>
              <Edit3 size={15} />
              <span>แก้ไขการตั้งค่า MQTT</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
