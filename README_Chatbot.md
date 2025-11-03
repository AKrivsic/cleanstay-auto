## CleanStay Chatbot

### ENV Vars

Add to your deployment:

```env
OPENAI_API_KEY=...

NEXT_PUBLIC_SUPABASE_URL=...
NEXT_PUBLIC_SUPABASE_ANON_KEY=...
SUPABASE_SERVICE_ROLE_KEY=...

WABA_API_KEY=...
WABA_BASE_URL=https://waba.360dialog.io
ADMIN_WHATSAPP_NUMBER="+420776292312"
WHATSAPP_TEMPLATE_NEWMSG="Nova zprava na webu: {{1}} Otevrit: {{2}}"
WHATSAPP_ALERTS_ENABLED=true

ADMIN_DASHBOARD_BASE_URL=https://app.cleanstay.cz

CHATBOT_ENABLED=true
```

### Usage

- Chat widget is auto-loaded via `ChatWidget` component (import and render in a layout or page) and styled with `src/styles/chatbot.css`.
- API endpoints:
  - `POST /api/chat` streaming SSE-like response
  - `POST /api/lead` creates lead and notifies admin via WhatsApp
- Admin:
  - `/admin/zpravy` shows messages with filters, mark-as-read action

### Data

- Messages stored in `messages` with extra additive columns for web chat.
- Conversations stored in `conversations` keyed by `session_id`.
- Leads in `leads` linked to `conversation_id`.

### Notes

- WhatsApp notifications fire only on lead creation.
- Do not log PII or secrets.
