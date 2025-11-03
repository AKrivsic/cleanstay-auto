# GDPR a Bezpečnostní vrstva - CleanStay AI

## Přehled

Tento dokument popisuje implementaci GDPR compliance a bezpečnostních opatření pro systém CleanStay AI. Systém je navržen s ohledem na minimalizaci dat, pseudonymizaci, šifrování a auditovatelnost přístupů.

## Technické vrstvy a zásady

### 1. Minimalizace dat

**Zásada:** Ukládáme pouze nezbytné údaje pro fungování služby.

**Povolené údaje:**

- `name` - jméno (pouze pro identifikaci)
- `phone` - telefonní číslo (pro komunikaci)
- `email` - email (pro notifikace)
- `language` - preferovaný jazyk

**Zakázané údaje:**

- Rodné číslo
- Adresa bydliště (kromě adresy objektu)
- Citlivé zdravotní údaje
- Finanční údaje (kromě ceníku služeb)

**Implementace:**

```sql
-- Příklad minimalizovaného user profilu
CREATE TABLE users (
  id UUID PRIMARY KEY,
  tenant_id UUID NOT NULL,
  name TEXT NOT NULL,
  phone TEXT NOT NULL,
  email TEXT,
  language TEXT DEFAULT 'cs',
  role TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
  -- Žádné další PII údaje
);
```

### 2. Pseudonymizace

**Zásada:** Uklízečky i klienti jsou identifikováni přes `tenant_id` a `user_id`, ne jménem v databázi.

**Implementace:**

- Všechny tabulky obsahují `tenant_id` pro izolaci
- Uživatelé identifikováni přes UUID, ne jménem
- Interní reference používají `user_id`, ne jméno
- Logy obsahují pouze `user_id`, ne PII

**Příklad:**

```sql
-- Audit log používá pouze ID, ne jména
INSERT INTO audit_log (
  tenant_id,
  user_id,
  action,
  table_name,
  record_id
) VALUES (
  'tenant-123',
  'user-456',
  'data_export',
  'users',
  'user-789'
);
```

### 3. Šifrování

#### Supabase Storage

- **Status:** ✅ Implementováno
- **Bucket:** `cleanstay_media` (privátní)
- **RLS:** Aktivní pro tenant izolaci
- **Signed URLs:** 48h TTL pro bezpečný přístup

#### HTTPS + JWT

- **Status:** ✅ Implementováno
- **Všechny API:** HTTPS enforced
- **Autentizace:** JWT tokeny s expirací
- **RLS:** Aktivní pro všechny tabulky

#### Tajné klíče

**Kontrola:** Žádný klíč není v klientském bundle

**Server-only klíče:**

- `SUPABASE_SERVICE_ROLE_KEY` - pouze v server API
- `OPENAI_API_KEY` - pouze v server API
- `WABA_API_KEY` - pouze v server API

**Kontrola implementace:**

```typescript
// ✅ Správně - server-only
import { getSupabaseServerClient } from "@/lib/supabase/server";

// ❌ Špatně - client-side
import { createSupabaseClient } from "@/lib/supabase/client";
```

### 4. Přístupová práva

#### RLS (Row Level Security)

**Status:** ✅ Aktivní pro všechny tabulky

**Implementace:**

```sql
-- Všechny tabulky mají RLS
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE cleanings ENABLE ROW LEVEL SECURITY;
ALTER TABLE events ENABLE ROW LEVEL SECURITY;
-- ... všechny ostatní tabulky
```

#### Role-based access

**Status:** ✅ Implementováno

**Role hierarchy:**

- `admin` - plný přístup k tenant datům
- `client` - pouze vlastní objekty a úklidy
- `cleaner` - pouze přiřazené úklidy
- `service-role` - pouze server API

**API kontrola:**

```typescript
// ✅ Správně - role kontrola
if (user.role !== "admin") {
  return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
}
```

#### Service role

**Status:** ✅ Používána pouze v server API

**Implementace:**

- Service role klíč pouze v server prostředí
- Client-side API používají RLS-enforced client
- Server API používají service role pro admin operace

### 5. Retence dat

#### Events, messages, notifications

- **Retence:** 12 měsíců
- **Anonymizace:** Po 12 měsících
- **Implementace:** Cron job pro cleanup

```sql
-- Cleanup starých events
DELETE FROM events
WHERE created_at < NOW() - INTERVAL '12 months'
AND tenant_id = 'tenant-123';
```

#### Photos

- **Retence:** 12-24 měsíců
- **Smazání:** Automatické po expiraci
- **Backup:** Před smazáním export

#### Inventory movements

- **Retence:** 24 měsíců
- **Důvod:** Účetní a daňové požadavky

### 6. Zálohy

**Status:** ✅ Supabase automatic backups

**Konfigurace:**

- **Frekvence:** 1× denně
- **Retence:** 30 dní
- **Lokace:** Supabase managed
- **Šifrování:** AES-256

### 7. Incident response

**Postup při narušení:**

1. **Detekce** (0-1h)

   - Monitoring alerts
   - Log analysis
   - User reports

2. **Kontainment** (1-2h)

   - Izolace postižených systémů
   - Změna přístupových údajů
   - Dočasné pozastavení služeb

3. **Nahlášení** (do 72h)

   - Úřad pro ochranu osobních údajů
   - Dotčené osoby
   - DPO (Data Protection Officer)

4. **Dokumentace**
   - Evidence incidentu
   - Timeline událostí
   - Rozsah narušení
   - Opatření

**Kontakty:**

- **DPO:** dpo@cleanstay.ai
- **Security:** security@cleanstay.ai
- **Emergency:** +420 123 456 789

## Audit log

### Tabulka audit_log

```sql
CREATE TABLE audit_log (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tenant_id UUID REFERENCES tenants(id),
  user_id UUID REFERENCES users(id),
  action TEXT NOT NULL,
  table_name TEXT NOT NULL,
  record_id UUID NULL,
  timestamp TIMESTAMPTZ DEFAULT NOW(),
  ip_address TEXT NULL,
  user_agent TEXT NULL,
  metadata JSONB NULL
);

-- Indexy pro výkon
CREATE INDEX idx_audit_log_tenant_id ON audit_log(tenant_id);
CREATE INDEX idx_audit_log_user_id ON audit_log(user_id);
CREATE INDEX idx_audit_log_timestamp ON audit_log(timestamp);
CREATE INDEX idx_audit_log_action ON audit_log(action);
```

### Sledované události

**Povinné události:**

- `login` - přihlášení uživatele
- `logout` - odhlášení uživatele
- `data_export` - export dat
- `data_delete` - smazání dat
- `settings_change` - změna nastavení
- `role_change` - změna role
- `upload_photo` - nahrání fotografie
- `password_change` - změna hesla
- `api_access` - přístup k API

**Implementace:**

```typescript
// src/lib/audit.ts
export async function logAction(
  user: { id: string; tenant_id: string },
  action: string,
  tableName: string,
  recordId?: string,
  metadata?: any
) {
  const supabase = getSupabaseServerClient();

  await supabase.from("audit_log").insert({
    tenant_id: user.tenant_id,
    user_id: user.id,
    action,
    table_name: tableName,
    record_id: recordId,
    ip_address: getClientIP(),
    user_agent: getUserAgent(),
    metadata,
  });
}
```

## API - GDPR compliance

### /api/admin/data/export

**Účel:** Export všech dat klienta v souladu s GDPR

**Oprávnění:** Pouze `role=admin`

**Formáty:** JSON, CSV, ZIP

**Implementace:**

```typescript
export async function GET(request: NextRequest) {
  // Kontrola role
  if (user.role !== "admin") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
  }

  // Export všech entit pro tenant_id
  const data = await exportTenantData(tenantId);

  // Log audit
  await logAction(user, "data_export", "users", null, {
    format: "json",
    records_count: data.users.length,
  });

  return NextResponse.json({ data });
}
```

### /api/admin/data/delete

**Účel:** Anonymizace dat po GDPR žádosti

**Oprávnění:** Pouze `role=admin`

**Požadavek:** `confirm=true`

**Implementace:**

```typescript
export async function POST(request: NextRequest) {
  const { confirm, user_id } = await request.json();

  if (!confirm) {
    return NextResponse.json(
      { error: "Confirmation required" },
      { status: 400 }
    );
  }

  // Anonymizace PII
  await anonymizeUserData(user_id);

  // Log audit
  await logAction(user, "data_delete", "users", user_id);

  return NextResponse.json({ success: true });
}
```

**Anonymizace:**

```sql
-- Anonymizace PII údajů
UPDATE users
SET
  name = 'Anonymized',
  email = NULL,
  phone = '***',
  gdpr_erased = true,
  erased_at = NOW()
WHERE id = 'user-123';
```

## Právní dokumenty

### Zásady ochrany osobních údajů

**Soubor:** `/docs/privacy-policy-template.md`

**Obsah:**

- Jaké údaje shromažďujeme
- Jak je používáme
- S kým je sdílíme
- Jak je chráníme
- Vaše práva (přístup, oprava, výmaz)

### Smlouva o zpracování osobních údajů (DPA)

**Soubor:** `/docs/data-processing-agreement-template.md`

**Obsah:**

- DPA s Supabase
- DPA s OpenAI
- DPA s 360dialog
- Technická a organizační opatření
- Povinnosti zpracovatele

## Test a kontrola

### Test audit log

```bash
# Test přihlášení
curl -X POST "https://api.cleanstay.ai/auth/login" \
  -d '{"email":"test@example.com","password":"password"}'

# Ověření v audit_log
SELECT * FROM audit_log WHERE action = 'login' ORDER BY timestamp DESC LIMIT 1;
```

### Test export

```bash
# Test export dat
curl -X GET "https://api.cleanstay.ai/api/admin/data/export" \
  -H "Authorization: Bearer admin-token"

# Ověření ZIP souboru
unzip -l export-tenant-123.zip
```

### Test delete

```bash
# Test anonymizace
curl -X POST "https://api.cleanstay.ai/api/admin/data/delete" \
  -H "Authorization: Bearer admin-token" \
  -d '{"confirm":true,"user_id":"user-123"}'

# Ověření anonymizace
SELECT name, email, phone, gdpr_erased FROM users WHERE id = 'user-123';
```

### Kontrola RLS

```sql
-- Test RLS - mělo by vrátit pouze tenant data
SET ROLE 'authenticated';
SET SESSION "request.jwt.claims" = '{"sub":"user-123","tenant_id":"tenant-123"}';

SELECT * FROM users; -- Pouze tenant-123 data
SELECT * FROM cleanings; -- Pouze tenant-123 data
```

### Kontrola anonymizace

```sql
-- Ověření anonymizace
SELECT
  name,
  email,
  phone,
  gdpr_erased,
  erased_at
FROM users
WHERE gdpr_erased = true;
```

## Monitoring a alerting

### Bezpečnostní metriky

- **Failed login attempts** - podezřelé aktivity
- **Data export frequency** - nadměrné exporty
- **Role changes** - změny oprávnění
- **API access patterns** - neobvyklé přístupy

### Alerty

- **High failed login rate** (>10 za hodinu)
- **Bulk data export** (>1000 záznamů)
- **Admin role changes** - okamžité upozornění
- **Suspicious API usage** - neobvyklé vzory

## Compliance checklist

### ✅ Implementováno

- [x] RLS aktivní pro všechny tabulky
- [x] Role-based access control
- [x] Audit logging
- [x] Data export API
- [x] Data anonymization API
- [x] Encrypted storage
- [x] HTTPS enforcement
- [x] Secret key protection

### 🔄 V procesu

- [ ] Automated data retention
- [ ] Incident response procedures
- [ ] Privacy policy implementation
- [ ] DPA agreements
- [ ] Security monitoring

### 📋 Plánováno

- [ ] Penetration testing
- [ ] Security audit
- [ ] GDPR compliance review
- [ ] Staff training
- [ ] Documentation updates

## Kontakty

**Data Protection Officer (DPO):**

- Email: dpo@cleanstay.ai
- Phone: +420 123 456 789

**Security Team:**

- Email: security@cleanstay.ai
- Emergency: +420 987 654 321

**Legal Team:**

- Email: legal@cleanstay.ai
- GDPR queries: gdpr@cleanstay.ai





