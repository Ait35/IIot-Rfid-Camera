import { useState, useEffect, useCallback } from 'react';
import { getToken, getUser, setToken, setUser, api, setOnUnauthorized } from './services/api';
import type { User, DashboardStats, RecentScan, DeviceInfo, TagInfo } from './types';
import { Sidebar } from './components/Sidebar';
import { Topbar } from './components/Topbar';
import { Login } from './pages/Login';
import { Signin } from './pages/Signin';
import { Dashboard } from './pages/Dashboard';
import { HistoryPage } from './pages/HistoryPage';
import { DevicesPage } from './pages/DevicesPage';
import { DeviceManagerPage } from './pages/DeviceManagerPage';
import { AddDevicePage } from './pages/AddDevicePage';
import { GroupsPage } from './pages/GroupsPage';
import { GroupManagerPage } from './pages/GroupManagerPage';
import { AddGroupPage } from './pages/AddGroupPage';
import { TagsPage } from './pages/TagsPage';
import { ImageModal } from './components/ImageModal';
import { EditTagModal } from './components/EditTagModal';
import { ToastContainer, type ToastMessage } from './components/Toast';

export function App() {
  const [user, setCurrentUser] = useState<User | null>(getUser());
  const [view, setView] = useState<'login' | 'signin' | 'dashboard'>(() => {
    return getToken() ? 'dashboard' : 'login';
  });
  const [currentTab, setCurrentTab] = useState<string>('dashboard');
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [toasts, setToasts] = useState<ToastMessage[]>([]);

  // Telemetry Data States
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [recentScans, setRecentScans] = useState<RecentScan[]>([]);
  const [devices, setDevices] = useState<DeviceInfo[]>([]);
  const [tags, setTags] = useState<TagInfo[]>([]);
  const [lastUpdated, setLastUpdated] = useState<string>('-');
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Edit Tag Modal state
  const [editingTag, setEditingTag] = useState<TagInfo | null>(null);

  // Image Modal state
  const [modalData, setModalData] = useState<{
    isOpen: boolean;
    imageUrl: string;
    epc: string;
    device: string;
    timestamp: string;
    location?: string;
  }>({
    isOpen: false,
    imageUrl: '',
    epc: '',
    device: '',
    timestamp: '',
    location: '',
  });

  const showToast = useCallback((message: string, type: 'success' | 'error' | 'info') => {
    const id = Math.random().toString(36).substring(2, 9);
    setToasts((prev) => [...prev, { id, message, type }]);
  }, []);

  const dismissToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  // Fetch Dashboard summary data
  const fetchDashboardData = useCallback(async (isManual = false) => {
    if (!getToken()) return;
    if (isManual) setIsRefreshing(true);
    try {
      const res = await api.getDashboard();
      if (res.success && res.data) {
        setStats(res.data.stats);
        setRecentScans(res.data.recentScans || []);
        setLastUpdated(new Date().toLocaleTimeString('th-TH'));
        if (isManual) {
          showToast('รีเฟรชข้อมูลล่าสุดสำเร็จ', 'info');
        }
      }
    } catch {
      if (isManual) showToast('ไม่สามารถดึงข้อมูลได้', 'error');
    } finally {
      if (isManual) setIsRefreshing(false);
    }
  }, [showToast]);

  const fetchDevices = useCallback(async () => {
    if (!getToken()) return;
    try {
      const res = await api.getDevices(1, 100);
      if (res.success && res.data) {
        setDevices(res.data);
      }
    } catch (e) {
      console.error('Fetch devices error:', e);
    }
  }, []);

  const fetchTags = useCallback(async () => {
    if (!getToken()) return;
    try {
      const res = await api.getTags(1, 100);
      if (res.success && res.data) {
        setTags(res.data);
      }
    } catch (e) {
      console.error('Fetch tags error:', e);
    }
  }, []);

  // 401 unauthorized handling
  useEffect(() => {
    setOnUnauthorized(() => {
      setCurrentUser(null);
      setView('login');
      showToast('เซสชันหมดอายุ กรุณาเข้าสู่ระบบใหม่อีกครั้ง', 'error');
    });
  }, [showToast]);

  // Initial persistent token check ("ฝัง Token ไว้ไม่ต้องล็อกอินใหม่")
  useEffect(() => {
    const token = getToken();
    if (token) {
      api.getMe().then((res) => {
        if (res.success && res.data) {
          setCurrentUser(res.data);
          setUser(res.data);
        }
      });
      setView('dashboard');
      fetchDashboardData();
      fetchDevices();
      fetchTags();
    } else {
      setView('login');
    }
  }, [fetchDashboardData, fetchDevices, fetchTags]);

  const handleLogout = async () => {
    if (!window.confirm('คุณต้องการออกจากระบบหรือไม่?')) return;
    try {
      await api.logout();
    } catch {
      // Continue client cleanup
    }
    setToken(null);
    setUser(null);
    setCurrentUser(null);
    setView('login');
    showToast('ออกจากระบบเรียบร้อยแล้ว', 'info');
  };

  const handleOpenModal = (
    imageUrl: string,
    epc: string,
    device: string,
    timestamp: string,
    location?: string
  ) => {
    setModalData({
      isOpen: true,
      imageUrl,
      epc,
      device,
      timestamp,
      location,
    });
  };

  const handleCopyEpc = (epc: string) => {
    navigator.clipboard.writeText(epc).then(() => {
      showToast(`คัดลอก EPC: ${epc}`, 'info');
    });
  };

  const handleOpenEditTag = (tag: TagInfo) => {
    setEditingTag(tag);
  };

  const handleOpenEditTagByEpc = (epc: string) => {
    const matched = tags.find((t) => t.epc === epc);
    if (matched) {
      setEditingTag(matched);
    } else {
      // If tag is not in loaded tags list, fallback to latestScan info
      if (latestScan && latestScan.epc === epc) {
        setEditingTag({
          epc_id: latestScan.log_id, // fallback ID
          epc: latestScan.epc,
          tag: latestScan.equipment_name,
          status: latestScan.tag_status,
          created_at: latestScan.time_stamp,
        });
      }
    }
  };

  const handleSaveTagSuccess = (updatedTag: TagInfo) => {
    showToast(`แก้ไขข้อมูลแท็กสำเร็จ: ${updatedTag.tag || updatedTag.epc}`, 'success');
    fetchDashboardData();
    fetchTags();
  };

  const handleDeleteTag = async (tag: TagInfo) => {
    const confirmed = window.confirm(
      `ต้องการลบแท็ก "${tag.epc}" ออกจากรายการหรือไม่?\n\n` +
        `• ระบบจะทำการ Soft Delete (ซ่อนจากรายการ)\n` +
        `• รีเซ็ตชื่อสิ่งของ ผู้รับผิดชอบ และสถานะกลับเป็นค่าเริ่มต้น (pending)\n` +
        `• ล้าง Cache ใน Redis โดยประวัติการสแกนเดิมยังคงอยู่`
    );
    if (!confirmed) return;

    try {
      const res = await api.patchTag({ epc_id: tag.epc_id, is_delete: true });
      if (res.success) {
        showToast(`ลบแท็ก ${tag.epc} เรียบร้อยแล้ว`, 'success');
        setEditingTag(null);
        fetchDashboardData();
        fetchTags();
      } else {
        showToast(res.error || 'ไม่สามารถลบแท็กได้', 'error');
      }
    } catch {
      showToast('เกิดข้อผิดพลาดในการเชื่อมต่อเพื่อลบแท็ก', 'error');
    }
  };

  const latestScan = recentScans.length > 0 ? recentScans[0] : null;

  return (
    <div className="app-shell">
      {/* Toast Notification Container */}
      <ToastContainer toasts={toasts} onDismiss={dismissToast} />

      {/* Image Lightbox Modal */}
      <ImageModal
        isOpen={modalData.isOpen}
        imageUrl={modalData.imageUrl}
        epc={modalData.epc}
        device={modalData.device}
        timestamp={modalData.timestamp}
        location={modalData.location}
        onClose={() => setModalData((prev) => ({ ...prev, isOpen: false }))}
      />

      {/* Edit Tag Modal */}
      <EditTagModal
        isOpen={!!editingTag}
        tag={editingTag}
        onClose={() => setEditingTag(null)}
        onSuccess={handleSaveTagSuccess}
        onDelete={handleDeleteTag}
      />

      {/* Authenticated View with Sidebar & Topbar */}
      {view === 'dashboard' ? (
        <div className="app-layout">
          <Sidebar
            currentTab={currentTab}
            onSelectTab={setCurrentTab}
            isOpen={isSidebarOpen}
            onClose={() => setIsSidebarOpen(false)}
          />

          <div className="main-wrapper">
            <Topbar
              user={user}
              onToggleSidebar={() => setIsSidebarOpen(!isSidebarOpen)}
              onLogout={handleLogout}
            />

            <main className="page-container">
              {currentTab === 'dashboard' && (
                <Dashboard
                  stats={stats}
                  latestScan={latestScan}
                  lastUpdated={lastUpdated}
                  onRefresh={() => fetchDashboardData(true)}
                  isRefreshing={isRefreshing}
                  onViewImage={handleOpenModal}
                  onCopyEpc={handleCopyEpc}
                  onEditTag={handleOpenEditTagByEpc}
                />
              )}

              {currentTab === 'history' && (
                <HistoryPage
                  devices={devices}
                  tags={tags}
                  onViewImage={handleOpenModal}
                  onCopyEpc={handleCopyEpc}
                />
              )}

              {currentTab === 'devices' && (
                <DevicesPage
                  devices={devices}
                  onRefresh={fetchDevices}
                />
              )}

              {currentTab === 'device_manager' && (
                <DeviceManagerPage
                  onDevicesChanged={fetchDevices}
                  onNavigate={setCurrentTab}
                  showToast={showToast}
                />
              )}

              {currentTab === 'device_add' && (
                <AddDevicePage
                  onDevicesChanged={fetchDevices}
                  onNavigate={setCurrentTab}
                  showToast={showToast}
                />
              )}

              {currentTab === 'groups' && (
                <GroupsPage
                  devices={devices}
                  onNavigate={setCurrentTab}
                  showToast={showToast}
                />
              )}

              {currentTab === 'group_manager' && (
                <GroupManagerPage
                  devices={devices}
                  onGroupsChanged={fetchDevices}
                  onNavigate={setCurrentTab}
                  showToast={showToast}
                />
              )}

              {currentTab === 'group_add' && (
                <AddGroupPage
                  onGroupsChanged={fetchDevices}
                  onNavigate={setCurrentTab}
                  showToast={showToast}
                />
              )}

              {currentTab === 'tags' && (
                <TagsPage
                  tags={tags}
                  onRefresh={fetchTags}
                  onEditTag={handleOpenEditTag}
                  onDeleteTag={handleDeleteTag}
                />
              )}
            </main>
          </div>
        </div>
      ) : view === 'signin' ? (
        <Signin
          onSuccess={(u) => {
            setCurrentUser(u);
            setView('dashboard');
            fetchDashboardData();
          }}
          onNavigateToLogin={() => setView('login')}
          showToast={showToast}
        />
      ) : (
        <Login
          onSuccess={(u) => {
            setCurrentUser(u);
            setView('dashboard');
            fetchDashboardData();
          }}
          onNavigateToSignin={() => setView('signin')}
          showToast={showToast}
        />
      )}
    </div>
  );
}

export default App;
