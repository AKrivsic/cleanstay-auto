export interface PhaseContext {
  hasOpenSession: boolean;
  minutesSinceStart?: number;
  minutesSinceDone?: number;
  isFirstPhotoAfterStart?: boolean;
  hasOtherEvents?: boolean;
}

export type PhotoPhase = 'before' | 'after' | 'other';

// Derive photo phase based on context
export function derivePhase(context: PhaseContext): PhotoPhase {
  const {
    hasOpenSession,
    minutesSinceStart = Infinity,
    minutesSinceDone = Infinity,
    isFirstPhotoAfterStart = false,
    hasOtherEvents = false
  } = context;

  // If there's an open session
  if (hasOpenSession) {
    // First photos after start and before other events → before
    if (isFirstPhotoAfterStart && !hasOtherEvents) {
      return 'before';
    }
    
    // Photos during active session → other
    return 'other';
  }

  // No open session
  // Photos within 2 hours after done → after
  if (minutesSinceDone <= 120) { // 2 hours = 120 minutes
    return 'after';
  }

  // All other cases → other
  return 'other';
}

// Helper function to determine if photo is first after session start
export function isFirstPhotoAfterStart(
  sessionStartTime: Date,
  photoTime: Date,
  existingEvents: Array<{ type: string; start: string }>
): boolean {
  const minutesSinceStart = (photoTime.getTime() - sessionStartTime.getTime()) / (1000 * 60);
  
  // Must be within 30 minutes of session start
  if (minutesSinceStart > 30) {
    return false;
  }
  
  // Check if there are any other events before this photo
  const photoTimestamp = photoTime.getTime();
  const hasEarlierEvents = existingEvents.some(event => {
    const eventTime = new Date(event.start).getTime();
    return eventTime < photoTimestamp && event.type !== 'photo';
  });
  
  return !hasEarlierEvents;
}

// Helper function to check if there are other events in session
export function hasOtherEventsInSession(
  events: Array<{ type: string }>
): boolean {
  return events.some(event => event.type !== 'photo');
}

// Helper function to get minutes since timestamp
export function getMinutesSince(timestamp: Date, now: Date = new Date()): number {
  return (now.getTime() - timestamp.getTime()) / (1000 * 60);
}

// Helper function to get minutes since done event
export function getMinutesSinceDone(
  doneEvents: Array<{ start: string }>,
  now: Date = new Date()
): number {
  if (doneEvents.length === 0) {
    return Infinity;
  }
  
  // Get the most recent done event
  const latestDone = doneEvents
    .sort((a, b) => new Date(b.start).getTime() - new Date(a.start).getTime())[0];
  
  return getMinutesSince(new Date(latestDone.start), now);
}

// Helper function to get minutes since session start
export function getMinutesSinceStart(
  sessionStartTime: Date,
  now: Date = new Date()
): number {
  return getMinutesSince(sessionStartTime, now);
}





