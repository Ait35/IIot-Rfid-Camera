import React, { useState } from 'react';
import { Copy, Check, Radio, MapPin, Gauge, Clock, ZoomIn, Eye, Sparkles, Camera, Edit3 } from 'lucide-react';
import type { RecentScan } from '../types';
import { normalizeImageUrl } from '../services/utils';

interface LatestScanHeroProps {
  scan: RecentScan | null;
  onViewImage: (imageUrl: string, epc: string, device: string, timestamp: string, location?: string) => void;
  onCopyEpc: (epc: string) => void;
  onEditTag?: (epc: string) => void;
}

export const LatestScanHero: React.FC<LatestScanHeroProps> = ({
  scan,
  onViewImage,
  onCopyEpc,
  onEditTag,
}) => {
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    if (!scan?.epc) return;
    onCopyEpc(scan.epc);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const getRelativeTime = (timeStr: string) => {
    const date = new Date(timeStr);
    if (isNaN(date.getTime())) return '-';
    const diffSec = Math.floor((Date.now() - date.getTime()) / 1000);
    if (diffSec < 10) return 'เมื่อสักครู่';
    if (diffSec < 60) return `${diffSec} วินาทีที่แล้ว`;
    const diffMin = Math.floor(diffSec / 60);
    if (diffMin < 60) return `${diffMin} นาทีที่แล้ว`;
    const diffHour = Math.floor(diffMin / 60);
    if (diffHour < 24) return `${diffHour} ชั่วโมงที่แล้ว`;
    return `${Math.floor(diffHour / 24)} วันที่แล้ว`;
  };

  const formattedTime = scan?.time_stamp
    ? new Date(scan.time_stamp).toLocaleString('th-TH', {
        dateStyle: 'medium',
        timeStyle: 'medium',
      })
    : '-';

  const relTime = scan?.time_stamp ? getRelativeTime(scan.time_stamp) : 'รอสัญญาณ';

  const getStatusBadge = (status: string) => {
    if (status === 'active') {
      return <span className="status-badge-lg badge-active">🟢 เปิดใช้งาน (Active)</span>;
    }
    if (status === 'pending') {
      return <span className="status-badge-lg badge-pending">🟡 รอผูกสิ่งของ (Pending)</span>;
    }
    if (status === 'stolen') {
      return <span className="status-badge-lg badge-stolen">🔴 แจ้งหาย (Stolen)</span>;
    }
    return <span className="status-badge-lg badge-gray">{status || 'ไม่มีสถานะ'}</span>;
  };

  if (!scan) {
    return (
      <section className="grand-hero-card empty-state">
        <div className="hero-status-bar">
          <div className="radar-status-pill">
            <span className="radar-ping" />
            <i className="led warning" />
            <span>กำลังรอสัญญาณตรวจจับแท็ก RFID จากเครื่องอ่าน...</span>
          </div>
        </div>
        <div className="grand-empty-body">
          <Radio size={56} className="text-muted animate-pulse" />
          <h3>ยังไม่มีข้อมูลการตรวจพบล่าสุด</h3>
          <p>เมื่อนำบัตรหรือแท็ก RFID เข้าใกล้เสาอากาศ ระบบจะบันทึกรหัสและถ่ายภาพสแนปช็อตที่นี่ทันที</p>
        </div>
      </section>
    );
  }

  const imageUrl = normalizeImageUrl(scan.latest_image);
  const cameraDisplayName = scan.camera_name || (scan.mcu_cam_id ? `MCU Cam #${scan.mcu_cam_id}` : (scan.ip_cam_id ? `IP Cam #${scan.ip_cam_id}` : 'ESP32-CAM / IP Camera'));
  const cameraTypeLabel = scan.camera_type || 'Event Camera';

  return (
    <section className="grand-hero-card">
      {/* Top Banner Status */}
      <div className="hero-status-bar">
        <div className="radar-status-pill">
          <span className="radar-ping" />
          <i className="led active" />
          <span>ข้อมูลการตรวจพบล่าสุด (Latest Detection Event)</span>
        </div>
        <div className="hero-live-timer">
          <Clock size={16} />
          <span>ตรวจพบ: <b>{relTime}</b></span>
        </div>
      </div>

      <div className="grand-hero-layout">
        {/* Left: Modern Glassmorphic Camera Frame (รูปถ่ายหลักฐานขณะสแกน) */}
        <div
          className="grand-camera-frame"
          onClick={() => {
            if (imageUrl) {
              onViewImage(
                imageUrl,
                scan.epc,
                `${cameraDisplayName} · อ่านโดย ${scan.scanned_by_device || 'RFID Reader'}`,
                formattedTime,
                scan.location
              );
            }
          }}
          title={imageUrl ? 'คลิกดูภาพหลักฐานขนาดใหญ่' : 'ไม่มีภาพหลักฐาน'}
        >
          {imageUrl ? (
            <>
              <img
                src={imageUrl}
                alt="Captured Snapshot"
                className="grand-camera-img"
                onError={(e) => {
                  (e.target as HTMLImageElement).src = '/logo.png';
                }}
              />

              {/* Glassmorphism HUD Overlay - Top Bar */}
              <div className="camera-hud-glass-top">
                <div className="hud-pill hud-pill-left">
                  <span className="hud-dot-pulse" />
                  <Camera size={13} className="text-pink inline mr-1" />
                  <span>ภาพสแนปช็อต</span>
                </div>

                <div className="hud-pill hud-pill-right" title="กล้องที่บันทึกภาพนี้">
                  <span className="mono font-semibold">{cameraDisplayName}</span>
                </div>
              </div>

              {/* Glassmorphism HUD Overlay - Bottom Bar */}
              <div className="camera-hud-glass-bottom">
                <div className="hud-timestamp-box">
                  <Clock size={12} className="inline mr-1 text-muted" />
                  <span>{formattedTime}</span>
                </div>

                <div className="hud-zoom-btn">
                  <ZoomIn size={13} />
                  <span>ขยายภาพ</span>
                </div>
              </div>
            </>
          ) : (
            <div className="grand-camera-empty">
              <Eye size={48} className="text-muted mb-2" />
              <h4>ไม่มีภาพถ่ายจากกล้อง</h4>
              <p>เครื่องอ่านบันทึกเฉพาะรหัสแท็ก RFID (ไม่มีกล้องในบริเวณนี้หรือเกิดความล่าช้าของภาพ)</p>
            </div>
          )}
        </div>

        {/* Right: Spacious Telemetry Information Panel */}
        <div className="grand-telemetry-panel">
          {/* 1. EPC Box */}
          <div className="grand-epc-box">
            <div className="grand-epc-header">
              <span className="telemetry-label">RFID EPC CODE (รหัสแท็ก)</span>
              <button
                className={`btn btn-secondary btn-sm copy-btn-lg ${copied ? 'copied' : ''}`}
                onClick={handleCopy}
                title="คัดลอกรหัส EPC"
              >
                {copied ? <Check size={15} className="text-green" /> : <Copy size={15} />}
                <span>{copied ? 'คัดลอกแล้ว' : 'คัดลอก EPC'}</span>
              </button>
            </div>
            <div className="grand-epc-value mono">{scan.epc || 'UNKNOWN'}</div>
          </div>

          {/* 2. Asset Name & Quick Edit Action */}
          <div className="grand-asset-card">
            <div className="asset-header-row">
              <span className="telemetry-label">ชื่อสิ่งของ / ทรัพย์สินที่ตรวจพบ</span>
              {onEditTag && (
                <button
                  type="button"
                  className="btn-edit-tag-quick"
                  onClick={() => onEditTag(scan.epc)}
                  title="แก้ไขชื่อสิ่งของหรือสถานะแท็กนี้"
                >
                  <Edit3 size={13} />
                  <span>ผูก/แก้ไขสิ่งของ</span>
                </button>
              )}
            </div>

            <div className="grand-asset-title">
              <Sparkles size={22} className="text-pink inline mr-2 shrink-0" />
              <span>{scan.equipment_name || 'ยังไม่ได้ผูกสิ่งของ (Unassigned)'}</span>
            </div>

            <div className="grand-status-row">
              <span className="telemetry-label-inline">สถานะแท็ก:</span>
              {getStatusBadge(scan.tag_status)}
            </div>
          </div>

          {/* 3. Spacious 4-Card Detection Specs Grid */}
          <div className="telemetry-spec-tiles">
            {/* Card 1: เครื่องอ่าน RFID */}
            <div className="spec-tile">
              <div className="spec-tile-icon pink">
                <Radio size={18} />
              </div>
              <div className="spec-tile-body">
                <span className="spec-tile-label">เครื่องอ่าน RFID</span>
                <div className="spec-tile-value">{scan.scanned_by_device || '-'}</div>
                <div className="spec-tile-chips">
                  <span className="chip-tag chip-pink">{(scan.device_type || 'RFID').toUpperCase()} READER</span>
                </div>
              </div>
            </div>

            {/* Card 2: กล้องที่บันทึกภาพ */}
            <div className="spec-tile highlight-cam">
              <div className="spec-tile-icon camera">
                <Camera size={18} />
              </div>
              <div className="spec-tile-body">
                <span className="spec-tile-label">กล้องที่บันทึกภาพ</span>
                <div className="spec-tile-value text-pink">{cameraDisplayName}</div>
                <div className="spec-tile-chips">
                  <span className="chip-tag chip-pink">{cameraTypeLabel}</span>
                  {scan.camera_ip && (
                    <span className="chip-tag chip-slate mono">IP: {scan.camera_ip}</span>
                  )}
                </div>
              </div>
            </div>

            {/* Card 3: จุดติดตั้ง */}
            <div className="spec-tile">
              <div className="spec-tile-icon location">
                <MapPin size={18} />
              </div>
              <div className="spec-tile-body">
                <span className="spec-tile-label">สถานที่ติดตั้ง</span>
                <div className="spec-tile-value">{scan.location || '-'}</div>
                <span className="spec-tile-sub">จุดตรวจจับประจำเสา</span>
              </div>
            </div>

            {/* Card 4: ระยะตรวจจับ */}
            <div className="spec-tile">
              <div className="spec-tile-icon distance">
                <Gauge size={18} />
              </div>
              <div className="spec-tile-body">
                <span className="spec-tile-label">ระยะตรวจจับ (Distance)</span>
                <div className="spec-tile-value text-green mono">
                  {scan.distance !== null && scan.distance !== undefined ? `${scan.distance} เมตร` : '-'}
                </div>
                <span className="spec-tile-sub">ประมาณการจากคลื่น RSSI</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
