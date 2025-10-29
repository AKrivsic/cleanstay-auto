"use client";

import { useState, useEffect } from 'react';

interface Property {
  id: string;
  name: string;
  address: string;
  type: string;
}

interface User {
  id: string;
  name: string;
  email: string;
  role: string;
}

interface Cleaning {
  id: string;
  property_id: string;
  cleaner_id?: string;
  client_id?: string;
  status: string;
  scheduled_date: string;
  notes?: string;
  metadata?: any;
  properties: Property;
  users_cleaner?: User;
  users_client?: User;
}

export default function SchedulePage() {
  const [properties, setProperties] = useState<Property[]>([]);
  const [cleaners, setCleaners] = useState<User[]>([]);
  const [clients, setClients] = useState<User[]>([]);
  const [cleanings, setCleanings] = useState<Cleaning[]>([]);
  const [status, setStatus] = useState<string>("");
  const [showForm, setShowForm] = useState(false);

  // Form state
  const [formData, setFormData] = useState({
    property_id: '',
    cleaner_id: '',
    client_id: '',
    scheduled_date: '',
    estimated_duration_hours: 2,
    notes: '',
    special_instructions: '',
    priority: 'medium' as 'low' | 'medium' | 'high'
  });

  useEffect(() => {
    loadData();
  }, []);

  async function loadData() {
    try {
      const [propertiesRes, usersRes, cleaningsRes] = await Promise.all([
        fetch('/api/admin/properties', {
          headers: {
            'x-admin-role': 'admin',
            'x-tenant-id': '550e8400-e29b-41d4-a716-446655440000',
          },
        }),
        fetch('/api/admin/users', {
          headers: {
            'x-admin-role': 'admin',
            'x-tenant-id': '550e8400-e29b-41d4-a716-446655440000',
          },
        }),
        fetch('/api/admin/cleanings', {
          headers: {
            'x-admin-role': 'admin',
            'x-tenant-id': '550e8400-e29b-41d4-a716-446655440000',
          },
        })
      ]);

      const [propertiesData, usersData, cleaningsData] = await Promise.all([
        propertiesRes.json(),
        usersRes.json(),
        cleaningsRes.json()
      ]);

      if (propertiesData.success) setProperties(propertiesData.data);
      if (usersData.success) {
        const users = usersData.data;
        setCleaners(users.filter((u: User) => u.role === 'cleaner'));
        setClients(users.filter((u: User) => u.role === 'client'));
      }
      if (cleaningsData.success) setCleanings(cleaningsData.data);
    } catch (error) {
      console.error('Error loading data:', error);
      setStatus('Chyba při načítání dat');
    }
  }

  async function createCleaning() {
    if (!formData.property_id || !formData.scheduled_date) {
      setStatus('Vyplňte povinná pole');
      return;
    }

    try {
      const res = await fetch('/api/admin/cleanings', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-admin-role': 'admin',
          'x-tenant-id': '550e8400-e29b-41d4-a716-446655440000',
        },
        body: JSON.stringify(formData),
      });

      const data = await res.json();
      
      if (data.success) {
        setStatus('Úklid naplánován úspěšně!');
        setFormData({
          property_id: '',
          cleaner_id: '',
          client_id: '',
          scheduled_date: '',
          estimated_duration_hours: 2,
          notes: '',
          special_instructions: '',
          priority: 'medium'
        });
        setShowForm(false);
        loadData(); // Refresh data
      } else {
        setStatus(`Chyba: ${data.error}`);
      }
    } catch (error) {
      console.error('Error creating cleaning:', error);
      setStatus('Chyba při vytváření úklidu');
    }
  }

  function formatDate(dateString: string) {
    return new Date(dateString).toLocaleString('cs-CZ');
  }

  function getStatusBadge(status: string) {
    const colors = {
      scheduled: '#007bff',
      in_progress: '#ffc107',
      completed: '#28a745',
      cancelled: '#dc3545'
    };
    return (
      <span style={{
        padding: '4px 8px',
        borderRadius: '4px',
        color: 'white',
        backgroundColor: colors[status as keyof typeof colors] || '#6c757d',
        fontSize: '12px'
      }}>
        {status}
      </span>
    );
  }

  return (
    <main style={{ padding: 24 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
        <h1>Plánování úklidů</h1>
        <button
          onClick={() => setShowForm(!showForm)}
          style={{
            padding: '12px 24px',
            backgroundColor: '#007bff',
            color: 'white',
            border: 'none',
            borderRadius: '8px',
            cursor: 'pointer',
            fontSize: '16px'
          }}
        >
          {showForm ? 'Zrušit' : 'Naplánovat úklid'}
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

      {showForm && (
        <div style={{
          border: '2px solid #007bff',
          borderRadius: '8px',
          padding: '24px',
          marginBottom: '24px',
          backgroundColor: '#f8f9fa'
        }}>
          <h2>Nový úklid</h2>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '16px' }}>
            <div>
              <label>Nemovitost *</label>
              <select
                value={formData.property_id}
                onChange={(e) => setFormData({...formData, property_id: e.target.value})}
                required
                style={{ width: '100%', padding: '8px', marginTop: '4px', border: '1px solid #ddd', borderRadius: '4px' }}
              >
                <option value="">Vyberte nemovitost</option>
                {properties.map(property => (
                  <option key={property.id} value={property.id}>
                    {property.name} - {property.address}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label>Uklízečka</label>
              <select
                value={formData.cleaner_id}
                onChange={(e) => setFormData({...formData, cleaner_id: e.target.value})}
                style={{ width: '100%', padding: '8px', marginTop: '4px', border: '1px solid #ddd', borderRadius: '4px' }}
              >
                <option value="">Vyberte uklízečku</option>
                {cleaners.map(cleaner => (
                  <option key={cleaner.id} value={cleaner.id}>
                    {cleaner.name}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label>Klient</label>
              <select
                value={formData.client_id}
                onChange={(e) => setFormData({...formData, client_id: e.target.value})}
                style={{ width: '100%', padding: '8px', marginTop: '4px', border: '1px solid #ddd', borderRadius: '4px' }}
              >
                <option value="">Vyberte klienta</option>
                {clients.map(client => (
                  <option key={client.id} value={client.id}>
                    {client.name}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label>Datum a čas *</label>
              <input
                type="datetime-local"
                value={formData.scheduled_date}
                onChange={(e) => setFormData({...formData, scheduled_date: e.target.value})}
                required
                style={{ width: '100%', padding: '8px', marginTop: '4px', border: '1px solid #ddd', borderRadius: '4px' }}
              />
            </div>
            <div>
              <label>Odhadovaná doba (hodiny)</label>
              <input
                type="number"
                min="0.5"
                max="8"
                step="0.5"
                value={formData.estimated_duration_hours}
                onChange={(e) => setFormData({...formData, estimated_duration_hours: parseFloat(e.target.value)})}
                style={{ width: '100%', padding: '8px', marginTop: '4px', border: '1px solid #ddd', borderRadius: '4px' }}
              />
            </div>
            <div>
              <label>Priorita</label>
              <select
                value={formData.priority}
                onChange={(e) => setFormData({...formData, priority: e.target.value as 'low' | 'medium' | 'high'})}
                style={{ width: '100%', padding: '8px', marginTop: '4px', border: '1px solid #ddd', borderRadius: '4px' }}
              >
                <option value="low">Nízká</option>
                <option value="medium">Střední</option>
                <option value="high">Vysoká</option>
              </select>
            </div>
            <div style={{ gridColumn: '1 / -1' }}>
              <label>Poznámky</label>
              <textarea
                value={formData.notes}
                onChange={(e) => setFormData({...formData, notes: e.target.value})}
                style={{ width: '100%', padding: '8px', marginTop: '4px', border: '1px solid #ddd', borderRadius: '4px', height: '60px' }}
                placeholder="Obecné poznámky k úklidu..."
              />
            </div>
            <div style={{ gridColumn: '1 / -1' }}>
              <label>Speciální instrukce</label>
              <textarea
                value={formData.special_instructions}
                onChange={(e) => setFormData({...formData, special_instructions: e.target.value})}
                style={{ width: '100%', padding: '8px', marginTop: '4px', border: '1px solid #ddd', borderRadius: '4px', height: '60px' }}
                placeholder="Speciální požadavky, instrukce pro uklízečku..."
              />
            </div>
          </div>
          <div style={{ display: 'flex', gap: '8px' }}>
            <button
              onClick={createCleaning}
              style={{
                padding: '12px 24px',
                backgroundColor: '#28a745',
                color: 'white',
                border: 'none',
                borderRadius: '4px',
                cursor: 'pointer'
              }}
            >
              Naplánovat úklid
            </button>
            <button
              onClick={() => setShowForm(false)}
              style={{
                padding: '12px 24px',
                backgroundColor: '#6c757d',
                color: 'white',
                border: 'none',
                borderRadius: '4px',
                cursor: 'pointer'
              }}
            >
              Zrušit
            </button>
          </div>
        </div>
      )}

      <div style={{ border: '1px solid #eee', borderRadius: '8px', padding: '16px' }}>
        <h2>Naplánované úklidy ({cleanings.length})</h2>
        <div style={{ maxHeight: '400px', overflowY: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ backgroundColor: '#f8f9fa' }}>
                <th style={{ padding: '12px', textAlign: 'left', borderBottom: '1px solid #dee2e6' }}>Nemovitost</th>
                <th style={{ padding: '12px', textAlign: 'left', borderBottom: '1px solid #dee2e6' }}>Uklízečka</th>
                <th style={{ padding: '12px', textAlign: 'left', borderBottom: '1px solid #dee2e6' }}>Klient</th>
                <th style={{ padding: '12px', textAlign: 'left', borderBottom: '1px solid #dee2e6' }}>Datum</th>
                <th style={{ padding: '12px', textAlign: 'left', borderBottom: '1px solid #dee2e6' }}>Stav</th>
                <th style={{ padding: '12px', textAlign: 'left', borderBottom: '1px solid #dee2e6' }}>Poznámky</th>
              </tr>
            </thead>
            <tbody>
              {cleanings.map(cleaning => (
                <tr key={cleaning.id} style={{ borderBottom: '1px solid #dee2e6' }}>
                  <td style={{ padding: '12px' }}>
                    <div>
                      <strong>{cleaning.properties.name}</strong>
                      <br />
                      <small style={{ color: '#6c757d' }}>{cleaning.properties.address}</small>
                    </div>
                  </td>
                  <td style={{ padding: '12px' }}>
                    {cleaning.users_cleaner?.name || '-'}
                  </td>
                  <td style={{ padding: '12px' }}>
                    {cleaning.users_client?.name || '-'}
                  </td>
                  <td style={{ padding: '12px' }}>
                    {formatDate(cleaning.scheduled_date)}
                  </td>
                  <td style={{ padding: '12px' }}>
                    {getStatusBadge(cleaning.status)}
                  </td>
                  <td style={{ padding: '12px' }}>
                    {cleaning.notes || '-'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </main>
  );
}
