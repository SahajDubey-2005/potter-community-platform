import React from "react";
import LeadershipDashboardShell from "./LeadershipDashboardShell";

/** Dedicated Treasurer dashboard. Permissions and data are enforced server-side. */
export default function TreasurerDashboard({ api, activeUser, navigate }) {
  return <LeadershipDashboardShell
    api={api}
    activeUser={activeUser}
    navigate={navigate}
    expectedRole={ "Treasurer" }
    title={ "Treasurer Dashboard" }
    description={ "Track verified transactions, reconciliations and financial requests." }
    eyebrow={ "COMMUNITY FINANCE" }
    priorityKeys={ ["pending_finance", "unreconciled_finance", "pending_refunds", "verified_finance", "verified_volume"] }
    focusTitle={ "Finance workflow" }
    focusDescription={ "Figures count only saved transactions, never example revenue." }
    focusItems={ ["Verify transactions using the existing finance process.", "Reconcile verified payment records and review refund requests.", "Ensure payment records match bank and provider statements."] }
  />;
}
