// Telemetry and logging for admin dashboard
// Safe logging - no PII or sensitive data

interface TelemetryEvent {
  action: string;
  component: string;
  duration?: number;
  count?: number;
  error?: string;
  metadata?: Record<string, any>;
}

class AdminTelemetry {
  private static instance: AdminTelemetry;
  private events: TelemetryEvent[] = [];

  private constructor() {}

  static getInstance(): AdminTelemetry {
    if (!AdminTelemetry.instance) {
      AdminTelemetry.instance = new AdminTelemetry();
    }
    return AdminTelemetry.instance;
  }

  // Log safe telemetry events
  log(event: TelemetryEvent): void {
    // Add timestamp
    const telemetryEvent = {
      ...event,
      timestamp: new Date().toISOString(),
      sessionId: this.getSessionId()
    };

    this.events.push(telemetryEvent);

    // Log to console in development
    if (process.env.NODE_ENV === 'development') {
      console.log('Admin Telemetry:', telemetryEvent);
    }

    // In production, you would send to analytics service
    if (process.env.NODE_ENV === 'production') {
      this.sendToAnalytics(telemetryEvent);
    }
  }

  // Log data loading events
  logDataLoad(component: string, duration: number, count: number): void {
    this.log({
      action: 'data_load',
      component,
      duration,
      count,
      metadata: {
        performance: duration < 1000 ? 'fast' : duration < 3000 ? 'normal' : 'slow'
      }
    });
  }

  // Log user interactions
  logInteraction(component: string, action: string, metadata?: Record<string, any>): void {
    this.log({
      action: 'user_interaction',
      component,
      metadata: {
        ...metadata,
        interaction: action
      }
    });
  }

  // Log errors
  logError(component: string, error: string, metadata?: Record<string, any>): void {
    this.log({
      action: 'error',
      component,
      error,
      metadata
    });
  }

  // Log realtime events
  logRealtimeEvent(type: string, count: number): void {
    this.log({
      action: 'realtime_event',
      component: 'realtime_feed',
      count,
      metadata: {
        eventType: type
      }
    });
  }

  // Log photo operations
  logPhotoOperation(operation: string, count: number, duration?: number): void {
    this.log({
      action: 'photo_operation',
      component: 'photo_modal',
      count,
      duration,
      metadata: {
        operation
      }
    });
  }

  // Get session ID (safe identifier)
  private getSessionId(): string {
    // Generate a safe session ID (not user-specific)
    return `admin-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }

  // Send to analytics service (placeholder)
  private sendToAnalytics(event: TelemetryEvent): void {
    // In production, send to your analytics service
    // Example: Google Analytics, Mixpanel, etc.
    console.log('Analytics:', event);
  }

  // Get telemetry summary
  getSummary(): {
    totalEvents: number;
    errorCount: number;
    avgDuration: number;
    components: Record<string, number>;
  } {
    const totalEvents = this.events.length;
    const errorCount = this.events.filter(e => e.action === 'error').length;
    const durations = this.events.filter(e => e.duration).map(e => e.duration!);
    const avgDuration = durations.length > 0 ? durations.reduce((a, b) => a + b, 0) / durations.length : 0;

    const components = this.events.reduce((acc, event) => {
      acc[event.component] = (acc[event.component] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    return {
      totalEvents,
      errorCount,
      avgDuration: Math.round(avgDuration),
      components
    };
  }

  // Clear telemetry data
  clear(): void {
    this.events = [];
  }
}

// Export singleton instance
export const adminTelemetry = AdminTelemetry.getInstance();

// Helper functions for common telemetry events
export const logDataLoad = (component: string, duration: number, count: number) => {
  adminTelemetry.logDataLoad(component, duration, count);
};

export const logInteraction = (component: string, action: string, metadata?: Record<string, any>) => {
  adminTelemetry.logInteraction(component, action, metadata);
};

export const logError = (component: string, error: string, metadata?: Record<string, any>) => {
  adminTelemetry.logError(component, error, metadata);
};

export const logRealtimeEvent = (type: string, count: number) => {
  adminTelemetry.logRealtimeEvent(type, count);
};

export const logPhotoOperation = (operation: string, count: number, duration?: number) => {
  adminTelemetry.logPhotoOperation(operation, count, duration);
};





