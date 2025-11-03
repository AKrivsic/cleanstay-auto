# Sessions Management - TTL and Conflicts

## Overview

The sessions management system handles active cleaning sessions with automatic timeout (TTL) and conflict resolution. This document explains how TTL works and how conflicts are handled.

## TTL (Time To Live) Auto-Close

### How TTL Works

1. **Session Creation**: When a session is opened, it gets an `expected_end_at` timestamp (default: 4 hours from start)
2. **Automatic Cleanup**: A cron job calls `autoCloseExpiredSessions()` to close sessions that exceeded their expected end time
3. **Timeout Events**: Auto-closed sessions get a `timeout` event logged

### TTL Configuration

```typescript
// Default session duration: 4 hours
expected_end_at: new Date(now.getTime() + 4 * 60 * 60 * 1000);
```

### Cron Job Setup

**Option 1: n8n Workflow**

```json
{
  "name": "Auto-close Expired Sessions",
  "nodes": [
    {
      "name": "HTTP Request",
      "type": "n8n-nodes-base.httpRequest",
      "parameters": {
        "url": "https://your-domain.com/api/cron/close-sessions",
        "method": "POST",
        "headers": {
          "Authorization": "Bearer YOUR_SERVICE_ROLE_KEY"
        }
      }
    }
  ],
  "schedule": "0 */2 * * *" // Every 2 hours
}
```

**Option 2: Server Job (Vercel Cron)**

```typescript
// src/app/api/cron/close-sessions/route.ts
export async function POST() {
  const closedCount = await autoCloseExpiredSessions();
  return Response.json({ closed: closedCount });
}
```

**Option 3: Supabase Edge Function**

```typescript
// supabase/functions/auto-close-sessions/index.ts
import { createClient } from "@supabase/supabase-js";

Deno.serve(async (req) => {
  const supabase = createClient(/* config */);
  const { data, error } = await supabase.rpc("auto_close_expired_sessions");
  return new Response(JSON.stringify({ closed: data }));
});
```

## Conflict Resolution

### Session Conflicts

**Scenario**: Cleaner tries to start a new session while having an active one.

**Resolution**:

1. System detects existing active session
2. Returns conflict message: `"Mám ukončit předchozí (Nikolajka 302) a pokračovat tady?"`
3. User confirms → old session closed with `reason='manual'` → new session opened
4. User declines → operation cancelled

### Property Resolution Conflicts

**Scenario**: Multiple properties match the hint.

**Resolution**:

1. System finds multiple candidates
2. Returns disambiguation: `"Myslíš Nikolajka 302, Letná 302?"`
3. User provides more specific hint
4. System resolves to single property

### Edge Cases

#### Done Without Active Session

```
User: "Hotovo"
System: "U kterého bytu ukončuješ?"
```

#### Event Without Active Session

```
User: "Došel Domestos"
System: "U kterého bytu jsi? Napiš 'Začínám úklid ...'"
```

#### Delayed Photo After Done

```
User: [sends photo 2 hours after session closed]
System: "U kterého bytu jsi? Napiš 'Začínám úklid ...'"
```

## Database Schema

### Active Sessions Table

```sql
CREATE TABLE active_sessions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL REFERENCES tenants(id),
  property_id uuid NOT NULL REFERENCES properties(id),
  cleaner_phone text NOT NULL,
  started_at timestamptz NOT NULL,
  expected_end_at timestamptz NOT NULL,
  ended_at timestamptz,
  status text NOT NULL CHECK (status IN ('open', 'closed')),
  created_at timestamptz DEFAULT now()
);

-- Unique constraint: one active session per cleaner per tenant
CREATE UNIQUE INDEX idx_active_sessions_cleaner_tenant_open
ON active_sessions (tenant_id, cleaner_phone)
WHERE status = 'open';
```

### Events Table

```sql
CREATE TABLE events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL REFERENCES tenants(id),
  property_id uuid NOT NULL REFERENCES properties(id),
  cleaning_id uuid REFERENCES cleanings(id),
  type text NOT NULL,
  start timestamptz NOT NULL,
  supply_out jsonb,
  linen_used integer,
  note text,
  photo text,
  done boolean DEFAULT false,
  created_at timestamptz DEFAULT now()
);
```

## API Endpoints

### POST /api/ingest

Processes messages and manages sessions.

**Request**:

```json
{
  "text": "Začínám úklid bytu 302",
  "from_phone": "+420123456789",
  "tenantId": "tenant-uuid"
}
```

**Response**:

```json
{
  "ok": true,
  "sessionId": "session-uuid",
  "propertyId": "property-uuid"
}
```

**Error Response**:

```json
{
  "ok": true,
  "ask": "Myslíš Nikolajka 302, Letná 302?"
}
```

### GET /api/ingest?tenantId=X&cleanerPhone=Y

Gets active session for cleaner.

**Response**:

```json
{
  "active": true,
  "sessionId": "session-uuid",
  "propertyId": "property-uuid"
}
```

## Monitoring and Logging

### Safe Logging

```typescript
console.log("Session processed:", {
  type: parsed.type,
  confidence: parsed.confidence,
  duration: `${duration}ms`,
  sessionId: result.sessionId,
  // NO PII data logged
});
```

### Error Handling

- **400**: Missing required fields
- **409**: Session conflict (handled gracefully with ask)
- **500**: Internal server error

### Metrics to Monitor

- Session duration (average, min, max)
- Auto-close rate
- Conflict resolution rate
- Message processing latency

## Testing Scenarios

### A) Happy Path

1. Start cleaning → Session opened
2. Supply out → Event appended
3. Linen used → Event appended
4. Done → Session closed

### B) Conflict Resolution

1. Start session A
2. Try to start session B → Conflict detected
3. Confirm → Session A closed, Session B opened

### C) TTL Auto-Close

1. Start session
2. Wait 4+ hours
3. Cron job runs → Session auto-closed

### D) Edge Cases

1. Done without session → Ask for property
2. Event without session → Ask to start
3. Multiple properties → Ask for disambiguation

## Production Deployment

### Environment Variables

```env
CLEANSTAY_ENABLED=true
SUPABASE_SERVICE_ROLE_KEY=your_key
```

### Database Migrations

```bash
supabase db push
```

### Cron Setup

Choose one of the TTL options above and configure accordingly.

### Monitoring

Set up alerts for:

- High session conflict rate
- Long processing times
- Auto-close failures
- Database connection issues

## Troubleshooting

### Common Issues

1. **Sessions not auto-closing**

   - Check cron job is running
   - Verify `expected_end_at` timestamps
   - Check database permissions

2. **Conflicts not resolving**

   - Verify unique index exists
   - Check session status updates
   - Review error messages

3. **Property resolution failing**
   - Check property names in database
   - Verify search query logic
   - Review hint matching algorithm

### Debug Queries

```sql
-- Check active sessions
SELECT * FROM active_sessions WHERE status = 'open';

-- Check expired sessions
SELECT * FROM active_sessions
WHERE status = 'open' AND expected_end_at < NOW();

-- Check session events
SELECT * FROM events
WHERE property_id = 'property-uuid'
ORDER BY start DESC;
```

## Security Considerations

- All operations use RLS policies
- Service role key only used server-side
- No PII data in logs
- Input validation on all endpoints
- Rate limiting recommended for production





