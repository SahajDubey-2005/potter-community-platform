import React from "react";
import DepartmentDashboardShell from "./DepartmentDashboardShell";

/** Dedicated Legal Grievance Coordinator dashboard; all counts and access checks are enforced by FastAPI. */
export default function LegalGrievanceDashboard({ api, activeUser, navigate }) {
  return <DepartmentDashboardShell
    api={api} activeUser={activeUser} navigate={navigate}
    expectedRole={"Legal Grievance Coordinator"}
    title={"Legal & Grievance Dashboard"}
    eyebrow={"COMMUNITY SUPPORT"}
    description={"Review authorized community support and emergency cases."}
    priorityKeys={["open_inquiries", "open_emergencies"]}
    focusTitle={"Case coordination"}
    focusItems={["Use existing Support Enquiries and Emergency Support workflows when authorized.", "A separate legal case database has not been added; this dashboard does not imply legal case tracking exists."]}
  />;
}
