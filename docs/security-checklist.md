# CleanStay AI - Security Checklist

## Přehled

Tento checklist obsahuje bezpečnostní ověření pro production nasazení CleanStay AI systému.

## Před nasazením

### 1. Environment Variables

- [ ] **NEXT_PUBLIC_SUPABASE_URL** - nastaveno
- [ ] **NEXT_PUBLIC_SUPABASE_ANON_KEY** - nastaveno
- [ ] **SUPABASE_SERVICE_ROLE_KEY** - nastaveno (server only)
- [ ] **OPENAI_API_KEY** - nastaveno (server only)
- [ ] **WABA_API_KEY** - nastaveno (server only)
- [ ] **WABA_BASE_URL** - nastaveno
- [ ] **CLEANSTAY_ENABLED** - nastaveno na `true`
- [ ] **SENTRY_DSN** - nastaveno
- [ ] **JWT_SECRET** - nastaveno
- [ ] **WEBHOOK_SECRET** - nastaveno

### 2. Secret Keys Security

- [ ] **Žádný secret key v client bundle**
- [ ] **Service role key pouze v server API**
- [ ] **OpenAI API key pouze v server API**
- [ ] **WhatsApp API key pouze v server API**
- [ ] **JWT secret pouze v server API**
- [ ] **Webhook secret pouze v server API**

### 3. Database Security

- [ ] **RLS aktivní na všech tabulkách**
- [ ] **Tenant isolation funguje**
- [ ] **Admin role má plný přístup**
- [ ] **Client role má omezený přístup**
- [ ] **Cleaner role má omezený přístup**
- [ ] **Service role má plný přístup**

### 4. Storage Security

- [ ] **Media bucket není public**
- [ ] **RLS aktivní na storage**
- [ ] **Signed URLs s 48h expirací**
- [ ] **Tenant isolation na storage**
- [ ] **Admin role má plný přístup**
- [ ] **Client role má omezený přístup**

## Po nasazení

### 1. RLS Testing

**Test admin role:**
```sql
-- Měl by vidět všechna data
SELECT * FROM tenants;
SELECT * FROM users;
SELECT * FROM properties;
SELECT * FROM cleanings;
SELECT * FROM events;
```

**Test client role:**
```sql
-- Měl by vidět pouze vlastní data
SELECT * FROM properties WHERE tenant_id = 'tenant-pilot-123';
SELECT * FROM cleanings WHERE tenant_id = 'tenant-pilot-123';
SELECT * FROM events WHERE tenant_id = 'tenant-pilot-123';
```

**Test cleaner role:**
```sql
-- Měl by vidět pouze přiřazené úklidy
SELECT * FROM cleanings WHERE cleaner_id = 'cleaner-001';
SELECT * FROM events WHERE cleaner_id = 'cleaner-001';
```

### 2. Signed URL Testing

**Test expirace:**
```bash
# Získání signed URL
curl -X GET "https://cleanstay.ai/api/media/signed-url?path=media/tenant-123/prop-001/cleaning-001/before/20240122-120000-uuid.jpg"

# Ověření expirace (po 48h by měla vrátit 403)
curl -X GET "https://cleanstay.ai/api/media/signed-url?path=media/tenant-123/prop-001/cleaning-001/before/20240122-120000-uuid.jpg"
```

**Test tenant isolation:**
```bash
# Měl by vrátit 403 pro jiný tenant
curl -X GET "https://cleanstay.ai/api/media/signed-url?path=media/other-tenant/prop-001/cleaning-001/before/20240122-120000-uuid.jpg"
```

### 3. API Security Testing

**Test authentication:**
```bash
# Měl by vrátit 401 bez tokenu
curl -X GET "https://cleanstay.ai/api/admin/dashboard"

# Měl by vrátit 403 s neplatným tokenem
curl -X GET "https://cleanstay.ai/api/admin/dashboard" \
  -H "Authorization: Bearer invalid-token"
```

**Test tenant isolation:**
```bash
# Měl by vrátit pouze data pro tenant-pilot-123
curl -X GET "https://cleanstay.ai/api/admin/dashboard" \
  -H "Authorization: Bearer valid-token"
```

### 4. Webhook Security Testing

**Test signature verification:**
```bash
# Měl by vrátit 401 s neplatným signature
curl -X POST "https://cleanstay.ai/api/webhook/whatsapp" \
  -H "Content-Type: application/json" \
  -H "X-Hub-Signature-256: invalid-signature" \
  -d '{"test": "webhook"}'
```

**Test valid signature:**
```bash
# Měl by vrátit 200 s platným signature
curl -X POST "https://cleanstay.ai/api/webhook/whatsapp" \
  -H "Content-Type: application/json" \
  -H "X-Hub-Signature-256: valid-signature" \
  -d '{"test": "webhook"}'
```

### 5. Cost Limits Testing

**Test AI cost limits:**
```bash
# Měl by vrátit alert při překročení €2
curl -X POST "https://cleanstay.ai/api/ai/parse" \
  -H "Content-Type: application/json" \
  -d '{"text": "Začínám úklid 302"}'
```

**Test WhatsApp cost limits:**
```bash
# Měl by vrátit alert při překročení €5
curl -X POST "https://cleanstay.ai/api/webhook/whatsapp" \
  -H "Content-Type: application/json" \
  -d '{"test": "webhook"}'
```

## Monitoring

### 1. Error Monitoring

- [ ] **Sentry aktivní**
- [ ] **Error tracking funguje**
- [ ] **Performance monitoring funguje**
- [ ] **Alerts nastavené**

### 2. Cost Monitoring

- [ ] **AI cost monitoring aktivní**
- [ ] **WhatsApp cost monitoring aktivní**
- [ ] **Cost limits nastavené**
- [ ] **Alerts při překročení**

### 3. Uptime Monitoring

- [ ] **Health check monitoring aktivní**
- [ ] **Uptime monitoring aktivní**
- [ ] **Alerts při výpadku**
- [ ] **Response time monitoring**

## Audit

### 1. Access Logs

- [ ] **Všechny API calls logované**
- [ ] **Tenant ID v každém logu**
- [ ] **User ID v každém logu**
- [ ] **Timestamp v každém logu**

### 2. Security Events

- [ ] **Failed logins logované**
- [ ] **Permission denials logované**
- [ ] **Cost limit breaches logované**
- [ ] **Data access logované**

### 3. Data Access

- [ ] **Admin access logované**
- [ ] **Client access logované**
- [ ] **Data export logované**
- [ ] **Data deletion logované**

## Incident Response

### 1. Security Incident

**Postup:**
1. **Detekce** - Monitor logs a alerts
2. **Kontainment** - Izolace postižených systémů
3. **Eradikace** - Odstranění hrozby
4. **Recovery** - Obnovení normálních operací
5. **Learning** - Post-incident review

### 2. Data Breach

**Postup:**
1. **Detekce** - Monitor access logs
2. **Kontainment** - Zablokování přístupu
3. **Assessment** - Vyhodnocení rozsahu
4. **Notification** - Oznámení dotčeným osobám
5. **Recovery** - Obnovení bezpečnosti

### 3. Cost Overrun

**Postup:**
1. **Detekce** - Monitor cost limits
2. **Kontainment** - Zablokování služeb
3. **Analysis** - Analýza příčin
4. **Recovery** - Obnovení limitů
5. **Prevention** - Prevence opakování

## Compliance

### 1. GDPR Compliance

- [ ] **Data minimization implementováno**
- [ ] **Pseudonymization implementováno**
- [ ] **Encryption implementováno**
- [ ] **Access rights implementováno**
- [ ] **Data retention implementováno**
- [ ] **Data export implementováno**
- [ ] **Data deletion implementováno**

### 2. Security Standards

- [ ] **HTTPS enforced**
- [ ] **JWT tokens secure**
- [ ] **API rate limiting**
- [ ] **Input validation**
- [ ] **Output encoding**

### 3. Monitoring Compliance

- [ ] **Audit logs complete**
- [ ] **Security events tracked**
- [ ] **Access patterns monitored**
- [ ] **Anomaly detection active**

## Závěr

Po dokončení všech úkolů v tomto checklistu bude CleanStay AI systém připraven k bezpečnému production nasazení. Pravidelné bezpečnostní audity a monitoring zajistí kontinuální bezpečnost systému.

---

**Vytvořeno:** 2024-01-22  
**Verze:** 1.0  
**Kontakt:** security@cleanstay.ai





