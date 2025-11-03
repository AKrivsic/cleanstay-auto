# CleanStay AI Setup Guide

This document provides instructions for setting up the CleanStay AI architecture within the existing project.

## Overview

CleanStay AI is a comprehensive cleaning service management system that includes:
- WhatsApp Business API integration for real-time communication
- OpenAI-powered message parsing and understanding
- Supabase database for data persistence and real-time updates
- Admin and client dashboards
- Multi-tenant architecture with role-based access control

## New Files Added

### Environment Configuration
- `env.example` - Environment variables template
- `src/lib/env.ts` - Environment validation with Zod

### Supabase Integration
- `src/lib/supabase/client.ts` - Browser client for real-time features
- `src/lib/supabase/server.ts` - Server client with service role
- `src/lib/supabase/ssr.ts` - SSR helper for Next.js

### AI Parser
- `src/lib/ai/parseMessage.ts` - OpenAI-powered message parsing
- `src/lib/ai/__tests__/parseMessage.test.ts` - Unit tests

### API Routes
- `src/app/api/webhook/whatsapp/route.ts` - WhatsApp webhook handler
- `src/app/api/ai/parse/route.ts` - AI parsing endpoint
- `src/app/api/admin/tenants/route.ts` - Tenant management API
- `src/app/api/admin/properties/route.ts` - Property management API
- `src/app/api/admin/users/route.ts` - User management API

### Database Migrations
- `supabase/migrations/001_cleanstay_tenants.sql` - Tenants table
- `supabase/migrations/002_cleanstay_users.sql` - Users table
- `supabase/migrations/003_cleanstay_properties.sql` - Properties table
- `supabase/migrations/004_cleanstay_cleanings.sql` - Cleanings table
- `supabase/migrations/005_cleanstay_events.sql` - Events table
- `supabase/migrations/006_cleanstay_messages.sql` - Messages table
- `supabase/migrations/007_cleanstay_supplies.sql` - Supplies table
- `supabase/migrations/008_cleanstay_inventory.sql` - Inventory table
- `supabase/migrations/009_cleanstay_client_profile.sql` - Client profiles
- `supabase/migrations/010_cleanstay_active_sessions.sql` - Active sessions

### Dashboard Pages
- `src/app/(admin)/dashboard/page.tsx` - Admin dashboard
- `src/app/(client)/portal/page.tsx` - Client portal

### Utilities
- `src/lib/realtime.ts` - Realtime subscription management
- `src/lib/auth.ts` - Authentication helpers
- `src/middleware.ts` - Route protection middleware

### Testing
- `vitest.config.ts` - Vitest configuration
- `src/test/setup.ts` - Test setup and mocks

## Environment Setup

1. Copy `env.example` to `.env.local`:
   ```bash
   cp env.example .env.local
   ```

2. Fill in your environment variables:
   ```env
   # Supabase Configuration
   NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
   SUPABASE_SERVICE_ROLE_KEY=your_service_role_key

   # OpenAI Configuration
   OPENAI_API_KEY=your_openai_api_key

   # WhatsApp Business API Configuration
   WABA_API_KEY=your_whatsapp_api_key
   WABA_BASE_URL=your_whatsapp_base_url

   # Feature Flags
   CLEANSTAY_ENABLED=true
   ```

## Database Setup

### Local Development
1. Install Supabase CLI:
   ```bash
   npm install -g supabase
   ```

2. Initialize Supabase in your project:
   ```bash
   supabase init
   ```

3. Start local Supabase:
   ```bash
   supabase start
   ```

4. Run migrations:
   ```bash
   supabase db reset
   ```

### Production Deployment
1. Create a new Supabase project at https://supabase.com
2. Get your project URL and API keys
3. Run migrations using Supabase CLI:
   ```bash
   supabase db push
   ```

## WhatsApp Business API Setup

### 1. 360dialog Integration
1. Create account at https://360dialog.com
2. Get your API credentials
3. Set up webhook URL: `https://yourdomain.com/api/webhook/whatsapp`
4. Configure webhook events for messages

### 2. Webhook Verification
The webhook endpoint supports GET requests for verification:
- `hub.mode=subscribe`
- `hub.verify_token=your_verify_token`
- `hub.challenge=challenge_string`

### 3. Message Processing
POST requests to the webhook will:
- Verify message signatures (TODO: implement)
- Store raw messages in database
- Parse messages with AI
- Trigger real-time updates

## OpenAI Integration

### 1. API Key Setup
1. Get OpenAI API key from https://platform.openai.com
2. Add to environment variables
3. Configure usage limits and billing

### 2. Message Parsing
The AI parser supports these message types:
- `start_cleaning` - Beginning of cleaning process
- `supply_out` - Running out of supplies
- `linen_used` - Linen/cleaning materials used
- `note` - General note or update
- `photo_meta` - Photo with metadata
- `done` - Cleaning completed

## Feature Flags

### Enabling/Disabling CleanStay
Set `CLEANSTAY_ENABLED=false` in environment variables to disable:
- All CleanStay API routes return 503
- Dashboard routes redirect to home
- Database operations are mocked
- Realtime subscriptions are disabled

### Safe Rollback
To safely disable CleanStay:
1. Set `CLEANSTAY_ENABLED=false`
2. Deploy the change
3. CleanStay features will be disabled without affecting existing functionality

## Testing

### Run Tests
```bash
# Run all tests
npm test

# Run tests with UI
npm run test:ui

# Run tests once
npm run test:run
```

### Test Coverage
- AI parser functionality
- Environment validation
- Mock integrations
- Error handling

## Deployment

### Vercel Deployment
1. Connect your repository to Vercel
2. Set environment variables in Vercel dashboard
3. Deploy automatically on push to main branch

### Environment Variables in Vercel
Add all required environment variables:
- Supabase credentials
- OpenAI API key
- WhatsApp Business API credentials
- Feature flags

## Security Considerations

### API Security
- Webhook signature verification (TODO: implement)
- Rate limiting on API endpoints
- Input validation with Zod schemas
- SQL injection protection via Supabase

### Data Privacy
- Row Level Security (RLS) enabled on all tables
- Tenant isolation in database queries
- Secure API key storage
- No logging of sensitive data

## Monitoring and Logging

### Application Logs
- Environment validation errors
- API request/response logging
- Database operation errors
- AI parsing failures

### Performance Monitoring
- Database query performance
- API response times
- Realtime subscription health
- OpenAI API usage

## Troubleshooting

### Common Issues

1. **CleanStay disabled**: Check `CLEANSTAY_ENABLED` environment variable
2. **Database connection failed**: Verify Supabase credentials
3. **AI parsing not working**: Check OpenAI API key and usage limits
4. **WhatsApp webhook failing**: Verify webhook URL and signature

### Debug Mode
Enable debug logging by setting:
```env
NODE_ENV=development
```

## Support

For issues and questions:
1. Check this documentation
2. Review environment configuration
3. Check application logs
4. Verify all required services are running

## Next Steps

After successful setup:
1. Configure your first tenant
2. Add properties and users
3. Set up WhatsApp integration
4. Test the complete workflow
5. Customize dashboards as needed
