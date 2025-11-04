"use client";

import React from 'react';
import { colors, spacing, typography, borderRadius, shadows } from '@/lib/design-system';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'success' | 'warning' | 'error' | 'ghost' | 'outline';
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl';
  loading?: boolean;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
  children: React.ReactNode;
}

const buttonVariants = {
  primary: {
    backgroundColor: colors.primary[500],
    color: colors.text.inverse,
    border: 'none',
    '&:hover': {
      backgroundColor: colors.primary[600],
    },
    '&:active': {
      backgroundColor: colors.primary[700],
    },
    '&:disabled': {
      backgroundColor: colors.gray[300],
      color: colors.gray[500],
    },
  },
  secondary: {
    backgroundColor: colors.secondary[100],
    color: colors.secondary[700],
    border: 'none',
    '&:hover': {
      backgroundColor: colors.secondary[200],
    },
    '&:active': {
      backgroundColor: colors.secondary[300],
    },
    '&:disabled': {
      backgroundColor: colors.gray[100],
      color: colors.gray[400],
    },
  },
  success: {
    backgroundColor: colors.success[500],
    color: colors.text.inverse,
    border: 'none',
    '&:hover': {
      backgroundColor: colors.success[600],
    },
    '&:active': {
      backgroundColor: colors.success[700],
    },
    '&:disabled': {
      backgroundColor: colors.gray[300],
      color: colors.gray[500],
    },
  },
  warning: {
    backgroundColor: colors.warning[500],
    color: colors.text.inverse,
    border: 'none',
    '&:hover': {
      backgroundColor: colors.warning[600],
    },
    '&:active': {
      backgroundColor: colors.warning[700],
    },
    '&:disabled': {
      backgroundColor: colors.gray[300],
      color: colors.gray[500],
    },
  },
  error: {
    backgroundColor: colors.error[500],
    color: colors.text.inverse,
    border: 'none',
    '&:hover': {
      backgroundColor: colors.error[600],
    },
    '&:active': {
      backgroundColor: colors.error[700],
    },
    '&:disabled': {
      backgroundColor: colors.gray[300],
      color: colors.gray[500],
    },
  },
  ghost: {
    backgroundColor: 'transparent',
    color: colors.primary[500],
    border: 'none',
    '&:hover': {
      backgroundColor: colors.primary[50],
    },
    '&:active': {
      backgroundColor: colors.primary[100],
    },
    '&:disabled': {
      backgroundColor: 'transparent',
      color: colors.gray[400],
    },
  },
  outline: {
    backgroundColor: 'transparent',
    color: colors.primary[500],
    border: `1px solid ${colors.primary[500]}`,
    '&:hover': {
      backgroundColor: colors.primary[50],
    },
    '&:active': {
      backgroundColor: colors.primary[100],
    },
    '&:disabled': {
      backgroundColor: 'transparent',
      color: colors.gray[400],
      borderColor: colors.gray[300],
    },
  },
};

const buttonSizes = {
  xs: {
    padding: `${spacing[1]} ${spacing[2]}`,
    fontSize: typography.fontSize.xs,
    minHeight: '24px',
  },
  sm: {
    padding: `${spacing[1.5]} ${spacing[3]}`,
    fontSize: typography.fontSize.sm,
    minHeight: '32px',
  },
  md: {
    padding: `${spacing[2]} ${spacing[4]}`,
    fontSize: typography.fontSize.base,
    minHeight: '40px',
  },
  lg: {
    padding: `${spacing[2.5]} ${spacing[5]}`,
    fontSize: typography.fontSize.lg,
    minHeight: '48px',
  },
  xl: {
    padding: `${spacing[3]} ${spacing[6]}`,
    fontSize: typography.fontSize.xl,
    minHeight: '56px',
  },
};

export function Button({
  variant = 'primary',
  size = 'md',
  loading = false,
  leftIcon,
  rightIcon,
  children,
  disabled,
  style,
  type,
  ...props
}: ButtonProps) {
  const variantStyles = buttonVariants[variant];
  const sizeStyles = buttonSizes[size];
  
  const buttonStyle: React.CSSProperties = {
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing[2],
    borderRadius: borderRadius.md,
    fontWeight: typography.fontWeight.medium,
    lineHeight: typography.lineHeight.none,
    cursor: disabled || loading ? 'not-allowed' : 'pointer',
    transition: 'all 0.2s ease-in-out',
    textDecoration: 'none',
    outline: 'none',
    boxShadow: shadows.sm,
    ...variantStyles,
    ...sizeStyles,
    ...style,
  };

  const handleMouseEnter = (e: React.MouseEvent<HTMLButtonElement>) => {
    if (!disabled && !loading) {
      const hoverStyle = variantStyles['&:hover'];
      if (hoverStyle) {
        Object.assign(e.currentTarget.style, hoverStyle);
      }
    }
  };

  const handleMouseLeave = (e: React.MouseEvent<HTMLButtonElement>) => {
    if (!disabled && !loading) {
      const baseStyle = { ...variantStyles, ...sizeStyles };
      Object.assign(e.currentTarget.style, baseStyle);
    }
  };

  const handleMouseDown = (e: React.MouseEvent<HTMLButtonElement>) => {
    if (!disabled && !loading) {
      const activeStyle = variantStyles['&:active'];
      if (activeStyle) {
        Object.assign(e.currentTarget.style, activeStyle);
      }
    }
  };

  const handleMouseUp = (e: React.MouseEvent<HTMLButtonElement>) => {
    if (!disabled && !loading) {
      const baseStyle = { ...variantStyles, ...sizeStyles };
      Object.assign(e.currentTarget.style, baseStyle);
    }
  };

  return (
    <button
      style={buttonStyle}
      disabled={disabled || loading}
      type={type ?? 'button'}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      onMouseDown={handleMouseDown}
      onMouseUp={handleMouseUp}
      {...props}
    >
      {loading && (
        <div
          style={{
            width: '16px',
            height: '16px',
            border: `2px solid ${colors.gray[300]}`,
            borderTop: `2px solid ${variant === 'ghost' ? colors.primary[500] : colors.text.inverse}`,
            borderRadius: '50%',
            animation: 'spin 1s linear infinite',
          }}
        />
      )}
      {!loading && leftIcon && leftIcon}
      {children}
      {!loading && rightIcon && rightIcon}
    </button>
  );
}

// CSS pro animaci loading spinneru
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
