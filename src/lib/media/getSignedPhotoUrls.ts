import { getSupabaseServerClient } from '../supabase/server';
import { getSignedUrl } from './storage';

export interface PhotoUrl {
  eventId: string;
  mainUrl: string;
  thumbUrl: string;
  expiresAt: string;
  phase: 'before' | 'after' | 'other';
  width: number;
  height: number;
}

export interface PhotoUrlRequest {
  eventIds?: string[];
  paths?: string[];
  tenantId: string;
  ttlSeconds?: number;
}

// Get signed URLs for photos by event IDs or paths
export async function getSignedPhotoUrls(request: PhotoUrlRequest): Promise<PhotoUrl[]> {
  const { eventIds, paths, tenantId, ttlSeconds = 172800 } = request; // 48 hours default
  
  if (!eventIds && !paths) {
    throw new Error('Either eventIds or paths must be provided');
  }

  const supabase = getSupabaseServerClient();
  const results: PhotoUrl[] = [];

  try {
    if (eventIds && eventIds.length > 0) {
      // Get photo events from database
      const { data: events, error } = await supabase
        .from('events')
        .select(`
          id,
          storage_path_main,
          storage_path_thumb,
          phase,
          width,
          height,
          start
        `)
        .eq('tenant_id', tenantId)
        .eq('type', 'photo')
        .in('id', eventIds);

      if (error) {
        throw new Error(`Failed to fetch photo events: ${error.message}`);
      }

      if (!events || events.length === 0) {
        return [];
      }

      // Generate signed URLs for each event
      for (const event of events) {
        try {
          const mainUrl = await getSignedUrl('media', event.storage_path_main, ttlSeconds);
          const thumbUrl = await getSignedUrl('media', event.storage_path_thumb, ttlSeconds);
          
          const expiresAt = new Date(Date.now() + ttlSeconds * 1000).toISOString();
          
          results.push({
            eventId: event.id,
            mainUrl,
            thumbUrl,
            expiresAt,
            phase: event.phase,
            width: event.width || 0,
            height: event.height || 0
          });
        } catch (error) {
          console.error(`Failed to generate signed URL for event ${event.id}:`, error);
          // Continue with other events
        }
      }
    }

    if (paths && paths.length > 0) {
      // Generate signed URLs for direct paths
      for (const path of paths) {
        try {
          const mainUrl = await getSignedUrl('media', path, ttlSeconds);
          const thumbUrl = await getSignedUrl('media', path.replace('.jpg', '-thumb.jpg'), ttlSeconds);
          
          const expiresAt = new Date(Date.now() + ttlSeconds * 1000).toISOString();
          
          results.push({
            eventId: '', // No event ID for direct paths
            mainUrl,
            thumbUrl,
            expiresAt,
            phase: 'other', // Unknown phase for direct paths
            width: 0,
            height: 0
          });
        } catch (error) {
          console.error(`Failed to generate signed URL for path ${path}:`, error);
          // Continue with other paths
        }
      }
    }

    // Log safe metadata
    console.log('Generated signed URLs:', {
      count: results.length,
      ttlSeconds,
      tenantId: tenantId.substring(0, 8) + '...' // Only first 8 chars for security
    });

    return results;

  } catch (error) {
    console.error('Error generating signed photo URLs:', error);
    throw new Error(`Failed to generate signed URLs: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

// Get photos for a specific cleaning session
export async function getCleaningPhotos(
  tenantId: string,
  cleaningId: string,
  ttlSeconds: number = 172800
): Promise<PhotoUrl[]> {
  const supabase = getSupabaseServerClient();

  try {
    const { data: events, error } = await supabase
      .from('events')
      .select(`
        id,
        storage_path_main,
        storage_path_thumb,
        phase,
        width,
        height,
        start
      `)
      .eq('tenant_id', tenantId)
      .eq('cleaning_id', cleaningId)
      .eq('type', 'photo')
      .order('start', { ascending: false });

    if (error) {
      throw new Error(`Failed to fetch cleaning photos: ${error.message}`);
    }

    if (!events || events.length === 0) {
      return [];
    }

    return await getSignedPhotoUrls({
      eventIds: events.map((e: any) => e.id),
      tenantId,
      ttlSeconds
    });

  } catch (error) {
    console.error('Error getting cleaning photos:', error);
    throw new Error(`Failed to get cleaning photos: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

// Get photos for a specific property
export async function getPropertyPhotos(
  tenantId: string,
  propertyId: string,
  limit: number = 50,
  ttlSeconds: number = 172800
): Promise<PhotoUrl[]> {
  const supabase = getSupabaseServerClient();

  try {
    const { data: events, error } = await supabase
      .from('events')
      .select(`
        id,
        storage_path_main,
        storage_path_thumb,
        phase,
        width,
        height,
        start
      `)
      .eq('tenant_id', tenantId)
      .eq('property_id', propertyId)
      .eq('type', 'photo')
      .order('start', { ascending: false })
      .limit(limit);

    if (error) {
      throw new Error(`Failed to fetch property photos: ${error.message}`);
    }

    if (!events || events.length === 0) {
      return [];
    }

    return await getSignedPhotoUrls({
      eventIds: events.map((e: any) => e.id),
      tenantId,
      ttlSeconds
    });

  } catch (error) {
    console.error('Error getting property photos:', error);
    throw new Error(`Failed to get property photos: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

// Helper function to check if signed URL is expired
export function isUrlExpired(expiresAt: string): boolean {
  return new Date(expiresAt) <= new Date();
}

// Helper function to get time until expiration
export function getTimeUntilExpiration(expiresAt: string): number {
  const expiration = new Date(expiresAt).getTime();
  const now = Date.now();
  return Math.max(0, expiration - now);
}




