"use client";

import React from 'react';
import { colors, borderRadius } from '@/lib/design-system';

interface SkeletonProps {
  width?: string | number;
  height?: string | number;
  className?: string;
  style?: React.CSSProperties;
  variant?: 'text' | 'rectangular' | 'circular';
  animation?: 'pulse' | 'wave' | 'none';
}

export function Skeleton({
  width = '100%',
  height = '1rem',
  className,
  style,
  variant = 'rectangular',
  animation = 'pulse',
}: SkeletonProps) {
  const getVariantStyles = () => {
    switch (variant) {
      case 'circular':
        return {
          borderRadius: '50%',
          width: height,
          height: height,
        };
      case 'text':
        return {
          borderRadius: borderRadius.sm,
          height: '1em',
        };
      case 'rectangular':
      default:
        return {
          borderRadius: borderRadius.sm,
        };
    }
  };

  const getAnimationStyles = () => {
    switch (animation) {
      case 'pulse':
        return {
          animation: 'skeleton-pulse 1.5s ease-in-out infinite',
        };
      case 'wave':
        return {
          animation: 'skeleton-wave 1.6s ease-in-out infinite',
        };
      case 'none':
      default:
        return {};
    }
  };

  const skeletonStyle: React.CSSProperties = {
    backgroundColor: colors.gray[200],
    width,
    height,
    ...getVariantStyles(),
    ...getAnimationStyles(),
    ...style,
  };

  return <div className={className} style={skeletonStyle} />;
}

// CSS pro animace
if (typeof document !== 'undefined') {
  const style = document.createElement('style');
  style.textContent = `
    @keyframes skeleton-pulse {
      0%, 100% {
        opacity: 1;
      }
      50% {
        opacity: 0.4;
      }
    }
    
    @keyframes skeleton-wave {
      0% {
        transform: translateX(-100%);
      }
      50% {
        transform: translateX(100%);
      }
      100% {
        transform: translateX(100%);
      }
    }
  `;
  document.head.appendChild(style);
}
