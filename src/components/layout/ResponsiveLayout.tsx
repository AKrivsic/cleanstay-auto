"use client";

import React, { useState, useEffect } from 'react';
import { Sidebar } from './Sidebar';
import Header from './Header';
import { Breadcrumbs } from './Breadcrumbs';
import { colors, spacing, breakpoints } from '@/lib/design-system';

interface ResponsiveLayoutProps {
  children: React.ReactNode;
  title?: string;
  subtitle?: string;
  actions?: React.ReactNode;
  showBreadcrumbs?: boolean;
}

export function ResponsiveLayout({
  children,
  title,
  subtitle,
  actions,
  showBreadcrumbs = true,
}: ResponsiveLayoutProps) {
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const checkIsMobile = () => {
      setIsMobile(window.innerWidth < parseInt(breakpoints.md));
    };

    checkIsMobile();
    window.addEventListener('resize', checkIsMobile);

    return () => window.removeEventListener('resize', checkIsMobile);
  }, []);

  useEffect(() => {
    // On desktop keep sidebar open; on mobile keep it closed by default
    setSidebarOpen(!isMobile);
  }, [isMobile]);

  const handleMenuClick = () => {
    setSidebarOpen(!sidebarOpen);
  };

  const handleSidebarClose = () => {
    setSidebarOpen(false);
  };

  const mainStyle: React.CSSProperties = {
    marginLeft: isMobile ? '0' : '280px',
    minHeight: '100vh',
    backgroundColor: colors.background.secondary,
    transition: 'margin-left 0.3s ease-in-out',
  };

  const contentStyle: React.CSSProperties = {
    padding: isMobile ? spacing[4] : spacing[6],
    maxWidth: '100%',
    overflow: 'hidden',
  };

  const overlayStyle: React.CSSProperties = {
    position: 'fixed',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    zIndex: 999,
    display: sidebarOpen && isMobile ? 'block' : 'none',
  };

  return (
    <div style={{ display: 'flex', minHeight: '100vh' }}>
      {/* Mobile Overlay */}
      {isMobile && (
        <div style={overlayStyle} onClick={handleSidebarClose} />
      )}

      {/* Sidebar */}
      <Sidebar isOpen={sidebarOpen} onClose={handleSidebarClose} />

      {/* Main Content */}
      <main style={mainStyle}>
        <Header />
        
        {showBreadcrumbs && (
          <div style={{ padding: `0 ${isMobile ? spacing[4] : spacing[6]}` }}>
            <Breadcrumbs />
          </div>
        )}
        
        <div style={contentStyle}>
          {children}
        </div>
      </main>
    </div>
  );
}
