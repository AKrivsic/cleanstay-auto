"use client";

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { colors, spacing, typography } from '@/lib/design-system';

interface BreadcrumbItem {
  label: string;
  href?: string;
}

interface BreadcrumbsProps {
  items?: BreadcrumbItem[];
  className?: string;
  style?: React.CSSProperties;
}

export function Breadcrumbs({ items, className, style }: BreadcrumbsProps) {
  const pathname = usePathname();

  // Auto-generate breadcrumbs from pathname if not provided
  const generateBreadcrumbs = (): BreadcrumbItem[] => {
    if (items) return items;

    const pathSegments = pathname.split('/').filter(Boolean);
    const breadcrumbs: BreadcrumbItem[] = [
      { label: 'Dashboard', href: '/dashboard' }
    ];

    let currentPath = '';
    pathSegments.forEach((segment, index) => {
      currentPath += `/${segment}`;
      
      // Map segment to readable label
      const labelMap: Record<string, string> = {
        'manage': 'Správa',
        'schedule': 'Plánování',
        'cleanings': 'Úklidy',
        'messages': 'Zprávy',
        'analytics': 'Analytika',
        'settings': 'Nastavení',
        'users': 'Uživatelé',
        'properties': 'Nemovitosti',
      };

      const label = labelMap[segment] || segment.charAt(0).toUpperCase() + segment.slice(1);
      
      // Don't make the last item clickable
      const isLast = index === pathSegments.length - 1;
      breadcrumbs.push({
        label,
        href: isLast ? undefined : currentPath
      });
    });

    return breadcrumbs;
  };

  const breadcrumbs = generateBreadcrumbs();

  const containerStyle: React.CSSProperties = {
    display: 'flex',
    alignItems: 'center',
    gap: spacing[2],
    fontSize: typography.fontSize.sm,
    color: colors.text.secondary,
    ...style,
  };

  const linkStyle: React.CSSProperties = {
    color: colors.primary[600],
    textDecoration: 'none',
    transition: 'color 0.2s ease-in-out',
  };

  const currentItemStyle: React.CSSProperties = {
    color: colors.text.primary,
    fontWeight: typography.fontWeight.medium,
  };

  const separatorStyle: React.CSSProperties = {
    color: colors.text.tertiary,
    fontSize: '0.8em',
  };

  return (
    <nav className={className} style={containerStyle} aria-label="Breadcrumb">
      {breadcrumbs.map((item, index) => (
        <React.Fragment key={index}>
          {index > 0 && (
            <span style={separatorStyle} aria-hidden="true">
              ›
            </span>
          )}
          {item.href ? (
            <Link
              href={item.href}
              style={linkStyle}
              onMouseEnter={(e) => {
                e.currentTarget.style.color = colors.primary[700];
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.color = colors.primary[600];
              }}
            >
              {item.label}
            </Link>
          ) : (
            <span style={currentItemStyle} aria-current="page">
              {item.label}
            </span>
          )}
        </React.Fragment>
      ))}
    </nav>
  );
}
