import React, { useState, useEffect } from 'react';
import {
  LayoutDashboard,
  History,
  Radio,
  Tags,
  Cpu,
  Activity,
  X,
  ChevronDown,
  Settings2,
  PlusCircle,
  Layers,
} from 'lucide-react';

interface SidebarProps {
  currentTab: string;
  onSelectTab: (tab: string) => void;
  isOpen: boolean;
  onClose: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  currentTab,
  onSelectTab,
  isOpen,
  onClose,
}) => {
  const isDevicesGroupActive =
    currentTab === 'devices' || currentTab === 'device_manager' || currentTab === 'device_add';
  const [devicesMenuOpen, setDevicesMenuOpen] = useState(isDevicesGroupActive);

  const isGroupsMenuActive =
    currentTab === 'groups' || currentTab === 'group_manager' || currentTab === 'group_add';
  const [groupsMenuOpen, setGroupsMenuOpen] = useState(isGroupsMenuActive);

  useEffect(() => {
    if (isDevicesGroupActive) {
      setDevicesMenuOpen(true);
    }
  }, [isDevicesGroupActive]);

  useEffect(() => {
    if (isGroupsMenuActive) {
      setGroupsMenuOpen(true);
    }
  }, [isGroupsMenuActive]);

  return (
    <>
      {isOpen && <div className="sidebar-backdrop" onClick={onClose} />}

      <aside className={`app-sidebar ${isOpen ? 'open' : ''}`}>
        <div className="sidebar-top">
          <div className="brand-header">
            <a href="#dashboard" className="brand-link" onClick={() => onSelectTab('dashboard')}>
              <img src="/logo.png" alt="SPU Logo" className="brand-logo-img" />
              <div className="brand-meta">
                <b>SPU IIoT Lab</b>
                <small>ESP32-S3 · UHF RFID</small>
              </div>
            </a>
            <button className="sidebar-close-btn" onClick={onClose} aria-label="Close menu">
              <X size={20} />
            </button>
          </div>

          <nav className="sidebar-nav">
            <button
              className={`nav-item ${currentTab === 'dashboard' ? 'active' : ''}`}
              onClick={() => {
                onSelectTab('dashboard');
                onClose();
              }}
            >
              <LayoutDashboard size={19} className="nav-icon" />
              <span>แดชบอร์ดระบบ</span>
            </button>

            <button
              className={`nav-item ${currentTab === 'history' ? 'active' : ''}`}
              onClick={() => {
                onSelectTab('history');
                onClose();
              }}
            >
              <History size={19} className="nav-icon" />
              <span>ประวัติการสแกน</span>
            </button>

            <div>
              <button
                className={`nav-item ${isDevicesGroupActive ? 'active' : ''}`}
                onClick={() => setDevicesMenuOpen((prev) => !prev)}
              >
                <Radio size={19} className="nav-icon" />
                <span>อุปกรณ์ในระบบ</span>
                <ChevronDown
                  size={16}
                  style={{
                    marginLeft: 'auto',
                    transform: devicesMenuOpen ? 'rotate(180deg)' : 'rotate(0deg)',
                    transition: 'transform 0.2s ease',
                  }}
                />
              </button>

              {devicesMenuOpen && (
                <div
                  style={{
                    display: 'grid',
                    gap: '4px',
                    paddingLeft: '20px',
                    marginTop: '4px',
                    marginBottom: '4px',
                  }}
                >
                  <button
                    className={`nav-item ${currentTab === 'devices' ? 'active' : ''}`}
                    style={{ minHeight: '38px', fontSize: '13px' }}
                    onClick={() => {
                      onSelectTab('devices');
                      onClose();
                    }}
                  >
                    <Radio size={15} className="nav-icon" />
                    <span>ภาพรวมอุปกรณ์</span>
                  </button>

                  <button
                    className={`nav-item ${currentTab === 'device_manager' ? 'active' : ''}`}
                    style={{ minHeight: '38px', fontSize: '13px' }}
                    onClick={() => {
                      onSelectTab('device_manager');
                      onClose();
                    }}
                  >
                    <Settings2 size={15} className="nav-icon" />
                    <span>Manager (จัดการ)</span>
                  </button>

                  <button
                    className={`nav-item ${currentTab === 'device_add' ? 'active' : ''}`}
                    style={{ minHeight: '38px', fontSize: '13px' }}
                    onClick={() => {
                      onSelectTab('device_add');
                      onClose();
                    }}
                  >
                    <PlusCircle size={15} className="nav-icon" />
                    <span>เพิ่มอุปกรณ์ใหม่</span>
                  </button>
                </div>
              )}
            </div>

            <div>
              <button
                className={`nav-item ${isGroupsMenuActive ? 'active' : ''}`}
                onClick={() => setGroupsMenuOpen((prev) => !prev)}
              >
                <Layers size={19} className="nav-icon" />
                <span>กลุ่มอุปกรณ์</span>
                <ChevronDown
                  size={16}
                  style={{
                    marginLeft: 'auto',
                    transform: groupsMenuOpen ? 'rotate(180deg)' : 'rotate(0deg)',
                    transition: 'transform 0.2s ease',
                  }}
                />
              </button>

              {groupsMenuOpen && (
                <div
                  style={{
                    display: 'grid',
                    gap: '4px',
                    paddingLeft: '20px',
                    marginTop: '4px',
                    marginBottom: '4px',
                  }}
                >
                  <button
                    className={`nav-item ${currentTab === 'groups' ? 'active' : ''}`}
                    style={{ minHeight: '38px', fontSize: '13px' }}
                    onClick={() => {
                      onSelectTab('groups');
                      onClose();
                    }}
                  >
                    <Layers size={15} className="nav-icon" />
                    <span>ภาพรวมกลุ่ม</span>
                  </button>

                  <button
                    className={`nav-item ${currentTab === 'group_manager' ? 'active' : ''}`}
                    style={{ minHeight: '38px', fontSize: '13px' }}
                    onClick={() => {
                      onSelectTab('group_manager');
                      onClose();
                    }}
                  >
                    <Settings2 size={15} className="nav-icon" />
                    <span>Manager (จัดการกลุ่ม)</span>
                  </button>

                  <button
                    className={`nav-item ${currentTab === 'group_add' ? 'active' : ''}`}
                    style={{ minHeight: '38px', fontSize: '13px' }}
                    onClick={() => {
                      onSelectTab('group_add');
                      onClose();
                    }}
                  >
                    <PlusCircle size={15} className="nav-icon" />
                    <span>เพิ่มกลุ่มใหม่</span>
                  </button>
                </div>
              )}
            </div>

            <button
              className={`nav-item ${currentTab === 'tags' ? 'active' : ''}`}
              onClick={() => {
                onSelectTab('tags');
                onClose();
              }}
            >
              <Tags size={19} className="nav-icon" />
              <span>รายการแท็ก RFID</span>
            </button>
          </nav>
        </div>

        {/* System Hardware Card at Sidebar Bottom */}
        <div className="hardware-telemetry-card">
          <div className="hardware-card-eyebrow">
            <span>Hardware Architecture</span>
            <i className="led active" />
          </div>
          <dl className="hardware-dl">
            <div>
              <dt>
                <Cpu size={13} className="inline mr-1" /> MCU
              </dt>
              <dd>ESP32-S3</dd>
            </div>
            <div>
              <dt>
                <Radio size={13} className="inline mr-1" /> Reader
              </dt>
              <dd>UHF RFID</dd>
            </div>
            <div>
              <dt>
                <Activity size={13} className="inline mr-1" /> Mode
              </dt>
              <dd className="text-pink">Event Capture</dd>
            </div>
            <div>
              <dt>📡 Broker</dt>
              <dd className="text-green">MQTT Ready</dd>
            </div>
          </dl>
        </div>
      </aside>
    </>
  );
};
