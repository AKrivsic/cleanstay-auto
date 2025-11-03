# Automatické připomínky a plánování zpráv

## Přehled

Systém automatických notifikací přes WhatsApp (360dialog) s n8n orchestrací. Maximalizuje user-initiated vlákna (levnější), respektuje 24h okno a quiet hours.

## WhatsApp šablony (HSM)

### 1. cleaning_reminder (Den před úklidem)

**Účel:** Připomínka klientovi a uklízečce den před plánovaným úklidem

**Proměnné:**

- `{property_name}` - název objektu
- `{date}` - datum úklidu
- `{start_time}` - čas začátku
- `{confirm_link}` - odkaz na potvrzení

**Jazyky:** CZ, UA, EN

**Příklad (CZ):**

```
Dobrý den! Připomínáme Vám úklid v objektu {property_name} zítra {date} v {start_time}.
Prosím potvrďte účast odpovědí ANO nebo NE. Děkujeme!
```

### 2. cleaner_checklist (Po zahájení úklidu)

**Účel:** Checklist pro uklízečku po zahájení úklidu

**Proměnné:**

- `{property_name}` - název objektu
- `{checklist_short}` - zkrácený checklist

**Jazyky:** CZ, UA, EN

**Příklad (CZ):**

```
Úklid v {property_name} byl zahájen. Checklist: {checklist_short}.
Nezapomeňte pořídit fotografie před a po úklidu. Hodně štěstí!
```

### 3. post_cleaning_summary (Po dokončení)

**Účel:** Shrnutí pro klienta po dokončení úklidu

**Proměnné:**

- `{property_name}` - název objektu
- `{duration}` - délka úklidu
- `{supplies_short}` - spotřebované zásoby
- `{photo_gallery_link}` - odkaz na galerii

**Jazyky:** CZ, UA, EN

**Příklad (CZ):**

```
Úklid v {property_name} byl úspěšně dokončen za {duration}.
Spotřebované zásoby: {supplies_short}. Fotografie najdete v galerii.
```

## n8n Workflows

### Flow A - Den před úklidem (Reminder)

**Trigger:** Cron (každou hodinu)
**Cíl:** Odeslat připomínky s respektováním quiet hours

**Uzly:**

1. **Cron Trigger** - každou hodinu
2. **Get Tomorrow Schedule** - `/api/admin/schedule/tomorrow`
3. **Check Quiet Hours** - kontrola quiet hours (21:00-8:00)
4. **Check Already Sent** - kontrola duplicit
5. **Wait Until Allowed** - čekání na povolený čas
6. **Send Reminder** - odeslání přes 360dialog
7. **Log Notification** - zápis do events

**Logika:**

- Pokud je v quiet hours → čekat do 8:00
- Pokud už odesláno dnes → přeskočit
- Rate limit: max 1 zpráva / 30s / příjemce

### Flow B - Checklist po startu

**Trigger:** Webhook (volá backend při event:start)
**Cíl:** Odeslat checklist uklízečce

**Uzly:**

1. **Webhook Trigger** - `/cleaning-started`
2. **Delay 2 min** - čekání 2 minuty
3. **Send Checklist** - odeslání checklistu
4. **Log Checklist Sent** - zápis do events

### Flow C - Shrnutí po dokončení

**Trigger:** Webhook (při event:done)
**Cíl:** Odeslat shrnutí klientovi

**Uzly:**

1. **Webhook Trigger** - `/cleaning-completed`
2. **Get Cleaning Report** - `/api/admin/reports/cleaning`
3. **Format Summary** - zkrácení textu
4. **Send Summary** - odeslání shrnutí
5. **Log Summary Sent** - zápis do events

## API Endpointy

### GET /api/admin/schedule/tomorrow

**Účel:** Získat seznam plánovaných úklidů na příštích 24-36 hodin

**Response:**

```json
{
  "success": true,
  "data": {
    "date": "2024-01-23",
    "cleanings": [
      {
        "cleaning_id": "uuid",
        "property_name": "Byt 302",
        "scheduled_start": "2024-01-23T10:00:00Z",
        "client": {
          "phone": "+420123456789",
          "language": "cs",
          "quiet_hours": false
        },
        "cleaner": {
          "phone": "+420987654321",
          "language": "cs",
          "quiet_hours": false
        },
        "client_confirm_link": "https://...",
        "cleaner_confirm_link": "https://...",
        "notification_sent_today": false
      }
    ]
  }
}
```

### POST /api/admin/notify/whatsapp

**Účel:** Odeslat WhatsApp zprávu přes 360dialog

**Body:**

```json
{
  "to": "+420123456789",
  "template": "cleaning_reminder",
  "language": "cs",
  "variables": {
    "property_name": "Byt 302",
    "date": "23.1.2024",
    "start_time": "10:00",
    "confirm_link": "https://..."
  }
}
```

**Response:**

```json
{
  "success": true,
  "data": {
    "messageId": "wamid.xxx",
    "template": "cleaning_reminder",
    "language": "cs",
    "latency": "245ms"
  }
}
```

### POST /api/admin/events

**Účel:** Zapsat auditní log

**Body:**

```json
{
  "type": "notification_sent",
  "cleaning_id": "uuid",
  "recipient": "+420123456789",
  "template": "cleaning_reminder",
  "language": "cs",
  "result": "success",
  "latency_ms": 245
}
```

### GET /api/confirm/cleaning/[id]

**Účel:** Potvrdit účast na úklidu

**Query:** `?type=client|cleaner&token=...`

**Response:**

```json
{
  "success": true,
  "message": "Confirmation successful",
  "data": {
    "cleaning_id": "uuid",
    "property_name": "Byt 302",
    "scheduled_start": "2024-01-23T10:00:00Z",
    "confirmed": true,
    "type": "client"
  }
}
```

## Stav potvrzení

### User-initiated vlákna

Po odeslání reminder s CTA "Odpověz ANO/NE":

- Pokud příjemce odpoví → otevře se 24h okno
- Další zprávy (checklist, chat) běží levně
- Sledování v `cleanings.client_confirmed_at`, `cleanings.cleaner_confirmed_at`

### Potvrzovací odkazy

- `{confirm_link}` obsahuje token s expirací 7 dní
- Bezpečnost: Base64 encoded `{cleaningId}-{type}-{timestamp}`
- Ověření: kontrola expirace a validity

## Rate limiting a retry

### Rate limiting

- **Max 1 zpráva / 30s / příjemce**
- Implementace: Map s resetTime
- Chyba: HTTP 429 s retry-after

### Retry logika

- **3 pokusy** s exponenciálním zpožděním
- **5s, 30s, 2m** při 5xx chybách
- **Idempotence:** duplikát kontrola (cleaning + příjemce + den)

### Quiet hours

- **21:00 - 8:00** lokální čas
- **Wait Until** node v n8n
- **Timezone** z user profilu

## Lokalizace

### Jazyky

- **CZ** (výchozí)
- **UA** (ukrajinština)
- **EN** (angličtina)

### Detekce jazyka

- `users.language` z databáze
- Fallback na CZ
- Template switching: `{template}_{language}`

### Obsah

- **Max 320 znaků** (WhatsApp limit)
- **Přátelské** tón
- **Bez citlivých dat** (GDPR)
- **Stručné** bez marketingu

## Logging a metriky

### Events logging

```sql
INSERT INTO events (
  type = 'notification_sent',
  payload = {
    template: 'cleaning_reminder',
    recipient: '+420***',
    language: 'cs',
    result: 'success',
    latency_ms: 245
  }
)
```

### Metriky

- **Počet notifikací** podle šablony
- **Jazykové rozložení**
- **Průměrná latence**
- **Úspěšnost** (success rate)
- **User-initiated vs business-initiated**

### n8n denní souhrn

- **WhatsApp sessions** podle šablony
- **Náklady** (user vs business initiated)
- **Chybovost** a retry statistiky

## Testování

### Schválení šablon

1. **Nahrajte** přes 360dialog API
2. **Počkejte** na Meta schválení (24-48h)
3. **Ověřte** stav přes API
4. **Testujte** v sandbox
5. **Aktivujte** produkční použití

### Test endpointy

```bash
# Test schedule
curl -X GET "https://your-domain.com/api/admin/schedule/tomorrow"

# Test notification
curl -X POST "https://your-domain.com/api/admin/notify/whatsapp" \
  -H "Content-Type: application/json" \
  -d '{
    "to": "+420123456789",
    "template": "cleaning_reminder",
    "language": "cs",
    "variables": {
      "property_name": "Test Byt",
      "date": "23.1.2024",
      "start_time": "10:00",
      "confirm_link": "https://test.com"
    }
  }'
```

### n8n testování

1. **Import** workflows z `docs/n8n-flows.json`
2. **Nastavte** environment variables
3. **Testujte** jednotlivé uzly
4. **Ověřte** rate limiting a retry
5. **Zkontrolujte** quiet hours logiku

## Nasazení

### Environment variables

```env
BASE_URL=https://your-domain.com
API_TOKEN=your-api-token
WABA_API_KEY=your-waba-api-key
WABA_BASE_URL=https://waba.360dialog.io
```

### n8n konfigurace

1. **Import** workflows
2. **Nastavte** credentials
3. **Aktivujte** cron triggery
4. **Testujte** webhook endpointy
5. **Monitorujte** execution logs

### Monitoring

- **n8n execution** logs
- **API response** times
- **WhatsApp delivery** status
- **Rate limit** hits
- **Error rates** a retry patterns

## Troubleshooting

### Časté problémy

1. **Template not found** → zkontrolujte schválení
2. **Rate limit exceeded** → implementujte retry
3. **Quiet hours** → zkontrolujte timezone
4. **Token expired** → regenerujte confirm links
5. **360dialog errors** → zkontrolujte API key

### Debug logy

```javascript
// n8n Function node pro debug
console.log("Processing cleaning:", $json);
console.log("Quiet hours check:", $json.quiet_hours);
console.log("Rate limit status:", $json.rate_limit);
```

### Monitoring alerts

- **High error rate** (>5%)
- **Slow response** (>5s)
- **Rate limit** hits
- **Template** approval issues
- **Webhook** failures





