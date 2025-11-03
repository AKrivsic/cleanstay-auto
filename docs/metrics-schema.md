# Monitoring Schema - CleanStay AI

## Přehled

Tento dokument popisuje databázové schéma pro monitoring a KPI systém CleanStay AI. Schéma umožňuje sledování nákladů, výkonu a provozních metrik.

## Databázové tabulky

### metrics_daily

**Účel:** Denní agregace metrik pro monitoring nákladů a výkonu

```sql
CREATE TABLE metrics_daily (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  date DATE NOT NULL,
  ai_tokens_in BIGINT DEFAULT 0,
  ai_tokens_out BIGINT DEFAULT 0,
  ai_cost_eur NUMERIC(10,4) DEFAULT 0,
  whatsapp_messages_in INT DEFAULT 0,
  whatsapp_messages_out INT DEFAULT 0,
  whatsapp_cost_eur NUMERIC(10,4) DEFAULT 0,
  cleanings_done INT DEFAULT 0,
  photos_uploaded INT DEFAULT 0,
  supplies_out INT DEFAULT 0,
  avg_cleaning_time_min NUMERIC(6,2) DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(tenant_id, date)
);
```

**Sloupce:**

- `ai_tokens_in/out` - Počet AI tokenů (input/output)
- `ai_cost_eur` - Náklady na AI (€0.002/1000 tokenů)
- `whatsapp_messages_in/out` - Počet WhatsApp zpráv
- `whatsapp_cost_eur` - Náklady na WhatsApp (€0.02/zpráva)
- `cleanings_done` - Počet dokončených úklidů
- `photos_uploaded` - Počet nahraných fotografií
- `supplies_out` - Počet použitých zásob
- `avg_cleaning_time_min` - Průměrný čas úklidu v minutách

### kpi_monthly

**Účel:** Měsíční KPI pro business intelligence

```sql
CREATE TABLE kpi_monthly (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  month DATE NOT NULL,
  revenue_est NUMERIC(12,2) DEFAULT 0,
  costs_est NUMERIC(12,2) DEFAULT 0,
  profit_est NUMERIC(12,2) GENERATED ALWAYS AS (revenue_est - costs_est) STORED,
  avg_rating NUMERIC(3,2) DEFAULT 0,
  utilization_rate NUMERIC(5,2) DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(tenant_id, month)
);
```

**Sloupce:**

- `revenue_est` - Odhad výnosů (úklidy × průměrná cena)
- `costs_est` - Odhad nákladů (AI + WhatsApp + mzdy)
- `profit_est` - Vypočítaný zisk (revenue - costs)
- `avg_rating` - Průměrné hodnocení zákazníků
- `utilization_rate` - Využití kapacity uklízeček (%)

## Agregační funkce

### aggregate_daily_metrics

**Účel:** Agregace denních metrik z events a messages

```sql
CREATE OR REPLACE FUNCTION aggregate_daily_metrics(
  p_tenant_id UUID,
  p_date DATE
) RETURNS JSONB AS $$
DECLARE
  v_ai_tokens_in BIGINT := 0;
  v_ai_tokens_out BIGINT := 0;
  v_ai_cost_eur NUMERIC(10,4) := 0;
  -- ... další proměnné
BEGIN
  -- Agregace AI tokenů z events
  SELECT
    COALESCE(SUM(CASE WHEN payload->>'tokens_in' IS NOT NULL THEN (payload->>'tokens_in')::BIGINT ELSE 0 END), 0),
    COALESCE(SUM(CASE WHEN payload->>'tokens_out' IS NOT NULL THEN (payload->>'tokens_out')::BIGINT ELSE 0 END), 0)
  INTO v_ai_tokens_in, v_ai_tokens_out
  FROM events
  WHERE tenant_id = p_tenant_id
    AND DATE(created_at) = p_date
    AND type = 'ai_parse';

  -- Výpočet AI nákladů
  v_ai_cost_eur := ((v_ai_tokens_in + v_ai_tokens_out) / 1000.0) * 0.002;

  -- Agregace WhatsApp zpráv
  SELECT
    COALESCE(COUNT(CASE WHEN direction = 'in' THEN 1 END), 0),
    COALESCE(COUNT(CASE WHEN direction = 'out' THEN 1 END), 0)
  INTO v_whatsapp_messages_in, v_whatsapp_messages_out
  FROM messages
  WHERE tenant_id = p_tenant_id
    AND DATE(created_at) = p_date;

  -- Výpočet WhatsApp nákladů
  v_whatsapp_cost_eur := v_whatsapp_messages_out * 0.02;

  -- Počet úklidů
  SELECT COUNT(*)
  INTO v_cleanings_done
  FROM events
  WHERE tenant_id = p_tenant_id
    AND DATE(created_at) = p_date
    AND type = 'done';

  -- Upsert do metrics_daily
  INSERT INTO metrics_daily (...) VALUES (...)
  ON CONFLICT (tenant_id, date)
  DO UPDATE SET ...;

  RETURN jsonb_build_object(...);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
```

### aggregate_monthly_kpi

**Účel:** Agregace měsíčních KPI z denních metrik

```sql
CREATE OR REPLACE FUNCTION aggregate_monthly_kpi(
  p_tenant_id UUID,
  p_month DATE
) RETURNS JSONB AS $$
DECLARE
  v_revenue_est NUMERIC(12,2) := 0;
  v_costs_est NUMERIC(12,2) := 0;
  v_avg_rating NUMERIC(3,2) := 0;
  v_utilization_rate NUMERIC(5,2) := 0;
  v_total_cleanings INT := 0;
BEGIN
  -- Počet úklidů za měsíc
  SELECT COUNT(*)
  INTO v_total_cleanings
  FROM cleanings
  WHERE tenant_id = p_tenant_id
    AND DATE_TRUNC('month', ended_at) = DATE_TRUNC('month', p_month)
    AND status = 'completed';

  -- Odhad výnosů (úklidy × průměrná cena)
  v_revenue_est := v_total_cleanings * 50.0;

  -- Odhad nákladů (60% výnosů)
  v_costs_est := v_revenue_est * 0.6;

  -- Využití kapacity
  v_utilization_rate := LEAST((v_total_cleanings::NUMERIC / 60.0) * 100, 100);

  -- Upsert do kpi_monthly
  INSERT INTO kpi_monthly (...) VALUES (...)
  ON CONFLICT (tenant_id, month)
  DO UPDATE SET ...;

  RETURN jsonb_build_object(...);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
```

## Indexy pro výkon

### metrics_daily indexy

```sql
-- Základní indexy
CREATE INDEX idx_metrics_daily_tenant_date ON metrics_daily(tenant_id, date);
CREATE INDEX idx_metrics_daily_date ON metrics_daily(date);

-- Kompozitní indexy pro běžné dotazy
CREATE INDEX idx_metrics_daily_tenant_date_range ON metrics_daily(tenant_id, date)
WHERE date >= CURRENT_DATE - INTERVAL '30 days';

-- Indexy pro náklady
CREATE INDEX idx_metrics_daily_costs ON metrics_daily(tenant_id, date, ai_cost_eur, whatsapp_cost_eur);
```

### kpi_monthly indexy

```sql
-- Základní indexy
CREATE INDEX idx_kpi_monthly_tenant_month ON kpi_monthly(tenant_id, month);
CREATE INDEX idx_kpi_monthly_month ON kpi_monthly(month);

-- Indexy pro finanční analýzu
CREATE INDEX idx_kpi_monthly_profit ON kpi_monthly(tenant_id, month, profit_est);
CREATE INDEX idx_kpi_monthly_utilization ON kpi_monthly(tenant_id, month, utilization_rate);
```

## RLS (Row Level Security)

### metrics_daily RLS

```sql
-- Admin může vidět všechny metriky pro svůj tenant
CREATE POLICY "admin_can_view_metrics_daily" ON metrics_daily
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND users.tenant_id = metrics_daily.tenant_id
      AND users.role = 'admin'
    )
  );

-- Service role může spravovat metriky
CREATE POLICY "service_role_can_manage_metrics_daily" ON metrics_daily
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);
```

### kpi_monthly RLS

```sql
-- Admin může vidět všechny KPI pro svůj tenant
CREATE POLICY "admin_can_view_kpi_monthly" ON kpi_monthly
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND users.tenant_id = kpi_monthly.tenant_id
      AND users.role = 'admin'
    )
  );

-- Service role může spravovat KPI
CREATE POLICY "service_role_can_manage_kpi_monthly" ON kpi_monthly
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);
```

## API endpoints

### /api/admin/metrics/daily

**GET** - Získání denních metrik

**Query parameters:**

- `from` - Počáteční datum (YYYY-MM-DD)
- `to` - Koncové datum (YYYY-MM-DD)
- `type` - Typ dat (summary/costs/performance)

**Response:**

```json
{
  "success": true,
  "data": [
    {
      "date": "2024-01-22",
      "ai_cost_eur": 1.5,
      "whatsapp_cost_eur": 2.3,
      "total_cost_eur": 3.8,
      "cleanings_done": 5,
      "photos_uploaded": 12,
      "avg_cleaning_time_min": 45.5
    }
  ],
  "from": "2024-01-01",
  "to": "2024-01-22",
  "type": "summary"
}
```

### /api/admin/metrics/monthly

**GET** - Získání měsíčních KPI

**Query parameters:**

- `year` - Rok (YYYY)

**Response:**

```json
{
  "success": true,
  "data": [
    {
      "month": "2024-01-01",
      "revenue_est": 2500.0,
      "costs_est": 1500.0,
      "profit_est": 1000.0,
      "avg_rating": 4.5,
      "utilization_rate": 85.0
    }
  ],
  "year": 2024
}
```

### /api/admin/metrics/aggregate

**POST** - Ruční spuštění agregace

**Body:**

```json
{
  "type": "daily",
  "date": "2024-01-22"
}
```

**Response:**

```json
{
  "success": true,
  "type": "daily",
  "data": {
    "date": "2024-01-22",
    "ai_tokens_in": 1500,
    "ai_tokens_out": 800,
    "ai_cost_eur": 0.46,
    "whatsapp_messages_in": 25,
    "whatsapp_messages_out": 15,
    "whatsapp_cost_eur": 0.3,
    "cleanings_done": 3,
    "photos_uploaded": 8,
    "supplies_out": 12,
    "avg_cleaning_time_min": 42.5
  },
  "cost_limits": {
    "ai_limit_exceeded": false,
    "whatsapp_limit_exceeded": false
  }
}
```

## n8n automatizace

### Flow A: Daily Metrics Aggregator

**Trigger:** Cron (každý den v 23:55)

**Uzly:**

1. **Cron Trigger** - každý den v 23:55
2. **Get Yesterday Date** - výpočet včerejšího data
3. **HTTP Request** - `/api/admin/metrics/aggregate?type=daily&date=yesterday`
4. **IF Success** - kontrola úspěchu
5. **Log Result** - zápis výsledku do audit logu
6. **Error Handler** - zpracování chyb

**Logika:**

```javascript
// n8n Function node
const yesterday = new Date();
yesterday.setDate(yesterday.getDate() - 1);
const dateStr = yesterday.toISOString().split("T")[0];

return {
  date: dateStr,
  url: `${process.env.BASE_URL}/api/admin/metrics/aggregate`,
  method: "POST",
  body: {
    type: "daily",
    date: dateStr,
  },
};
```

### Flow B: Monthly KPI Builder

**Trigger:** Cron (1. den v měsíci v 00:10)

**Uzly:**

1. **Cron Trigger** - 1. den v měsíci v 00:10
2. **Get Last Month** - výpočet minulého měsíce
3. **HTTP Request** - `/api/admin/metrics/aggregate?type=monthly&month=lastMonth`
4. **IF Success** - kontrola úspěchu
5. **Log Result** - zápis výsledku do audit logu
6. **Error Handler** - zpracování chyb

**Logika:**

```javascript
// n8n Function node
const lastMonth = new Date();
lastMonth.setMonth(lastMonth.getMonth() - 1);
const monthStr = lastMonth.toISOString().substring(0, 7) + "-01";

return {
  month: monthStr,
  url: `${process.env.BASE_URL}/api/admin/metrics/aggregate`,
  method: "POST",
  body: {
    type: "monthly",
    month: monthStr,
  },
};
```

## Monitoring a alerting

### Cost limits monitoring

```typescript
// Kontrola limitů nákladů
export async function checkCostLimits(
  tenantId: string,
  date: string
): Promise<{ ai_limit_exceeded: boolean; whatsapp_limit_exceeded: boolean }> {
  const aiLimitExceeded = aiCost > 2.0; // €2 daily limit
  const whatsappLimitExceeded = whatsappCost > 5.0; // €5 daily limit

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

  return {
    ai_limit_exceeded: aiLimitExceeded,
    whatsapp_limit_exceeded: whatsappLimitExceeded,
  };
}
```

### Performance monitoring

```typescript
// Sledování výkonu
export async function getCleaningPerformanceTrends(tenantId: string): Promise<{
  dates: string[];
  cleanings_done: number[];
  avg_cleaning_time: number[];
  photos_uploaded: number[];
}> {
  // Implementace sledování trendů výkonu
}
```

## Optimalizace výkonu

### Materialized views

```sql
-- Materialized view pro rychlé dotazy
CREATE MATERIALIZED VIEW metrics_daily_summary AS
SELECT
  tenant_id,
  date,
  ai_cost_eur + whatsapp_cost_eur as total_cost_eur,
  cleanings_done,
  photos_uploaded,
  avg_cleaning_time_min
FROM metrics_daily;

-- Refresh materialized view
CREATE OR REPLACE FUNCTION refresh_metrics_summary()
RETURNS void AS $$
BEGIN
  REFRESH MATERIALIZED VIEW metrics_daily_summary;
END;
$$ LANGUAGE plpgsql;
```

### Caching

```typescript
// Cache pro často používané dotazy
export async function getCachedMetrics(tenantId: string, date: string) {
  const cacheKey = `metrics:${tenantId}:${date}`;
  const cached = await redis.get(cacheKey);

  if (cached) {
    return JSON.parse(cached);
  }

  const data = await getDailyMetrics(tenantId, date);
  await redis.setex(cacheKey, 3600, JSON.stringify(data)); // 1 hodina cache

  return data;
}
```

## Troubleshooting

### Časté problémy

1. **Pomalé agregace**

   - Zkontrolujte indexy
   - Omezte časový rozsah
   - Používejte materialized views

2. **Chybějící data**

   - Zkontrolujte RLS politiky
   - Ověřte tenant_id
   - Zkontrolujte časové pásmo

3. **Nesprávné výpočty**
   - Ověřte vzorce nákladů
   - Zkontrolujte časové pásmo
   - Ověřte data v source tabulkách

### Debug dotazy

```sql
-- Kontrola denních metrik
SELECT * FROM metrics_daily
WHERE tenant_id = 'tenant-123'
  AND date >= CURRENT_DATE - INTERVAL '7 days'
ORDER BY date;

-- Kontrola měsíčních KPI
SELECT * FROM kpi_monthly
WHERE tenant_id = 'tenant-123'
  AND month >= DATE_TRUNC('month', CURRENT_DATE - INTERVAL '3 months')
ORDER BY month;

-- Kontrola výkonu agregace
EXPLAIN ANALYZE SELECT * FROM metrics_daily
WHERE tenant_id = 'tenant-123'
  AND date BETWEEN '2024-01-01' AND '2024-01-31';
```

---

**Poslední aktualizace:** 2024-01-22  
**Verze:** 1.0  
**Kontakt:** monitoring@cleanstay.ai





