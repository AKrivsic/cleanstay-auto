"use client";

import { useState, useEffect } from 'react';
import { createSupabaseClient } from '@/lib/supabase/client';
import Link from 'next/link';
import { ResponsiveLayout } from '@/components/layout/ResponsiveLayout';
import { Card, CardContent, CardHeader } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';
import { DashboardSkeleton } from '@/components/ui/LoadingStates';
import { ErrorBoundary } from '@/components/ErrorBoundary';
import { colors, spacing, typography } from '@/lib/design-system';

export function ClientDashboard() {
  const [properties, setProperties] = useState<any[]>([]);
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const tenantId = '550e8400-e29b-41d4-a716-446655440000';

  useEffect(() => {
    loadData();
  }, []);

  async function loadData() {
    try {
      setLoading(true);
      setError(null);

      const supabase = createSupabaseClient();

      // Load properties
      const { data: propertiesData, error: propertiesError } = await supabase
        .from('properties')
        .select('id, name, address, type, created_at')
        .eq('tenant_id', tenantId)
        .order('created_at', { ascending: false });

      if (propertiesError) {
        console.error('Error loading properties:', propertiesError);
        setError(`Chyba při načítání nemovitostí: ${propertiesError.message}`);
      } else {
        setProperties(propertiesData || []);
      }

      // Load users
      const { data: usersData, error: usersError } = await supabase
        .from('users')
        .select('id, name, email, role, phone, created_at')
        .eq('tenant_id', tenantId)
        .order('created_at', { ascending: false });

      if (usersError) {
        console.error('Error loading users:', usersError);
        setError(`Chyba při načítání uživatelů: ${usersError.message}`);
      } else {
        setUsers(usersData || []);
      }

    } catch (err) {
      console.error('Error loading dashboard data:', err);
      setError('Nastala neočekávaná chyba při načítání dat');
    } finally {
      setLoading(false);
    }
  }

  const getRoleBadgeVariant = (role: string) => {
    switch (role) {
      case 'admin': return 'error';
      case 'cleaner': return 'warning';
      case 'client': return 'primary';
      default: return 'secondary';
    }
  };

  const getPropertyTypeVariant = (type: string) => {
    switch (type) {
      case 'apartment': return 'success';
      case 'house': return 'primary';
      case 'office': return 'secondary';
      case 'hotel': return 'warning';
      default: return 'secondary';
    }
  };

  const formatAddress = (address: any) => {
    if (typeof address === 'string') return address;
    if (address && typeof address === 'object') {
      return `${address.street}, ${address.city} ${address.zip}`;
    }
    return 'Adresa není k dispozici';
  };

  if (loading) {
    return (
      <ResponsiveLayout title="Dashboard" subtitle="Načítání dat...">
        <DashboardSkeleton showCharts={true} />
      </ResponsiveLayout>
    );
  }

  if (error) {
    return (
      <ResponsiveLayout title="Dashboard">
        <div style={{ 
          display: 'flex', 
          flexDirection: 'column',
          alignItems: 'center', 
          justifyContent: 'center', 
          minHeight: '400px',
          textAlign: 'center',
          padding: spacing[8]
        }}>
          <div style={{ fontSize: '4rem', marginBottom: spacing[4] }}>❌</div>
          <h2 style={{ 
            fontSize: typography.fontSize['2xl'], 
            fontWeight: typography.fontWeight.bold, 
            color: colors.error[600],
            margin: 0,
            marginBottom: spacing[2]
          }}>
            Chyba při načítání
          </h2>
          <p style={{ 
            color: colors.text.secondary, 
            margin: 0,
            marginBottom: spacing[6],
            maxWidth: '400px'
          }}>
            {error}
          </p>
          <Button variant="primary" onClick={loadData}>
            Zkusit znovu
          </Button>
        </div>
      </ResponsiveLayout>
    );
  }

  const actions = (
    <div style={{ display: 'flex', gap: spacing[3] }}>
      <Button variant="primary" onClick={() => window.location.href = '/dashboard/schedule'}>
        Naplánovat úklid
      </Button>
      <Button variant="outline" onClick={() => window.location.href = '/dashboard/manage'}>
        Správa uživatelů
      </Button>
    </div>
  );

  return (
    <ErrorBoundary>
      <ResponsiveLayout 
        title="Dashboard" 
        subtitle="Přehled vašich nemovitostí a uživatelů"
        actions={actions}
      >
        {/* Stats Grid */}
        <div style={{ 
          display: 'grid', 
          gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', 
          gap: spacing[6],
          marginBottom: spacing[8]
        }}>
          <Card hover>
            <CardContent>
              <div style={{ 
                display: 'flex', 
                alignItems: 'center', 
                justifyContent: 'space-between', 
                marginBottom: spacing[4] 
              }}>
                <h3 style={{ 
                  fontSize: typography.fontSize.sm, 
                  fontWeight: typography.fontWeight.medium, 
                  color: colors.text.secondary, 
                  margin: 0 
                }}>
                  Celkem nemovitostí
                </h3>
                <div style={{ fontSize: '2rem' }}>🏠</div>
              </div>
              <div style={{ 
                fontSize: typography.fontSize['3xl'], 
                fontWeight: typography.fontWeight.bold, 
                color: colors.text.primary 
              }}>
                {properties.length}
              </div>
            </CardContent>
          </Card>

          <Card hover>
            <CardContent>
              <div style={{ 
                display: 'flex', 
                alignItems: 'center', 
                justifyContent: 'space-between', 
                marginBottom: spacing[4] 
              }}>
                <h3 style={{ 
                  fontSize: typography.fontSize.sm, 
                  fontWeight: typography.fontWeight.medium, 
                  color: colors.text.secondary, 
                  margin: 0 
                }}>
                  Celkem uživatelů
                </h3>
                <div style={{ fontSize: '2rem' }}>👥</div>
              </div>
              <div style={{ 
                fontSize: typography.fontSize['3xl'], 
                fontWeight: typography.fontWeight.bold, 
                color: colors.text.primary 
              }}>
                {users.length}
              </div>
            </CardContent>
          </Card>

          <Card hover>
            <CardContent>
              <div style={{ 
                display: 'flex', 
                alignItems: 'center', 
                justifyContent: 'space-between', 
                marginBottom: spacing[4] 
              }}>
                <h3 style={{ 
                  fontSize: typography.fontSize.sm, 
                  fontWeight: typography.fontWeight.medium, 
                  color: colors.text.secondary, 
                  margin: 0 
                }}>
                  Dnešní úklidy
                </h3>
                <div style={{ fontSize: '2rem' }}>🧹</div>
              </div>
              <div style={{ 
                fontSize: typography.fontSize['3xl'], 
                fontWeight: typography.fontWeight.bold, 
                color: colors.text.primary 
              }}>
                0
              </div>
            </CardContent>
          </Card>

          <Card hover>
            <CardContent>
              <div style={{ 
                display: 'flex', 
                alignItems: 'center', 
                justifyContent: 'space-between', 
                marginBottom: spacing[4] 
              }}>
                <h3 style={{ 
                  fontSize: typography.fontSize.sm, 
                  fontWeight: typography.fontWeight.medium, 
                  color: colors.text.secondary, 
                  margin: 0 
                }}>
                  Dokončené
                </h3>
                <div style={{ fontSize: '2rem' }}>✅</div>
              </div>
              <div style={{ 
                fontSize: typography.fontSize['3xl'], 
                fontWeight: typography.fontWeight.bold, 
                color: colors.text.primary 
              }}>
                0
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Content Grid */}
        <div style={{ 
          display: 'grid', 
          gridTemplateColumns: 'repeat(auto-fit, minmax(400px, 1fr))', 
          gap: spacing[6] 
        }}>
          {/* Properties */}
          <Card>
            <CardHeader>
              <div style={{ 
                display: 'flex', 
                justifyContent: 'space-between', 
                alignItems: 'center' 
              }}>
                <h2 style={{ 
                  fontSize: typography.fontSize.xl, 
                  fontWeight: typography.fontWeight.semibold, 
                  margin: 0, 
                  color: colors.text.primary 
                }}>
                  Nemovitosti
                </h2>
                <Button variant="ghost" size="sm" onClick={() => window.location.href = '/dashboard/manage'}>
                  Zobrazit všechny
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              {properties.length === 0 ? (
                <div style={{ 
                  textAlign: 'center', 
                  padding: spacing[8], 
                  color: colors.text.secondary 
                }}>
                  <div style={{ fontSize: '3rem', marginBottom: spacing[2] }}>🏠</div>
                  <p style={{ margin: 0, fontSize: typography.fontSize.lg }}>
                    Zatím žádné nemovitosti
                  </p>
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: spacing[3] }}>
                  {properties.slice(0, 5).map(property => (
                    <div key={property.id} style={{ 
                      padding: spacing[4], 
                      border: `1px solid ${colors.border.light}`, 
                      borderRadius: '8px',
                      backgroundColor: colors.background.secondary,
                      transition: 'all 0.2s ease-in-out'
                    }}>
                      <div style={{ 
                        display: 'flex', 
                        justifyContent: 'space-between', 
                        alignItems: 'flex-start', 
                        marginBottom: spacing[2] 
                      }}>
                        <h3 style={{ 
                          fontSize: typography.fontSize.base, 
                          fontWeight: typography.fontWeight.medium, 
                          margin: 0, 
                          color: colors.text.primary 
                        }}>
                          {property.name}
                        </h3>
                        <Badge variant={getPropertyTypeVariant(property.type)}>
                          {property.type}
                        </Badge>
                      </div>
                      <p style={{ 
                        fontSize: typography.fontSize.sm, 
                        color: colors.text.secondary, 
                        margin: 0 
                      }}>
                        {formatAddress(property.address)}
                      </p>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Users */}
          <Card>
            <CardHeader>
              <div style={{ 
                display: 'flex', 
                justifyContent: 'space-between', 
                alignItems: 'center' 
              }}>
                <h2 style={{ 
                  fontSize: typography.fontSize.xl, 
                  fontWeight: typography.fontWeight.semibold, 
                  margin: 0, 
                  color: colors.text.primary 
                }}>
                  Uživatelé
                </h2>
                <Button variant="ghost" size="sm" onClick={() => window.location.href = '/dashboard/manage'}>
                  Zobrazit všechny
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              {users.length === 0 ? (
                <div style={{ 
                  textAlign: 'center', 
                  padding: spacing[8], 
                  color: colors.text.secondary 
                }}>
                  <div style={{ fontSize: '3rem', marginBottom: spacing[2] }}>👥</div>
                  <p style={{ margin: 0, fontSize: typography.fontSize.lg }}>
                    Zatím žádní uživatelé
                  </p>
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: spacing[3] }}>
                  {users.slice(0, 5).map(user => (
                    <div key={user.id} style={{ 
                      padding: spacing[4], 
                      border: `1px solid ${colors.border.light}`, 
                      borderRadius: '8px',
                      backgroundColor: colors.background.secondary,
                      transition: 'all 0.2s ease-in-out'
                    }}>
                      <div style={{ 
                        display: 'flex', 
                        justifyContent: 'space-between', 
                        alignItems: 'center', 
                        marginBottom: spacing[2] 
                      }}>
                        <h3 style={{ 
                          fontSize: typography.fontSize.base, 
                          fontWeight: typography.fontWeight.medium, 
                          margin: 0, 
                          color: colors.text.primary 
                        }}>
                          {user.name}
                        </h3>
                        <Badge variant={getRoleBadgeVariant(user.role)}>
                          {user.role}
                        </Badge>
                      </div>
                      <p style={{ 
                        fontSize: typography.fontSize.sm, 
                        color: colors.text.secondary, 
                        margin: 0 
                      }}>
                        {user.email}
                      </p>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Live Feed */}
        <Card>
          <CardHeader>
            <h2 style={{ 
              fontSize: typography.fontSize.xl, 
              fontWeight: typography.fontWeight.semibold, 
              margin: 0, 
              color: colors.text.primary 
            }}>
              Živý feed
            </h2>
          </CardHeader>
          <CardContent>
            <div style={{ 
              textAlign: 'center', 
              padding: spacing[8], 
              color: colors.text.secondary 
            }}>
              <div style={{ fontSize: '3rem', marginBottom: spacing[2] }}>📊</div>
              <p style={{ margin: 0, fontSize: typography.fontSize.lg }}>
                Zatím žádné aktivity
              </p>
            </div>
          </CardContent>
        </Card>
      </ResponsiveLayout>
    </ErrorBoundary>
  );
}
