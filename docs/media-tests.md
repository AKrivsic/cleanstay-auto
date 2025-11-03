# Media Processing Tests

This document provides cURL and HTTPie examples for testing the media processing system.

## Prerequisites

```bash
# Set environment variables
export BASE_URL="https://your-domain.com"
export TENANT_ID="your-tenant-id"
export CLEANER_PHONE="+420123456789"
export SERVICE_ROLE_KEY="your-service-role-key"
```

## Test Scenarios

### 1. Media Ingest Test

```bash
# Test media ingestion with valid message
curl -X POST "${BASE_URL}/api/media/ingest" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer ${SERVICE_ROLE_KEY}" \
  -d '{
    "messageId": "test-message-123",
    "from_phone": "'${CLEANER_PHONE}'",
    "tenantId": "'${TENANT_ID}'"
  }'
```

**Expected Response:**

```json
{
  "ok": true,
  "eventId": "event-uuid",
  "phase": "before",
  "storagePath": "media/tenant/property/cleaning/before/20250122-143022-uuid.jpg"
}
```

### 2. Large File Test (413 Error)

```bash
# Test with oversized file (should return 413)
curl -X POST "${BASE_URL}/api/media/ingest" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer ${SERVICE_ROLE_KEY}" \
  -d '{
    "messageId": "large-file-test",
    "from_phone": "'${CLEANER_PHONE}'",
    "tenantId": "'${TENANT_ID}'"
  }'
```

**Expected Response:**

```json
{
  "error": "File too large: 15728640 bytes (max: 10485760)"
}
```

### 3. HEIC to JPG Conversion Test

```bash
# Test HEIC conversion (requires HEIC file in message)
curl -X POST "${BASE_URL}/api/media/ingest" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer ${SERVICE_ROLE_KEY}" \
  -d '{
    "messageId": "heic-test-message",
    "from_phone": "'${CLEANER_PHONE}'",
    "tenantId": "'${TENANT_ID}'"
  }'
```

**Expected Response:**

```json
{
  "ok": true,
  "eventId": "event-uuid",
  "phase": "before",
  "storagePath": "media/tenant/property/cleaning/before/20250122-143022-uuid.jpg"
}
```

### 4. Signed URL Generation Test

```bash
# Test signed URL generation
curl -X GET "${BASE_URL}/api/media/photos?eventIds=event-uuid-1,event-uuid-2&tenantId=${TENANT_ID}" \
  -H "Authorization: Bearer ${SERVICE_ROLE_KEY}"
```

**Expected Response:**

```json
[
  {
    "eventId": "event-uuid-1",
    "mainUrl": "https://storage.supabase.co/object/sign/media/path/to/image.jpg?token=...",
    "thumbUrl": "https://storage.supabase.co/object/sign/media/path/to/image-thumb.jpg?token=...",
    "expiresAt": "2025-01-24T14:30:22.000Z",
    "phase": "before",
    "width": 1920,
    "height": 1080
  }
]
```

### 5. Signed URL Expiration Test

```bash
# Test signed URL expiration (simulate TTL)
curl -X GET "${BASE_URL}/api/media/photos?eventIds=expired-event&tenantId=${TENANT_ID}&ttlSeconds=1" \
  -H "Authorization: Bearer ${SERVICE_ROLE_KEY}"

# Wait 2 seconds, then try to access the URL
sleep 2
curl -I "https://storage.supabase.co/object/sign/media/path/to/image.jpg?token=..."
```

**Expected Response:**

```
HTTP/1.1 403 Forbidden
```

## HTTPie Examples

### 1. Media Ingest with HTTPie

```bash
http POST "${BASE_URL}/api/media/ingest" \
  messageId="test-message-123" \
  from_phone="${CLEANER_PHONE}" \
  tenantId="${TENANT_ID}" \
  Authorization:"Bearer ${SERVICE_ROLE_KEY}"
```

### 2. Get Cleaning Photos

```bash
http GET "${BASE_URL}/api/media/cleaning-photos" \
  cleaningId="cleaning-uuid" \
  tenantId="${TENANT_ID}" \
  Authorization:"Bearer ${SERVICE_ROLE_KEY}"
```

### 3. Get Property Photos

```bash
http GET "${BASE_URL}/api/media/property-photos" \
  propertyId="property-uuid" \
  tenantId="${TENANT_ID}" \
  limit=20 \
  Authorization:"Bearer ${SERVICE_ROLE_KEY}"
```

## Test Data Setup

### 1. Create Test Message

```sql
-- Insert test message with media
INSERT INTO public.messages (
  id,
  tenant_id,
  from_phone,
  direction,
  raw,
  created_at
) VALUES (
  'test-message-123',
  'your-tenant-id',
  '+420123456789',
  'in',
  '{
    "id": "test-message-123",
    "from": "+420123456789",
    "type": "image",
    "image": {
      "id": "media-id-123",
      "mime_type": "image/jpeg",
      "sha256": "abc123...",
      "file_size": 1048576
    }
  }',
  NOW()
);
```

### 2. Create Test Session

```sql
-- Insert test active session
INSERT INTO public.active_sessions (
  tenant_id,
  property_id,
  cleaner_phone,
  started_at,
  expected_end_at,
  status
) VALUES (
  'your-tenant-id',
  'property-uuid',
  '+420123456789',
  NOW(),
  NOW() + INTERVAL '4 hours',
  'open'
);
```

## Performance Tests

### 1. Concurrent Media Processing

```bash
# Test concurrent media processing
for i in {1..10}; do
  curl -X POST "${BASE_URL}/api/media/ingest" \
    -H "Content-Type: application/json" \
    -H "Authorization: Bearer ${SERVICE_ROLE_KEY}" \
    -d "{
      \"messageId\": \"concurrent-test-${i}\",
      \"from_phone\": \"${CLEANER_PHONE}\",
      \"tenantId\": \"${TENANT_ID}\"
    }" &
done
wait
```

### 2. Large Batch Processing

```bash
# Test processing 100 photos
for i in {1..100}; do
  curl -X POST "${BASE_URL}/api/media/ingest" \
    -H "Content-Type: application/json" \
    -H "Authorization: Bearer ${SERVICE_ROLE_KEY}" \
    -d "{
      \"messageId\": \"batch-test-${i}\",
      \"from_phone\": \"${CLEANER_PHONE}\",
      \"tenantId\": \"${TENANT_ID}\"
    }"
done
```

## Error Handling Tests

### 1. Invalid Message ID

```bash
curl -X POST "${BASE_URL}/api/media/ingest" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer ${SERVICE_ROLE_KEY}" \
  -d '{
    "messageId": "non-existent-message",
    "from_phone": "'${CLEANER_PHONE}'",
    "tenantId": "'${TENANT_ID}'"
  }'
```

**Expected Response:**

```json
{
  "error": "Message not found"
}
```

### 2. Missing Media

```bash
curl -X POST "${BASE_URL}/api/media/ingest" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer ${SERVICE_ROLE_KEY}" \
  -d '{
    "messageId": "text-message-without-media",
    "from_phone": "'${CLEANER_PHONE}'",
    "tenantId": "'${TENANT_ID}'"
  }'
```

**Expected Response:**

```json
{
  "error": "No media found in message"
}
```

### 3. Unsupported Media Type

```bash
curl -X POST "${BASE_URL}/api/media/ingest" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer ${SERVICE_ROLE_KEY}" \
  -d '{
    "messageId": "video-message",
    "from_phone": "'${CLEANER_PHONE}'",
    "tenantId": "'${TENANT_ID}'"
  }'
```

**Expected Response:**

```json
{
  "error": "Unsupported media type: video/mp4"
}
```

## Monitoring Tests

### 1. Check Media Statistics

```sql
SELECT * FROM public.get_media_stats('your-tenant-id');
```

### 2. Check Storage Usage

```sql
SELECT
  bucket_id,
  COUNT(*) as file_count,
  SUM(metadata->>'size')::bigint as total_size
FROM storage.objects
WHERE bucket_id = 'media'
GROUP BY bucket_id;
```

### 3. Check Orphaned Files

```sql
SELECT * FROM public.cleanup_orphaned_media();
```

## Cleanup Tests

### 1. Test Orphaned File Cleanup

```bash
# Create orphaned file
curl -X POST "${BASE_URL}/api/cron/cleanup-media" \
  -H "Authorization: Bearer ${SERVICE_ROLE_KEY}"
```

### 2. Test Old File Cleanup

```bash
# Clean up files older than 24 months
curl -X POST "${BASE_URL}/api/cron/cleanup-old-media" \
  -H "Authorization: Bearer ${SERVICE_ROLE_KEY}" \
  -d '{"olderThanMonths": 24}'
```

## Security Tests

### 1. Test RLS Policies

```bash
# Try to access photos from different tenant
curl -X GET "${BASE_URL}/api/media/photos?eventIds=event-uuid&tenantId=other-tenant-id" \
  -H "Authorization: Bearer ${SERVICE_ROLE_KEY}"
```

**Expected Response:**

```json
{
  "error": "Access denied"
}
```

### 2. Test Signed URL Security

```bash
# Test expired signed URL
curl -I "https://storage.supabase.co/object/sign/media/path/to/image.jpg?token=expired-token"
```

**Expected Response:**

```
HTTP/1.1 403 Forbidden
```

## Test Results Validation

### 1. Verify Photo Event Creation

```sql
SELECT
  id,
  phase,
  width,
  height,
  storage_path_main,
  storage_path_thumb,
  media_checksum
FROM public.events
WHERE type = 'photo'
  AND message_id = 'test-message-123';
```

### 2. Verify Storage Files

```sql
SELECT
  name,
  size,
  metadata
FROM storage.objects
WHERE bucket_id = 'media'
  AND name LIKE '%test-message-123%';
```

### 3. Verify Deduplication

```sql
-- Check for duplicate events
SELECT
  message_id,
  COUNT(*) as count
FROM public.events
WHERE type = 'photo'
GROUP BY message_id
HAVING COUNT(*) > 1;
```

## Troubleshooting

### Common Issues

1. **Media Download Fails**: Check WABA API credentials
2. **Image Processing Fails**: Check Sharp library installation
3. **Storage Upload Fails**: Check Supabase Storage configuration
4. **Signed URL Fails**: Check RLS policies and permissions

### Debug Queries

```sql
-- Check recent media events
SELECT * FROM public.media_events
WHERE start >= NOW() - INTERVAL '1 hour'
ORDER BY start DESC;

-- Check storage objects
SELECT * FROM storage.objects
WHERE bucket_id = 'media'
ORDER BY created_at DESC
LIMIT 10;

-- Check for errors in logs
SELECT * FROM public.events
WHERE type = 'photo'
  AND note LIKE '%error%';
```





