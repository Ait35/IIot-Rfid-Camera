export type HardwareKind = 'device' | 'ip_cam';
export type McuDeviceType = 'RFID' | 'CAM';
export type CamAuthMode = 'auto' | 'query' | 'basic' | 'digest';

export interface HardwareFormState {
  kind: HardwareKind;
  name: string;
  groupId: string;
  mac: string;
  ip: string;
  local: string;
  deviceType: McuDeviceType;
  subnet: string;
  gateway: string;
  brand: string;
  model: string;
  rtspUrl: string;
  snapshotUrl: string;
  onvifUrl: string;
  camUsername: string;
  camPassword: string;
  authMode: CamAuthMode;
  keepAlivePort: string;
}

export function createInitialHardwareForm(
  defaultGroupId = '1',
  defaultSubnet = ''
): HardwareFormState {
  return {
    kind: 'device',
    name: '',
    groupId: defaultGroupId,
    mac: '',
    ip: '',
    local: '',
    deviceType: 'RFID',
    subnet: defaultSubnet,
    gateway: '',
    brand: '',
    model: '',
    rtspUrl: '',
    snapshotUrl: '',
    onvifUrl: '',
    camUsername: '',
    camPassword: '',
    authMode: 'auto',
    keepAlivePort: 'auto',
  };
}

export function buildCreateDevicePayload(form: HardwareFormState) {
  const payload: {
    device_name: string;
    mac: string;
    local: string;
    group_id: number;
    type: McuDeviceType;
    ip?: string;
    subnet?: string;
    gate_way?: string;
  } = {
    device_name: form.name.trim(),
    mac: form.mac.trim(),
    local: form.local.trim(),
    group_id: Number(form.groupId),
    type: form.deviceType,
  };
  if (form.ip.trim()) payload.ip = form.ip.trim();
  if (form.subnet.trim()) payload.subnet = form.subnet.trim();
  if (form.gateway.trim()) payload.gate_way = form.gateway.trim();
  return payload;
}

export function buildPatchDevicePayload(form: HardwareFormState, deviceId: number) {
  return {
    device_id: deviceId,
    device_name: form.name.trim(),
    device_type: form.deviceType,
    group_id: Number(form.groupId),
    local: form.local.trim(),
    ip: form.ip.trim(),
    subnet: form.subnet.trim(),
    gate_way: form.gateway.trim(),
  };
}

export function buildIPCamPayload(
  form: HardwareFormState,
  mode: 'create' | 'edit',
  camId?: number
): Record<string, any> {
  const portRaw = form.keepAlivePort.trim();
  const portVal = portRaw === '' || portRaw.toLowerCase() === 'auto' ? 'auto' : Number(portRaw);

  const payload: Record<string, any> =
    mode === 'edit' && camId !== undefined
      ? {
          ip_cam_id: camId,
          cam_name: form.name.trim(),
          group_id: Number(form.groupId),
          ip: form.ip.trim(),
          local: form.local.trim(),
          auth: form.authMode,
          keep_alive_port: portVal,
        }
      : {
          cam_name: form.name.trim(),
          ip: form.ip.trim(),
          local: form.local.trim(),
          group_id: Number(form.groupId),
          auth: form.authMode,
          keep_alive_port: portVal,
        };

  if (mode === 'create' && form.mac.trim()) payload.mac = form.mac.trim();
  if (form.brand.trim()) payload.brand = form.brand.trim();
  if (form.model.trim()) payload.model = form.model.trim();
  if (form.rtspUrl.trim()) payload.rtsp_url = form.rtspUrl.trim();
  if (form.snapshotUrl.trim()) payload.snapshot_url = form.snapshotUrl.trim();
  if (form.onvifUrl.trim()) payload.ONVIF_url = form.onvifUrl.trim();
  if (form.camUsername.trim()) payload.cam_username = form.camUsername.trim();
  if (form.camPassword.trim()) payload.cam_password = form.camPassword.trim();
  return payload;
}
