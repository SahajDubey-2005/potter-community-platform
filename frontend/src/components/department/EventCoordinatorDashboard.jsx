import React from "react";
import DepartmentDashboardShell from "./DepartmentDashboardShell";

/** Dedicated Event Coordinator dashboard; all counts and access checks are enforced by FastAPI. */
export default function EventCoordinatorDashboard({ api, activeUser, navigate }) {
  return <DepartmentDashboardShell
    api={api} activeUser={activeUser} navigate={navigate}
    expectedRole={"Event Coordinator"}
    title={"Event Coordinator Dashboard"}
    eyebrow={"COMMUNITY EVENTS"}
    description={"Organize approved gatherings and monitor your event activity."}
    priorityKeys={["my_events", "pending_events", "registrations_for_my_events"]}
    focusTitle={"Event coordination"}
    focusItems={["Create and submit events in the existing Events section.", "Track registrations and record attendance according to your permissions."]}
  />;
}
