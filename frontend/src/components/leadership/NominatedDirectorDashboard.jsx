import React from "react";
import LeadershipDashboardShell from "./LeadershipDashboardShell";

/** Dedicated Nominated Director dashboard. Permissions and data are enforced server-side. */
export default function NominatedDirectorDashboard({ api, activeUser, navigate }) {
  return <LeadershipDashboardShell
    api={api}
    activeUser={activeUser}
    navigate={navigate}
    expectedRole={ "Nominated Director" }
    title={ "Nominated Director Dashboard" }
    description={ "Follow the community agenda and support your nominated committee responsibilities." }
    eyebrow={ "NOMINATED LEADERSHIP" }
    priorityKeys={ ["my_active_assignments", "upcoming_events", "published_announcements", "approved_members"] }
    focusTitle={ "Nominated responsibilities" }
    focusDescription={ "Your view is limited to records and actions granted to your appointment." }
    focusItems={ ["Follow your active committee assignment and any recorded notes.", "Stay informed about published events and announcements.", "Use member services and authorized committee tools."] }
  />;
}
