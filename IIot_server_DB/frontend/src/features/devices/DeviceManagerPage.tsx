import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  Plus,
  Search,
  RefreshCw,
  Edit3,
  Trash2,
  RotateCcw,
  Radio,
  Archive,
  CheckSquare,
} from 'lucide-react';
import { api } from '../../services/api';
import type { DeviceInfo, JoinedIPCam, GroupInfo } from '../../types';
import {
  checkDeviceStatus,
  extractGroupOptions,
  mapDeviceToHardware,
  mapIPCamToHardware,
  runBulkAction,
  type UnifiedHardwareRow,
} from '../../services/utils';
import { DeviceFormModal, type EditableHardwareItem } from './components/DeviceFormModal';
import { DeviceDetailModal } from './components/DeviceDetailModal';
import { DeviceTypeBadge, DeviceTypeIcon } from './components/DeviceTypeBadge';
import { PaginationBar } from '../../components/common/PaginationBar';
import { useClientPagination } from '../../hooks/useClientPagination';
import { useSelection } from '../../hooks/useSelection';

interface DeviceManagerPageProps {
  onDevicesChanged: () => void;
  onNavigate: (tab: string) => void;
  showToast: (msg: string, type: 'success' | 'error' | 'info') => void;
}

const PAGE_SIZE = 10;

export const DeviceManagerPage: React.FC<DeviceManagerPageProps> = ({
  onDevicesChanged,
  onNavigate,
  showToast,
}) => {
  const [viewDeleted, setViewDeleted] = useState(false);
  const [rows, setRows] = useState<UnifiedHardwareRow[]>([]);
  const [groups, setGroups] = useState<GroupInfo[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const [search, setSearch] = useState('');
  const [filterType, setFilterType] = useState('all');
  const [filterGroup, setFilterGroup] = useState('all');

  const [modalOpen, setModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<EditableHardwareItem | null>(null);
  const [detailItem, setDetailItem] = useState<UnifiedHardwareRow | null>(null);

  const loadData = useCallback(async () => {
    setIsLoading(true);
    try {
      const [devRes, camRes, grpRes] = await Promise.all([
        api.getDevices(1, 100, viewDeleted),
        api.getIPCams(1, 100, viewDeleted),
        api.getGroups(1, 100),
      ]);

      const grpList: GroupInfo[] = grpRes.success && Array.isArray(grpRes.data) ? grpRes.data : [];
      setGroups(grpList);
      const grpNameMap = new Map<number, string>(grpList.map((g) => [g.group_id, g.group_name]));

      const combined: UnifiedHardwareRow[] = [];

      if (devRes.success && Array.isArray(devRes.data)) {
        for (const d of devRes.data as DeviceInfo[]) {
          combined.push(mapDeviceToHardware(d, d.group_id ? grpNameMap.get(d.group_id) : null));
        }
      }

      if (camRes.success && Array.isArray(camRes.data)) {
        for (const c of camRes.data as JoinedIPCam[]) {
          combined.push(
            mapIPCamToHardware(c, c.group_id, c.group_id ? grpNameMap.get(c.group_id) : null)
          );
        }
      }

      setRows(combined);
    } catch (e) {
      console.error('Manager load error:', e);
      showToast('โหลดข้อมูลอุปกรณ์ไม่สำเร็จ', 'error');
    } finally {
      setIsLoading(false);
    }
  }, [viewDeleted, showToast]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const groupOptions = useMemo(() => extractGroupOptions(rows), [rows]);

  const filtered = useMemo(() => {
    const q = search.toLowerCase();
    return rows.filter((r) => {
      const matchSearch =
        !search ||
        r.name?.toLowerCase().includes(q) ||
        r.mac?.toLowerCase().includes(q) ||
        r.ip?.toLowerCase().includes(q) ||
        r.local?.toLowerCase().includes(q) ||
        r.group_name?.toLowerCase().includes(q) ||
        (r.group_id != null && String(r.group_id).includes(q));

      const matchType =
        filterType === 'all' || r.device_type?.toLowerCase() === filterType.toLowerCase();

      const matchGroup =
        filterGroup === 'all' || (r.group_id != null && String(r.group_id) === filterGroup);

      return matchSearch && matchType && matchGroup;
    });
  }, [rows, search, filterType, filterGroup]);

  const { setCurrentPage, totalPages, safePage, paginated } = useClientPagination(
    filtered,
    PAGE_SIZE,
    `${search}|${filterType}|${filterGroup}|${viewDeleted}`
  );

  const pageRowKeys = useMemo(() => paginated.map((r) => r.rowKey), [paginated]);
  const {
    selectedKeys,
    allOnPageSelected: allPageSelected,
    toggleSelectAll,
    toggleSelectOne: toggleSelectRow,
    clearSelection,
  } = useSelection(pageRowKeys, `${viewDeleted}|${rows.length}`);

  const handleSoftDeleteOrRestore = async (items: UnifiedHardwareRow[], isDelete: boolean) => {
    if (items.length === 0) return;
    const actionLabel = isDelete ? 'ลบ' : 'กู้คืน';
    if (!window.confirm(`ต้องการ${actionLabel}อุปกรณ์จำนวน ${items.length} รายการใช่หรือไม่?`)) {
      return;
    }

    const { successCount: okCount, failCount } = await runBulkAction(items, (item) =>
      item.kind === 'device'
        ? api.patchDevice({ device_id: item.id, is_delete: isDelete })
        : api.patchIPCam({ ip_cam_id: item.id, is_delete: isDelete })
    );

    if (okCount > 0) {
      showToast(`${actionLabel}อุปกรณ์สำเร็จ ${okCount} รายการ`, 'success');
      clearSelection();
      await loadData();
      onDevicesChanged();
    }
    if (failCount > 0) {
      showToast(`${actionLabel}ไม่สำเร็จ ${failCount} รายการ`, 'error');
    }
  };

  const handleBulkAction = () => {
    const selectedItems = rows.filter((r) => selectedKeys.has(r.rowKey));
    handleSoftDeleteOrRestore(selectedItems, !viewDeleted);
  };

  const handleSubmitDevice = async (payload: any, isEdit: boolean) => {
    const res = isEdit ? await api.patchDevice(payload) : await api.createDevice(payload);
    if (res.success) {
      showToast(isEdit ? 'แก้ไขอุปกรณ์สำเร็จ' : 'เพิ่มอุปกรณ์ใหม่สำเร็จ', 'success');
      await loadData();
      onDevicesChanged();
      return true;
    }
    showToast(res.error || 'บันทึกข้อมูลอุปกรณ์ไม่สำเร็จ', 'error');
    return false;
  };

  const handleSubmitIPCam = async (payload: any, isEdit: boolean) => {
    const res = isEdit ? await api.patchIPCam(payload) : await api.createIPCam(payload);
    if (res.success) {
      showToast(isEdit ? 'แก้ไขกล้อง IP สำเร็จ' : 'เพิ่มกล้อง IP สำเร็จ', 'success');
      await loadData();
      onDevicesChanged();
      return true;
    }
    showToast(res.error || 'บันทึกข้อมูลกล้อง IP ไม่สำเร็จ', 'error');
    return false;
  };

  const handleRefreshApiKey = async (deviceId: number): Promise<string | null> => {
    const res = await api.patchDevice({ device_id: deviceId, refresh_key_api: true });
    if (res.success && res.data?.key_api) {
      showToast('สร้าง API Key ใหม่สำเร็จ', 'success');
      await loadData();
      onDevicesChanged();
      return res.data.key_api;
    }
    showToast(res.error || 'ไม่สามารถสร้าง API Key ใหม่ได้', 'error');
    return null;
  };

  return (
    <div className="devices-page">
      <div className="page-header-row">
        <div>
          <h2>จัดการอุปกรณ์ในระบบ (Device Manager)</h2>
          <p className="page-sub">
            แก้ไข ลบแบบหลายรายการ และกู้คืนอุปกรณ์ (คลิกที่แถวเพื่อดูรายละเอียดทั้งหมด)
          </p>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <button className="btn btn-secondary btn-sm" onClick={loadData} disabled={isLoading}>
            <RefreshCw size={15} className={isLoading ? 'spin' : ''} />
            <span>รีเฟรช</span>
          </button>
          <button
            className="btn btn-primary btn-sm"
            onClick={() => onNavigate('device_add')}
          >
            <Plus size={15} />
            <span>เพิ่มอุปกรณ์</span>
          </button>
        </div>
      </div>

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
            className={`btn btn-sm ${!viewDeleted ? 'btn-primary' : 'btn-secondary'}`}
            onClick={() => setViewDeleted(false)}
          >
            <CheckSquare size={15} />
            <span>อุปกรณ์ที่ใช้งานอยู่</span>
          </button>
          <button
            className={`btn btn-sm ${viewDeleted ? 'btn-primary' : 'btn-secondary'}`}
            onClick={() => setViewDeleted(true)}
          >
            <Archive size={15} />
            <span>อุปกรณ์ที่ถูกลบ (กู้คืน)</span>
          </button>
        </div>

        {selectedKeys.size > 0 && (
          <button
            className="btn btn-primary btn-sm"
            onClick={handleBulkAction}
            style={!viewDeleted ? { background: '#ef4444', borderColor: '#ef4444' } : undefined}
          >
            {viewDeleted ? <RotateCcw size={15} /> : <Trash2 size={15} />}
            <span>
              {viewDeleted
                ? `กู้คืนที่เลือก (${selectedKeys.size})`
                : `ลบที่เลือก (${selectedKeys.size})`}
            </span>
          </button>
        )}
      </div>

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
          </div>
        </div>

        <div className="table-responsive">
          <table className="data-table">
            <thead>
              <tr>
                <th style={{ width: '40px', textAlign: 'center' }}>
                  <input
                    type="checkbox"
                    checked={allPageSelected}
                    onChange={toggleSelectAll}
                    title="เลือกทั้งหมดในหน้านี้"
                  />
                </th>
                <th>ชื่ออุปกรณ์</th>
                <th>ประเภท</th>
                <th>กลุ่ม (Group)</th>
                <th>สถานที่ติดตั้ง</th>
                <th>สถานะ</th>
                <th style={{ textAlign: 'right' }}>จัดการ</th>
              </tr>
            </thead>
            <tbody>
              {paginated.length === 0 ? (
                <tr>
                  <td colSpan={7} className="table-empty-row">
                    <Radio size={34} className="text-muted" style={{ marginBottom: '8px' }} />
                    <div>
                      {viewDeleted
                        ? 'ไม่มีอุปกรณ์ที่ถูกลบในถังขยะ'
                        : 'ไม่พบข้อมูลอุปกรณ์ที่ค้นหา'}
                    </div>
                  </td>
                </tr>
              ) : (
                paginated.map((item) => {
                  const isIpCam = item.device_type?.toLowerCase() === 'ip_cam';
                  const statusInfo = checkDeviceStatus({
                    status: item.status,
                    last_active_at: item.last_active_at ?? null,
                  });
                  const isChecked = selectedKeys.has(item.rowKey);

                  return (
                    <tr
                      key={item.rowKey}
                      onClick={() => setDetailItem(item)}
                      style={{ cursor: 'pointer' }}
                      title="คลิกเพื่อดูรายละเอียดทั้งหมด"
                    >
                      <td style={{ textAlign: 'center' }} onClick={(e) => e.stopPropagation()}>
                        <input
                          type="checkbox"
                          checked={isChecked}
                          onChange={() => toggleSelectRow(item.rowKey)}
                        />
                      </td>
                      <td>
                        <div
                          className="font-bold text-ink"
                          style={{ display: 'flex', alignItems: 'center', gap: '8px' }}
                        >
                          <DeviceTypeIcon type={item.device_type} />
                          <span>{item.name}</span>
                        </div>
                        <div className="text-xs text-muted" style={{ paddingLeft: '24px' }}>
                          {isIpCam ? `IP Cam ID: #${item.id}` : `Device ID: #${item.id}`}
                        </div>
                      </td>
                      <td>
                        <DeviceTypeBadge type={item.device_type} />
                      </td>
                      <td>
                        {item.group_id != null ? (
                          <div>
                            <span className="badge badge-gray mono" style={{ whiteSpace: 'nowrap' }}>
                              Group #{item.group_id}
                            </span>
                            {item.group_name && (
                              <div className="text-xs text-muted" style={{ marginTop: '3px' }}>
                                {item.group_name}
                              </div>
                            )}
                          </div>
                        ) : (
                          <span className="text-xs text-muted">-</span>
                        )}
                      </td>
                      <td>{item.local || '-'}</td>
                      <td>
                        <span
                          className={`badge ${statusInfo.isOnline ? 'badge-active' : 'badge-stolen'}`}
                          style={{ whiteSpace: 'nowrap' }}
                        >
                          {statusInfo.statusLabel}
                        </span>
                      </td>
                      <td
                        style={{ textAlign: 'right', whiteSpace: 'nowrap' }}
                        onClick={(e) => e.stopPropagation()}
                      >
                        {!viewDeleted ? (
                          <div style={{ display: 'inline-flex', alignItems: 'center', gap: '8px' }}>
                            <button
                              type="button"
                              className="btn btn-secondary btn-sm"
                              onClick={() => {
                                setEditingItem(item);
                                setModalOpen(true);
                              }}
                              title="แก้ไขข้อมูลอุปกรณ์"
                            >
                              <Edit3 size={14} />
                              <span>แก้ไข</span>
                            </button>
                            <button
                              type="button"
                              className="btn btn-secondary btn-sm"
                              style={{ color: '#ef4444' }}
                              onClick={() => handleSoftDeleteOrRestore([item], true)}
                              title="ลบอุปกรณ์"
                            >
                              <Trash2 size={14} />
                              <span>ลบ</span>
                            </button>
                          </div>
                        ) : (
                          <button
                            type="button"
                            className="btn btn-primary btn-sm"
                            onClick={() => handleSoftDeleteOrRestore([item], false)}
                            title="กู้คืนอุปกรณ์"
                          >
                            <RotateCcw size={14} />
                            <span>กู้คืน</span>
                          </button>
                        )}
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
        onRefreshApiKey={
          detailItem && detailItem.kind === 'device' && !viewDeleted
            ? handleRefreshApiKey
            : undefined
        }
        onEdit={
          detailItem && !viewDeleted
            ? () => {
                const target = detailItem;
                setDetailItem(null);
                setEditingItem(target);
                setModalOpen(true);
              }
            : undefined
        }
      />

      <DeviceFormModal
        isOpen={modalOpen}
        mode="edit"
        initialItem={editingItem}
        groups={groups}
        onClose={() => setModalOpen(false)}
        onSubmitDevice={handleSubmitDevice}
        onSubmitIPCam={handleSubmitIPCam}
      />
    </div>
  );
};
