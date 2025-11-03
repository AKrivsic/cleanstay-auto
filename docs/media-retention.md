# Media Retention Policy

## Overview

This document outlines the media retention policy for CleanStay's photo storage system, including recommended retention periods, cleanup procedures, and GDPR compliance measures.

## Retention Periods

### Recommended Retention

- **Active Photos**: 12-24 months
- **Thumbnails**: 6-12 months (can be regenerated)
- **Orphaned Files**: 1 hour (immediate cleanup)

### Storage Lifecycle

1. **Immediate Storage**: Photos stored in Supabase Storage bucket `media`
2. **Processing**: Images converted to JPEG, thumbnails generated
3. **Metadata**: Stored in `events` table with phase classification
4. **Access**: Signed URLs with 48-hour expiration

## Cleanup Procedures

### Automated Cleanup (n8n Job)

```json
{
  "name": "Media Cleanup Job",
  "nodes": [
    {
      "name": "Clean Orphaned Files",
      "type": "n8n-nodes-base.httpRequest",
      "parameters": {
        "url": "https://your-domain.com/api/cron/cleanup-media",
        "method": "POST",
        "headers": {
          "Authorization": "Bearer YOUR_SERVICE_ROLE_KEY"
        }
      }
    },
    {
      "name": "Delete Old Thumbnails",
      "type": "n8n-nodes-base.httpRequest",
      "parameters": {
        "url": "https://your-domain.com/api/cron/cleanup-thumbnails",
        "method": "POST",
        "headers": {
          "Authorization": "Bearer YOUR_SERVICE_ROLE_KEY"
        }
      }
    }
  ],
  "schedule": "0 2 * * *" // Daily at 2 AM
}
```

### Manual Cleanup Queries

```sql
-- Find photos older than 24 months
SELECT COUNT(*) as old_photos
FROM public.events
WHERE type = 'photo'
  AND start < NOW() - INTERVAL '24 months';

-- Find large files (>5MB)
SELECT
  storage_path_main,
  width,
  height,
  start
FROM public.events
WHERE type = 'photo'
  AND width * height > 5000000 -- Approximate pixel count
ORDER BY start DESC;

-- Find orphaned files
SELECT name, size, created_at
FROM storage.objects
WHERE bucket_id = 'media'
  AND created_at < NOW() - INTERVAL '1 hour'
  AND name NOT IN (
    SELECT storage_path_main FROM public.events WHERE type = 'photo'
    UNION
    SELECT storage_path_thumb FROM public.events WHERE type = 'photo'
  );
```

## GDPR Compliance

### Data Export

```sql
-- Export all photos for a tenant
SELECT
  e.id,
  e.phase,
  e.start,
  e.storage_path_main,
  e.storage_path_thumb,
  p.name as property_name,
  c.scheduled_start as cleaning_date
FROM public.events e
LEFT JOIN public.properties p ON e.property_id = p.id
LEFT JOIN public.cleanings c ON e.cleaning_id = c.id
WHERE e.tenant_id = 'TENANT_UUID'
  AND e.type = 'photo'
ORDER BY e.start DESC;
```

### Data Deletion

```sql
-- Delete all photos for a tenant (GDPR right to be forgotten)
DELETE FROM storage.objects
WHERE bucket_id = 'media'
  AND name LIKE 'media/TENANT_UUID/%';

DELETE FROM public.events
WHERE tenant_id = 'TENANT_UUID'
  AND type = 'photo';
```

## Storage Optimization

### Compression Settings

- **Main Images**: 80% JPEG quality, max 2000px width
- **Thumbnails**: 75% JPEG quality, 480px width
- **Format**: All images converted to JPEG for consistency

### File Organization

```
media/
├── {tenantId}/
│   ├── {propertyId}/
│   │   ├── {cleaningId}/
│   │   │   ├── before/
│   │   │   │   ├── 20250122-143022-uuid.jpg
│   │   │   │   └── 20250122-143022-uuid-thumb.jpg
│   │   │   ├── after/
│   │   │   └── other/
```

## Monitoring

### Storage Metrics

```sql
-- Storage usage by tenant
SELECT
  tenant_id,
  COUNT(*) as photo_count,
  SUM(width * height) as total_pixels,
  AVG(width * height) as avg_pixels
FROM public.events
WHERE type = 'photo'
  AND start >= NOW() - INTERVAL '30 days'
GROUP BY tenant_id
ORDER BY photo_count DESC;

-- Storage usage by phase
SELECT
  phase,
  COUNT(*) as count,
  AVG(width * height) as avg_pixels
FROM public.events
WHERE type = 'photo'
GROUP BY phase;
```

### Cost Optimization

1. **Thumbnail Cleanup**: Delete thumbnails older than 6 months
2. **Compression**: Re-compress old images with lower quality
3. **Archival**: Move old photos to cheaper storage (S3 Glacier)

## Security Considerations

### Access Control

- **RLS Policies**: Tenant isolation enforced
- **Signed URLs**: 48-hour expiration
- **Service Role**: Only for server-side operations

### Data Protection

- **No PII in Logs**: Only metadata logged
- **Checksum Validation**: File integrity verification
- **Secure Deletion**: Files permanently removed from storage

## Backup Strategy

### Automated Backups

1. **Database**: Daily backups of events table
2. **Storage**: Cross-region replication
3. **Metadata**: Export to external system

### Recovery Procedures

1. **Point-in-time Recovery**: Restore from backup
2. **File Recovery**: Re-download from WhatsApp (if available)
3. **Metadata Recovery**: Rebuild from message history

## Compliance Checklist

- [ ] Retention periods documented
- [ ] Cleanup procedures automated
- [ ] GDPR export functionality
- [ ] GDPR deletion functionality
- [ ] Access logs maintained
- [ ] Security policies enforced
- [ ] Backup procedures tested
- [ ] Cost monitoring active

## Contact Information

For questions about media retention or GDPR compliance:

- **Technical**: CleanStay Development Team
- **Legal**: Data Protection Officer
- **Operations**: System Administrator





