## CleanStay Chatbot Repo Audit (Read-Only)

Scope: Identify existing messaging, WhatsApp, admin “Zprávy” areas, DB schema and RLS to REUSE; list only minimal extensions required. No renames/drops.

### Findings: Frontend/Widget

- Existing lightweight site widget found in `src/js/chat-widget.js` with CSS in `src/css/chat-widget.css`.
  - Injects a floating bubble, simple panel, posts to an external proxy `https://cleanstay-chat-api2.vercel.app/api/chat` and renders non-streamed JSON reply.
  - Session persistence via `localStorage` key `chatSessionId`.
- Next.js App Router components for chat do not exist yet. No `ChatWidget.tsx`, `ChatThread.tsx`, or `LeadForm.tsx` found.

Reuse: the UX pattern (floating bubble, panel) and color tokens from existing CSS. We will create typed React components under `src/components/Chatbot/` and a dedicated stylesheet `src/styles/chatbot.css` (px-based) while keeping current design conventions.

### Findings: Admin “Zprávy”

- No explicit `Zprávy` page/component found. Admin area exists at `src/app/(admin)/dashboard/**` with realtime and sections (events, properties), but not a messages inbox/thread UI.

Reuse: Admin layout and conventions. We will EXTEND the admin to include a messages list/thread view that can also consume WEB chat messages. Minimal additive changes with badges/filters.

### Findings: WhatsApp Integration

- Webhook endpoint present: `src/app/api/webhook/whatsapp/route.ts` with signature verification and message storage stub.
- Admin send endpoint: `src/app/api/admin/notify/whatsapp/route.ts` includes a 360dialog sender helper (`sendWhatsAppMessage`) and simple rate-limiting.
- Env helpers: `src/lib/env.ts` exposes WhatsApp config getters with `WABA_API_KEY`, `WABA_BASE_URL`.

Reuse: We will wrap a server utility `src/server/notifications/whatsapp.ts` around the existing sender logic and env access. New function: `sendAdminWhatsappAlert({ conversationId, preview, originUrl })`. It should call the existing 360dialog sender under the hood and handle errors without blocking user flow.

### Findings: OpenAI / LLM

- `src/lib/env.ts` includes OpenAI config getter `getOpenAIConfig()` expecting `OPENAI_API_KEY`.
- No chat streaming API route exists yet for website chat.

Reuse: Existing env loader; implement `src/app/api/chat/route.ts` with SSE/ReadableStream to stream tokens from the existing OpenAI proxy or direct OpenAI API per env.

### Findings: Database Schema (Supabase / Postgres)

- `supabase/migrations/006_cleanstay_messages.sql` and `20250127_001_init.sql` define a `messages` table focused on WhatsApp ingestion:
  - WhatsApp-oriented columns: `id`, `tenant_id`, `from_phone/from_number`, `to_phone/to_number`, `message_type`, `whatsapp_message_id`, `raw_data/payload_json`, `created_at`. Indexes on tenant/ids/created_at.
  - RLS enabled; service role policies present in `20251024010102_rls.sql` (broad admin/authenticated policies also present).
- No `conversations` or `leads` tables found.

Reuse: Existing `messages` table name must be preserved. For website chat, we will not drop/rename columns. We will ADD minimal columns for WEB chat compatibility OR create a compatibility VIEW if direct changes are constrained.

Proposed additive columns on `public.messages` (idempotent guards):

- `source text` CHECK in ('web','whatsapp') default 'web'
- `conversation_id uuid`
- `role text` CHECK in ('user','assistant','system')
- `text text`
- `intent text`
- `confidence numeric`
- `unread boolean default true`
- `session_id text`
- `origin_url text`
- Indexes: `(tenant_id, created_at)`, `(session_id)`, `(conversation_id)`, partial on `(unread)` where `source='web'`

If altering `messages` is not feasible in your environment, create a `web_messages` VIEW selecting from `messages` with computed defaults, so Admin “Zprávy” can read unified data without breaking RLS.

Additive tables (only if missing):

- `conversations(id uuid pk, tenant_id uuid, session_id text, locale text, source_url text, started_at timestamptz default now())`
- `leads(id uuid pk, conversation_id uuid fk, name text, email text, phone text, service_type text, city text, size_m2 int, cadence text, rush boolean, consent boolean, created_at timestamptz default now())`

RLS: Reuse existing helper patterns and ensure service role insert/select works. Keep all tenant filters via `tenant_id`.

### Findings: Tests and Docs

- WhatsApp docs present in `docs/whatsapp-webhook-setup.md`.
- No unit tests for a website chat intent normalizer/lead notifier yet.

### What Will Be REUSED

- Existing CSS conventions (px units) and color usage cues from `src/css/chat-widget.css`.
- Env management in `src/lib/env.ts` for OpenAI and WhatsApp.
- 360dialog sender logic in `src/app/api/admin/notify/whatsapp/route.ts` (to be wrapped for admin alerts).
- Admin dashboard layout and patterns (`src/app/(admin)/dashboard/**`).
- `messages` table name and existing indexes/RLS.

### What Must Be EXTENDED (Additive Only)

1. Frontend (Next.js App Router)
   - `src/components/Chatbot/ChatWidget.tsx` (floating bubble, proactive prompt, chips)
   - `src/components/Chatbot/ChatThread.tsx` (SSE/ReadableStream streaming)
   - `src/components/Chatbot/LeadForm.tsx` (name optional; email/phone one required; GDPR checkbox required)
   - `src/styles/chatbot.css` (px units; reuse given color tokens)

2. API & Server
   - `src/app/api/chat/route.ts` (POST; streaming; persist messages with source='web', mark `unread=true`)
   - `src/app/api/lead/route.ts` (POST; create lead, link to conversation, trigger WhatsApp admin alert)
   - `src/server/notifications/whatsapp.ts` with `sendAdminWhatsappAlert(...)` using existing 360dialog sender

3. Admin “Zprávy” (reuse, additive)
   - Add list view showing `source` badge (WEB/WA), filters `source`, `unread`, `hasContact`
   - Mark-as-read action
   - Side panel thread + lead details

4. DB & RLS (additive)
   - Add columns to `messages` or create `web_messages` VIEW
   - Add `conversations` and `leads` tables if missing
   - Keep RLS multi-tenant constraints and service role access

5. Tests
   - Unit: normalizer, intent detector, WhatsApp notifier (mock)
   - E2E: widget → message row (source=WEB, unread=true), SSE streaming, lead submit triggers alert once, admin filters/actions

Notes

- Website chat is distinct from WhatsApp; WhatsApp is used only for admin notifications on lead creation.
- No existing columns will be dropped/renamed. Only additive migrations or views will be introduced.
