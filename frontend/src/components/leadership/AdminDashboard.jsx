import React from "react";
import LeadershipDashboardShell from "./LeadershipDashboardShell";

/** Dedicated Admin dashboard. Permissions and data are enforced server-side. */
export default function AdminDashboard({ api, activeUser, navigate }) {
  return <LeadershipDashboardShell
    api={api}
    activeUser={activeUser}
    navigate={navigate}
    expectedRole={ "Admin" }
    title={ "Admin Dashboard" }
    description={ "Coordinate membership approvals, documentation, events and everyday community support." }
    eyebrow={ "COMMUNITY OPERATIONS" }
    priorityKeys={ ["pending_members", "pending_documents", "open_emergencies", "open_enquiries", "events_waiting_approval", "upcoming_events"] }
    focusTitle={ "Operational focus" }
    focusDescription={ "Manage today’s support queues using existing approval tools." }
    focusItems={ ["Process pending membership records and document reviews.", "Follow up on emergency support and new enquiries.", "Coordinate announcements and published events."] }
  />;
}
