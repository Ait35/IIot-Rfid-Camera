import React, { useState, useEffect } from 'react';
import { X, Save, Layers } from 'lucide-react';
import { api } from '../../../services/api';
import type { GroupInfo } from '../../../types';

interface GroupFormModalProps {
  isOpen: boolean;
  initialGroup: GroupInfo | null;
  onClose: () => void;
  onSaved: () => void;
  showToast: (msg: string, type: 'success' | 'error' | 'info') => void;
}

export const GroupFormModal: React.FC<GroupFormModalProps> = ({
  isOpen,
  initialGroup,
  onClose,
  onSaved,
  showToast,
}) => {
  const [groupName, setGroupName] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (isOpen && initialGroup) {
      setGroupName(initialGroup.group_name || '');
    }
  }, [isOpen, initialGroup]);

  if (!isOpen || !initialGroup) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = groupName.trim();
    if (trimmed.length < 2) {
      showToast('ชื่อกลุ่มต้องมีความยาวอย่างน้อย 2 ตัวอักษร', 'error');
      return;
    }

    setIsSaving(true);
    try {
      const res = await api.patchGroup({
        group_id: initialGroup.group_id,
        group_name: trimmed,
      });

      if (res.success) {
        showToast(`แก้ไขกลุ่ม "${trimmed}" สำเร็จ`, 'success');
        onSaved();
        onClose();
      } else {
        showToast(res.error || 'ไม่สามารถแก้ไขข้อมูลกลุ่มได้', 'error');
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
        style={{ maxWidth: '480px', width: '95%' }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="modal-head">
          <div className="modal-title-wrap">
            <Layers size={18} className="text-pink" />
            <div>
              <h3>แก้ไขข้อมูลกลุ่ม #{initialGroup.group_id}</h3>
              <p className="modal-sub">ปรับปรุงชื่อกลุ่มอุปกรณ์สำหรับจัดหมวดหมู่ในระบบ</p>
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
              <div className="form-section-title">ข้อมูลกลุ่มอุปกรณ์</div>
              <div className="form-group">
                <label>Group ID</label>
                <input type="text" value={`#${initialGroup.group_id}`} disabled />
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
                  placeholder="เช่น Building 11 Floor 1"
                />
              </div>
            </div>
          </div>

          <div className="modal-foot" style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
            <button type="button" className="btn btn-secondary btn-sm" onClick={onClose} disabled={isSaving}>
              ยกเลิก
            </button>
            <button type="submit" className="btn btn-primary btn-sm" disabled={isSaving}>
              <Save size={15} />
              <span>{isSaving ? 'กำลังบันทึก...' : 'บันทึกการแก้ไข'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
