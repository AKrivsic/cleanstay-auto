"use client";

import React, { forwardRef } from 'react';
import { colors, spacing, typography, borderRadius, shadows } from '@/lib/design-system';

interface InputProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'size'> {
  label?: string;
  error?: string;
  helperText?: string;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
  variant?: 'default' | 'filled' | 'outlined';
  size?: 'sm' | 'md' | 'lg';
}

const inputVariants = {
  default: {
    backgroundColor: colors.background.primary,
    border: `1px solid ${colors.border.medium}`,
    '&:focus': {
      borderColor: colors.primary[500],
      boxShadow: `0 0 0 3px ${colors.primary[100]}`,
    },
    '&:hover': {
      borderColor: colors.border.dark,
    },
  },
  filled: {
    backgroundColor: colors.gray[50],
    border: `1px solid ${colors.gray[200]}`,
    '&:focus': {
      borderColor: colors.primary[500],
      boxShadow: `0 0 0 3px ${colors.primary[100]}`,
      backgroundColor: colors.background.primary,
    },
    '&:hover': {
      backgroundColor: colors.gray[100],
    },
  },
  outlined: {
    backgroundColor: 'transparent',
    border: `2px solid ${colors.border.medium}`,
    '&:focus': {
      borderColor: colors.primary[500],
      boxShadow: `0 0 0 3px ${colors.primary[100]}`,
    },
    '&:hover': {
      borderColor: colors.primary[300],
    },
  },
};

const inputSizes = {
  sm: {
    padding: `${spacing[1.5]} ${spacing[3]}`,
    fontSize: typography.fontSize.sm,
    minHeight: '32px',
  },
  md: {
    padding: `${spacing[2]} ${spacing[3]}`,
    fontSize: typography.fontSize.base,
    minHeight: '40px',
  },
  lg: {
    padding: `${spacing[2.5]} ${spacing[4]}`,
    fontSize: typography.fontSize.lg,
    minHeight: '48px',
  },
};

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({
    label,
    error,
    helperText,
    leftIcon,
    rightIcon,
    variant = 'default',
    size = 'md',
    className,
    style,
    disabled,
    ...props
  }, ref) => {
    const inputStyle: React.CSSProperties = {
      width: '100%',
      borderRadius: borderRadius.md,
      fontFamily: typography.fontFamily.sans.join(', '),
      fontWeight: typography.fontWeight.normal,
      lineHeight: typography.lineHeight.normal,
      color: colors.text.primary,
      outline: 'none',
      transition: 'all 0.2s ease-in-out',
      ...inputVariants[variant],
      ...inputSizes[size],
      ...(disabled && {
        backgroundColor: colors.gray[100],
        color: colors.text.tertiary,
        cursor: 'not-allowed',
      }),
      ...(error && {
        borderColor: colors.error[500],
        '&:focus': {
          borderColor: colors.error[500],
          boxShadow: `0 0 0 3px ${colors.error[100]}`,
        },
      }),
      ...style,
    };

    const containerStyle: React.CSSProperties = {
      display: 'flex',
      flexDirection: 'column',
      gap: spacing[1],
      width: '100%',
    };

    const labelStyle: React.CSSProperties = {
      fontSize: typography.fontSize.sm,
      fontWeight: typography.fontWeight.medium,
      color: error ? colors.error[600] : colors.text.primary,
      marginBottom: spacing[1],
    };

    const inputContainerStyle: React.CSSProperties = {
      position: 'relative',
      display: 'flex',
      alignItems: 'center',
    };

    const iconStyle: React.CSSProperties = {
      position: 'absolute',
      color: colors.text.secondary,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 1,
    };

    const leftIconStyle: React.CSSProperties = {
      ...iconStyle,
      left: spacing[3],
    };

    const rightIconStyle: React.CSSProperties = {
      ...iconStyle,
      right: spacing[3],
    };

    const inputWithIconsStyle: React.CSSProperties = {
      ...inputStyle,
      ...(leftIcon && { paddingLeft: spacing[10] }),
      ...(rightIcon && { paddingRight: spacing[10] }),
    };

    const errorStyle: React.CSSProperties = {
      fontSize: typography.fontSize.sm,
      color: colors.error[600],
      marginTop: spacing[1],
    };

    const helperTextStyle: React.CSSProperties = {
      fontSize: typography.fontSize.sm,
      color: colors.text.secondary,
      marginTop: spacing[1],
    };

    const handleFocus = (e: React.FocusEvent<HTMLInputElement>) => {
      const focusStyle = inputVariants[variant]['&:focus'];
      if (focusStyle) {
        Object.assign(e.currentTarget.style, focusStyle);
      }
    };

    const handleBlur = (e: React.FocusEvent<HTMLInputElement>) => {
      const baseStyle = { ...inputVariants[variant], ...inputSizes[size] };
      Object.assign(e.currentTarget.style, baseStyle);
    };

    const handleMouseEnter = (e: React.MouseEvent<HTMLInputElement>) => {
      if (!disabled) {
        const hoverStyle = inputVariants[variant]['&:hover'];
        if (hoverStyle) {
          Object.assign(e.currentTarget.style, hoverStyle);
        }
      }
    };

    const handleMouseLeave = (e: React.MouseEvent<HTMLInputElement>) => {
      if (!disabled) {
        const baseStyle = { ...inputVariants[variant], ...inputSizes[size] };
        Object.assign(e.currentTarget.style, baseStyle);
      }
    };

    return (
      <div style={containerStyle}>
        {label && <label style={labelStyle}>{label}</label>}
        <div style={inputContainerStyle}>
          {leftIcon && <div style={leftIconStyle}>{leftIcon}</div>}
          <input
            ref={ref}
            style={inputWithIconsStyle}
            disabled={disabled}
            onFocus={handleFocus}
            onBlur={handleBlur}
            onMouseEnter={handleMouseEnter}
            onMouseLeave={handleMouseLeave}
            {...props}
          />
          {rightIcon && <div style={rightIconStyle}>{rightIcon}</div>}
        </div>
        {error && <div style={errorStyle}>{error}</div>}
        {helperText && !error && <div style={helperTextStyle}>{helperText}</div>}
      </div>
    );
  }
);

Input.displayName = 'Input';
