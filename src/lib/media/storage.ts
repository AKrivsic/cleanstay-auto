import { getSupabaseServerClient } from '../supabase/server';

export interface StorageMetadata {
  tenantId: string;
  propertyId: string;
  cleaningId: string;
  phase: 'before' | 'after' | 'other';
  checksum: string;
  width?: number;
  height?: number;
  originalSize: number;
  processedSize: number;
}

export interface StorageResult {
  path: string;
  url?: string;
}

// Save buffer to Supabase Storage
export async function saveToStorage(
  bucket: string,
  path: string,
  buffer: Buffer,
  contentType: string,
  metadata?: StorageMetadata
): Promise<StorageResult> {
  const supabase = getSupabaseServerClient();
  
  try {
    const { data, error } = await supabase.storage
      .from(bucket)
      .upload(path, buffer, {
        contentType,
        metadata: metadata ? {
          tenant_id: metadata.tenantId,
          property_id: metadata.propertyId,
          cleaning_id: metadata.cleaningId,
          phase: metadata.phase,
          checksum: metadata.checksum,
          width: metadata.width?.toString(),
          height: metadata.height?.toString(),
          original_size: metadata.originalSize.toString(),
          processed_size: metadata.processedSize.toString()
        } : undefined
      });

    if (error) {
      throw new Error(`Storage upload failed: ${error.message}`);
    }

    // Log safe metadata
    console.log('File saved to storage:', {
      bucket,
      path,
      size: buffer.length,
      contentType,
      phase: metadata?.phase
    });

    return {
      path: data.path,
      url: data.fullPath
    };

  } catch (error) {
    console.error('Error saving to storage:', error);
    throw new Error(`Failed to save to storage: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

// Generate signed URL for file access
export async function getSignedUrl(
  bucket: string,
  path: string,
  ttlSeconds: number = 172800 // 48 hours
): Promise<string> {
  const supabase = getSupabaseServerClient();
  
  // Validate inputs
  if (!path || !bucket) {
    console.error('Invalid parameters for getSignedUrl:', { bucket, path });
    throw new Error('Bucket and path are required');
  }

  try {
    const { data, error } = await supabase.storage
      .from(bucket)
      .createSignedUrl(path, ttlSeconds);

    if (error) {
      console.error('Supabase storage error:', {
        bucket,
        path: path.substring(0, 50) + '...',
        error: error.message,
        code: error.statusCode
      });
      throw new Error(`Failed to create signed URL: ${error.message}`);
    }

    if (!data?.signedUrl) {
      console.error('No signed URL returned from Supabase:', { bucket, path: path.substring(0, 50) + '...' });
      throw new Error('No signed URL returned');
    }

    return data.signedUrl;

  } catch (error) {
    console.error('Error creating signed URL:', {
      bucket,
      path: path?.substring(0, 50) + '...',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
    throw error;
  }
}

// Generate storage path for media files
export function generateMediaPath(
  tenantId: string,
  propertyId: string,
  cleaningId: string,
  phase: 'before' | 'after' | 'other',
  timestamp: Date,
  uuid: string,
  isThumbnail: boolean = false
): string {
  const ts = timestamp.toISOString().replace(/[-:]/g, '').replace('T', '-').split('.')[0];
  const suffix = isThumbnail ? '-thumb' : '';
  
  return `media/${tenantId}/${propertyId}/${cleaningId}/${phase}/${ts}-${uuid}${suffix}.jpg`;
}

// Delete file from storage
export async function deleteFromStorage(
  bucket: string,
  path: string
): Promise<void> {
  const supabase = getSupabaseServerClient();
  
  try {
    const { error } = await supabase.storage
      .from(bucket)
      .remove([path]);

    if (error) {
      throw new Error(`Failed to delete file: ${error.message}`);
    }

    console.log('File deleted from storage:', { bucket, path });

  } catch (error) {
    console.error('Error deleting from storage:', error);
    throw new Error(`Failed to delete file: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

// List files in storage path
export async function listStorageFiles(
  bucket: string,
  path: string,
  limit: number = 100
): Promise<Array<{ name: string; size: number; updated_at: string }>> {
  const supabase = getSupabaseServerClient();
  
  try {
    const { data, error } = await supabase.storage
      .from(bucket)
      .list(path, {
        limit,
        sortBy: { column: 'updated_at', order: 'desc' }
      });

    if (error) {
      throw new Error(`Failed to list files: ${error.message}`);
    }

    return data || [];

  } catch (error) {
    console.error('Error listing storage files:', error);
    throw new Error(`Failed to list files: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}





