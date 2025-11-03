"use client";

import React, { useState, useEffect } from 'react';
import { colors, spacing, typography } from '@/lib/design-system';
import { createSupabaseClient } from '@/lib/supabase/client';

interface ClientLayoutProps {
  children: React.ReactNode;
  title?: string;
  subtitle?: string;
  actions?: React.ReactNode;
}

export function ClientLayout({ children, title, subtitle, actions }: ClientLayoutProps) {
  const [showUserMenu, setShowUserMenu] = useState(false);
  const containerStyle: React.CSSProperties = {
    minHeight: '100vh',
    backgroundColor: colors.background.secondary,
  };

  const headerStyle: React.CSSProperties = {
    position: 'sticky',
    top: 0,
    zIndex: 10,
    backgroundColor: colors.background.primary,
    borderBottom: `1px solid ${colors.border.light}`,
  };

  const headerInnerStyle: React.CSSProperties = {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: `${spacing[4]} ${spacing[6]}`,
    gap: spacing[4],
  };

  const titleWrapStyle: React.CSSProperties = {
    display: 'flex',
    flexDirection: 'column',
    gap: spacing[1],
  };

  const titleStyle: React.CSSProperties = {
    margin: 0,
    fontSize: typography.fontSize['2xl'],
    fontWeight: typography.fontWeight.bold,
    color: colors.text.primary,
  };

  const subtitleStyle: React.CSSProperties = {
    margin: 0,
    fontSize: typography.fontSize.sm,
    color: colors.text.secondary,
  };

  const contentStyle: React.CSSProperties = {
    padding: spacing[6],
  };

  return (
    <div style={containerStyle}>
      <header style={headerStyle}>
        <div style={headerInnerStyle}>
          <div style={titleWrapStyle}>
            <h1 style={titleStyle}>{title || 'Můj portál'}</h1>
            {subtitle && <p style={subtitleStyle}>{subtitle}</p>}
          </div>
          
          <div style={{ display: 'flex', alignItems: 'center', gap: spacing[3] }}>
            {actions}
            
            {/* User menu button */}
            <div style={{ position: 'relative' }}>
              <button
                onClick={() => setShowUserMenu(!showUserMenu)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: spacing[2],
                  background: 'none',
                  border: 'none',
                  padding: `${spacing[1]} ${spacing[2]}`,
                  borderRadius: spacing[2],
                  cursor: 'pointer',
                }}
              >
                <div style={{
                  width: '32px',
                  height: '32px',
                  borderRadius: '50%',
                  backgroundColor: colors.primary[500],
                  color: '#fff',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '14px',
                  fontWeight: '600',
                }}>
                  K
                </div>
              </button>
              
              {showUserMenu && (
                <div style={{
                  position: 'absolute',
                  top: '100%',
                  right: 0,
                  marginTop: spacing[1],
                  backgroundColor: '#fff',
                  border: `1px solid ${colors.border.light}`,
                  borderRadius: spacing[3],
                  boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1)',
                  minWidth: '200px',
                  zIndex: 1000,
                  overflow: 'hidden',
                }}>
                  <div
                    onClick={async () => {
                      const supabase = createSupabaseClient();
                      await supabase.auth.signOut();
                      window.location.href = '/login';
                    }}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: spacing[2],
                      padding: `${spacing[2]} ${spacing[3]}`,
                      color: colors.error[600],
                      cursor: 'pointer',
                      fontSize: '14px',
                    }}
                  >
                    🚪 Odhlásit se
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </header>

      <main style={contentStyle}>{children}</main>
    </div>
  );
}


