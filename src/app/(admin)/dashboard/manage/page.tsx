"use client";

import { useState, useEffect } from 'react';

interface User {
  id: string;
  name: string;
  email: string;
  role: string;
  phone?: string;
  whatsapp_number?: string;
  billing_address?: string;
  ico?: string;
  dic?: string;
  notes?: string;
  payment_terms?: string;
  billing_frequency?: string;
  messenger?: string;
  document_number?: string;
  document_type?: string;
  document_valid_until?: string;
  requested_hourly_rate_from?: number;
  languages?: string[];
  availability?: string;
  specializations?: string[];
}

interface Property {
  id: string;
  name: string;
  address: string;
  type: string;
  client_id?: string;
  size_sqm?: number;
  layout?: string;
  bathrooms?: number;
  notes?: string;
  cleaning_instructions?: string;
  access_instructions?: string;
  equipment_on_site?: string;
  preferred_cleaning_times?: string;
  special_requirements?: string;
  cleaning_supplies?: string;
  pets?: string;
}

export default function ManagePage() {
  const [status, setStatus] = useState<string>("");
  const [existingUsers, setExistingUsers] = useState<User[]>([]);
  const [existingProperties, setExistingProperties] = useState<Property[]>([]);
  const [showUsers, setShowUsers] = useState(false);
  const [showProperties, setShowProperties] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [editingProperty, setEditingProperty] = useState<Property | null>(null);
  const [showClientModal, setShowClientModal] = useState(false);
  const [showCleanerModal, setShowCleanerModal] = useState(false);
  const [showPropertyModal, setShowPropertyModal] = useState(false);
  const [userFilter, setUserFilter] = useState('');
  const [propertyFilter, setPropertyFilter] = useState('');
  const [userRoleFilter, setUserRoleFilter] = useState('');

  // Načíst klienty při načtení stránky
  useEffect(() => {
    loadUsers();
  }, []);

  // Zabránit scrollování pozadí když je modal otevřený
  useEffect(() => {
    if (editingUser || editingProperty || showClientModal || showCleanerModal || showPropertyModal) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [editingUser, editingProperty, showClientModal, showCleanerModal, showPropertyModal]);

  async function post(url: string, body: any) {
    setStatus("...");
    const res = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-admin-role': 'admin',
        'x-tenant-id': '550e8400-e29b-41d4-a716-446655440000',
      },
      body: JSON.stringify(body),
    });
    const text = await res.text();
    setStatus(`${res.status} ${text}`);
  }

  async function loadUsers() {
    const res = await fetch('/api/admin/users', {
      headers: {
        'x-admin-role': 'admin',
        'x-tenant-id': '550e8400-e29b-41d4-a716-446655440000',
      },
    });
    const data = await res.json();
    if (data.success) {
      setExistingUsers(data.data);
      setShowUsers(true);
    }
  }

  async function loadProperties() {
    const res = await fetch('/api/admin/properties', {
      headers: {
        'x-admin-role': 'admin',
        'x-tenant-id': '550e8400-e29b-41d4-a716-446655440000',
      },
    });
    const data = await res.json();
    if (data.success) {
      setExistingProperties(data.data);
      setShowProperties(true);
    }
  }

  async function deleteUser(userId: string) {
    if (!confirm('Opravdu chcete smazat tohoto uživatele?')) return;
    
    const res = await fetch(`/api/admin/users/${userId}`, {
      method: 'DELETE',
      headers: {
        'x-admin-role': 'admin',
        'x-tenant-id': '550e8400-e29b-41d4-a716-446655440000',
      },
    });
    const text = await res.text();
    setStatus(`DELETE ${res.status}: ${text}`);
    
    if (res.ok) {
      loadUsers();
    }
  }

  async function deleteProperty(propertyId: string) {
    if (!confirm('Opravdu chcete smazat tuto nemovitost?')) return;
    
    const res = await fetch(`/api/admin/properties/${propertyId}`, {
      method: 'DELETE',
      headers: {
        'x-admin-role': 'admin',
        'x-tenant-id': '550e8400-e29b-41d4-a716-446655440000',
      },
    });
    const text = await res.text();
    setStatus(`DELETE ${res.status}: ${text}`);
    
    if (res.ok) {
      loadProperties();
    }
  }

  async function updateUser(userId: string, userData: any) {
    const res = await fetch(`/api/admin/users/${userId}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'x-admin-role': 'admin',
        'x-tenant-id': '550e8400-e29b-41d4-a716-446655440000',
      },
      body: JSON.stringify(userData),
    });
    const text = await res.text();
    setStatus(`UPDATE ${res.status}: ${text}`);
    
    if (res.ok) {
      loadUsers();
      setEditingUser(null);
    }
  }

  async function updateProperty(propertyId: string, propertyData: any) {
    const res = await fetch(`/api/admin/properties/${propertyId}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'x-admin-role': 'admin',
        'x-tenant-id': '550e8400-e29b-41d4-a716-446655440000',
      },
      body: JSON.stringify(propertyData),
    });
    const text = await res.text();
    setStatus(`UPDATE ${res.status}: ${text}`);
    
    if (res.ok) {
      loadProperties();
      setEditingProperty(null);
    }
  }

  // Filtrované seznamy
  const filteredUsers = existingUsers.filter(user => {
    const matchesText = !userFilter || 
      user.name.toLowerCase().includes(userFilter.toLowerCase()) ||
      user.email.toLowerCase().includes(userFilter.toLowerCase()) ||
      (user.phone && user.phone.includes(userFilter));
    
    const matchesRole = !userRoleFilter || user.role === userRoleFilter;
    
    return matchesText && matchesRole;
  });

  const filteredProperties = existingProperties.filter(property => {
    return !propertyFilter || 
      property.name.toLowerCase().includes(propertyFilter.toLowerCase()) ||
      property.address.toLowerCase().includes(propertyFilter.toLowerCase()) ||
      property.type.toLowerCase().includes(propertyFilter.toLowerCase());
  });

  return (
    <main style={{ padding: 24, display: 'grid', gap: 24 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 16 }}>
        <a href="/dashboard" style={{ padding: '8px 16px', background: '#6c757d', color: 'white', textDecoration: 'none', borderRadius: 4 }}>
          ← Zpět na dashboard
        </a>
        <h1 style={{ margin: 0 }}>Správa: přidání klienta, uklízečky a nemovitosti</h1>
      </div>
      
      <div style={{ display: 'flex', gap: 16, marginBottom: 16, flexWrap: 'wrap' }}>
        <button onClick={() => setShowClientModal(true)} style={{ padding: '12px 24px', background: '#007bff', color: 'white', border: 'none', borderRadius: 4, cursor: 'pointer' }}>
          + Přidat klienta
        </button>
        <button onClick={() => setShowCleanerModal(true)} style={{ padding: '12px 24px', background: '#28a745', color: 'white', border: 'none', borderRadius: 4, cursor: 'pointer' }}>
          + Přidat uklízečku
        </button>
        <button onClick={() => {
          setShowPropertyModal(true);
          // Načíst klienty pokud ještě nejsou načteni
          if (existingUsers.length === 0) {
            loadUsers();
          }
        }} style={{ padding: '12px 24px', background: '#ffc107', color: 'black', border: 'none', borderRadius: 4, cursor: 'pointer' }}>
          + Přidat nemovitost
        </button>
        <button onClick={() => {
          loadUsers();
          setShowProperties(false); // Zavřít nemovitosti
        }} style={{ padding: '8px 16px', background: showUsers ? '#007bff' : '#f0f0f0', color: showUsers ? 'white' : 'black', border: '1px solid #ccc', borderRadius: 4, cursor: 'pointer' }}>
          {showUsers ? 'Skrýt uživatele' : 'Zobrazit uživatele'}
        </button>
        <button onClick={() => {
          loadProperties();
          setShowUsers(false); // Zavřít uživatele
        }} style={{ padding: '8px 16px', background: showProperties ? '#007bff' : '#f0f0f0', color: showProperties ? 'white' : 'black', border: '1px solid #ccc', borderRadius: 4, cursor: 'pointer' }}>
          {showProperties ? 'Skrýt nemovitosti' : 'Zobrazit nemovitosti'}
        </button>
      </div>

      {status && (
        <div style={{
          padding: '12px',
          marginBottom: '16px',
          backgroundColor: status.includes('Chyba') ? '#f8d7da' : '#d4edda',
          color: status.includes('Chyba') ? '#721c24' : '#155724',
          borderRadius: '4px',
          border: `1px solid ${status.includes('Chyba') ? '#f5c6cb' : '#c3e6cb'}`
        }}>
          {status}
        </div>
      )}


      {/* Seznam existujících uživatelů */}
      {showUsers && (
        <section style={{ border: '1px solid #eee', borderRadius: 8, padding: 16 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
            <h3>Existující uživatelé ({filteredUsers.length} z {existingUsers.length})</h3>
            <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
              <input
                type="text"
                placeholder="Hledat uživatele..."
                value={userFilter}
                onChange={(e) => setUserFilter(e.target.value)}
                style={{ padding: '6px 12px', border: '1px solid #ddd', borderRadius: 4, fontSize: 14 }}
              />
              <select
                value={userRoleFilter}
                onChange={(e) => setUserRoleFilter(e.target.value)}
                style={{ padding: '6px 12px', border: '1px solid #ddd', borderRadius: 4, fontSize: 14 }}
              >
                <option value="">Všechny role</option>
                <option value="client">Klienti</option>
                <option value="cleaner">Uklízečky</option>
                <option value="admin">Admini</option>
                <option value="manager">Manažeři</option>
              </select>
            </div>
          </div>
          <div style={{ maxHeight: 400, overflowY: 'auto' }}>
            {filteredUsers.length === 0 ? (
              <div style={{ textAlign: 'center', padding: 20, color: '#666' }}>
                {userFilter || userRoleFilter ? 'Žádní uživatelé neodpovídají filtru' : 'Žádní uživatelé'}
              </div>
            ) : (
              filteredUsers.map(user => (
                <div key={user.id} style={{ padding: 12, borderBottom: '1px solid #eee', fontSize: 14, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div style={{ flex: 1 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                      <strong>{user.name}</strong>
                      <span style={{ 
                        padding: '2px 8px', 
                        borderRadius: 12, 
                        fontSize: 12, 
                        backgroundColor: user.role === 'client' ? '#e3f2fd' : user.role === 'cleaner' ? '#f3e5f5' : user.role === 'admin' ? '#ffebee' : '#e8f5e8',
                        color: user.role === 'client' ? '#1976d2' : user.role === 'cleaner' ? '#7b1fa2' : user.role === 'admin' ? '#d32f2f' : '#388e3c'
                      }}>
                        {user.role}
                      </span>
                    </div>
                    <div style={{ color: '#666', fontSize: 12 }}>
                      {user.email} {user.phone && `• ${user.phone}`}
                    </div>
                  </div>
                  <div style={{ display: 'flex', gap: 8 }}>
                    <button 
                      onClick={() => setEditingUser(user)}
                      style={{ 
                        padding: '6px 12px', 
                        background: '#007bff', 
                        color: 'white', 
                        border: 'none', 
                        borderRadius: 4, 
                        cursor: 'pointer',
                        fontSize: 12
                      }}
                    >
                      Upravit
                    </button>
                    <button 
                      onClick={() => deleteUser(user.id)}
                      style={{ 
                        padding: '6px 12px', 
                        background: '#ff4444', 
                        color: 'white', 
                        border: 'none', 
                        borderRadius: 4, 
                        cursor: 'pointer',
                        fontSize: 12
                      }}
                    >
                      Smazat
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </section>
      )}

      {/* Seznam existujících nemovitostí */}
      {showProperties && (
        <section style={{ border: '1px solid #eee', borderRadius: 8, padding: 16 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
            <h3>Existující nemovitosti ({filteredProperties.length} z {existingProperties.length})</h3>
            <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
              <input
                type="text"
                placeholder="Hledat nemovitosti..."
                value={propertyFilter}
                onChange={(e) => setPropertyFilter(e.target.value)}
                style={{ padding: '6px 12px', border: '1px solid #ddd', borderRadius: 4, fontSize: 14 }}
              />
            </div>
          </div>
          <div style={{ maxHeight: 400, overflowY: 'auto' }}>
            {filteredProperties.length === 0 ? (
              <div style={{ textAlign: 'center', padding: 20, color: '#666' }}>
                {propertyFilter ? 'Žádné nemovitosti neodpovídají filtru' : 'Žádné nemovitosti'}
              </div>
            ) : (
              filteredProperties.map(property => (
                <div key={property.id} style={{ padding: 12, borderBottom: '1px solid #eee', fontSize: 14, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div style={{ flex: 1 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                      <strong>{property.name}</strong>
                      <span style={{ 
                        padding: '2px 8px', 
                        borderRadius: 12, 
                        fontSize: 12, 
                        backgroundColor: property.type === 'apartment' ? '#e3f2fd' : property.type === 'house' ? '#f3e5f5' : property.type === 'office' ? '#fff3e0' : property.type === 'hotel' ? '#e8f5e8' : '#f5f5f5',
                        color: property.type === 'apartment' ? '#1976d2' : property.type === 'house' ? '#7b1fa2' : property.type === 'office' ? '#f57c00' : property.type === 'hotel' ? '#388e3c' : '#666'
                      }}>
                        {property.type}
                      </span>
                    </div>
                    <div style={{ color: '#666', fontSize: 12 }}>
                      {property.address}
                      {property.size_sqm && ` • ${property.size_sqm} m²`}
                      {property.bathrooms && ` • ${property.bathrooms} koupelen`}
                    </div>
                  </div>
                  <div style={{ display: 'flex', gap: 8 }}>
                    <button 
                      onClick={() => {
                        setEditingProperty(property);
                        // Načíst klienty pokud ještě nejsou načteni
                        if (existingUsers.length === 0) {
                          loadUsers();
                        }
                      }}
                      style={{ 
                        padding: '6px 12px', 
                        background: '#007bff', 
                        color: 'white', 
                        border: 'none', 
                        borderRadius: 4, 
                        cursor: 'pointer',
                        fontSize: 12
                      }}
                    >
                      Upravit
                    </button>
                    <button 
                      onClick={() => deleteProperty(property.id)}
                      style={{ 
                        padding: '6px 12px', 
                        background: '#ff4444', 
                        color: 'white', 
                        border: 'none', 
                        borderRadius: 4, 
                        cursor: 'pointer',
                        fontSize: 12
                      }}
                    >
                      Smazat
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </section>
      )}

      {/* Modální okno pro přidání/úpravu klienta */}
      {(showClientModal || editingUser) && (
        <div 
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: 'rgba(0,0,0,0.5)',
            zIndex: 1000,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: 20
          }}
          onClick={(e) => {
            if (e.target === e.currentTarget) {
              setShowClientModal(false);
              setEditingUser(null);
            }
          }}
        >
          <div 
            style={{
              backgroundColor: 'white',
              borderRadius: 8,
              padding: 24,
              maxWidth: '90vw',
              maxHeight: '90vh',
              overflow: 'auto',
              width: '800px'
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
              <h2>{editingUser ? 'Upravit klienta' : 'Přidat klienta'}</h2>
              <button 
                onClick={() => {
                  setShowClientModal(false);
                  setEditingUser(null);
                }}
                style={{ background: 'none', border: 'none', fontSize: 24, cursor: 'pointer' }}
              >
                ×
              </button>
            </div>
            
            <form onSubmit={(e) => {
              e.preventDefault();
              const data = new FormData(e.currentTarget as HTMLFormElement);
              const userData = {
                tenant_id: '550e8400-e29b-41d4-a716-446655440000',
                email: data.get('email') || undefined,
                name: data.get('name') || undefined,
                role: 'client',
                phone: data.get('phone') || undefined,
                whatsapp_number: data.get('whatsapp_number') || undefined,
                properties: [],
                settings: {},
                billing_address: data.get('billing_address') || undefined,
                ico: data.get('ico') || undefined,
                dic: data.get('dic') || undefined,
                notes: data.get('notes') || undefined,
                payment_terms: data.get('payment_terms') || undefined,
                billing_frequency: data.get('billing_frequency') || undefined,
              };
              
              if (editingUser) {
                updateUser(editingUser.id, userData);
              } else {
                post('/api/admin/users', userData);
                setShowClientModal(false);
              }
            }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 16 }}>
                <div>
                  <label>Jméno *</label>
                  <input name="name" required defaultValue={editingUser?.name} style={{ width: '100%', padding: 8, marginTop: 4, border: '1px solid #ddd', borderRadius: 4 }} />
                </div>
                <div>
                  <label>Email *</label>
                  <input name="email" type="email" required defaultValue={editingUser?.email} style={{ width: '100%', padding: 8, marginTop: 4, border: '1px solid #ddd', borderRadius: 4 }} />
                </div>
                <div>
                  <label>Telefon *</label>
                  <input name="phone" required defaultValue={editingUser?.phone} style={{ width: '100%', padding: 8, marginTop: 4, border: '1px solid #ddd', borderRadius: 4 }} />
                </div>
                <div>
                  <label>WhatsApp</label>
                  <input name="whatsapp_number" defaultValue={editingUser?.whatsapp_number} style={{ width: '100%', padding: 8, marginTop: 4, border: '1px solid #ddd', borderRadius: 4 }} />
                </div>
                <div style={{ gridColumn: '1 / -1' }}>
                  <label>Fakturační adresa *</label>
                  <textarea name="billing_address" required defaultValue={editingUser?.billing_address} style={{ width: '100%', padding: 8, marginTop: 4, height: 60, border: '1px solid #ddd', borderRadius: 4 }} />
                </div>
                <div>
                  <label>IČO</label>
                  <input name="ico" defaultValue={editingUser?.ico} style={{ width: '100%', padding: 8, marginTop: 4, border: '1px solid #ddd', borderRadius: 4 }} />
                </div>
                <div>
                  <label>DIČ</label>
                  <input name="dic" defaultValue={editingUser?.dic} style={{ width: '100%', padding: 8, marginTop: 4, border: '1px solid #ddd', borderRadius: 4 }} />
                </div>
                <div>
                  <label>Fakturace</label>
                  <select name="billing_frequency" defaultValue={editingUser?.billing_frequency} style={{ width: '100%', padding: 8, marginTop: 4, border: '1px solid #ddd', borderRadius: 4 }}>
                    <option value="">Vyberte frekvenci</option>
                    <option value="after_cleaning">Po úklidu</option>
                    <option value="monthly">Měsíčně</option>
                    <option value="weekly">Týdně</option>
                    <option value="quarterly">Čtvrtletně</option>
                  </select>
                </div>
                <div>
                  <label>Poznámka</label>
                  <textarea name="notes" defaultValue={editingUser?.notes} style={{ width: '100%', padding: 8, marginTop: 4, height: 60, border: '1px solid #ddd', borderRadius: 4 }} />
                </div>
                <div>
                  <label>Platební podmínky</label>
                  <textarea name="payment_terms" defaultValue={editingUser?.payment_terms} style={{ width: '100%', padding: 8, marginTop: 4, height: 60, border: '1px solid #ddd', borderRadius: 4 }} />
                </div>
              </div>
              <div style={{ display: 'flex', gap: 12, justifyContent: 'flex-end' }}>
                <button 
                  type="button" 
                  onClick={() => {
                    setShowClientModal(false);
                    setEditingUser(null);
                  }}
                  style={{ padding: '8px 16px', background: '#6c757d', color: 'white', border: 'none', borderRadius: 4, cursor: 'pointer' }}
                >
                  Zrušit
                </button>
                <button type="submit" style={{ padding: '8px 16px', background: '#007bff', color: 'white', border: 'none', borderRadius: 4, cursor: 'pointer' }}>
                  {editingUser ? 'Uložit změny' : 'Vytvořit klienta'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modální okno pro přidání/úpravu uklízečky */}
      {(showCleanerModal || (editingUser && editingUser.role === 'cleaner')) && (
        <div 
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: 'rgba(0,0,0,0.5)',
            zIndex: 1000,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: 20
          }}
          onClick={(e) => {
            if (e.target === e.currentTarget) {
              setShowCleanerModal(false);
              setEditingUser(null);
            }
          }}
        >
          <div 
            style={{
              backgroundColor: 'white',
              borderRadius: 8,
              padding: 24,
              maxWidth: '90vw',
              maxHeight: '90vh',
              overflow: 'auto',
              width: '800px'
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
              <h2>{editingUser ? 'Upravit uklízečku' : 'Přidat uklízečku'}</h2>
              <button 
                onClick={() => {
                  setShowCleanerModal(false);
                  setEditingUser(null);
                }}
                style={{ background: 'none', border: 'none', fontSize: 24, cursor: 'pointer' }}
              >
                ×
              </button>
            </div>
            
            <form onSubmit={(e) => {
              e.preventDefault();
              const data = new FormData(e.currentTarget as HTMLFormElement);
              const userData = {
                tenant_id: '550e8400-e29b-41d4-a716-446655440000',
                email: data.get('email') || undefined,
                name: data.get('name') || undefined,
                role: 'cleaner',
                phone: data.get('phone') || undefined,
                whatsapp_number: data.get('whatsapp_number') || undefined,
                properties: [],
                settings: {},
                messenger: data.get('messenger') || undefined,
                document_number: data.get('document_number') || undefined,
                document_type: data.get('document_type') || undefined,
                document_valid_until: data.get('document_valid_until') || undefined,
                requested_hourly_rate_from: data.get('requested_hourly_rate_from') ? parseFloat(data.get('requested_hourly_rate_from') as string) : undefined,
                languages: data.get('languages') ? (data.get('languages') as string).split(',').map(s => s.trim()) : undefined,
                availability: data.get('availability') || undefined,
                specializations: data.get('specializations') ? (data.get('specializations') as string).split(',').map(s => s.trim()) : undefined,
              };
              
              if (editingUser) {
                updateUser(editingUser.id, userData);
              } else {
                post('/api/admin/users', userData);
                setShowCleanerModal(false);
              }
            }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 16 }}>
                <div>
                  <label>Jméno *</label>
                  <input name="name" required defaultValue={editingUser?.name} style={{ width: '100%', padding: 8, marginTop: 4, border: '1px solid #ddd', borderRadius: 4 }} />
                </div>
                <div>
                  <label>Email</label>
                  <input name="email" type="email" defaultValue={editingUser?.email} style={{ width: '100%', padding: 8, marginTop: 4, border: '1px solid #ddd', borderRadius: 4 }} />
                </div>
                <div>
                  <label>Telefon *</label>
                  <input name="phone" required defaultValue={editingUser?.phone} style={{ width: '100%', padding: 8, marginTop: 4, border: '1px solid #ddd', borderRadius: 4 }} />
                </div>
                <div>
                  <label>Messenger</label>
                  <input name="messenger" defaultValue={editingUser?.messenger} style={{ width: '100%', padding: 8, marginTop: 4, border: '1px solid #ddd', borderRadius: 4 }} />
                </div>
                <div>
                  <label>Číslo dokladu</label>
                  <input name="document_number" defaultValue={editingUser?.document_number} style={{ width: '100%', padding: 8, marginTop: 4, border: '1px solid #ddd', borderRadius: 4 }} />
                </div>
                <div>
                  <label>Typ dokladu</label>
                  <select name="document_type" defaultValue={editingUser?.document_type} style={{ width: '100%', padding: 8, marginTop: 4, border: '1px solid #ddd', borderRadius: 4 }}>
                    <option value="">Vyberte typ</option>
                    <option value="passport">Pas</option>
                    <option value="id_card">Občanský průkaz</option>
                    <option value="driving_license">Řidičský průkaz</option>
                    <option value="other">Jiné</option>
                  </select>
                </div>
                <div>
                  <label>Platný do</label>
                  <input name="document_valid_until" type="date" defaultValue={editingUser?.document_valid_until} style={{ width: '100%', padding: 8, marginTop: 4, border: '1px solid #ddd', borderRadius: 4 }} />
                </div>
                <div>
                  <label>Požadovaná hodinová sazba od (Kč)</label>
                  <input name="requested_hourly_rate_from" type="number" step="0.01" defaultValue={editingUser?.requested_hourly_rate_from} style={{ width: '100%', padding: 8, marginTop: 4, border: '1px solid #ddd', borderRadius: 4 }} />
                </div>
                <div>
                  <label>Jazyky (oddělené čárkou)</label>
                  <input name="languages" placeholder="čeština, angličtina" defaultValue={editingUser?.languages?.join(', ')} style={{ width: '100%', padding: 8, marginTop: 4, border: '1px solid #ddd', borderRadius: 4 }} />
                </div>
                <div>
                  <label>Dostupnost</label>
                  <input name="availability" placeholder="Po-Pá 8-16" defaultValue={editingUser?.availability} style={{ width: '100%', padding: 8, marginTop: 4, border: '1px solid #ddd', borderRadius: 4 }} />
                </div>
                <div>
                  <label>Specializace (oddělené čárkou)</label>
                  <input name="specializations" placeholder="kanceláře, hotely" defaultValue={editingUser?.specializations?.join(', ')} style={{ width: '100%', padding: 8, marginTop: 4, border: '1px solid #ddd', borderRadius: 4 }} />
                </div>
                <div>
                  <label>Poznámka</label>
                  <textarea name="notes" defaultValue={editingUser?.notes} style={{ width: '100%', padding: 8, marginTop: 4, height: 60, border: '1px solid #ddd', borderRadius: 4 }} />
                </div>
              </div>
              <div style={{ display: 'flex', gap: 12, justifyContent: 'flex-end' }}>
                <button 
                  type="button" 
                  onClick={() => {
                    setShowCleanerModal(false);
                    setEditingUser(null);
                  }}
                  style={{ padding: '8px 16px', background: '#6c757d', color: 'white', border: 'none', borderRadius: 4, cursor: 'pointer' }}
                >
                  Zrušit
                </button>
                <button type="submit" style={{ padding: '8px 16px', background: '#28a745', color: 'white', border: 'none', borderRadius: 4, cursor: 'pointer' }}>
                  {editingUser ? 'Uložit změny' : 'Vytvořit uklízečku'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modální okno pro přidání/úpravu nemovitosti */}
      {(showPropertyModal || editingProperty) && (
        <div 
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: 'rgba(0,0,0,0.5)',
            zIndex: 1000,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: 20
          }}
          onClick={(e) => {
            if (e.target === e.currentTarget) {
              setShowPropertyModal(false);
              setEditingProperty(null);
            }
          }}
        >
          <div 
            style={{
              backgroundColor: 'white',
              borderRadius: 8,
              padding: 24,
              maxWidth: '90vw',
              maxHeight: '90vh',
              overflow: 'auto',
              width: '800px'
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
              <h2>{editingProperty ? 'Upravit nemovitost' : 'Přidat nemovitost'}</h2>
              <button 
                onClick={() => {
                  setShowPropertyModal(false);
                  setEditingProperty(null);
                }}
                style={{ background: 'none', border: 'none', fontSize: 24, cursor: 'pointer' }}
              >
                ×
              </button>
            </div>
            
            <form onSubmit={(e) => {
              e.preventDefault();
              const data = new FormData(e.currentTarget as HTMLFormElement);
              const propertyData = {
                tenant_id: '550e8400-e29b-41d4-a716-446655440000',
                name: data.get('name') || undefined,
                address: data.get('address') || undefined,
                type: data.get('type') || undefined,
                client_id: data.get('client_id') || undefined,
                size_sqm: data.get('size_sqm') ? parseInt(data.get('size_sqm') as string) : undefined,
                layout: data.get('layout') || undefined,
                bathrooms: data.get('bathrooms') ? parseInt(data.get('bathrooms') as string) : undefined,
                notes: data.get('notes') || undefined,
                cleaning_instructions: data.get('cleaning_instructions') || undefined,
                access_instructions: data.get('access_instructions') || undefined,
                equipment_on_site: data.get('equipment_on_site') || undefined,
                preferred_cleaning_times: data.get('preferred_cleaning_times') || undefined,
                special_requirements: data.get('special_requirements') || undefined,
                cleaning_supplies: data.get('cleaning_supplies') || undefined,
                pets: data.get('pets') || undefined,
              };
              
              if (editingProperty) {
                updateProperty(editingProperty.id, propertyData);
              } else {
                post('/api/admin/properties', propertyData);
                setShowPropertyModal(false);
              }
            }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 16 }}>
                <div>
                  <label>Název *</label>
                  <input name="name" required defaultValue={editingProperty?.name} style={{ width: '100%', padding: 8, marginTop: 4, border: '1px solid #ddd', borderRadius: 4 }} />
                </div>
                <div>
                  <label>Adresa *</label>
                  <input name="address" required defaultValue={editingProperty?.address} style={{ width: '100%', padding: 8, marginTop: 4, border: '1px solid #ddd', borderRadius: 4 }} />
                </div>
                <div>
                  <label>Typ *</label>
                  <select name="type" required defaultValue={editingProperty?.type} style={{ width: '100%', padding: 8, marginTop: 4, border: '1px solid #ddd', borderRadius: 4 }}>
                    <option value="">Vyberte typ</option>
                    <option value="apartment">Byt</option>
                    <option value="house">Dům</option>
                    <option value="office">Kancelář</option>
                    <option value="hotel">Hotel</option>
                    <option value="other">Jiné</option>
                  </select>
                </div>
                <div>
                  <label>Klient *</label>
                  <select name="client_id" required defaultValue={editingProperty?.client_id} style={{ width: '100%', padding: 8, marginTop: 4, border: '1px solid #ddd', borderRadius: 4 }}>
                    <option value="">Vyberte klienta</option>
                    {existingUsers.filter(u => u.role === 'client').map(client => (
                      <option key={client.id} value={client.id}>
                        {client.name} ({client.email})
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label>Rozloha (m²)</label>
                  <input name="size_sqm" type="number" defaultValue={editingProperty?.size_sqm} style={{ width: '100%', padding: 8, marginTop: 4, border: '1px solid #ddd', borderRadius: 4 }} />
                </div>
                <div>
                  <label>Dispozice</label>
                  <input name="layout" placeholder="2+1, 3+kk" defaultValue={editingProperty?.layout} style={{ width: '100%', padding: 8, marginTop: 4, border: '1px solid #ddd', borderRadius: 4 }} />
                </div>
                <div>
                  <label>Počet koupelen</label>
                  <input name="bathrooms" type="number" min="0" defaultValue={editingProperty?.bathrooms} style={{ width: '100%', padding: 8, marginTop: 4, border: '1px solid #ddd', borderRadius: 4 }} />
                </div>
                <div>
                  <label>Poznámka</label>
                  <textarea name="notes" defaultValue={editingProperty?.notes} style={{ width: '100%', padding: 8, marginTop: 4, height: 60, border: '1px solid #ddd', borderRadius: 4 }} />
                </div>
                <div style={{ gridColumn: '1 / -1' }}>
                  <label>Pokyny k úklidu</label>
                  <textarea name="cleaning_instructions" defaultValue={editingProperty?.cleaning_instructions} style={{ width: '100%', padding: 8, marginTop: 4, height: 80, border: '1px solid #ddd', borderRadius: 4 }} />
                </div>
                <div style={{ gridColumn: '1 / -1' }}>
                  <label>Přístup</label>
                  <textarea name="access_instructions" defaultValue={editingProperty?.access_instructions} style={{ width: '100%', padding: 8, marginTop: 4, height: 80, border: '1px solid #ddd', borderRadius: 4 }} />
                </div>
                <div style={{ gridColumn: '1 / -1' }}>
                  <label>Vybavení co je na místě</label>
                  <textarea name="equipment_on_site" defaultValue={editingProperty?.equipment_on_site} style={{ width: '100%', padding: 8, marginTop: 4, height: 80, border: '1px solid #ddd', borderRadius: 4 }} />
                </div>
                <div style={{ gridColumn: '1 / -1' }}>
                  <label>Požadované časy úklidu</label>
                  <textarea name="preferred_cleaning_times" defaultValue={editingProperty?.preferred_cleaning_times} style={{ width: '100%', padding: 8, marginTop: 4, height: 80, border: '1px solid #ddd', borderRadius: 4 }} />
                </div>
                <div>
                  <label>Úklidové prostředky</label>
                  <select name="cleaning_supplies" defaultValue={editingProperty?.cleaning_supplies} style={{ width: '100%', padding: 8, marginTop: 4, border: '1px solid #ddd', borderRadius: 4 }}>
                    <option value="">Vyberte možnost</option>
                    <option value="client">Klient</option>
                    <option value="ours">Naše</option>
                    <option value="partial">Částečně</option>
                  </select>
                </div>
                <div>
                  <label>Domácí mazlíčci</label>
                  <input name="pets" placeholder="pes, kočka, atd." defaultValue={editingProperty?.pets} style={{ width: '100%', padding: 8, marginTop: 4, border: '1px solid #ddd', borderRadius: 4 }} />
                </div>
                <div style={{ gridColumn: '1 / -1' }}>
                  <label>Speciální požadavky</label>
                  <textarea name="special_requirements" defaultValue={editingProperty?.special_requirements} style={{ width: '100%', padding: 8, marginTop: 4, height: 80, border: '1px solid #ddd', borderRadius: 4 }} />
                </div>
              </div>
              <div style={{ display: 'flex', gap: 12, justifyContent: 'flex-end' }}>
                <button 
                  type="button" 
                  onClick={() => {
                    setShowPropertyModal(false);
                    setEditingProperty(null);
                  }}
                  style={{ padding: '8px 16px', background: '#6c757d', color: 'white', border: 'none', borderRadius: 4, cursor: 'pointer' }}
                >
                  Zrušit
                </button>
                <button type="submit" style={{ padding: '8px 16px', background: '#ffc107', color: 'black', border: 'none', borderRadius: 4, cursor: 'pointer' }}>
                  {editingProperty ? 'Uložit změny' : 'Vytvořit nemovitost'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </main>
  );
}