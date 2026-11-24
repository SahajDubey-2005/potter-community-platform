import React from "react";
import DepartmentDashboardShell from "./DepartmentDashboardShell";

/** Dedicated Media Coordinator dashboard; all counts and access checks are enforced by FastAPI. */
export default function MediaCoordinatorDashboard({ api, activeUser, navigate }) {
  return <DepartmentDashboardShell
    api={api} activeUser={activeUser} navigate={navigate}
    expectedRole={"Media Coordinator"}
    title={"Media Coordinator Dashboard"}
    eyebrow={"COMMUNITY COMMUNICATIONS"}
    description={"Manage official announcements and monitor published updates."}
    priorityKeys={["my_drafts", "published_announcements"]}
    focusTitle={"Communications workflow"}
    focusItems={["Draft and publish announcements only if your role grants announcements.manage.", "The dashboard does not invent gallery or media records."]}
  />;
}
