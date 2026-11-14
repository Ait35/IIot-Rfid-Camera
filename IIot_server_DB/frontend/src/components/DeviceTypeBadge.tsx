import React from 'react';
import { Radio, Camera, Video } from 'lucide-react';

export const DeviceTypeIcon: React.FC<{ type?: string; size?: number }> = ({
  type,
  size = 16,
}) => {
  const t = type?.toLowerCase();
  if (t === 'ip_cam') {
    return <Video size={size} className="text-pink" style={{ flexShrink: 0 }} />;
  }
  if (t === 'cam') {
    return <Camera size={size} className="text-pink" style={{ flexShrink: 0 }} />;
  }
  return <Radio size={size} className="text-pink" style={{ flexShrink: 0 }} />;
};

export const DeviceTypeBadge: React.FC<{ type?: string }> = ({ type }) => {
  const t = type?.toLowerCase();
  const isCam = t === 'ip_cam' || t === 'cam';
  const label = t === 'ip_cam' ? 'IP-CAM' : type?.toUpperCase() || '-';

  return (
    <span
      className={`badge ${isCam ? 'badge-pink' : 'badge-gray'}`}
      style={{ whiteSpace: 'nowrap' }}
    >
      {label}
    </span>
  );
};
