# CleanStay AI - Manager Playbook

## Přehled

Tento playbook obsahuje postupy pro manažery při řízení CleanStay AI systému, řešení konfliktů sessions a generování reportů.

## Dashboard přístup

### Admin Dashboard
**URL:** `https://cleanstay.ai/admin/dashboard`

**Funkce:**
- Přehled všech úklidů
- Real-time monitoring
- Správa zásob
- Generování reportů

### Monitoring Dashboard
**URL:** `https://cleanstay.ai/admin/dashboard/metrics`

**Funkce:**
- Nákladové metriky
- Výkonnostní KPI
- Cost limits monitoring
- Trend analýza

## Řešení konfliktů sessions

### Problém: Dvě uklízečky začaly úklid ve stejném bytě

**Příznaky:**
- Systém hlásí "Session already exists"
- Dvě uklízečky vidí stejný byt jako aktivní
- Konflikt v `active_sessions` tabulce

**Řešení:**
1. **Identifikace konfliktu**
   ```sql
   SELECT * FROM active_sessions 
   WHERE property_id = 'prop-XXX' 
   AND status = 'open';
   ```

2. **Ukončení staré session**
   ```sql
   UPDATE active_sessions 
   SET status = 'closed', 
       ended_at = NOW(),
       reason = 'conflict_resolution'
   WHERE id = 'old-session-id';
   ```

3. **Ověření řešení**
   - Zkontrolujte, že pouze jedna session je aktivní
   - Informujte uklízečky o řešení
   - Sledujte další úklid

### Problém: Uklízečka zapomněla ukončit session

**Příznaky:**
- Session je aktivní déle než 6 hodin
- Uklízečka nemůže začít nový úklid
- Systém hlásí "Previous session not closed"

**Řešení:**
1. **Kontaktujte uklízečku**
   - WhatsApp: +420 111 222 333
   - E-mail: uklizecka@cleanstay.ai

2. **Manuální ukončení session**
   ```sql
   UPDATE active_sessions 
   SET status = 'closed',
       ended_at = NOW(),
       reason = 'manual_close'
   WHERE id = 'session-id';
   ```

3. **TTL auto-close** (automatické)
   - Sessions se automaticky ukončí po 6 hodinách
   - Cron job běží každou hodinu
   - Uklízečka dostane upozornění

### Problém: Chybný byt v session

**Příznaky:**
- Uklízečka začala úklid ve špatném bytě
- Session je přiřazena k nesprávnému property_id
- Potřeba přesunout session

**Řešení:**
1. **Identifikace chyby**
   - Zkontrolujte `active_sessions`
   - Ověřte správný byt
   - Kontaktujte uklízečku

2. **Přesunutí session**
   ```sql
   UPDATE active_sessions 
   SET property_id = 'correct-property-id'
   WHERE id = 'session-id';
   ```

3. **Ověření**
   - Zkontrolujte, že session je přiřazena správně
   - Informujte uklízečku o opravě
   - Sledujte další úklid

## Generování reportů

### Denní reporty

**Automatické reporty:**
- Každý den v 23:55
- Agregace denních metrik
- Cost limits monitoring
- Performance summary

**Manuální reporty:**
```bash
# Získání denního reportu
curl -X GET "https://cleanstay.ai/api/admin/reports/cleaning?propertyId=prop-001&date=2024-01-22"

# Získání fotografií
curl -X GET "https://cleanstay.ai/api/admin/reports/photos?propertyId=prop-001&date=2024-01-22"

# Získání zásob
curl -X GET "https://cleanstay.ai/api/admin/reports/inventory?propertyId=prop-001&range=7d"
```

### Týdenní reporty

**Automatické reporty:**
- Každé pondělí v 08:00
- Týdenní souhrn
- Trend analýza
- Doporučení

**Manuální reporty:**
```bash
# Týdenní souhrn
curl -X GET "https://cleanstay.ai/api/admin/metrics/daily?from=2024-01-15&to=2024-01-22&type=summary"

# Cost trends
curl -X GET "https://cleanstay.ai/api/admin/metrics/daily?from=2024-01-15&to=2024-01-22&type=costs"

# Performance trends
curl -X GET "https://cleanstay.ai/api/admin/metrics/daily?from=2024-01-15&to=2024-01-22&type=performance"
```

### Měsíční reporty

**Automatické reporty:**
- Každý 1. den v měsíci v 00:10
- Měsíční KPI
- Financial summary
- Utilization analysis

**Manuální reporty:**
```bash
# Měsíční KPI
curl -X GET "https://cleanstay.ai/api/admin/metrics/monthly?year=2024"

# Financial summary
curl -X GET "https://cleanstay.ai/api/admin/metrics/summary"
```

## Monitoring a alerting

### Cost Limits Monitoring

**AI náklady:**
- Limit: €2.00/den
- Alert při překročení
- Automatické notifikace

**WhatsApp náklady:**
- Limit: €5.00/den
- Alert při překročení
- Automatické notifikace

**Monitoring:**
```bash
# Kontrola cost limits
curl -X GET "https://cleanstay.ai/api/admin/metrics/aggregate?date=2024-01-22"
```

### Performance Monitoring

**Response time:**
- Cíl: < 500ms
- Alert při překročení
- Automatické notifikace

**Error rate:**
- Cíl: < 1%
- Alert při překročení
- Automatické notifikace

**Monitoring:**
```bash
# Health check
curl -X GET "https://cleanstay.ai/api/health"
```

### Uptime Monitoring

**Cíl: > 99.9%**
- Monitoring každou minutu
- Alert při výpadku
- Automatické notifikace

**Monitoring:**
- Uptime robot
- Pingdom
- Custom health checks

## Řešení problémů

### Problém: Vysoké náklady

**Příznaky:**
- AI náklady > €2/den
- WhatsApp náklady > €5/den
- Celkové náklady > €7/den

**Řešení:**
1. **Analýza nákladů**
   ```bash
   curl -X GET "https://cleanstay.ai/api/admin/metrics/daily?type=costs"
   ```

2. **Identifikace zdroje**
   - Zkontrolujte AI usage
   - Zkontrolujte WhatsApp messages
   - Analyzujte patterns

3. **Optimalizace**
   - Implementujte caching
   - Optimalizujte prompts
   - Implementujte throttling

### Problém: Pomalé odpovědi

**Příznaky:**
- Response time > 500ms
- Timeout errors
- User complaints

**Řešení:**
1. **Analýza výkonu**
   ```bash
   curl -X GET "https://cleanstay.ai/api/health"
   ```

2. **Identifikace bottlenecku**
   - Database queries
   - AI API calls
   - Storage operations

3. **Optimalizace**
   - Database indexes
   - API caching
   - Connection pooling

### Problém: Vysoká chybovost

**Příznaky:**
- Error rate > 1%
- AI parsing failures
- WhatsApp webhook errors

**Řešení:**
1. **Analýza chyb**
   - Sentry dashboard
   - Error logs
   - User reports

2. **Identifikace příčiny**
   - API issues
   - Database problems
   - Network issues

3. **Oprava**
   - Fix bugs
   - Improve error handling
   - Add monitoring

## Best Practices

### Denní rutina
1. **Ráno:** Zkontrolujte health check
2. **Dopoledne:** Zkontrolujte cost limits
3. **Odpoledne:** Zkontrolujte performance
4. **Večer:** Zkontrolujte denní reporty

### Týdenní rutina
1. **Pondělí:** Týdenní souhrn
2. **Středa:** Performance review
3. **Pátek:** Cost analysis
4. **Neděle:** System maintenance

### Měsíční rutina
1. **1. den:** Měsíční KPI
2. **15. den:** Mid-month review
3. **30. den:** Monthly summary
4. **31. den:** Planning for next month

## Kontakty

### Technická podpora
- **E-mail:** tech@cleanstay.ai
- **Telefon:** +420 123 456 789
- **WhatsApp:** +420 123 456 789

### Business podpora
- **E-mail:** business@cleanstay.ai
- **Telefon:** +420 123 456 789
- **WhatsApp:** +420 123 456 789

### Emergency kontakty
- **E-mail:** emergency@cleanstay.ai
- **Telefon:** +420 987 654 321
- **WhatsApp:** +420 987 654 321

## Dokumentace

### Technická dokumentace
- **API docs:** https://docs.cleanstay.ai/api
- **Database schema:** https://docs.cleanstay.ai/database
- **Deployment guide:** https://docs.cleanstay.ai/deployment

### Business dokumentace
- **User guide:** https://docs.cleanstay.ai/users
- **Manager guide:** https://docs.cleanstay.ai/managers
- **Client guide:** https://docs.cleanstay.ai/clients

### Monitoring dokumentace
- **Health checks:** https://docs.cleanstay.ai/health
- **Cost monitoring:** https://docs.cleanstay.ai/costs
- **Performance monitoring:** https://docs.cleanstay.ai/performance

## Závěr

Tento playbook poskytuje kompletní přehled pro manažery CleanStay AI systému. Pravidelné sledování a rychlé řešení problémů zajistí hladký provoz systému.

---

**Vytvořeno:** 2024-01-22  
**Verze:** 1.0  
**Kontakt:** managers@cleanstay.ai





