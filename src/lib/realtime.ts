import { RealtimeChannel } from '@supabase/supabase-js';
import { supabase } from './supabase/client';
import { isCleanStayEnabled } from './env';

// Realtime subscription types
export type RealtimeEventType = 
  | 'cleaning_started'
  | 'cleaning_completed'
  | 'supply_alert'
  | 'message_received'
  | 'session_updated'
  | 'inventory_updated';

export type RealtimeEventHandler = (payload: any) => void;

// Realtime subscription manager
class RealtimeManager {
  private channels: Map<string, RealtimeChannel> = new Map();
  private isEnabled: boolean = false;

  constructor() {
    this.isEnabled = isCleanStayEnabled();
  }

  // Subscribe to a specific table and event
  subscribe(
    table: string,
    event: string,
    filter: string = '*',
    callback: RealtimeEventHandler
  ): () => void {
    if (!this.isEnabled) {
      console.warn('Realtime is disabled - CleanStay feature not enabled');
      return () => {};
    }

    const channelName = `${table}:${event}:${filter}`;
    
    // Return existing subscription if already exists
    if (this.channels.has(channelName)) {
      console.warn(`Subscription ${channelName} already exists`);
      return () => {};
    }

    const channel = supabase
      .channel(channelName)
      .on('postgres_changes', 
        { 
          event, 
          schema: 'public', 
          table,
          filter: filter === '*' ? undefined : filter 
        }, 
        callback
      )
      .subscribe();

    this.channels.set(channelName, channel);

    // Return unsubscribe function
    return () => {
      this.unsubscribe(channelName);
    };
  }

  // Unsubscribe from a specific channel
  unsubscribe(channelName: string): void {
    const channel = this.channels.get(channelName);
    if (channel) {
      supabase.removeChannel(channel);
      this.channels.delete(channelName);
    }
  }

  // Unsubscribe from all channels
  unsubscribeAll(): void {
    this.channels.forEach((channel, name) => {
      supabase.removeChannel(channel);
    });
    this.channels.clear();
  }

  // Subscribe to cleaning events
  subscribeToCleanings(
    tenantId: string,
    callback: RealtimeEventHandler
  ): () => void {
    return this.subscribe(
      'cleanings',
      '*',
      `tenant_id=eq.${tenantId}`,
      callback
    );
  }

  // Subscribe to message events
  subscribeToMessages(
    tenantId: string,
    callback: RealtimeEventHandler
  ): () => void {
    return this.subscribe(
      'messages',
      '*',
      `tenant_id=eq.${tenantId}`,
      callback
    );
  }

  // Subscribe to session events
  subscribeToSessions(
    tenantId: string,
    callback: RealtimeEventHandler
  ): () => void {
    return this.subscribe(
      'active_sessions',
      '*',
      `tenant_id=eq.${tenantId}`,
      callback
    );
  }

  // Subscribe to supply alerts
  subscribeToSupplyAlerts(
    tenantId: string,
    callback: RealtimeEventHandler
  ): () => void {
    return this.subscribe(
      'supplies',
      '*',
      `tenant_id=eq.${tenantId}`,
      callback
    );
  }

  // Subscribe to inventory updates
  subscribeToInventoryUpdates(
    tenantId: string,
    callback: RealtimeEventHandler
  ): () => void {
    return this.subscribe(
      'inventory',
      '*',
      `tenant_id=eq.${tenantId}`,
      callback
    );
  }

  // Get active subscriptions count
  getActiveSubscriptionsCount(): number {
    return this.channels.size;
  }

  // Get list of active subscriptions
  getActiveSubscriptions(): string[] {
    return Array.from(this.channels.keys());
  }
}

// Global realtime manager instance
export const realtimeManager = new RealtimeManager();

// Helper functions for common subscriptions
export const subscribeToCleaningUpdates = (
  tenantId: string,
  callback: RealtimeEventHandler
) => realtimeManager.subscribeToCleanings(tenantId, callback);

export const subscribeToMessageUpdates = (
  tenantId: string,
  callback: RealtimeEventHandler
) => realtimeManager.subscribeToMessages(tenantId, callback);

export const subscribeToSessionUpdates = (
  tenantId: string,
  callback: RealtimeEventHandler
) => realtimeManager.subscribeToSessions(tenantId, callback);

export const subscribeToSupplyAlerts = (
  tenantId: string,
  callback: RealtimeEventHandler
) => realtimeManager.subscribeToSupplyAlerts(tenantId, callback);

export const subscribeToInventoryUpdates = (
  tenantId: string,
  callback: RealtimeEventHandler
) => realtimeManager.subscribeToInventoryUpdates(tenantId, callback);

// Cleanup function for React components
export const cleanupRealtimeSubscriptions = () => {
  realtimeManager.unsubscribeAll();
};

// Hook-like function for React components (to be used with useEffect)
export const useRealtimeSubscription = (
  subscriptionFn: () => () => void,
  deps: any[] = []
) => {
  // This would be used in a React component like:
  // useEffect(() => {
  //   const unsubscribe = subscriptionFn();
  //   return unsubscribe;
  // }, deps);
  
  return subscriptionFn();
};
