'use client';

import { useEffect, useState } from 'react';
import { createSupabaseClient } from '@/lib/supabase/client';

interface RealtimeEvent {
  id: string;
  type: string;
  start: string;
  note: string | null;
  property_name: string;
  cleaner_name: string | null;
  phase?: string;
}

interface RealtimeFeedProps {
  tenantId: string;
}

// Realtime feed component for admin dashboard
export function RealtimeFeed({ tenantId }: RealtimeFeedProps) {
  const [events, setEvents] = useState<RealtimeEvent[]>([]);
  const [isConnected, setIsConnected] = useState(false);

  useEffect(() => {
    const supabase = createSupabaseClient();

    // Subscribe to events changes
    const subscription = supabase
      .channel('admin-events')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'events',
          filter: `tenant_id=eq.${tenantId}`
        },
        (payload: {
          new: {
            id: string;
            type: string;
            start: string;
            note: string | null;
            tenant_id: string;
            phase?: string;
          };
        }) => {
          console.log('New event received:', {
            type: payload.new.type,
            timestamp: payload.new.start,
            tenantId: tenantId.substring(0, 8) + '...'
          });

          // Add new event to the beginning of the list
          setEvents(prev => [
            {
              id: payload.new.id,
              type: payload.new.type,
              start: payload.new.start,
              note: payload.new.note,
              property_name: 'Loading...', // Will be fetched separately
              cleaner_name: null,
              phase: payload.new.phase
            },
            ...prev.slice(0, 19) // Keep only last 20 events
          ]);
        }
      )
      .subscribe((status: string) => {
        setIsConnected(status === 'SUBSCRIBED');
        console.log('Realtime subscription status:', status);
      });

    // Cleanup subscription on unmount
    return () => {
      subscription.unsubscribe();
    };
  }, [tenantId]);

  const getEventIcon = (type: string) => {
    switch (type) {
      case 'cleaning_start':
        return '🏁';
      case 'note':
        return '📝';
      case 'supply_out':
        return '📦';
      case 'photo':
        return '📸';
      case 'done':
        return '✅';
      default:
        return '📋';
    }
  };

  const getEventColor = (type: string) => {
    switch (type) {
      case 'cleaning_start':
        return 'admin-event-start';
      case 'note':
        return 'admin-event-note';
      case 'supply_out':
        return 'admin-event-supply';
      case 'photo':
        return 'admin-event-photo';
      case 'done':
        return 'admin-event-done';
      default:
        return 'admin-event-default';
    }
  };

  const formatTime = (timestamp: string) => {
    return new Date(timestamp).toLocaleTimeString();
  };

  return (
    <div className="admin-realtime-feed">
      <div className="admin-feed-header">
        <h3>Živý feed</h3>
        <div className={`admin-connection-status ${isConnected ? 'connected' : 'disconnected'}`}>
          <span className="admin-status-dot"></span>
          {isConnected ? 'Připojeno' : 'Odpojeno'}
        </div>
      </div>

      <div className="admin-feed-content">
        {events.length === 0 ? (
          <div className="admin-feed-empty">
            <p>Žádné události k zobrazení</p>
            <p className="admin-feed-hint">Nové události se zobrazí automaticky</p>
          </div>
        ) : (
          <div className="admin-feed-timeline">
            {events.map((event) => (
              <div key={event.id} className={`admin-feed-item ${getEventColor(event.type)}`}>
                <div className="admin-feed-icon">
                  {getEventIcon(event.type)}
                </div>
                <div className="admin-feed-content">
                  <div className="admin-feed-header">
                    <span className="admin-feed-time">{formatTime(event.start)}</span>
                    <span className="admin-feed-type">{event.type}</span>
                    {event.phase && (
                      <span className={`admin-badge admin-badge-${event.phase}`}>
                        {event.phase}
                      </span>
                    )}
                  </div>
                  <div className="admin-feed-details">
                    <span className="admin-feed-property">{event.property_name}</span>
                    {event.cleaner_name && (
                      <span className="admin-feed-cleaner">• {event.cleaner_name}</span>
                    )}
                  </div>
                  {event.note && (
                    <div className="admin-feed-note">
                      {event.note}
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="admin-feed-footer">
        <p className="admin-feed-info">
          Zobrazuje posledních {events.length} událostí
        </p>
      </div>
    </div>
  );
}

// Realtime connection status component
export function RealtimeStatus({ tenantId }: { tenantId: string }) {
  const [status, setStatus] = useState<'connecting' | 'connected' | 'disconnected'>('connecting');

  useEffect(() => {
    const supabase = createSupabaseClient();

    const subscription = supabase
      .channel('admin-status')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'events',
          filter: `tenant_id=eq.${tenantId}`
        },
        () => {
          // Just to keep connection alive
        }
      )
      .subscribe((status: string) => {
        if (status === 'SUBSCRIBED') {
          setStatus('connected');
        } else if (status === 'CHANNEL_ERROR') {
          setStatus('disconnected');
        } else {
          setStatus('connecting');
        }
      });

    return () => {
      subscription.unsubscribe();
    };
  }, [tenantId]);

  return (
    <div className={`admin-realtime-status admin-status-${status}`}>
      <span className="admin-status-dot"></span>
      <span className="admin-status-text">
        {status === 'connected' && 'Připojeno'}
        {status === 'connecting' && 'Připojování...'}
        {status === 'disconnected' && 'Odpojeno'}
      </span>
    </div>
  );
}




