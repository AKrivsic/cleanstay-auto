import sharp from 'sharp';

export interface ProcessedImage {
  mainBuffer: Buffer;
  thumbBuffer: Buffer;
  ext: string;
  width: number;
  height: number;
}

// Process image: convert HEIC to JPEG, auto-rotate, resize
export async function processImage(
  buffer: Buffer, 
  contentType: string
): Promise<ProcessedImage> {
  try {
    let sharpInstance = sharp(buffer);
    
    // Get image metadata
    const metadata = await sharpInstance.metadata();
    const originalWidth = metadata.width || 0;
    const originalHeight = metadata.height || 0;
    
    // Auto-rotate based on EXIF
    sharpInstance = sharpInstance.rotate();
    
    // Process main image (max width 2000px, quality ~80)
    const mainBuffer = await sharpInstance
      .resize(2000, null, {
        withoutEnlargement: true,
        fit: 'inside'
      })
      .jpeg({
        quality: 80,
        progressive: true,
        mozjpeg: true
      })
      .toBuffer();
    
    // Create thumbnail (width 480px)
    const thumbBuffer = await sharp(buffer)
      .rotate() // Auto-rotate for thumbnail too
      .resize(480, null, {
        withoutEnlargement: true,
        fit: 'inside'
      })
      .jpeg({
        quality: 75,
        progressive: true,
        mozjpeg: true
      })
      .toBuffer();
    
    // Get final dimensions
    const mainMetadata = await sharp(mainBuffer).metadata();
    const finalWidth = mainMetadata.width || originalWidth;
    const finalHeight = mainMetadata.height || originalHeight;
    
    // Log processing metadata
    console.log('Image processed:', {
      originalSize: buffer.length,
      mainSize: mainBuffer.length,
      thumbSize: thumbBuffer.length,
      dimensions: `${finalWidth}x${finalHeight}`,
      compression: Math.round((1 - mainBuffer.length / buffer.length) * 100) + '%'
    });
    
    return {
      mainBuffer,
      thumbBuffer,
      ext: 'jpg',
      width: finalWidth,
      height: finalHeight
    };
    
  } catch (error) {
    console.error('Error processing image:', error);
    throw new Error(`Failed to process image: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

// Helper function to detect if image needs HEIC conversion
export function needsHEICConversion(contentType: string): boolean {
  return contentType === 'image/heic' || contentType === 'image/heif';
}

// Helper function to get optimal JPEG quality based on file size
export function getOptimalQuality(originalSize: number): number {
  if (originalSize < 500 * 1024) return 90; // < 500KB
  if (originalSize < 2 * 1024 * 1024) return 80; // < 2MB
  if (originalSize < 5 * 1024 * 1024) return 70; // < 5MB
  return 60; // >= 5MB
}





