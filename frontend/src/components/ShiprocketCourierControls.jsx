import React, { useEffect, useState } from "react";
import { PackageCheck, Truck, RefreshCw } from "lucide-react";

const API = (import.meta.env.VITE_API_BASE_URL || "http://localhost:8000").replace(/\/$/, "");

async function call(path, method = "GET", body = null) {
  const token = sessionStorage.getItem("potterCommunityAccessToken") || localStorage.getItem("token");
  const response = await fetch(`${API}${path}`, {
    method,
    headers: {
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...(body ? { "Content-Type": "application/json" } : {}),
    },
    ...(body ? { body: JSON.stringify(body) } : {}),
  });
  const data = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(typeof data.detail === "string" ? data.detail : "Courier API request failed.");
  return data;
}

export default function ShiprocketCourierControls({ order, item, activeUser, onRefresh }) {
  const sellerId = Number(item.seller_id);
  const admin = ["ADMIN", "SUPER ADMIN"].includes(String(activeUser?.role || "").toUpperCase());
  const endpoint = `/marketplace/courier/orders/${order.id}/items/${item.product_id}`;
  const [shipment, setShipment] = useState(null);
  const [pickup, setPickup] = useState("");
  const [pickupDraft, setPickupDraft] = useState("");
  const [loading, setLoading] = useState(false);
  const [busy, setBusy] = useState("");
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [parcel, setParcel] = useState({
    destination_address: order.delivery_address || "", destination_city: "", destination_state: "", destination_pincode: "",
    recipient_email: order.buyer_email || "",
    weight_kg: "", length_cm: "", breadth_cm: "", height_cm: "",
  });
  const changed = (field, value) => setParcel((prev) => ({ ...prev, [field]: value }));

  useEffect(() => {
    let live = true;
    setLoading(true);
    Promise.all([
      call(endpoint), call(`/marketplace/courier/pickup-location/${sellerId}`),
    ]).then(([ship, location]) => {
      if (!live) return;
      setShipment(ship);
      setPickup(location.pickup_location || "");
      setPickupDraft(location.pickup_location || "");
    }).catch((failure) => { if (live) setError(failure.message); })
      .finally(() => { if (live) setLoading(false); });
    return () => { live = false; };
  }, [endpoint, sellerId]);

  const perform = async (action, fn) => {
    setBusy(action); setError(""); setNotice("");
    try {
      const result = await fn();
      if (result?.state) setShipment(result);
      setNotice(action === "pickup" ? "Pickup request sent to Shiprocket." :
        action === "create" ? "Shiprocket shipment created. Assign an AWB next." :
        action === "awb" ? "AWB assigned. You can request pickup." :
        action === "sync" ? "Courier checkpoints synchronized." : "Seller pickup location saved.");
      if (typeof onRefresh === "function") await onRefresh();
    } catch (failure) { setError(failure.message); }
    finally { setBusy(""); }
  };

  const savePickup = () => perform("pickup-setting", async () => {
    const updated = await call("/marketplace/courier/pickup-location", "PUT", { seller_id: sellerId, pickup_location: pickupDraft.trim() });
    setPickup(updated.pickup_location);
  });
  const create = (event) => {
    event.preventDefault();
    if (String(order.payment_status || "").toUpperCase() !== "PAID") {
      setError("Verify online payment first, or use the existing manual delivery tracking option.");
      return;
    }
    perform("create", () => call(`${endpoint}/create`, "POST", {
      ...parcel,
      weight_kg: Number(parcel.weight_kg), length_cm: Number(parcel.length_cm),
      breadth_cm: Number(parcel.breadth_cm), height_cm: Number(parcel.height_cm),
    }));
  };
  const action = (label) => perform(label, () => call(`${endpoint}/${label}`, "POST"));
  const state = shipment?.state || "NOT_CREATED";
  const paymentReady = String(order.payment_status || "").toUpperCase() === "PAID";

  return <div className="ot-form" style={{ marginTop: 16, borderTop: "1px solid #eadbd1", paddingTop: 16 }}>
    <h4 style={{ margin: "0 0 5px", display: "flex", alignItems: "center", gap: 7 }}><Truck size={16}/> Shiprocket courier delivery</h4>
    <p className="ot-subtle" style={{ margin: 0 }}>Official courier checkpoints will appear in the customer's existing tracking history. Manual seller tracking remains available below.</p>
    {loading ? <p className="ot-subtle">Loading courier settings…</p> : <>
      <div className="ot-grid" style={{ marginTop: 12 }}>
        <div><span className="ot-muted">Shipment state</span><br/><strong>{state.replaceAll("_", " ")}</strong></div>
        <div><span className="ot-muted">Pickup address registered in Shiprocket</span><br/><strong>{pickup || "Not assigned by an administrator"}</strong></div>
        {shipment?.awb_code && <div><span className="ot-muted">AWB tracking number</span><br/><strong>{shipment.awb_code}</strong></div>}
        {shipment?.courier_name && <div><span className="ot-muted">Courier</span><br/><strong>{shipment.courier_name}</strong></div>}
        {shipment?.courier_status && <div><span className="ot-muted">Last carrier status</span><br/><strong>{shipment.courier_status}</strong></div>}
        {shipment?.pickup_status && <div><span className="ot-muted">Pickup status</span><br/><strong>{shipment.pickup_status}</strong></div>}
      </div>
      {admin && <div className="ot-grid" style={{ marginTop: 12 }}>
        <label className="ot-field ot-full">Administrator: seller #{sellerId} pickup address name in your Shiprocket account
          <input maxLength={160} value={pickupDraft} onChange={(event) => setPickupDraft(event.target.value)} placeholder="Exact saved Shiprocket pickup-location name"/>
        </label>
        <button type="button" className="ot-button" disabled={!pickupDraft.trim() || !!busy} onClick={savePickup}>Save seller pickup assignment</button>
      </div>}
      {!pickup && !admin && <p className="ot-subtle">Ask a marketplace administrator to assign your registered Shiprocket pickup address before booking.</p>}
      {!paymentReady && <p className="ot-subtle">Shiprocket prepaid booking is available after verified Razorpay payment. The existing manual delivery option remains available for direct payment arrangements.</p>}
      {["NOT_CREATED", "READY_RETRY"].includes(state) && pickup && paymentReady && <form onSubmit={create} style={{ marginTop: 10 }}>
        <p className="ot-subtle">Enter the actual destination details and measurements of the fully packed pottery parcel; courier charges can depend on them.</p>
        <div className="ot-grid">
          <label className="ot-field ot-full">Delivery street / house / area address<textarea required minLength={8} maxLength={250} value={parcel.destination_address} onChange={(e) => changed("destination_address", e.target.value)} placeholder="Confirmed complete delivery address"/></label>
          <label className="ot-field">Delivery city<input required maxLength={120} value={parcel.destination_city} onChange={(e) => changed("destination_city", e.target.value)} placeholder="Bengaluru"/></label>
          <label className="ot-field">Delivery state<input required maxLength={120} value={parcel.destination_state} onChange={(e) => changed("destination_state", e.target.value)} placeholder="Karnataka"/></label>
          <label className="ot-field">Delivery PIN code<input required inputMode="numeric" pattern="[1-9][0-9]{5}" maxLength={6} value={parcel.destination_pincode} onChange={(e) => changed("destination_pincode", e.target.value)} placeholder="560001"/></label>
          <label className="ot-field">Recipient email<input required type="email" maxLength={255} value={parcel.recipient_email} onChange={(e) => changed("recipient_email", e.target.value)} placeholder="customer@example.com"/></label>
          <label className="ot-field">Packed weight (kg)<input required type="number" step="0.001" min="0.001" max="500" value={parcel.weight_kg} onChange={(e) => changed("weight_kg", e.target.value)}/></label>
          <label className="ot-field">Length (cm)<input required type="number" step="0.01" min="0.01" max="300" value={parcel.length_cm} onChange={(e) => changed("length_cm", e.target.value)}/></label>
          <label className="ot-field">Breadth (cm)<input required type="number" step="0.01" min="0.01" max="300" value={parcel.breadth_cm} onChange={(e) => changed("breadth_cm", e.target.value)}/></label>
          <label className="ot-field">Height (cm)<input required type="number" step="0.01" min="0.01" max="300" value={parcel.height_cm} onChange={(e) => changed("height_cm", e.target.value)}/></label>
        </div>
        <button type="submit" className="ot-button ot-primary" disabled={!!busy}><PackageCheck size={15}/> {busy === "create" ? "Creating…" : "Create Shiprocket shipment"}</button>
      </form>}
      <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginTop: 12 }}>
        {state === "CREATED" && <button type="button" className="ot-button ot-primary" disabled={!!busy} onClick={() => action("awb")}>Assign courier AWB</button>}
        {state === "AWB_ASSIGNED" && <button type="button" className="ot-button ot-primary" disabled={!!busy} onClick={() => action("pickup")}>Request courier pickup</button>}
        {shipment?.awb_code && <button type="button" className="ot-button" disabled={!!busy} onClick={() => action("sync")}><RefreshCw size={14}/> Sync courier updates</button>}
      </div>
      {["RECONCILE", "AWB_REVIEW", "PICKUP_REVIEW"].includes(state) && <p className="ot-subtle">The courier request needs manual reconciliation in the Shiprocket dashboard before retrying. Do not create a duplicate booking.</p>}
    </>}
    {error && <div role="alert" className="ot-error" style={{ marginTop: 10 }}>{error}</div>}
    {notice && <div role="status" className="ot-notice" style={{ marginTop: 10 }}>{notice}</div>}
  </div>;
}
