import { isCleanStayEnabled } from '@/lib/env';
import { getSupabaseServerClient } from '@/lib/supabase/server';

// Client Portal Page
export default async function ClientPortal() {
  if (!isCleanStayEnabled()) {
    return (
      <div className="client-portal">
        <h1>Client Portal</h1>
        <p>CleanStay feature is disabled</p>
      </div>
    );
  }

  // Fetch client data
  const supabase = getSupabaseServerClient();
  
  // TODO: Implement actual data fetching
  const clientData = {
    upcomingCleanings: 0,
    completedCleanings: 0,
    pendingMessages: 0,
    propertyCount: 0,
  };

  return (
    <div className="client-portal">
      <h1>Client Portal</h1>
      <p>TODO: Client portal implementation</p>
      
      <div className="portal-stats">
        <div className="stat-card">
          <h3>Upcoming Cleanings</h3>
          <p>{clientData.upcomingCleanings}</p>
        </div>
        <div className="stat-card">
          <h3>Completed Cleanings</h3>
          <p>{clientData.completedCleanings}</p>
        </div>
        <div className="stat-card">
          <h3>Pending Messages</h3>
          <p>{clientData.pendingMessages}</p>
        </div>
        <div className="stat-card">
          <h3>Properties</h3>
          <p>{clientData.propertyCount}</p>
        </div>
      </div>

      <div className="portal-sections">
        <section>
          <h2>My Properties</h2>
          <p>TODO: Show client's properties with cleaning schedules</p>
        </section>

        <section>
          <h2>Cleaning History</h2>
          <p>TODO: Show past cleaning sessions and feedback</p>
        </section>

        <section>
          <h2>Messages</h2>
          <p>TODO: Show WhatsApp messages and communication history</p>
        </section>

        <section>
          <h2>Feedback</h2>
          <p>TODO: Allow clients to provide feedback and ratings</p>
        </section>
      </div>
    </div>
  );
}

// Metadata for the page
export const metadata = {
  title: 'Client Portal - CleanStay',
  description: 'CleanStay client portal for managing properties and cleaning services',
};
