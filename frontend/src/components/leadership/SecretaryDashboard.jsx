import React from "react";
import LeadershipDashboardShell from "./LeadershipDashboardShell";

/** Dedicated Secretary dashboard. Permissions and data are enforced server-side. */
export default function SecretaryDashboard({ api, activeUser, navigate }) {
  return <LeadershipDashboardShell
    api={api}
    activeUser={activeUser}
    navigate={navigate}
    expectedRole={ "Secretary" }
    title={ "Secretary Dashboard" }
    description={ "Manage meeting documentation, records and community communications." }
    eyebrow={ "OFFICIAL RECORDS" }
    priorityKeys={ ["my_record_drafts", "pending_records", "published_records", "published_announcements", "upcoming_events"] }
    focusTitle={ "Secretary workflow" }
    focusDescription={ "Keep official minutes and announcements up to date." }
    focusItems={ ["Draft and submit meeting minutes using Official records.", "Track records awaiting the appropriate approval.", "Share approved communications through existing announcements."] }
  />;
}
