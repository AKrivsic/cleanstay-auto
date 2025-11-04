import { getWABAConfig } from '../env';
import crypto from 'crypto';

export interface MediaDownloadResult {
  buffer: Buffer;
  contentType: string;
  checksum: string;
  size: number;
}

export interface WhatsAppMediaInfo {
  id: string;
  mime_type: string;
  sha256: string;
  file_size?: number;
}

// Download media from WhatsApp Business API
export async function downloadWhatsAppMedia(mediaInfo: WhatsAppMediaInfo): Promise<MediaDownloadResult> {
  const wabaConfig = getWABAConfig();
  
  if (!wabaConfig?.apiKey || !wabaConfig?.baseUrl) {
    throw new Error('WABA configuration missing');
  }

  const { apiKey, baseUrl } = wabaConfig;
  
  // Validate content type
  const allowedTypes = ['image/jpeg', 'image/png', 'image/heic', 'image/webp'];
  if (!allowedTypes.includes(mediaInfo.mime_type)) {
    throw new Error(`Unsupported media type: ${mediaInfo.mime_type}`);
  }

  // Check file size limit (10 MB)
  const maxSize = 10 * 1024 * 1024; // 10 MB
  if (mediaInfo.file_size && mediaInfo.file_size > maxSize) {
    throw new Error(`File too large: ${mediaInfo.file_size} bytes (max: ${maxSize})`);
  }

  try {
    // Download media from WhatsApp API
    const response = await fetch(`${baseUrl}/media/${mediaInfo.id}`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Accept': mediaInfo.mime_type
      }
    });

    if (!response.ok) {
      throw new Error(`Failed to download media: ${response.status} ${response.statusText}`);
    }

    // Get content type from response
    const contentType = response.headers.get('content-type') || mediaInfo.mime_type;
    
    // Validate response content type
    if (!allowedTypes.includes(contentType)) {
      throw new Error(`Invalid content type in response: ${contentType}`);
    }

    // Read buffer
    const buffer = Buffer.from(await response.arrayBuffer());
    
    // Check actual file size
    if (buffer.length > maxSize) {
      throw new Error(`Downloaded file too large: ${buffer.length} bytes (max: ${maxSize})`);
    }

    // Calculate SHA-256 checksum
    const checksum = crypto.createHash('sha256').update(buffer).digest('hex');
    
    // Verify checksum if provided by WhatsApp
    if (mediaInfo.sha256 && checksum !== mediaInfo.sha256) {
      throw new Error('Checksum mismatch - file may be corrupted');
    }

    // Log safe metadata
    console.log('Media downloaded:', {
      mediaId: mediaInfo.id,
      contentType,
      size: buffer.length,
      checksum: checksum.substring(0, 8) + '...' // Only first 8 chars for security
    });

    return {
      buffer,
      contentType,
      checksum,
      size: buffer.length
    };

  } catch (error) {
    console.error('Error downloading WhatsApp media:', error);
    throw new Error(`Failed to download media: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

// Helper function to validate media info
export function validateMediaInfo(mediaInfo: any): WhatsAppMediaInfo {
  if (!mediaInfo.id || !mediaInfo.mime_type) {
    throw new Error('Invalid media info: missing id or mime_type');
  }

  return {
    id: mediaInfo.id,
    mime_type: mediaInfo.mime_type,
    sha256: mediaInfo.sha256,
    file_size: mediaInfo.file_size
  };
}





