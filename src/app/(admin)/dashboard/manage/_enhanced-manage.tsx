"use client";

import React, { useState, useEffect } from 'react';
import { ResponsiveLayout } from '@/components/layout/ResponsiveLayout';
import { Card, CardContent, CardHeader } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Modal } from '@/components/ui/Modal';
import { Badge } from '@/components/ui/Badge';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';
import { TableSkeleton, ListSkeleton } from '@/components/ui/LoadingStates';
import { AdvancedFilters } from '@/components/ui/AdvancedFilters';
import { BulkActions } from '@/components/ui/BulkActions';
import { ExportButton } from '@/components/ui/ExportButton';
import { SmartSuggestions, useSmartSuggestions } from '@/components/ui/SmartSuggestions';
import { SimpleChart } from '@/components/charts/SimpleChart';
import { ErrorBoundary } from '@/components/ErrorBoundary';
import { createSupabaseClient } from '@/lib/supabase/client';
import { colors, spacing, typography, borderRadius } from '@/lib/design-system';

interface User {
  id: string;
  name: string;
  email: string;
  role: 'admin' | 'manager' | 'cleaner' | 'client';
  phone?: string;
  created_at: string;
  updated_at: string;
}

interface Property {
  id: string;
  name: string;
  address: string;
  type: 'apartment' | 'house' | 'office' | 'hotel' | 'other';
  client_id?: string;
  created_at: string;
  updated_at: string;
}

export function EnhancedManagePage() {
  const [activeTab, setActiveTab] = useState<'users' | 'properties'>('users');
  const [users, setUsers] = useState<User[]>([]);
  const [properties, setProperties] = useState<Property[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedUsers, setSelectedUsers] = useState<string[]>([]);
  const [selectedProperties, setSelectedProperties] = useState<string[]>([]);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [createType, setCreateType] = useState<'client' | 'cleaner' | 'property'>('client');
  const [clientsForSelect, setClientsForSelect] = useState<User[]>([]);

  // Filters
  const [userFilters, setUserFilters] = useState({
    search: '',
    role: '',
    status: '',
  });
  const [propertyFilters, setPropertyFilters] = useState({
    search: '',
    type: '',
    status: '',
  });

  // Modals
  const [showUserModal, setShowUserModal] = useState(false);
  const [showPropertyModal, setShowPropertyModal] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [editingProperty, setEditingProperty] = useState<Property | null>(null);
  
  // Temporary form state for multi-select
  const [tempPropertyIds, setTempPropertyIds] = useState<string[]>([]);

  const tenantId = '550e8400-e29b-41d4-a716-446655440000';

  // Smart suggestions
  const suggestions = useSmartSuggestions({ users, properties });

  useEffect(() => {
    loadData();
  }, []);

  async function loadData() {
    try {
      setLoading(true);
      setError(null);

      // Load via server API to avoid browser env issues
      const [usersRes, propertiesRes] = await Promise.all([
        fetch('/api/admin/users', { headers: { 'x-tenant-id': tenantId } }),
        fetch('/api/admin/properties', { headers: { 'x-tenant-id': tenantId } }),
      ]);
      const usersJson = await usersRes.json();
      const propertiesJson = await propertiesRes.json();
      if (!usersRes.ok) throw new Error(usersJson?.error || 'Failed to load users');
      if (!propertiesRes.ok) throw new Error(propertiesJson?.error || 'Failed to load properties');
      setUsers(usersJson.data || []);
      setClientsForSelect((usersJson.data || []).filter((u: any) => u.role === 'client'));
      setProperties(propertiesJson.data || []);

    } catch (err) {
      console.error('Error loading data:', err);
      setError('Nastala neočekávaná chyba při načítání dat');
    } finally {
      setLoading(false);
    }
  }

  // Filter functions
  const filteredUsers = users.filter(user => {
    const matchesSearch = !userFilters.search || 
      user.name.toLowerCase().includes(userFilters.search.toLowerCase()) ||
      user.email.toLowerCase().includes(userFilters.search.toLowerCase());
    const matchesRole = !userFilters.role || user.role === userFilters.role;
    return matchesSearch && matchesRole;
  });

  const filteredProperties = properties.filter(property => {
    const matchesSearch = !propertyFilters.search || 
      property.name.toLowerCase().includes(propertyFilters.search.toLowerCase()) ||
      property.address.toLowerCase().includes(propertyFilters.search.toLowerCase());
    const matchesType = !propertyFilters.type || property.type === propertyFilters.type;
    return matchesSearch && matchesType;
  });

  // Bulk operations
  const handleBulkDeleteUsers = async (userIds: string[]) => {
    try {
      const supabase = createSupabaseClient();
      const { error } = await supabase
        .from('users')
        .delete()
        .in('id', userIds);

      if (error) throw error;

      setUsers(users.filter(user => !userIds.includes(user.id)));
      setSelectedUsers([]);
    } catch (error) {
      console.error('Bulk delete error:', error);
      throw error;
    }
  };

  const handleBulkDeleteProperties = async (propertyIds: string[]) => {
    try {
      const supabase = createSupabaseClient();
      const { error } = await supabase
        .from('properties')
        .delete()
        .in('id', propertyIds);

      if (error) throw error;

      setProperties(properties.filter(property => !propertyIds.includes(property.id)));
      setSelectedProperties([]);
    } catch (error) {
      console.error('Bulk delete error:', error);
      throw error;
    }
  };

  const handleBulkExportUsers = (userIds: string[]) => {
    const dataToExport = users.filter(user => userIds.includes(user.id));
    // This would trigger the export functionality
    console.log('Exporting users:', dataToExport);
  };

  const handleBulkExportProperties = (propertyIds: string[]) => {
    const dataToExport = properties.filter(property => propertyIds.includes(property.id));
    // This would trigger the export functionality
    console.log('Exporting properties:', dataToExport);
  };

  // Chart data
  const userRoleData = [
    { label: 'Klienti', value: users.filter(u => u.role === 'client').length, color: colors.primary[500] },
    { label: 'Uklízečky', value: users.filter(u => u.role === 'cleaner').length, color: colors.success[500] },
    { label: 'Admini', value: users.filter(u => u.role === 'admin').length, color: colors.error[500] },
  ];

  const propertyTypeData = [
    { label: 'Byty', value: properties.filter(p => p.type === 'apartment').length, color: colors.primary[500] },
    { label: 'Domy', value: properties.filter(p => p.type === 'house').length, color: colors.success[500] },
    { label: 'Kanceláře', value: properties.filter(p => p.type === 'office').length, color: colors.warning[500] },
    { label: 'Hotely', value: properties.filter(p => p.type === 'hotel').length, color: colors.error[500] },
  ];

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

  if (loading) {
    return (
      <ResponsiveLayout title="Správa uživatelů a nemovitostí">
        <div style={{ display: 'flex', flexDirection: 'column', gap: spacing[6] }}>
          <TableSkeleton rows={5} columns={4} />
          <ListSkeleton items={3} showAvatar={true} />
        </div>
      </ResponsiveLayout>
    );
  }

  if (error) {
    return (
      <ResponsiveLayout title="Správa uživatelů a nemovitostí">
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
      <Button
        variant="primary"
        onClick={() => {
          setCreateType('client');
          setShowCreateModal(true);
        }}
        leftIcon="👤"
      >
        Přidat klienta
      </Button>
      <Button
        variant="primary"
        onClick={() => {
          setCreateType('cleaner');
          setShowCreateModal(true);
        }}
        leftIcon="🧹"
      >
        Přidat uklízečku
      </Button>
      <Button
        variant="primary"
        onClick={() => {
          setCreateType('property');
          setShowCreateModal(true);
        }}
        leftIcon="🏠"
      >
        Přidat nemovitost
      </Button>
    </div>
  );

  return (
    <ErrorBoundary>
      <ResponsiveLayout 
        title="Správa uživatelů a nemovitostí"
        subtitle="Kompletní správa vašich dat"
        actions={actions}
      >
        {/* Smart Suggestions */}
        {suggestions.length > 0 && (
          <Card>
            <CardHeader>
              <h3 style={{ 
                fontSize: typography.fontSize.lg, 
                fontWeight: typography.fontWeight.semibold, 
                margin: 0,
                color: colors.text.primary 
              }}>
                Doporučení
              </h3>
            </CardHeader>
            <CardContent>
              <SmartSuggestions suggestions={suggestions} />
            </CardContent>
          </Card>
        )}

        {/* Analytics Overview */}
        <div style={{ 
          display: 'grid', 
          gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', 
          gap: spacing[6],
          marginBottom: spacing[8]
        }}>
          <Card>
            <CardHeader>
              <h3 style={{ 
                fontSize: typography.fontSize.lg, 
                fontWeight: typography.fontWeight.semibold, 
                margin: 0,
                color: colors.text.primary 
              }}>
                Rozdělení uživatelů
              </h3>
            </CardHeader>
            <CardContent>
              <SimpleChart
                data={userRoleData}
                type="donut"
                height={200}
                showValues={true}
                showLegend={true}
              />
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <h3 style={{ 
                fontSize: typography.fontSize.lg, 
                fontWeight: typography.fontWeight.semibold, 
                margin: 0,
                color: colors.text.primary 
              }}>
                Typy nemovitostí
              </h3>
            </CardHeader>
            <CardContent>
              <SimpleChart
                data={propertyTypeData}
                type="bar"
                height={200}
                showValues={true}
                showLegend={true}
              />
            </CardContent>
          </Card>
        </div>

        {/* Tab Navigation */}
        <div style={{ 
          display: 'flex', 
          gap: spacing[2], 
          marginBottom: spacing[6],
          borderBottom: `1px solid ${colors.border.light}`
        }}>
          <button
            style={{
              padding: `${spacing[2]} ${spacing[4]}`,
              border: 'none',
              background: 'none',
              borderBottom: `2px solid ${activeTab === 'users' ? colors.primary[500] : 'transparent'}`,
              color: activeTab === 'users' ? colors.primary[600] : colors.text.secondary,
              fontWeight: typography.fontWeight.medium,
              cursor: 'pointer',
              transition: 'all 0.2s ease-in-out',
            }}
            onClick={() => setActiveTab('users')}
          >
            Uživatelé ({users.length})
          </button>
          <button
            style={{
              padding: `${spacing[2]} ${spacing[4]}`,
              border: 'none',
              background: 'none',
              borderBottom: `2px solid ${activeTab === 'properties' ? colors.primary[500] : 'transparent'}`,
              color: activeTab === 'properties' ? colors.primary[600] : colors.text.secondary,
              fontWeight: typography.fontWeight.medium,
              cursor: 'pointer',
              transition: 'all 0.2s ease-in-out',
            }}
            onClick={() => setActiveTab('properties')}
          >
            Nemovitosti ({properties.length})
          </button>
        </div>

        {/* Filters */}
        <AdvancedFilters
          filters={activeTab === 'users' ? userFilters : propertyFilters}
          onFiltersChange={activeTab === 'users' ? setUserFilters : setPropertyFilters}
          onClearFilters={() => {
            if (activeTab === 'users') {
              setUserFilters({ search: '', role: '', status: '' });
            } else {
              setPropertyFilters({ search: '', type: '', status: '' });
            }
          }}
          searchPlaceholder={activeTab === 'users' ? 'Vyhledat uživatele...' : 'Vyhledat nemovitosti...'}
          roleOptions={[
            { value: 'admin', label: 'Admin', count: users.filter(u => u.role === 'admin').length },
            { value: 'cleaner', label: 'Uklízečka', count: users.filter(u => u.role === 'cleaner').length },
            { value: 'client', label: 'Klient', count: users.filter(u => u.role === 'client').length },
          ]}
          typeOptions={[
            { value: 'apartment', label: 'Byt', count: properties.filter(p => p.type === 'apartment').length },
            { value: 'house', label: 'Dům', count: properties.filter(p => p.type === 'house').length },
            { value: 'office', label: 'Kancelář', count: properties.filter(p => p.type === 'office').length },
            { value: 'hotel', label: 'Hotel', count: properties.filter(p => p.type === 'hotel').length },
          ]}
          showRoleFilter={activeTab === 'users'}
          showTypeFilter={activeTab === 'properties'}
        />

        {/* Bulk Actions */}
        {activeTab === 'users' && (
          <BulkActions
            selectedItems={selectedUsers}
            totalItems={filteredUsers.length}
            onSelectAll={() => setSelectedUsers(filteredUsers.map(u => u.id))}
            onClearSelection={() => setSelectedUsers([])}
            onBulkDelete={handleBulkDeleteUsers}
            onBulkExport={handleBulkExportUsers}
            itemType="users"
          />
        )}

        {activeTab === 'properties' && (
          <BulkActions
            selectedItems={selectedProperties}
            totalItems={filteredProperties.length}
            onSelectAll={() => setSelectedProperties(filteredProperties.map(p => p.id))}
            onClearSelection={() => setSelectedProperties([])}
            onBulkDelete={handleBulkDeleteProperties}
            onBulkExport={handleBulkExportProperties}
            itemType="properties"
          />
        )}

        {/* Content */}
        {activeTab === 'users' ? (
          <Card>
            <CardHeader>
              <div style={{ 
                display: 'flex', 
                justifyContent: 'space-between', 
                alignItems: 'center' 
              }}>
                <h3 style={{ 
                  fontSize: typography.fontSize.lg, 
                  fontWeight: typography.fontWeight.semibold, 
                  margin: 0,
                  color: colors.text.primary 
                }}>
                  Uživatelé ({filteredUsers.length})
                </h3>
                <ExportButton
                  data={filteredUsers}
                  dataType="users"
                  filename="uzivatele"
                />
              </div>
            </CardHeader>
            <CardContent>
              {filteredUsers.length === 0 ? (
                <div style={{ 
                  textAlign: 'center', 
                  padding: spacing[8], 
                  color: colors.text.secondary 
                }}>
                  <div style={{ fontSize: '3rem', marginBottom: spacing[2] }}>👥</div>
                  <p style={{ margin: 0, fontSize: typography.fontSize.lg }}>
                    Žádní uživatelé
                  </p>
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: spacing[2] }}>
                  {filteredUsers.map(user => (
                    <div
                      key={user.id}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        padding: spacing[3],
                        border: `1px solid ${colors.border.light}`,
                        borderRadius: borderRadius.md,
                        backgroundColor: selectedUsers.includes(user.id) ? colors.primary[50] : colors.background.primary,
                        transition: 'all 0.2s ease-in-out',
                      }}
                    >
                      <input
                        type="checkbox"
                        checked={selectedUsers.includes(user.id)}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setSelectedUsers([...selectedUsers, user.id]);
                          } else {
                            setSelectedUsers(selectedUsers.filter(id => id !== user.id));
                          }
                        }}
                        style={{ marginRight: spacing[3] }}
                      />
                      <div style={{ flex: 1 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: spacing[2], marginBottom: spacing[1] }}>
                          <h4 style={{ 
                            fontSize: typography.fontSize.base, 
                            fontWeight: typography.fontWeight.medium, 
                            margin: 0,
                            color: colors.text.primary 
                          }}>
                            {user.name}
                          </h4>
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
                      <div style={{ display: 'flex', gap: spacing[2] }}>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            setEditingUser(user);
                            setTempPropertyIds(properties.filter(p => p.client_id === user.id).map(p => p.id));
                            setShowUserModal(true);
                          }}
                        >
                          Upravit
                        </Button>
                        <Button
                          variant="error"
                          size="sm"
                          onClick={() => {
                            if (confirm('Opravdu chcete smazat tohoto uživatele?')) {
                              handleBulkDeleteUsers([user.id]);
                            }
                          }}
                        >
                          Smazat
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        ) : (
          <Card>
            <CardHeader>
              <div style={{ 
                display: 'flex', 
                justifyContent: 'space-between', 
                alignItems: 'center' 
              }}>
                <h3 style={{ 
                  fontSize: typography.fontSize.lg, 
                  fontWeight: typography.fontWeight.semibold, 
                  margin: 0,
                  color: colors.text.primary 
                }}>
                  Nemovitosti ({filteredProperties.length})
                </h3>
                <ExportButton
                  data={filteredProperties}
                  dataType="properties"
                  filename="nemovitosti"
                />
              </div>
            </CardHeader>
            <CardContent>
              {filteredProperties.length === 0 ? (
                <div style={{ 
                  textAlign: 'center', 
                  padding: spacing[8], 
                  color: colors.text.secondary 
                }}>
                  <div style={{ fontSize: '3rem', marginBottom: spacing[2] }}>🏠</div>
                  <p style={{ margin: 0, fontSize: typography.fontSize.lg }}>
                    Žádné nemovitosti
                  </p>
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: spacing[2] }}>
                  {filteredProperties.map(property => (
                    <div
                      key={property.id}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        padding: spacing[3],
                        border: `1px solid ${colors.border.light}`,
                        borderRadius: borderRadius.md,
                        backgroundColor: selectedProperties.includes(property.id) ? colors.primary[50] : colors.background.primary,
                        transition: 'all 0.2s ease-in-out',
                      }}
                    >
                      <input
                        type="checkbox"
                        checked={selectedProperties.includes(property.id)}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setSelectedProperties([...selectedProperties, property.id]);
                          } else {
                            setSelectedProperties(selectedProperties.filter(id => id !== property.id));
                          }
                        }}
                        style={{ marginRight: spacing[3] }}
                      />
                      <div style={{ flex: 1 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: spacing[2], marginBottom: spacing[1] }}>
                          <h4 style={{ 
                            fontSize: typography.fontSize.base, 
                            fontWeight: typography.fontWeight.medium, 
                            margin: 0,
                            color: colors.text.primary 
                          }}>
                            {property.name}
                          </h4>
                          <Badge variant={getPropertyTypeVariant(property.type)}>
                            {property.type}
                          </Badge>
                        </div>
                        <p style={{ 
                          fontSize: typography.fontSize.sm, 
                          color: colors.text.secondary, 
                          margin: 0 
                        }}>
                          {property.address}
                        </p>
                      </div>
                      <div style={{ display: 'flex', gap: spacing[2] }}>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            setEditingProperty(property);
                            setShowPropertyModal(true);
                          }}
                        >
                          Upravit
                        </Button>
                        <Button
                          variant="error"
                          size="sm"
                          onClick={() => {
                            if (confirm('Opravdu chcete smazat tuto nemovitost?')) {
                              handleBulkDeleteProperties([property.id]);
                            }
                          }}
                        >
                          Smazat
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {/* Create Modal */}
        <Modal
          isOpen={showCreateModal}
          onClose={() => setShowCreateModal(false)}
          title={
            createType === 'client' ? 'Nový klient' :
            createType === 'cleaner' ? 'Nová uklízečka' :
            'Nová nemovitost'
          }
          size="lg"
        >
          {createType !== 'property' ? (
            <form
              onSubmit={async (e) => {
                e.preventDefault();
                const form = e.currentTarget as HTMLFormElement;
                const fd = new FormData(form);
                const payload: any = {
                  name: fd.get('name') || undefined,
                  email: fd.get('email') || undefined,
                  role: createType,
                  phone: fd.get('phone') || undefined,
                };
                if (createType === 'client') {
                  Object.assign(payload, {
                    billing_address: fd.get('billing_address') || undefined,
                    ico: fd.get('ico') || undefined,
                    dic: fd.get('dic') || undefined,
                    payment_terms: fd.get('payment_terms') || undefined,
                    billing_frequency: fd.get('billing_frequency') || undefined,
                  });
                } else if (createType === 'cleaner') {
                  Object.assign(payload, {
                    messenger: fd.get('messenger') || undefined,
                    document_number: fd.get('document_number') || undefined,
                    document_type: fd.get('document_type') || undefined,
                    document_valid_until: fd.get('document_valid_until') || undefined,
                    requested_hourly_rate_from: fd.get('requested_hourly_rate_from')
                      ? parseFloat(String(fd.get('requested_hourly_rate_from'))) : undefined,
                    languages: fd.get('languages') ? String(fd.get('languages')).split(',').map(s => s.trim()).filter(Boolean) : undefined,
                    availability: fd.get('availability') || undefined,
                    specializations: fd.get('specializations') ? String(fd.get('specializations')).split(',').map(s => s.trim()).filter(Boolean) : undefined,
                  });
                }
                const res = await fetch('/api/admin/users', {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json', 'x-tenant-id': tenantId, 'x-admin-role': 'admin' },
                  body: JSON.stringify(payload),
                });
                if (res.ok) {
                  setShowCreateModal(false);
                  loadData();
                } else {
                  alert(await res.text());
                }
              }}
              style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: spacing[4] }}
            >
              <Input name="name" label="Jméno *" required />
              <Input name="email" label="Email *" type="email" required />
              <Input name="phone" label="Telefon" />
              {createType === 'client' && (
                <>
                  <Input name="billing_address" label="Fakturační adresa" />
                  <Input name="ico" label="IČO" />
                  <Input name="dic" label="DIČ" />
                  <Input name="payment_terms" label="Platební podmínky" />
                  <div>
                    <label style={{ display: 'block', marginBottom: spacing[1] }}>Frekvence fakturace</label>
                    <select name="billing_frequency" style={{ width: '100%', padding: spacing[2] }}>
                      <option value="">—</option>
                      <option value="after_cleaning">po úklidu</option>
                      <option value="monthly">měsíčně</option>
                      <option value="weekly">týdně</option>
                      <option value="quarterly">jednou za dva týdny</option>
                    </select>
                  </div>
                </>
              )}
              {createType === 'cleaner' && (
                <>
                  <Input name="messenger" label="Messenger/Chat" />
                  <Input name="document_number" label="Číslo dokladu" />
                  <div>
                    <label style={{ display: 'block', marginBottom: spacing[1] }}>Typ dokladu</label>
                    <select name="document_type" style={{ width: '100%', padding: spacing[2] }}>
                      <option value="">—</option>
                      <option value="passport">pas</option>
                      <option value="id_card">OP</option>
                      <option value="driving_license">ŘP</option>
                      <option value="other">jiný</option>
                    </select>
                  </div>
                  <Input name="document_valid_until" label="Platnost dokladu" type="date" />
                  <Input name="requested_hourly_rate_from" label="Požadovaná sazba od (Kč/h)" type="number" step="0.5" />
                  <Input name="languages" label="Jazyky (čárkou)" />
                  <Input name="availability" label="Dostupnost" />
                  <Input name="specializations" label="Specializace (čárkou)" />
                </>
              )}
              <div style={{ gridColumn: '1 / -1', display: 'flex', justifyContent: 'flex-end', gap: spacing[3] }}>
                <Button variant="outline" onClick={() => setShowCreateModal(false)}>Zrušit</Button>
                <Button variant="primary" type="submit">Vytvořit</Button>
              </div>
            </form>
          ) : (
            <form
              onSubmit={async (e) => {
                e.preventDefault();
                const fd = new FormData(e.currentTarget as HTMLFormElement);
                const payload: any = {
                  name: fd.get('name') || undefined,
                  address: fd.get('address') || undefined,
                  type: fd.get('type') || undefined,
                  client_id: fd.get('client_id') || undefined,
                  size_sqm: fd.get('size_sqm') ? parseInt(String(fd.get('size_sqm'))) : undefined,
                  layout: fd.get('layout') || undefined,
                  bathrooms: fd.get('bathrooms') ? parseInt(String(fd.get('bathrooms'))) : undefined,
                  cleaning_instructions: fd.get('cleaning_instructions') || undefined,
                  access_instructions: fd.get('access_instructions') || undefined,
                  equipment_on_site: fd.get('equipment_on_site') || undefined,
                  preferred_cleaning_times: fd.get('preferred_cleaning_times') || undefined,
                  special_requirements: fd.get('special_requirements') || undefined,
                  cleaning_supplies: fd.get('cleaning_supplies') || undefined,
                  pets: fd.get('pets') || undefined,
                };
                const res = await fetch('/api/admin/properties', {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json', 'x-tenant-id': tenantId, 'x-admin-role': 'admin' },
                  body: JSON.stringify(payload),
                });
                if (res.ok) {
                  setShowCreateModal(false);
                  loadData();
                } else {
                  alert(await res.text());
                }
              }}
              style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: spacing[4] }}
            >
              <Input name="name" label="Název *" required />
              <Input name="address" label="Adresa *" required />
              <div>
                <label style={{ display: 'block', marginBottom: spacing[1] }}>Typ *</label>
                <select name="type" required style={{ width: '100%', padding: spacing[2] }}>
                  <option value="apartment">Byt</option>
                  <option value="house">Dům</option>
                  <option value="office">Kancelář</option>
                  <option value="hotel">Hotel</option>
                  <option value="other">Jiné</option>
                </select>
              </div>
              <div>
                <label style={{ display: 'block', marginBottom: spacing[1] }}>Klient</label>
                <select name="client_id" style={{ width: '100%', padding: spacing[2] }}>
                  <option value="">—</option>
                  {clientsForSelect.map(c => (
                    <option key={c.id} value={c.id}>{c.name}</option>
                  ))}
                </select>
              </div>
              <Input name="size_sqm" label="Rozloha (m²)" type="number" />
              <Input name="layout" label="Dispozice" />
              <Input name="bathrooms" label="Počet koupelen" type="number" />
              <Input name="cleaning_instructions" label="Pokyny k úklidu" />
              <Input name="access_instructions" label="Instrukce pro přístup" />
              <Input name="equipment_on_site" label="Vybavení na místě" />
              <Input name="preferred_cleaning_times" label="Preferované časy úklidu" />
              <Input name="special_requirements" label="Speciální požadavky" />
              <div>
                <label style={{ display: 'block', marginBottom: spacing[1] }}>Úklidové prostředky</label>
                <select name="cleaning_supplies" style={{ width: '100%', padding: spacing[2] }}>
                  <option value="">—</option>
                  <option value="client">klient</option>
                  <option value="ours">naše</option>
                  <option value="partial">částečně</option>
                </select>
              </div>
              <Input name="pets" label="Domácí mazlíčci" />
              <div style={{ gridColumn: '1 / -1', display: 'flex', justifyContent: 'flex-end', gap: spacing[3] }}>
                <Button variant="outline" onClick={() => setShowCreateModal(false)}>Zrušit</Button>
                <Button variant="primary" type="submit">Vytvořit</Button>
              </div>
            </form>
          )}
        </Modal>

        {/* Edit User Modal */}
        <Modal
          isOpen={showUserModal}
          onClose={() => {
            setShowUserModal(false);
            setEditingUser(null);
          }}
          title={`Upravit ${editingUser?.role === 'client' ? 'klienta' : 'uklízečku'}`}
          size="lg"
        >
          {editingUser && (
            <form
              onSubmit={async (e) => {
                e.preventDefault();
                const form = e.currentTarget as HTMLFormElement;
                const fd = new FormData(form);
                try {
                  const res = await fetch(`/api/admin/users/${editingUser.id}`, {
                    method: 'PUT',
                    headers: {
                      'Content-Type': 'application/json',
                      'x-tenant-id': tenantId,
                    },
                    body: JSON.stringify({
                      name: fd.get('name'),
                      email: fd.get('email'),
                      phone: fd.get('phone'),
                      role: editingUser.role,
                      ...(editingUser.role === 'client' ? {
                        billing_address: fd.get('billing_address'),
                        billing_frequency: fd.get('billing_frequency'),
                        ico: fd.get('ico'),
                        dic: fd.get('dic'),
                        notes: fd.get('notes'),
                        property_ids: tempPropertyIds,
                      } : {
                        document_number: fd.get('document_number'),
                        hourly_rate: fd.get('hourly_rate'),
                        messenger: fd.get('messenger'),
                        availability: fd.get('availability'),
                      }),
                    }),
                  });
                  const data = await res.json();
                  if (res.ok) {
                    await loadData();
                    setShowUserModal(false);
                    setEditingUser(null);
                  } else {
                    alert(`Chyba: ${data.error}`);
                  }
                } catch (err) {
                  alert('Chyba při ukládání');
                  console.error(err);
                }
              }}
            >
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: spacing[4], marginBottom: spacing[4] }}>
                <Input
                  name="name"
                  label="Jméno *"
                  defaultValue={editingUser.name}
                  required
                />
                <Input
                  name="email"
                  label="Email *"
                  type="email"
                  defaultValue={editingUser.email}
                  required
                />
                <Input
                  name="phone"
                  label="Telefon"
                  defaultValue={editingUser.phone || ''}
                />
                {editingUser.role === 'client' ? (
                  <>
                    <Input
                      name="billing_address"
                      label="Fakturační adresa"
                      defaultValue={(editingUser as any).billing_address || ''}
                    />
                    <Input
                      name="ico"
                      label="IČO"
                      defaultValue={(editingUser as any).ico || ''}
                    />
                    <Input
                      name="dic"
                      label="DIČ"
                      defaultValue={(editingUser as any).dic || ''}
                    />
                    <div>
                      <label style={{ display: 'block', marginBottom: spacing[1], fontSize: typography.fontSize.sm, fontWeight: 500 }}>
                        Frekvence fakturace
                      </label>
                      <select name="billing_frequency" defaultValue={(editingUser as any).billing_frequency || 'jednou za dva týdny'} style={{ width: '100%', padding: spacing[2], border: `1px solid ${colors.border.light}`, borderRadius: borderRadius.md }}>
                        <option value="jednou týdně">Jednou týdně</option>
                        <option value="jednou za dva týdny">Jednou za dva týdny</option>
                        <option value="jednou měsíčně">Jednou měsíčně</option>
                      </select>
                    </div>
                    <div style={{ gridColumn: '1 / -1' }}>
                      <label style={{ display: 'block', marginBottom: spacing[1], fontSize: typography.fontSize.sm, fontWeight: 500 }}>
                        Nemovitosti
                      </label>
                      <select 
                        name="property_ids" 
                        multiple
                        value={tempPropertyIds}
                        onChange={(e) => {
                          const selectedIds = Array.from(e.target.selectedOptions, opt => opt.value);
                          setTempPropertyIds(selectedIds);
                        }}
                        style={{ width: '100%', padding: spacing[2], border: `1px solid ${colors.border.light}`, borderRadius: borderRadius.md, minHeight: '100px' }}
                      >
                        {properties.map(property => (
                          <option key={property.id} value={property.id}>
                            {property.name} - {property.address}
                          </option>
                        ))}
                      </select>
                      <p style={{ fontSize: typography.fontSize.xs, color: colors.text.secondary, marginTop: spacing[1] }}>
                        Podržte Cmd/Ctrl a vyberte více nemovitostí
                      </p>
                    </div>
                    <div style={{ gridColumn: '1 / -1' }}>
                      <label style={{ display: 'block', marginBottom: spacing[1], fontSize: typography.fontSize.sm, fontWeight: 500 }}>
                        Poznámky
                      </label>
                      <textarea
                        name="notes"
                        defaultValue={(editingUser as any).notes || ''}
                        style={{ width: '100%', padding: spacing[2], border: `1px solid ${colors.border.light}`, borderRadius: borderRadius.md, fontFamily: 'inherit' }}
                        rows={3}
                      />
                    </div>
                  </>
                ) : (
                  <>
                    <Input
                      name="document_number"
                      label="Číslo OP/občanky"
                      defaultValue={(editingUser as any).document_number || ''}
                    />
                    <Input
                      name="hourly_rate"
                      label="Hodinová sazba (Kč)"
                      type="number"
                      defaultValue={(editingUser as any).hourly_rate || ''}
                    />
                    <Input
                      name="messenger"
                      label="Messenger ID"
                      defaultValue={(editingUser as any).messenger || ''}
                    />
                    <Input
                      name="availability"
                      label="Dostupnost"
                      defaultValue={(editingUser as any).availability || ''}
                      placeholder="např. Pondělí-Pátek 8-16"
                    />
                  </>
                )}
              </div>
              <Button type="submit">Uložit změny</Button>
            </form>
          )}
        </Modal>

        {/* Edit Property Modal */}
        <Modal
          isOpen={showPropertyModal}
          onClose={() => {
            setShowPropertyModal(false);
            setEditingProperty(null);
          }}
          title="Upravit nemovitost"
          size="lg"
        >
          {editingProperty && (
            <form
              onSubmit={async (e) => {
                e.preventDefault();
                const form = e.currentTarget as HTMLFormElement;
                const fd = new FormData(form);
                try {
                  const res = await fetch(`/api/admin/properties/${editingProperty.id}`, {
                    method: 'PUT',
                    headers: {
                      'Content-Type': 'application/json',
                      'x-tenant-id': tenantId,
                    },
                    body: JSON.stringify({
                      name: fd.get('name'),
                      address: fd.get('address'),
                      type: fd.get('type'),
                      client_id: fd.get('client_id') || null,
                      size_sqm: fd.get('size_sqm'),
                      rooms: fd.get('rooms'),
                      bathrooms: fd.get('bathrooms'),
                      access_instructions: fd.get('access_instructions'),
                      cleaning_supplies: fd.get('cleaning_supplies'),
                      pets: fd.get('pets'),
                    }),
                  });
                  const data = await res.json();
                  if (res.ok) {
                    await loadData();
                    setShowPropertyModal(false);
                    setEditingProperty(null);
                  } else {
                    alert(`Chyba: ${data.error}`);
                  }
                } catch (err) {
                  alert('Chyba při ukládání');
                  console.error(err);
                }
              }}
            >
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: spacing[4], marginBottom: spacing[4] }}>
                <Input
                  name="name"
                  label="Název *"
                  defaultValue={editingProperty.name}
                  required
                />
                <Input
                  name="address"
                  label="Adresa *"
                  defaultValue={editingProperty.address}
                  required
                />
                <div>
                  <label style={{ display: 'block', marginBottom: spacing[1], fontSize: typography.fontSize.sm, fontWeight: 500 }}>
                    Typ nemovitosti *
                  </label>
                  <select name="type" defaultValue={editingProperty.type} required style={{ width: '100%', padding: spacing[2], border: `1px solid ${colors.border.light}`, borderRadius: borderRadius.md }}>
                    <option value="apartment">Byt</option>
                    <option value="house">Dům</option>
                    <option value="office">Kancelář</option>
                    <option value="hotel">Hotel</option>
                    <option value="other">Jiné</option>
                  </select>
                </div>
                <div>
                  <label style={{ display: 'block', marginBottom: spacing[1], fontSize: typography.fontSize.sm, fontWeight: 500 }}>
                    Klient
                  </label>
                  <select 
                    name="client_id" 
                    value={editingProperty.client_id || ''}
                    onChange={(e) => {
                      // Auto-update property's client_id when user selects a client
                      setEditingProperty({
                        ...editingProperty,
                        client_id: e.target.value || undefined,
                      });
                    }}
                    style={{ width: '100%', padding: spacing[2], border: `1px solid ${colors.border.light}`, borderRadius: borderRadius.md }}
                  >
                    <option value="">Vyberte klienta</option>
                    {clientsForSelect.map(client => (
                      <option key={client.id} value={client.id}>{client.name}</option>
                    ))}
                  </select>
                </div>
                <Input
                  name="size_sqm"
                  label="Velikost (m²)"
                  type="number"
                  defaultValue={(editingProperty as any).size_sqm || ''}
                />
                <Input
                  name="rooms"
                  label="Počet pokojů"
                  type="number"
                  defaultValue={(editingProperty as any).rooms || ''}
                />
                <Input
                  name="bathrooms"
                  label="Počet koupelen"
                  type="number"
                  defaultValue={(editingProperty as any).bathrooms || ''}
                />
                <div>
                  <label style={{ display: 'block', marginBottom: spacing[1], fontSize: typography.fontSize.sm, fontWeight: 500 }}>
                    Úklidové prostředky
                  </label>
                  <textarea
                    name="cleaning_supplies"
                    defaultValue={(editingProperty as any).cleaning_supplies || ''}
                    placeholder="Kde jsou, co má uklízečka použít..."
                    style={{ width: '100%', padding: spacing[2], border: `1px solid ${colors.border.light}`, borderRadius: borderRadius.md, fontFamily: 'inherit' }}
                    rows={2}
                  />
                </div>
                <div>
                  <label style={{ display: 'block', marginBottom: spacing[1], fontSize: typography.fontSize.sm, fontWeight: 500 }}>
                    Domácí mazlíčci
                  </label>
                  <textarea
                    name="pets"
                    defaultValue={(editingProperty as any).pets || ''}
                    placeholder="Jaké zvířata, kde jsou, co je třeba..."
                    style={{ width: '100%', padding: spacing[2], border: `1px solid ${colors.border.light}`, borderRadius: borderRadius.md, fontFamily: 'inherit' }}
                    rows={2}
                  />
                </div>
                <div style={{ gridColumn: '1 / -1' }}>
                  <label style={{ display: 'block', marginBottom: spacing[1], fontSize: typography.fontSize.sm, fontWeight: 500 }}>
                    Pokyny k přístupu
                  </label>
                  <textarea
                    name="access_instructions"
                    defaultValue={(editingProperty as any).access_instructions || ''}
                    placeholder="Kde je klíč, kód na dveře, kamaráda..."
                    style={{ width: '100%', padding: spacing[2], border: `1px solid ${colors.border.light}`, borderRadius: borderRadius.md, fontFamily: 'inherit' }}
                    rows={3}
                  />
                </div>
              </div>
              <Button type="submit">Uložit změny</Button>
            </form>
          )}
        </Modal>
      </ResponsiveLayout>
    </ErrorBoundary>
  );
}
