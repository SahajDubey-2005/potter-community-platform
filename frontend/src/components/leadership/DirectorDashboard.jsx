import React from "react";
import LeadershipDashboardShell from "./LeadershipDashboardShell";

/** Dedicated Director dashboard. Permissions and data are enforced server-side. */
export default function DirectorDashboard({ api, activeUser, navigate }) {
  return <LeadershipDashboardShell
    api={api}
    activeUser={activeUser}
    navigate={navigate}
    expectedRole={ "Director" }
    title={ "Director Dashboard" }
    description={ "Monitor community initiatives and fulfill your assigned responsibilities." }
    eyebrow={ "BOARD OPERATIONS" }
    priorityKeys={ ["my_active_assignments", "approved_members", "upcoming_events", "published_announcements", "pending_records"] }
    focusTitle={ "Director responsibilities" }
    focusDescription={ "Your access follows the permissions and dates of your active appointment." }
    focusItems={ ["Review upcoming events and committee priorities.", "Use only the management tools your role grants.", "Coordinate assigned work through existing records and member services."] }
  />;
}
