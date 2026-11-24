import React from "react";
import DepartmentDashboardShell from "./DepartmentDashboardShell";

/** Dedicated Matrimonial Coordinator dashboard; all counts and access checks are enforced by FastAPI. */
export default function MatrimonialCoordinatorDashboard({ api, activeUser, navigate }) {
  return <DepartmentDashboardShell
    api={api} activeUser={activeUser} navigate={navigate}
    expectedRole={"Matrimonial Coordinator"}
    title={"Matrimonial Coordinator Dashboard"}
    eyebrow={"MEMBER SERVICES"}
    description={"Coordinate private adult-member matrimonial reviews safely."}
    priorityKeys={["pending_profiles", "published_profiles"]}
    focusTitle={"Confidential review"}
    focusItems={["Review pending matrimonial profiles only when authorized.", "Maintain privacy; never share protected member information."]}
  />;
}
