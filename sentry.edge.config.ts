import * as Sentry from '@sentry/nextjs';

Sentry.init({
  dsn: process.env.SENTRY_DSN,
  environment: process.env.NODE_ENV || process.env.VERCEL_ENV || 'development',
  tracesSampleRate: 0.1,
  debug: false,
  beforeSend(event) {
    // Filter out PII and sensitive data
    if (event.user) {
      delete event.user.email;
      delete event.user.phone;
    }
    
    // Remove sensitive data from breadcrumbs
    if (event.breadcrumbs) {
      event.breadcrumbs = event.breadcrumbs.map(breadcrumb => {
        if (breadcrumb.data) {
          // Remove sensitive fields
          const sensitiveFields = ['password', 'token', 'key', 'secret'];
          sensitiveFields.forEach(field => {
            if (breadcrumb.data && breadcrumb.data[field]) {
              breadcrumb.data[field] = '[REDACTED]';
            }
          });
        }
        return breadcrumb;
      });
    }
    
    return event;
  },
  integrations: [
    new Sentry.Integrations.Http({ tracing: true }),
  ],
});




