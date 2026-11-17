import React from 'react';
import { CalendarClock } from 'lucide-react';

interface DateTimeRangeBarProps {
  label: string;
  startAt: string;
  endAt: string;
  onStartChange: (value: string) => void;
  onEndChange: (value: string) => void;
  startAriaLabel?: string;
  endAriaLabel?: string;
}

/**
 * Shared `datetime-local` range filter row used in toolbar headers.
 */
export const DateTimeRangeBar: React.FC<DateTimeRangeBarProps> = ({
  label,
  startAt,
  endAt,
  onStartChange,
  onEndChange,
  startAriaLabel = 'วันเวลาเริ่มต้น',
  endAriaLabel = 'วันเวลาสิ้นสุด',
}) => (
  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
    <CalendarClock size={15} className="text-muted" />
    <span className="text-muted" style={{ fontSize: '12.5px', fontWeight: 600 }}>
      {label}
    </span>
    <span className="text-muted" style={{ fontSize: '12px' }}>
      ตั้งแต่
    </span>
    <input
      type="datetime-local"
      className="date-filter-input"
      value={startAt}
      onChange={(e) => onStartChange(e.target.value)}
      aria-label={startAriaLabel}
    />
    <span className="text-muted" style={{ fontSize: '12px' }}>
      ถึง
    </span>
    <input
      type="datetime-local"
      className="date-filter-input"
      value={endAt}
      onChange={(e) => onEndChange(e.target.value)}
      aria-label={endAriaLabel}
    />
  </div>
);
