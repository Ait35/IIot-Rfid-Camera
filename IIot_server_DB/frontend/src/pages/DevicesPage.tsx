import React, { useState, useMemo, useEffect } from 'react';
import { Radio, Search, RefreshCw, AlertTriangle } from 'lucide-react';
import type { DeviceInfo } from '../types';
import {
  checkDeviceStatus,
  extractGroupOptions,
  mapDeviceToHardware,
  mapIPCamToHardware,
  type UnifiedHardwareRow,
} from '../services/utils';
import { DeviceDetailModal, type HardwareDetailItem } from '../components/DeviceDetailModal';
import { DeviceTypeBadge, DeviceTypeIcon } from '../components/DeviceTypeBadge';
import { PaginationBar } from '../components/PaginationBar';

interface DevicesPageProps {
  devices: DeviceInfo[];
  onRefresh: () => void;
}

const PAGE_SIZE = 10;

export const DevicesPage: React.FC<DevicesPageProps> = ({ devices, onRefresh }) => {
  const [search, setSearch] = useState('');
  const [filterType, setFilterType] = useState<string>('all');
  const [filterGroup, setFilterGroup] = useState<string>('all');
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [currentPage, setCurrentPage] = useState(1);
  const [detailItem, setDetailItem] = useState<HardwareDetailItem | null>(null);

  const unifiedDevices = useMemo(() => {
    const rows: UnifiedHardwareRow[] = [];
    const seenIpCams = new Set<number>();

    for (const d of devices) {
      rows.push(mapDeviceToHardware(d));
      if (Array.isArray(d.ip_cameras)) {
        for (const cam of d.ip_cameras) {
          if (seenIpCams.has(cam.ip_cam_id)) continue;
          seenIpCams.add(cam.ip_cam_id);
          rows.push(mapIPCamToHardware(cam, d.group_id, d.group_name));
        }
      }
    }

    return rows;
  }, [devices]);

  const groupOptions = useMemo(() => extractGroupOptions(unifiedDevices), [unifiedDevices]);

  const evaluatedDevices = unifiedDevices.map((d) => ({
    ...d,
    statusInfo: checkDeviceStatus({ status: d.status, last_active_at: d.last_active_at ?? null }),
  }));

  const onlineCount = evaluatedDevices.filter((d) => d.statusInfo.isOnline).length;
  const offlineCount = evaluatedDevices.length - onlineCount;

  const filtered = evaluatedDevices.filter((d) => {
    const q = search.toLowerCase();
    const matchSearch =
      !search ||
      d.name?.toLowerCase().includes(q) ||
      d.mac?.toLowerCase().includes(q) ||
      d.local?.toLowerCase().includes(q) ||
      d.ip?.toLowerCase().includes(q) ||
      d.group_name?.toLowerCase().includes(q) ||
      (d.group_id != null && String(d.group_id).includes(q));

    const matchType =
      filterType === 'all' || d.device_type?.toLowerCase() === filterType.toLowerCase();

    const matchGroup =
      filterGroup === 'all' || (d.group_id != null && String(d.group_id) === filterGroup);

    const matchStatus =
      filterStatus === 'all' ||
      (filterStatus === 'online' && d.statusInfo.isOnline) ||
      (filterStatus === 'offline' && !d.statusInfo.isOnline);

    return matchSearch && matchType && matchGroup && matchStatus;
  });

  useEffect(() => {
    setCurrentPage(1);
  }, [search, filterType, filterGroup, filterStatus]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const safePage = Math.min(currentPage, totalPages);
  const paginated = filtered.slice((safePage - 1) * PAGE_SIZE, safePage * PAGE_SIZE);

  return (
    <div className="devices-page">
      <div className="page-header-row">
        <div>
          <h2>อุปกรณ์ฮาร์ดแวร์ในระบบ (Hardware Devices)</h2>
          <p className="page-sub">
            ภาพรวมสถานะเครื่องอ่าน RFID, กล้อง MCU และกล้อง IP Camera (คลิกที่แถวเพื่อดูรายละเอียดทั้งหมด)
          </p>
        </div>
        <button className="btn btn-secondary btn-sm" onClick={onRefresh} title="รีเฟรชข้อมูลอุปกรณ์">
          <RefreshCw size={15} />
          <span>รีเฟรชสถานะ</span>
        </button>
      </div>

      <div className="device-summary-cards">
        <div className="summary-stat-box">
          <span className="stat-num">{evaluatedDevices.length}</span>
          <span className="stat-label">อุปกรณ์ทั้งหมด</span>
        </div>
        <div className="summary-stat-box text-green">
          <span className="stat-num">{onlineCount}</span>
          <span className="stat-label">🟢 ออนไลน์ (Online)</span>
        </div>
        <div className="summary-stat-box text-red">
          <span className="stat-num">{offlineCount}</span>
          <span className="stat-label">🔴 ออฟไลน์ (Offline)</span>
        </div>
      </div>

      {onlineCount === 0 && evaluatedDevices.length > 0 && (
        <div className="offline-alert-banner">
          <AlertTriangle size={18} className="text-yellow shrink-0" style={{ marginRight: '8px' }} />
          <span>
            <b>สถานะอุปกรณ์:</b> อุปกรณ์ฮาร์ดแวร์ทั้งหมดอยู่ในสถานะ <b>ออฟไลน์</b> (ยังไม่มีสัญญาณเชื่อมต่อ/Keepalive เข้ามาในรอบ 10 นาทีล่าสุด)
          </span>
        </div>
      )}

      <div className="history-table-card">
        <div className="table-toolbar">
          <div className="toolbar-search-box">
            <Search size={16} className="search-icon" />
            <input
              type="search"
              placeholder="ค้นหาชื่ออุปกรณ์, Group ID, MAC, IP หรือสถานที่..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>

          <div className="toolbar-filter-wrap">
            <select
              value={filterType}
              onChange={(e) => setFilterType(e.target.value)}
              className="status-filter-select"
            >
              <option value="all">ทุกประเภทอุปกรณ์</option>
              <option value="rfid">เครื่องอ่าน RFID</option>
              <option value="cam">กล้อง MCU (CAM)</option>
              <option value="ip_cam">กล้อง IP (IP-CAM)</option>
            </select>

            <select
              value={filterGroup}
              onChange={(e) => setFilterGroup(e.target.value)}
              className="status-filter-select"
            >
              <option value="all">ทุกกลุ่ม (Group)</option>
              {groupOptions.map(([id, name]) => (
                <option key={id} value={String(id)}>
                  Group #{id}{name ? ` (${name})` : ''}
                </option>
              ))}
            </select>

            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="status-filter-select"
            >
              <option value="all">ทุกสถานะเชื่อมต่อ</option>
              <option value="online">🟢 ออนไลน์</option>
              <option value="offline">🔴 ออฟไลน์</option>
            </select>
          </div>
        </div>

        <div className="table-responsive">
          <table className="data-table">
            <thead>
              <tr>
                <th>ชื่ออุปกรณ์ (Device)</th>
                <th>ประเภท</th>
                <th>กลุ่ม (Group)</th>
                <th>สถานที่ติดตั้ง</th>
                <th>สถานะการเชื่อมต่อ</th>
              </tr>
            </thead>
            <tbody>
              {paginated.length === 0 ? (
                <tr>
                  <td colSpan={5} className="table-empty-row">
                    <Radio size={36} className="text-muted" style={{ marginBottom: '8px' }} />
                    <div>ไม่พบข้อมูลอุปกรณ์ที่ค้นหา</div>
                  </td>
                </tr>
              ) : (
                paginated.map((dev) => {
                  const { isOnline, statusLabel, detail } = dev.statusInfo;
                  const isIpCam = dev.device_type?.toLowerCase() === 'ip_cam';

                  return (
                    <tr
                      key={dev.rowKey}
                      onClick={() => setDetailItem(dev)}
                      style={{ cursor: 'pointer' }}
                      title="คลิกเพื่อดูรายละเอียดทั้งหมด"
                    >
                      <td>
                        <div
                          className="font-bold text-ink"
                          style={{ display: 'flex', alignItems: 'center', gap: '8px' }}
                        >
                          <DeviceTypeIcon type={dev.device_type} />
                          <span>{dev.name}</span>
                        </div>
                        <div className="text-xs text-muted" style={{ paddingLeft: '24px' }}>
                          {isIpCam ? `IP Cam ID: #${dev.id}` : `Device ID: #${dev.id}`}
                        </div>
                      </td>
                      <td>
                        <DeviceTypeBadge type={dev.device_type} />
                      </td>
                      <td>
                        {dev.group_id != null ? (
                          <div>
                            <span className="badge badge-gray mono" style={{ whiteSpace: 'nowrap' }}>
                              Group #{dev.group_id}
                            </span>
                            {dev.group_name && (
                              <div className="text-xs text-muted" style={{ marginTop: '3px' }}>
                                {dev.group_name}
                              </div>
                            )}
                          </div>
                        ) : (
                          <span className="text-xs text-muted">-</span>
                        )}
                      </td>
                      <td>{dev.local || '-'}</td>
                      <td>
                        <span
                          className={`badge ${isOnline ? 'badge-active' : 'badge-stolen'}`}
                          style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', whiteSpace: 'nowrap' }}
                        >
                          <span
                            className="cctv-red-dot"
                            style={{ background: isOnline ? '#10b981' : '#ef4444' }}
                          />
                          <span>{statusLabel}</span>
                        </span>
                        <div className="text-xs text-muted" style={{ marginTop: '3px' }}>{detail}</div>
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

      <DeviceDetailModal
        isOpen={!!detailItem}
        item={detailItem}
        onClose={() => setDetailItem(null)}
      />
    </div>
  );
};
