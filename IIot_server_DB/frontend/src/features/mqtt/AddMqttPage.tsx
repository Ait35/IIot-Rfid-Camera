import React, { useState, useEffect } from 'react';
import { Radio, Plus, ArrowLeft, Eye, EyeOff } from 'lucide-react';
import { api } from '../../services/api';
import type { GroupInfo, DeviceInfo } from '../../types';
import { MqttTopicBuilder } from './components/MqttTopicBuilder';

interface AddMqttPageProps {
  devices: DeviceInfo[];
  onCreated: () => void;
  onCancel: () => void;
  showToast: (msg: string, type: 'success' | 'error' | 'info') => void;
}

export const AddMqttPage: React.FC<AddMqttPageProps> = ({
  devices,
  onCreated,
  onCancel,
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
    api
      .getGroups(1, 100, false)
      .then((res) => {
        if (res.success && Array.isArray(res.data)) {
          setGroups(res.data);
          if (res.data.length > 0) {
            setGroupId(res.data[0].group_id);
          }
        }
      })
      .catch(() => {
        showToast('ไม่สามารถโหลดรายการกลุ่มอุปกรณ์ได้', 'error');
      });
  }, [showToast]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const trimmedTopic = topic.trim();
    const trimmedUser = userMqtt.trim();
    const trimmedPass = passMqtt.trim();

    if (!groupId) {
      showToast('กรุณาเลือกกลุ่มอุปกรณ์', 'error');
      return;
    }
    if (!trimmedTopic) {
      showToast('กรุณาระบุ MQTT Topic', 'error');
      return;
    }
    if (trimmedPass && !trimmedUser) {
      showToast('หากระบุ Password กรุณาระบุ MQTT Username ด้วย', 'error');
      return;
    }

    setIsSaving(true);
    try {
      const payload: {
        topic: string;
        group_id: number;
        user_mqtt?: string;
        pass_mqtt?: string;
      } = {
        topic: trimmedTopic,
        group_id: Number(groupId),
      };
      if (trimmedUser) payload.user_mqtt = trimmedUser;
      if (trimmedPass) payload.pass_mqtt = trimmedPass;

      const res = await api.createMqtt(payload);
      if (res.success) {
        showToast(`เพิ่มการตั้งค่า MQTT "${trimmedTopic}" สำเร็จ`, 'success');
        onCreated();
      } else {
        showToast(res.error || 'ไม่สามารถเพิ่มการตั้งค่า MQTT ได้', 'error');
      }
    } catch {
      showToast('เกิดข้อผิดพลาดในการเชื่อมต่อเซิร์ฟเวอร์', 'error');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="devices-page">
      <div className="page-header-row">
        <div>
          <h2>เพิ่มการตั้งค่า MQTT ใหม่</h2>
          <p className="page-sub">
            กำหนด Topic และข้อมูลรับรอง MQTT Broker สำหรับกลุ่มอุปกรณ์ (1 กลุ่มต่อ 1 การตั้งค่า MQTT)
          </p>
        </div>

        <button type="button" className="btn btn-secondary btn-sm" onClick={onCancel}>
          <ArrowLeft size={15} />
          <span>ย้อนกลับ</span>
        </button>
      </div>

      <div className="history-table-card" style={{ maxWidth: '760px', padding: '24px' }}>
        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}>
          <div className="form-section-box">
            <div className="form-section-title">
              <Radio size={15} style={{ display: 'inline', marginRight: '6px' }} />
              ข้อมูล Topic &amp; กลุ่มอุปกรณ์
            </div>

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
            <div className="form-section-title">ข้อมูลรับรอง MQTT Broker (ไม่บังคับ)</div>

            <div className="form-group">
              <label>MQTT Username (Unique)</label>
              <input
                type="text"
                maxLength={50}
                value={userMqtt}
                onChange={(e) => setUserMqtt(e.target.value)}
                placeholder="เช่น mqtt_gate1"
                disabled={isSaving}
              />
            </div>

            <div className="form-group">
              <label>MQTT Password</label>
              <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
                <input
                  type={showPassword ? 'text' : 'password'}
                  maxLength={100}
                  value={passMqtt}
                  onChange={(e) => setPassMqtt(e.target.value)}
                  placeholder="กรอกรหัสผ่าน (ระบบจะเข้ารหัส Bcrypt ให้อัตโนมัติ)"
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

          <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end' }}>
            <button
              type="button"
              className="btn btn-secondary"
              onClick={onCancel}
              disabled={isSaving}
            >
              ยกเลิก
            </button>
            <button type="submit" className="btn btn-primary" disabled={isSaving}>
              <Plus size={15} />
              <span>{isSaving ? 'กำลังสร้าง...' : 'บันทึกการตั้งค่า MQTT'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
