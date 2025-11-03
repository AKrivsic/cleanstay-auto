"use client";

import React from 'react';
import { colors, spacing, borderRadius, shadows } from '@/lib/design-system';

interface CardProps {
  children: React.ReactNode;
  className?: string;
  style?: React.CSSProperties;
  padding?: 'none' | 'sm' | 'md' | 'lg' | 'xl';
  shadow?: 'none' | 'sm' | 'md' | 'lg' | 'xl';
  hover?: boolean;
  onClick?: () => void;
}

const paddingSizes = {
  none: '0',
  sm: spacing[3],
  md: spacing[4],
  lg: spacing[6],
  xl: spacing[8],
};

const shadowSizes = {
  none: shadows.none,
  sm: shadows.sm,
  md: shadows.md,
  lg: shadows.lg,
  xl: shadows.xl,
};

export function Card({
  children,
  className,
  style,
  padding = 'md',
  shadow = 'md',
  hover = false,
  onClick,
}: CardProps) {
  const cardStyle: React.CSSProperties = {
    backgroundColor: colors.background.primary,
    borderRadius: borderRadius.lg,
    boxShadow: shadowSizes[shadow],
    padding: paddingSizes[padding],
    border: `1px solid ${colors.border.light}`,
    transition: hover ? 'all 0.2s ease-in-out' : 'none',
    cursor: onClick ? 'pointer' : 'default',
    ...style,
  };

  const handleMouseEnter = (e: React.MouseEvent<HTMLDivElement>) => {
    if (hover) {
      e.currentTarget.style.transform = 'translateY(-2px)';
      e.currentTarget.style.boxShadow = shadows.lg;
    }
  };

  const handleMouseLeave = (e: React.MouseEvent<HTMLDivElement>) => {
    if (hover) {
      e.currentTarget.style.transform = 'translateY(0)';
      e.currentTarget.style.boxShadow = shadowSizes[shadow];
    }
  };

  return (
    <div
      className={className}
      style={cardStyle}
      onClick={onClick}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
    >
      {children}
    </div>
  );
}

interface CardHeaderProps {
  children: React.ReactNode;
  className?: string;
  style?: React.CSSProperties;
}

export function CardHeader({ children, className, style }: CardHeaderProps) {
  const headerStyle: React.CSSProperties = {
    marginBottom: spacing[4],
    paddingBottom: spacing[3],
    borderBottom: `1px solid ${colors.border.light}`,
    ...style,
  };

  return (
    <div className={className} style={headerStyle}>
      {children}
    </div>
  );
}

interface CardContentProps {
  children: React.ReactNode;
  className?: string;
  style?: React.CSSProperties;
}

export function CardContent({ children, className, style }: CardContentProps) {
  const contentStyle: React.CSSProperties = {
    ...style,
  };

  return (
    <div className={className} style={contentStyle}>
      {children}
    </div>
  );
}

interface CardFooterProps {
  children: React.ReactNode;
  className?: string;
  style?: React.CSSProperties;
}

export function CardFooter({ children, className, style }: CardFooterProps) {
  const footerStyle: React.CSSProperties = {
    marginTop: spacing[4],
    paddingTop: spacing[3],
    borderTop: `1px solid ${colors.border.light}`,
    ...style,
  };

  return (
    <div className={className} style={footerStyle}>
      {children}
    </div>
  );
}
