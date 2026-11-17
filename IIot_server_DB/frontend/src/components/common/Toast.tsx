import React, { useEffect } from 'react';
import { CheckCircle2, AlertCircle, Info, X } from 'lucide-react';

export interface ToastMessage {
  id: string;
  type: 'success' | 'error' | 'info';
  message: string;
}

interface ToastProps {
  toasts: ToastMessage[];
  onDismiss: (id: string) => void;
}

export const ToastContainer: React.FC<ToastProps> = ({ toasts, onDismiss }) => {
  return (
    <div className="toast-container">
      {toasts.map((toast) => (
        <ToastItem key={toast.id} toast={toast} onDismiss={onDismiss} />
      ))}
    </div>
  );
};

const ToastItem: React.FC<{ toast: ToastMessage; onDismiss: (id: string) => void }> = ({ toast, onDismiss }) => {
  useEffect(() => {
    const timer = setTimeout(() => {
      onDismiss(toast.id);
    }, 3500);
    return () => clearTimeout(timer);
  }, [toast.id, onDismiss]);

  const getIcon = () => {
    switch (toast.type) {
      case 'success':
        return <CheckCircle2 className="toast-icon text-green-400" size={18} />;
      case 'error':
        return <AlertCircle className="toast-icon text-red-400" size={18} />;
      default:
        return <Info className="toast-icon text-pink-400" size={18} />;
    }
  };

  return (
    <div className={`toast toast-${toast.type}`}>
      {getIcon()}
      <div className="toast-text">{toast.message}</div>
      <button className="toast-close" onClick={() => onDismiss(toast.id)}>
        <X size={14} />
      </button>
    </div>
  );
};
