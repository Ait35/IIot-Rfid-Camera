import React, { useEffect } from 'react';
import { X, Download, Camera } from 'lucide-react';
import { normalizeImageUrl } from '../services/utils';

interface ImageModalProps {
  isOpen: boolean;
  imageUrl: string;
  epc: string;
  device: string;
  timestamp: string;
  location?: string;
  onClose: () => void;
}

export const ImageModal: React.FC<ImageModalProps> = ({
  isOpen,
  imageUrl,
  epc,
  device,
  timestamp,
  location,
  onClose,
}) => {
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    if (isOpen) {
      window.addEventListener('keydown', handleKeyDown);
    }
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const safeUrl = normalizeImageUrl(imageUrl) || '/logo.png';

  return (
    <div className="modal-backdrop active" onClick={onClose}>
      <div className="modal-card" onClick={(e) => e.stopPropagation()}>
        <div className="modal-head">
          <div className="modal-title-wrap">
            <Camera size={18} className="text-pink" />
            <h3>ภาพถ่ายหลักฐานจากกล้อง (Evidence Snapshot)</h3>
          </div>
          <button className="btn-ghost icon-btn" onClick={onClose} title="ปิดหน้าต่าง">
            <X size={18} />
          </button>
        </div>

        <div className="modal-body">
          <img
            src={safeUrl}
            alt="Camera Evidence Snapshot"
            className="modal-image-view"
            onError={(e) => {
              (e.target as HTMLImageElement).src = '/logo.png';
            }}
          />
        </div>

        <div className="modal-meta-grid">
          <div className="modal-meta-item">
            <span className="modal-meta-label">RFID EPC CODE</span>
            <span className="modal-meta-value mono">{epc || '-'}</span>
          </div>
          <div className="modal-meta-item">
            <span className="modal-meta-label">ข้อมูลกล้องและอุปกรณ์</span>
            <span className="modal-meta-value">{device || '-'}</span>
          </div>
          <div className="modal-meta-item">
            <span className="modal-meta-label">เวลาที่ตรวจพบและบันทึก</span>
            <span className="modal-meta-value">{timestamp || '-'}</span>
          </div>
          {location && (
            <div className="modal-meta-item">
              <span className="modal-meta-label">สถานที่ติดตั้ง</span>
              <span className="modal-meta-value">{location}</span>
            </div>
          )}
        </div>

        <div className="modal-foot">
          <a
            href={safeUrl}
            target="_blank"
            rel="noreferrer"
            download
            className="btn btn-secondary btn-sm"
          >
            <Download size={14} />
            <span>ดาวน์โหลดรูปภาพ</span>
          </a>
        </div>
      </div>
    </div>
  );
};
