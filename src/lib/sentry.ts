import * as Sentry from '@sentry/nextjs';

// Initialize Sentry
export function initSentry() {
  if (process.env.NODE_ENV === 'production' || (process.env.NODE_ENV as any) === 'staging') {
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
        new Sentry.Integrations.Express({ app: undefined }),
        new Sentry.Integrations.Prisma({ client: undefined }),
      ],
    });
  }
}

// Custom error reporting with context
export function reportError(error: Error, context?: Record<string, any>) {
  if (process.env.NODE_ENV === 'production' || (process.env.NODE_ENV as any) === 'staging') {
    Sentry.withScope(scope => {
      if (context) {
        Object.entries(context).forEach(([key, value]) => {
          scope.setContext(key, value);
        });
      }
      Sentry.captureException(error);
    });
  }
}

// Performance monitoring
export function startTransaction(name: string, op: string) {
  if (process.env.NODE_ENV === 'production' || (process.env.NODE_ENV as any) === 'staging') {
    return Sentry.startTransaction({ name, op });
  }
  return null;
}

// Add breadcrumb for debugging
export function addBreadcrumb(message: string, category: string, level: 'info' | 'warning' | 'error' = 'info') {
  if (process.env.NODE_ENV === 'production' || (process.env.NODE_ENV as any) === 'staging') {
    Sentry.addBreadcrumb({
      message,
      category,
      level,
      timestamp: Date.now() / 1000,
    });
  }
}

// Set user context
export function setUserContext(user: { id: string; tenant_id: string; role: string }) {
  if (process.env.NODE_ENV === 'production' || (process.env.NODE_ENV as any) === 'staging') {
    Sentry.setUser({
      id: user.id,
      tenant_id: user.tenant_id,
      role: user.role,
    });
  }
}

// Set tags for filtering
export function setTag(key: string, value: string) {
  if (process.env.NODE_ENV === 'production' || (process.env.NODE_ENV as any) === 'staging') {
    Sentry.setTag(key, value);
  }
}

// Capture message
export function captureMessage(message: string, level: 'info' | 'warning' | 'error' = 'info') {
  if (process.env.NODE_ENV === 'production' || (process.env.NODE_ENV as any) === 'staging') {
    Sentry.captureMessage(message, level);
  }
}

// Health check monitoring
export function reportHealthCheck(status: 'ok' | 'fail', details: Record<string, any>) {
  if (process.env.NODE_ENV === 'production' || (process.env.NODE_ENV as any) === 'staging') {
    Sentry.addBreadcrumb({
      message: 'Health check performed',
      category: 'health',
      level: status === 'ok' ? 'info' : 'error',
      data: details,
    });
  }
}

// API request monitoring
export function reportApiRequest(
  method: string,
  path: string,
  statusCode: number,
  duration: number,
  tenantId?: string
) {
  if (process.env.NODE_ENV === 'production' || (process.env.NODE_ENV as any) === 'staging') {
    Sentry.addBreadcrumb({
      message: `API ${method} ${path}`,
      category: 'api',
      level: statusCode >= 400 ? 'error' : 'info',
      data: {
        method,
        path,
        statusCode,
        duration,
        tenantId,
      },
    });
  }
}

// Database operation monitoring
export function reportDatabaseOperation(
  operation: string,
  table: string,
  duration: number,
  success: boolean,
  tenantId?: string
) {
  if (process.env.NODE_ENV === 'production' || (process.env.NODE_ENV as any) === 'staging') {
    Sentry.addBreadcrumb({
      message: `DB ${operation} ${table}`,
      category: 'database',
      level: success ? 'info' : 'error',
      data: {
        operation,
        table,
        duration,
        success,
        tenantId,
      },
    });
  }
}

// WhatsApp message monitoring
export function reportWhatsAppMessage(
  direction: 'in' | 'out',
  messageType: string,
  success: boolean,
  tenantId?: string
) {
  if (process.env.NODE_ENV === 'production' || (process.env.NODE_ENV as any) === 'staging') {
    Sentry.addBreadcrumb({
      message: `WhatsApp ${direction} ${messageType}`,
      category: 'whatsapp',
      level: success ? 'info' : 'error',
      data: {
        direction,
        messageType,
        success,
        tenantId,
      },
    });
  }
}

// AI parsing monitoring
export function reportAIParsing(
  inputLength: number,
  outputLength: number,
  confidence: number,
  success: boolean,
  tenantId?: string
) {
  if (process.env.NODE_ENV === 'production' || (process.env.NODE_ENV as any) === 'staging') {
    Sentry.addBreadcrumb({
      message: `AI parsing ${success ? 'success' : 'failed'}`,
      category: 'ai',
      level: success ? 'info' : 'error',
      data: {
        inputLength,
        outputLength,
        confidence,
        success,
        tenantId,
      },
    });
  }
}

// Cost monitoring
export function reportCostLimit(
  type: 'ai' | 'whatsapp',
  cost: number,
  limit: number,
  exceeded: boolean,
  tenantId?: string
) {
  if (process.env.NODE_ENV === 'production' || (process.env.NODE_ENV as any) === 'staging') {
    Sentry.addBreadcrumb({
      message: `Cost limit ${exceeded ? 'exceeded' : 'OK'} for ${type}`,
      category: 'cost',
      level: exceeded ? 'warning' : 'info',
      data: {
        type,
        cost,
        limit,
        exceeded,
        tenantId,
      },
    });
  }
}

export default Sentry;




