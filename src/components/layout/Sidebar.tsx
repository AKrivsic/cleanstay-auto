"use client";

import React, { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { colors, spacing, typography, borderRadius, shadows } from '@/lib/design-system';

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
}

interface NavItem {
  label: string;
  href: string;
  icon: React.ReactNode;
  badge?: string | number;
  children?: NavItem[];
}

const navigationItems: NavItem[] = [
  {
    label: 'Dashboard',
    href: '/dashboard',
    icon: '📊',
  },
  {
    label: 'Správa',
    href: '/dashboard/manage',
    icon: '👥',
    children: [
      { label: 'Uživatelé', href: '/dashboard/manage?tab=users', icon: '👤' },
      { label: 'Nemovitosti', href: '/dashboard/manage?tab=properties', icon: '🏠' },
    ],
  },
  {
    label: 'Plánování',
    href: '/dashboard/schedule',
    icon: '📅',
  },
  {
    label: 'Úklidy',
    href: '/dashboard/cleanings',
    icon: '🧹',
  },
  {
    label: 'Zprávy',
    href: '/dashboard/messages',
    icon: '💬',
  },
  {
    label: 'Analytika',
    href: '/dashboard/analytics',
    icon: '📈',
  },
  {
    label: 'Nastavení',
    href: '/dashboard/settings',
    icon: '⚙️',
  },
];

export function Sidebar({ isOpen, onClose }: SidebarProps) {
  const pathname = usePathname();
  const [expandedItems, setExpandedItems] = useState<string[]>([]);

  const toggleExpanded = (href: string) => {
    setExpandedItems(prev => 
      prev.includes(href) 
        ? prev.filter(item => item !== href)
        : [...prev, href]
    );
  };

  const isActive = (href: string) => {
    if (href === '/dashboard') {
      return pathname === '/dashboard';
    }
    return pathname.startsWith(href);
  };

  const sidebarStyle: React.CSSProperties = {
    position: 'fixed',
    top: 0,
    left: 0,
    height: '100vh',
    width: isOpen ? '280px' : '0',
    backgroundColor: colors.background.primary,
    borderRight: `1px solid ${colors.border.light}`,
    boxShadow: shadows.lg,
    transition: 'width 0.3s ease-in-out',
    overflow: 'hidden',
    zIndex: 1000,
  };

  const contentStyle: React.CSSProperties = {
    padding: spacing[6],
    height: '100%',
    overflowY: 'auto',
  };

  const logoStyle: React.CSSProperties = {
    fontSize: typography.fontSize['2xl'],
    fontWeight: typography.fontWeight.bold,
    color: colors.primary[600],
    marginBottom: spacing[8],
    display: 'flex',
    alignItems: 'center',
    gap: spacing[2],
  };

  const navStyle: React.CSSProperties = {
    display: 'flex',
    flexDirection: 'column',
    gap: spacing[1],
  };

  const navItemStyle: React.CSSProperties = {
    display: 'flex',
    alignItems: 'center',
    padding: `${spacing[2]} ${spacing[3]}`,
    borderRadius: borderRadius.md,
    textDecoration: 'none',
    color: colors.text.secondary,
    fontSize: typography.fontSize.sm,
    fontWeight: typography.fontWeight.medium,
    transition: 'all 0.2s ease-in-out',
    cursor: 'pointer',
  };

  const activeNavItemStyle: React.CSSProperties = {
    ...navItemStyle,
    backgroundColor: colors.primary[50],
    color: colors.primary[700],
    fontWeight: typography.fontWeight.semibold,
  };

  const subNavStyle: React.CSSProperties = {
    marginLeft: spacing[6],
    marginTop: spacing[1],
    display: 'flex',
    flexDirection: 'column',
    gap: spacing[1],
  };

  const subNavItemStyle: React.CSSProperties = {
    ...navItemStyle,
    padding: `${spacing[1.5]} ${spacing[3]}`,
    fontSize: typography.fontSize.xs,
  };

  const iconStyle: React.CSSProperties = {
    marginRight: spacing[2],
    fontSize: '1.2em',
  };

  const badgeStyle: React.CSSProperties = {
    marginLeft: 'auto',
    backgroundColor: colors.error[500],
    color: colors.text.inverse,
    fontSize: typography.fontSize.xs,
    fontWeight: typography.fontWeight.bold,
    padding: `${spacing[0.5]} ${spacing[1.5]}`,
    borderRadius: borderRadius.full,
    minWidth: '20px',
    textAlign: 'center',
  };

  const handleNavigate = (href: string) => {
    // Use hard navigation to ensure SSR routes work reliably
    if (typeof window !== 'undefined') {
      window.location.href = href;
    }
  };

  const renderNavItem = (item: NavItem, isSubItem = false) => {
    const hasChildren = item.children && item.children.length > 0;
    const isExpanded = expandedItems.includes(item.href);
    const active = isActive(item.href);
    const currentStyle = active ? activeNavItemStyle : (isSubItem ? subNavItemStyle : navItemStyle);

    return (
      <div key={item.href}>
        <div
          style={currentStyle}
          onClick={() => {
            if (hasChildren) {
              toggleExpanded(item.href);
            } else {
              handleNavigate(item.href);
            }
          }}
          onMouseEnter={(e) => {
            if (!active) {
              e.currentTarget.style.backgroundColor = colors.gray[50];
              e.currentTarget.style.color = colors.text.primary;
            }
          }}
          onMouseLeave={(e) => {
            if (!active) {
              e.currentTarget.style.backgroundColor = 'transparent';
              e.currentTarget.style.color = colors.text.secondary;
            }
          }}
        >
          <span style={iconStyle}>{item.icon}</span>
          <span>{item.label}</span>
          {item.badge && <span style={badgeStyle}>{item.badge}</span>}
          {hasChildren && (
            <span style={{ marginLeft: 'auto', fontSize: '0.8em' }}>
              {isExpanded ? '▼' : '▶'}
            </span>
          )}
        </div>
        {hasChildren && isExpanded && (
          <div style={subNavStyle}>
            {item.children!.map(child => renderNavItem(child, true))}
          </div>
        )}
      </div>
    );
  };

  return (
    <div style={sidebarStyle}>
      <div style={contentStyle}>
        <div style={logoStyle}>
          <span>🧹</span>
          <span>CleanStay</span>
        </div>
        <nav style={navStyle}>
          {navigationItems.map(item => renderNavItem(item))}
        </nav>
      </div>
    </div>
  );
}
