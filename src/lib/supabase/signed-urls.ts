// Signed URL generation for media files with 48h expiration
// Server-side only - NEVER use on client side

// import { createServerClient } from './server';
import { getSupabaseServerClient } from './server';

/**
 * Generate signed URL for media files with 48h expiration
 * @param filePath - Path to the file in the media bucket
 * @param expiresInHours - Expiration time in hours (default: 48)
 * @returns Signed URL or null if error
 */
export async function generateSignedUrl(
  filePath: string,
  expiresInHours: number = 48
): Promise<string | null> {
  try {
    const supabase = getSupabaseServerClient();
    
    const { data, error } = await supabase.storage
      .from('media')
      .createSignedUrl(filePath, expiresInHours * 3600); // Convert hours to seconds
    
    if (error) {
      console.error('Error generating signed URL:', error);
      return null;
    }
    
    return data.signedUrl;
  } catch (error) {
    console.error('Error generating signed URL:', error);
    return null;
  }
}

/**
 * Generate signed URL for tenant-specific media files
 * @param tenantId - Tenant UUID
 * @param filePath - Path to the file (without tenant prefix)
 * @param expiresInHours - Expiration time in hours (default: 48)
 * @returns Signed URL or null if error
 */
export async function generateTenantSignedUrl(
  tenantId: string,
  filePath: string,
  expiresInHours: number = 48
): Promise<string | null> {
  const fullPath = `${tenantId}/${filePath}`;
  return generateSignedUrl(fullPath, expiresInHours);
}

/**
 * Upload file to tenant-specific media bucket
 * @param tenantId - Tenant UUID
 * @param filePath - Path to the file (without tenant prefix)
 * @param file - File to upload
 * @returns Upload result
 */
export async function uploadTenantMedia(
  tenantId: string,
  filePath: string,
  file: File
): Promise<{ success: boolean; url?: string; error?: string }> {
  try {
    const supabase = getSupabaseServerClient();
    const fullPath = `${tenantId}/${filePath}`;
    
    const { data, error } = await supabase.storage
      .from('media')
      .upload(fullPath, file);
    
    if (error) {
      console.error('Error uploading file:', error);
      return { success: false, error: error.message };
    }
    
    // Generate signed URL for the uploaded file
    const signedUrl = await generateSignedUrl(fullPath);
    
    return { 
      success: true, 
      url: signedUrl || undefined 
    };
  } catch (error) {
    console.error('Error uploading file:', error);
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Unknown error' 
    };
  }
}

/**
 * Delete tenant-specific media file
 * @param tenantId - Tenant UUID
 * @param filePath - Path to the file (without tenant prefix)
 * @returns Delete result
 */
export async function deleteTenantMedia(
  tenantId: string,
  filePath: string
): Promise<{ success: boolean; error?: string }> {
  try {
    const supabase = getSupabaseServerClient();
    const fullPath = `${tenantId}/${filePath}`;
    
    const { error } = await supabase.storage
      .from('media')
      .remove([fullPath]);
    
    if (error) {
      console.error('Error deleting file:', error);
      return { success: false, error: error.message };
    }
    
    return { success: true };
  } catch (error) {
    console.error('Error deleting file:', error);
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Unknown error' 
    };
  }
}

/**
 * Get media file information
 * @param tenantId - Tenant UUID
 * @param filePath - Path to the file (without tenant prefix)
 * @returns Media info or null if error
 */
export async function getMediaInfo(
  tenantId: string,
  filePath: string
): Promise<{
  name: string;
  size: number;
  created_at: string;
  expires_at: string;
  is_expired: boolean;
} | null> {
  try {
    const supabase = getSupabaseServerClient();
    const fullPath = `${tenantId}/${filePath}`;
    
    const { data, error } = await supabase
      .rpc('get_media_info', { file_path: fullPath });
    
    if (error) {
      console.error('Error getting media info:', error);
      return null;
    }
    
    return data;
  } catch (error) {
    console.error('Error getting media info:', error);
    return null;
  }
}

/**
 * Clean up expired media files (run periodically)
 * @returns Number of deleted files
 */
export async function cleanupExpiredMedia(): Promise<number> {
  try {
    const supabase = getSupabaseServerClient();
    
    const { data, error } = await supabase
      .rpc('cleanup_expired_media');
    
    if (error) {
      console.error('Error cleaning up expired media:', error);
      return 0;
    }
    
    return data || 0;
  } catch (error) {
    console.error('Error cleaning up expired media:', error);
    return 0;
  }
}





