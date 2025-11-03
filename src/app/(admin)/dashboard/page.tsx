import { Suspense } from 'react';
import { getTodayOverview, getPropertyList, TodayOverview, PropertyList } from './_data';
import { getSupabaseServerClient } from '@/lib/supabase/server';
import { RealtimeFeed } from './_realtime';
import { getSignedPhotoUrls } from '@/lib/media/getSignedPhotoUrls';

// Force dynamic rendering for authenticated pages
export const dynamic = 'force-dynamic';
export const revalidate = 0;
export const fetchCache = 'force-no-store';
export const runtime = 'nodejs';

// Admin dashboard overview page
export default async function AdminDashboard() {
  // Get tenant ID from auth (this would be from JWT in real implementation)
  const tenantId = '550e8400-e29b-41d4-a716-446655440000'; // Default tenant for local development
  
  let overview: TodayOverview;
  let properties: PropertyList[];
  let users: any[] = [];
  
  try {
    const supabase = getSupabaseServerClient();
    
    [overview, properties] = await Promise.all([
      getTodayOverview(tenantId),
      getPropertyList(tenantId, { page: 1, pageSize: 10 })
    ]);
    
    // Load users
    const { data: usersData, error: usersError } = await supabase
      .from('users')
      .select('id, name, email, role, phone')
      .eq('tenant_id', tenantId)
      .order('name', { ascending: true });
    
    if (usersError) {
      console.error('Error loading users:', usersError);
    } else {
      users = usersData || [];
    }
  } catch (error) {
    console.error('Error loading dashboard data:', error);
    // Return fallback data to prevent build crashes
    overview = {
      cleanings: [],
      recentPhotos: []
    };
    properties = [];
    users = [];
  }

  return (
    <div style={{ 
      minHeight: '100vh', 
      background: '#f8fafc', 
      fontFamily: 'system-ui, -apple-system, sans-serif' 
    }}>
      {/* Header */}
      <div style={{
        background: 'white',
        borderBottom: '1px solid #e2e8f0',
        padding: '20px 24px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        flexWrap: 'wrap',
        gap: '16px'
      }}>
        <div>
          <h1 style={{ 
            margin: 0, 
            fontSize: '28px', 
            fontWeight: '700', 
            color: '#1a202c' 
          }}>
            CleanStay Dashboard
          </h1>
          <p style={{ 
            margin: '4px 0 0 0', 
            color: '#64748b', 
            fontSize: '14px' 
          }}>
            Přehled vašich úklidových služeb
          </p>
        </div>
        
        <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
          <a 
            href="/dashboard/schedule" 
            style={{
              padding: '10px 20px',
              background: '#3b82f6',
              color: 'white',
              textDecoration: 'none',
              borderRadius: '8px',
              fontWeight: '500',
              fontSize: '14px',
              transition: 'background-color 0.2s'
            }}
          >
            📅 Naplánovat úklid
          </a>
          <a 
            href="/dashboard/manage" 
            style={{
              padding: '10px 20px',
              background: '#10b981',
              color: 'white',
              textDecoration: 'none',
              borderRadius: '8px',
              fontWeight: '500',
              fontSize: '14px',
              transition: 'background-color 0.2s'
            }}
          >
            👥 Správa uživatelů
          </a>
        </div>
      </div>

      <div style={{ padding: '24px', maxWidth: '1400px', margin: '0 auto' }}>
        {/* Statistiky */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
          gap: '20px',
          marginBottom: '32px'
        }}>
          <div style={{
            background: 'white',
            padding: '24px',
            borderRadius: '12px',
            border: '1px solid #e2e8f0',
            boxShadow: '0 1px 3px rgba(0,0,0,0.1)'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', marginBottom: '12px' }}>
              <div style={{
                width: '40px',
                height: '40px',
                background: '#dbeafe',
                borderRadius: '8px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                marginRight: '12px'
              }}>
                🏠
              </div>
              <div>
                <h3 style={{ margin: 0, fontSize: '14px', color: '#64748b', fontWeight: '500' }}>
                  Celkem nemovitostí
                </h3>
                <p style={{ margin: 0, fontSize: '24px', fontWeight: '700', color: '#1a202c' }}>
                  {properties.length}
                </p>
              </div>
            </div>
          </div>

          <div style={{
            background: 'white',
            padding: '24px',
            borderRadius: '12px',
            border: '1px solid #e2e8f0',
            boxShadow: '0 1px 3px rgba(0,0,0,0.1)'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', marginBottom: '12px' }}>
              <div style={{
                width: '40px',
                height: '40px',
                background: '#dcfce7',
                borderRadius: '8px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                marginRight: '12px'
              }}>
                👥
              </div>
              <div>
                <h3 style={{ margin: 0, fontSize: '14px', color: '#64748b', fontWeight: '500' }}>
                  Celkem uživatelů
                </h3>
                <p style={{ margin: 0, fontSize: '24px', fontWeight: '700', color: '#1a202c' }}>
                  {users.length}
                </p>
              </div>
            </div>
          </div>

          <div style={{
            background: 'white',
            padding: '24px',
            borderRadius: '12px',
            border: '1px solid #e2e8f0',
            boxShadow: '0 1px 3px rgba(0,0,0,0.1)'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', marginBottom: '12px' }}>
              <div style={{
                width: '40px',
                height: '40px',
                background: '#fef3c7',
                borderRadius: '8px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                marginRight: '12px'
              }}>
                🧹
              </div>
              <div>
                <h3 style={{ margin: 0, fontSize: '14px', color: '#64748b', fontWeight: '500' }}>
                  Dnešní úklidy
                </h3>
                <p style={{ margin: 0, fontSize: '24px', fontWeight: '700', color: '#1a202c' }}>
                  {overview.cleanings.length}
                </p>
              </div>
            </div>
          </div>

          <div style={{
            background: 'white',
            padding: '24px',
            borderRadius: '12px',
            border: '1px solid #e2e8f0',
            boxShadow: '0 1px 3px rgba(0,0,0,0.1)'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', marginBottom: '12px' }}>
              <div style={{
                width: '40px',
                height: '40px',
                background: '#fce7f3',
                borderRadius: '8px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                marginRight: '12px'
              }}>
                ✅
              </div>
              <div>
                <h3 style={{ margin: 0, fontSize: '14px', color: '#64748b', fontWeight: '500' }}>
                  Dokončené
                </h3>
                <p style={{ margin: 0, fontSize: '24px', fontWeight: '700', color: '#1a202c' }}>
                  {overview.cleanings.filter(c => c.status === 'completed').length}
                </p>
              </div>
            </div>
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px' }}>
          {/* Nemovitosti */}
          <div style={{
            background: 'white',
            borderRadius: '12px',
            border: '1px solid #e2e8f0',
            boxShadow: '0 1px 3px rgba(0,0,0,0.1)'
          }}>
            <div style={{ 
              padding: '20px 24px', 
              borderBottom: '1px solid #e2e8f0',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center'
            }}>
              <h2 style={{ margin: 0, fontSize: '18px', fontWeight: '600', color: '#1a202c' }}>
                Nemovitosti ({properties.length})
              </h2>
              <a 
                href="/dashboard/manage" 
                style={{
                  padding: '6px 12px',
                  background: '#f1f5f9',
                  color: '#475569',
                  textDecoration: 'none',
                  borderRadius: '6px',
                  fontSize: '12px',
                  fontWeight: '500'
                }}
              >
                Zobrazit všechny
              </a>
            </div>
            <div style={{ maxHeight: '400px', overflowY: 'auto' }}>
              {properties.slice(0, 5).map(property => (
                <div key={property.id} style={{
                  padding: '16px 24px',
                  borderBottom: '1px solid #f1f5f9',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center'
                }}>
                  <div style={{ flex: 1 }}>
                    <h3 style={{ 
                      margin: '0 0 4px 0', 
                      fontSize: '14px', 
                      fontWeight: '600', 
                      color: '#1a202c' 
                    }}>
                      {property.name}
                    </h3>
                    <p style={{ 
                      margin: '0 0 8px 0', 
                      fontSize: '12px', 
                      color: '#64748b' 
                    }}>
                      {typeof property.address === 'string' ? property.address : 
                       property.address ? `${property.address.street}, ${property.address.city} ${property.address.zip}` : 
                       'Adresa není k dispozici'}
                    </p>
                    <span style={{
                      padding: '2px 8px',
                      borderRadius: '12px',
                      fontSize: '11px',
                      fontWeight: '500',
                      background: property.type === 'apartment' ? '#dbeafe' : 
                                 property.type === 'house' ? '#f3e8ff' : 
                                 property.type === 'office' ? '#fef3c7' : '#f0fdf4',
                      color: property.type === 'apartment' ? '#1e40af' : 
                             property.type === 'house' ? '#7c3aed' : 
                             property.type === 'office' ? '#d97706' : '#166534'
                    }}>
                      {property.type}
                    </span>
                  </div>
                </div>
              ))}
              {properties.length === 0 && (
                <div style={{ 
                  padding: '40px 24px', 
                  textAlign: 'center', 
                  color: '#64748b' 
                }}>
                  Žádné nemovitosti
                </div>
              )}
            </div>
          </div>

          {/* Uživatelé */}
          <div style={{
            background: 'white',
            borderRadius: '12px',
            border: '1px solid #e2e8f0',
            boxShadow: '0 1px 3px rgba(0,0,0,0.1)'
          }}>
            <div style={{ 
              padding: '20px 24px', 
              borderBottom: '1px solid #e2e8f0',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center'
            }}>
              <h2 style={{ margin: 0, fontSize: '18px', fontWeight: '600', color: '#1a202c' }}>
                Uživatelé ({users.length})
              </h2>
              <a 
                href="/dashboard/manage" 
                style={{
                  padding: '6px 12px',
                  background: '#f1f5f9',
                  color: '#475569',
                  textDecoration: 'none',
                  borderRadius: '6px',
                  fontSize: '12px',
                  fontWeight: '500'
                }}
              >
                Zobrazit všechny
              </a>
            </div>
            <div style={{ maxHeight: '400px', overflowY: 'auto' }}>
              {users.slice(0, 5).map(user => (
                <div key={user.id} style={{
                  padding: '16px 24px',
                  borderBottom: '1px solid #f1f5f9',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center'
                }}>
                  <div style={{ flex: 1 }}>
                    <h3 style={{ 
                      margin: '0 0 4px 0', 
                      fontSize: '14px', 
                      fontWeight: '600', 
                      color: '#1a202c' 
                    }}>
                      {user.name}
                    </h3>
                    <p style={{ 
                      margin: '0 0 8px 0', 
                      fontSize: '12px', 
                      color: '#64748b' 
                    }}>
                      {user.email}
                    </p>
                    <span style={{
                      padding: '2px 8px',
                      borderRadius: '12px',
                      fontSize: '11px',
                      fontWeight: '500',
                      background: user.role === 'admin' ? '#fef2f2' : 
                                 user.role === 'cleaner' ? '#fef3c7' : 
                                 user.role === 'client' ? '#dbeafe' : '#f0fdf4',
                      color: user.role === 'admin' ? '#dc2626' : 
                             user.role === 'cleaner' ? '#d97706' : 
                             user.role === 'client' ? '#2563eb' : '#166534'
                    }}>
                      {user.role}
                    </span>
                  </div>
                </div>
              ))}
              {users.length === 0 && (
                <div style={{ 
                  padding: '40px 24px', 
                  textAlign: 'center', 
                  color: '#64748b' 
                }}>
                  Žádní uživatelé
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Živý feed */}
        <div style={{ marginTop: '24px' }}>
          <div style={{
            background: 'white',
            borderRadius: '12px',
            border: '1px solid #e2e8f0',
            boxShadow: '0 1px 3px rgba(0,0,0,0.1)'
          }}>
            <div style={{ 
              padding: '20px 24px', 
              borderBottom: '1px solid #e2e8f0'
            }}>
              <h2 style={{ margin: 0, fontSize: '18px', fontWeight: '600', color: '#1a202c' }}>
                Živý feed
              </h2>
            </div>
            <div style={{ padding: '24px' }}>
              <Suspense fallback={
                <div style={{ 
                  textAlign: 'center', 
                  padding: '40px', 
                  color: '#64748b' 
                }}>
                  Načítání...
                </div>
              }>
                <RealtimeFeed tenantId={tenantId} />
              </Suspense>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// Metadata for admin pages
export const metadata = {
  title: 'Admin Dashboard - CleanStay',
  robots: 'noindex, nofollow'
};