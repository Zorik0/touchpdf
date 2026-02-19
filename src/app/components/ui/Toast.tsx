'use client';

import React, { createContext, useContext, useState, useCallback, ReactNode } from 'react';
import { X, CheckCircle, AlertCircle, Info } from 'lucide-react';

export type ToastType = 'success' | 'error' | 'info';

interface Toast {
  id: string;
  message: string;
  type: ToastType;
}

interface ToastContextType {
  addToast: (message: string, type?: ToastType) => void;
}

const ToastContext = createContext<ToastContextType | undefined>(undefined);

export const useToast = () => {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error('useToast must be used within a ToastProvider');
  }
  return context;
};

export const ToastProvider = ({ children }: { children: ReactNode }) => {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const addToast = useCallback((message: string, type: ToastType = 'info') => {
    const id = Math.random().toString(36).substring(7);
    setToasts(prev => [...prev, { id, message, type }]);
    
    // Auto remove
    setTimeout(() => {
      setToasts(prev => prev.filter(t => t.id !== id));
    }, 5000);
  }, []);

  const removeToast = (id: string) => {
    setToasts(prev => prev.filter(t => t.id !== id));
  };

  return (
    <ToastContext.Provider value={{ addToast }}>
      {children}
      <div style={{
        position: 'fixed',
        bottom: 24,
        right: 24,
        zIndex: 9999,
        display: 'flex',
        flexDirection: 'column',
        gap: 12,
        pointerEvents: 'none'
      }}>
        {toasts.map(toast => (
          <div key={toast.id} className="animate-in" style={{
            pointerEvents: 'auto',
            minWidth: 300,
            maxWidth: 420,
            background: 'rgba(23, 23, 28, 0.95)',
            backdropFilter: 'blur(12px)',
            border: '1px solid rgba(255, 255, 255, 0.1)',
            borderRadius: 12,
            padding: '16px',
            display: 'flex',
            alignItems: 'flex-start',
            gap: 12,
            boxShadow: '0 8px 32px rgba(0, 0, 0, 0.4)',
            color: 'var(--text-primary)',
            fontSize: '0.9rem',
            lineHeight: 1.5
          }}>
            <div style={{
              color: toast.type === 'error' ? 'var(--danger)' : 
                     toast.type === 'success' ? 'var(--success)' : 
                     'var(--accent-1)',
              marginTop: 2
            }}>
              {toast.type === 'error' ? <AlertCircle size={20} /> :
               toast.type === 'success' ? <CheckCircle size={20} /> :
               <Info size={20} />}
            </div>
            <div style={{ flex: 1 }}>{toast.message}</div>
            <button 
              onClick={() => removeToast(toast.id)}
              style={{
                background: 'none',
                border: 'none',
                color: 'var(--text-muted)',
                cursor: 'pointer',
                padding: 4,
                marginTop: -4,
                marginRight: -4
              }}
            >
              <X size={16} />
            </button>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
};
