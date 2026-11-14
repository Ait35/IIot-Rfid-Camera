import React, { useState } from 'react';
import { UserPlus, User as UserIcon, Lock, Info, Zap } from 'lucide-react';
import { api, setToken, setUser } from '../services/api';
import type { User } from '../types';

interface SigninProps {
  onSuccess: (user: User) => void;
  onNavigateToLogin: () => void;
  showToast: (msg: string, type: 'success' | 'error' | 'info') => void;
}

export const Signin: React.FC<SigninProps> = ({ onSuccess, onNavigateToLogin, showToast }) => {
  const [universityId, setUniversityId] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!universityId.trim() || !password.trim()) {
      showToast('กรุณากรอกข้อมูลให้ครบถ้วน', 'error');
      return;
    }

    if (password !== confirmPassword) {
      showToast('รหัสผ่านและการยืนยันรหัสผ่านไม่ตรงกัน', 'error');
      return;
    }

    setIsLoading(true);
    try {
      const res = await api.signin(universityId.trim(), password.trim());
      if (res.success && res.data) {
        const userData = res.data;
        setToken(userData.token);
        setUser(userData);
        showToast(
          `ลงทะเบียนสำเร็จ! ยินดีต้อนรับ คุณ${userData.first_name} (${userData.role})`,
          'success'
        );
        onSuccess(userData);
      } else {
        showToast(
          res.error || res.message || 'ไม่พบข้อมูลรหัสมหาวิทยาลัยนี้ในระบบส่วนกลาง หรือพ้นสภาพ',
          'error'
        );
      }
    } catch {
      showToast('เชื่อมต่อเซิร์ฟเวอร์ไม่สำเร็จ', 'error');
    } finally {
      setIsLoading(false);
    }
  };

  const handleQuickFill = (uid: string, pass: string) => {
    setUniversityId(uid);
    setPassword(pass);
    setConfirmPassword(pass);
    showToast(`กรอกรหัสนักศึกษาทดสอบ: ${uid}`, 'info');
  };

  return (
    <div className="auth-page-container">
      <div className="auth-card">
        <div className="auth-card-header">
          <div className="auth-badge">
            <UserPlus size={13} />
            <span>UNIVERSITY CENTRAL REGISTRATION</span>
          </div>
          <h2>ลงทะเบียนผู้ใช้ใหม่</h2>
          <p>ยืนยันตัวตนอัตโนมัติผ่านฐานข้อมูลกลาง ม.ศรีปทุม</p>
        </div>

        <div className="info-banner">
          <Info size={16} className="text-pink flex-shrink-0" />
          <span>
            กรอกรหัสมหาวิทยาลัย ระบบจะตรวจสอบสถานะและดึงชื่อ-สกุล พร้อมกำหนดสิทธิ์ให้อัตโนมัติ
          </span>
        </div>

        <form onSubmit={handleSubmit} className="auth-form">
          <div className="form-group">
            <label className="form-label" htmlFor="s-uid">
              <span>รหัสประจำตัว (University ID)</span>
              <span className="req">*</span>
            </label>
            <div className="input-icon-wrap">
              <UserIcon size={16} className="input-icon" />
              <input
                id="s-uid"
                type="text"
                placeholder="เช่น 67000123"
                value={universityId}
                onChange={(e) => setUniversityId(e.target.value)}
                required
              />
            </div>
          </div>

          <div className="form-group">
            <label className="form-label" htmlFor="s-pass">
              <span>กำหนดรหัสผ่าน (Password)</span>
              <span className="req">*</span>
            </label>
            <div className="input-icon-wrap">
              <Lock size={16} className="input-icon" />
              <input
                id="s-pass"
                type="password"
                placeholder="กำหนดรหัสผ่านสำหรับเข้าใช้งาน"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </div>
          </div>

          <div className="form-group">
            <label className="form-label" htmlFor="s-confirm">
              <span>ยืนยันรหัสผ่านอีกครั้ง</span>
              <span className="req">*</span>
            </label>
            <div className="input-icon-wrap">
              <Lock size={16} className="input-icon" />
              <input
                id="s-confirm"
                type="password"
                placeholder="พิมพ์รหัสผ่านเดิมอีกครั้ง"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
              />
            </div>
          </div>

          <button type="submit" className="btn btn-primary btn-block" disabled={isLoading}>
            {isLoading ? 'กำลังตรวจสอบกับระบบกลาง...' : 'ลงทะเบียนและเข้าสู่ระบบ (Sign In)'}
          </button>
        </form>

        <div className="quick-accounts-box">
          <div className="quick-accounts-title">
            <Zap size={13} />
            <span>ทดลองลงทะเบียนรหัสส่วนกลาง:</span>
          </div>
          <div className="quick-chips">
            <button
              type="button"
              className="quick-chip"
              onClick={() => handleQuickFill('67000123', 'pass1234')}
            >
              🎓 67000123 (สมชาย รักเรียน · นักศึกษา)
            </button>
          </div>
        </div>

        <div className="auth-card-foot">
          <span>มีบัญชีผู้ใช้อยู่แล้ว? </span>
          <button type="button" className="link-btn" onClick={onNavigateToLogin}>
            เข้าสู่ระบบ (Log In)
          </button>
        </div>
      </div>
    </div>
  );
};
