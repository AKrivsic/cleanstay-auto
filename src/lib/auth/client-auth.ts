import { createSupabaseClient } from '@/lib/supabase/client';

// Client authentication helper for RLS enforcement
export class ClientAuth {
  private supabase = createSupabaseClient();

  // Get current user with proper JWT token
  async getCurrentUser() {
    const { data: { user }, error } = await this.supabase.auth.getUser();
    
    if (error) {
      console.error('Error getting current user:', error);
      throw new Error('Authentication failed');
    }

    if (!user) {
      throw new Error('User not authenticated');
    }

    return user;
  }

  // Get user's tenant_id from JWT claims
  async getTenantId(): Promise<string> {
    const user = await this.getCurrentUser();
    
    // Extract tenant_id from user metadata or JWT claims
    const tenantId = user.user_metadata?.tenant_id || user.app_metadata?.tenant_id;
    
    if (!tenantId) {
      throw new Error('Tenant ID not found in user metadata');
    }

    return tenantId;
  }

  // Get user's role from JWT claims
  async getUserRole(): Promise<string> {
    const user = await this.getCurrentUser();
    
    // Extract role from user metadata or JWT claims
    const role = user.user_metadata?.role || user.app_metadata?.role;
    
    if (!role) {
      throw new Error('User role not found in metadata');
    }

    return role;
  }

  // Verify user has client role
  async verifyClientRole(): Promise<boolean> {
    try {
      const role = await this.getUserRole();
      return role === 'client';
    } catch (error) {
      console.error('Error verifying client role:', error);
      return false;
    }
  }

  // Get authenticated Supabase client with user context
  async getAuthenticatedClient() {
    const user = await this.getCurrentUser();
    
    // Ensure the client has the user's JWT token for RLS
    const { data: { session }, error } = await this.supabase.auth.getSession();
    
    if (error || !session) {
      throw new Error('No valid session found');
    }

    return this.supabase;
  }

  // Sign in with email and password
  async signIn(email: string, password: string) {
    const { data, error } = await this.supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      throw new Error(`Sign in failed: ${error.message}`);
    }

    return data;
  }

  // Sign out
  async signOut() {
    const { error } = await this.supabase.auth.signOut();
    
    if (error) {
      throw new Error(`Sign out failed: ${error.message}`);
    }
  }

  // Check if user is authenticated
  async isAuthenticated(): Promise<boolean> {
    try {
      const user = await this.getCurrentUser();
      return !!user;
    } catch {
      return false;
    }
  }
}

// Export singleton instance
export const clientAuth = new ClientAuth();





