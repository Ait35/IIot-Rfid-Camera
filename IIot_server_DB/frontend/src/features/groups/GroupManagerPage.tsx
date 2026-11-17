import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  Plus,
  Search,
  RefreshCw,
  Edit3,
  Trash2,
  RotateCcw,
  Layers,
  Archive,
  CheckSquare,
} from 'lucide-react';
import { api } from '../../services/api';
import { runBulkAction } from '../../services/utils';
import type { GroupInfo, DeviceInfo } from '../../types';
import { GroupFormModal } from './components/GroupFormModal';
import { GroupDetailModal } from './components/GroupDetailModal';
import { PaginationBar } from '../../components/common/PaginationBar';
import { useClientPagination } from '../../hooks/useClientPagination';
import { useSelection } from '../../hooks/useSelection';

interface GroupManagerPageProps {
  devices: DeviceInfo[];
  onGroupsChanged: () => void;
  onNavigate: (tab: string) => void;
  showToast: (msg: string, type: 'success' | 'error' | 'info') => void;
}

const PAGE_SIZE = 10;

export const GroupManagerPage: React.FC<GroupManagerPageProps> = ({
  devices,
  onGroupsChanged,
  onNavigate,
  showToast,
}) => {
  const [viewDeleted, setViewDeleted] = useState(false);
  const [groups, setGroups] = useState<GroupInfo[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const [search, setSearch] = useState('');

  const [editingGroup, setEditingGroup] = useState<GroupInfo | null>(null);
  const [detailGroup, setDetailGroup] = useState<GroupInfo | null>(null);

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

  const filterKey = `${search}|${viewDeleted}`;
  const { setCurrentPage, totalPages, safePage, paginated } = useClientPagination(
    filtered,
    PAGE_SIZE,
    filterKey
  );

  const pageIds = useMemo(() => paginated.map((g) => g.group_id), [paginated]);
  const {
    selectedKeys: selectedIds,
    allOnPageSelected,
    toggleSelectAll,
    toggleSelectOne: toggleRow,
    clearSelection,
  } = useSelection(pageIds, filterKey);

  const loadGroups = useCallback(async () => {
    setIsLoading(true);
    clearSelection();
    try {
      const res = await api.getGroups(1, 100, viewDeleted);
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
  }, [viewDeleted, showToast, clearSelection]);

  useEffect(() => {
    loadGroups();
  }, [loadGroups]);

  const handleSetDeleteSingle = async (group: GroupInfo, targetDelete: boolean) => {
    const actionLabel = targetDelete ? 'ลบ' : 'กู้คืน';
    if (!window.confirm(`ต้องการ${actionLabel}กลุ่ม "${group.group_name}" (#${group.group_id}) ใช่หรือไม่?`)) {
      return;
    }

    try {
      const res = await api.patchGroup({
        group_id: group.group_id,
        is_delete: targetDelete,
      });
      if (res.success) {
        showToast(`${actionLabel}กลุ่ม "${group.group_name}" สำเร็จ`, 'success');
        await loadGroups();
        onGroupsChanged();
      } else {
        showToast(res.error || `ไม่สามารถ${actionLabel}กลุ่มได้`, 'error');
      }
    } catch {
      showToast('เกิดข้อผิดพลาดในการเชื่อมต่อเซิร์ฟเวอร์', 'error');
    }
  };

  const handleBulkAction = async (targetDelete: boolean) => {
    if (selectedIds.size === 0) return;
    const actionLabel = targetDelete ? 'ลบ' : 'กู้คืน';
    if (!window.confirm(`ยืนยันการ${actionLabel}กลุ่มที่เลือกทั้งหมด ${selectedIds.size} รายการ?`)) {
      return;
    }

    setIsLoading(true);
    try {
      const { successCount, failCount } = await runBulkAction(
        Array.from(selectedIds),
        (gid) => api.patchGroup({ group_id: gid, is_delete: targetDelete })
      );

      if (successCount > 0) {
        showToast(`${actionLabel}สำเร็จ ${successCount} กลุ่ม${failCount > 0 ? ` (ล้มเหลว ${failCount})` : ''}`, 'success');
      } else {
        showToast(`ไม่สามารถ${actionLabel}กลุ่มที่เลือกได้`, 'error');
      }

      await loadGroups();
      onGroupsChanged();
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="devices-page">
      <div className="page-header-row">
        <div>
          <h2>Group Manager (จัดการกลุ่มอุปกรณ์)</h2>
          <p className="page-sub">
            แก้ไขชื่อกลุ่ม ลบแบบ Box Select และดูรายการกลุ่มที่ถูกลบเพื่อกู้คืนกลับมาใช้งาน
          </p>
        </div>

        <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
          <button
            className={`btn btn-sm ${!viewDeleted ? 'btn-primary' : 'btn-secondary'}`}
            onClick={() => setViewDeleted(false)}
          >
            <Layers size={15} />
            <span>กลุ่มที่ใช้งานอยู่</span>
          </button>
          <button
            className={`btn btn-sm ${viewDeleted ? 'btn-primary' : 'btn-secondary'}`}
            onClick={() => setViewDeleted(true)}
          >
            <Archive size={15} />
            <span>กลุ่มที่ถูกลบ</span>
          </button>
          <button className="btn btn-primary btn-sm" onClick={() => onNavigate('group_add')}>
            <Plus size={15} />
            <span>เพิ่มกลุ่มใหม่</span>
          </button>
          <button className="btn btn-secondary btn-sm" onClick={loadGroups} disabled={isLoading}>
            <RefreshCw size={15} className={isLoading ? 'spin' : ''} />
            <span>รีเฟรช</span>
          </button>
        </div>
      </div>

      {selectedIds.size > 0 && (
        <div
          className="offline-alert-banner"
          style={{
            justifyContent: 'space-between',
            background: '#fff0f6',
            borderColor: '#fbcfe8',
            color: '#9d174d',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontWeight: 600 }}>
            <CheckSquare size={17} />
            <span>เลือกไว้ทั้งหมด {selectedIds.size} กลุ่ม</span>
          </div>
          <div style={{ display: 'flex', gap: '8px' }}>
            {viewDeleted ? (
              <button
                className="btn btn-primary btn-sm"
                onClick={() => handleBulkAction(false)}
                disabled={isLoading}
              >
                <RotateCcw size={14} />
                <span>กู้คืนกลุ่มที่เลือก ({selectedIds.size})</span>
              </button>
            ) : (
              <button
                className="btn btn-sm"
                style={{ background: '#dc2626', color: '#fff', border: 'none' }}
                onClick={() => handleBulkAction(true)}
                disabled={isLoading}
              >
                <Trash2 size={14} />
                <span>ลบกลุ่มที่เลือก ({selectedIds.size})</span>
              </button>
            )}
          </div>
        </div>
      )}

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
            {viewDeleted ? 'รายการกลุ่มที่ถูกลบ' : 'รายการกลุ่มทั้งหมด'}: {filtered.length} รายการ
          </span>
        </div>

        <div className="table-responsive">
          <table className="data-table">
            <thead>
              <tr>
                <th style={{ width: '42px', textAlign: 'center' }}>
                  <input
                    type="checkbox"
                    checked={allOnPageSelected}
                    onChange={toggleSelectAll}
                    aria-label="เลือกทั้งหมดในหน้านี้"
                  />
                </th>
                <th>Group ID</th>
                <th>ชื่อกลุ่มอุปกรณ์</th>
                <th>อุปกรณ์ในกลุ่ม</th>
                <th>ผู้สร้าง</th>
                <th style={{ textAlign: 'right' }}>จัดการ</th>
              </tr>
            </thead>
            <tbody>
              {paginated.length === 0 ? (
                <tr>
                  <td colSpan={6} className="empty-table-cell">
                    {isLoading
                      ? 'กำลังโหลดข้อมูลกลุ่ม...'
                      : viewDeleted
                      ? 'ไม่มีกลุ่มที่ถูกลบในระบบ'
                      : 'ไม่พบข้อมูลกลุ่มอุปกรณ์'}
                  </td>
                </tr>
              ) : (
                paginated.map((g) => {
                  const isChecked = selectedIds.has(g.group_id);
                  return (
                    <tr
                      key={g.group_id}
                      onClick={() => setDetailGroup(g)}
                      style={{ cursor: 'pointer', background: isChecked ? '#fff5f9' : undefined }}
                    >
                      <td
                        style={{ textAlign: 'center' }}
                        onClick={(e) => e.stopPropagation()}
                      >
                        <input
                          type="checkbox"
                          checked={isChecked}
                          onChange={() => toggleRow(g.group_id)}
                          aria-label={`เลือกกลุ่ม ${g.group_name}`}
                        />
                      </td>
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
                        <span className="text-muted" style={{ fontSize: '12px' }}>
                          MCU: <b>{g.device_count ?? 0}</b> · IP Cam: <b>{g.ip_cam_count ?? 0}</b>
                        </span>
                      </td>
                      <td>{g.by_user_name || '-'}</td>
                      <td
                        style={{ textAlign: 'right' }}
                        onClick={(e) => e.stopPropagation()}
                      >
                        <div style={{ display: 'inline-flex', gap: '8px' }}>
                          {!viewDeleted ? (
                            <>
                              <button
                                className="btn btn-secondary btn-sm"
                                onClick={() => setEditingGroup(g)}
                                title="แก้ไขชื่อกลุ่ม"
                              >
                                <Edit3 size={14} />
                                <span>แก้ไข</span>
                              </button>
                              <button
                                className="btn btn-sm"
                                style={{ background: '#fee2e2', color: '#b91c1c', border: '1px solid #fecaca' }}
                                onClick={() => handleSetDeleteSingle(g, true)}
                                title="ลบกลุ่มนี้"
                              >
                                <Trash2 size={14} />
                                <span>ลบ</span>
                              </button>
                            </>
                          ) : (
                            <button
                              className="btn btn-primary btn-sm"
                              onClick={() => handleSetDeleteSingle(g, false)}
                              title="กู้คืนกลุ่มนี้"
                            >
                              <RotateCcw size={14} />
                              <span>กู้คืน</span>
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })
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

      <GroupFormModal
        isOpen={Boolean(editingGroup)}
        initialGroup={editingGroup}
        onClose={() => setEditingGroup(null)}
        onSaved={() => {
          loadGroups();
          onGroupsChanged();
        }}
        showToast={showToast}
      />

      <GroupDetailModal
        isOpen={Boolean(detailGroup)}
        group={detailGroup}
        devices={devices}
        onClose={() => setDetailGroup(null)}
        onEdit={
          detailGroup && !viewDeleted
            ? () => {
                const target = detailGroup;
                setDetailGroup(null);
                setEditingGroup(target);
              }
            : undefined
        }
      />
    </div>
  );
};
