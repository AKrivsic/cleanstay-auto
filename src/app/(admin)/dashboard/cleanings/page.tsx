"use client";

import React, { useState, useEffect } from 'react';
import { ResponsiveLayout } from '@/components/layout/ResponsiveLayout';
import { Card, CardContent, CardHeader } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Input } from '@/components/ui/Input';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';
import { colors, spacing, typography, borderRadius } from '@/lib/design-system';

interface Cleaning {
  id: string;
  property_id: string;
  cleaner_id?: string;
  client_id?: string;
  status: string;
  scheduled_date: string;
  started_at?: string;
  completed_at?: string;
  notes?: string;
  metadata?: any;
  properties?: {
    name: string;
    address: string;
    type: string;
  };
  cleaner?: {
    name: string;
    email: string;
    phone?: string;
  };
  client?: {
    name: string;
    email: string;
  };
}

export default function CleaningsPage() {
  const [cleanings, setCleanings] = useState<Cleaning[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');

  const tenantId = '550e8400-e29b-41d4-a716-446655440000';

  useEffect(() => {
    loadCleanings();
  }, [statusFilter]);

  async function loadCleanings() {
    try {
      setLoading(true);
      setError(null);

      const url = new URL('/api/admin/cleanings', window.location.origin);
      if (statusFilter !== 'all') {
        url.searchParams.append('status', statusFilter);
      }

      const res = await fetch(url.toString(), {
        headers: {
          'x-tenant-id': tenantId,
        },
      });

      const data = await res.json();

      if (!res.ok) {
        console.error('API Error:', data);
        throw new Error(data.error || 'Failed to load cleanings');
      }

      setCleanings(data.data || []);
    } catch (err: any) {
      console.error('Error loading cleanings:', err);
      setError(`Chyba při načítání úklidů: ${err.message}`);
    } finally {
      setLoading(false);
    }
  }

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case 'completed':
        return 'success';
      case 'in_progress':
      case 'started':
        return 'warning';
      case 'scheduled':
        return 'primary';
      case 'cancelled':
        return 'error';
      default:
        return 'default';
    }
  };

  const getStatusLabel = (status: string) => {
    const labels: Record<string, string> = {
      scheduled: 'Naplánováno',
      started: 'Probíhá',
      in_progress: 'Probíhá',
      completed: 'Hotovo',
      cancelled: 'Zrušeno',
    };
    return labels[status.toLowerCase()] || status;
  };

  const filteredCleanings = cleanings.filter(cleaning => {
    const matchesSearch = !searchQuery || 
      cleaning.properties?.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      cleaning.properties?.address.toLowerCase().includes(searchQuery.toLowerCase()) ||
      cleaning.cleaner?.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      cleaning.client?.name.toLowerCase().includes(searchQuery.toLowerCase());
    
    return matchesSearch;
  });

  return (
    <ResponsiveLayout
      title="Úklidy"
      subtitle="Správa a přehled všech úklidů"
      actions={
        <Button
          variant="primary"
          onClick={() => window.location.href = '/dashboard/schedule'}
        >
          Naplánovat úklid
        </Button>
      }
    >
      {loading ? (
        <LoadingSpinner />
      ) : error ? (
        <Card>
          <CardContent>
            <div style={{ padding: spacing[6], textAlign: 'center', color: colors.error[600] }}>
              {error}
            </div>
          </CardContent>
        </Card>
      ) : (
        <>
          <Card>
            <CardHeader>
              <div style={{ 
                display: 'flex', 
                gap: spacing[4], 
                alignItems: 'center',
                flexWrap: 'wrap'
              }}>
                <div style={{ flex: 1, minWidth: '200px' }}>
                  <Input
                    type="text"
                    placeholder="Hledat podle názvu, adresy, uklízečky nebo klienta..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                  />
                </div>
                <div style={{ display: 'flex', gap: spacing[2] }}>
                  <Button
                    variant={statusFilter === 'all' ? 'primary' : 'outline'}
                    size="sm"
                    onClick={() => setStatusFilter('all')}
                  >
                    Všechny
                  </Button>
                  <Button
                    variant={statusFilter === 'scheduled' ? 'primary' : 'outline'}
                    size="sm"
                    onClick={() => setStatusFilter('scheduled')}
                  >
                    Naplánováno
                  </Button>
                  <Button
                    variant={statusFilter === 'in_progress' ? 'primary' : 'outline'}
                    size="sm"
                    onClick={() => setStatusFilter('in_progress')}
                  >
                    Probíhá
                  </Button>
                  <Button
                    variant={statusFilter === 'completed' ? 'primary' : 'outline'}
                    size="sm"
                    onClick={() => setStatusFilter('completed')}
                  >
                    Hotovo
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              {filteredCleanings.length === 0 ? (
                <div style={{ 
                  padding: spacing[8], 
                  textAlign: 'center',
                  color: colors.text.secondary 
                }}>
                  {searchQuery || statusFilter !== 'all' 
                    ? 'Žádné úklidy neodpovídají filtru' 
                    : 'Žádné úklidy'}
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: spacing[3] }}>
                  {filteredCleanings.map(cleaning => (
                    <div
                      key={cleaning.id}
                      style={{
                        border: `1px solid ${colors.border.light}`,
                        borderRadius: borderRadius.md,
                        padding: spacing[4],
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        gap: spacing[4],
                        flexWrap: 'wrap',
                      }}
                    >
                      <div style={{ flex: 1, minWidth: '250px' }}>
                        <div style={{ 
                          display: 'flex', 
                          gap: spacing[2], 
                          alignItems: 'center',
                          marginBottom: spacing[1]
                        }}>
                          <h4 style={{ 
                            margin: 0, 
                            fontSize: typography.fontSize.base,
                            fontWeight: typography.fontWeight.semibold,
                            color: colors.text.primary 
                          }}>
                            {cleaning.properties?.name || 'Neznámá nemovitost'}
                          </h4>
                          <Badge variant={getStatusColor(cleaning.status)}>
                            {getStatusLabel(cleaning.status)}
                          </Badge>
                        </div>
                        <p style={{ 
                          margin: 0, 
                          fontSize: typography.fontSize.sm,
                          color: colors.text.secondary 
                        }}>
                          {cleaning.properties?.address}
                        </p>
                        <div style={{ 
                          display: 'flex', 
                          gap: spacing[4],
                          marginTop: spacing[2],
                          flexWrap: 'wrap'
                        }}>
                          <span style={{ 
                            fontSize: typography.fontSize.sm,
                            color: colors.text.tertiary 
                          }}>
                            📅 {new Date(cleaning.scheduled_date).toLocaleString('cs-CZ', {
                              day: '2-digit',
                              month: '2-digit',
                              year: 'numeric',
                              hour: '2-digit',
                              minute: '2-digit'
                            })}
                          </span>
                          {cleaning.cleaner && (
                            <span style={{ 
                              fontSize: typography.fontSize.sm,
                              color: colors.text.tertiary 
                            }}>
                              👤 {cleaning.cleaner.name}
                            </span>
                          )}
                          {cleaning.client && (
                            <span style={{ 
                              fontSize: typography.fontSize.sm,
                              color: colors.text.tertiary 
                            }}>
                              🏢 {cleaning.client.name}
                            </span>
                          )}
                        </div>
                      </div>
                      <div style={{ display: 'flex', gap: spacing[2] }}>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => window.location.href = `/dashboard/cleanings/${cleaning.id}`}
                        >
                          Zobrazit detail
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {filteredCleanings.length > 0 && (
            <Card>
              <CardContent>
                <div style={{ 
                  padding: spacing[4], 
                  textAlign: 'center',
                  color: colors.text.secondary,
                  fontSize: typography.fontSize.sm 
                }}>
                  Zobrazeno {filteredCleanings.length} z {cleanings.length} úklidů
                </div>
              </CardContent>
            </Card>
          )}
        </>
      )}
    </ResponsiveLayout>
  );
}

