import { isCleanStayEnabled } from '@/lib/env';
import { getSupabaseServerClient } from '@/lib/supabase/server';

// Admin Dashboard Page
export default async function AdminDashboard() {
  if (!isCleanStayEnabled()) {
    return (
      <div className="admin-dashboard">
        <h1>Admin Dashboard</h1>
        <p>CleanStay feature is disabled</p>
      </div>
    );
  }

  // Fetch dashboard data
  const supabase = getSupabaseServerClient();
  
  // TODO: Implement actual data fetching
  const dashboardData = {
    tenants: 0,
    properties: 0,
    activeCleanings: 0,
    recentMessages: 0,
  };

  return (
    <div className="admin-dashboard">
      <h1>Admin Dashboard</h1>
      <p>TODO: Dashboard implementation</p>
      
      <div className="dashboard-stats">
        <div className="stat-card">
          <h3>Tenants</h3>
          <p>{dashboardData.tenants}</p>
        </div>
        <div className="stat-card">
          <h3>Properties</h3>
          <p>{dashboardData.properties}</p>
        </div>
        <div className="stat-card">
          <h3>Active Cleanings</h3>
          <p>{dashboardData.activeCleanings}</p>
        </div>
        <div className="stat-card">
          <h3>Recent Messages</h3>
          <p>{dashboardData.recentMessages}</p>
        </div>
      </div>

      <div className="dashboard-sections">
        <section>
          <h2>Recent Activity</h2>
          <p>TODO: Show recent cleaning activities, messages, and events</p>
        </section>

        <section>
          <h2>System Status</h2>
          <p>TODO: Show system health, API status, and feature flags</p>
        </section>

        <section>
          <h2>Quick Actions</h2>
          <p>TODO: Add tenant, property, user management shortcuts</p>
        </section>
      </div>
    </div>
  );
}

// Metadata for the page
export const metadata = {
  title: 'Admin Dashboard - CleanStay',
  description: 'CleanStay admin dashboard for managing tenants, properties, and cleaning operations',
};
