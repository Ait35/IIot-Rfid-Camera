import React from 'react';
import { Tags, CheckCircle2, Cpu, Zap } from 'lucide-react';
import type { DashboardStats } from '../../../types';

interface MetricCardsProps {
  stats: DashboardStats | null;
}

export const MetricCards: React.FC<MetricCardsProps> = ({ stats }) => {
  return (
    <div className="metrics-grid">
      {/* 1. Total Tags */}
      <article className="metric-card accent-pink">
        <div className="metric-card-top">
          <span className="metric-card-label">แท็ก RFID ทั้งหมด</span>
          <div className="metric-card-icon">
            <Tags size={18} />
          </div>
        </div>
        <div className="metric-card-value">{stats?.total_tags ?? '0'}</div>
        <div className="metric-card-foot">
          <span>แท็กที่ลงทะเบียนในระบบ</span>
        </div>
      </article>

      {/* 2. Active Tags */}
      <article className="metric-card accent-green">
        <div className="metric-card-top">
          <span className="metric-card-label">แท็กเปิดใช้งาน</span>
          <div className="metric-card-icon">
            <CheckCircle2 size={18} />
          </div>
        </div>
        <div className="metric-card-value">{stats?.active_tags ?? '0'}</div>
        <div className="metric-card-foot">
          <span>สถานะพร้อมตรวจจับ (Active)</span>
        </div>
      </article>

      {/* 3. Total Devices */}
      <article className="metric-card accent-blue">
        <div className="metric-card-top">
          <span className="metric-card-label">อุปกรณ์ในระบบ</span>
          <div className="metric-card-icon">
            <Cpu size={18} />
          </div>
        </div>
        <div className="metric-card-value">{stats?.total_devices ?? '0'}</div>
        <div className="metric-card-foot">
          <span>RFID Reader &amp; กล้องตรวจจับ</span>
        </div>
      </article>

      {/* 4. Scans Today */}
      <article className="metric-card accent-amber">
        <div className="metric-card-top">
          <span className="metric-card-label">สแกนวันนี้</span>
          <div className="metric-card-icon">
            <Zap size={18} />
          </div>
        </div>
        <div className="metric-card-value">{stats?.scans_today ?? '0'}</div>
        <div className="metric-card-foot">
          <span>จำนวนการตรวจจับประจำวัน</span>
        </div>
      </article>
    </div>
  );
};
