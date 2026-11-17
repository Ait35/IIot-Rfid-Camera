import React, { useState } from 'react';
import { UserPlus, ArrowLeft, ShieldAlert, Users } from 'lucide-react';
import { api } from '../../services/api';
import type { User } from '../../types';
import { PasswordField } from '../../components/common/PasswordField';
import { type AccountRole, isPrivilegedRole, ROLE_OPTIONS } from './accountHelpers';

interface AddAccountPageProps {
  currentUser: User | null;
  onCreated: () => void;
  onCancel: () => void;
  showToast: (msg: string, type: 'success' | 'error' | 'info') => void;
}

export const AddAccountPage: React.FC<AddAccountPageProps> = ({
  currentUser,
  onCreated,
  onCancel,
  showToast,
}) => {
  const [universityId, setUniversityId] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [role, setRole] = useState<AccountRole>('admin');
  const [showPassword, setShowPassword] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  const currentRole = currentUser?.role || 'admin';
  const canCreate = isPrivilegedRole(currentRole);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const trimmedUid = universityId.trim();
    const trimmedPass = password.trim();

    if (!canCreate) {
      showToast('เฉพาะสิทธิ์ Dev หรือ Teacher เท่านั้นที่สามารถเพิ่มบัญชีใหม่ได้', 'error');
      return;
    }
    if (!trimmedUid || !trimmedPass) {
      showToast('กรุณากรอกรหัสประจำตัวและรหัสผ่านให้ครบถ้วน', 'error');
      return;
    }
    if (trimmedPass.length < 4) {
      showToast('รหัสผ่านต้องมีความยาวอย่างน้อย 4 ตัวอักษร', 'error');
      return;
    }
    if (trimmedPass !== confirmPassword.trim()) {
      showToast('รหัสผ่านและการยืนยันรหัสผ่านไม่ตรงกัน', 'error');
      return;
    }

    setIsSaving(true);
    try {
      const res = await api.createAccount({
        university_id: trimmedUid,
        password: trimmedPass,
        role,
      });

      if (res.success) {
        showToast(`เพิ่มบัญชีผู้ใช้ "${trimmedUid}" (${role}) สำเร็จ`, 'success');
        onCreated();
      } else {
        showToast(res.error || 'ไม่สามารถเพิ่มบัญชีผู้ใช้ได้', 'error');
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
          <h2 style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <UserPlus size={22} className="text-pink" />
            <span>เพิ่มบัญชีผู้ใช้ใหม่ (Add Account)</span>
          </h2>
          <p className="page-sub">
            ลงทะเบียนผู้ใช้งานใหม่โดยดึงข้อมูลชื่อ-นามสกุลจากฐานข้อมูลกลางมหาวิทยาลัยอัตโนมัติ (เฉพาะ Dev / Teacher)
          </p>
        </div>

        <button type="button" className="btn btn-secondary btn-sm" onClick={onCancel}>
          <ArrowLeft size={15} />
          <span>กลับหน้า Manager</span>
        </button>
      </div>

      {!canCreate && (
        <div
          className="offline-alert-banner"
          style={{
            maxWidth: '720px',
            background: 'var(--red-soft)',
            borderColor: '#fecaca',
            color: 'var(--red)',
            gap: '12px',
          }}
        >
          <ShieldAlert size={20} style={{ flexShrink: 0 }} />
          <div>
            <div style={{ fontWeight: 700 }}>
              บัญชีระดับ {currentRole} ไม่มีสิทธิ์เพิ่มบัญชีผู้ใช้ใหม่
            </div>
            <div style={{ fontSize: '12.5px', opacity: 0.9, marginTop: '2px' }}>
              กรุณาติดต่อผู้ใช้งานระดับ <b>dev</b> หรือ <b>teacher</b> เพื่อสร้างบัญชีใหม่
            </div>
          </div>
        </div>
      )}

      <div className="history-table-card" style={{ maxWidth: '720px', padding: '24px' }}>
        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}>
          <div className="form-section-box">
            <div className="form-section-title">
              <span style={{ display: 'inline-flex', alignItems: 'center', gap: '8px' }}>
                <Users size={15} className="text-pink" />
                <span>ข้อมูลบัญชีผู้ใช้และสิทธิ์การใช้งาน</span>
              </span>
            </div>

            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))',
                gap: '14px',
              }}
            >
              <div className="form-group">
                <label className="form-label">
                  <span>รหัสประจำตัว (University ID)</span>
                  <span className="req"> *</span>
                </label>
                <input
                  type="text"
                  required
                  value={universityId}
                  onChange={(e) => setUniversityId(e.target.value)}
                  placeholder="เช่น 67000123 หรือ T0001"
                  disabled={isSaving || !canCreate}
                />
              </div>

              <div className="form-group">
                <label className="form-label">
                  <span>สิทธิ์การใช้งานเริ่มต้น (Role)</span>
                  <span className="req"> *</span>
                </label>
                <select
                  value={role}
                  onChange={(e) => setRole(e.target.value as AccountRole)}
                  disabled={isSaving || !canCreate}
                >
                  {ROLE_OPTIONS.map((opt) => (
                    <option key={opt.value} value={opt.value}>
                      {opt.label}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))',
                gap: '14px',
              }}
            >
              <PasswordField
                label="รหัสผ่าน (อย่างน้อย 4 ตัวอักษร)"
                required
                value={password}
                onChange={setPassword}
                placeholder="ตั้งรหัสผ่านสำหรับบัญชีนี้"
                disabled={isSaving || !canCreate}
                showPassword={showPassword}
                onToggleShow={() => setShowPassword((prev) => !prev)}
              />

              <PasswordField
                label="ยืนยันรหัสผ่าน"
                required
                value={confirmPassword}
                onChange={setConfirmPassword}
                placeholder="กรอกรหัสผ่านอีกครั้ง"
                disabled={isSaving || !canCreate}
                showPassword={showPassword}
              />
            </div>
          </div>

          <div
            style={{
              display: 'flex',
              justifyContent: 'flex-end',
              gap: '10px',
              paddingTop: '12px',
              borderTop: '1px solid var(--line)',
            }}
          >
            <button type="button" className="btn btn-secondary" onClick={onCancel} disabled={isSaving}>
              ยกเลิก
            </button>
            <button type="submit" className="btn btn-primary" disabled={isSaving || !canCreate}>
              <UserPlus size={15} />
              <span>{isSaving ? 'กำลังสร้างบัญชี...' : 'สร้างบัญชีผู้ใช้'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
