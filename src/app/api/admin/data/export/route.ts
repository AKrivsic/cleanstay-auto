import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseServerClient } from '@/lib/supabase/server';
import { logAction, AUDIT_ACTIONS, AUDIT_TABLES } from '@/lib/audit';
import { createReadStream } from 'fs';
import { createWriteStream } from 'fs';
import { pipeline } from 'stream';
import { promisify } from 'util';
import { createGzip } from 'zlib';
import { tmpdir } from 'os';
import { join } from 'path';
import { unlink } from 'fs/promises';
import { randomUUID } from 'crypto';

// Force dynamic rendering for API routes
export const dynamic = 'force-dynamic';
export const revalidate = 0;
export const runtime = 'nodejs';











const pipelineAsync = promisify(pipeline);

export async function GET(request: NextRequest) {
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

    const supabase = getSupabaseServerClient();
    const { searchParams } = new URL(request.url);
    const format = searchParams.get('format') || 'json';
    const includePhotos = searchParams.get('include_photos') === 'true';

    // Export all tenant data
    const exportData = await exportTenantData(supabase, user.tenant_id, includePhotos);

    // Log the export action
    await logAction(
      user,
      AUDIT_ACTIONS.DATA_EXPORT,
      AUDIT_TABLES.USERS,
      undefined,
      {
        format,
        include_photos: includePhotos,
        records_count: {
          users: exportData.users.length,
          cleanings: exportData.cleanings.length,
          events: exportData.events.length,
          messages: exportData.messages.length
        }
      },
      request
    );

    if (format === 'json') {
      return NextResponse.json({
        success: true,
        data: exportData,
        exported_at: new Date().toISOString(),
        tenant_id: user.tenant_id
      });
    }

    if (format === 'csv') {
      const csvData = await generateCSV(exportData);
      return new NextResponse(csvData, {
        headers: {
          'Content-Type': 'text/csv',
          'Content-Disposition': `attachment; filename="cleanstay-export-${user.tenant_id}-${new Date().toISOString().split('T')[0]}.csv"`
        }
      });
    }

    if (format === 'zip') {
      const zipBuffer = await generateZIP(exportData, includePhotos);
      return new NextResponse(zipBuffer as any, {
        headers: {
          'Content-Type': 'application/zip',
          'Content-Disposition': `attachment; filename="cleanstay-export-${user.tenant_id}-${new Date().toISOString().split('T')[0]}.zip"`
        }
      });
    }

    return NextResponse.json({ error: 'Invalid format. Use json, csv, or zip' }, { status: 400 });

  } catch (error) {
    console.error('Error in data export:', error);
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

async function exportTenantData(supabase: SupabaseClient, tenantId: string, includePhotos: boolean = false) {
  // Export users
  const { data: users, error: usersError } = await supabase
    .from('users')
    .select('*')
    .eq('tenant_id', tenantId);

  if (usersError) throw usersError;

  // Export tenants
  const { data: tenants, error: tenantsError } = await supabase
    .from('tenants')
    .select('*')
    .eq('id', tenantId);

  if (tenantsError) throw tenantsError;

  // Export properties
  const { data: properties, error: propertiesError } = await supabase
    .from('properties')
    .select('*')
    .eq('tenant_id', tenantId);

  if (propertiesError) throw propertiesError;

  // Export cleanings
  const { data: cleanings, error: cleaningsError } = await supabase
    .from('cleanings')
    .select(`
      *,
      properties!inner(*),
      users!cleanings_client_id_fkey(*),
      cleaners!cleanings_cleaner_id_fkey(*)
    `)
    .eq('tenant_id', tenantId);

  if (cleaningsError) throw cleaningsError;

  // Export events
  const { data: events, error: eventsError } = await supabase
    .from('events')
    .select('*')
    .eq('tenant_id', tenantId)
    .order('created_at', { ascending: false });

  if (eventsError) throw eventsError;

  // Export messages
  const { data: messages, error: messagesError } = await supabase
    .from('messages')
    .select('*')
    .eq('tenant_id', tenantId)
    .order('created_at', { ascending: false });

  if (messagesError) throw messagesError;

  // Export supplies
  const { data: supplies, error: suppliesError } = await supabase
    .from('supplies')
    .select('*')
    .eq('tenant_id', tenantId);

  if (suppliesError) throw suppliesError;

  // Export inventory
  const { data: inventory, error: inventoryError } = await supabase
    .from('inventory')
    .select(`
      *,
      supplies!inner(*),
      properties!inner(*)
    `)
    .eq('tenant_id', tenantId);

  if (inventoryError) throw inventoryError;

  // Export inventory movements
  const { data: inventoryMovements, error: inventoryMovementsError } = await supabase
    .from('inventory_movements')
    .select('*')
    .eq('tenant_id', tenantId)
    .order('created_at', { ascending: false });

  if (inventoryMovementsError) throw inventoryMovementsError;

  // Export audit log
  const { data: auditLog, error: auditLogError } = await supabase
    .from('audit_log')
    .select('*')
    .eq('tenant_id', tenantId)
    .order('timestamp', { ascending: false });

  if (auditLogError) throw auditLogError;

  const exportData = {
    export_info: {
      exported_at: new Date().toISOString(),
      tenant_id: tenantId,
      format: 'complete_export',
      version: '1.0'
    },
    tenants: tenants || [],
    users: users || [],
    properties: properties || [],
    cleanings: cleanings || [],
    events: events || [],
    messages: messages || [],
    supplies: supplies || [],
    inventory: inventory || [],
    inventory_movements: inventoryMovements || [],
    audit_log: auditLog || []
  };

  // Include photos if requested
  if (includePhotos) {
    const { data: photos, error: photosError } = await supabase
      .from('events')
      .select('*')
      .eq('tenant_id', tenantId)
      .eq('type', 'photo')
      .not('storage_path_main', 'is', null);

    if (photosError) throw photosError;

    (exportData as any).photos = photos || [];
  }

  return exportData;
}

interface ExportData {
  export_info: {
    exported_at: string;
    tenant_id: string;
    format: string;
    version: string;
  };
  tenants: any[];
  users: any[];
  properties: any[];
  cleanings: any[];
  events: any[];
  messages: any[];
  supplies: any[];
  inventory: any[];
  inventory_movements: any[];
  audit_log: any[];
  photos?: any[];
}

async function generateCSV(exportData: ExportData): Promise<string> {
  const csvLines: string[] = [];
  
  // Add header
  csvLines.push('Table,Record_ID,Data');
  
  // Convert each table to CSV
  const tables = [
    'tenants', 'users', 'properties', 'cleanings', 
    'events', 'messages', 'supplies', 'inventory', 
    'inventory_movements', 'audit_log'
  ];
  
  for (const tableName of tables) {
    const records = (exportData as any)[tableName] || [];
    for (const record of records) {
      const csvRow = [
        tableName,
        record.id || '',
        JSON.stringify(record).replace(/"/g, '""')
      ].map(field => `"${field}"`).join(',');
      csvLines.push(csvRow);
    }
  }
  
  return csvLines.join('\n');
}

async function generateZIP(exportData: ExportData, includePhotos: boolean): Promise<Buffer> {
  const AdmZip = require('adm-zip');
  const zip = new AdmZip();
  
  // Add JSON export
  zip.addFile('export.json', Buffer.from(JSON.stringify(exportData, null, 2)));
  
  // Add CSV export
  const csvData = await generateCSV(exportData);
  zip.addFile('export.csv', Buffer.from(csvData));
  
  // Add individual table files
  const tables = [
    'tenants', 'users', 'properties', 'cleanings', 
    'events', 'messages', 'supplies', 'inventory', 
    'inventory_movements', 'audit_log'
  ];
  
  for (const tableName of tables) {
    const records = (exportData as any)[tableName] || [];
    const tableData = JSON.stringify(records, null, 2);
    zip.addFile(`${tableName}.json`, Buffer.from(tableData));
  }
  
  // Add photos if requested
  if (includePhotos && exportData.photos) {
    for (const photo of exportData.photos) {
      if (photo.storage_path_main) {
        // Note: In a real implementation, you would download the actual photo files
        // For now, we'll just include the metadata
        const photoMetadata = {
          id: photo.id,
          storage_path: photo.storage_path_main,
          phase: photo.phase,
          created_at: photo.created_at
        };
        zip.addFile(`photos/${photo.id}.json`, Buffer.from(JSON.stringify(photoMetadata, null, 2)));
      }
    }
  }
  
  // Add export summary
  const summary = {
    exported_at: exportData.export_info.exported_at,
    tenant_id: exportData.export_info.tenant_id,
    record_counts: {
      tenants: exportData.tenants.length,
      users: exportData.users.length,
      properties: exportData.properties.length,
      cleanings: exportData.cleanings.length,
      events: exportData.events.length,
      messages: exportData.messages.length,
      supplies: exportData.supplies.length,
      inventory: exportData.inventory.length,
      inventory_movements: exportData.inventory_movements.length,
      audit_log: exportData.audit_log.length
    }
  };
  
  zip.addFile('summary.json', Buffer.from(JSON.stringify(summary, null, 2)));
  
  return zip.toBuffer();
}

export async function POST(request: NextRequest) {
  // POST method for bulk export requests
  try {
    const body = await request.json();
    const { tenant_ids, format = 'json', include_photos = false } = body;
    
    if (!Array.isArray(tenant_ids) || tenant_ids.length === 0) {
      return NextResponse.json({ error: 'tenant_ids array required' }, { status: 400 });
    }
    
    // Check authentication
    const authHeader = request.headers.get('authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    // TODO: Implement proper JWT verification
    const user = {
      id: 'admin-user-123',
      tenant_id: 'tenant-123',
      role: 'admin'
    };
    
    if (user.role !== 'admin') {
      return NextResponse.json({ error: 'Forbidden - Admin role required' }, { status: 403 });
    }
    
    const supabase = getSupabaseServerClient();
    const results = [];
    
    for (const tenantId of tenant_ids) {
      try {
        const exportData = await exportTenantData(supabase, tenantId, include_photos);
        results.push({
          tenant_id: tenantId,
          success: true,
          data: exportData
        });
      } catch (error) {
        results.push({
          tenant_id: tenantId,
          success: false,
          error: error instanceof Error ? error.message : 'Unknown error'
        });
      }
    }
    
    // Log bulk export
    await logAction(
      user,
      AUDIT_ACTIONS.DATA_EXPORT,
      AUDIT_TABLES.USERS,
      undefined,
      {
        format,
        include_photos,
        tenant_count: tenant_ids.length,
        successful_exports: results.filter(r => r.success).length
      },
      request
    );
    
    return NextResponse.json({
      success: true,
      results,
      exported_at: new Date().toISOString()
    });
    
  } catch (error) {
    console.error('Error in bulk export:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}




