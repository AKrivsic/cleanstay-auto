"use client";

import React from 'react';
import { colors, spacing, typography, borderRadius } from '@/lib/design-system';

interface BadgeProps {
  children: React.ReactNode;
  variant?: 'default' | 'primary' | 'success' | 'warning' | 'error' | 'secondary';
  size?: 'sm' | 'md' | 'lg';
  className?: string;
  style?: React.CSSProperties;
}

const badgeVariants = {
  default: {
    backgroundColor: colors.gray[100],
    color: colors.gray[700],
  },
  primary: {
    backgroundColor: colors.primary[100],
    color: colors.primary[700],
  },
  success: {
    backgroundColor: colors.success[100],
    color: colors.success[700],
  },
  warning: {
    backgroundColor: colors.warning[100],
    color: colors.warning[700],
  },
  error: {
    backgroundColor: colors.error[100],
    color: colors.error[700],
  },
  secondary: {
    backgroundColor: colors.secondary[100],
    color: colors.secondary[700],
  },
};

const badgeSizes = {
  sm: {
    padding: `${spacing[0.5]} ${spacing[1.5]}`,
    fontSize: typography.fontSize.xs,
    fontWeight: typography.fontWeight.medium,
  },
  md: {
    padding: `${spacing[1]} ${spacing[2]}`,
    fontSize: typography.fontSize.sm,
    fontWeight: typography.fontWeight.medium,
  },
  lg: {
    padding: `${spacing[1.5]} ${spacing[2.5]}`,
    fontSize: typography.fontSize.base,
    fontWeight: typography.fontWeight.medium,
  },
};

export function Badge({
  children,
  variant = 'default',
  size = 'md',
  className,
  style,
}: BadgeProps) {
  const badgeStyle: React.CSSProperties = {
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: borderRadius.full,
    ...badgeVariants[variant],
    ...badgeSizes[size],
    ...style,
  };

  return (
    <span className={className} style={badgeStyle}>
      {children}
    </span>
  );
}
