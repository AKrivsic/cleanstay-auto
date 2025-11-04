"use client";

import React, { useEffect, useRef } from 'react';
import { colors, spacing, borderRadius, shadows } from '@/lib/design-system';

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  children: React.ReactNode;
  size?: 'sm' | 'md' | 'lg' | 'xl' | 'full';
  closeOnOverlayClick?: boolean;
  closeOnEscape?: boolean;
  showCloseButton?: boolean;
}

const modalSizes = {
  sm: { maxWidth: '400px' },
  md: { maxWidth: '600px' },
  lg: { maxWidth: '800px' },
  xl: { maxWidth: '1000px' },
  full: { maxWidth: '95vw', maxHeight: '95vh' },
};

export function Modal({
  isOpen,
  onClose,
  title,
  children,
  size = 'md',
  closeOnOverlayClick = true,
  closeOnEscape = true,
  showCloseButton = true,
}: ModalProps) {
  const modalRef = useRef<HTMLDivElement>(null);
  const previousActiveElement = useRef<HTMLElement | null>(null);

  useEffect(() => {
    if (isOpen) {
      // Uložit aktuálně aktivní element
      previousActiveElement.current = document.activeElement as HTMLElement;
      
      // Zablokovat scroll pozadí
      document.body.style.overflow = 'hidden';
      
      // Focus na modal
      if (modalRef.current) {
        modalRef.current.focus();
      }
    } else {
      // Obnovit scroll pozadí
      document.body.style.overflow = 'unset';
      
      // Vrátit focus na předchozí element
      if (previousActiveElement.current) {
        previousActiveElement.current.focus();
      }
    }

    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isOpen]);

  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && closeOnEscape && isOpen) {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener('keydown', handleEscape);
    }

    return () => {
      document.removeEventListener('keydown', handleEscape);
    };
  }, [isOpen, closeOnEscape, onClose]);

  if (!isOpen) return null;

  const handleOverlayClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (closeOnOverlayClick && e.target === e.currentTarget) {
      onClose();
    }
  };

  const handleContentClick = (e: React.MouseEvent<HTMLDivElement>) => {
    e.stopPropagation();
  };

  const overlayStyle: React.CSSProperties = {
    position: 'fixed',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 1000,
    padding: spacing[4],
  };

  const modalStyle: React.CSSProperties = {
    backgroundColor: colors.background.primary,
    borderRadius: borderRadius.lg,
    boxShadow: shadows['2xl'],
    width: '100%',
    maxHeight: '90vh',
    overflow: 'hidden',
    display: 'flex',
    flexDirection: 'column',
    outline: 'none',
    ...modalSizes[size],
  };

  const headerStyle: React.CSSProperties = {
    padding: spacing[6],
    borderBottom: `1px solid ${colors.border.light}`,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    flexShrink: 0,
  };

  const titleStyle: React.CSSProperties = {
    fontSize: '1.25rem',
    fontWeight: 600,
    color: colors.text.primary,
    margin: 0,
  };

  const closeButtonStyle: React.CSSProperties = {
    background: 'none',
    border: 'none',
    fontSize: '1.5rem',
    color: colors.text.secondary,
    cursor: 'pointer',
    padding: spacing[1],
    borderRadius: borderRadius.sm,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    width: '32px',
    height: '32px',
    transition: 'all 0.2s ease-in-out',
  };

  const contentStyle: React.CSSProperties = {
    padding: spacing[6],
    overflow: 'auto',
    flex: 1,
  };

  return (
    <div style={overlayStyle} onClick={handleOverlayClick}>
      <div
        ref={modalRef}
        style={modalStyle}
        onClick={handleContentClick}
        tabIndex={-1}
        role="dialog"
        aria-modal="true"
        aria-labelledby={title ? 'modal-title' : undefined}
      >
        {(title || showCloseButton) && (
          <div style={headerStyle}>
            {title && <h2 id="modal-title" style={titleStyle}>{title}</h2>}
            {showCloseButton && (
              <button
                style={closeButtonStyle}
                onClick={onClose}
                aria-label="Zavřít modal"
                onMouseEnter={(e) => {
                  e.currentTarget.style.backgroundColor = colors.gray[100];
                  e.currentTarget.style.color = colors.text.primary;
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor = 'transparent';
                  e.currentTarget.style.color = colors.text.secondary;
                }}
              >
                ×
              </button>
            )}
          </div>
        )}
        <div style={contentStyle}>
          {children}
        </div>
      </div>
    </div>
  );
}
