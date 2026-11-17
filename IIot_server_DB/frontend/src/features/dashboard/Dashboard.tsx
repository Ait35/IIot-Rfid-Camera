import React, { useState, useEffect, useRef } from 'react';
import { RefreshCw, Activity } from 'lucide-react';
import type { DashboardStats, RecentScan, SseConnectionStatus } from '../../types';
import { MetricCards } from './components/MetricCards';
import { LatestScanHero } from './components/LatestScanHero';

interface DashboardProps {
  stats: DashboardStats | null;
  latestScan: RecentScan | null;
  lastUpdated: string;
  sseStatus?: SseConnectionStatus;
  onRefresh: () => void;
  isRefreshing: boolean;
  onViewImage: (imageUrl: string, epc: string, device: string, timestamp: string, location?: string) => void;
  onCopyEpc: (epc: string) => void;
  onEditTag?: (epc: string) => void;
}

export const Dashboard: React.FC<DashboardProps> = ({
  stats,
  latestScan,
  lastUpdated,
  sseStatus = 'disconnected',
  onRefresh,
  isRefreshing,
  onViewImage,
  onCopyEpc,
  onEditTag,
}) => {
  const [autoRefreshSec, setAutoRefreshSec] = useState<number>(0);
  const timerRef = useRef<any>(null);

  useEffect(() => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }

    if (autoRefreshSec > 0) {
      timerRef.current = setInterval(() => {
        onRefresh();
      }, autoRefreshSec * 1000);
    }

    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    };
  }, [autoRefreshSec, onRefresh]);

  return (
    <div className="dashboard-page">
      {/* Top Controls Bar */}
      <div className="dashboard-header-bar">
        <div className="dashboard-title-wrap">
          <div className="dashboard-title-row">
            <h2>แดชบอร์ดระบบตรวจจับ RFID & กล้องถ่ายภาพ</h2>
            <span className="live-telemetry-badge">
              <Activity size={13} className="text-pink" />
              <span>บันทึกตามเหตุการณ์ (Event-Triggered)</span>
            </span>
            <span
              className={`badge ${
                sseStatus === 'connected'
                  ? 'badge-online'
                  : sseStatus === 'connecting'
                  ? 'badge-pending'
                  : 'badge-offline'
              }`}
              title="สถานะการเชื่อมต่อ Server-Sent Events (SSE)"
            >
              {sseStatus === 'connected'
                ? '🟢 SSE เรียลไทม์'
                : sseStatus === 'connecting'
                ? '🟡 กำลังเชื่อม SSE...'
                : '🔴 SSE หลุดการเชื่อมต่อ'}
            </span>
          </div>
          <p className="last-updated-note">
            ข้อมูลอัปเดตล่าสุดเมื่อ: <b>{lastUpdated}</b>
          </p>
        </div>

        <div className="dashboard-actions">
          <select
            className="refresh-interval-select"
            value={autoRefreshSec}
            onChange={(e) => setAutoRefreshSec(Number(e.target.value))}
            title="ตั้งค่าความถี่ในการดึงข้อมูลอัตโนมัติ (แนะนำให้ใช้ SSE เรียลไทม์)"
          >
            <option value={0}>⚡ เรียลไทม์ผ่าน SSE (ปิด Polling)</option>
            <option value={10}>🔄 ตรวจสอบเสริมทุก 10 วินาที</option>
            <option value={30}>🔄 ตรวจสอบเสริมทุก 30 วินาที</option>
            <option value={60}>🔄 ตรวจสอบเสริมทุก 60 วินาที</option>
          </select>

          <button
            className={`btn btn-secondary btn-sm refresh-btn ${isRefreshing ? 'refreshing' : ''}`}
            onClick={onRefresh}
            title="กดเพื่อดึงข้อมูลล่าสุดทันที"
          >
            <RefreshCw size={15} className={isRefreshing ? 'spin' : ''} />
            <span>รีเฟรชข้อมูล</span>
          </button>
        </div>
      </div>

      {/* 4 Big KPI Metric Cards */}
      <MetricCards stats={stats} />

      {/* Hero Spotlight: The Latest Scan (เด่นชัด ใหญ่ สวยงาม) */}
      <LatestScanHero
        scan={latestScan}
        onViewImage={onViewImage}
        onCopyEpc={onCopyEpc}
        onEditTag={onEditTag}
      />
    </div>
  );
};
