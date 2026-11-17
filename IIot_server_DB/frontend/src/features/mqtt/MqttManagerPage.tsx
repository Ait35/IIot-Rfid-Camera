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
  KeyRound,
} from 'lucide-react';
import { api } from '../../services/api';
import { runBulkAction } from '../../services/utils';
import type { MqttInfo, DeviceInfo } from '../../types';
import { MqttFormModal } from './components/MqttFormModal';
import { MqttDetailModal } from './components/MqttDetailModal';
import { PaginationBar } from '../../components/common/PaginationBar';
import { useClientPagination } from '../../hooks/useClientPagination';
import { useSelection } from '../../hooks/useSelection';

interface MqttManagerPageProps {
  devices: DeviceInfo[];
  onNavigate: (tab: string) => void;
  showToast: (msg: string, type: 'success' | 'error' | 'info') => void;
}

const PAGE_SIZE = 10;

export const MqttManagerPage: React.FC<MqttManagerPageProps> = ({
  devices,
  onNavigate,
  showToast,
}) => {
  const [viewDeleted, setViewDeleted] = useState(false);
  const [mqttList, setMqttList] = useState<MqttInfo[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isBulkProcessing, setIsBulkProcessing] = useState(false);

  const [search, setSearch] = useState('');

  const [editingMqtt, setEditingMqtt] = useState<MqttInfo | null>(null);
  const [detailMqtt, setDetailMqtt] = useState<MqttInfo | null>(null);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return mqttList;
    return mqttList.filter(
      (m) =>
        m.topic?.toLowerCase().includes(q) ||
        m.group_name?.toLowerCase().includes(q) ||
        m.user_mqtt?.toLowerCase().includes(q) ||
        m.by_user_name?.toLowerCase().includes(q) ||
        String(m.mqtt_id).includes(q)
    );
  }, [mqttList, search]);

  const filterKey = `${search}|${viewDeleted}`;
  const { setCurrentPage, totalPages, safePage, paginated } = useClientPagination(
    filtered,
    PAGE_SIZE,
    filterKey
  );

  const pageIds = useMemo(() => paginated.map((m) => m.mqtt_id), [paginated]);
  const {
    selectedKeys: selectedIds,
    allOnPageSelected,
    toggleSelectAll,
    toggleSelectOne,
    clearSelection,
  } = useSelection(pageIds, filterKey);

  const loadMqtt = useCallback(async () => {
    setIsLoading(true);
    clearSelection();
    try {
      const res = await api.getMqtt(1, 100, viewDeleted);
      if (res.success && Array.isArray(res.data)) {
        setMqttList(res.data);
      } else {
        showToast(res.error || 'โหลดข้อมูล MQTT ไม่สำเร็จ', 'error');
      }
    } catch {
      showToast('เกิดข้อผิดพลาดในการโหลดข้อมูล MQTT', 'error');
    } finally {
      setIsLoading(false);
    }
  }, [viewDeleted, showToast, clearSelection]);

  useEffect(() => {
    loadMqtt();
  }, [loadMqtt]);

  const handleToggleDelete = async (m: MqttInfo) => {
    const nextDeleted = !viewDeleted;
    const actionLabel = nextDeleted ? 'ลบ' : 'กู้คืน';
    try {
      const res = await api.patchMqtt({
        mqtt_id: m.mqtt_id,
        is_delete: nextDeleted,
      });
      if (res.success) {
        showToast(`${actionLabel} MQTT "${m.topic}" สำเร็จ`, 'success');
        loadMqtt();
      } else {
        showToast(res.error || `ไม่สามารถ${actionLabel} MQTT ได้`, 'error');
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

    const { successCount, failCount } = await runBulkAction(
      Array.from(selectedIds),
      (id) => api.patchMqtt({ mqtt_id: id, is_delete: nextDeleted })
    );

    setIsBulkProcessing(false);
    if (successCount > 0) {
      showToast(
        `${actionLabel}สำเร็จ ${successCount} รายการ${failCount > 0 ? ` (ล้มเหลว ${failCount})` : ''}`,
        failCount > 0 ? 'info' : 'success'
      );
    } else {
      showToast(`ไม่สามารถ${actionLabel}รายการที่เลือกได้`, 'error');
    }
    loadMqtt();
  };

  return (
    <div className="devices-page">
      <div className="page-header-row">
        <div>
          <h2>Manager (จัดการ MQTT)</h2>
          <p className="page-sub">
            แก้ไข Topic, กลุ่มอุปกรณ์, Username/Password และลบหรือกู้คืนการตั้งค่า MQTT
          </p>
        </div>

        <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
          <button
            className={`btn btn-sm ${!viewDeleted ? 'btn-primary' : 'btn-secondary'}`}
            onClick={() => setViewDeleted(false)}
          >
            <Radio size={15} />
            <span>รายการใช้งานอยู่</span>
          </button>
          <button
            className={`btn btn-sm ${viewDeleted ? 'btn-primary' : 'btn-secondary'}`}
            onClick={() => setViewDeleted(true)}
          >
            <Archive size={15} />
            <span>รายการที่ถูกลบ</span>
          </button>
          <button className="btn btn-secondary btn-sm" onClick={loadMqtt} disabled={isLoading}>
            <RefreshCw size={15} className={isLoading ? 'spin' : ''} />
            <span>รีเฟรช</span>
          </button>
          <button className="btn btn-primary btn-sm" onClick={() => onNavigate('mqtt_add')}>
            <Plus size={15} />
            <span>เพิ่ม MQTT ใหม่</span>
          </button>
        </div>
      </div>

      <div className="history-table-card">
        <div className="table-toolbar" style={{ flexWrap: 'wrap', gap: '10px' }}>
          <div className="toolbar-search-box">
            <Search size={16} className="search-icon" />
            <input
              type="search"
              placeholder="ค้นหา Topic, กลุ่ม, Username, ID..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            {selectedIds.size > 0 && (
              <button
                type="button"
                className={`btn btn-sm ${viewDeleted ? 'btn-primary' : 'btn-secondary'}`}
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
            )}
            <span className="text-xs text-muted">
              ทั้งหมด {filtered.length} รายการ
            </span>
          </div>
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
                    title="เลือกทั้งหมดในหน้านี้"
                  />
                </th>
                <th>ID</th>
                <th>กลุ่มอุปกรณ์</th>
                <th>MQTT Topic</th>
                <th>Username</th>
                <th>รหัสผ่าน</th>
                <th style={{ textAlign: 'right' }}>จัดการ</th>
              </tr>
            </thead>
            <tbody>
              {paginated.length === 0 ? (
                <tr>
                  <td colSpan={7} className="empty-state-cell">
                    {isLoading
                      ? 'กำลังโหลดข้อมูล MQTT...'
                      : viewDeleted
                      ? 'ไม่มีรายการ MQTT ที่ถูกลบ'
                      : 'ไม่พบข้อมูลการตั้งค่า MQTT'}
                  </td>
                </tr>
              ) : (
                paginated.map((m) => (
                  <tr
                    key={m.mqtt_id}
                    onClick={() => setDetailMqtt(m)}
                    style={{ cursor: 'pointer' }}
                  >
                    <td
                      style={{ textAlign: 'center' }}
                      onClick={(e) => e.stopPropagation()}
                    >
                      <input
                        type="checkbox"
                        checked={selectedIds.has(m.mqtt_id)}
                        onChange={() => toggleSelectOne(m.mqtt_id)}
                        aria-label={`Select MQTT ${m.mqtt_id}`}
                      />
                    </td>
                    <td>
                      <span className="badge badge-gray">#{m.mqtt_id}</span>
                    </td>
                    <td>
                      <span className="badge badge-pink">{m.group_name || `Group #${m.group_id}`}</span>
                    </td>
                    <td>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                        <code>SPU/+/group{m.group_id}/{m.topic}/+</code>
                        <span className="text-xs text-muted">
                          DB: <code>{m.topic}</code>
                        </span>
                      </div>
                    </td>
                    <td>
                      {m.user_mqtt ? (
                        <code>{m.user_mqtt}</code>
                      ) : (
                        <span className="text-muted">-</span>
                      )}
                    </td>
                    <td>
                      {m.pass_mqtt ? (
                        <span className="badge badge-active" style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                          <KeyRound size={12} />
                          ตั้งรหัสผ่านแล้ว
                        </span>
                      ) : (
                        <span className="badge badge-gray">ไม่มีรหัสผ่าน</span>
                      )}
                    </td>
                    <td
                      style={{ textAlign: 'right' }}
                      onClick={(e) => e.stopPropagation()}
                    >
                      <div style={{ display: 'inline-flex', gap: '6px' }}>
                        {!viewDeleted && (
                          <button
                            type="button"
                            className="btn btn-secondary btn-sm"
                            onClick={() => setEditingMqtt(m)}
                            title="แก้ไข MQTT"
                          >
                            <Edit3 size={14} />
                            <span>แก้ไข</span>
                          </button>
                        )}
                        <button
                          type="button"
                          className={`btn btn-sm ${viewDeleted ? 'btn-primary' : 'btn-secondary'}`}
                          onClick={() => handleToggleDelete(m)}
                          title={viewDeleted ? 'กู้คืน MQTT' : 'ลบ MQTT'}
                        >
                          {viewDeleted ? <RotateCcw size={14} /> : <Trash2 size={14} />}
                          <span>{viewDeleted ? 'กู้คืน' : 'ลบ'}</span>
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {paginated.length > 0 && (
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              padding: '8px 16px',
              borderTop: '1px solid var(--border-color)',
            }}
          >
            <div className="text-xs text-muted" style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <CheckSquare size={14} />
              <span>เลือกอยู่ {selectedIds.size} รายการ</span>
            </div>
          </div>
        )}

        <PaginationBar
          currentPage={safePage}
          totalPages={totalPages}
          totalItems={filtered.length}
          pageSize={PAGE_SIZE}
          onPageChange={setCurrentPage}
        />
      </div>

      <MqttFormModal
        isOpen={Boolean(editingMqtt)}
        initialMqtt={editingMqtt}
        devices={devices}
        onClose={() => setEditingMqtt(null)}
        onSaved={loadMqtt}
        showToast={showToast}
      />

      <MqttDetailModal
        isOpen={Boolean(detailMqtt)}
        mqtt={detailMqtt}
        onClose={() => setDetailMqtt(null)}
        onEdit={
          !viewDeleted && detailMqtt
            ? () => {
                const target = detailMqtt;
                setDetailMqtt(null);
                setEditingMqtt(target);
              }
            : undefined
        }
      />
    </div>
  );
};
