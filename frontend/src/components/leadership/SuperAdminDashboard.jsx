import React from "react";
import LeadershipDashboardShell from "./LeadershipDashboardShell";

/** Dedicated Super Admin dashboard. Permissions and data are enforced server-side. */
export default function SuperAdminDashboard({ api, activeUser, navigate }) {
  return <LeadershipDashboardShell
    api={api}
    activeUser={activeUser}
    navigate={navigate}
    expectedRole={ "Super Admin" }
    title={ "Super Admin Dashboard" }
    description={ "Platform oversight and access to authorized administration tools." }
    eyebrow={ "PLATFORM ADMINISTRATION" }
    priorityKeys={ ["active_accounts", "approved_members", "pending_members", "pending_documents", "open_emergencies", "pending_finance", "events_waiting_approval"] }
    focusTitle={ "Platform oversight" }
    focusDescription={ "Use the live figures to prioritize member requests and community operations." }
    focusItems={ ["Review outstanding membership and document cases.", "Monitor urgent support needs and unresolved enquiries.", "Manage system roles using existing protected workflows."] }
  />;
}
