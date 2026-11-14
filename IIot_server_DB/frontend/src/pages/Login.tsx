import React, { useState } from 'react';
import { Lock, User as UserIcon, Eye, EyeOff, ShieldCheck, Zap } from 'lucide-react';
import { api, setToken, setUser } from '../services/api';
import type { User } from '../types';

interface LoginProps {
  onSuccess: (user: User) => void;
  onNavigateToSignin: () => void;
  showToast: (msg: string, type: 'success' | 'error' | 'info') => void;
}

export const Login: React.FC<LoginProps> = ({ onSuccess, onNavigateToSignin, showToast }) => {
  const [universityId, setUniversityId] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!universityId.trim() || !password.trim()) {
      showToast('กรุณากรอกรหัสมหาวิทยาลัยและรหัสผ่าน', 'error');
      return;
    }

    setIsLoading(true);
    try {
      const res = await api.login(universityId.trim(), password.trim());
      if (res.success && res.token) {
        setToken(res.token);

        let userProfile = res.user;
        if (!userProfile) {
          const meRes = await api.getMe();
          if (meRes.success && meRes.data) {
            userProfile = meRes.data;
          }
        }

        const finalUser: User = userProfile || {
          user_id: 1,
          university_id: universityId,
          first_name: 'User',
          last_name: '',
          role: 'user',
        };

        setUser(finalUser);
        showToast(`เข้าสู่ระบบสำเร็จ ยินดีต้อนรับ คุณ${finalUser.first_name}!`, 'success');
        onSuccess(finalUser);
      } else {
        showToast(res.error || res.message || 'รหัสมหาวิทยาลัยหรือรหัสผ่านไม่ถูกต้อง', 'error');
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
    showToast(`เลือกบัญชีทดสอบ: ${uid}`, 'info');
  };

  return (
    <div className="auth-page-container">
      <div className="auth-card">
        <div className="auth-card-header">
          <div className="auth-badge">
            <ShieldCheck size={13} />
            <span>SPU SECURE AUTH</span>
          </div>
          <h2>เข้าสู่ระบบ IIoT</h2>
          <p>ระบบศูนย์กลางจัดการข้อมูล RFID และกล้องตรวจจับ</p>
        </div>

        <form onSubmit={handleSubmit} className="auth-form">
          <div className="form-group">
            <label className="form-label" htmlFor="uid">
              <span>รหัสประจำตัว (University ID)</span>
              <span className="req">*</span>
            </label>
            <div className="input-icon-wrap">
              <UserIcon size={16} className="input-icon" />
              <input
                id="uid"
                type="text"
                placeholder="เช่น 67159200 หรือ T0001"
                value={universityId}
                onChange={(e) => setUniversityId(e.target.value)}
                required
                autoFocus
              />
            </div>
          </div>

          <div className="form-group">
            <label className="form-label" htmlFor="pass">
              <span>รหัสผ่าน (Password)</span>
              <span className="req">*</span>
            </label>
            <div className="input-icon-wrap">
              <Lock size={16} className="input-icon" />
              <input
                id="pass"
                type={showPassword ? 'text' : 'password'}
                placeholder="กรอกรหัสผ่านของคุณ"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
              <button
                type="button"
                className="input-eye-btn"
                onClick={() => setShowPassword(!showPassword)}
                tabIndex={-1}
              >
                {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
          </div>

          <button type="submit" className="btn btn-primary btn-block" disabled={isLoading}>
            {isLoading ? 'กำลังตรวจสอบ...' : 'เข้าสู่ระบบ (Log In)'}
          </button>
        </form>

        {/* Quick Demo Test Account Pills */}
        <div className="quick-accounts-box">
          <div className="quick-accounts-title">
            <Zap size={13} />
            <span>คลิกเพื่อทดสอบบัญชีในระบบ:</span>
          </div>
          <div className="quick-chips">
            <button
              type="button"
              className="quick-chip"
              onClick={() => handleQuickFill('67159200', 'admin')}
            >
              👤 67159200 (อธิป · Dev)
            </button>
            <button
              type="button"
              className="quick-chip"
              onClick={() => handleQuickFill('T0001', 'admin')}
            >
              👨‍🏫 T0001 (อจ.สมศักดิ์ · Teacher)
            </button>
            <button
              type="button"
              className="quick-chip"
              onClick={() => handleQuickFill('67199999', 'password123')}
            >
              🤖 67199999 (Gemini · Teacher)
            </button>
          </div>
        </div>

        <div className="auth-card-foot">
          <span>ยังไม่มีบัญชีผู้ใช้? </span>
          <button type="button" className="link-btn" onClick={onNavigateToSignin}>
            ลงทะเบียนใหม่ (Sign In / Register)
          </button>
        </div>
      </div>
    </div>
  );
};
