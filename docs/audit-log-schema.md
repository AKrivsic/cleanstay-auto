# Audit Log Schema - CleanStay AI

## Přehled

Audit log je klíčovou součástí GDPR compliance a bezpečnostního monitoringu systému CleanStay AI. Tento dokument popisuje strukturu tabulky `audit_log`, příklady zápisů a způsoby použití.

## Databázová struktura

### Tabulka audit_log

```sql
CREATE TABLE audit_log (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  user_id UUID REFERENCES users(id) ON DELETE SET NULL,
  action TEXT NOT NULL,
  table_name TEXT NOT NULL,
  record_id UUID NULL,
  timestamp TIMESTAMPTZ DEFAULT NOW(),
  ip_address TEXT NULL,
  user_agent TEXT NULL,
  metadata JSONB NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

### Popis sloupců

| Sloupec      | Typ         | Popis                                        | Povinný |
| ------------ | ----------- | -------------------------------------------- | ------- |
| `id`         | UUID        | Jedinečný identifikátor záznamu              | Ano     |
| `tenant_id`  | UUID        | Identifikátor tenanta (multi-tenant izolace) | Ano     |
| `user_id`    | UUID        | Identifikátor uživatele, který provedl akci  | Ne      |
| `action`     | TEXT        | Typ provedené akce                           | Ano     |
| `table_name` | TEXT        | Název ovlivněné tabulky                      | Ano     |
| `record_id`  | UUID        | Identifikátor konkrétního záznamu            | Ne      |
| `timestamp`  | TIMESTAMPTZ | Čas provedení akce                           | Ano     |
| `ip_address` | TEXT        | IP adresa uživatele                          | Ne      |
| `user_agent` | TEXT        | User-Agent string                            | Ne      |
| `metadata`   | JSONB       | Dodatečné informace o akci                   | Ne      |
| `created_at` | TIMESTAMPTZ | Čas vytvoření záznamu                        | Ano     |

### Indexy

```sql
-- Základní indexy pro výkon
CREATE INDEX idx_audit_log_tenant_id ON audit_log(tenant_id);
CREATE INDEX idx_audit_log_user_id ON audit_log(user_id);
CREATE INDEX idx_audit_log_timestamp ON audit_log(timestamp);
CREATE INDEX idx_audit_log_action ON audit_log(action);
CREATE INDEX idx_audit_log_table_name ON audit_log(table_name);
CREATE INDEX idx_audit_log_created_at ON audit_log(created_at);

-- Kompozitní indexy pro běžné dotazy
CREATE INDEX idx_audit_log_tenant_timestamp ON audit_log(tenant_id, timestamp);
CREATE INDEX idx_audit_log_user_timestamp ON audit_log(user_id, timestamp);
```

## Typy akcí

### Autentizace

```typescript
const AUTH_ACTIONS = {
  LOGIN: "login",
  LOGOUT: "logout",
  PASSWORD_CHANGE: "password_change",
  PASSWORD_RESET: "password_reset",
  TWO_FACTOR_ENABLE: "two_factor_enable",
  TWO_FACTOR_DISABLE: "two_factor_disable",
};
```

### Správa dat

```typescript
const DATA_ACTIONS = {
  DATA_EXPORT: "data_export",
  DATA_DELETE: "data_delete",
  DATA_ANONYMIZE: "data_anonymize",
  DATA_ACCESS: "data_access",
  DATA_MODIFY: "data_modify",
};
```

### Správa uživatelů

```typescript
const USER_ACTIONS = {
  USER_CREATE: "user_create",
  USER_UPDATE: "user_update",
  USER_DELETE: "user_delete",
  ROLE_CHANGE: "role_change",
  PERMISSION_CHANGE: "permission_change",
};
```

### Systémové akce

```typescript
const SYSTEM_ACTIONS = {
  SYSTEM_ACTION: "system_action",
  AUDIT_CLEANUP: "audit_cleanup",
  MIGRATION: "migration",
  BACKUP_CREATE: "backup_create",
  BACKUP_RESTORE: "backup_restore",
};
```

## Příklady zápisů

### 1. Přihlášení uživatele

```json
{
  "id": "550e8400-e29b-41d4-a716-446655440000",
  "tenant_id": "tenant-123",
  "user_id": "user-456",
  "action": "login",
  "table_name": "users",
  "record_id": "user-456",
  "timestamp": "2024-01-22T10:30:00Z",
  "ip_address": "192.168.1.100",
  "user_agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
  "metadata": {
    "login_method": "email",
    "success": true,
    "session_id": "sess-789"
  }
}
```

### 2. Export dat

```json
{
  "id": "550e8400-e29b-41d4-a716-446655440001",
  "tenant_id": "tenant-123",
  "user_id": "user-456",
  "action": "data_export",
  "table_name": "users",
  "record_id": null,
  "timestamp": "2024-01-22T11:00:00Z",
  "ip_address": "192.168.1.100",
  "user_agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
  "metadata": {
    "format": "json",
    "include_photos": true,
    "records_count": {
      "users": 150,
      "cleanings": 500,
      "events": 2000
    },
    "file_size": "2.5MB"
  }
}
```

### 3. Anonymizace dat

```json
{
  "id": "550e8400-e29b-41d4-a716-446655440002",
  "tenant_id": "tenant-123",
  "user_id": "user-456",
  "action": "data_anonymize",
  "table_name": "users",
  "record_id": "user-789",
  "timestamp": "2024-01-22T12:00:00Z",
  "ip_address": "192.168.1.100",
  "user_agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
  "metadata": {
    "target_user_id": "user-789",
    "anonymize_only": true,
    "records_affected": 25,
    "tables_affected": ["users", "messages", "events"],
    "reason": "GDPR request"
  }
}
```

### 4. Změna role

```json
{
  "id": "550e8400-e29b-41d4-a716-446655440003",
  "tenant_id": "tenant-123",
  "user_id": "user-456",
  "action": "role_change",
  "table_name": "users",
  "record_id": "user-789",
  "timestamp": "2024-01-22T13:00:00Z",
  "ip_address": "192.168.1.100",
  "user_agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
  "metadata": {
    "target_user_id": "user-789",
    "old_role": "client",
    "new_role": "admin",
    "changed_by": "user-456",
    "reason": "Promotion to admin"
  }
}
```

### 5. Nahrání fotografie

```json
{
  "id": "550e8400-e29b-41d4-a716-446655440004",
  "tenant_id": "tenant-123",
  "user_id": "user-456",
  "action": "upload_photo",
  "table_name": "events",
  "record_id": "event-789",
  "timestamp": "2024-01-22T14:00:00Z",
  "ip_address": "192.168.1.100",
  "user_agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
  "metadata": {
    "cleaning_id": "cleaning-123",
    "property_id": "property-456",
    "file_size": "1.2MB",
    "file_type": "image/jpeg",
    "storage_path": "media/tenant-123/property-456/cleaning-123/before/20240122-140000-abc123.jpg",
    "phase": "before"
  }
}
```

### 6. Systémová akce

```json
{
  "id": "550e8400-e29b-41d4-a716-446655440005",
  "tenant_id": "tenant-123",
  "user_id": null,
  "action": "audit_cleanup",
  "table_name": "audit_log",
  "record_id": null,
  "timestamp": "2024-01-22T15:00:00Z",
  "ip_address": null,
  "user_agent": null,
  "metadata": {
    "deleted_count": 1500,
    "retention_months": 12,
    "cutoff_date": "2023-01-22T15:00:00Z",
    "executed_by": "cron_job"
  }
}
```

## RLS (Row Level Security)

### Politiky

```sql
-- Admin může vidět všechny audit logy pro svůj tenant
CREATE POLICY "admin_can_view_audit_logs" ON audit_log
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND users.tenant_id = audit_log.tenant_id
      AND users.role = 'admin'
    )
  );

-- Service role může vkládat audit logy
CREATE POLICY "service_role_can_insert_audit_logs" ON audit_log
  FOR INSERT
  TO service_role
  WITH CHECK (true);

-- Uživatelé mohou vidět své vlastní audit logy
CREATE POLICY "users_can_view_own_audit_logs" ON audit_log
  FOR SELECT
  TO authenticated
  USING (
    user_id = auth.uid()
    AND EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND users.tenant_id = audit_log.tenant_id
    )
  );
```

## Funkce pro práci s audit logem

### Logování akce

```typescript
// Logování uživatelské akce
await logAction(
  user,
  "data_export",
  "users",
  undefined,
  {
    format: "json",
    records_count: 150,
  },
  request
);

// Logování systémové akce
await logSystemAction(tenantId, "audit_cleanup", "audit_log", undefined, {
  deleted_count: 1500,
  retention_months: 12,
});
```

### Získání audit logu

```typescript
// Audit log pro konkrétního uživatele
const userAuditLog = await getUserAuditLog(
  tenantId,
  userId,
  100, // limit
  0 // offset
);

// Audit log pro tenant
const tenantAuditLog = await getTenantAuditLog(
  tenantId,
  100, // limit
  0, // offset
  "data_export" // action filter
);

// Audit log pro konkrétní záznam
const recordAuditLog = await getRecordAuditLog(tenantId, "users", recordId);
```

### Statistiky

```typescript
// Statistiky audit logu
const stats = await getAuditStatistics(
  tenantId,
  30 // days
);

console.log(stats);
// {
//   totalActions: 1500,
//   actionsByType: {
//     'login': 500,
//     'data_export': 50,
//     'upload_photo': 200
//   },
//   actionsByUser: {
//     'user-123': 300,
//     'user-456': 200
//   },
//   actionsByTable: {
//     'users': 400,
//     'cleanings': 300
//   },
//   dailyActivity: [
//     { date: '2024-01-22', count: 50 },
//     { date: '2024-01-21', count: 45 }
//   ]
// }
```

## Čištění starých záznamů

### Automatické čištění

```typescript
// Čištění starých audit logů
const deletedCount = await cleanupOldAuditLogs(
  tenantId,
  12 // retention months
);

console.log(`Deleted ${deletedCount} old audit log entries`);
```

### SQL funkce

```sql
-- Funkce pro čištění starých audit logů
CREATE OR REPLACE FUNCTION cleanup_old_audit_logs(
  p_tenant_id UUID,
  p_retention_months INTEGER DEFAULT 12
) RETURNS INTEGER AS $$
DECLARE
  v_deleted_count INTEGER;
BEGIN
  DELETE FROM audit_log
  WHERE tenant_id = p_tenant_id
    AND created_at < NOW() - INTERVAL '1 month' * p_retention_months;

  GET DIAGNOSTICS v_deleted_count = ROW_COUNT;

  -- Log the cleanup action
  PERFORM log_system_action(
    p_tenant_id,
    'audit_cleanup',
    'audit_log',
    NULL,
    jsonb_build_object(
      'deleted_count', v_deleted_count,
      'retention_months', p_retention_months
    )
  );

  RETURN v_deleted_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
```

## Monitoring a alerting

### Bezpečnostní metriky

```sql
-- Počet neúspěšných přihlášení za hodinu
SELECT COUNT(*) as failed_logins
FROM audit_log
WHERE action = 'login'
  AND metadata->>'success' = 'false'
  AND timestamp > NOW() - INTERVAL '1 hour';

-- Počet exportů dat za den
SELECT COUNT(*) as data_exports
FROM audit_log
WHERE action = 'data_export'
  AND timestamp > NOW() - INTERVAL '1 day';

-- Počet změn rolí za týden
SELECT COUNT(*) as role_changes
FROM audit_log
WHERE action = 'role_change'
  AND timestamp > NOW() - INTERVAL '1 week';
```

### Alerty

```typescript
// Alert na vysoký počet neúspěšných přihlášení
if (failedLogins > 10) {
  await sendAlert("High failed login rate detected");
}

// Alert na nadměrné exporty dat
if (dataExports > 100) {
  await sendAlert("Excessive data export activity detected");
}

// Alert na změny rolí
if (roleChanges > 0) {
  await sendAlert("Role changes detected");
}
```

## GDPR compliance

### Právo na přístup

```typescript
// Export audit logu pro konkrétního uživatele
const userAuditLog = await getUserAuditLog(tenantId, userId);
const exportData = {
  user_id: userId,
  audit_entries: userAuditLog,
  exported_at: new Date().toISOString(),
};
```

### Právo na výmaz

```typescript
// Anonymizace audit logu při GDPR výmazu
await supabase
  .from("audit_log")
  .update({
    user_id: null,
    metadata: null,
    gdpr_erased: true,
  })
  .eq("tenant_id", tenantId)
  .eq("user_id", userId);
```

## Best practices

### 1. Logování

- **Logujte všechny důležité akce**
- **Používejte konzistentní názvy akcí**
- **Ukládejte relevantní metadata**
- **Nepoužívejte PII v metadata**

### 2. Výkon

- **Pravidelně čistěte staré záznamy**
- **Používejte indexy pro běžné dotazy**
- **Omezte počet záznamů v dotazech**
- **Používejte paginaci**

### 3. Bezpečnost

- **Chraňte audit log před neoprávněným přístupem**
- **Používejte RLS pro izolaci tenantů**
- **Monitorujte podezřelé aktivity**
- **Pravidelně audit audit log**

### 4. Compliance

- **Zachovávejte záznamy podle právních požadavků**
- **Umožněte export pro GDPR**
- **Implementujte anonymizaci**
- **Dokumentujte procesy**

## Troubleshooting

### Časté problémy

1. **Pomalé dotazy**

   - Zkontrolujte indexy
   - Omezte časový rozsah
   - Používejte paginaci

2. **Chybějící záznamy**

   - Zkontrolujte RLS politiky
   - Ověřte oprávnění
   - Zkontrolujte logy chyb

3. **Velké metadata**
   - Omezte velikost JSON
   - Odstraňte nepotřebné údaje
   - Komprimujte data

### Debug dotazy

```sql
-- Kontrola RLS
SET ROLE 'authenticated';
SET SESSION "request.jwt.claims" = '{"sub":"user-123","tenant_id":"tenant-123"}';
SELECT * FROM audit_log LIMIT 10;

-- Kontrola indexů
EXPLAIN ANALYZE SELECT * FROM audit_log
WHERE tenant_id = 'tenant-123'
  AND timestamp > NOW() - INTERVAL '1 day';

-- Kontrola velikosti tabulky
SELECT
  schemaname,
  tablename,
  pg_size_pretty(pg_total_relation_size(schemaname||'.'||tablename)) as size
FROM pg_tables
WHERE tablename = 'audit_log';
```





