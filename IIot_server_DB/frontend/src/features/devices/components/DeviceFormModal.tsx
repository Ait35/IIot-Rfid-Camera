import React, { useState, useEffect } from 'react';
import { X, Save, Plus, Cpu, Video } from 'lucide-react';
import { api } from '../../../services/api';
import type { GroupInfo } from '../../../types';
import {
  type HardwareFormState,
  type CamAuthMode,
  createInitialHardwareForm,
  buildCreateDevicePayload,
  buildPatchDevicePayload,
  buildIPCamPayload,
} from '../deviceFormHelpers';
import {
  GeneralHardwareSection,
  McuNetworkSection,
  IpCamConfigSection,
} from './HardwareFormSections';

export interface EditableHardwareItem {
  kind: 'device' | 'ip_cam';
  id: number;
  name: string;
  device_type: string; // 'RFID' | 'CAM' | 'ip_cam'
  brand?: string | null;
  model?: string | null;
  group_id?: number | null;
  mac?: string | null;
  ip?: string | null;
  subnet?: string | null;
  gate_way?: string | null;
  local?: string | null;
  status?: boolean;
  rtsp_url?: string | null;
  snapshot_url?: string | null;
  onvif_url?: string | null;
  cam_username?: string | null;
  auth?: string | null;
  keep_alive_port?: number | string | null;
}

interface DeviceFormModalProps {
  isOpen: boolean;
  mode: 'create' | 'edit';
  initialItem: EditableHardwareItem | null;
  groups: GroupInfo[];
  onClose: () => void;
  onSubmitDevice: (payload: any, isEdit: boolean) => Promise<boolean>;
  onSubmitIPCam: (payload: any, isEdit: boolean) => Promise<boolean>;
}

function mapItemToFormState(
  item: EditableHardwareItem,
  fallbackGroupId: string
): HardwareFormState {
  return {
    kind: item.kind,
    name: item.name || '',
    groupId: item.group_id ? String(item.group_id) : fallbackGroupId,
    mac: item.mac && item.mac !== '-' ? item.mac : '',
    ip: item.ip && item.ip !== '-' ? item.ip : '',
    subnet: item.subnet || '255.255.255.0',
    gateway: item.gate_way || '127.0.0.1',
    local: item.local && item.local !== '-' ? item.local : '',
    deviceType: item.device_type?.toUpperCase() === 'CAM' ? 'CAM' : 'RFID',
    brand: item.brand || '',
    model: item.model || '',
    rtspUrl: item.rtsp_url || '',
    snapshotUrl: item.snapshot_url || '',
    onvifUrl: item.onvif_url || '',
    camUsername: item.cam_username || '',
    camPassword: '',
    authMode: (item.auth as CamAuthMode) || 'auto',
    keepAlivePort: item.keep_alive_port != null ? String(item.keep_alive_port) : 'auto',
  };
}

export const DeviceFormModal: React.FC<DeviceFormModalProps> = ({
  isOpen,
  mode,
  initialItem,
  groups,
  onClose,
  onSubmitDevice,
  onSubmitIPCam,
}) => {
  const defaultGroupId = groups[0]?.group_id ? String(groups[0].group_id) : '1';
  const [form, setForm] = useState<HardwareFormState>(() =>
    createInitialHardwareForm(defaultGroupId, '255.255.255.0')
  );
  const [isSaving, setIsSaving] = useState(false);
  const [isProbing, setIsProbing] = useState(false);

  useEffect(() => {
    if (!isOpen) return;
    if (mode === 'edit' && initialItem) {
      setForm(mapItemToFormState(initialItem, defaultGroupId));
    } else {
      setForm(createInitialHardwareForm(defaultGroupId, '255.255.255.0'));
    }
  }, [isOpen, mode, initialItem, defaultGroupId]);

  if (!isOpen) return null;

  const updateField = <K extends keyof HardwareFormState>(
    field: K,
    value: HardwareFormState[K]
  ) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  const handleProbeCamera = async () => {
    if (!form.ip.trim() && !form.onvifUrl.trim() && !initialItem?.id) return;
    setIsProbing(true);
    try {
      const payload: Record<string, any> = {};
      if (initialItem?.id && mode === 'edit') payload.ip_cam_id = initialItem.id;
      if (form.ip.trim()) payload.ip = form.ip.trim();
      if (form.onvifUrl.trim()) payload.ONVIF_url = form.onvifUrl.trim();
      if (form.camUsername.trim()) payload.cam_username = form.camUsername.trim();
      if (form.camPassword.trim()) payload.cam_password = form.camPassword.trim();

      const res = await api.probeIPCam(payload);
      if (res.success && res.data) {
        const d = res.data;
        setForm((prev) => ({
          ...prev,
          brand: d.brand || prev.brand,
          model: d.model || prev.model,
          rtspUrl: d.rtsp_url || prev.rtspUrl,
          snapshotUrl: d.snapshot_url || prev.snapshotUrl,
          onvifUrl: d.ONVIF_url || prev.onvifUrl,
        }));
      }
    } finally {
      setIsProbing(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    try {
      let ok = false;
      const isEdit = mode === 'edit';

      if (form.kind === 'device') {
        if (!isEdit) {
          ok = await onSubmitDevice(buildCreateDevicePayload(form), false);
        } else if (initialItem) {
          ok = await onSubmitDevice(buildPatchDevicePayload(form, initialItem.id), true);
        }
      } else if (!isEdit || initialItem) {
        const payload = buildIPCamPayload(form, mode, initialItem?.id);
        ok = await onSubmitIPCam(payload, isEdit);
      }

      if (ok) onClose();
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="modal-backdrop active" onClick={() => !isSaving && onClose()}>
      <div
        className="modal-card"
        style={{ maxWidth: '580px', width: '95%', maxHeight: '90vh', overflowY: 'auto' }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="modal-head">
          <div className="modal-title-wrap">
            {mode === 'create' ? (
              <Plus size={18} className="text-pink" />
            ) : (
              <Save size={18} className="text-pink" />
            )}
            <div>
              <h3>
                {mode === 'create'
                  ? 'เพิ่มอุปกรณ์ใหม่เข้าระบบ'
                  : form.kind === 'ip_cam'
                    ? `แก้ไขกล้อง IP Camera (#${initialItem?.id})`
                    : `แก้ไขอุปกรณ์ MCU / RFID (#${initialItem?.id})`}
              </h3>
              <p className="modal-sub">
                {mode === 'create'
                  ? 'เลือกประเภทอุปกรณ์และกรอกข้อมูลที่จำเป็น'
                  : 'ปรับปรุงข้อมูลเครือข่าย ตำแหน่ง และค่าตั้งของอุปกรณ์'}
              </p>
            </div>
          </div>
          <button
            className="btn-ghost icon-btn"
            onClick={onClose}
            disabled={isSaving}
            aria-label="Close modal"
          >
            <X size={18} />
          </button>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="modal-body-form" style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            {mode === 'create' && (
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                <button
                  type="button"
                  className={`btn btn-sm ${form.kind === 'device' ? 'btn-primary' : 'btn-secondary'}`}
                  onClick={() => updateField('kind', 'device')}
                >
                  <Cpu size={16} />
                  <span>MCU / RFID Reader</span>
                </button>
                <button
                  type="button"
                  className={`btn btn-sm ${form.kind === 'ip_cam' ? 'btn-primary' : 'btn-secondary'}`}
                  onClick={() => updateField('kind', 'ip_cam')}
                >
                  <Video size={16} />
                  <span>IP Camera</span>
                </button>
              </div>
            )}

            <GeneralHardwareSection form={form} onChange={updateField} groups={groups} mode={mode} />

            {form.kind === 'device' ? (
              <McuNetworkSection form={form} onChange={updateField} />
            ) : (
              <IpCamConfigSection
                form={form}
                onChange={updateField}
                mode={mode}
                isProbing={isProbing}
                onProbe={handleProbeCamera}
              />
            )}
          </div>

          <div className="modal-foot" style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
            <button type="button" className="btn btn-secondary btn-sm" onClick={onClose} disabled={isSaving}>
              ยกเลิก
            </button>
            <button type="submit" className="btn btn-primary btn-sm" disabled={isSaving}>
              <Save size={15} />
              <span>{isSaving ? 'กำลังบันทึก...' : mode === 'create' ? 'เพิ่มอุปกรณ์' : 'บันทึกการแก้ไข'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
