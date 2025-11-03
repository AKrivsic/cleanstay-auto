"use client";

import React, { createContext, useContext, useState, useCallback, useEffect } from 'react';
import { colors, spacing, typography, borderRadius, shadows } from '@/lib/design-system';

export type ToastType = 'success' | 'error' | 'warning' | 'info';

export interface Toast {
  id: string;
  type: ToastType;
  title: string;
  message?: string;
  duration?: number;
  action?: {
    label: string;
    onClick: () => void;
  };
}

interface ToastContextType {
  toasts: Toast[];
  addToast: (toast: Omit<Toast, 'id'>) => string;
  removeToast: (id: string) => void;
  clearToasts: () => void;
}

const ToastContext = createContext<ToastContextType | undefined>(undefined);

export function useToast() {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error('useToast must be used within a ToastProvider');
  }
  return context;
}

interface ToastProviderProps {
  children: React.ReactNode;
}

export function ToastProvider({ children }: ToastProviderProps) {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const addToast = useCallback((toast: Omit<Toast, 'id'>) => {
    const id = Math.random().toString(36).substr(2, 9);
    const newToast: Toast = {
      id,
      duration: 5000,
      ...toast,
    };

    setToasts(prev => [...prev, newToast]);

    // Auto remove after duration
    if (newToast.duration && newToast.duration > 0) {
      setTimeout(() => {
        removeToast(id);
      }, newToast.duration);
    }

    return id;
  }, []);

  const removeToast = useCallback((id: string) => {
    setToasts(prev => prev.filter(toast => toast.id !== id));
  }, []);

  const clearToasts = useCallback(() => {
    setToasts([]);
  }, []);

  return (
    <ToastContext.Provider value={{ toasts, addToast, removeToast, clearToasts }}>
      {children}
      <ToastContainer toasts={toasts} onRemove={removeToast} />
    </ToastContext.Provider>
  );
}

interface ToastContainerProps {
  toasts: Toast[];
  onRemove: (id: string) => void;
}

function ToastContainer({ toasts, onRemove }: ToastContainerProps) {
  const containerStyle: React.CSSProperties = {
    position: 'fixed',
    top: spacing[4],
    right: spacing[4],
    zIndex: 9999,
    display: 'flex',
    flexDirection: 'column',
    gap: spacing[2],
    maxWidth: '400px',
  };

  return (
    <div style={containerStyle}>
      {toasts.map(toast => (
        <ToastItem key={toast.id} toast={toast} onRemove={onRemove} />
      ))}
    </div>
  );
}

interface ToastItemProps {
  toast: Toast;
  onRemove: (id: string) => void;
}

function ToastItem({ toast, onRemove }: ToastItemProps) {
  const [isVisible, setIsVisible] = useState(false);
  const [isLeaving, setIsLeaving] = useState(false);

  useEffect(() => {
    // Trigger entrance animation
    const timer = setTimeout(() => setIsVisible(true), 10);
    return () => clearTimeout(timer);
  }, []);

  const handleRemove = () => {
    setIsLeaving(true);
    setTimeout(() => onRemove(toast.id), 300);
  };

  const getToastStyles = (type: ToastType) => {
    const baseStyles = {
      backgroundColor: colors.background.primary,
      border: `1px solid ${colors.border.light}`,
      borderRadius: borderRadius.lg,
      boxShadow: shadows.lg,
      padding: spacing[4],
      display: 'flex',
      alignItems: 'flex-start',
      gap: spacing[3],
      minWidth: '300px',
      maxWidth: '400px',
      transform: isVisible ? 'translateX(0)' : 'translateX(100%)',
      opacity: isVisible ? 1 : 0,
      transition: 'all 0.3s ease-in-out',
    };

    const typeStyles = {
      success: {
        borderLeft: `4px solid ${colors.success[500]}`,
      },
      error: {
        borderLeft: `4px solid ${colors.error[500]}`,
      },
      warning: {
        borderLeft: `4px solid ${colors.warning[500]}`,
      },
      info: {
        borderLeft: `4px solid ${colors.primary[500]}`,
      },
    };

    return { ...baseStyles, ...typeStyles[type] };
  };

  const getIcon = (type: ToastType) => {
    const icons = {
      success: '✅',
      error: '❌',
      warning: '⚠️',
      info: 'ℹ️',
    };
    return icons[type];
  };

  const getIconColor = (type: ToastType) => {
    const iconColors = {
      success: colors.success[500],
      error: colors.error[500],
      warning: colors.warning[500],
      info: colors.primary[500],
    };
    return iconColors[type];
  };

  const toastStyle = getToastStyles(toast.type);

  const iconStyle: React.CSSProperties = {
    fontSize: '1.25rem',
    flexShrink: 0,
    marginTop: '2px',
  };

  const contentStyle: React.CSSProperties = {
    flex: 1,
    minWidth: 0,
  };

  const titleStyle: React.CSSProperties = {
    fontSize: typography.fontSize.sm,
    fontWeight: typography.fontWeight.semibold,
    color: colors.text.primary,
    margin: 0,
    marginBottom: toast.message ? spacing[1] : 0,
  };

  const messageStyle: React.CSSProperties = {
    fontSize: typography.fontSize.sm,
    color: colors.text.secondary,
    margin: 0,
    lineHeight: typography.lineHeight.relaxed,
  };

  const closeButtonStyle: React.CSSProperties = {
    background: 'none',
    border: 'none',
    color: colors.text.tertiary,
    cursor: 'pointer',
    padding: spacing[1],
    borderRadius: borderRadius.sm,
    fontSize: '1.25rem',
    lineHeight: 1,
    flexShrink: 0,
    transition: 'all 0.2s ease-in-out',
  };

  const actionButtonStyle: React.CSSProperties = {
    background: 'none',
    border: 'none',
    color: getIconColor(toast.type),
    cursor: 'pointer',
    padding: `${spacing[1]} ${spacing[2]}`,
    borderRadius: borderRadius.sm,
    fontSize: typography.fontSize.sm,
    fontWeight: typography.fontWeight.medium,
    textDecoration: 'underline',
    marginTop: spacing[2],
    transition: 'all 0.2s ease-in-out',
  };

  return (
    <div style={toastStyle}>
      <div style={iconStyle}>{getIcon(toast.type)}</div>
      <div style={contentStyle}>
        <h4 style={titleStyle}>{toast.title}</h4>
        {toast.message && <p style={messageStyle}>{toast.message}</p>}
        {toast.action && (
          <button
            style={actionButtonStyle}
            onClick={toast.action.onClick}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = colors.gray[100];
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = 'transparent';
            }}
          >
            {toast.action.label}
          </button>
        )}
      </div>
      <button
        style={closeButtonStyle}
        onClick={handleRemove}
        onMouseEnter={(e) => {
          e.currentTarget.style.backgroundColor = colors.gray[100];
          e.currentTarget.style.color = colors.text.primary;
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.backgroundColor = 'transparent';
          e.currentTarget.style.color = colors.text.tertiary;
        }}
        aria-label="Zavřít notifikaci"
      >
        ×
      </button>
    </div>
  );
}

// Utility functions for common toast types
export const toast = {
  success: (title: string, message?: string, options?: Partial<Toast>) => {
    const { addToast } = useToast();
    return addToast({ type: 'success', title, message, ...options });
  },
  error: (title: string, message?: string, options?: Partial<Toast>) => {
    const { addToast } = useToast();
    return addToast({ type: 'error', title, message, ...options });
  },
  warning: (title: string, message?: string, options?: Partial<Toast>) => {
    const { addToast } = useToast();
    return addToast({ type: 'warning', title, message, ...options });
  },
  info: (title: string, message?: string, options?: Partial<Toast>) => {
    const { addToast } = useToast();
    return addToast({ type: 'info', title, message, ...options });
  },
};
