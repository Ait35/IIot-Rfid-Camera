import React, { useState, useEffect } from 'react';
import { PlusCircle, Cpu, Video, Save, ArrowLeft } from 'lucide-react';
import { api } from '../../services/api';
import type { GroupInfo } from '../../types';
import {
  type HardwareFormState,
  createInitialHardwareForm,
  buildCreateDevicePayload,
  buildIPCamPayload,
} from './deviceFormHelpers';
import {
  GeneralHardwareSection,
  McuNetworkSection,
  IpCamConfigSection,
} from './components/HardwareFormSections';

interface AddDevicePageProps {
  onDevicesChanged: () => void;
  onNavigate: (tab: string) => void;
  showToast: (msg: string, type: 'success' | 'error' | 'info') => void;
}

export const AddDevicePage: React.FC<AddDevicePageProps> = ({
  onDevicesChanged,
  onNavigate,
  showToast,
}) => {
  const [groups, setGroups] = useState<GroupInfo[]>([]);
  const [form, setForm] = useState<HardwareFormState>(() => createInitialHardwareForm('1', ''));
  const [isSaving, setIsSaving] = useState(false);
  const [isProbing, setIsProbing] = useState(false);

  useEffect(() => {
    api.getGroups(1, 100).then((res) => {
      if (res.success && Array.isArray(res.data) && res.data.length > 0) {
        setGroups(res.data);
        setForm((prev) => ({ ...prev, groupId: String(res.data![0].group_id) }));
      }
    });
  }, []);

  const updateField = <K extends keyof HardwareFormState>(
    field: K,
    value: HardwareFormState[K]
  ) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  const resetForm = () => {
    const firstGroupId = groups[0]?.group_id ? String(groups[0].group_id) : '1';
    setForm((prev) => ({
      ...createInitialHardwareForm(firstGroupId, ''),
      kind: prev.kind,
    }));
  };

  const handleProbeCamera = async () => {
    if (!form.ip.trim() && !form.onvifUrl.trim()) {
      showToast('กรุณากรอก IP Address หรือ ONVIF URL ก่อนทำการ Probe', 'info');
      return;
    }
    setIsProbing(true);
    try {
      const payload: Record<string, any> = {};
      if (form.ip.trim()) payload.ip = form.ip.trim();
      if (form.onvifUrl.trim()) payload.ONVIF_url = form.onvifUrl.trim();
      if (form.camUsername.trim()) payload.cam_username = form.camUsername.trim();
      if (form.camPassword.trim()) payload.cam_password = form.camPassword.trim();

      const res = await api.probeIPCam(payload);
      if (res.success && res.data) {
        const d = res.data;
        setForm((prev) => ({
          ...prev,
          mac: d.mac && !prev.mac.trim() ? d.mac : prev.mac,
          brand: d.brand || prev.brand,
          model: d.model || prev.model,
          rtspUrl: d.rtsp_url || prev.rtspUrl,
          snapshotUrl: d.snapshot_url || prev.snapshotUrl,
          onvifUrl: d.ONVIF_url || prev.onvifUrl,
        }));
        showToast('ดึงข้อมูลกล้องอัตโนมัติสำเร็จ (Probe OK)', 'success');
      } else {
        showToast(res.error || 'ไม่สามารถ Probe ข้อมูลกล้องได้', 'error');
      }
    } catch (err: any) {
      showToast(err.message || 'เกิดข้อผิดพลาดในการ Probe กล้อง', 'error');
    } finally {
      setIsProbing(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    try {
      const res =
        form.kind === 'device'
          ? await api.createDevice(buildCreateDevicePayload(form))
          : await api.createIPCam(buildIPCamPayload(form, 'create'));

      if (res.success) {
        showToast(
          form.kind === 'device' ? 'เพิ่มอุปกรณ์ MCU / RFID สำเร็จ' : 'เพิ่มกล้อง IP Camera สำเร็จ',
          'success'
        );
        resetForm();
        onDevicesChanged();
        onNavigate('device_manager');
      } else {
        showToast(res.error || 'ไม่สามารถเพิ่มอุปกรณ์ได้', 'error');
      }
    } catch (err: any) {
      showToast(err.message || 'เกิดข้อผิดพลาดในการเชื่อมต่อเซิร์ฟเวอร์', 'error');
    } finally {
      setIsSaving(false);
    }
  };

  const kindCards: Array<{
    key: HardwareFormState['kind'];
    title: string;
    desc: string;
    icon: React.ReactNode;
  }> = [
    {
      key: 'device',
      title: 'MCU / RFID Reader',
      desc: 'บอร์ด ESP32-S3 เครื่องอ่าน RFID หรือกล้อง MCU',
      icon: <Cpu size={24} className="text-pink" style={{ flexShrink: 0 }} />,
    },
    {
      key: 'ip_cam',
      title: 'IP Camera (CCTV)',
      desc: 'กล้องวงจรปิด IP ที่รองรับ Snapshot / RTSP / ONVIF',
      icon: <Video size={24} className="text-pink" style={{ flexShrink: 0 }} />,
    },
  ];

  return (
    <div className="devices-page">
      <div className="page-header-row">
        <div>
          <h2 style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <PlusCircle size={22} className="text-pink" />
            <span>เพิ่มอุปกรณ์ใหม่เข้าระบบ (Add Device)</span>
          </h2>
          <p className="page-sub">
            ลงทะเบียนเครื่องอ่าน RFID, กล้อง MCU (ESP32-CAM) หรือกล้อง IP Camera เข้าสู่กลุ่มอุปกรณ์
          </p>
        </div>
        <button
          type="button"
          className="btn btn-secondary btn-sm"
          onClick={() => onNavigate('device_manager')}
        >
          <ArrowLeft size={15} />
          <span>กลับหน้า Manager</span>
        </button>
      </div>

      <div className="history-table-card" style={{ padding: '24px', maxWidth: '840px' }}>
        <div className="form-section-box" style={{ marginBottom: '18px' }}>
          <div className="form-section-title">
            <span>1. เลือกประเภทฮาร์ดแวร์ที่ต้องการเพิ่ม</span>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, minmax(0, 1fr))', gap: '12px' }}>
            {kindCards.map((card) => {
              const active = form.kind === card.key;
              return (
                <button
                  key={card.key}
                  type="button"
                  onClick={() => updateField('kind', card.key)}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '12px',
                    padding: '14px 16px',
                    borderRadius: '10px',
                    border: active ? '2px solid var(--pink)' : '1px solid var(--line)',
                    background: active ? '#fff5f8' : '#fff',
                    cursor: 'pointer',
                    textAlign: 'left',
                    transition: 'all 0.15s ease',
                  }}
                >
                  {card.icon}
                  <div>
                    <div style={{ fontWeight: 700, fontSize: '14px', color: 'var(--ink)' }}>
                      {card.title}
                    </div>
                    <div style={{ fontSize: '12px', color: 'var(--muted)' }}>{card.desc}</div>
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}>
          <GeneralHardwareSection
            form={form}
            onChange={updateField}
            groups={groups}
            mode="create"
            title="2. ข้อมูลพื้นฐานและตำแหน่งติดตั้ง"
          />

          {form.kind === 'device' ? (
            <McuNetworkSection form={form} onChange={updateField} />
          ) : (
            <IpCamConfigSection
              form={form}
              onChange={updateField}
              mode="create"
              isProbing={isProbing}
              onProbe={handleProbeCamera}
            />
          )}

          <div
            style={{
              display: 'flex',
              justifyContent: 'flex-end',
              gap: '12px',
              paddingTop: '12px',
              borderTop: '1px solid var(--line)',
            }}
          >
            <button
              type="button"
              className="btn btn-secondary"
              onClick={resetForm}
              disabled={isSaving}
            >
              ล้างค่า
            </button>
            <button type="submit" className="btn btn-primary" disabled={isSaving}>
              <Save size={16} />
              <span>{isSaving ? 'กำลังบันทึก...' : 'บันทึกอุปกรณ์'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
