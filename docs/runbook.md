# CleanStay AI - Runbook

## Přehled

Tento runbook obsahuje postupy pro provoz, monitoring a řešení problémů v systému CleanStay AI.

## Obsah

1. [Deployment](#deployment)
2. [Monitoring](#monitoring)
3. [Troubleshooting](#troubleshooting)
4. [Rollback Procedures](#rollback-procedures)
5. [Emergency Contacts](#emergency-contacts)

## Deployment

### Staging Deployment

```bash
# Deploy to staging
npm run deploy:staging

# Verify deployment
curl -f https://staging.cleanstay.ai/api/health
```

### Production Deployment

```bash
# Deploy to production (only from main branch or tags)
npm run deploy:prod

# Verify deployment
curl -f https://cleanstay.ai/api/health
```

### Database Migrations

```bash
# Run migrations
npm run db:migrate

# Verify database health
npm run db:health

# Seed pilot data (staging only)
npm run db:seed
```

## Monitoring

### Health Checks

**Endpoint:** `/api/health`

**Response:**
```json
{
  "status": "ok",
  "version": "abc1234",
  "env": "production",
  "timestamp": "2024-01-22T10:00:00Z",
  "latency_ms": 150,
  "checks": {
    "database": { "status": "ok", "message": "Database connection successful" },
    "storage": { "status": "ok", "message": "Storage connection successful" },
    "rls": { "status": "ok", "message": "RLS policies working" },
    "pilot_data": { "status": "ok", "message": "Pilot data complete" },
    "feature_flags": { "status": "ok", "message": "Feature flags OK" },
    "environment": { "status": "ok", "message": "Environment variables OK" }
  }
}
```

### Uptime Monitoring

**URLs to monitor:**
- Production: `https://cleanstay.ai/api/health`
- Staging: `https://staging.cleanstay.ai/api/health`

**Expected response time:** < 500ms
**Expected uptime:** > 99.9%

### Key Metrics

1. **Response Time**
   - API endpoints: < 500ms
   - Health check: < 200ms
   - Database queries: < 100ms

2. **Error Rate**
   - API errors: < 1%
   - Database errors: < 0.1%
   - AI parsing errors: < 5%

3. **Cost Monitoring**
   - AI costs: < €2/day
   - WhatsApp costs: < €5/day
   - Total costs: < €7/day

## Troubleshooting

### Common Issues

#### 1. Health Check Failing

**Symptoms:**
- `/api/health` returns 503
- Database connection errors
- Storage bucket not found

**Diagnosis:**
```bash
# Check environment variables
echo $NEXT_PUBLIC_SUPABASE_URL
echo $SUPABASE_SERVICE_ROLE_KEY

# Test database connection
npm run db:health

# Check Supabase status
curl -f https://status.supabase.com
```

**Resolution:**
1. Verify environment variables
2. Check Supabase project status
3. Verify RLS policies
4. Check network connectivity

#### 2. AI Parsing Errors

**Symptoms:**
- High error rate in AI parsing
- Low confidence scores
- Timeout errors

**Diagnosis:**
```bash
# Check OpenAI API key
echo $OPENAI_API_KEY

# Test AI parsing
curl -X POST https://cleanstay.ai/api/ai/parse \
  -H "Content-Type: application/json" \
  -d '{"text": "Začínám úklid 302"}'
```

**Resolution:**
1. Verify OpenAI API key
2. Check API rate limits
3. Review prompt engineering
4. Monitor token usage

#### 3. WhatsApp Webhook Issues

**Symptoms:**
- Webhook not receiving messages
- Signature verification failures
- Message processing errors

**Diagnosis:**
```bash
# Check webhook configuration
curl -X POST https://cleanstay.ai/api/webhook/whatsapp \
  -H "Content-Type: application/json" \
  -d '{"test": "webhook"}'

# Verify 360dialog configuration
echo $WABA_API_KEY
echo $WABA_BASE_URL
```

**Resolution:**
1. Verify webhook URL in 360dialog
2. Check signature verification
3. Verify message processing logic
4. Check rate limits

#### 4. Database Performance Issues

**Symptoms:**
- Slow query responses
- Connection timeouts
- RLS policy errors

**Diagnosis:**
```sql
-- Check database performance
EXPLAIN ANALYZE SELECT * FROM events 
WHERE tenant_id = 'tenant-pilot-123' 
  AND created_at > NOW() - INTERVAL '1 day';

-- Check RLS policies
SELECT * FROM pg_policies 
WHERE tablename = 'events';
```

**Resolution:**
1. Check database indexes
2. Verify RLS policies
3. Monitor connection pool
4. Check query performance

### Error Codes

| Code | Description | Action |
|------|-------------|--------|
| 500 | Internal Server Error | Check logs, restart service |
| 503 | Service Unavailable | Check health checks, verify dependencies |
| 401 | Unauthorized | Check authentication, verify tokens |
| 403 | Forbidden | Check RLS policies, verify permissions |
| 429 | Rate Limited | Check rate limits, implement backoff |

## Rollback Procedures

### Vercel Rollback

1. **Access Vercel Dashboard**
   - Go to project settings
   - Navigate to "Deployments"
   - Find previous working deployment

2. **Revert to Previous Deployment**
   ```bash
   # Using Vercel CLI
   vercel --prod --force
   
   # Or use Vercel dashboard
   # Click "Revert to Deployment" on previous deployment
   ```

3. **Verify Rollback**
   ```bash
   curl -f https://cleanstay.ai/api/health
   ```

### Database Rollback

**⚠️ WARNING: Database rollbacks are complex and risky**

1. **Backup Current State**
   ```bash
   # Create backup
   pg_dump $DATABASE_URL > backup_$(date +%Y%m%d_%H%M%S).sql
   ```

2. **Identify Migration to Rollback**
   ```bash
   # List applied migrations
   supabase migration list
   ```

3. **Rollback Migration**
   ```bash
   # Rollback specific migration
   supabase db reset --linked
   ```

### Feature Flag Rollback

**Quick rollback using feature flags:**

1. **Disable CleanStay Features**
   ```bash
   # Set environment variable
   CLEANSTAY_ENABLED=false
   ```

2. **Redeploy with Feature Flag**
   ```bash
   vercel --prod --force
   ```

3. **Verify Rollback**
   ```bash
   # Check that new API routes return 503
   curl -f https://cleanstay.ai/api/ai/parse
   # Should return 503 Service Unavailable
   ```

## Emergency Contacts

### Technical Team

- **Lead Developer:** dev@cleanstay.ai
- **DevOps:** ops@cleanstay.ai
- **Database Admin:** dba@cleanstay.ai

### Business Team

- **Product Manager:** pm@cleanstay.ai
- **Operations:** ops@cleanstay.ai
- **Customer Support:** support@cleanstay.ai

### External Services

- **Supabase Support:** support@supabase.com
- **OpenAI Support:** help@openai.com
- **360dialog Support:** support@360dialog.com
- **Vercel Support:** support@vercel.com

### Emergency Procedures

1. **Service Down**
   - Check health endpoints
   - Verify external dependencies
   - Contact technical team
   - Consider rollback if needed

2. **Data Breach**
   - Immediately disable affected accounts
   - Contact DPO (dpo@cleanstay.ai)
   - Review audit logs
   - Notify affected users

3. **Cost Overrun**
   - Check cost limits
   - Disable AI/WhatsApp if needed
   - Review usage patterns
   - Contact finance team

## Monitoring Dashboards

### Sentry Dashboard
- **URL:** https://sentry.io/organizations/cleanstay
- **Purpose:** Error tracking and performance monitoring
- **Alerts:** Error rate > 5%, response time > 1s

### Vercel Dashboard
- **URL:** https://vercel.com/dashboard
- **Purpose:** Deployment monitoring and logs
- **Alerts:** Deployment failures, function timeouts

### Supabase Dashboard
- **URL:** https://supabase.com/dashboard
- **Purpose:** Database monitoring and logs
- **Alerts:** Connection failures, query timeouts

### Cost Monitoring
- **OpenAI Usage:** https://platform.openai.com/usage
- **WhatsApp Costs:** 360dialog dashboard
- **Vercel Costs:** Vercel billing dashboard

## Maintenance Windows

### Weekly Maintenance
- **Day:** Sunday
- **Time:** 02:00 - 04:00 CET
- **Tasks:**
  - Database optimization
  - Log cleanup
  - Security updates
  - Performance review

### Monthly Maintenance
- **Day:** First Sunday of month
- **Time:** 02:00 - 06:00 CET
- **Tasks:**
  - Full system backup
  - Security audit
  - Dependency updates
  - Performance optimization

## Backup Procedures

### Database Backup
```bash
# Daily backup
pg_dump $DATABASE_URL > backup_$(date +%Y%m%d).sql

# Weekly backup
pg_dump $DATABASE_URL | gzip > backup_$(date +%Y%m%d).sql.gz
```

### Storage Backup
```bash
# Backup media files
aws s3 sync s3://cleanstay-media s3://cleanstay-backup/media/
```

### Configuration Backup
```bash
# Backup environment variables
vercel env pull .env.backup
```

## Security Procedures

### Incident Response
1. **Detect** - Monitor logs and alerts
2. **Contain** - Isolate affected systems
3. **Eradicate** - Remove threat
4. **Recover** - Restore normal operations
5. **Learn** - Post-incident review

### Access Control
- **Admin Access:** Restricted to technical team
- **Client Access:** Tenant-scoped via RLS
- **API Access:** Rate limited and authenticated
- **Database Access:** Service role only

### Audit Logging
- **All API calls** logged with tenant_id
- **All database operations** logged
- **All file uploads** logged
- **All cost limit breaches** logged

---

**Last Updated:** 2024-01-22  
**Version:** 1.0  
**Contact:** ops@cleanstay.ai





