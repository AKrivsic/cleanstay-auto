import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseServerClient } from '@/lib/supabase/server';
import { logAction, logSystemAction, AUDIT_ACTIONS, AUDIT_TABLES } from '@/lib/audit';
import { createHash } from 'crypto';

// Force dynamic rendering for API routes
export const dynamic = 'force-dynamic';
export const revalidate = 0;
export const runtime = 'nodejs';



export async function POST(request: NextRequest) {
  try {
    // Check authentication and admin role
    const authHeader = request.headers.get('authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const token = authHeader.substring(7);
    
    // TODO: Implement proper JWT verification
    // For now, simulate admin user
    const user = {
      id: 'admin-user-123',
      tenant_id: 'tenant-123',
      role: 'admin'
    };

    if (user.role !== 'admin') {
      return NextResponse.json({ error: 'Forbidden - Admin role required' }, { status: 403 });
    }

    const body = await request.json();
    const { 
      user_id, 
      confirm, 
      anonymize_only = true,
      reason = 'GDPR request'
    } = body;

    if (!user_id) {
      return NextResponse.json({ error: 'user_id is required' }, { status: 400 });
    }

    if (!confirm) {
      return NextResponse.json({ 
        error: 'Confirmation required. Set confirm=true to proceed with data deletion.' 
      }, { status: 400 });
    }

    const supabase = getSupabaseServerClient();

    // Verify user exists and belongs to the same tenant
    const { data: targetUser, error: userError } = await supabase
      .from('users')
      .select('id, tenant_id, name, email, phone, role')
      .eq('id', user_id)
      .eq('tenant_id', user.tenant_id)
      .single();

    if (userError || !targetUser) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Check if user is already anonymized
    if (targetUser.gdpr_erased) {
      return NextResponse.json({ 
        error: 'User data has already been anonymized',
        already_anonymized: true
      }, { status: 409 });
    }

    // Perform data anonymization
    const result = await anonymizeUserData(supabase, user_id, user.tenant_id, anonymize_only);

    // Log the deletion action
    await logAction(
      user,
      AUDIT_ACTIONS.DATA_DELETE,
      AUDIT_TABLES.USERS,
      user_id,
      {
        target_user_id: user_id,
        anonymize_only,
        reason,
        records_affected: result.recordsAffected,
        tables_affected: result.tablesAffected
      },
      request
    );

    return NextResponse.json({
      success: true,
      message: 'User data has been successfully anonymized',
      data: {
        user_id,
        anonymize_only,
        records_affected: result.recordsAffected,
        tables_affected: result.tablesAffected,
        anonymized_at: new Date().toISOString()
      }
    });

  } catch (error) {
    console.error('Error in data deletion:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

interface SupabaseClient {
  from: (table: string) => {
    select: (columns: string) => any;
    insert: (data: any) => any;
    update: (data: any) => any;
    delete: () => any;
  };
}

async function anonymizeUserData(
  supabase: SupabaseClient, 
  userId: string, 
  tenantId: string, 
  anonymizeOnly: boolean
): Promise<{
  recordsAffected: number;
  tablesAffected: string[];
}> {
  const tablesAffected: string[] = [];
  let totalRecordsAffected = 0;

  try {
    // Get user data first
    const { data: targetUser, error: getUserError } = await supabase
      .from('users')
      .select('phone')
      .eq('id', userId)
      .eq('tenant_id', tenantId)
      .single();

    if (getUserError) throw getUserError;

    // 1. Anonymize user record
    const { error: userError } = await supabase
      .from('users')
      .update({
        name: 'Anonymized User',
        email: null,
        phone: generateAnonymizedPhone(),
        gdpr_erased: true,
        erased_at: new Date().toISOString(),
        erased_by: 'system'
      })
      .eq('id', userId)
      .eq('tenant_id', tenantId);

    if (userError) throw userError;
    tablesAffected.push('users');
    totalRecordsAffected += 1;

    // 2. Anonymize messages
    const { data: messages, error: messagesError } = await supabase
      .from('messages')
      .select('id')
      .eq('tenant_id', tenantId)
      .or(`from_phone.eq.${targetUser.phone},to_phone.eq.${targetUser.phone}`);

    if (!messagesError && messages) {
      const { error: updateMessagesError } = await supabase
        .from('messages')
        .update({
          content: '[Anonymized]',
          from_phone: generateAnonymizedPhone(),
          to_phone: generateAnonymizedPhone(),
          gdpr_erased: true
        })
        .eq('tenant_id', tenantId)
        .or(`from_phone.eq.${targetUser.phone},to_phone.eq.${targetUser.phone}`);

      if (!updateMessagesError) {
        tablesAffected.push('messages');
        totalRecordsAffected += messages.length;
      }
    }

    // 3. Anonymize events
    const { data: events, error: eventsError } = await supabase
      .from('events')
      .select('id')
      .eq('tenant_id', tenantId)
      .eq('user_id', userId);

    if (!eventsError && events) {
      const { error: updateEventsError } = await supabase
        .from('events')
        .update({
          note: '[Anonymized]',
          payload: null,
          gdpr_erased: true
        })
        .eq('tenant_id', tenantId)
        .eq('user_id', userId);

      if (!updateEventsError) {
        tablesAffected.push('events');
        totalRecordsAffected += events.length;
      }
    }

    // 4. Anonymize audit log entries
    const { data: auditLogs, error: auditLogsError } = await supabase
      .from('audit_log')
      .select('id')
      .eq('tenant_id', tenantId)
      .eq('user_id', userId);

    if (!auditLogsError && auditLogs) {
      const { error: updateAuditLogsError } = await supabase
        .from('audit_log')
        .update({
          user_id: null, // Remove user reference
          metadata: null, // Remove potentially sensitive metadata
          gdpr_erased: true
        })
        .eq('tenant_id', tenantId)
        .eq('user_id', userId);

      if (!updateAuditLogsError) {
        tablesAffected.push('audit_log');
        totalRecordsAffected += auditLogs.length;
      }
    }

    // 5. If not anonymize_only, delete related records
    if (!anonymizeOnly) {
      // Delete user's cleanings
      const { data: cleanings, error: cleaningsError } = await supabase
        .from('cleanings')
        .select('id')
        .eq('tenant_id', tenantId)
        .or(`client_id.eq.${userId},cleaner_id.eq.${userId}`);

      if (!cleaningsError && cleanings) {
        const { error: deleteCleaningsError } = await supabase
          .from('cleanings')
          .delete()
          .eq('tenant_id', tenantId)
          .or(`client_id.eq.${userId},cleaner_id.eq.${userId}`);

        if (!deleteCleaningsError) {
          tablesAffected.push('cleanings');
          totalRecordsAffected += cleanings.length;
        }
      }

      // Delete user's active sessions
      const { data: sessions, error: sessionsError } = await supabase
        .from('active_sessions')
        .select('id')
        .eq('tenant_id', tenantId)
        .eq('cleaner_phone', targetUser.phone);

      if (!sessionsError && sessions) {
        const { error: deleteSessionsError } = await supabase
          .from('active_sessions')
          .delete()
          .eq('tenant_id', tenantId)
          .eq('cleaner_phone', targetUser.phone);

        if (!deleteSessionsError) {
          tablesAffected.push('active_sessions');
          totalRecordsAffected += sessions.length;
        }
      }
    }

    // 6. Log system action for anonymization
    await logSystemAction(
      tenantId,
      AUDIT_ACTIONS.DATA_ANONYMIZE,
      AUDIT_TABLES.USERS,
      userId,
      {
        target_user_id: userId,
        anonymize_only: anonymizeOnly,
        records_affected: totalRecordsAffected,
        tables_affected: tablesAffected
      }
    );

    return {
      recordsAffected: totalRecordsAffected,
      tablesAffected
    };

  } catch (error) {
    console.error('Error anonymizing user data:', error);
    throw error;
  }
}

function generateAnonymizedPhone(): string {
  // Generate a consistent anonymized phone number
  const hash = createHash('sha256').update('anonymized').digest('hex');
  return `+420${hash.substring(0, 9)}`;
}

export async function GET(request: NextRequest) {
  // GET method to check deletion status
  try {
    const authHeader = request.headers.get('authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const user = {
      id: 'admin-user-123',
      tenant_id: 'tenant-123',
      role: 'admin'
    };

    if (user.role !== 'admin') {
      return NextResponse.json({ error: 'Forbidden - Admin role required' }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('user_id');

    if (!userId) {
      return NextResponse.json({ error: 'user_id parameter required' }, { status: 400 });
    }

    const supabase = getSupabaseServerClient();

    // Check user status
    const { data: userData, error: userError } = await supabase
      .from('users')
      .select('id, name, email, phone, gdpr_erased, erased_at, erased_by')
      .eq('id', userId)
      .eq('tenant_id', user.tenant_id)
      .single();

    if (userError || !userData) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Get deletion history from audit log
    const { data: deletionHistory, error: auditError } = await supabase
      .from('audit_log')
      .select('action, timestamp, metadata')
      .eq('tenant_id', user.tenant_id)
      .eq('record_id', userId)
      .in('action', [AUDIT_ACTIONS.DATA_DELETE, AUDIT_ACTIONS.DATA_ANONYMIZE])
      .order('timestamp', { ascending: false });

    if (auditError) {
      console.error('Error fetching deletion history:', auditError);
    }

    return NextResponse.json({
      success: true,
      data: {
        user_id: userId,
        is_anonymized: userData.gdpr_erased,
        anonymized_at: userData.erased_at,
        anonymized_by: userData.erased_by,
        current_status: {
          name: userData.name,
          email: userData.email,
          phone: userData.phone
        },
        deletion_history: deletionHistory || []
      }
    });

  } catch (error) {
    console.error('Error checking deletion status:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest) {
  // DELETE method for permanent deletion (admin only)
  try {
    const authHeader = request.headers.get('authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const user = {
      id: 'admin-user-123',
      tenant_id: 'tenant-123',
      role: 'admin'
    };

    if (user.role !== 'admin') {
      return NextResponse.json({ error: 'Forbidden - Admin role required' }, { status: 403 });
    }

    const body = await request.json();
    const { user_id, confirm, reason = 'Permanent deletion request' } = body;

    if (!user_id) {
      return NextResponse.json({ error: 'user_id is required' }, { status: 400 });
    }

    if (!confirm) {
      return NextResponse.json({ 
        error: 'Confirmation required. Set confirm=true to proceed with permanent deletion.' 
      }, { status: 400 });
    }

    const supabase = getSupabaseServerClient();

    // Verify user exists
    const { data: targetUser, error: userError } = await supabase
      .from('users')
      .select('id, tenant_id')
      .eq('id', user_id)
      .eq('tenant_id', user.tenant_id)
      .single();

    if (userError || !targetUser) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Perform permanent deletion
    const result = await permanentDeleteUser(supabase, user_id, user.tenant_id);

    // Log the permanent deletion
    await logAction(
      user,
      AUDIT_ACTIONS.DATA_DELETE,
      AUDIT_TABLES.USERS,
      user_id,
      {
        target_user_id: user_id,
        permanent_deletion: true,
        reason,
        records_deleted: result.recordsDeleted,
        tables_affected: result.tablesAffected
      },
      request
    );

    return NextResponse.json({
      success: true,
      message: 'User data has been permanently deleted',
      data: {
        user_id,
        records_deleted: result.recordsDeleted,
        tables_affected: result.tablesAffected,
        deleted_at: new Date().toISOString()
      }
    });

  } catch (error) {
    console.error('Error in permanent deletion:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

async function permanentDeleteUser(
  supabase: SupabaseClient, 
  userId: string, 
  tenantId: string
): Promise<{
  recordsDeleted: number;
  tablesAffected: string[];
}> {
  const tablesAffected: string[] = [];
  let totalRecordsDeleted = 0;

  try {
    // Delete all records related to the user
    const tablesToDelete = [
      'active_sessions',
      'cleanings', 
      'events',
      'messages',
      'audit_log'
    ];

    for (const tableName of tablesToDelete) {
      let deleteQuery = supabase
        .from(tableName)
        .delete()
        .eq('tenant_id', tenantId);

      // Handle different foreign key relationships
      switch (tableName) {
        case 'active_sessions':
          // Delete by cleaner_phone (would need to get phone first)
          break;
        case 'cleanings':
          deleteQuery = deleteQuery.or(`client_id.eq.${userId},cleaner_id.eq.${userId}`);
          break;
        case 'events':
        case 'messages':
        case 'audit_log':
          deleteQuery = deleteQuery.eq('user_id', userId);
          break;
      }

      const { data, error } = await deleteQuery.select('id');

      if (!error && data) {
        tablesAffected.push(tableName);
        totalRecordsDeleted += data.length;
      }
    }

    // Finally, delete the user record
    const { error: userDeleteError } = await supabase
      .from('users')
      .delete()
      .eq('id', userId)
      .eq('tenant_id', tenantId);

    if (!userDeleteError) {
      tablesAffected.push('users');
      totalRecordsDeleted += 1;
    }

    return {
      recordsDeleted: totalRecordsDeleted,
      tablesAffected
    };

  } catch (error) {
    console.error('Error in permanent deletion:', error);
    throw error;
  }
}




