import React, { useState } from 'react';
import { X, Save, UserCog, Lock } from 'lucide-react';
import { api } from '../../../services/api';
import type { User } from '../../../types';
import { PasswordField } from '../../../components/common/PasswordField';
import {
  type AccountRole,
  isPrivilegedRole,
  normalizeAccountRole,
  ROLE_OPTIONS,
} from '../accountHelpers';

interface AccountFormModalProps {
  isOpen: boolean;
  initialUser: User | null;
  currentUserRole: string;
  onClose: () => void;
  onSaved: () => void;
  showToast: (msg: string, type: 'success' | 'error' | 'info') => void;
}

export const AccountFormModal: React.FC<AccountFormModalProps> = ({
  isOpen,
  initialUser,
  currentUserRole,
  onClose,
  onSaved,
  showToast,
}) => {
  const modalKey = isOpen && initialUser ? `${initialUser.user_id}|${initialUser.role}` : '';
  const [lastModalKey, setLastModalKey] = useState(modalKey);
  const [role, setRole] = useState<AccountRole>(() => normalizeAccountRole(initialUser?.role));
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  if (modalKey !== lastModalKey) {
    setLastModalKey(modalKey);
    if (isOpen && initialUser) {
      setRole(normalizeAccountRole(initialUser.role));
      setPassword('');
      setShowPassword(false);
    }
  }

  if (!isOpen || !initialUser) return null;

  const privilegedActor = isPrivilegedRole(currentUserRole);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const trimmedPassword = password.trim();
    const roleChanged = role !== initialUser.role;

    if (!roleChanged && !trimmedPassword) {
      showToast('กรุณาแก้ไขสิทธิ์ (Role) หรือระบุรหัสผ่านใหม่อย่างน้อย 1 อย่าง', 'error');
      return;
    }

    if (trimmedPassword && trimmedPassword.length < 4) {
      showToast('รหัสผ่านใหม่ต้องมีความยาวอย่างน้อย 4 ตัวอักษร', 'error');
      return;
    }

    setIsSaving(true);
    try {
      const payload: {
        traget_id: number;
        role?: AccountRole;
        password?: string;
      } = {
        traget_id: initialUser.user_id,
      };

      if (roleChanged) payload.role = role;
      if (trimmedPassword) payload.password = trimmedPassword;

      const res = await api.patchAccount(payload);
      if (res.success) {
        showToast(
          `แก้ไขบัญชี #${initialUser.user_id} (${initialUser.university_id}) สำเร็จ`,
          'success'
        );
        onSaved();
        onClose();
      } else {
        showToast(res.error || 'ไม่สามารถแก้ไขข้อมูลบัญชีได้', 'error');
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
        style={{ maxWidth: '560px', width: '95%' }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="modal-head">
          <div className="modal-title-wrap">
            <UserCog size={18} className="text-pink" />
            <div>
              <h3>แก้ไขบัญชีผู้ใช้ #{initialUser.user_id}</h3>
              <p className="modal-sub">ปรับปรุงสิทธิ์การใช้งาน (Role) หรือตั้งรหัสผ่านใหม่</p>
            </div>
          </div>
          <button
            type="button"
            className="btn-ghost"
            onClick={onClose}
            disabled={isSaving}
            aria-label="Close modal"
          >
            <X size={18} />
          </button>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="modal-body-form" style={{ gap: '16px' }}>
            <div className="form-section-box">
              <div className="form-section-title">
                <span style={{ display: 'inline-flex', alignItems: 'center', gap: '8px' }}>
                  <Lock size={14} className="text-muted" />
                  <span>ข้อมูลพื้นฐานจากระบบมหาวิทยาลัย</span>
                </span>
              </div>

              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
                  gap: '12px',
                }}
              >
                <div className="form-group">
                  <label>รหัสประจำตัว (University ID)</label>
                  <input type="text" value={initialUser.university_id} disabled />
                </div>
                <div className="form-group">
                  <label>ชื่อ - นามสกุล</label>
                  <input
                    type="text"
                    value={`${initialUser.first_name} ${initialUser.last_name}`.trim()}
                    disabled
                  />
                </div>
              </div>
            </div>

            <div className="form-section-box">
              <div className="form-section-title">สิทธิ์การใช้งานและรหัสผ่าน</div>

              <div className="form-group">
                <label>สิทธิ์การใช้งาน (Role)</label>
                <select
                  value={role}
                  onChange={(e) => setRole(e.target.value as AccountRole)}
                  disabled={isSaving}
                >
                  {ROLE_OPTIONS.map((opt) => {
                    const locked = Boolean(opt.privileged && !privilegedActor);
                    return (
                      <option key={opt.value} value={opt.value} disabled={locked}>
                        {opt.label}
                        {locked ? ' — เฉพาะ Dev/Teacher' : ''}
                      </option>
                    );
                  })}
                </select>
              </div>

              <PasswordField
                label="รหัสผ่านใหม่ (อย่างน้อย 4 ตัวอักษร)"
                value={password}
                onChange={setPassword}
                placeholder="เว้นว่างไว้หากไม่ต้องการเปลี่ยนรหัสผ่าน"
                disabled={isSaving}
                showPassword={showPassword}
                onToggleShow={() => setShowPassword((prev) => !prev)}
              />
            </div>
          </div>

          <div className="modal-foot">
            <button
              type="button"
              className="btn btn-secondary btn-sm"
              onClick={onClose}
              disabled={isSaving}
            >
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
