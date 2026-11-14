import React, { useState } from 'react';
import { PlusCircle, Layers, Save, ArrowLeft } from 'lucide-react';
import { api } from '../services/api';

interface AddGroupPageProps {
  onGroupsChanged: () => void;
  onNavigate: (tab: string) => void;
  showToast: (msg: string, type: 'success' | 'error' | 'info') => void;
}

export const AddGroupPage: React.FC<AddGroupPageProps> = ({
  onGroupsChanged,
  onNavigate,
  showToast,
}) => {
  const [groupName, setGroupName] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = groupName.trim();
    if (trimmed.length < 2) {
      showToast('ชื่อกลุ่มต้องมีความยาวอย่างน้อย 2 ตัวอักษร', 'error');
      return;
    }

    setIsSaving(true);
    try {
      const res = await api.createGroup({ group_name: trimmed });
      if (res.success) {
        showToast(`สร้างกลุ่ม "${trimmed}" สำเร็จ`, 'success');
        setGroupName('');
        onGroupsChanged();
        onNavigate('group_manager');
      } else {
        showToast(res.error || 'ไม่สามารถสร้างกลุ่มได้ (อาจมีชื่อกลุ่มซ้ำ)', 'error');
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
          <h2 style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <PlusCircle size={22} className="text-pink" />
            <span>เพิ่มกลุ่มอุปกรณ์ใหม่ (Add Group)</span>
          </h2>
          <p className="page-sub">
            สร้างกลุ่มใหม่สำหรับจัดหมวดหมู่เครื่องอ่าน RFID, กล้อง MCU และกล้อง IP Camera ตามห้องหรืออาคาร
          </p>
        </div>

        <button
          type="button"
          className="btn btn-secondary btn-sm"
          onClick={() => onNavigate('group_manager')}
        >
          <ArrowLeft size={15} />
          <span>กลับไปหน้า Manager</span>
        </button>
      </div>

      <div className="history-table-card" style={{ padding: '24px', maxWidth: '640px' }}>
        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}>
          <div className="form-section-box">
            <div className="form-section-title" style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <Layers size={15} className="text-pink" />
              <span>ข้อมูลกลุ่มอุปกรณ์</span>
            </div>

            <div className="form-group">
              <label>ชื่อกลุ่มอุปกรณ์ (Group Name) *</label>
              <input
                type="text"
                required
                minLength={2}
                maxLength={50}
                value={groupName}
                onChange={(e) => setGroupName(e.target.value)}
                placeholder="เช่น Building 11 Lab 302 หรือ Zone A Entrance"
              />
              <span className="text-muted" style={{ fontSize: '12px' }}>
                ความยาว 2–50 ตัวอักษร ชื่อกลุ่มต้องไม่ซ้ำกับกลุ่มที่ใช้งานอยู่
              </span>
            </div>
          </div>

          <div
            style={{
              display: 'flex',
              justifyContent: 'flex-end',
              gap: '10px',
              paddingTop: '14px',
              borderTop: '1px solid var(--line)',
            }}
          >
            <button
              type="button"
              className="btn btn-secondary"
              onClick={() => setGroupName('')}
              disabled={isSaving}
            >
              ล้างค่า
            </button>
            <button type="submit" className="btn btn-primary" disabled={isSaving}>
              <Save size={16} />
              <span>{isSaving ? 'กำลังสร้างกลุ่ม...' : 'บันทึกและเพิ่มกลุ่ม'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
