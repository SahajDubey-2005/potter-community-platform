import React from "react";
import DepartmentDashboardShell from "./DepartmentDashboardShell";

/** Dedicated Scholarship Officer dashboard; all counts and access checks are enforced by FastAPI. */
export default function ScholarshipOfficerDashboard({ api, activeUser, navigate }) {
  return <DepartmentDashboardShell
    api={api} activeUser={activeUser} navigate={navigate}
    expectedRole={"Scholarship Officer"}
    title={"Scholarship Officer Dashboard"}
    eyebrow={"SCHOLARSHIP SUPPORT"}
    description={"Review community scholarship requests and track verified records."}
    priorityKeys={["officer_review", "scholarship_open", "active_scholarships"]}
    focusTitle={"Scholarship workflow"}
    focusItems={["Review the existing application queue when your role has scholarships.review permission.", "Use the Scholarships section for actual reviews and decisions."]}
  />;
}
