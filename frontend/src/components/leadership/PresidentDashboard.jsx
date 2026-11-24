import React from "react";
import LeadershipDashboardShell from "./LeadershipDashboardShell";

/** Dedicated President / Head dashboard. Permissions and data are enforced server-side. */
export default function PresidentDashboard({ api, activeUser, navigate }) {
  return <LeadershipDashboardShell
    api={api}
    activeUser={activeUser}
    navigate={navigate}
    expectedRole={ "President / Head" }
    title={ "President Dashboard" }
    description={ "Review leadership decisions and oversee community progress." }
    eyebrow={ "LEADERSHIP & APPROVALS" }
    priorityKeys={ ["president_membership_queue", "president_scholarship_queue", "events_waiting_approval", "pending_records", "approved_members", "upcoming_events"] }
    focusTitle={ "Approval priorities" }
    focusDescription={ "Only decisions authorized by your current leadership appointment are shown." }
    focusItems={ ["Review memberships forwarded to the president.", "Approve or reject eligible events and official records.", "Track scholarship decisions reaching the final stage."] }
  />;
}
