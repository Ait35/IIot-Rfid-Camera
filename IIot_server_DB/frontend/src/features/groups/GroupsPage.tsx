import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { Layers, Search, RefreshCw, Plus } from 'lucide-react';
import { api } from '../../services/api';
import type { GroupInfo, DeviceInfo } from '../../types';
import { GroupDetailModal } from './components/GroupDetailModal';
import { PaginationBar } from '../../components/common/PaginationBar';
import { useClientPagination } from '../../hooks/useClientPagination';

interface GroupsPageProps {
  devices: DeviceInfo[];
  onNavigate: (tab: string) => void;
  showToast: (msg: string, type: 'success' | 'error' | 'info') => void;
}

const PAGE_SIZE = 10;

export const GroupsPage: React.FC<GroupsPageProps> = ({ devices, onNavigate, showToast }) => {
  const [groups, setGroups] = useState<GroupInfo[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [search, setSearch] = useState('');
  const [detailGroup, setDetailGroup] = useState<GroupInfo | null>(null);

  const loadGroups = useCallback(async () => {
    setIsLoading(true);
    try {
      const res = await api.getGroups(1, 100, false);
      if (res.success && Array.isArray(res.data)) {
        setGroups(res.data);
      } else {
        showToast(res.error || 'โหลดข้อมูลกลุ่มไม่สำเร็จ', 'error');
      }
    } catch {
      showToast('เกิดข้อผิดพลาดในการโหลดกลุ่มอุปกรณ์', 'error');
    } finally {
      setIsLoading(false);
    }
  }, [showToast]);

  useEffect(() => {
    loadGroups();
  }, [loadGroups]);

  const totalDevicesInGroups = useMemo(
    () => groups.reduce((sum, g) => sum + (g.device_count ?? 0), 0),
    [groups]
  );
  const totalIPCamsInGroups = useMemo(
    () => groups.reduce((sum, g) => sum + (g.ip_cam_count ?? 0), 0),
    [groups]
  );

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return groups;
    return groups.filter(
      (g) =>
        g.group_name?.toLowerCase().includes(q) ||
        String(g.group_id).includes(q) ||
        g.by_user_name?.toLowerCase().includes(q)
    );
  }, [groups, search]);

  const { setCurrentPage, totalPages, safePage, paginated } = useClientPagination(
    filtered,
    PAGE_SIZE,
    search
  );

  return (
    <div className="devices-page">
      <div className="page-header-row">
        <div>
          <h2>ภาพรวมกลุ่มอุปกรณ์ (Device Groups)</h2>
          <p className="page-sub">
            แสดงกลุ่มพื้นที่และหมวดหมู่ของอุปกรณ์ RFID, กล้อง MCU และกล้อง IP Camera (คลิกที่แถวเพื่อดูอุปกรณ์ภายในกลุ่ม)
          </p>
        </div>

        <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
          <button className="btn btn-secondary btn-sm" onClick={loadGroups} disabled={isLoading}>
            <RefreshCw size={15} className={isLoading ? 'spin' : ''} />
            <span>รีเฟรช</span>
          </button>
          <button className="btn btn-primary btn-sm" onClick={() => onNavigate('group_add')}>
            <Plus size={15} />
            <span>เพิ่มกลุ่มใหม่</span>
          </button>
        </div>
      </div>

      <div className="device-summary-cards">
        <div className="summary-stat-box">
          <span className="stat-num">{groups.length}</span>
          <span className="stat-label">กลุ่มทั้งหมดในระบบ</span>
        </div>
        <div className="summary-stat-box">
          <span className="stat-num">{totalDevicesInGroups}</span>
          <span className="stat-label">อุปกรณ์ MCU / RFID ที่ผูกกลุ่ม</span>
        </div>
        <div className="summary-stat-box">
          <span className="stat-num">{totalIPCamsInGroups}</span>
          <span className="stat-label">กล้อง IP Camera ที่ผูกกลุ่ม</span>
        </div>
      </div>

      <div className="history-table-card">
        <div className="table-toolbar">
          <div className="toolbar-search-box">
            <Search size={16} className="search-icon" />
            <input
              type="search"
              placeholder="ค้นหาชื่อกลุ่ม, Group ID หรือชื่อผู้สร้าง..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          <span className="text-muted" style={{ fontSize: '12px' }}>
            พบ {filtered.length} กลุ่ม
          </span>
        </div>

        <div className="table-responsive">
          <table className="data-table">
            <thead>
              <tr>
                <th>Group ID</th>
                <th>ชื่อกลุ่มอุปกรณ์</th>
                <th>MCU / RFID</th>
                <th>IP Camera</th>
                <th>ผู้สร้าง</th>
                <th>วันที่สร้าง</th>
              </tr>
            </thead>
            <tbody>
              {paginated.length === 0 ? (
                <tr>
                  <td colSpan={6} className="empty-table-cell">
                    {isLoading ? 'กำลังโหลดข้อมูลกลุ่ม...' : 'ไม่พบข้อมูลกลุ่มอุปกรณ์'}
                  </td>
                </tr>
              ) : (
                paginated.map((g) => (
                  <tr
                    key={g.group_id}
                    onClick={() => setDetailGroup(g)}
                    style={{ cursor: 'pointer' }}
                    title="คลิกเพื่อดูรายละเอียดและอุปกรณ์ภายในกลุ่ม"
                  >
                    <td>
                      <span className="badge badge-gray">#{g.group_id}</span>
                    </td>
                    <td>
                      <div style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', fontWeight: 700 }}>
                        <Layers size={15} className="text-pink" />
                        <span>{g.group_name}</span>
                      </div>
                    </td>
                    <td>
                      <span className="badge badge-active">{g.device_count ?? 0} เครื่อง</span>
                    </td>
                    <td>
                      <span className="badge badge-pink">{g.ip_cam_count ?? 0} ตัว</span>
                    </td>
                    <td>{g.by_user_name || '-'}</td>
                    <td className="text-muted" style={{ fontSize: '12px' }}>
                      {g.created_at ? new Date(g.created_at).toLocaleDateString('th-TH') : '-'}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        <PaginationBar
          currentPage={safePage}
          totalPages={totalPages}
          totalItems={filtered.length}
          pageSize={PAGE_SIZE}
          onPageChange={setCurrentPage}
        />
      </div>

      <GroupDetailModal
        isOpen={Boolean(detailGroup)}
        group={detailGroup}
        devices={devices}
        onClose={() => setDetailGroup(null)}
      />
    </div>
  );
};
