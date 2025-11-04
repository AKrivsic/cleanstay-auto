"use client";

import React from 'react';
import { Skeleton } from './Skeleton';
import { Card, CardContent } from './Card';
import { colors, spacing, typography } from '@/lib/design-system';

interface TableSkeletonProps {
  rows?: number;
  columns?: number;
}

export function TableSkeleton({ rows = 5, columns = 4 }: TableSkeletonProps) {
  const tableStyle: React.CSSProperties = {
    width: '100%',
    borderCollapse: 'collapse',
  };

  const headerStyle: React.CSSProperties = {
    backgroundColor: colors.gray[50],
    padding: spacing[3],
    textAlign: 'left',
    borderBottom: `1px solid ${colors.gray[200]}`,
  };

  const cellStyle: React.CSSProperties = {
    padding: spacing[3],
    borderBottom: `1px solid ${colors.gray[100]}`,
  };

  return (
    <table style={tableStyle}>
      <thead>
        <tr>
          {Array.from({ length: columns }).map((_, index) => (
            <th key={index} style={headerStyle}>
              <Skeleton width="80%" height="1rem" />
            </th>
          ))}
        </tr>
      </thead>
      <tbody>
        {Array.from({ length: rows }).map((_, rowIndex) => (
          <tr key={rowIndex}>
            {Array.from({ length: columns }).map((_, colIndex) => (
              <td key={colIndex} style={cellStyle}>
                <Skeleton width={colIndex === 0 ? "60%" : "90%"} height="1rem" />
              </td>
            ))}
          </tr>
        ))}
      </tbody>
    </table>
  );
}

interface CardSkeletonProps {
  showAvatar?: boolean;
  showActions?: boolean;
}

export function CardSkeleton({ showAvatar = false, showActions = false }: CardSkeletonProps) {
  return (
    <Card>
      <CardContent>
        <div style={{ display: 'flex', alignItems: 'center', gap: spacing[3], marginBottom: spacing[4] }}>
          {showAvatar && <Skeleton variant="circular" width="40px" height="40px" />}
          <div style={{ flex: 1 }}>
            <Skeleton width="60%" height="1.25rem" style={{ marginBottom: spacing[1] }} />
            <Skeleton width="40%" height="1rem" />
          </div>
        </div>
        
        <div style={{ marginBottom: spacing[4] }}>
          <Skeleton width="100%" height="1rem" style={{ marginBottom: spacing[2] }} />
          <Skeleton width="80%" height="1rem" style={{ marginBottom: spacing[2] }} />
          <Skeleton width="90%" height="1rem" />
        </div>
        
        {showActions && (
          <div style={{ display: 'flex', gap: spacing[2], justifyContent: 'flex-end' }}>
            <Skeleton width="80px" height="32px" />
            <Skeleton width="80px" height="32px" />
          </div>
        )}
      </CardContent>
    </Card>
  );
}

interface ListSkeletonProps {
  items?: number;
  showAvatar?: boolean;
}

export function ListSkeleton({ items = 5, showAvatar = false }: ListSkeletonProps) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: spacing[3] }}>
      {Array.from({ length: items }).map((_, index) => (
        <div key={index} style={{ display: 'flex', alignItems: 'center', gap: spacing[3] }}>
          {showAvatar && <Skeleton variant="circular" width="32px" height="32px" />}
          <div style={{ flex: 1 }}>
            <Skeleton width="70%" height="1rem" style={{ marginBottom: spacing[1] }} />
            <Skeleton width="50%" height="0.875rem" />
          </div>
          <Skeleton width="60px" height="24px" />
        </div>
      ))}
    </div>
  );
}

interface DashboardSkeletonProps {
  showCharts?: boolean;
}

export function DashboardSkeleton({ showCharts = false }: DashboardSkeletonProps) {
  const statsGridStyle: React.CSSProperties = {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
    gap: spacing[6],
    marginBottom: spacing[8],
  };

  const contentGridStyle: React.CSSProperties = {
    display: 'grid',
    gridTemplateColumns: showCharts ? '1fr 1fr' : '1fr',
    gap: spacing[6],
  };

  return (
    <div>
      {/* Stats Grid */}
      <div style={statsGridStyle}>
        {Array.from({ length: 4 }).map((_, index) => (
          <Card key={index}>
            <CardContent>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: spacing[2] }}>
                <Skeleton width="60%" height="1.5rem" />
                <Skeleton variant="circular" width="40px" height="40px" />
              </div>
              <Skeleton width="40%" height="2rem" style={{ marginBottom: spacing[1] }} />
              <Skeleton width="80%" height="0.875rem" />
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Content Grid */}
      <div style={contentGridStyle}>
        <Card>
          <CardContent>
            <Skeleton width="30%" height="1.5rem" style={{ marginBottom: spacing[4] }} />
            <TableSkeleton rows={3} columns={3} />
          </CardContent>
        </Card>

        {showCharts && (
          <Card>
            <CardContent>
              <Skeleton width="40%" height="1.5rem" style={{ marginBottom: spacing[4] }} />
              <Skeleton width="100%" height="200px" />
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
