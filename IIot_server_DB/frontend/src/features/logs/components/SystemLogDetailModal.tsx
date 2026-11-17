import React from 'react';
import { ClipboardList, X, Info } from 'lucide-react';
import type { SystemLogRecord } from '../../../types';
import { formatThaiDateTime } from '../../../services/utils';

interface SystemLogDetailModalProps {
  log: SystemLogRecord | null;
  onClose: () => void;
}

export const SystemLogDetailModal: React.FC<SystemLogDetailModalProps> = ({
  log,
  onClose,
}) => {
  if (!log) return null;

  const actorName =
    log.first_name || log.last_name
      ? `${log.first_name || ''} ${log.last_name || ''}`.trim()
      : log.user_id
      ? `User #${log.user_id}`
      : 'System';

  return (
    <div className="modal-backdrop active" onClick={onClose}>
      <div
        className="modal-card"
        style={{ maxWidth: '640px', width: '95%' }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="modal-head">
          <div className="modal-title-wrap">
            <ClipboardList size={18} className="text-pink" />
            <div>
              <h3>System Log #{log.activity_id}</h3>
              <p className="modal-sub">
                {log.action_type} · {log.target_table || '-'}
                {log.target_id !== null ? ` #${log.target_id}` : ''}
              </p>
            </div>
          </div>
          <button
            type="button"
            className="btn-ghost icon-btn"
            onClick={onClose}
            aria-label="Close modal"
          >
            <X size={18} />
          </button>
        </div>

        <div className="modal-body-form" style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
          <div className="form-section-box">
            <div className="form-section-title">
              <Info size={14} style={{ display: 'inline', marginRight: '6px' }} />
              ข้อมูลเหตุการณ์
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', fontSize: '13px' }}>
              <div>
                <div className="text-muted">ผู้ใช้งาน</div>
                <div style={{ fontWeight: 600 }}>{actorName}</div>
              </div>
              <div>
                <div className="text-muted">เวลาที่ทำรายการ</div>
                <div style={{ fontWeight: 600 }}>
                  {formatThaiDateTime(log.time_action, true)}
                </div>
              </div>
            </div>
          </div>

          <div className="form-section-box">
            <div className="form-section-title">Payload JSON</div>
            <pre
              style={{
                margin: 0,
                padding: '12px',
                background: '#0f172a',
                color: '#e2e8f0',
                borderRadius: 'var(--radius-sm)',
                fontSize: '12px',
                overflowX: 'auto',
                maxHeight: '280px',
              }}
            >
              {JSON.stringify(log.payload ?? {}, null, 2)}
            </pre>
          </div>
        </div>

        <div className="modal-foot">
          <button type="button" className="btn btn-secondary" onClick={onClose}>
            ปิดหน้าต่าง
          </button>
        </div>
      </div>
    </div>
  );
};
