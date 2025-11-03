import { getSupabaseServerClient } from './supabase/server';
import { NextRequest } from 'next/server';

export interface AuditLogEntry {
  id: string;
  tenant_id: string;
  user_id?: string;
  action: string;
  table_name: string;
  record_id?: string;
  timestamp: string;
  ip_address?: string;
  user_agent?: string;
  metadata?: Record<string, unknown>;
}

export interface User {
  id: string;
  tenant_id: string;
  role: string;
}

export interface AuditAction {
  action: string;
  tableName: string;
  recordId?: string;
  metadata?: Record<string, unknown>;
}

/**
 * Log a user action to the audit log
 * @param user - User performing the action
 * @param action - Action being performed
 * @param tableName - Database table affected
 * @param recordId - Specific record ID (optional)
 * @param metadata - Additional metadata (optional)
 * @param request - NextRequest object for IP and User-Agent (optional)
 */
export async function logAction(
  user: User,
  action: string,
  tableName: string,
  recordId?: string,
  metadata?: any,
  request?: NextRequest
): Promise<string | null> {
  try {
    const supabase = getSupabaseServerClient();
    
    const ipAddress = request ? getClientIP(request) : null;
    const userAgent = request ? getUserAgent(request) : null;
    
    const { data, error } = await supabase
      .from('audit_log')
      .insert({
        tenant_id: user.tenant_id,
        user_id: user.id,
        action,
        table_name: tableName,
        record_id: recordId,
        ip_address: ipAddress,
        user_agent: userAgent,
        metadata
      })
      .select('id')
      .single();

    if (error) {
      console.error('Error logging audit action:', error);
      return null;
    }

    return data.id;
  } catch (error) {
    console.error('Error in logAction:', error);
    return null;
  }
}

/**
 * Log a system action (no user involved)
 * @param tenantId - Tenant ID
 * @param action - Action being performed
 * @param tableName - Database table affected
 * @param recordId - Specific record ID (optional)
 * @param metadata - Additional metadata (optional)
 */
export async function logSystemAction(
  tenantId: string,
  action: string,
  tableName: string,
  recordId?: string,
  metadata?: any
): Promise<string | null> {
  try {
    const supabase = getSupabaseServerClient();
    
    const { data, error } = await supabase
      .from('audit_log')
      .insert({
        tenant_id: tenantId,
        user_id: null, // System action
        action,
        table_name: tableName,
        record_id: recordId,
        metadata
      })
      .select('id')
      .single();

    if (error) {
      console.error('Error logging system action:', error);
      return null;
    }

    return data.id;
  } catch (error) {
    console.error('Error in logSystemAction:', error);
    return null;
  }
}

/**
 * Get audit log entries for a specific user
 * @param tenantId - Tenant ID
 * @param userId - User ID
 * @param limit - Number of entries to return (default: 100)
 * @param offset - Number of entries to skip (default: 0)
 */
export async function getUserAuditLog(
  tenantId: string,
  userId: string,
  limit: number = 100,
  offset: number = 0
): Promise<AuditLogEntry[]> {
  try {
    const supabase = getSupabaseServerClient();
    
    const { data, error } = await supabase
      .from('audit_log')
      .select('*')
      .eq('tenant_id', tenantId)
      .eq('user_id', userId)
      .order('timestamp', { ascending: false })
      .range(offset, offset + limit - 1);

    if (error) {
      console.error('Error fetching user audit log:', error);
      return [];
    }

    return data || [];
  } catch (error) {
    console.error('Error in getUserAuditLog:', error);
    return [];
  }
}

/**
 * Get audit log entries for a specific tenant
 * @param tenantId - Tenant ID
 * @param limit - Number of entries to return (default: 100)
 * @param offset - Number of entries to skip (default: 0)
 * @param action - Filter by specific action (optional)
 */
export async function getTenantAuditLog(
  tenantId: string,
  limit: number = 100,
  offset: number = 0,
  action?: string
): Promise<AuditLogEntry[]> {
  try {
    const supabase = getSupabaseServerClient();
    
    let query = supabase
      .from('audit_log')
      .select('*')
      .eq('tenant_id', tenantId)
      .order('timestamp', { ascending: false })
      .range(offset, offset + limit - 1);

    if (action) {
      query = query.eq('action', action);
    }

    const { data, error } = await query;

    if (error) {
      console.error('Error fetching tenant audit log:', error);
      return [];
    }

    return data || [];
  } catch (error) {
    console.error('Error in getTenantAuditLog:', error);
    return [];
  }
}

/**
 * Get audit log entries for a specific record
 * @param tenantId - Tenant ID
 * @param tableName - Table name
 * @param recordId - Record ID
 */
export async function getRecordAuditLog(
  tenantId: string,
  tableName: string,
  recordId: string
): Promise<AuditLogEntry[]> {
  try {
    const supabase = getSupabaseServerClient();
    
    const { data, error } = await supabase
      .from('audit_log')
      .select('*')
      .eq('tenant_id', tenantId)
      .eq('table_name', tableName)
      .eq('record_id', recordId)
      .order('timestamp', { ascending: false });

    if (error) {
      console.error('Error fetching record audit log:', error);
      return [];
    }

    return data || [];
  } catch (error) {
    console.error('Error in getRecordAuditLog:', error);
    return [];
  }
}

/**
 * Clean up old audit log entries
 * @param tenantId - Tenant ID
 * @param retentionMonths - Number of months to retain (default: 12)
 */
export async function cleanupOldAuditLogs(
  tenantId: string,
  retentionMonths: number = 12
): Promise<number> {
  try {
    const supabase = getSupabaseServerClient();
    
    const cutoffDate = new Date();
    cutoffDate.setMonth(cutoffDate.getMonth() - retentionMonths);
    
    const { data, error } = await supabase
      .from('audit_log')
      .delete()
      .eq('tenant_id', tenantId)
      .lt('created_at', cutoffDate.toISOString())
      .select('id');

    if (error) {
      console.error('Error cleaning up old audit logs:', error);
      return 0;
    }

    const deletedCount = data?.length || 0;
    
    // Log the cleanup action
    await logSystemAction(
      tenantId,
      'audit_cleanup',
      'audit_log',
      undefined,
      {
        deleted_count: deletedCount,
        retention_months: retentionMonths,
        cutoff_date: cutoffDate.toISOString()
      }
    );

    return deletedCount;
  } catch (error) {
    console.error('Error in cleanupOldAuditLogs:', error);
    return 0;
  }
}

/**
 * Get audit statistics for a tenant
 * @param tenantId - Tenant ID
 * @param days - Number of days to analyze (default: 30)
 */
export async function getAuditStatistics(
  tenantId: string,
  days: number = 30
): Promise<{
  totalActions: number;
  actionsByType: Record<string, number>;
  actionsByUser: Record<string, number>;
  actionsByTable: Record<string, number>;
  dailyActivity: Array<{ date: string; count: number }>;
}> {
  try {
    const supabase = getSupabaseServerClient();
    
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);
    
    const { data, error } = await supabase
      .from('audit_log')
      .select('action, table_name, user_id, timestamp')
      .eq('tenant_id', tenantId)
      .gte('timestamp', startDate.toISOString());

    if (error) {
      console.error('Error fetching audit statistics:', error);
      return {
        totalActions: 0,
        actionsByType: {},
        actionsByUser: {},
        actionsByTable: {},
        dailyActivity: []
      };
    }

    const actions = data || [];
    
    // Calculate statistics
    const totalActions = actions.length;
    const actionsByType: Record<string, number> = {};
    const actionsByUser: Record<string, number> = {};
    const actionsByTable: Record<string, number> = {};
    const dailyActivity: Record<string, number> = {};

    actions.forEach((action: any) => {
      // Count by action type
      actionsByType[action.action] = (actionsByType[action.action] || 0) + 1;
      
      // Count by user
      if (action.user_id) {
        actionsByUser[action.user_id] = (actionsByUser[action.user_id] || 0) + 1;
      }
      
      // Count by table
      actionsByTable[action.table_name] = (actionsByTable[action.table_name] || 0) + 1;
      
      // Count by day
      const date = new Date(action.timestamp).toISOString().split('T')[0];
      dailyActivity[date] = (dailyActivity[date] || 0) + 1;
    });

    // Convert daily activity to array
    const dailyActivityArray = Object.entries(dailyActivity)
      .map(([date, count]: [string, number]) => ({ date, count }))
      .sort((a, b) => a.date.localeCompare(b.date));

    return {
      totalActions,
      actionsByType,
      actionsByUser,
      actionsByTable,
      dailyActivity: dailyActivityArray
    };
  } catch (error) {
    console.error('Error in getAuditStatistics:', error);
    return {
      totalActions: 0,
      actionsByType: {},
      actionsByUser: {},
      actionsByTable: {},
      dailyActivity: []
    };
  }
}

/**
 * Extract client IP address from request
 * @param request - NextRequest object
 */
function getClientIP(request: NextRequest): string | null {
  const forwarded = request.headers.get('x-forwarded-for');
  const realIP = request.headers.get('x-real-ip');
  const remoteAddr = request.headers.get('x-remote-addr');
  
  if (forwarded) {
    return forwarded.split(',')[0].trim();
  }
  
  if (realIP) {
    return realIP;
  }
  
  if (remoteAddr) {
    return remoteAddr;
  }
  
  return null;
}

/**
 * Extract user agent from request
 * @param request - NextRequest object
 */
function getUserAgent(request: NextRequest): string | null {
  return request.headers.get('user-agent');
}

/**
 * Predefined audit actions for consistency
 */
export const AUDIT_ACTIONS = {
  // Authentication
  LOGIN: 'login',
  LOGOUT: 'logout',
  PASSWORD_CHANGE: 'password_change',
  PASSWORD_RESET: 'password_reset',
  
  // Data operations
  DATA_EXPORT: 'data_export',
  DATA_DELETE: 'data_delete',
  DATA_ANONYMIZE: 'data_anonymize',
  
  // User management
  USER_CREATE: 'user_create',
  USER_UPDATE: 'user_update',
  USER_DELETE: 'user_delete',
  ROLE_CHANGE: 'role_change',
  
  // Settings
  SETTINGS_CHANGE: 'settings_change',
  PROFILE_UPDATE: 'profile_update',
  
  // Cleaning operations
  CLEANING_START: 'cleaning_start',
  CLEANING_COMPLETE: 'cleaning_complete',
  CLEANING_CANCEL: 'cleaning_cancel',
  
  // Media
  UPLOAD_PHOTO: 'upload_photo',
  DELETE_PHOTO: 'delete_photo',
  
  // API access
  API_ACCESS: 'api_access',
  API_ERROR: 'api_error',
  
  // System
  SYSTEM_ACTION: 'system_action',
  AUDIT_CLEANUP: 'audit_cleanup',
  MIGRATION: 'migration'
} as const;

/**
 * Predefined table names for consistency
 */
export const AUDIT_TABLES = {
  USERS: 'users',
  TENANTS: 'tenants',
  CLEANINGS: 'cleanings',
  EVENTS: 'events',
  MESSAGES: 'messages',
  PHOTOS: 'photos',
  INVENTORY: 'inventory',
  SUPPLIES: 'supplies',
  AUDIT_LOG: 'audit_log'
} as const;




