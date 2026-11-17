import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  UserPlus,
  Search,
  RefreshCw,
  Trash2,
  RotateCcw,
  Users,
  Archive,
  CheckSquare,
} from 'lucide-react';
import { api } from '../../services/api';
import { runBulkAction } from '../../services/utils';
import type { User } from '../../types';
import { AccountFormModal } from './components/AccountFormModal';
import { AccountTable } from './components/AccountTable';
import { DateTimeRangeBar } from '../../components/common/DateTimeRangeBar';
import { PaginationBar } from '../../components/common/PaginationBar';
import { useClientPagination } from '../../hooks/useClientPagination';
import { useSelection } from '../../hooks/useSelection';
import { canModifyAccount, isPrivilegedRole, ROLE_OPTIONS } from './accountHelpers';

interface AccountManagerPageProps {
  currentUser: User | null;
  onNavigate: (tab: string) => void;
  showToast: (msg: string, type: 'success' | 'error' | 'info') => void;
}

const PAGE_SIZE = 10;

export const AccountManagerPage: React.FC<AccountManagerPageProps> = ({
  currentUser,
  onNavigate,
  showToast,
}) => {
  const [viewDeleted, setViewDeleted] = useState(false);
  const [users, setUsers] = useState<User[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isBulkProcessing, setIsBulkProcessing] = useState(false);

  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState<string>('all');
  const [startAt, setStartAt] = useState('');
  const [endAt, setEndAt] = useState('');
  const [editingUser, setEditingUser] = useState<User | null>(null);

  const currentRole = currentUser?.role || 'admin';
  const canCreateAccount = isPrivilegedRole(currentRole);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return users.filter((u) => {
      if (roleFilter !== 'all' && u.role !== roleFilter) return false;
      if (!q) return true;
      return (
        u.university_id?.toLowerCase().includes(q) ||
        u.first_name?.toLowerCase().includes(q) ||
        u.last_name?.toLowerCase().includes(q) ||
        u.role?.toLowerCase().includes(q) ||
        String(u.user_id).includes(q)
      );
    });
  }, [users, search, roleFilter]);

  const filterKey = `${search}|${roleFilter}|${viewDeleted}|${startAt}|${endAt}`;
  const { setCurrentPage, totalPages, safePage, paginated } = useClientPagination(
    filtered,
    PAGE_SIZE,
    filterKey
  );

  const modifiablePageIds = useMemo(
    () => paginated.filter((u) => canModifyAccount(currentRole, u.role)).map((u) => u.user_id),
    [paginated, currentRole]
  );

  const {
    selectedKeys: selectedIds,
    allOnPageSelected,
    toggleSelectAll,
    toggleSelectOne,
    clearSelection,
  } = useSelection(modifiablePageIds, filterKey);

  const loadUsers = useCallback(async () => {
    setIsLoading(true);
    clearSelection();
    try {
      const res = await api.getUsers(
        1,
        100,
        viewDeleted,
        undefined,
        undefined,
        startAt || undefined,
        endAt || undefined
      );
      if (res.success && Array.isArray(res.data)) {
        setUsers(res.data);
      } else {
        showToast(res.error || 'โหลดข้อมูลบัญชีผู้ใช้ไม่สำเร็จ', 'error');
      }
    } catch {
      showToast('เกิดข้อผิดพลาดในการโหลดข้อมูลบัญชีผู้ใช้', 'error');
    } finally {
      setIsLoading(false);
    }
  }, [viewDeleted, startAt, endAt, showToast, clearSelection]);

  useEffect(() => {
    loadUsers();
  }, [loadUsers]);

  const hasActiveFilters = Boolean(search || roleFilter !== 'all' || startAt || endAt);

  const handleResetFilters = () => {
    setSearch('');
    setRoleFilter('all');
    setStartAt('');
    setEndAt('');
  };

  const handleToggleDelete = async (target: User) => {
    if (!canModifyAccount(currentRole, target.role)) {
      showToast('สิทธิ์ระดับ Admin ไม่สามารถลบหรือกู้คืนบัญชีระดับ Dev หรือ Teacher ได้', 'error');
      return;
    }
    const nextDeleted = !viewDeleted;
    const actionLabel = nextDeleted ? 'ปิดใช้งาน/ลบ' : 'กู้คืน';
    try {
      const res = await api.patchAccount({
        traget_id: target.user_id,
        is_delete: nextDeleted,
      });
      if (res.success) {
        showToast(`${actionLabel}บัญชี "${target.university_id}" สำเร็จ`, 'success');
        loadUsers();
      } else {
        showToast(res.error || `ไม่สามารถ${actionLabel}บัญชีได้`, 'error');
      }
    } catch {
      showToast('เกิดข้อผิดพลาดในการเชื่อมต่อเซิร์ฟเวอร์', 'error');
    }
  };

  const handleBulkToggleDelete = async () => {
    if (selectedIds.size === 0) return;
    const nextDeleted = !viewDeleted;
    const actionLabel = nextDeleted ? 'ลบ' : 'กู้คืน';
    setIsBulkProcessing(true);

    try {
      const { successCount, failCount } = await runBulkAction(
        Array.from(selectedIds),
        (id) => api.patchAccount({ traget_id: id, is_delete: nextDeleted })
      );

      if (successCount > 0) {
        showToast(`${actionLabel}บัญชีผู้ใช้ ${successCount} รายการสำเร็จ`, 'success');
      }
      if (failCount > 0) {
        showToast(`${actionLabel}ไม่สำเร็จ ${failCount} รายการ`, 'error');
      }
      loadUsers();
    } catch {
      showToast('เกิดข้อผิดพลาดในการจัดการข้อมูลแบบกลุ่ม', 'error');
    } finally {
      setIsBulkProcessing(false);
    }
  };

  return (
    <div className="devices-page">
      <div className="page-header-row">
        <div>
          <h2>จัดการบัญชีผู้ใช้ (Account Manager)</h2>
          <p className="page-sub">
            ตรวจสอบรายชื่อผู้ใช้งาน ปรับปรุงสิทธิ์ (Role), รหัสผ่าน และลบ / กู้คืนบัญชี
          </p>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
          <button
            type="button"
            className="btn btn-secondary btn-sm"
            onClick={loadUsers}
            disabled={isLoading}
          >
            <RefreshCw size={15} className={isLoading ? 'spin' : ''} />
            <span>รีเฟรช</span>
          </button>

          {canCreateAccount && (
            <button
              type="button"
              className="btn btn-primary btn-sm"
              onClick={() => onNavigate('account_add')}
            >
              <UserPlus size={15} />
              <span>เพิ่มบัญชีผู้ใช้ใหม่</span>
            </button>
          )}
        </div>
      </div>

      {/* View Mode Tabs */}
      <div
        style={{
          display: 'flex',
          flexWrap: 'wrap',
          justifyContent: 'space-between',
          alignItems: 'center',
          gap: '12px',
          marginBottom: '16px',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <button
            type="button"
            className={`btn btn-sm ${!viewDeleted ? 'btn-primary' : 'btn-secondary'}`}
            onClick={() => setViewDeleted(false)}
          >
            <Users size={15} />
            <span>บัญชีที่ใช้งานอยู่</span>
          </button>
          <button
            type="button"
            className={`btn btn-sm ${viewDeleted ? 'btn-primary' : 'btn-secondary'}`}
            onClick={() => setViewDeleted(true)}
          >
            <Archive size={15} />
            <span>ถังขยะ (บัญชีที่ถูกลบ)</span>
          </button>
        </div>

        <span className="text-muted" style={{ fontSize: '12.5px', fontWeight: 600 }}>
          ทั้งหมด {filtered.length} บัญชี
        </span>
      </div>

      {/* Bulk Action Bar */}
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
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontWeight: 700 }}>
            <CheckSquare size={17} />
            <span>เลือกไว้ทั้งหมด {selectedIds.size} บัญชี</span>
          </div>
          <div style={{ display: 'flex', gap: '8px' }}>
            <button
              type="button"
              className="btn btn-secondary btn-sm"
              onClick={clearSelection}
              disabled={isBulkProcessing}
            >
              ยกเลิกการเลือก
            </button>
            <button
              type="button"
              className={`btn btn-sm ${viewDeleted ? 'btn-primary' : 'btn-danger'}`}
              onClick={handleBulkToggleDelete}
              disabled={isBulkProcessing}
            >
              {viewDeleted ? <RotateCcw size={14} /> : <Trash2 size={14} />}
              <span>
                {isBulkProcessing
                  ? 'กำลังดำเนินการ...'
                  : viewDeleted
                    ? `กู้คืนที่เลือก (${selectedIds.size})`
                    : `ลบที่เลือก (${selectedIds.size})`}
              </span>
            </button>
          </div>
        </div>
      )}

      {/* Table Card */}
      <div className="history-table-card">
        <div
          className="table-toolbar"
          style={{ flexDirection: 'column', alignItems: 'stretch', gap: '10px' }}
        >
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              flexWrap: 'wrap',
              gap: '10px',
            }}
          >
            <div className="toolbar-search-box" style={{ flex: 1, minWidth: '240px' }}>
              <Search size={16} className="search-icon" />
              <input
                type="search"
                placeholder="ค้นหา รหัสมหาวิทยาลัย, ชื่อ, นามสกุล หรือสิทธิ์..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>

            <div className="toolbar-filter-wrap">
              <select
                className="status-filter-select"
                value={roleFilter}
                onChange={(e) => setRoleFilter(e.target.value)}
              >
                <option value="all">ทุกสิทธิ์ (All Roles)</option>
                {ROLE_OPTIONS.map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {opt.value}
                  </option>
                ))}
              </select>

              {hasActiveFilters && (
                <button
                  type="button"
                  className="btn btn-secondary btn-sm"
                  onClick={handleResetFilters}
                  title="ล้างตัวกรองทั้งหมด"
                >
                  <RotateCcw size={14} />
                  <span>ล้างตัวกรอง</span>
                </button>
              )}
            </div>
          </div>

          <DateTimeRangeBar
            label="เข้าสู่ระบบล่าสุด:"
            startAt={startAt}
            endAt={endAt}
            onStartChange={setStartAt}
            onEndChange={setEndAt}
            startAriaLabel="วันเวลาเข้าสู่ระบบเริ่มต้น"
            endAriaLabel="วันเวลาเข้าสู่ระบบสิ้นสุด"
          />
        </div>

        <AccountTable
          users={paginated}
          isLoading={isLoading}
          viewDeleted={viewDeleted}
          currentRole={currentRole}
          selectedIds={selectedIds}
          allOnPageSelected={allOnPageSelected}
          onToggleSelectAll={toggleSelectAll}
          onToggleSelectOne={toggleSelectOne}
          onEdit={setEditingUser}
          onToggleDelete={handleToggleDelete}
        />

        <PaginationBar
          currentPage={safePage}
          totalPages={totalPages}
          totalItems={filtered.length}
          pageSize={PAGE_SIZE}
          onPageChange={setCurrentPage}
        />
      </div>

      <AccountFormModal
        isOpen={!!editingUser}
        initialUser={editingUser}
        currentUserRole={currentRole}
        onClose={() => setEditingUser(null)}
        onSaved={loadUsers}
        showToast={showToast}
      />
    </div>
  );
};
