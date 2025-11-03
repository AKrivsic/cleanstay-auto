# WhatsApp Webhook Setup Guide

This guide explains how to set up WhatsApp Business API webhooks with 360dialog and test them locally and in production.

## Prerequisites

- 360dialog account with WhatsApp Business API access
- Vercel deployment with environment variables configured
- Supabase database with migrations applied

## Environment Variables

Add these to your `.env` file:

```env
# WhatsApp Business API
WABA_API_KEY=your_360dialog_api_key
WABA_BASE_URL=https://waba.360dialog.io
WHATSAPP_VERIFY_TOKEN=your_secure_verify_token

# CleanStay feature flag
CLEANSTAY_ENABLED=true
```

## 360dialog Setup

### 1. Login to 360dialog Console

1. Go to [360dialog Console](https://console.360dialog.com)
2. Login with your credentials
3. Navigate to your WhatsApp Business API instance

### 2. Configure Webhook URL

1. Go to **Webhooks** section
2. Set webhook URL to: `https://your-domain.vercel.app/api/webhook/whatsapp`
3. Set verify token to: `your_secure_verify_token` (same as in .env)
4. Select events to subscribe to:
   - ✅ Messages
   - ✅ Message status
   - ✅ Media

### 3. Test Webhook Connection

1. Click **Test Webhook** in 360dialog console
2. You should see a success message
3. Check your Vercel logs for webhook verification

## Local Development Testing

### 1. Using ngrok (Recommended)

```bash
# Install ngrok
npm install -g ngrok

# Start your local development server
npm run dev

# In another terminal, expose your local server
ngrok http 3000

# Use the ngrok URL for webhook testing
# Example: https://abc123.ngrok.io/api/webhook/whatsapp
```

### 2. Update 360dialog Webhook URL

1. Temporarily update webhook URL to your ngrok URL
2. Test webhook connection
3. Send test messages from WhatsApp
4. Check local logs for message processing

### 3. Test Message Flow

```bash
# Send test message from WhatsApp to your business number
# Check logs for:
# - Webhook signature verification
# - Message idempotence
# - Database storage
# - Media handling (if applicable)
```

## Production Deployment

### 1. Deploy to Vercel

```bash
# Deploy your application
vercel --prod

# Set environment variables in Vercel dashboard
vercel env add WABA_API_KEY
vercel env add WABA_BASE_URL
vercel env add WHATSAPP_VERIFY_TOKEN
vercel env add CLEANSTAY_ENABLED
```

### 2. Update 360dialog Webhook

1. Update webhook URL to your production domain
2. Test webhook connection
3. Verify message processing in production

## Testing Scenarios

### 1. Basic Message Test

```bash
# Send text message from WhatsApp
# Expected: Message stored in database with status 'stored'
```

### 2. Idempotence Test

```bash
# Send same message twice
# Expected: Second message ignored (idempotent)
```

### 3. Media Test

```bash
# Send image message
# Expected: Media metadata logged, download skeleton called
```

### 4. Error Handling Test

```bash
# Send malformed message
# Expected: 400 error, message not stored
```

## Webhook Endpoint Details

### GET /api/webhook/whatsapp

**Purpose:** Webhook verification
**Parameters:**

- `hub.mode=subscribe`
- `hub.verify_token=your_token`
- `hub.challenge=random_string`

**Response:** Returns challenge string

### POST /api/webhook/whatsapp

**Purpose:** Receive WhatsApp messages
**Headers:**

- `x-hub-signature-256`: HMAC signature for verification

**Response:**

- `204`: Success (no content)
- `400`: Invalid payload
- `403`: Invalid signature
- `500`: Server error
- `503`: Feature disabled

## Database Schema

The webhook stores messages in the `messages` table:

```sql
CREATE TABLE messages (
  id text PRIMARY KEY,           -- WhatsApp message ID
  from_phone text NOT NULL,      -- Sender phone number
  to_phone text NOT NULL,       -- Recipient phone number
  direction text NOT NULL,       -- 'in' or 'out'
  timestamp timestamptz NOT NULL, -- Message timestamp
  type text NOT NULL,           -- 'text', 'image', 'document', etc.
  payload_json jsonb NOT NULL,  -- Full WhatsApp payload
  tenant_id uuid,               -- Associated tenant (null for now)
  status text NOT NULL,         -- 'received', 'stored', 'error'
  created_at timestamptz DEFAULT now()
);
```

## Security Features

### 1. Signature Verification

```typescript
// Webhook signature is verified using HMAC-SHA256
const expectedSignature = crypto
  .createHmac("sha256", WABA_API_KEY)
  .update(JSON.stringify(body))
  .digest("hex");
```

### 2. Idempotence

```sql
-- Unique index prevents duplicate message processing
CREATE UNIQUE INDEX idx_messages_id_unique ON messages (id);
```

### 3. Safe Logging

```typescript
// Only safe metadata is logged (no tokens, no sensitive content)
console.log("Message stored:", {
  id: messageId,
  from: message.from,
  type: message.type,
  timestamp: messageData.timestamp,
});
```

## Troubleshooting

### Common Issues

1. **Webhook verification fails**

   - Check `WHATSAPP_VERIFY_TOKEN` matches 360dialog
   - Verify webhook URL is accessible

2. **Messages not being processed**

   - Check `CLEANSTAY_ENABLED=true`
   - Verify database connection
   - Check Supabase RLS policies

3. **Signature verification fails**

   - Verify `WABA_API_KEY` is correct
   - Check webhook URL matches exactly

4. **Database errors**
   - Ensure migrations are applied
   - Check RLS policies allow service role access

### Debug Commands

```bash
# Check webhook endpoint
curl -X GET "https://your-domain.vercel.app/api/webhook/whatsapp?hub.mode=subscribe&hub.verify_token=your_token&hub.challenge=test"

# Test with ngrok
curl -X POST "https://abc123.ngrok.io/api/webhook/whatsapp" \
  -H "Content-Type: application/json" \
  -H "x-hub-signature-256: sha256=..." \
  -d '{"object":"whatsapp_business_account","entry":[]}'
```

## Next Steps

1. **Media Download**: Implement actual media download in step 7
2. **Tenant Detection**: Add logic to detect tenant from phone number
3. **AI Processing**: Integrate with AI parser for message analysis
4. **Realtime Updates**: Add Supabase Realtime for live message updates

## Monitoring

### Vercel Logs

```bash
# View production logs
vercel logs --follow

# Filter for webhook logs
vercel logs --follow | grep "webhook"
```

### Supabase Logs

```sql
-- Check message processing
SELECT id, from_phone, type, status, created_at
FROM messages
ORDER BY created_at DESC
LIMIT 10;

-- Check for errors
SELECT id, from_phone, status, created_at
FROM messages
WHERE status = 'error'
ORDER BY created_at DESC;
```

## Security Checklist

- ✅ Webhook signature verification
- ✅ Idempotence protection
- ✅ Safe logging (no sensitive data)
- ✅ Feature flag protection
- ✅ Database RLS policies
- ✅ Error handling
- ✅ Rate limiting (via Vercel)

## Support

For issues with:

- **360dialog**: Contact 360dialog support
- **Vercel**: Check Vercel documentation
- **Supabase**: Check Supabase documentation
- **This implementation**: Check GitHub issues





