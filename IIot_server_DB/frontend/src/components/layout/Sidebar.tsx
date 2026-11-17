import React, { useState } from 'react';
import {
  LayoutDashboard,
  History,
  Radio,
  Tags,
  X,
  ChevronDown,
  Settings2,
  PlusCircle,
  Layers,
  Network,
  ClipboardList,
  Users,
  UserPlus,
} from 'lucide-react';

interface SidebarProps {
  currentTab: string;
  onSelectTab: (tab: string) => void;
  isOpen: boolean;
  onClose: () => void;
}

interface SubMenuItem {
  id: string;
  label: string;
  icon: React.ReactNode;
}

interface MenuGroupConfig {
  key: 'devices' | 'groups' | 'mqtt' | 'accounts';
  label: string;
  icon: React.ReactNode;
  items: SubMenuItem[];
}

const MENU_GROUPS: MenuGroupConfig[] = [
  {
    key: 'devices',
    label: 'อุปกรณ์ในระบบ',
    icon: <Radio size={19} className="nav-icon" />,
    items: [
      { id: 'devices', label: 'ภาพรวมอุปกรณ์', icon: <Radio size={15} className="nav-icon" /> },
      { id: 'device_manager', label: 'Manager (จัดการ)', icon: <Settings2 size={15} className="nav-icon" /> },
      { id: 'device_add', label: 'เพิ่มอุปกรณ์ใหม่', icon: <PlusCircle size={15} className="nav-icon" /> },
    ],
  },
  {
    key: 'groups',
    label: 'กลุ่มอุปกรณ์',
    icon: <Layers size={19} className="nav-icon" />,
    items: [
      { id: 'groups', label: 'ภาพรวมกลุ่ม', icon: <Layers size={15} className="nav-icon" /> },
      { id: 'group_manager', label: 'Manager (จัดการกลุ่ม)', icon: <Settings2 size={15} className="nav-icon" /> },
      { id: 'group_add', label: 'เพิ่มกลุ่มใหม่', icon: <PlusCircle size={15} className="nav-icon" /> },
    ],
  },
  {
    key: 'mqtt',
    label: 'ตั้งค่า MQTT',
    icon: <Network size={19} className="nav-icon" />,
    items: [
      { id: 'mqtt', label: 'ภาพรวม MQTT', icon: <Network size={15} className="nav-icon" /> },
      { id: 'mqtt_manager', label: 'Manager (จัดการ MQTT)', icon: <Settings2 size={15} className="nav-icon" /> },
      { id: 'mqtt_add', label: 'เพิ่ม MQTT ใหม่', icon: <PlusCircle size={15} className="nav-icon" /> },
    ],
  },
  {
    key: 'accounts',
    label: 'จัดการบัญชีผู้ใช้',
    icon: <Users size={19} className="nav-icon" />,
    items: [
      { id: 'account_manager', label: 'Manager (จัดการบัญชี)', icon: <Settings2 size={15} className="nav-icon" /> },
      { id: 'account_add', label: 'เพิ่มบัญชีผู้ใช้ใหม่', icon: <UserPlus size={15} className="nav-icon" /> },
    ],
  },
];

export const Sidebar: React.FC<SidebarProps> = ({
  currentTab,
  onSelectTab,
  isOpen,
  onClose,
}) => {
  const isGroupActive = (group: MenuGroupConfig) =>
    group.items.some((item) => item.id === currentTab);

  const [openGroups, setOpenGroups] = useState<Record<string, boolean>>(() => ({
    devices: MENU_GROUPS[0].items.some((i) => i.id === currentTab),
    groups: MENU_GROUPS[1].items.some((i) => i.id === currentTab),
    mqtt: MENU_GROUPS[2].items.some((i) => i.id === currentTab),
    accounts: MENU_GROUPS[3].items.some((i) => i.id === currentTab),
  }));

  const [lastTab, setLastTab] = useState(currentTab);
  if (currentTab !== lastTab) {
    setLastTab(currentTab);
    const matchedGroup = MENU_GROUPS.find((g) => g.items.some((i) => i.id === currentTab));
    if (matchedGroup && !openGroups[matchedGroup.key]) {
      setOpenGroups((prev) => ({ ...prev, [matchedGroup.key]: true }));
    }
  }

  const handleSelect = (tab: string) => {
    onSelectTab(tab);
    onClose();
  };

  return (
    <>
      {isOpen && <div className="sidebar-backdrop" onClick={onClose} />}

      <aside className={`app-sidebar ${isOpen ? 'open' : ''}`}>
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
            onClick={() => handleSelect('dashboard')}
          >
            <LayoutDashboard size={19} className="nav-icon" />
            <span>แดชบอร์ดระบบ</span>
          </button>

          <button
            className={`nav-item ${currentTab === 'history' ? 'active' : ''}`}
            onClick={() => handleSelect('history')}
          >
            <History size={19} className="nav-icon" />
            <span>ประวัติการสแกน</span>
          </button>

          {MENU_GROUPS.map((group) => {
            const active = isGroupActive(group);
            const expanded = !!openGroups[group.key];
            return (
              <div key={group.key}>
                <button
                  className={`nav-item ${active ? 'active' : ''}`}
                  onClick={() =>
                    setOpenGroups((prev) => ({ ...prev, [group.key]: !prev[group.key] }))
                  }
                >
                  {group.icon}
                  <span>{group.label}</span>
                  <ChevronDown
                    size={16}
                    style={{
                      marginLeft: 'auto',
                      transform: expanded ? 'rotate(180deg)' : 'rotate(0deg)',
                      transition: 'transform 0.2s ease',
                    }}
                  />
                </button>

                {expanded && (
                  <div className="sidebar-submenu">
                    {group.items.map((item) => (
                      <button
                        key={item.id}
                        className={`nav-item nav-subitem ${currentTab === item.id ? 'active' : ''}`}
                        onClick={() => handleSelect(item.id)}
                      >
                        {item.icon}
                        <span>{item.label}</span>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            );
          })}

          <button
            className={`nav-item ${currentTab === 'tags' ? 'active' : ''}`}
            onClick={() => handleSelect('tags')}
          >
            <Tags size={19} className="nav-icon" />
            <span>รายการแท็ก RFID</span>
          </button>

          <button
            className={`nav-item ${currentTab === 'system_logs' ? 'active' : ''}`}
            onClick={() => handleSelect('system_logs')}
          >
            <ClipboardList size={19} className="nav-icon" />
            <span>System Logs (ระบบ)</span>
          </button>
        </nav>
      </aside>
    </>
  );
};
