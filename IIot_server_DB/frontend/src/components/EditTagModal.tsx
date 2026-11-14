import React, { useState, useEffect } from 'react';
import { X, Save, Tags, User, Clock, AlertTriangle, Copy, Check, Trash2 } from 'lucide-react';
import type { TagInfo } from '../types';
import { api } from '../services/api';

interface EditTagModalProps {
  isOpen: boolean;
  tag: TagInfo | null;
  onClose: () => void;
  onSuccess: (updatedTag: TagInfo) => void;
  onDelete?: (tag: TagInfo) => Promise<void> | void;
}

export const EditTagModal: React.FC<EditTagModalProps> = ({
  isOpen,
  tag,
  onClose,
  onSuccess,
  onDelete,
}) => {
  const [tagName, setTagName] = useState('');
  const [status, setStatus] = useState<'active' | 'pending' | 'stolen'>('pending');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (tag) {
      setTagName(tag.tag || '');
      setStatus((tag.status as any) || 'pending');
      setErrorMsg(null);
    }
  }, [tag, isOpen]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && !isSubmitting) onClose();
    };
    if (isOpen) {
      window.addEventListener('keydown', handleKeyDown);
    }
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, isSubmitting, onClose]);

  if (!isOpen || !tag) return null;

  const handleCopy = () => {
    if (!tag.epc) return;
    navigator.clipboard.writeText(tag.epc);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setIsSubmitting(true);

    try {
      const res = await api.patchTag({
        epc_id: tag.epc_id,
        tag: tagName.trim() || undefined,
        status: status,
      });

      if (res.success && res.data) {
        onSuccess(res.data);
        onClose();
      } else {
        setErrorMsg(res.error || res.message || 'ไม่สามารถแก้ไขข้อมูลแท็กได้');
      }
    } catch (err: any) {
      setErrorMsg(err.message || 'เกิดข้อผิดพลาดในการเชื่อมต่อเซิร์ฟเวอร์');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="modal-backdrop active" onClick={() => !isSubmitting && onClose()}>
      <div className="modal-card edit-tag-modal-card" onClick={(e) => e.stopPropagation()}>
        {/* Modal Header */}
        <div className="modal-head">
          <div className="modal-title-wrap">
            <Tags size={20} className="text-pink" />
            <div>
              <h3>แก้ไขข้อมูลแท็ก RFID (Edit Map Tag)</h3>
              <p className="modal-sub">กำหนดชื่อสิ่งของและสถานะการใช้งานของรหัสแท็กนี้</p>
            </div>
          </div>
          <button
            className="btn-ghost icon-btn"
            onClick={onClose}
            disabled={isSubmitting}
            title="ปิดหน้าต่าง"
          >
            <X size={18} />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit}>
          <div className="modal-body-form">
            {errorMsg && (
              <div className="form-error-banner">
                <AlertTriangle size={16} className="shrink-0" />
                <span>{errorMsg}</span>
              </div>
            )}

            {/* Read-Only Hardware Tag Identity */}
            <div className="tag-identity-box">
              <div className="tag-identity-row">
                <span className="telemetry-label">RFID EPC CODE</span>
                <button
                  type="button"
                  className="copy-btn text-xs flex items-center gap-1 text-muted"
                  onClick={handleCopy}
                  title="คัดลอกรหัส EPC"
                >
                  {copied ? <Check size={13} className="text-green" /> : <Copy size={13} />}
                  <span>{copied ? 'คัดลอกแล้ว' : 'คัดลอก'}</span>
                </button>
              </div>
              <div className="tag-epc-display mono">{tag.epc}</div>
              <div className="tag-meta-sub-row">
                <span>Tag ID: <b>#{tag.epc_id}</b></span>
                <span>•</span>
                <span>
                  <User size={12} className="inline mr-1" />
                  ผู้รับผิดชอบ: <b>{tag.by_user_name || 'ยังไม่กำหนด'}</b>
                </span>
                <span>•</span>
                <span>
                  <Clock size={12} className="inline mr-1" />
                  ลงทะเบียน: <b>{tag.created_at ? new Date(tag.created_at).toLocaleDateString('th-TH') : '-'}</b>
                </span>
              </div>
            </div>

            {/* Input 1: Asset / Equipment Name */}
            <div className="form-field">
              <label htmlFor="tag-name-input">
                ชื่อสิ่งของ / ทรัพย์สินที่ผูกกับแท็ก <span className="text-pink">*</span>
              </label>
              <input
                id="tag-name-input"
                type="text"
                className="form-input"
                placeholder="เช่น บัตรประจำตัวนักศึกษา, โน้ตบุ๊ก Lab 901, รถเข็นเครื่องมือ"
                value={tagName}
                onChange={(e) => setTagName(e.target.value)}
                maxLength={100}
                autoFocus
              />
              <span className="field-hint">
                กรอกชื่อสิ่งของหรืออุปกรณ์เพื่อให้ระบบระบุตัวตนได้ชัดเจนเมื่อตรวจพบ
              </span>
            </div>

            {/* Input 2: Status Selection */}
            <div className="form-field">
              <label htmlFor="tag-status-select">
                สถานะการใช้งานแท็ก (Tag Status) <span className="text-pink">*</span>
              </label>
              <select
                id="tag-status-select"
                className="form-input select-input"
                value={status}
                onChange={(e) => setStatus(e.target.value as any)}
              >
                <option value="active">🟢 เปิดใช้งาน (Active) - พร้อมใช้งานและตรวจจับ</option>
                <option value="pending">🟡 รอผูกสิ่งของ (Pending) - ยังไม่ได้เปิดใช้เต็มรูปแบบ</option>
                <option value="stolen">🔴 แจ้งหาย / ถูกขโมย (Stolen) - ส่งสัญญาณเตือนเมื่อพบ</option>
              </select>
            </div>
          </div>

          {/* Modal Footer Actions */}
          <div className="modal-foot modal-foot-between">
            <div>
              {onDelete && (
                <button
                  type="button"
                  className="btn btn-danger-outline btn-sm"
                  onClick={() => onDelete(tag)}
                  disabled={isSubmitting}
                  title="ลบแท็กออกจากรายการ (Soft Delete & รีเซ็ตค่า)"
                >
                  <Trash2 size={14} />
                  <span>ลบแท็ก</span>
                </button>
              )}
            </div>
            <div className="flex items-center gap-2">
              <button
                type="button"
                className="btn btn-secondary btn-sm"
                onClick={onClose}
                disabled={isSubmitting}
              >
                ยกเลิก
              </button>
              <button
                type="submit"
                className="btn btn-primary btn-sm"
                disabled={isSubmitting}
              >
                {isSubmitting ? (
                  <>
                    <span className="spin mr-1">⏳</span>
                    <span>กำลังบันทึก...</span>
                  </>
                ) : (
                  <>
                    <Save size={14} />
                    <span>บันทึกการแก้ไข</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};
