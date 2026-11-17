import React, { useState, useEffect, useCallback } from 'react';
import {
  Tags,
  Search,
  Edit3,
  Trash2,
  Copy,
  Check,
  Filter,
  RefreshCw,
  User,
  CheckCircle2,
  AlertOctagon,
  HelpCircle,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';
import type { TagInfo } from '../../types';
import { api } from '../../services/api';

interface TagsPageProps {
  tags: TagInfo[];
  onRefresh: () => void;
  onEditTag: (tag: TagInfo) => void;
  onDeleteTag: (tag: TagInfo) => void;
}

export const TagsPage: React.FC<TagsPageProps> = ({
  tags: summaryTags,
  onRefresh,
  onEditTag,
  onDeleteTag,
}) => {
  const [rows, setRows] = useState<TagInfo[]>([]);
  const [loading, setLoading] = useState(false);
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(20);
  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [copiedEpc, setCopiedEpc] = useState<string | null>(null);

  // Debounce search input (350ms) to avoid hitting backend rate limits while typing
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(search);
      setPage(1);
    }, 350);
    return () => clearTimeout(timer);
  }, [search]);

  // Fetch filtered & paginated tags directly from Backend GET /iiot/get/tag
  const fetchFilteredTags = useCallback(async () => {
    setLoading(true);
    try {
      const res = await api.getTags(page, limit, statusFilter, debouncedSearch);
      if (res.success && Array.isArray(res.data)) {
        setRows(res.data);
      } else {
        setRows([]);
      }
    } catch (err) {
      console.error('Fetch filtered tags error:', err);
      setRows([]);
    } finally {
      setLoading(false);
    }
  }, [page, limit, statusFilter, debouncedSearch]);

  useEffect(() => {
    fetchFilteredTags();
  }, [fetchFilteredTags, summaryTags]);

  const handleCopy = (epc: string) => {
    navigator.clipboard.writeText(epc);
    setCopiedEpc(epc);
    setTimeout(() => setCopiedEpc(null), 2000);
  };

  const handleManualRefresh = () => {
    onRefresh();
    fetchFilteredTags();
  };

  // KPI Summary Calculations from loaded summaryTags
  const totalTags = summaryTags.length;
  const activeTags = summaryTags.filter((t) => t.status?.toLowerCase() === 'active').length;
  const pendingTags = summaryTags.filter((t) => t.status?.toLowerCase() === 'pending').length;
  const stolenTags = summaryTags.filter((t) => t.status?.toLowerCase() === 'stolen').length;

  return (
    <div className="tags-page">
      {/* Page Header */}
      <div className="page-header-row">
        <div>
          <h2>รายการแท็ก RFID &amp; การเชื่อมโยงสิ่งของ (Map Tags)</h2>
          <p className="page-sub">
            ตรวจสอบข้อมูลความเชื่อมโยงระหว่างรหัสแท็ก EPC กับสิ่งของ/ทรัพย์สิน และผู้รับผิดชอบ พร้อมแก้ไขหรือลบข้อมูล
          </p>
        </div>
        <button
          className={`btn btn-secondary btn-sm ${loading ? 'refreshing' : ''}`}
          onClick={handleManualRefresh}
          disabled={loading}
          title="รีเฟรชข้อมูลแท็ก"
        >
          <RefreshCw size={15} className={loading ? 'spin' : ''} />
          <span>รีเฟรชแท็ก</span>
        </button>
      </div>

      {/* 4 Summary Stat Tiles */}
      <div className="tag-summary-cards">
        <div className="summary-stat-box">
          <div className="stat-head">
            <Tags size={16} className="text-pink" />
            <span className="stat-label">แท็กทั้งหมดในระบบ</span>
          </div>
          <span className="stat-num">{totalTags}</span>
          <span className="stat-sub">รหัส EPC ที่บันทึกไว้</span>
        </div>

        <div className="summary-stat-box text-green">
          <div className="stat-head">
            <CheckCircle2 size={16} />
            <span className="stat-label">ผูกสิ่งของแล้ว (Active)</span>
          </div>
          <span className="stat-num">{activeTags}</span>
          <span className="stat-sub">พร้อมตรวจจับและระบุตัวตน</span>
        </div>

        <div className="summary-stat-box text-yellow">
          <div className="stat-head">
            <HelpCircle size={16} />
            <span className="stat-label">รอผูกสิ่งของ (Pending)</span>
          </div>
          <span className="stat-num">{pendingTags}</span>
          <span className="stat-sub">ตรวจพบแล้วแต่ยังไม่ระบุชื่อ</span>
        </div>

        <div className="summary-stat-box text-red">
          <div className="stat-head">
            <AlertOctagon size={16} />
            <span className="stat-label">แจ้งหาย / ถูกขโมย (Stolen)</span>
          </div>
          <span className="stat-num">{stolenTags}</span>
          <span className="stat-sub">ระบบจะแจ้งเตือนเมื่อพบ</span>
        </div>
      </div>

      {/* Main Table Card */}
      <div className="history-table-card">
        {/* Table Toolbar */}
        <div className="table-toolbar">
          <div className="toolbar-search-box">
            <Search size={16} className="search-icon" />
            <input
              type="search"
              placeholder="ค้นหาจากฐานข้อมูลด้วยรหัส EPC, ชื่อสิ่งของ, หรือผู้รับผิดชอบ..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>

          <div className="toolbar-filter-wrap">
            <Filter size={15} className="text-muted" />
            <select
              value={statusFilter}
              onChange={(e) => {
                setStatusFilter(e.target.value);
                setPage(1);
              }}
              className="status-filter-select"
            >
              <option value="all">ทุกสถานะแท็ก</option>
              <option value="active">🟢 เปิดใช้งาน (Active)</option>
              <option value="pending">🟡 รอผูกสิ่งของ (Pending)</option>
              <option value="stolen">🔴 แจ้งหาย (Stolen)</option>
            </select>

            <select
              value={limit}
              onChange={(e) => {
                setLimit(Number(e.target.value));
                setPage(1);
              }}
              className="status-filter-select"
              title="จำนวนรายการต่อหน้า"
            >
              <option value={10}>10 รายการ/หน้า</option>
              <option value={20}>20 รายการ/หน้า</option>
              <option value={50}>50 รายการ/หน้า</option>
              <option value={100}>100 รายการ/หน้า</option>
            </select>
          </div>
        </div>

        {/* Table */}
        <div className="table-responsive">
          <table className="data-table">
            <thead>
              <tr>
                <th style={{ width: '60px' }}>ID</th>
                <th>รหัสแท็ก RFID (EPC)</th>
                <th>สิ่งของ / ทรัพย์สินที่ผูก (Asset)</th>
                <th>สถานะแท็ก</th>
                <th>ความเชื่อมโยงกับผู้ใช้ (Owner)</th>
                <th>วันที่ลงทะเบียน</th>
                <th style={{ textAlign: 'center', width: '165px' }}>การจัดการ</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={7} className="table-empty-row">
                    <RefreshCw size={30} className="spin text-pink mb-2" />
                    <div>กำลังค้นหาข้อมูลจากเซิร์ฟเวอร์...</div>
                  </td>
                </tr>
              ) : rows.length === 0 ? (
                <tr>
                  <td colSpan={7} className="table-empty-row">
                    <Tags size={36} className="text-muted mb-2" />
                    <div>ไม่พบรายการแท็กที่ตรงกับเงื่อนไข</div>
                  </td>
                </tr>
              ) : (
                rows.map((item) => (
                  <tr key={item.epc_id}>
                    <td>
                      <span className="mono text-xs font-bold text-muted">#{item.epc_id}</span>
                    </td>

                    {/* EPC Code */}
                    <td>
                      <span className="epc-pill">
                        <span className="mono font-semibold">{item.epc}</span>
                        <button
                          className="copy-btn"
                          onClick={() => handleCopy(item.epc)}
                          title="คัดลอกรหัส EPC"
                        >
                          {copiedEpc === item.epc ? (
                            <Check size={12} className="text-green" />
                          ) : (
                            <Copy size={12} />
                          )}
                        </button>
                      </span>
                    </td>

                    {/* Assigned Asset Name */}
                    <td>
                      {item.tag ? (
                        <div className="font-bold text-ink flex items-center gap-1.5">
                          <span>{item.tag}</span>
                        </div>
                      ) : (
                        <span className="chip-unassigned">ยังไม่ได้ผูกสิ่งของ</span>
                      )}
                    </td>

                    {/* Status Badge */}
                    <td>
                      <span className={`badge badge-${item.status || 'gray'}`}>
                        {item.status === 'active' && '🟢 เปิดใช้งาน (Active)'}
                        {item.status === 'pending' && '🟡 รอผูกสิ่งของ (Pending)'}
                        {item.status === 'stolen' && '🔴 แจ้งหาย (Stolen)'}
                        {!['active', 'pending', 'stolen'].includes(item.status) && item.status}
                      </span>
                    </td>

                    {/* Connected User / Owner */}
                    <td>
                      {item.by_user_name ? (
                        <div className="flex items-center gap-1.5 text-ink font-medium">
                          <User size={14} className="text-pink shrink-0" />
                          <span>{item.by_user_name}</span>
                          <span className="text-xs text-muted">(ID: {item.by_user_id || '-'})</span>
                        </div>
                      ) : (
                        <span className="text-muted text-xs italic">
                          ยังไม่ได้กำหนดผู้รับผิดชอบ
                        </span>
                      )}
                    </td>

                    {/* Registration Date */}
                    <td>
                      <div className="text-xs">
                        {item.created_at ? new Date(item.created_at).toLocaleString('th-TH') : '-'}
                      </div>
                    </td>

                    {/* Action: Edit & Delete Buttons */}
                    <td style={{ textAlign: 'center' }}>
                      <div className="action-btn-group">
                        <button
                          type="button"
                          className="action-edit-btn"
                          onClick={() => onEditTag(item)}
                          title="แก้ไขชื่อสิ่งของหรือสถานะแท็กนี้"
                        >
                          <Edit3 size={13} />
                          <span>แก้ไข</span>
                        </button>
                        <button
                          type="button"
                          className="action-delete-btn"
                          onClick={() => onDeleteTag(item)}
                          title="ลบแท็กออกจากรายการ (ซ่อนและรีเซ็ตค่าเริ่มต้น)"
                        >
                          <Trash2 size={13} />
                          <span>ลบ</span>
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination Bar */}
        <div className="table-pagination-row">
          <span className="text-xs text-muted">
            แสดงหน้า {page} ({rows.length} รายการ)
          </span>
          <div className="pagination-btn-group">
            <button
              className="btn btn-secondary btn-sm"
              disabled={page <= 1 || loading}
              onClick={() => setPage((p) => Math.max(1, p - 1))}
            >
              <ChevronLeft size={14} /> หน้าก่อนหน้า
            </button>
            <span className="page-indicator-pill">{page}</span>
            <button
              className="btn btn-secondary btn-sm"
              disabled={rows.length < limit || loading}
              onClick={() => setPage((p) => p + 1)}
            >
              หน้าถัดไป <ChevronRight size={14} />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
