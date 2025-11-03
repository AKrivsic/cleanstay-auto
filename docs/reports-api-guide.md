# Reports API Guide

## Přehled

Reports API poskytuje strukturované reporty pro WhatsApp/AI chat integraci. Všechny endpointy jsou RLS-safe a používají client-side Supabase.

## Endpoints

### 1. Cleaning Report

```
GET /api/admin/reports/cleaning?propertyId=123&date=2025-01-22&withPhotos=true&format=chat
```

**Query parametry:**

- `propertyId` (required) - ID objektu
- `date` (required) - ISO datum (YYYY-MM-DD)
- `withPhotos` (optional) - Zahrnout fotky (default: false)
- `format` (optional) - "chat" pro formátovaný text

**Odpověď:**

```json
{
  "type": "cleaning_report",
  "property": {
    "id": "prop-123",
    "name": "Byt 302",
    "address": {
      "street": "Test St",
      "city": "Prague"
    }
  },
  "date": "2025-01-22",
  "cleaner": {
    "name": "Jan Novák",
    "phone": "+420123456789"
  },
  "startedAt": "2025-01-22T10:00:00Z",
  "endedAt": "2025-01-22T14:00:00Z",
  "durationMin": 240,
  "events": [
    {
      "t": "start",
      "ts": "2025-01-22T10:00:00Z",
      "data": "Začátek úklidu"
    }
  ],
  "photos": [
    {
      "thumbUrl": "https://storage.supabase.co/...",
      "mainUrl": "https://storage.supabase.co/...",
      "phase": "before"
    }
  ],
  "summary": {
    "notesCount": 2,
    "photosCount": 3,
    "supplies": ["Domestos", "Toaletní papír"],
    "linen": {
      "changed": 2,
      "dirty": 1
    }
  }
}
```

### 2. Photos Report

```
GET /api/admin/reports/photos?propertyId=123&date=2025-01-22&phase=before&format=chat
```

**Query parametry:**

- `propertyId` (required) - ID objektu
- `date` (required) - ISO datum
- `phase` (optional) - "before", "after", "all" (default: "all")
- `format` (optional) - "chat" pro formátovaný text

**Odpověď:**

```json
{
  "type": "photos",
  "property": {
    "id": "prop-123",
    "name": "Byt 302"
  },
  "date": "2025-01-22",
  "items": [
    {
      "eventId": "photo-123",
      "thumbUrl": "https://storage.supabase.co/...",
      "phase": "before"
    }
  ]
}
```

### 3. Inventory Report

```
GET /api/admin/reports/inventory?propertyId=123&range=7d&format=chat
```

**Query parametry:**

- `propertyId` (required) - ID objektu
- `range` (optional) - "7d", "14d", "30d", "custom" (default: "7d")
- `from` (optional) - ISO datum pro custom range
- `to` (optional) - ISO datum pro custom range
- `format` (optional) - "chat" pro formátovaný text

**Odpověď:**

```json
{
  "type": "inventory",
  "property": {
    "id": "prop-123",
    "name": "Byt 302"
  },
  "range": {
    "from": "2025-01-15",
    "to": "2025-01-22"
  },
  "consumption": [
    {
      "item": "domestos",
      "unit": "ks",
      "used": 2
    }
  ],
  "recommendation": [
    {
      "item": "domestos",
      "buy": 1,
      "rationale": "Použito 2 ks za období"
    }
  ]
}
```

## Chat Integration

### WhatsApp Dotazy

**Příklady dotazů:**

- "report 302 dnes" → Cleaning report pro Byt 302 dnes
- "fotky 302 včera" → Photos report pro Byt 302 včera
- "zásoby 302 3 týdny" → Inventory report pro Byt 302 za 3 týdny

**Formátované odpovědi:**

```
📋 Úklid Byt 302 - 22.1.2025
✅ Dokončeno (240 min)
👤 Jan Novák (+420123456789)
📝 2 poznámek
📸 3 fotek
📦 Doplněno: Domestos, Toaletní papír
🛏️ Prádlo: 2 změněno, 1 špinavé
```

### Ingest API Integration

Reports jsou automaticky rozpoznávány v `/api/ingest` endpointu:

```json
POST /api/ingest
{
  "text": "report 302 dnes",
  "from_phone": "+420123456789",
  "tenantId": "tenant-123"
}
```

**Odpověď:**

```json
{
  "ok": true,
  "response": "📋 Úklid Byt 302 - 22.1.2025\n✅ Dokončeno (240 min)\n👤 Jan Novák (+420123456789)\n📝 2 poznámek\n📸 3 fotek\n📦 Doplněno: Domestos, Toaletní papír\n🛏️ Prádlo: 2 změněno, 1 špinavé"
}
```

## Bezpečnost

- Všechny endpointy vyžadují admin roli
- RLS policies jsou enforced přes client-side Supabase
- Signed URLs mají TTL 48 hodin
- Žádné PII v logách

## Výkon

- Cache na 60 sekund (pokud withPhotos=false)
- Limit 6 hlavních fotek při withPhotos=true
- Edge runtime pro rychlé odpovědi
- Lazy loading signed URLs

## Testování

### cURL Příklady

```bash
# Cleaning report
curl "http://localhost:3000/api/admin/reports/cleaning?propertyId=prop-123&date=2025-01-22&format=chat" \
  -H "x-admin-role: admin" \
  -H "x-tenant-id: tenant-123"

# Photos report
curl "http://localhost:3000/api/admin/reports/photos?propertyId=prop-123&date=2025-01-22&phase=before&format=chat" \
  -H "x-admin-role: admin" \
  -H "x-tenant-id: tenant-123"

# Inventory report
curl "http://localhost:3000/api/admin/reports/inventory?propertyId=prop-123&range=7d&format=chat" \
  -H "x-admin-role: admin" \
  -H "x-tenant-id: tenant-123"
```

### Test Expirace URL

```bash
# Simulace expirace signed URL
curl "http://localhost:3000/api/admin/reports/photos?propertyId=prop-123&date=2025-01-22" \
  -H "x-admin-role: admin" \
  -H "x-tenant-id: tenant-123"
```

## Chybové Stavy

- `400` - Chybějící parametry
- `403` - Nedostatečná oprávnění
- `404` - Objekt nenalezen
- `500` - Interní chyba

**Příklad chybové odpovědi:**

```json
{
  "error": "Property not found"
}
```

## Monitoring

Všechny dotazy jsou logovány s bezpečnými metadaty:

- Počet eventů
- Počet fotek
- Délka období
- Tenant ID (maskované)

Žádné PII nebo signed URL nejsou logovány.





