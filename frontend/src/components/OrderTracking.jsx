import React, { useCallback, useEffect, useState } from "react";
import MarketplacePayButton from "./MarketplacePayButton";
import ShiprocketCourierControls from "./ShiprocketCourierControls";
import { CheckCircle2, ChevronDown, ChevronUp, Clock3, ExternalLink, MapPin, Navigation, Package, RefreshCw, Search, ShieldCheck, Truck } from "lucide-react";

const API = (import.meta.env.VITE_API_BASE_URL || "http://localhost:8000").replace(/\/$/, "");
const STORAGE_KEY = "potterMarketplaceTrackingKeys";
const STATUSES = ["REQUESTED", "ACCEPTED", "PROCESSING", "SHIPPED", "DELIVERED", "CANCELLED"];
const PROGRESS = STATUSES.filter((status) => status !== "CANCELLED");
const LABELS = { REQUESTED: "Order placed", ACCEPTED: "Confirmed", PROCESSING: "Being prepared", SHIPPED: "Shipped", DELIVERED: "Delivered", CANCELLED: "Cancelled" };
const money = (value) => `₹${Number(value || 0).toLocaleString("en-IN", { maximumFractionDigits: 2 })}`;
const formatDate = (value) => {
  if (!value) return "Not available";
  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? String(value) : parsed.toLocaleString("en-IN", { day: "numeric", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" });
};

async function request(path, options = {}) {
  const token = sessionStorage.getItem("potterCommunityAccessToken") || localStorage.getItem("token");
  const headers = { ...(options.body ? { "Content-Type": "application/json" } : {}), ...(options.headers || {}) };
  if (token) headers.Authorization = `Bearer ${token}`;
  const response = await fetch(`${API}${path}`, { ...options, headers });
  const payload = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(typeof payload.detail === "string" ? payload.detail : "Unable to load tracking information.");
  return payload;
}

function savedGuestKeys() {
  try {
    const value = JSON.parse(localStorage.getItem(STORAGE_KEY) || "{}");
    return value && typeof value === "object" && !Array.isArray(value) ? value : {};
  } catch { return {}; }
}

function storeGuestKey(id, accessKey) {
  try {
    const existing = savedGuestKeys();
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ ...existing, [id]: accessKey }));
    return true;
  } catch { return false; }
}

const eventDate = (event) => event.at || event.date || event.timestamp || event.created_at;
const mapUrl = (latitude, longitude) => `https://www.openstreetmap.org/?mlat=${latitude}&mlon=${longitude}#map=14/${latitude}/${longitude}`;
const mapEmbedUrl = (latitude, longitude) => {
  const lat = Number(latitude), lon = Number(longitude);
  const span = 0.028;
  return `https://www.openstreetmap.org/export/embed.html?bbox=${lon - span}%2C${lat - span}%2C${lon + span}%2C${lat + span}&layer=mapnik&marker=${lat}%2C${lon}`;
};

export default function OrderTrackingPage({ activeUser = null }) {
  const loggedIn = Boolean(activeUser);
  const isSeller = loggedIn && (String(activeUser?.membership_status || "").toUpperCase() === "APPROVED" || ["ADMIN", "SUPER ADMIN"].includes(String(activeUser?.role || "").toUpperCase()));
  const [tab, setTab] = useState("buyer");
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [busy, setBusy] = useState("");
  const [expanded, setExpanded] = useState({});
  const [drafts, setDrafts] = useState({});
  const [lookupId, setLookupId] = useState("");
  const [lookupKey, setLookupKey] = useState("");

  const load = useCallback(async (showLoading = true) => {
    if (showLoading) setLoading(true);
    setError("");
    try {
      if (tab === "seller" && isSeller) {
        const results = await request("/marketplace/seller-orders");
        setOrders(Array.isArray(results) ? results : []);
        return;
      }
      const ownOrders = loggedIn ? await request("/marketplace/orders") : [];
      const storedKeys = Object.entries(savedGuestKeys());
      const guestResults = await Promise.allSettled(storedKeys.map(([id, accessKey]) => request("/marketplace/track", {
        method: "POST", body: JSON.stringify({ order_id: Number(id), access_key: accessKey }),
      })));
      const foundGuestOrders = guestResults.filter((result) => result.status === "fulfilled").map((result) => result.value);
      const merged = new Map();
      [...(Array.isArray(ownOrders) ? ownOrders : []), ...foundGuestOrders].forEach((order) => merged.set(String(order.id), order));
      setOrders([...merged.values()].sort((a, b) => new Date(b.created_at) - new Date(a.created_at)));
      if (guestResults.some((result) => result.status === "rejected")) {
        setError("Some saved guest tracking codes could not be verified. Enter a valid order ID and tracking code below if needed.");
      }
    } catch (failure) {
      setOrders([]);
      setError(failure.message || "Could not load your orders.");
    } finally {
      if (showLoading) setLoading(false);
    }
  }, [tab, isSeller, loggedIn]);

  useEffect(() => {
    load();
    const interval = window.setInterval(() => load(false), 60000);
    return () => window.clearInterval(interval);
  }, [load]);

  const lookup = async (event) => {
    event.preventDefault();
    setError(""); setNotice(""); setBusy("lookup");
    try {
      const id = Number(lookupId);
      if (!Number.isSafeInteger(id) || id < 1 || !lookupKey.trim()) throw new Error("Enter a valid order number and private tracking code.");
      const order = await request("/marketplace/track", { method: "POST", body: JSON.stringify({ order_id: id, access_key: lookupKey.trim() }) });
      const saved = storeGuestKey(id, lookupKey.trim());
      setOrders((current) => [order, ...current.filter((item) => item.id !== order.id)]);
      setExpanded((current) => ({ ...current, [order.id]: true }));
      setNotice(saved ? `Order #${id} found. This browser will remember its tracking code.` : `Order #${id} found. Save your private tracking code because this browser could not store it.`);
      setLookupId(""); setLookupKey("");
    } catch (failure) { setError(failure.message); }
    finally { setBusy(""); }
  };

  const changeStatus = async (orderId, status) => {
    setError(""); setNotice(""); setBusy(`status-${orderId}`);
    try {
      await request(`/marketplace/orders/${orderId}/status`, { method: "PATCH", body: JSON.stringify({ status }) });
      setNotice(`Order #${orderId}: status updated.`);
      await load(false);
    } catch (failure) { setError(failure.message); }
    finally { setBusy(""); }
  };

  const changeDraft = (key, field, value) => setDrafts((current) => ({ ...current, [key]: { ...(current[key] || {}), [field]: value } }));

  const updateLocation = async (event, order, item) => {
    event.preventDefault();
    const key = `${order.id}-${item.product_id}`;
    const draft = drafts[key] || {};
    setError(""); setNotice(""); setBusy(key);
    try {
      if (!draft.location?.trim()) throw new Error("Enter the actual last-reported shipment location.");
      const latitude = String(draft.latitude ?? "").trim();
      const longitude = String(draft.longitude ?? "").trim();
      if (Boolean(latitude) !== Boolean(longitude)) throw new Error("Enter both map coordinates, or leave both blank.");
      const data = {
        product_id: item.product_id,
        location: draft.location.trim(),
        description: draft.description?.trim() || null,
        status: draft.status || item.status || order.status,
        latitude: latitude ? Number(latitude) : null,
        longitude: longitude ? Number(longitude) : null,
        courier_name: draft.courier_name ?? item.courier_name ?? null,
        courier_tracking_number: draft.courier_tracking_number ?? item.courier_tracking_number ?? null,
        estimated_delivery: draft.estimated_delivery || null,
      };
      await request(`/marketplace/orders/${order.id}/tracking`, { method: "PATCH", body: JSON.stringify(data) });
      setDrafts((current) => ({ ...current, [key]: { ...current[key], location: "", description: "", latitude: "", longitude: "" } }));
      setNotice(`Shipment location saved for ${item.name}. The customer can now see it.`);
      await load(false);
    } catch (failure) { setError(failure.message); }
    finally { setBusy(""); }
  };

  const useDeviceLocation = (key) => {
    if (!navigator.geolocation) { setError("Geolocation is not supported by this browser."); return; }
    setError("");
    navigator.geolocation.getCurrentPosition(
      ({ coords }) => {
        setDrafts((current) => ({ ...current, [key]: { ...(current[key] || {}), latitude: String(coords.latitude), longitude: String(coords.longitude) } }));
      },
      () => setError("Location permission was denied or your device position is unavailable. You can type the coordinates instead."),
      { enableHighAccuracy: true, timeout: 12000, maximumAge: 0 },
    );
  };

  const count = orders.length;
  const delivered = orders.filter((order) => order.status === "DELIVERED").length;
  const active = orders.filter((order) => !["DELIVERED", "CANCELLED"].includes(order.status)).length;
  return <div className="ot-page">
    <style>{`
      .ot-page{--brand:#a95736;--ink:#503326;max-width:1180px;margin:0 auto;padding:5px 5px 48px;color:var(--ink)}.ot-page *{box-sizing:border-box}
      .ot-hero{display:flex;align-items:center;justify-content:space-between;gap:16px;flex-wrap:wrap;padding:26px 28px;background:linear-gradient(115deg,#fff3e9,#f3e1d3);border:1px solid #ead3c3;border-radius:20px;margin-bottom:20px}
      .ot-hero h1{font-size:clamp(24px,3vw,34px);margin:4px 0 8px;color:#422c21}.ot-hero p{font-size:13px;color:#786256;margin:0;line-height:1.6}.ot-eyebrow{font-size:10px;font-weight:850;letter-spacing:.14em;color:var(--brand);text-transform:uppercase}
      .ot-button{display:inline-flex;align-items:center;justify-content:center;gap:7px;padding:10px 14px;cursor:pointer;background:#fffaf6;color:#8d4d31;border:1px solid #dfc4b2;border-radius:10px;font-size:12px;font-weight:750}.ot-button:hover{background:#f7e9df}.ot-button:disabled{opacity:.55;cursor:not-allowed}.ot-primary{background:var(--brand);color:#fff;border-color:var(--brand)}.ot-primary:hover{background:#87442c;color:#fff}
      .ot-stats{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:12px;margin-bottom:20px}.ot-stat{display:flex;align-items:center;gap:12px;padding:17px;background:#fff;border:1px solid #eadbd1;border-radius:14px}.ot-stat svg{color:var(--brand)}.ot-stat small{display:block;font-size:11px;color:#806b5e}.ot-stat strong{font-size:21px;color:#493126}
      .ot-toolbar{display:flex;align-items:center;justify-content:space-between;gap:10px;flex-wrap:wrap;margin-bottom:14px}.ot-tabs{display:flex;padding:4px;background:#f3ebe5;border-radius:12px;gap:4px}.ot-tabs button{border:0;background:transparent;border-radius:9px;padding:10px 15px;color:#795f51;cursor:pointer;font-size:12px;font-weight:800}.ot-tabs button.active{background:var(--brand);color:#fff}.ot-muted{color:#8b7468;font-size:11px}
      .ot-error,.ot-notice{border-radius:11px;padding:13px 15px;font-size:12px;margin-bottom:14px}.ot-error{color:#a13d2d;background:#fff1ed;border:1px solid #f0c6bd}.ot-notice{color:#326d44;background:#eff8f0;border:1px solid #cbe4ce}
      .ot-lookup,.ot-card{background:#fff;border:1px solid #ebdbcf;border-radius:17px;padding:20px;margin-bottom:16px;box-shadow:0 6px 20px rgba(80,51,38,.04)}.ot-lookup h2{font-size:16px;margin:0 0 7px}.ot-lookup p{color:#816c5e;font-size:12px;line-height:1.5;margin:0 0 12px}.ot-lookup form{display:grid;grid-template-columns:minmax(140px,180px) minmax(190px,1fr) auto;gap:10px;align-items:end}
      .ot-field{display:flex;flex-direction:column;gap:6px;color:#765c4b;font-size:11px;font-weight:700}.ot-field input,.ot-field select,.ot-field textarea{width:100%;min-width:0;padding:10px 11px;border:1px solid #dfcbbc;border-radius:9px;background:#fffefa;color:#503326;font:inherit;font-weight:500;font-size:12px}.ot-field textarea{min-height:74px;resize:vertical}.ot-field input:focus,.ot-field textarea:focus,.ot-field select:focus{outline:2px solid #d4ab95;outline-offset:1px}
      .ot-head,.ot-foot{display:flex;justify-content:space-between;align-items:flex-start;gap:12px;flex-wrap:wrap}.ot-head{padding-bottom:13px;border-bottom:1px solid #f0e4db}.ot-head strong{font-size:15px}.ot-head small{display:block;margin-top:5px;color:#8b7468;font-size:11px}.ot-pill{padding:7px 10px;border-radius:20px;color:#8b4d2f;background:#f8eee7;font-size:11px;font-weight:800}.ot-pill.delivered{color:#357449;background:#e6f3e9}.ot-pill.cancelled{color:#a13d2d;background:#fbe9e5}
      .ot-item{padding:17px 0;border-bottom:1px solid #f0e6df}.ot-item h3{font-size:14px;margin:0 0 6px;color:#513529}.ot-progress{display:flex;gap:5px;margin:12px 0 5px}.ot-progress span{flex:1;height:6px;background:#eee4dc;border-radius:8px}.ot-progress span.done{background:#b96544}.ot-event{display:grid;grid-template-columns:20px 1fr;gap:10px;padding:9px 0;border-bottom:1px solid #f0e5de}.ot-event:last-child{border-bottom:0}.ot-event svg{color:#a95736}.ot-event strong{font-size:12px}.ot-event p{margin:4px 0;color:#856f61;font-size:11px;line-height:1.5}.ot-event small{color:#9a8476;font-size:10px}
      .ot-details{margin-top:14px;padding:15px;background:#fffaf6;border:1px solid #eedfd3;border-radius:13px}.ot-details h4{font-size:13px;margin:0 0 12px}.ot-location{display:flex;align-items:center;gap:9px;padding:12px;background:#fff;border:1px solid #e9d6c7;border-radius:11px;color:#684735;font-size:12px;margin-top:12px}.ot-location svg{color:#a95736;flex-shrink:0}.ot-grid{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:12px}.ot-full{grid-column:1/-1}.ot-map{height:230px;width:100%;border:1px solid #e9d6c7;border-radius:10px;margin:12px 0}.ot-link{display:inline-flex;align-items:center;gap:5px;color:#a95736;font-size:11px;font-weight:700}.ot-form{display:grid;gap:12px;margin-top:14px;border-top:1px dashed #e6cec0;padding-top:14px}.ot-subtle{font-size:11px;color:#8c7566;line-height:1.6}
      .ot-foot{align-items:center;padding-top:13px}.ot-foot strong{font-size:16px}.ot-empty{text-align:center;padding:38px;border:1px dashed #dfcbbb;border-radius:16px;color:#90786a}.ot-empty svg{color:#a95736}.ot-empty h3{margin:10px 0 5px;color:#503326}.ot-empty p{font-size:12px}
      @media(max-width:720px){.ot-hero{padding:21px 18px}.ot-stats{grid-template-columns:1fr 1fr}.ot-stats>div:last-child{grid-column:1/-1}.ot-lookup form{grid-template-columns:1fr}.ot-grid{grid-template-columns:1fr}.ot-full{grid-column:auto}}
      @media(max-width:430px){.ot-stats{grid-template-columns:1fr}.ot-stats>div:last-child{grid-column:auto}.ot-card,.ot-lookup{padding:15px}}
    `}</style>
    <section className="ot-hero">
      <div><div className="ot-eyebrow">Marketplace · Shipment tracking</div><h1>Track your pottery orders</h1><p>Follow the last location reported by the artisan and the order's delivery progress.</p></div>
      <button className="ot-button" onClick={() => load()} disabled={loading}><RefreshCw size={15}/> {loading ? "Updating…" : "Refresh tracking"}</button>
    </section>
    <section className="ot-stats" aria-label="Order counts">
      <div className="ot-stat"><Package size={20}/><div><small>Total orders</small><strong>{count}</strong></div></div>
      <div className="ot-stat"><Truck size={20}/><div><small>In progress</small><strong>{active}</strong></div></div>
      <div className="ot-stat"><CheckCircle2 size={20}/><div><small>Delivered</small><strong>{delivered}</strong></div></div>
    </section>
    {isSeller && <div className="ot-toolbar"><div className="ot-tabs"><button className={tab === "buyer" ? "active" : ""} onClick={() => setTab("buyer")}>My purchases</button><button className={tab === "seller" ? "active" : ""} onClick={() => setTab("seller")}>Seller orders</button></div><span className="ot-muted">{tab === "seller" ? "Only products you sell (or manage)" : "Your purchases"}</span></div>}
    {tab === "buyer" && <section className="ot-lookup">
      <h2><Search size={15} style={{ verticalAlign: "middle", marginRight: 7 }}/> Track an order using its private code</h2>
      <p>Guest customers: enter the order ID and private tracking code shown after checkout. Registered customers can also see orders purchased while signed in.</p>
      <form onSubmit={lookup}><label className="ot-field">Order ID<input type="number" min="1" required value={lookupId} onChange={(event) => setLookupId(event.target.value)} placeholder="e.g. 125"/></label><label className="ot-field">Private tracking code<input required type="text" value={lookupKey} onChange={(event) => setLookupKey(event.target.value)} placeholder="Paste the code from checkout" autoComplete="off"/></label><button className="ot-button ot-primary" disabled={busy === "lookup"} type="submit">{busy === "lookup" ? "Checking…" : "Find order"}</button></form>
    </section>}
    {error && <div role="alert" className="ot-error">{error}</div>}
    {notice && <div role="status" className="ot-notice">{notice}</div>}
    {loading ? <div className="ot-empty">Loading your shipment information…</div> : orders.length === 0 ? <div className="ot-empty"><Package size={28}/><h3>No orders found</h3><p>After you order, your real purchases will appear here. Guest buyers can use their private tracking code above.</p></div> : <div>{orders.map((order) => {
      const orderStatus = String(order.status || "REQUESTED").toUpperCase();
      const open = Boolean(expanded[order.id]);
      return <section className="ot-card" key={order.id}>
        <div className="ot-head"><div><strong>Order #{order.id}</strong><small>{formatDate(order.created_at)} · {order.tracking_number || "Tracking number pending"}</small></div><span className={`ot-pill ${orderStatus === "DELIVERED" ? "delivered" : orderStatus === "CANCELLED" ? "cancelled" : ""}`}>{LABELS[orderStatus] || orderStatus}</span></div>
        {(order.items || []).map((item) => {
          const itemStatus = String(item.status || order.status || "REQUESTED").toUpperCase();
          const events = (item.tracking_events?.length ? item.tracking_events : item.status_history || []).slice().sort((a, b) => new Date(eventDate(a) || 0) - new Date(eventDate(b) || 0));
          const recentWithLocation = [...events].reverse().find((event) => event.location);
          const location = item.current_location || recentWithLocation?.location;
          const latitude = recentWithLocation?.latitude ?? item.latitude;
          const longitude = recentWithLocation?.longitude ?? item.longitude;
          const hasMap = latitude !== null && latitude !== undefined && longitude !== null && longitude !== undefined && Number.isFinite(Number(latitude)) && Number.isFinite(Number(longitude));
          const draftKey = `${order.id}-${item.product_id}`;
          const draft = drafts[draftKey] || {};
          return <article className="ot-item" key={draftKey}>
            <h3>{item.name} <span className="ot-muted">× {item.quantity}</span></h3><div className="ot-muted">{money(item.unit_price)} per item · {LABELS[itemStatus] || itemStatus}</div>
            <div className="ot-progress" aria-label={`Progress: ${LABELS[itemStatus] || itemStatus}`}>{PROGRESS.map((step, index) => <span key={step} className={itemStatus !== "CANCELLED" && PROGRESS.indexOf(itemStatus) >= index ? "done" : ""}/>)}</div>
            <div className="ot-location"><MapPin size={17}/><div><strong>Last reported location:</strong> {location || "No location scan reported yet"}{item.location_updated_at && <div className="ot-muted">Updated: {formatDate(item.location_updated_at)}</div>}</div></div>
            {open && <div className="ot-details">
              <div className="ot-grid">
                <div><div className="ot-muted">Delivery estimate</div><strong>{item.estimated_delivery || "Not provided"}</strong></div>
                <div><div className="ot-muted">Courier / delivery service</div><strong>{item.courier_name || "Not provided"}</strong></div>
                {item.courier_tracking_number && <div><div className="ot-muted">Courier reference</div><strong>{item.courier_tracking_number}</strong></div>}
                <div><div className="ot-muted">Latest status</div><strong>{LABELS[itemStatus] || itemStatus}</strong></div>
                {item.courier_status && <div><div className="ot-muted">Shiprocket checkpoint</div><strong>{item.courier_status}</strong></div>}
              </div>
              {hasMap && <div><iframe title={`Last reported location of ${item.name}`} className="ot-map" loading="lazy" referrerPolicy="no-referrer" src={mapEmbedUrl(latitude, longitude)}/><a className="ot-link" href={mapUrl(latitude, longitude)} target="_blank" rel="noreferrer"><ExternalLink size={13}/> Open reported location on OpenStreetMap</a></div>}
              <h4 style={{ marginTop: 17 }}><Clock3 size={14} style={{ verticalAlign: "middle", marginRight: 6 }}/> Shipment journey</h4>
              {events.length ? events.map((entry, index) => <div className="ot-event" key={`${index}-${eventDate(entry)}`}><CheckCircle2 size={16}/><div><strong>{LABELS[String(entry.status || "").toUpperCase()] || entry.status || "Location update"}</strong><p>{entry.description || "Order status updated"}{entry.location ? ` · ${entry.location}` : ""}</p><small>{formatDate(eventDate(entry))}</small></div></div>) : <p className="ot-subtle">Shipment updates have not been reported yet.</p>}
              {tab === "seller" && <ShiprocketCourierControls order={order} item={item} activeUser={activeUser} onRefresh={() => load(false)}/>}
              {tab === "seller" && !["DELIVERED", "CANCELLED"].includes(itemStatus) && <form className="ot-form" onSubmit={(event) => updateLocation(event, order, item)}>
                <h4 style={{ margin: 0 }}><Navigation size={14} style={{ verticalAlign: "middle", marginRight: 6 }}/> Report actual shipment location</h4>
                <p className="ot-subtle" style={{ margin: 0 }}>Only enter a real location reported by you or the delivery service. The map is not live GPS tracking.</p>
                <div className="ot-grid">
                  <label className="ot-field ot-full">Current location / dispatch hub<input required maxLength={200} value={draft.location || ""} onChange={(event) => changeDraft(draftKey, "location", event.target.value)} placeholder="e.g. Bengaluru Sorting Centre, Karnataka"/></label>
                  <label className="ot-field">Shipment status<select value={draft.status || itemStatus} onChange={(event) => changeDraft(draftKey, "status", event.target.value)}>{STATUSES.filter((status) => status === "CANCELLED" || status === "REQUESTED" || PROGRESS.indexOf(status) >= PROGRESS.indexOf(itemStatus)).map((status) => <option key={status} value={status}>{LABELS[status]}</option>)}</select></label>
                  <label className="ot-field">Estimated delivery date<input type="date" value={draft.estimated_delivery ?? item.estimated_delivery ?? ""} onChange={(event) => changeDraft(draftKey, "estimated_delivery", event.target.value)}/></label>
                  <label className="ot-field">Courier name (optional)<input maxLength={120} value={draft.courier_name ?? item.courier_name ?? ""} onChange={(event) => changeDraft(draftKey, "courier_name", event.target.value)} placeholder="Delivery company"/></label>
                  <label className="ot-field">Courier tracking reference (optional)<input maxLength={120} value={draft.courier_tracking_number ?? item.courier_tracking_number ?? ""} onChange={(event) => changeDraft(draftKey, "courier_tracking_number", event.target.value)} placeholder="Carrier reference"/></label>
                  <label className="ot-field ot-full">Update description (optional)<textarea maxLength={500} value={draft.description || ""} onChange={(event) => changeDraft(draftKey, "description", event.target.value)} placeholder="e.g. Parcel left our workshop"/></label>
                  <label className="ot-field">Latitude (optional)<input type="number" step="any" min="-90" max="90" value={draft.latitude || ""} onChange={(event) => changeDraft(draftKey, "latitude", event.target.value)} placeholder="12.9716"/></label>
                  <label className="ot-field">Longitude (optional)<input type="number" step="any" min="-180" max="180" value={draft.longitude || ""} onChange={(event) => changeDraft(draftKey, "longitude", event.target.value)} placeholder="77.5946"/></label>
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: 9, flexWrap: "wrap" }}><button type="button" className="ot-button" onClick={() => useDeviceLocation(draftKey)}><MapPin size={14}/> Use my device location</button><button type="submit" className="ot-button ot-primary" disabled={busy === draftKey}>{busy === draftKey ? "Saving…" : "Save shipment update"}</button></div>
              </form>}
            </div>}
          </article>;
        })}
        {tab === "seller" && <div className="ot-details"><div className="ot-muted">Customer: {order.buyer_name || "Buyer"} · {order.buyer_phone || "Phone not provided"}</div><div className="ot-muted" style={{ marginTop: 5 }}>Delivery: {order.delivery_address || "Not available"}</div></div>}
        {tab === "seller" && order.items?.some((item) => !["DELIVERED", "CANCELLED"].includes(item.status || order.status)) && <div style={{ display: "flex", alignItems: "center", gap: 9, marginTop: 12, flexWrap: "wrap" }}><label className="ot-field" style={{ minWidth: 200 }}>Update status for your order items<select value="" disabled={busy === `status-${order.id}`} onChange={(event) => { if (event.target.value) changeStatus(order.id, event.target.value); }}><option value="" disabled>Select a new status…</option>{STATUSES.filter((status) => status !== "REQUESTED").map((status) => <option key={status} value={status}>{LABELS[status]}</option>)}</select></label><span className="ot-muted">For location reporting, open shipment details.</span></div>}
        <div className="ot-foot"><span className="ot-muted">Order total <strong style={{ color: "#503326", marginLeft: 7 }}>{money(order.total_amount)}</strong><small style={{ display: "block", marginTop: 4 }}>Online payment: {(order.payment_status || "UNPAID").replaceAll("_", " ")}</small></span><button type="button" className="ot-button" onClick={() => setExpanded((current) => ({ ...current, [order.id]: !current[order.id] }))}>{open ? <ChevronUp size={14}/> : <ChevronDown size={14}/>} {open ? "Hide shipment details" : "View shipment details"}</button></div>
        {tab !== "seller" && <div style={{ marginTop: 12 }}><MarketplacePayButton order={order} onPaid={() => load(false)} className="ot-button ot-primary"/></div>}
      </section>;
    })}</div>}
    <p className="ot-subtle" style={{ marginTop: 18 }}><ShieldCheck size={13} style={{ verticalAlign: "middle", marginRight: 5 }}/> Locations are seller- or courier-reported checkpoints, not live GPS. Shiprocket updates arrive from provider scans and may be delayed; this screen refreshes every 60 seconds.</p>
  </div>;
}
