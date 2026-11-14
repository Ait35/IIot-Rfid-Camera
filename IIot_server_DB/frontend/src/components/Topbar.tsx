import React from 'react';
import { Menu, LogOut } from 'lucide-react';
import type { User } from '../types';

interface TopbarProps {
  user: User | null;
  onToggleSidebar: () => void;
  onLogout: () => void;
}

export const Topbar: React.FC<TopbarProps> = ({ user, onToggleSidebar, onLogout }) => {
  const initial = user?.first_name ? user.first_name.charAt(0).toUpperCase() : 'U';

  return (
    <header className="app-topbar">
      <div className="topbar-left">
        <button
          className="hamburger-btn"
          onClick={onToggleSidebar}
          aria-label="Toggle navigation menu"
          title="เปิด/ปิดเมนู"
        >
          <Menu size={22} />
        </button>

        <div className="topbar-heading">
          <h1>IIoT Mini · RFID &amp; Camera Server</h1>
          <span className="version-pill">v1.0.0 REACT</span>
        </div>
      </div>

      <div className="topbar-right">
        {/* Real-time Status Pills */}
        <div className="telemetry-status-pills">
          <div className="status-pill" title="สถานะเชื่อมต่อ Backend API">
            <i className="led online" />
            <span>API: <b>ONLINE</b></span>
          </div>
          <div className="status-pill" title="สถานะเชื่อมต่อ MQTT Broker">
            <i className="led active" />
            <span>MQTT: <b>CONNECTED</b></span>
          </div>
        </div>

        {/* User Profile Pill */}
        {user && (
          <div className="user-profile-box">
            <div className="user-avatar-circle">{initial}</div>
            <div className="user-text-meta">
              <span className="user-name">{user.first_name} {user.last_name || ''}</span>
              <span className="user-role-badge">{user.role || 'user'} · {user.university_id}</span>
            </div>
          </div>
        )}

        {/* Logout Action */}
        <button className="btn btn-secondary btn-sm logout-btn" onClick={onLogout} title="ออกจากระบบ">
          <LogOut size={14} />
          <span className="hidden-mobile">ออกจากระบบ</span>
        </button>
      </div>
    </header>
  );
};
