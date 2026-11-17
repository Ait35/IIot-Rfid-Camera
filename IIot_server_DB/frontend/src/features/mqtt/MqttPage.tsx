import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { Radio, Search, RefreshCw, Plus, KeyRound } from 'lucide-react';
import { api } from '../../services/api';
import type { MqttInfo } from '../../types';
import { MqttDetailModal } from './components/MqttDetailModal';
import { PaginationBar } from '../../components/common/PaginationBar';
import { useClientPagination } from '../../hooks/useClientPagination';

interface MqttPageProps {
  onNavigate: (tab: string) => void;
  showToast: (msg: string, type: 'success' | 'error' | 'info') => void;
}

const PAGE_SIZE = 10;

export const MqttPage: React.FC<MqttPageProps> = ({ onNavigate, showToast }) => {
  const [mqttList, setMqttList] = useState<MqttInfo[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [search, setSearch] = useState('');
  const [detailMqtt, setDetailMqtt] = useState<MqttInfo | null>(null);

  const loadMqtt = useCallback(async () => {
    setIsLoading(true);
    try {
      const res = await api.getMqtt(1, 100, false);
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
  }, [showToast]);

  useEffect(() => {
    loadMqtt();
  }, [loadMqtt]);

  const withAuthCount = useMemo(
    () => mqttList.filter((m) => Boolean(m.user_mqtt) || Boolean(m.pass_mqtt)).length,
    [mqttList]
  );
  const withoutAuthCount = useMemo(
    () => mqttList.length - withAuthCount,
    [mqttList, withAuthCount]
  );

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

  const { setCurrentPage, totalPages, safePage, paginated } = useClientPagination(
    filtered,
    PAGE_SIZE,
    search
  );

  return (
    <div className="devices-page">
      <div className="page-header-row">
        <div>
          <h2>ภาพรวมการตั้งค่า MQTT (MQTT Overview)</h2>
          <p className="page-sub">
            แสดง Topic และข้อมูลรับรองการเชื่อมต่อ MQTT Broker ของแต่ละกลุ่มอุปกรณ์ (คลิกที่แถวเพื่อดูรายละเอียด)
          </p>
        </div>

        <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
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

      <div className="device-summary-cards">
        <div className="summary-stat-box">
          <span className="stat-num">{mqttList.length}</span>
          <span className="stat-label">การตั้งค่า MQTT ทั้งหมด</span>
        </div>
        <div className="summary-stat-box">
          <span className="stat-num">{withAuthCount}</span>
          <span className="stat-label">ตั้งค่า Username / Password</span>
        </div>
        <div className="summary-stat-box">
          <span className="stat-num">{withoutAuthCount}</span>
          <span className="stat-label">ไม่ได้ตั้งรหัสผ่าน (No Auth)</span>
        </div>
      </div>

      <div className="history-table-card">
        <div className="table-toolbar">
          <div className="toolbar-search-box">
            <Search size={16} className="search-icon" />
            <input
              type="search"
              placeholder="ค้นหา Topic, ชื่อกลุ่ม, Username, ID..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          <div className="text-xs text-muted">
            แสดง {filtered.length} จาก {mqttList.length} รายการ
          </div>
        </div>

        <div className="table-responsive">
          <table className="data-table">
            <thead>
              <tr>
                <th>ID</th>
                <th>กลุ่มอุปกรณ์ (Group)</th>
                <th>MQTT Topic</th>
                <th>MQTT Username</th>
                <th>รหัสผ่าน</th>
                <th>ผู้สร้าง</th>
              </tr>
            </thead>
            <tbody>
              {paginated.length === 0 ? (
                <tr>
                  <td colSpan={6} className="empty-state-cell">
                    {isLoading ? 'กำลังโหลดข้อมูล MQTT...' : 'ไม่พบข้อมูลการตั้งค่า MQTT'}
                  </td>
                </tr>
              ) : (
                paginated.map((m) => (
                  <tr
                    key={m.mqtt_id}
                    onClick={() => setDetailMqtt(m)}
                    style={{ cursor: 'pointer' }}
                    title="คลิกเพื่อดูรายละเอียด MQTT"
                  >
                    <td>
                      <span className="badge badge-gray">#{m.mqtt_id}</span>
                    </td>
                    <td>
                      <span className="badge badge-pink">{m.group_name || `Group #${m.group_id}`}</span>
                    </td>
                    <td>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontWeight: 600 }}>
                          <Radio size={15} className="text-pink" />
                          <code>SPU/+/group{m.group_id}/{m.topic}/+</code>
                        </div>
                        <span className="text-xs text-muted">
                          DB topic: <code>{m.topic}</code>
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
                    <td className="text-muted">{m.by_user_name || '-'}</td>
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

      <MqttDetailModal
        isOpen={Boolean(detailMqtt)}
        mqtt={detailMqtt}
        onClose={() => setDetailMqtt(null)}
        onEdit={() => {
          setDetailMqtt(null);
          onNavigate('mqtt_manager');
        }}
      />
    </div>
  );
};
