import React, { useState, useEffect, useCallback } from 'react';
import { History, Search, Copy, Check, Filter, RefreshCw, ChevronLeft, ChevronRight, Camera, RotateCcw } from 'lucide-react';
import type { LogRecord, DeviceInfo, TagInfo } from '../../types';
import { api } from '../../services/api';
import { normalizeImageUrl } from '../../services/utils';
import { DateTimeRangeBar } from '../../components/common/DateTimeRangeBar';

interface HistoryPageProps {
  devices: DeviceInfo[];
  tags: TagInfo[];
  onViewImage: (imageUrl: string, epc: string, device: string, timestamp: string, location?: string) => void;
  onCopyEpc: (epc: string) => void;
}

export const HistoryPage: React.FC<HistoryPageProps> = ({
  devices,
  tags,
  onViewImage,
  onCopyEpc,
}) => {
  const [logs, setLogs] = useState<LogRecord[]>([]);
  const [loading, setLoading] = useState(false);
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(20);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [startAt, setStartAt] = useState('');
  const [endAt, setEndAt] = useState('');
  const [copiedEpc, setCopiedEpc] = useState<string | null>(null);

  // Fetch logs using the dedicated log API endpoint: GET /iiot/get/log
  const fetchLogs = useCallback(async (targetPage = page, targetLimit = limit) => {
    setLoading(true);
    try {
      const res = await api.getLogs(targetPage, targetLimit, {
        start_date: startAt || undefined,
        end_date: endAt || undefined,
      });
      if (res.success && res.data) {
        setLogs(Array.isArray(res.data) ? res.data : []);
      } else {
        setLogs([]);
      }
    } catch (e) {
      console.error('Fetch logs error:', e);
      setLogs([]);
    } finally {
      setLoading(false);
    }
  }, [page, limit, startAt, endAt]);

  useEffect(() => {
    fetchLogs(page, limit);
  }, [fetchLogs, page, limit]);

  const hasActiveFilters = Boolean(search || statusFilter !== 'all' || startAt || endAt);

  const handleResetFilters = () => {
    setSearch('');
    setStatusFilter('all');
    setStartAt('');
    setEndAt('');
    setPage(1);
  };

  const handleCopy = (epc: string) => {
    onCopyEpc(epc);
    setCopiedEpc(epc);
    setTimeout(() => setCopiedEpc(null), 2000);
  };

  // Helper maps for quick lookup of Device and Tag metadata
  const deviceMap = new Map<number, DeviceInfo>();
  devices.forEach((d) => deviceMap.set(d.device_id, d));

  const tagMap = new Map<number, TagInfo>();
  tags.forEach((t) => tagMap.set(t.epc_id, t));

  // Enrich raw log record with tag & device information
  const enrichedLogs = logs.map((log) => {
    const matchedTag = tagMap.get(log.epc_id);
    const matchedDevice = deviceMap.get(log.device_id);

    const epc = log.epc || matchedTag?.epc || `TagID #${log.epc_id}`;
    const equipment_name = log.equipment_name || matchedTag?.tag || null;
    const tag_status = log.tag_status || matchedTag?.status || 'pending';
    const scanned_by_device = log.scanned_by_device || matchedDevice?.device_name || `Device #${log.device_id}`;
    const location = log.location || matchedDevice?.local || '-';

    return {
      ...log,
      epc,
      equipment_name,
      tag_status,
      scanned_by_device,
      location,
    };
  });

  const filteredLogs = enrichedLogs.filter((s) => {
    const matchSearch =
      !search ||
      s.epc?.toLowerCase().includes(search.toLowerCase()) ||
      s.equipment_name?.toLowerCase().includes(search.toLowerCase()) ||
      s.scanned_by_device?.toLowerCase().includes(search.toLowerCase()) ||
      s.location?.toLowerCase().includes(search.toLowerCase()) ||
      String(s.log_id).includes(search);

    const matchStatus =
      statusFilter === 'all' || s.tag_status?.toLowerCase() === statusFilter.toLowerCase();

    return matchSearch && matchStatus;
  });

  return (
    <div className="history-page">
      <div className="page-header-row">
        <div>
          <h2>ประวัติการตรวจจับแท็ก RFID (Scan History)</h2>
          <p className="page-sub">
            บันทึกประวัติการตรวจพบแท็กและภาพถ่ายสแนปช็อตย้อนหลัง (ดึงจาก <code>GET /iiot/get/log</code>)
          </p>
        </div>
        <button
          className={`btn btn-secondary btn-sm ${loading ? 'refreshing' : ''}`}
          onClick={() => fetchLogs(page, limit)}
          title="รีเฟรชประวัติ"
          disabled={loading}
        >
          <RefreshCw size={15} className={loading ? 'spin' : ''} />
          <span>รีเฟรชประวัติ</span>
        </button>
      </div>

      <div className="history-table-card">
        {/* Filter & Search Bar */}
        <div
          className="table-toolbar"
          style={{ flexDirection: 'column', alignItems: 'stretch', gap: '10px' }}
        >
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '10px' }}>
            <div className="toolbar-search-box" style={{ flex: 1, minWidth: '260px' }}>
              <Search size={16} className="search-icon" />
              <input
                type="search"
                placeholder="ค้นหาตามรหัส EPC, Log ID, ชื่อสิ่งของ หรือเครื่องอ่าน..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>

            <div className="toolbar-filter-wrap" style={{ flexWrap: 'wrap' }}>
              <Filter size={15} className="text-muted" />
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
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
            label="ช่วงเวลาตรวจพบ:"
            startAt={startAt}
            endAt={endAt}
            onStartChange={(val) => {
              setStartAt(val);
              setPage(1);
            }}
            onEndChange={(val) => {
              setEndAt(val);
              setPage(1);
            }}
          />
        </div>

        {/* Data Table */}
        <div className="table-responsive">
          <table className="data-table">
            <thead>
              <tr>
                <th style={{ width: '160px' }}>เวลาที่ตรวจพบ</th>
                <th>รหัส Log ID</th>
                <th>รหัสแท็ก RFID (EPC)</th>
                <th>สิ่งของ / ทรัพย์สิน</th>
                <th>สถานะแท็ก</th>
                <th>ระยะ (Distance)</th>
                <th>เครื่องอ่าน &amp; สถานที่</th>
                <th style={{ width: '90px', textAlign: 'center' }}>ภาพสแนปช็อต</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={8} className="table-empty-row">
                    <RefreshCw size={32} className="spin text-pink mb-2" />
                    <div>กำลังโหลดข้อมูลประวัติจากเซิร์ฟเวอร์...</div>
                  </td>
                </tr>
              ) : filteredLogs.length === 0 ? (
                <tr>
                  <td colSpan={8} className="table-empty-row">
                    <History size={36} className="text-muted mb-2" />
                    <div>ไม่พบข้อมูลประวัติการสแกน</div>
                  </td>
                </tr>
              ) : (
                filteredLogs.map((item, idx) => {
                  const dateObj = new Date(item.time_stamp);
                  const formattedTime = isNaN(dateObj.getTime())
                    ? '-'
                    : dateObj.toLocaleString('th-TH', {
                        dateStyle: 'short',
                        timeStyle: 'medium',
                      });

                  const imageUrl = normalizeImageUrl(item.image_path);

                  return (
                    <tr key={`${item.log_id}-${idx}`}>
                      <td>
                        <div className="font-semibold text-ink text-xs">{formattedTime}</div>
                      </td>
                      <td>
                        <span className="mono text-xs font-bold text-muted">#{item.log_id}</span>
                      </td>
                      <td>
                        <span className="epc-pill">
                          <span className="mono">{item.epc}</span>
                          <button
                            className="copy-btn"
                            onClick={() => handleCopy(item.epc)}
                            title="คัดลอก EPC"
                          >
                            {copiedEpc === item.epc ? (
                              <Check size={12} className="text-green" />
                            ) : (
                              <Copy size={12} />
                            )}
                          </button>
                        </span>
                      </td>
                      <td>
                        <div className="font-medium">
                          {item.equipment_name || (
                            <span className="text-muted italic text-xs">ยังไม่ได้ผูกสิ่งของ</span>
                          )}
                        </div>
                      </td>
                      <td>
                        <span className={`badge badge-${item.tag_status || 'gray'}`}>
                          {item.tag_status}
                        </span>
                      </td>
                      <td className="mono font-semibold text-xs">
                        {item.distance !== null && item.distance !== undefined
                          ? `${item.distance} m`
                          : '-'}
                      </td>
                      <td>
                        <div className="font-semibold text-ink text-xs">{item.scanned_by_device}</div>
                        <div className="text-xs text-muted">{item.location}</div>
                      </td>
                      <td style={{ textAlign: 'center' }}>
                        {imageUrl ? (
                          <div
                            className="history-thumb-wrap"
                            onClick={() =>
                              onViewImage(
                                imageUrl,
                                item.epc,
                                item.scanned_by_device,
                                formattedTime,
                                item.location
                              )
                            }
                            title="คลิกดูภาพหลักฐาน"
                          >
                            <img
                              src={imageUrl}
                              alt="Thumbnail"
                              onError={(e) => {
                                (e.target as HTMLImageElement).src = '/logo.png';
                              }}
                            />
                          </div>
                        ) : (
                          <span className="text-muted text-xs inline-flex items-center gap-0.5" title="ไม่มีภาพถ่าย">
                            <Camera size={12} /> ไม่มีรูป
                          </span>
                        )}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination Bar */}
        <div className="table-pagination-row">
          <span className="text-xs text-muted">
            แสดงหน้า {page} (ดึงข้อมูลล่าสุด {logs.length} แถว)
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
              disabled={logs.length < limit || loading}
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
