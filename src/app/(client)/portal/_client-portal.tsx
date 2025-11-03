"use client";

import React from 'react';
import { ClientLayout } from '@/components/layout/ClientLayout';
import { Card, CardContent, CardHeader } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { colors, spacing, typography } from '@/lib/design-system';
import { ClientProperties } from './_components/ClientProperties';
import { ClientRecentCleanings } from './_components/ClientRecentCleanings';

export interface ClientOverview {
  properties: any[];
  recentCleanings: any[];
  recentPhotos: Array<{
    eventId: string;
    thumbUrl: string;
    propertyName: string;
    timestamp: string;
    phase: string;
  }>;
  monthlyCleanings: number;
  lastCleaning: string | null;
}

export function ClientPortalView({ overview }: { overview: ClientOverview }) {
  return (
    <ClientLayout
      title="Můj portál"
      subtitle="Přehled vašich objektů a úklidů"
      actions={
        <div style={{ display: 'flex', gap: spacing[3], flexWrap: 'wrap' }}>
          <Button variant="primary" size="sm" onClick={() => window.location.reload()}>Obnovit</Button>
          <Button variant="outline" size="sm" onClick={() => window.location.href = '/kontakt'}>Podpora</Button>
        </div>
      }
    >
      {/* Stats */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
        gap: spacing[6],
        marginBottom: spacing[8]
      }}>
        <Card hover>
          <CardContent>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: spacing[2] }}>
              <h3 style={{ margin: 0, fontSize: typography.fontSize.sm, color: colors.text.secondary }}>Celkem objektů</h3>
              <div style={{ fontSize: '1.5rem' }}>🏠</div>
            </div>
            <div style={{ fontSize: typography.fontSize['3xl'], fontWeight: typography.fontWeight.bold }}>{overview.properties.length}</div>
          </CardContent>
        </Card>
        <Card hover>
          <CardContent>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: spacing[2] }}>
              <h3 style={{ margin: 0, fontSize: typography.fontSize.sm, color: colors.text.secondary }}>Úklidy tento měsíc</h3>
              <div style={{ fontSize: '1.5rem' }}>🧹</div>
            </div>
            <div style={{ fontSize: typography.fontSize['3xl'], fontWeight: typography.fontWeight.bold }}>{overview.monthlyCleanings}</div>
          </CardContent>
        </Card>
        <Card hover>
          <CardContent>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: spacing[2] }}>
              <h3 style={{ margin: 0, fontSize: typography.fontSize.sm, color: colors.text.secondary }}>Poslední úklid</h3>
              <div style={{ fontSize: '1.5rem' }}>📅</div>
            </div>
            <div style={{ fontSize: typography.fontSize['3xl'], fontWeight: typography.fontWeight.bold }}>
              {overview.lastCleaning ? new Date(overview.lastCleaning).toLocaleDateString() : '—'}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Client content grid */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(380px, 1fr))',
        gap: spacing[6]
      }}>
        <Card>
          <CardHeader>
            <h2 style={{ margin: 0, fontSize: typography.fontSize.xl, fontWeight: typography.fontWeight.semibold, color: colors.text.primary }}>Moje objekty</h2>
          </CardHeader>
          <CardContent>
            <ClientProperties properties={overview.properties} />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <h2 style={{ margin: 0, fontSize: typography.fontSize.xl, fontWeight: typography.fontWeight.semibold, color: colors.text.primary }}>Poslední úklidy</h2>
          </CardHeader>
          <CardContent>
            <ClientRecentCleanings cleanings={overview.recentCleanings} />
          </CardContent>
        </Card>
      </div>

      {/* Recent photos */}
      <div style={{ marginTop: spacing[8] }}>
        <Card>
          <CardHeader>
            <h2 style={{ margin: 0, fontSize: typography.fontSize.xl, fontWeight: typography.fontWeight.semibold, color: colors.text.primary }}>Nedávné fotky</h2>
          </CardHeader>
          <CardContent>
            {overview.recentPhotos.length === 0 ? (
              <div style={{ textAlign: 'center', color: colors.text.secondary, padding: spacing[8] }}>Žádné fotky</div>
            ) : (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: spacing[4] }}>
                {overview.recentPhotos.map((photo) => (
                  <div key={photo.eventId} style={{ border: `1px solid ${colors.border.light}`, borderRadius: '8px', overflow: 'hidden', backgroundColor: colors.background.primary }}>
                    <img src={photo.thumbUrl} alt={`Foto z ${photo.propertyName}`} style={{ width: '100%', height: 120, objectFit: 'cover' }} />
                    <div style={{ padding: spacing[3], display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span style={{ fontSize: typography.fontSize.sm, color: colors.text.secondary }}>{new Date(photo.timestamp).toLocaleDateString()}</span>
                      <span style={{ fontSize: typography.fontSize.sm, color: colors.primary[600] }}>{photo.phase}</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </ClientLayout>
  );
}


