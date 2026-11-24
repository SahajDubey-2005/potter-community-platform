import React from "react";
import DepartmentDashboardShell from "./DepartmentDashboardShell";

/** Dedicated Verification Officer dashboard; all counts and access checks are enforced by FastAPI. */
export default function VerificationOfficerDashboard({ api, activeUser, navigate }) {
  return <DepartmentDashboardShell
    api={api} activeUser={activeUser} navigate={navigate}
    expectedRole={"Verification Officer"}
    title={"Verification Officer Dashboard"}
    eyebrow={"MEMBERSHIP VERIFICATION"}
    description={"Track document-verification and member-review workloads."}
    priorityKeys={["pending_documents", "pending_members", "approved_documents"]}
    focusTitle={"Verification workflow"}
    focusItems={["Review identity and supporting documents in the protected Documents section.", "Escalate or forward membership requests using the existing review process."]}
  />;
}
