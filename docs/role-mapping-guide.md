# Role Mapping Guide for CleanStay

This guide explains how to set up and manage user roles and tenant isolation in CleanStay.

## Role System Overview

### User Roles

1. **admin** - Full access to all tenants and data
2. **client** - Read-only access to their own tenant's data
3. **cleaner** - No web access (only server-side operations via webhooks)
4. **service-role** - Server-side API access (bypasses RLS)

## Setting Up User Roles

### 1. Supabase Auth Configuration

In Supabase Dashboard > Authentication > Settings:

```sql
-- Enable custom claims in JWT
-- This is done via Supabase Dashboard, not SQL
```

### 2. User Registration with Role Assignment

```typescript
// Server-side user creation with role assignment
import { createServerClient } from "@/lib/supabase/server";

export async function createUserWithRole(
  email: string,
  password: string,
  role: "admin" | "client" | "cleaner",
  tenantId: string
) {
  const supabase = createServerClient();

  // Create user in Supabase Auth
  const { data: authData, error: authError } =
    await supabase.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
    });

  if (authError) throw authError;

  // Set custom claims (role and tenant_id)
  const { error: claimsError } = await supabase.auth.admin.updateUserById(
    authData.user.id,
    {
      user_metadata: {
        role,
        tenant_id: tenantId,
      },
    }
  );

  if (claimsError) throw claimsError;

  // Create user record in our users table
  const { error: userError } = await supabase.from("users").insert({
    id: authData.user.id,
    tenant_id: tenantId,
    email,
    role,
  });

  if (userError) throw userError;

  return authData.user;
}
```

### 3. JWT Claims Structure

The JWT token should contain:

```json
{
  "sub": "user-uuid",
  "email": "user@example.com",
  "role": "client",
  "tenant_id": "tenant-uuid",
  "aud": "authenticated",
  "exp": 1234567890
}
```

## Server-Side Authorization

### 1. Middleware for Role Checking

```typescript
// src/middleware.ts
import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@/lib/supabase/server";

export async function middleware(request: NextRequest) {
  const supabase = createServerClient();

  // Get user from JWT
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();

  if (error || !user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // Extract role and tenant_id from user metadata
  const role = user.user_metadata?.role;
  const tenantId = user.user_metadata?.tenant_id;

  // Check admin access
  if (request.nextUrl.pathname.startsWith("/admin")) {
    if (role !== "admin") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }
  }

  // Check client access
  if (request.nextUrl.pathname.startsWith("/client")) {
    if (role !== "client") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }
  }

  return NextResponse.next();
}
```

### 2. API Route Authorization

```typescript
// src/app/api/admin/tenants/route.ts
import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@/lib/supabase/server";

export async function POST(request: NextRequest) {
  const supabase = createServerClient();

  // Get user and check admin role
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();

  if (error || !user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const role = user.user_metadata?.role;
  if (role !== "admin") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  // Admin can create tenants
  const { name, plan } = await request.json();

  const { data, error: createError } = await supabase
    .from("tenants")
    .insert({ name, plan })
    .select()
    .single();

  if (createError) {
    return NextResponse.json({ error: createError.message }, { status: 500 });
  }

  return NextResponse.json(data);
}
```

### 3. Client-Side Data Access

```typescript
// Client-side data fetching with automatic tenant filtering
import { createBrowserClient } from "@/lib/supabase/client";

export async function getClientCleanings() {
  const supabase = createBrowserClient();

  // RLS automatically filters by tenant_id
  const { data, error } = await supabase
    .from("cleanings")
    .select("*")
    .order("created_at", { ascending: false });

  if (error) throw error;
  return data;
}
```

## Service Role Usage

### ⚠️ CRITICAL: Never Use Service Role on Client Side

```typescript
// ❌ WRONG - Never do this on client side
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY! // This is secret!
);

// ✅ CORRECT - Use service role only on server side
// src/lib/supabase/server.ts
import { createServerClient } from "@supabase/ssr";

export function getSupabaseServerClient() {
  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!, // Only on server
    {
      cookies: {
        get: (name) => cookies().get(name)?.value,
        set: (name, value, options) => cookies().set(name, value, options),
        remove: (name, options) => cookies().remove(name, options),
      },
    }
  );
}
```

### Service Role for Webhooks

```typescript
// src/app/api/webhook/whatsapp/route.ts
import { getSupabaseServerClient } from "@/lib/supabase/server";

export async function POST(request: NextRequest) {
  // Use service role to bypass RLS for webhook data
  const supabase = getSupabaseServerClient();

  // Service role can insert messages for any tenant
  const { data, error } = await supabase.from("messages").insert({
    tenant_id: "tenant-uuid",
    property_id: "property-uuid",
    channel: "whatsapp",
    direction: "in",
    raw: messageData,
  });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}
```

## Testing Role-Based Access

### 1. Test Admin Access

```typescript
// Test admin can see all tenants
const { data: tenants } = await supabase.from("tenants").select("*");
// Should return all tenants
```

### 2. Test Client Access

```typescript
// Test client can only see their tenant
const { data: cleanings } = await supabase.from("cleanings").select("*");
// Should only return cleanings from client's tenant
```

### 3. Test Service Role Access

```typescript
// Test service role can insert for any tenant
const { data } = await supabase.from("messages").insert({
  tenant_id: "any-tenant-uuid",
  channel: "whatsapp",
  direction: "in",
  raw: { test: "message" },
});
// Should succeed regardless of tenant
```

## Security Best Practices

1. **Never expose service role key** on client side
2. **Always validate user roles** in API routes
3. **Use RLS policies** for automatic tenant filtering
4. **Set proper JWT claims** during user creation
5. **Regularly audit** user permissions and access
6. **Monitor** for unauthorized access attempts
7. **Use HTTPS** for all API communications
8. **Implement rate limiting** for sensitive endpoints






