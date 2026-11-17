import React, { useState, useEffect, useCallback } from 'react';
import { Search, RefreshCw, RotateCcw } from 'lucide-react';
import { api } from '../../services/api';
import { formatThaiDateTime } from '../../services/utils';
import type { SystemLogRecord, SystemLogSearchBy } from '../../types';
import { PaginationBar } from '../../components/common/PaginationBar';
import { SystemLogDetailModal } from './components/SystemLogDetailModal';

interface SystemLogsPageProps {
  showToast: (msg: string, type: 'success' | 'error' | 'info') => void;
}

const PAGE_SIZE = 20;

const SEARCH_BY_OPTIONS: { value: SystemLogSearchBy; label: string; placeholder: string }[] = [
  {
    value: 'all',
    label: 'ค้นหาจาก: ทั้งหมด',
    placeholder: 'ค้นหาชื่อผู้ใช้, รหัส, ตาราง, Target ID หรือ Payload...',
  },
  {
    value: 'user',
    label: 'ค้นหาจาก: ผู้ใช้งาน',
    placeholder: 'ระบุชื่อ, นามสกุล หรือรหัสนักศึกษา/บุคลากร...',
  },
  {
    value: 'target_id',
    label: 'ค้นหาจาก: Target ID',
    placeholder: 'ระบุ Target ID เช่น 9 (เทียบตัวเลขตรงๆ เร็วสุด)...',
  },
  {
    value: 'payload',
    label: 'ค้นหาจาก: Payload JSON',
    placeholder: 'ระบุ key=value เพื่อใช้ GIN Index เช่น config_group=7 หรือพิมพ์คำค้น...',
  },
];

const ACTION_OPTIONS = [
  { value: '', label: 'ทุกการกระทำ (All)' },
  { value: 'LOGIN', label: 'LOGIN' },
  { value: 'LOGOUT', label: 'LOGOUT' },
  { value: 'SIGIN', label: 'SIGIN (Register)' },
  { value: 'INSERT', label: 'INSERT' },
  { value: 'UPDATE', label: 'UPDATE' },
  { value: 'DELETE', label: 'DELETE' },
  { value: 'RESTORE', label: 'RESTORE' },
  { value: 'GET', label: 'GET' },
];

const TABLE_OPTIONS = [
  { value: '', label: 'ทุกตาราง (All)' },
  { value: 'User', label: 'User' },
  { value: 'device_info', label: 'device_info' },
  { value: 'device_group', label: 'device_group' },
  { value: 'mqtt', label: 'mqtt' },
  { value: 'ip_camera', label: 'ip_camera' },
  { value: 'map_tag', label: 'map_tag' },
  { value: 'log_rfid', label: 'log_rfid' },
  { value: 'log_images', label: 'log_images' },
];

function getActionBadgeClass(actionType: string): string {
  const upper = actionType.toUpperCase();
  if (upper === 'INSERT' || upper === 'RESTORE') return 'badge badge-active';
  if (upper === 'DELETE') return 'badge badge-stolen';
  if (upper === 'UPDATE' || upper === 'LOGIN' || upper === 'SIGIN') return 'badge badge-pink';
  return 'badge badge-gray';
}

function summarizePayload(payload: Record<string, unknown> | null): string {
  if (!payload || typeof payload !== 'object') return '-';
  const entries = Object.entries(payload).slice(0, 3);
  if (entries.length === 0) return '-';
  return entries
    .map(([k, v]) => `${k}: ${typeof v === 'object' ? JSON.stringify(v) : String(v)}`)
    .join(' · ');
}

const filterControlStyle: React.CSSProperties = {
  minHeight: '38px',
  padding: '6px 10px',
  borderRadius: 'var(--radius-sm)',
  border: '1px solid var(--line)',
  fontSize: '13px',
  background: '#fff',
};

export const SystemLogsPage: React.FC<SystemLogsPageProps> = ({ showToast }) => {
  const [logs, setLogs] = useState<SystemLogRecord[]>([]);
  const [total, setTotal] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);

  const [searchBy, setSearchBy] = useState<SystemLogSearchBy>('all');
  const [searchInput, setSearchInput] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');

  const [actionFilter, setActionFilter] = useState('');
  const [tableFilter, setTableFilter] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  const [isLoading, setIsLoading] = useState(false);
  const [selectedLog, setSelectedLog] = useState<SystemLogRecord | null>(null);

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(searchInput.trim());
      setCurrentPage(1);
    }, 300);
    return () => clearTimeout(timer);
  }, [searchInput]);

  useEffect(() => {
    setCurrentPage(1);
  }, [searchBy, actionFilter, tableFilter, startDate, endDate]);

  const loadLogs = useCallback(async () => {
    setIsLoading(true);
    try {
      const res = await api.getSystemLogs(currentPage, PAGE_SIZE, {
        action_type: actionFilter || undefined,
        target_table: tableFilter || undefined,
        search: debouncedSearch || undefined,
        search_by: searchBy,
        start_date: startDate || undefined,
        end_date: endDate || undefined,
      });
      if (res.success && res.data) {
        setLogs(res.data.items || []);
        setTotal(res.data.total ?? 0);
      } else {
        showToast(res.error || 'โหลดข้อมูล System Logs ไม่สำเร็จ', 'error');
      }
    } catch {
      showToast('เกิดข้อผิดพลาดในการโหลด System Logs', 'error');
    } finally {
      setIsLoading(false);
    }
  }, [currentPage, actionFilter, tableFilter, debouncedSearch, searchBy, startDate, endDate, showToast]);

  useEffect(() => {
    loadLogs();
  }, [loadLogs]);

  const handleResetFilters = () => {
    setSearchBy('all');
    setSearchInput('');
    setDebouncedSearch('');
    setActionFilter('');
    setTableFilter('');
    setStartDate('');
    setEndDate('');
    setCurrentPage(1);
  };

  const hasActiveFilters = Boolean(
    searchBy !== 'all' || searchInput || actionFilter || tableFilter || startDate || endDate
  );

  const currentSearchMeta =
    SEARCH_BY_OPTIONS.find((opt) => opt.value === searchBy) || SEARCH_BY_OPTIONS[0];
  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));

  return (
    <div className="devices-page">
      <div className="page-header-row">
        <div>
          <h2>บันทึกการทำงานระบบ (System Logs)</h2>
          <p className="page-sub">
            แยกค้นหาตามคอลัมน์ กรอง Action, ตาราง และช่วงวันที่ เพื่อใช้ Index อย่างมีประสิทธิภาพ
          </p>
        </div>

        <button className="btn btn-secondary btn-sm" onClick={loadLogs} disabled={isLoading}>
          <RefreshCw size={15} className={isLoading ? 'spin' : ''} />
          <span>รีเฟรช</span>
        </button>
      </div>

      <div className="history-table-card">
        <div
          className="table-toolbar"
          style={{ flexDirection: 'column', alignItems: 'stretch', gap: '10px' }}
        >
          {/* Row 1: Scoped Search */}
          <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', alignItems: 'center' }}>
            <select
              value={searchBy}
              onChange={(e) => setSearchBy(e.target.value as SystemLogSearchBy)}
              style={filterControlStyle}
              aria-label="เลือกขอบเขตการค้นหา"
            >
              {SEARCH_BY_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>

            <div className="toolbar-search-box" style={{ flex: 1, minWidth: '240px' }}>
              <Search size={16} className="search-icon" />
              <input
                type="search"
                placeholder={currentSearchMeta.placeholder}
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
              />
            </div>

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

          {/* Row 2: Action, Table, Date Range + Count */}
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              flexWrap: 'wrap',
              gap: '8px',
            }}
          >
            <div className="toolbar-filter-wrap" style={{ flexWrap: 'wrap', gap: '8px' }}>
              <select
                value={actionFilter}
                onChange={(e) => setActionFilter(e.target.value)}
                style={filterControlStyle}
                aria-label="กรองตามการกระทำ"
              >
                {ACTION_OPTIONS.map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </select>

              <select
                value={tableFilter}
                onChange={(e) => setTableFilter(e.target.value)}
                style={filterControlStyle}
                aria-label="กรองตามตาราง"
              >
                {TABLE_OPTIONS.map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </select>

              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexWrap: 'wrap' }}>
                <span className="text-xs text-muted">ตั้งแต่:</span>
                <input
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  style={filterControlStyle}
                  aria-label="วันที่เริ่มต้น"
                />
                <span className="text-xs text-muted">ถึง:</span>
                <input
                  type="date"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  style={filterControlStyle}
                  aria-label="วันที่สิ้นสุด"
                />
              </div>
            </div>

            <span className="text-xs text-muted">
              พบ {total.toLocaleString('th-TH')} รายการ
            </span>
          </div>
        </div>

        <div className="table-responsive">
          <table className="data-table">
            <thead>
              <tr>
                <th>ID</th>
                <th>เวลา</th>
                <th>ผู้ใช้งาน</th>
                <th>การกระทำ</th>
                <th>ตาราง / เป้าหมาย</th>
                <th>รายละเอียด (Payload)</th>
              </tr>
            </thead>
            <tbody>
              {logs.length === 0 ? (
                <tr>
                  <td colSpan={6} className="empty-state-cell">
                    {isLoading ? 'กำลังโหลดข้อมูล System Logs...' : 'ไม่พบบันทึกการทำงานที่ตรงกับเงื่อนไข'}
                  </td>
                </tr>
              ) : (
                logs.map((log) => {
                  const fullName =
                    log.first_name || log.last_name
                      ? `${log.first_name || ''} ${log.last_name || ''}`.trim()
                      : log.user_id
                      ? `User #${log.user_id}`
                      : 'System / Guest';
                  const formattedTime = formatThaiDateTime(log.time_action, true);

                  return (
                    <tr
                      key={log.activity_id}
                      onClick={() => setSelectedLog(log)}
                      style={{ cursor: 'pointer' }}
                      title="คลิกเพื่อดูรายละเอียด Payload JSON"
                    >
                      <td>
                        <span className="badge badge-gray">#{log.activity_id}</span>
                      </td>
                      <td style={{ whiteSpace: 'nowrap', fontSize: '12.5px' }}>{formattedTime}</td>
                      <td>
                        <div style={{ fontWeight: 600 }}>{fullName}</div>
                        {log.university_id && (
                          <div className="text-xs text-muted">
                            {log.university_id} {log.role ? `· ${log.role}` : ''}
                          </div>
                        )}
                      </td>
                      <td>
                        <span className={getActionBadgeClass(log.action_type)}>
                          {log.action_type}
                        </span>
                      </td>
                      <td>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                          <code>{log.target_table || '-'}</code>
                          {log.target_id !== null && log.target_id !== undefined && (
                            <span className="badge badge-gray">#{log.target_id}</span>
                          )}
                        </div>
                      </td>
                      <td
                        className="text-muted"
                        style={{
                          maxWidth: '280px',
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                          whiteSpace: 'nowrap',
                          fontSize: '12px',
                        }}
                      >
                        {summarizePayload(log.payload)}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        <PaginationBar
          currentPage={currentPage}
          totalPages={totalPages}
          totalItems={total}
          pageSize={PAGE_SIZE}
          onPageChange={setCurrentPage}
        />
      </div>

      <SystemLogDetailModal
        log={selectedLog}
        onClose={() => setSelectedLog(null)}
      />
    </div>
  );
};
