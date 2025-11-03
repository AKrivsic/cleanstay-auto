# Inventář zásob - CleanStay

## Přehled

Systém inventáře zásob umožňuje sledování spotřeby, doporučení nákupů a automatizaci správy zásob pro každý objekt. Systém je multi-tenant a integrovaný s existujícími events a cleaning sessions.

## Datový model

### Tabulky

#### `supplies` (Master seznam položek)

```sql
CREATE TABLE supplies (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID NOT NULL,
    name TEXT NOT NULL,
    unit TEXT NOT NULL DEFAULT 'ks',
    sku TEXT,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);
```

#### `inventory` (Stav zásob na objekt)

```sql
CREATE TABLE inventory (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID NOT NULL,
    property_id UUID NOT NULL,
    supply_id UUID NOT NULL,
    min_qty NUMERIC DEFAULT 0,
    max_qty NUMERIC DEFAULT 0,
    current_qty NUMERIC DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(tenant_id, property_id, supply_id)
);
```

#### `inventory_movements` (Log změn)

```sql
CREATE TABLE inventory_movements (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID NOT NULL,
    property_id UUID NOT NULL,
    supply_id UUID NOT NULL,
    type ENUM('in', 'out', 'adjust'),
    qty NUMERIC NOT NULL,
    source TEXT NOT NULL,
    ref_event_id UUID,
    created_at TIMESTAMPTZ DEFAULT NOW()
);
```

#### `supply_aliases` (Aliasy pro lepší matching)

```sql
CREATE TABLE supply_aliases (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID NOT NULL,
    supply_id UUID NOT NULL,
    alias TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);
```

## Funkce a výpočty

### Normalizace položek

```typescript
// Normalizuje volný text na strukturovaná data
const normalized = await normalizeItems(["Domestos", "kapsle kafe"], tenantId);

// Výsledek:
[
  { supplyId: "supply-1", name: "Domestos", qty: 1, confidence: 0.9 },
  { supplyId: "supply-2", name: "Kávové kapsle", qty: 1, confidence: 0.8 },
];
```

### Spotřeba a doporučení

```typescript
// Získá spotřebu za období
const consumption = await getConsumption(
  tenantId,
  propertyId,
  "2024-01-01",
  "2024-01-31"
);

// Získá doporučení na nákup
const recommendations = await getRecommendation(tenantId, propertyId, 21); // 21 dní
```

### Vzorec pro doporučení

```
target = max(min_qty * 1.0, avg_per_day * horizonDays) - current_qty
```

Kde:

- `min_qty`: Minimální množství
- `avg_per_day`: Denní průměr spotřeby
- `horizonDays`: Horizont doporučení (výchozí 21 dní)
- `current_qty`: Aktuální množství

## API Endpointy

### Inventář

#### GET `/api/admin/inventory`

```typescript
// Query: ?propertyId=...&from=...&to=...
// Response:
{
  "success": true,
  "data": {
    "snapshot": [
      {
        "supply_id": "supply-1",
        "supply_name": "Domestos",
        "unit": "ks",
        "current_qty": 5,
        "min_qty": 10,
        "max_qty": 50,
        "daily_average": 0.5
      }
    ],
    "consumption": [...],
    "lowStockAlerts": [...]
  }
}
```

#### POST `/api/admin/inventory`

```typescript
// Body: { propertyId, supplyId, qty, action: 'in'|'adjust', reason? }
// Response:
{
  "success": true,
  "data": {
    "movement": { "id": "movement-123", ... },
    "action": "in",
    "propertyId": "property-123",
    "supplyId": "supply-123",
    "qty": 5
  }
}
```

### Zásoby

#### GET `/api/admin/supplies`

```typescript
// Query: ?search=...&page=...&pageSize=...
// Response:
{
  "success": true,
  "data": {
    "supplies": [
      {
        "id": "supply-1",
        "name": "Domestos",
        "unit": "ks",
        "sku": "DOM-001",
        "is_active": true
      }
    ],
    "pagination": {
      "page": 1,
      "pageSize": 20,
      "total": 100,
      "totalPages": 5
    }
  }
}
```

#### POST `/api/admin/supplies`

```typescript
// Body: { name, unit, sku? }
// Response:
{
  "success": true,
  "data": {
    "supply": { "id": "supply-123", ... }
  }
}
```

### Doporučení

#### GET `/api/admin/recommend`

```typescript
// Query: ?propertyId=...&horizonDays=...
// Response:
{
  "success": true,
  "data": {
    "recommendations": [
      {
        "supply_id": "supply-1",
        "supply_name": "Domestos",
        "unit": "ks",
        "current_qty": 5,
        "min_qty": 10,
        "max_qty": 50,
        "daily_average": 0.5,
        "recommended_buy": 15,
        "rationale": "Nízké zásoby",
        "priority": "high"
      }
    ],
    "shoppingList": {
      "items": [...],
      "totalItems": 5,
      "highPriorityItems": 2
    }
  }
}
```

### Exporty

#### GET `/api/admin/exports`

```typescript
// Query: ?type=inventory&propertyId=...&from=...&to=...&format=csv|pdf
// Response: CSV file nebo PDF (stub)
```

## UI Komponenty

### InventorySection

```typescript
// Admin property detail page
<InventorySection propertyId={propertyId} />
```

**Funkce:**

- Zobrazení aktuálního stavu zásob
- Přidání nových položek
- Úprava množství
- Generování doporučení
- Export do CSV

## Automatizace

### n8n Workflows

#### Týdenní shrnutí

```json
{
  "trigger": "cron",
  "schedule": "0 9 * * 1", // Každé pondělí v 9:00
  "actions": [
    {
      "name": "get_recommendations",
      "url": "/api/admin/recommend",
      "method": "POST",
      "body": {
        "propertyIds": ["property-1", "property-2"],
        "horizonDays": 21
      }
    },
    {
      "name": "send_whatsapp",
      "url": "https://api.whatsapp.com/send",
      "body": {
        "to": "+420123456789",
        "message": "Týdenní inventář: {{recommendations}}"
      }
    }
  ]
}
```

#### Podlimitní notifikace

```json
{
  "trigger": "cron",
  "schedule": "0 8 * * *", // Každý den v 8:00
  "actions": [
    {
      "name": "check_low_stock",
      "url": "/api/admin/inventory",
      "method": "GET",
      "query": "?propertyId=all"
    },
    {
      "name": "send_alerts",
      "condition": "{{lowStockAlerts.length > 0}}",
      "url": "https://api.whatsapp.com/send",
      "body": {
        "to": "+420123456789",
        "message": "Upozornění: {{lowStockAlerts}}"
      }
    }
  ]
}
```

## Testování

### Spuštění testů

```bash
npm test src/__tests__/inventory.test.ts
```

### Testovací scénáře

1. **Normalizace**: Různé varianty názvů (Domestos/domestox, kapsle → kávové kapsle)
2. **Spotřeba**: Aplikace supply_out events na inventory movements
3. **Doporučení**: Výpočet pro různé current_qty a min/max hodnoty
4. **End-to-end**: Kompletní flow od normalizace po doporučení

## Bezpečnost

### RLS Policies

- Všechny tabulky mají RLS enabled
- Tenant-scoped přístup
- Role-based permissions (admin, client, service-role)

### Audit

- Všechny změny jsou logovány v `inventory_movements`
- Source tracking (manual, event, purchase)
- Timestamp a user tracking

## Výkon

### Indexy

```sql
-- Hlavní indexy pro výkon
CREATE INDEX idx_inventory_tenant_property ON inventory(tenant_id, property_id);
CREATE INDEX idx_movements_tenant_property_supply ON inventory_movements(tenant_id, property_id, supply_id);
CREATE INDEX idx_movements_created_at ON inventory_movements(created_at);
```

### Optimalizace

- Lazy loading pro velké seznamy
- Caching doporučení (5 minut)
- Batch operace pro hromadné změny

## Monitoring

### Metriky

- Počet položek s nízkými zásobami
- Průměrná spotřeba za den/týden/měsíc
- Úspěšnost normalizace (mapped vs needs_mapping)

### Alerty

- Podlimitní zásoby
- Neaktivní položky
- Chyby v normalizaci

## Roadmap

### V1.1

- [ ] Ceny položek a odhad nákladů
- [ ] Integrace s dodavateli
- [ ] Automatické objednávání

### V1.2

- [ ] Mobilní aplikace pro inventář
- [ ] QR kódy pro položky
- [ ] Fotky položek

### V1.3

- [ ] AI-powered demand forecasting
- [ ] Optimalizace nákupních cyklů
- [ ] Integrace s účetnictvím





