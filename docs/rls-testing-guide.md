# RLS Testing Guide for CleanStay

This guide provides test scenarios to verify Row Level Security (RLS) policies are working correctly.

## Test Setup

### 1. Create Test Users

```sql
-- Create test tenant
INSERT INTO public.tenants (name, plan) VALUES ('Test Tenant', 'pro') RETURNING id;

-- Create test users with different roles
INSERT INTO public.users (tenant_id, email, name, role) VALUES
  ((SELECT id FROM public.tenants WHERE name = 'Test Tenant'), 'admin@test.com', 'Test Admin', 'admin'),
  ((SELECT id FROM public.tenants WHERE name = 'Test Tenant'), 'client@test.com', 'Test Client', 'client'),
  ((SELECT id FROM public.tenants WHERE name = 'Test Tenant'), 'cleaner@test.com', 'Test Cleaner', 'cleaner');
```

### 2. Set JWT Claims for Testing

In Supabase Studio, go to Authentication > Users and set custom claims:

```json
{
  "tenant_id": "your-tenant-uuid",
  "role": "admin" // or "client" or "cleaner"
}
```

## Test Scenarios

### Scenario 1: Admin Access (Full Access)

**Setup:** Set user role to "admin" in JWT claims

**Tests:**

```sql
-- Should return all tenants
SELECT * FROM public.tenants;

-- Should return all users
SELECT * FROM public.users;

-- Should return all properties
SELECT * FROM public.properties;

-- Should return all cleanings
SELECT * FROM public.cleanings;

-- Should return all events
SELECT * FROM public.events;

-- Should return all messages
SELECT * FROM public.messages;
```

**Expected Result:** All queries return data from all tenants.

### Scenario 2: Client Access (Tenant-Scoped)

**Setup:** Set user role to "client" and tenant_id in JWT claims

**Tests:**

```sql
-- Should return only own tenant
SELECT * FROM public.tenants WHERE id = 'your-tenant-uuid';

-- Should return only users from own tenant
SELECT * FROM public.users WHERE tenant_id = 'your-tenant-uuid';

-- Should return only properties from own tenant
SELECT * FROM public.properties WHERE tenant_id = 'your-tenant-uuid';

-- Should return only cleanings from own tenant
SELECT * FROM public.cleanings WHERE tenant_id = 'your-tenant-uuid';

-- Should return only events from own tenant
SELECT * FROM public.events WHERE tenant_id = 'your-tenant-uuid';

-- Should return only messages from own tenant
SELECT * FROM public.messages WHERE tenant_id = 'your-tenant-uuid';
```

**Expected Result:** All queries return only data from the client's tenant.

### Scenario 3: Cleaner Access (No Web Access)

**Setup:** Set user role to "cleaner" in JWT claims

**Tests:**

```sql
-- Should return empty (no policies for cleaners)
SELECT * FROM public.tenants;
SELECT * FROM public.users;
SELECT * FROM public.properties;
SELECT * FROM public.cleanings;
SELECT * FROM public.events;
SELECT * FROM public.messages;
```

**Expected Result:** All queries return empty results (cleaners have no web access).

### Scenario 4: Service Role Access (Server API)

**Setup:** Use service_role key in API calls

**Tests:**

```sql
-- Should be able to insert messages for any tenant
INSERT INTO public.messages (tenant_id, property_id, channel, direction, raw) VALUES
  ('tenant-uuid', 'property-uuid', 'whatsapp', 'in', '{"test": "message"}');

-- Should be able to manage active sessions
INSERT INTO public.active_sessions (tenant_id, user_id, session_token, device, ip) VALUES
  ('tenant-uuid', 'user-uuid', 'test-token', 'iPhone', '192.168.1.1'::inet);
```

**Expected Result:** Service role can insert data for any tenant.

### Scenario 5: Media Signed URLs

**Setup:** Upload a test file to the media bucket

**Tests:**

```sql
-- Generate signed URL
SELECT public.generate_signed_url('test-file.jpg', 48);

-- Generate tenant-specific signed URL
SELECT public.generate_tenant_signed_url('tenant-uuid', 'test-file.jpg', 48);

-- Check media info
SELECT * FROM public.get_media_info('tenant-uuid/test-file.jpg');
```

**Expected Result:**

- Signed URLs are generated successfully
- URLs expire after 48 hours
- Media info shows correct expiration

### Scenario 6: Cross-Tenant Data Isolation

**Setup:** Create two tenants with different data

**Tests:**

```sql
-- Client from Tenant A should not see Tenant B data
-- (Run as client from Tenant A)
SELECT * FROM public.cleanings; -- Should only return Tenant A cleanings

-- (Run as client from Tenant B)
SELECT * FROM public.cleanings; -- Should only return Tenant B cleanings
```

**Expected Result:** Clients can only see their own tenant's data.

## Automated Testing Script

```sql
-- Test RLS policies automatically
DO $$
DECLARE
  test_tenant_id uuid;
  test_user_id uuid;
  result_count integer;
BEGIN
  -- Create test tenant
  INSERT INTO public.tenants (name, plan) VALUES ('RLS Test Tenant', 'pro') RETURNING id INTO test_tenant_id;

  -- Create test user
  INSERT INTO public.users (tenant_id, email, name, role) VALUES
    (test_tenant_id, 'test@rls.com', 'RLS Test User', 'client') RETURNING id INTO test_user_id;

  -- Test client access
  SELECT COUNT(*) INTO result_count FROM public.cleanings WHERE tenant_id = test_tenant_id;

  IF result_count = 0 THEN
    RAISE NOTICE 'RLS Test PASSED: Client can only see own tenant data';
  ELSE
    RAISE NOTICE 'RLS Test FAILED: Client can see other tenant data';
  END IF;

  -- Cleanup
  DELETE FROM public.users WHERE id = test_user_id;
  DELETE FROM public.tenants WHERE id = test_tenant_id;
END $$;
```

## Troubleshooting

### Common Issues:

1. **JWT claims not set correctly**

   - Check Authentication > Users in Supabase Studio
   - Verify custom claims are properly formatted

2. **RLS policies not working**

   - Ensure RLS is enabled on all tables
   - Check policy conditions are correct

3. **Service role access issues**

   - Verify service_role key is used in server-side code
   - Check policies allow service_role access

4. **Media access issues**
   - Verify storage bucket exists
   - Check file paths are correct
   - Ensure signed URLs are generated properly






