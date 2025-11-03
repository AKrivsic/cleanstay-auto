# Limity nákladů - CleanStay AI

## Přehled

Tento dokument definuje limity nákladů pro AI a WhatsApp služby v systému CleanStay AI. Limity pomáhají kontrolovat provozní náklady a předcházet neočekávaným výdajům.

## Definované limity

### AI náklady

**Denní limit:** €2.00  
**Měsíční limit:** €60.00  
**Výpočet:** (tokens_in + tokens_out) / 1000 × €0.002

**Kdy se překročí:**

- Denní AI náklady přesáhnou €2.00
- Měsíční AI náklady přesáhnou €60.00

### WhatsApp náklady

**Denní limit:** €5.00  
**Měsíční limit:** €150.00  
**Výpočet:** počet_outgoing_messages × €0.02

**Kdy se překročí:**

- Denní WhatsApp náklady přesáhnou €5.00
- Měsíční WhatsApp náklady přesáhnou €150.00

## Implementace

### Automatická kontrola

```typescript
// Kontrola limitů při agregaci denních metrik
export async function checkCostLimits(
  tenantId: string,
  date: string
): Promise<{ ai_limit_exceeded: boolean; whatsapp_limit_exceeded: boolean }> {
  const aiLimitExceeded = aiCost > 2.0; // €2 daily limit
  const whatsappLimitExceeded = whatsappCost > 5.0; // €5 daily limit

  // Vytvoření alert eventu při překročení
  if (aiLimitExceeded) {
    await logSystemAction(
      tenantId,
      "alert_cost_limit",
      "audit_log",
      undefined,
      {
        type: "ai_cost_limit",
        date,
        cost: aiCost,
        limit: 2.0,
        exceeded_by: aiCost - 2.0,
      }
    );
  }
}
```

### Alert systém

**Typy alertů:**

- `ai_cost_limit` - překročení AI limitu
- `whatsapp_cost_limit` - překročení WhatsApp limitu
- `monthly_cost_limit` - překročení měsíčního limitu

**Metadata alertu:**

```json
{
  "type": "ai_cost_limit",
  "date": "2024-01-22",
  "cost": 2.5,
  "limit": 2.0,
  "exceeded_by": 0.5,
  "tenant_id": "tenant-123"
}
```

## Notifikace

### E-mail notifikace

**Příjemci:**

- Admin uživatelé tenantu
- DPO (Data Protection Officer)
- Finance team

**Obsah:**

```
Předmět: [CleanStay] Překročení limitu nákladů - AI

Dobrý den,

Dne 2024-01-22 byly překročeny limity nákladů:

AI náklady: €2.50 (limit: €2.00)
WhatsApp náklady: €3.20 (limit: €5.00)

Doporučujeme zkontrolovat:
- Frekvenci AI volání
- Počet WhatsApp zpráv
- Možné optimalizace

S pozdravem,
CleanStay AI System
```

### WhatsApp notifikace

**Příjemci:**

- Admin telefonní čísla
- Manager telefonní čísla

**Template:**

```
🚨 CleanStay Alert

Překročení limitu nákladů:
• AI: €2.50 (limit €2.00)
• WhatsApp: €3.20 (limit €5.00)

Datum: 2024-01-22
Tenant: tenant-123

Zkontrolujte dashboard pro více detailů.
```

## n8n automatizace

### Flow: Cost Limit Monitor

**Trigger:** Cron (každou hodinu)

**Uzly:**

1. **Cron Trigger** - každou hodinu
2. **Check Daily Costs** - `/api/admin/metrics/aggregate?date=today`
3. **IF AI Limit Exceeded** - kontrola AI limitu
4. **IF WhatsApp Limit Exceeded** - kontrola WhatsApp limitu
5. **Send Email Alert** - odeslání e-mailu
6. **Send WhatsApp Alert** - odeslání WhatsApp zprávy
7. **Log Alert** - zápis do audit logu

**Logika:**

```javascript
// n8n Function node
const aiCost = $json.ai_cost_eur;
const whatsappCost = $json.whatsapp_cost_eur;

const aiExceeded = aiCost > 2.0;
const whatsappExceeded = whatsappCost > 5.0;

return {
  ai_exceeded: aiExceeded,
  whatsapp_exceeded: whatsappExceeded,
  ai_cost: aiCost,
  whatsapp_cost: whatsappCost,
  date: $json.date,
};
```

## Monitoring dashboard

### Real-time indikátory

**Zelená:** Náklady pod limitem  
**Žlutá:** Náklady 80-100% limitu  
**Červená:** Náklady přes limit

### Grafické zobrazení

```typescript
// Komponenta pro zobrazení limitů
<div className="cost-limits">
  <div className="limit-item">
    <span className="limit-label">AI limit:</span>
    <span className="limit-value">€2.00/den</span>
    <span className={`limit-status ${aiCost > 2 ? "exceeded" : "ok"}`}>
      {aiCost > 2 ? "PŘEKROČENO" : "OK"}
    </span>
  </div>
</div>
```

## Konfigurace limitů

### Environment variables

```env
# AI limity
AI_DAILY_LIMIT_EUR=2.00
AI_MONTHLY_LIMIT_EUR=60.00

# WhatsApp limity
WHATSAPP_DAILY_LIMIT_EUR=5.00
WHATSAPP_MONTHLY_LIMIT_EUR=150.00

# Notifikace
ALERT_EMAIL_ADMIN=admin@cleanstay.ai
ALERT_EMAIL_DPO=dpo@cleanstay.ai
ALERT_WHATSAPP_ADMIN=+420123456789
```

### Dynamické limity

**Možnost změny limitů:**

- Admin může upravit limity v dashboardu
- Změny se ukládají do `tenant_settings`
- Notifikace o změnách limitů

```sql
-- Tabulka pro nastavení limitů
CREATE TABLE tenant_cost_limits (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tenant_id UUID REFERENCES tenants(id),
  ai_daily_limit NUMERIC(10,4) DEFAULT 2.00,
  ai_monthly_limit NUMERIC(10,4) DEFAULT 60.00,
  whatsapp_daily_limit NUMERIC(10,4) DEFAULT 5.00,
  whatsapp_monthly_limit NUMERIC(10,4) DEFAULT 150.00,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
```

## Historie překročení

### Audit log

**Event type:** `alert_cost_limit`  
**Metadata:**

```json
{
  "type": "ai_cost_limit",
  "date": "2024-01-22",
  "cost": 2.5,
  "limit": 2.0,
  "exceeded_by": 0.5,
  "tenant_id": "tenant-123",
  "notifications_sent": ["email", "whatsapp"],
  "resolved_at": null
}
```

### Reportování

**Týdenní souhrn:**

- Počet překročení limitů
- Celkové náklady vs limity
- Doporučení pro optimalizaci

**Měsíční report:**

- Trend nákladů
- Efektivita limitů
- Návrhy na úpravy

## Optimalizace nákladů

### AI optimalizace

**Strategie:**

- Cachování AI odpovědí
- Optimalizace promptů
- Batch processing
- Offline zpracování

**Implementace:**

```typescript
// Cache pro AI odpovědi
const cacheKey = `ai_${hash(prompt)}`;
const cached = await redis.get(cacheKey);
if (cached) return cached;

const response = await openai.chat.completions.create({
  model: "gpt-4o",
  messages: [{ role: "user", content: prompt }],
  max_tokens: 100, // Omezení tokenů
});
```

### WhatsApp optimalizace

**Strategie:**

- User-initiated vlákna
- Template messages
- Batch sending
- Offline queue

**Implementace:**

```typescript
// Prioritizace user-initiated zpráv
if (isUserInitiated(message)) {
  // Levnější odeslání
  await sendWhatsAppMessage(message, { priority: "high" });
} else {
  // Template message
  await sendTemplateMessage(message);
}
```

## Troubleshooting

### Časté problémy

1. **Falešné alerty**

   - Zkontrolujte časové pásmo
   - Ověřte správnost výpočtů
   - Zkontrolujte cache

2. **Chybějící notifikace**

   - Ověřte e-mail konfiguraci
   - Zkontrolujte WhatsApp API
   - Ověřte n8n flows

3. **Nesprávné limity**
   - Zkontrolujte tenant nastavení
   - Ověřte environment variables
   - Zkontrolujte cache

### Debug logy

```typescript
// Debug informace pro limity
console.log("Cost limits check:", {
  tenantId,
  date,
  aiCost,
  whatsappCost,
  aiLimit: 2.0,
  whatsappLimit: 5.0,
  aiExceeded: aiCost > 2.0,
  whatsappExceeded: whatsappCost > 5.0,
});
```

## Kontakty

**Technical Support:** tech@cleanstay.ai  
**Finance Team:** finance@cleanstay.ai  
**Emergency:** +420 123 456 789

---

**Poslední aktualizace:** 2024-01-22  
**Verze:** 1.0  
**Kontakt:** monitoring@cleanstay.ai





