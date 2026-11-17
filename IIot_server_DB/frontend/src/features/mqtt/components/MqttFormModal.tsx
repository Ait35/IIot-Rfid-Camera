import React, { useState, useEffect } from 'react';
import { X, Save, Radio, Eye, EyeOff } from 'lucide-react';
import { api } from '../../../services/api';
import type { MqttInfo, GroupInfo, DeviceInfo } from '../../../types';
import { MqttTopicBuilder } from './MqttTopicBuilder';

interface MqttFormModalProps {
  isOpen: boolean;
  initialMqtt: MqttInfo | null;
  devices: DeviceInfo[];
  onClose: () => void;
  onSaved: () => void;
  showToast: (msg: string, type: 'success' | 'error' | 'info') => void;
}

export const MqttFormModal: React.FC<MqttFormModalProps> = ({
  isOpen,
  initialMqtt,
  devices,
  onClose,
  onSaved,
  showToast,
}) => {
  const [groups, setGroups] = useState<GroupInfo[]>([]);
  const [groupId, setGroupId] = useState<number | ''>('');
  const [topic, setTopic] = useState('');
  const [userMqtt, setUserMqtt] = useState('');
  const [passMqtt, setPassMqtt] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (!isOpen) return;
    api
      .getGroups(1, 100, false)
      .then((res) => {
        if (res.success && Array.isArray(res.data)) {
          setGroups(res.data);
        }
      })
      .catch(() => {
        // Group list fallback handled gracefully
      });
  }, [isOpen]);

  useEffect(() => {
    if (isOpen && initialMqtt) {
      setGroupId(initialMqtt.group_id);
      setTopic(initialMqtt.topic || '');
      setUserMqtt(initialMqtt.user_mqtt || '');
      setPassMqtt('');
      setShowPassword(false);
    }
  }, [isOpen, initialMqtt]);

  if (!isOpen || !initialMqtt) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const trimmedTopic = topic.trim();
    const trimmedUser = userMqtt.trim();
    const trimmedPass = passMqtt.trim();

    if (!trimmedTopic) {
      showToast('กรุณาระบุ MQTT Topic', 'error');
      return;
    }
    if (!groupId) {
      showToast('กรุณาเลือกกลุ่มอุปกรณ์', 'error');
      return;
    }
    if (trimmedPass && !trimmedUser) {
      showToast('หากตั้งรหัสผ่านใหม่ กรุณาระบุ MQTT Username ด้วย', 'error');
      return;
    }

    setIsSaving(true);
    try {
      const payload: {
        mqtt_id: number;
        topic: string;
        group_id: number;
        user_mqtt?: string;
        pass_mqtt?: string;
      } = {
        mqtt_id: initialMqtt.mqtt_id,
        topic: trimmedTopic,
        group_id: Number(groupId),
      };

      if (trimmedUser) {
        payload.user_mqtt = trimmedUser;
      }
      if (trimmedPass) {
        payload.pass_mqtt = trimmedPass;
      }

      const res = await api.patchMqtt(payload);
      if (res.success) {
        showToast(`แก้ไข MQTT #${initialMqtt.mqtt_id} สำเร็จ`, 'success');
        onSaved();
        onClose();
      } else {
        showToast(res.error || 'ไม่สามารถแก้ไขข้อมูล MQTT ได้', 'error');
      }
    } catch {
      showToast('เกิดข้อผิดพลาดในการเชื่อมต่อเซิร์ฟเวอร์', 'error');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="modal-backdrop active" onClick={() => !isSaving && onClose()}>
      <div
        className="modal-card"
        style={{ maxWidth: '660px', width: '95%' }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="modal-head">
          <div className="modal-title-wrap">
            <Radio size={18} className="text-pink" />
            <div>
              <h3>แก้ไขการตั้งค่า MQTT #{initialMqtt.mqtt_id}</h3>
              <p className="modal-sub">ปรับปรุง Topic, กลุ่มอุปกรณ์ และข้อมูลรับรอง Broker</p>
            </div>
          </div>
          <button
            type="button"
            className="btn-ghost icon-btn"
            onClick={onClose}
            disabled={isSaving}
            aria-label="Close modal"
          >
            <X size={18} />
          </button>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="modal-body-form" style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <div className="form-section-box">
              <div className="form-section-title">ข้อมูล Topic &amp; กลุ่มอุปกรณ์</div>

              <div className="form-group">
                <label>กลุ่มอุปกรณ์ (Group) *</label>
                <select
                  required
                  value={groupId}
                  onChange={(e) => setGroupId(e.target.value ? Number(e.target.value) : '')}
                  disabled={isSaving}
                >
                  <option value="">-- เลือกกลุ่มอุปกรณ์ --</option>
                  {groups.map((g) => (
                    <option key={g.group_id} value={g.group_id}>
                      {g.group_name} (#{g.group_id})
                    </option>
                  ))}
                </select>
              </div>

              <MqttTopicBuilder
                value={topic}
                onChange={setTopic}
                selectedGroupId={groupId}
                devices={devices}
                disabled={isSaving}
              />
            </div>

            <div className="form-section-box">
              <div className="form-section-title">ข้อมูลรับรอง (Authentication - ไม่บังคับ)</div>

              <div className="form-group">
                <label>MQTT Username (Unique)</label>
                <input
                  type="text"
                  maxLength={50}
                  value={userMqtt}
                  onChange={(e) => setUserMqtt(e.target.value)}
                  placeholder="เช่น mqtt_gate1 (เว้นว่างได้หากไม่ใช้)"
                  disabled={isSaving}
                />
              </div>

              <div className="form-group">
                <label>MQTT Password ใหม่</label>
                <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
                  <input
                    type={showPassword ? 'text' : 'password'}
                    maxLength={100}
                    value={passMqtt}
                    onChange={(e) => setPassMqtt(e.target.value)}
                    placeholder="เว้นว่างหากไม่เปลี่ยนรหัสผ่าน"
                    disabled={isSaving}
                    style={{ paddingRight: '38px', width: '100%' }}
                  />
                  <button
                    type="button"
                    className="btn-ghost icon-btn"
                    onClick={() => setShowPassword((prev) => !prev)}
                    style={{ position: 'absolute', right: '4px' }}
                    title={showPassword ? 'ซ่อนรหัสผ่าน' : 'แสดงรหัสผ่าน'}
                  >
                    {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
              </div>
            </div>
          </div>

          <div className="modal-foot">
            <button
              type="button"
              className="btn btn-secondary"
              onClick={onClose}
              disabled={isSaving}
            >
              ยกเลิก
            </button>
            <button type="submit" className="btn btn-primary" disabled={isSaving}>
              <Save size={15} />
              <span>{isSaving ? 'กำลังบันทึก...' : 'บันทึกการแก้ไข'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
