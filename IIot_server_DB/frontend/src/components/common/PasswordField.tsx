import React from 'react';
import { Eye, EyeOff, Lock } from 'lucide-react';

interface PasswordFieldProps {
  label: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  required?: boolean;
  disabled?: boolean;
  showPassword: boolean;
  onToggleShow?: () => void;
}

/**
 * Standard password input with lock icon and optional visibility toggle.
 */
export const PasswordField: React.FC<PasswordFieldProps> = ({
  label,
  value,
  onChange,
  placeholder,
  required = false,
  disabled = false,
  showPassword,
  onToggleShow,
}) => (
  <div className="form-group">
    <label className="form-label">
      <span>{label}</span>
      {required && <span className="req"> *</span>}
    </label>
    <div className="input-icon-wrap">
      <Lock size={15} className="input-icon" />
      <input
        type={showPassword ? 'text' : 'password'}
        required={required}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        disabled={disabled}
      />
      {onToggleShow && (
        <button
          type="button"
          className="input-eye-btn"
          onClick={onToggleShow}
          title={showPassword ? 'ซ่อนรหัสผ่าน' : 'แสดงรหัสผ่าน'}
        >
          {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
        </button>
      )}
    </div>
  </div>
);
