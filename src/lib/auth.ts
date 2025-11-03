import { NextRequest } from 'next/server';
import { getSupabaseSSRClient } from './supabase/ssr';
import { isCleanStayEnabled } from './env';

// User roles in CleanStay system
export type UserRole = 'admin' | 'manager' | 'cleaner' | 'client';

// User context interface
export interface UserContext {
  id: string;
  email: string;
  name: string;
  role: UserRole;
  tenantId: string;
  properties?: string[];
}

// Auth helper functions
export class AuthHelper {
  private static instance: AuthHelper;
  
  static getInstance(): AuthHelper {
    if (!AuthHelper.instance) {
      AuthHelper.instance = new AuthHelper();
    }
    return AuthHelper.instance;
  }

  // Get user from request (server-side)
  async getUserFromRequest(request: NextRequest): Promise<UserContext | null> {
    if (!isCleanStayEnabled()) {
      return null;
    }

    try {
      const supabase = getSupabaseSSRClient();
      const { data: { user }, error } = await supabase.auth.getUser();
      
      if (error || !user) {
        return null;
      }

      // TODO: Fetch user details from CleanStay users table
      // const { data: userData } = await supabase
      //   .from('users')
      //   .select('*')
      //   .eq('id', user.id)
      //   .single();

      // Mock user data for now
      return {
        id: user.id,
        email: user.email || '',
        name: user.user_metadata?.name || 'Unknown User',
        role: 'client', // Default role
        tenantId: 'mock-tenant-id',
      };
    } catch (error) {
      console.error('Auth error:', error);
      return null;
    }
  }

  // Check if user has admin role
  async isAdmin(user: UserContext | null): Promise<boolean> {
    return user?.role === 'admin';
  }

  // Check if user has manager role or higher
  async isManager(user: UserContext | null): Promise<boolean> {
    return user?.role === 'admin' || user?.role === 'manager';
  }

  // Check if user has cleaner role or higher
  async isCleaner(user: UserContext | null): Promise<boolean> {
    return ['admin', 'manager', 'cleaner'].includes(user?.role || '');
  }

  // Check if user is client
  async isClient(user: UserContext | null): Promise<boolean> {
    return user?.role === 'client';
  }

  // Check if user can access tenant data
  async canAccessTenant(user: UserContext | null, tenantId: string): Promise<boolean> {
    if (!user) return false;
    
    // Admins can access all tenants
    if (user.role === 'admin') return true;
    
    // Users can only access their own tenant
    return user.tenantId === tenantId;
  }

  // Check if user can access property
  async canAccessProperty(user: UserContext | null, propertyId: string): Promise<boolean> {
    if (!user) return false;
    
    // Admins can access all properties
    if (user.role === 'admin') return true;
    
    // Check if user has access to this property
    return user.properties?.includes(propertyId) || false;
  }

  // Get user permissions
  async getUserPermissions(user: UserContext | null): Promise<string[]> {
    if (!user) return [];

    const permissions: string[] = [];

    switch (user.role) {
      case 'admin':
        permissions.push(
          'manage_tenants',
          'manage_users',
          'manage_properties',
          'manage_cleanings',
          'view_analytics',
          'manage_system'
        );
        break;
      case 'manager':
        permissions.push(
          'manage_users',
          'manage_properties',
          'manage_cleanings',
          'view_analytics'
        );
        break;
      case 'cleaner':
        permissions.push(
          'update_cleanings',
          'view_assignments',
          'report_supplies'
        );
        break;
      case 'client':
        permissions.push(
          'view_properties',
          'view_cleanings',
          'provide_feedback'
        );
        break;
    }

    return permissions;
  }
}

// Global auth helper instance
export const authHelper = AuthHelper.getInstance();

// Convenience functions
export const getUser = (request: NextRequest) => 
  authHelper.getUserFromRequest(request);

export const isAdmin = (user: UserContext | null) => 
  authHelper.isAdmin(user);

export const isManager = (user: UserContext | null) => 
  authHelper.isManager(user);

export const isCleaner = (user: UserContext | null) => 
  authHelper.isCleaner(user);

export const isClient = (user: UserContext | null) => 
  authHelper.isClient(user);

export const canAccessTenant = (user: UserContext | null, tenantId: string) => 
  authHelper.canAccessTenant(user, tenantId);

export const canAccessProperty = (user: UserContext | null, propertyId: string) => 
  authHelper.canAccessProperty(user, propertyId);

export const getUserPermissions = (user: UserContext | null) => 
  authHelper.getUserPermissions(user);
