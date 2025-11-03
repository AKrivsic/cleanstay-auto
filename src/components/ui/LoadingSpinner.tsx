"use client";

import React from 'react';
import { colors } from '@/lib/design-system';

interface LoadingSpinnerProps {
  size?: 'sm' | 'md' | 'lg' | 'xl';
  color?: string;
  className?: string;
  style?: React.CSSProperties;
}

const spinnerSizes = {
  sm: '16px',
  md: '24px',
  lg: '32px',
  xl: '48px',
};

export function LoadingSpinner({
  size = 'md',
  color = colors.primary[500],
  className,
  style,
}: LoadingSpinnerProps) {
  const spinnerStyle: React.CSSProperties = {
    width: spinnerSizes[size],
    height: spinnerSizes[size],
    border: `2px solid ${colors.gray[200]}`,
    borderTop: `2px solid ${color}`,
    borderRadius: '50%',
    animation: 'spin 1s linear infinite',
    ...style,
  };

  return (
    <div className={className} style={spinnerStyle} />
  );
}

// CSS pro animaci
if (typeof document !== 'undefined') {
  const style = document.createElement('style');
  style.textContent = `
    @keyframes spin {
      0% { transform: rotate(0deg); }
      100% { transform: rotate(360deg); }
    }
  `;
  document.head.appendChild(style);
}
