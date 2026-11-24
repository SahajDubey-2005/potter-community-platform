import React from "react";
import DepartmentDashboardShell from "./DepartmentDashboardShell";

/** Dedicated marketplace seller dashboard with ownership-scoped financial totals. */
export default function MarketplaceSellerDashboard({ api, activeUser, navigate }) {
  return <DepartmentDashboardShell
    api={api} activeUser={activeUser} navigate={navigate}
    endpoint="/role-dashboards/seller"
    expectedRole="Marketplace Seller"
    title="Marketplace Seller Dashboard"
    eyebrow="ARTISAN MARKETPLACE"
    description="Track your own pottery listings, paid order items and Shiprocket parcels."
    priorityKeys={["active_listings", "my_orders", "open_order_items", "delivered_order_items", "paid_item_value", "courier_shipments"]}
    focusTitle="Seller workflow"
    focusItems={[
      "Manage your real listings through Marketplace.",
      "Update your own shipment checkpoints and use Shiprocket where configured.",
      "Paid item value is gross, not a settlement or net payout calculation.",
    ]}
    showRecentOrders
  />;
}
