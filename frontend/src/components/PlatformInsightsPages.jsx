import React, { useCallback, useEffect, useMemo, useState } from "react";

const API_BASE = (import.meta.env.VITE_API_BASE_URL || "http://localhost:8000").replace(/\/$/, "");

async function api(path) {
  const token =
    sessionStorage.getItem("potterCommunityAccessToken") ||
    localStorage.getItem("token");

  const response = await fetch(`${API_BASE}${path}`, {
    headers: {
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      Accept: "application/json",
    },
  });

  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    const detail = data?.detail;
    throw new Error(
      typeof detail === "string"
        ? detail
        : data?.message || `Request failed (${response.status})`
    );
  }
  return data;
}

const styles = `
.pi-page{width:100%;color:var(--text-primary,#29231f)}
.pi-heading{display:flex;justify-content:space-between;align-items:flex-start;gap:16px;flex-wrap:wrap;margin-bottom:22px}
.pi-heading h1{font-size:clamp(24px,3vw,32px);margin:0 0 6px;font-weight:750}
.pi-heading p{margin:0;color:var(--text-secondary,#81766e);font-size:14px}
.pi-actions{display:flex;gap:9px;flex-wrap:wrap}
.pi-btn{border:1px solid #e6d9d0;background:#fff;color:#75432f;border-radius:10px;padding:10px 14px;font-weight:650;cursor:pointer}
.pi-btn.primary{background:#a95736;border-color:#a95736;color:#fff}
.pi-btn:disabled{opacity:.55;cursor:not-allowed}
.pi-grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(190px,1fr));gap:14px;margin:18px 0 22px}
.pi-card,.pi-panel{background:#fff;border:1px solid #eee5df;border-radius:15px;padding:18px;box-shadow:0 4px 18px rgba(67,43,28,.045)}
.pi-card span{display:block;color:#84766d;font-size:13px;margin-bottom:9px}
.pi-card strong{font-size:27px;line-height:1.2;color:#392a22}
.pi-card small{display:block;color:#988b82;margin-top:7px;font-size:12px}
.pi-panel{margin:16px 0}
.pi-panel h2{font-size:17px;margin:0 0 14px}
.pi-table-wrap{overflow-x:auto}
.pi-table{width:100%;border-collapse:collapse;min-width:580px}
.pi-table th,.pi-table td{text-align:left;padding:12px 10px;border-bottom:1px solid #f0e9e4;font-size:13px;vertical-align:middle}
.pi-table th{color:#87786e;font-weight:700;background:#fcfaf8}
.pi-status{display:inline-flex;padding:5px 9px;border-radius:20px;background:#f5eee9;color:#79503b;font-size:11px;font-weight:700;text-transform:capitalize}
.pi-muted{color:#8b8078;font-size:13px}
.pi-error{background:#fff5f2;border:1px solid #f2d2c7;color:#963f2b;padding:12px 14px;border-radius:10px;margin:12px 0}
.pi-empty{padding:25px;text-align:center;color:#8b8078;background:#fcfaf8;border-radius:12px}
.pi-progress{height:8px;border-radius:20px;background:#f0e8e2;overflow:hidden;margin-top:9px}
.pi-progress i{display:block;height:100%;background:#b86c49;border-radius:20px}
.pi-list{display:grid;gap:10px}
.pi-list-item{display:flex;justify-content:space-between;gap:14px;align-items:center;padding:12px 0;border-bottom:1px solid #f0e9e4}
.pi-list-item:last-child{border-bottom:0}
.pi-list-item strong{font-size:13px}
.pi-list-item small{display:block;color:#91847b;margin-top:4px}
@media(max-width:600px){.pi-card,.pi-panel{padding:14px}.pi-table th,.pi-table td{padding:10px 8px}}
`;

function PageStyles() {
  return <style>{styles}</style>;
}

function Heading({ title, subtitle, onRefresh, refreshing }) {
  return (
    <div className="pi-heading">
      <div><h1>{title}</h1><p>{subtitle}</p></div>
      <div className="pi-actions">
        <button className="pi-btn" type="button" onClick={onRefresh} disabled={refreshing}>
          {refreshing ? "Refreshing…" : "↻ Refresh"}
        </button>
      </div>
    </div>
  );
}

function Metric({ label, value, note }) {
  return <div className="pi-card"><span>{label}</span><strong>{value}</strong>{note ? <small>{note}</small> : null}</div>;
}

function money(value) {
  const amount = Number(value || 0);
  return new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 0 }).format(Number.isFinite(amount) ? amount : 0);
}

function dateText(value) {
  if (!value) return "—";
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? String(value) : date.toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" });
}

function statusOf(order) {
  return String(order?.status || order?.order_status || order?.payment_status || "Processing").replaceAll("_", " ").toLowerCase();
}

function orderIdOf(order) {
  return order?.order_number || order?.orderNumber || order?.order_id || order?.id || "—";
}

function orderAmount(order) {
  return order?.total_amount ?? order?.totalAmount ?? order?.amount ?? order?.total ?? 0;
}

function orderRows(data) {
  if (Array.isArray(data)) return data;
  if (Array.isArray(data?.items)) return data.items;
  if (Array.isArray(data?.orders)) return data.orders;
  if (Array.isArray(data?.results)) return data.results;
  return [];
}

export function OrderTrackingPage({ activeUser }) {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [filter, setFilter] = useState("all");

  const loadOrders = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const role = String(activeUser?.role || "").toUpperCase();
      const canSeeSellerOrders = ["ADMIN", "SUPER ADMIN", "MARKETPLACE SELLER", "SELLER"].includes(role);
      const data = await api(canSeeSellerOrders ? "/marketplace/seller-orders" : "/marketplace/orders");
      setOrders(orderRows(data));
    } catch (err) {
      setError(err.message || "Unable to load orders. Please try again.");
      setOrders([]);
    } finally {
      setLoading(false);
    }
  }, [activeUser?.role]);

  useEffect(() => { loadOrders(); }, [loadOrders]);

  const filtered = useMemo(() => filter === "all"
    ? orders
    : orders.filter((order) => statusOf(order).includes(filter)), [orders, filter]);

  return (
    <div className="pi-page">
      <PageStyles />
      <Heading title="Order Tracking" subtitle="Follow your marketplace orders and check their latest status." onRefresh={loadOrders} refreshing={loading} />
      <div className="pi-grid">
        <Metric label="Total orders" value={orders.length} note="Orders available to this account" />
        <Metric label="In progress" value={orders.filter(o => /pending|processing|shipped|dispatched/.test(statusOf(o))).length} />
        <Metric label="Delivered" value={orders.filter(o => /delivered|completed/.test(statusOf(o))).length} />
        <Metric label="Order value" value={money(orders.reduce((sum, o) => sum + Number(orderAmount(o) || 0), 0))} note="Based on returned order records" />
      </div>
      {error && <div className="pi-error">{error}</div>}
      <section className="pi-panel">
        <div className="pi-heading" style={{marginBottom:12}}>
          <div><h2>My orders</h2><p>Order status is shown as returned by the server.</p></div>
          <select aria-label="Filter orders" className="pi-btn" value={filter} onChange={e => setFilter(e.target.value)}>
            <option value="all">All orders</option><option value="pending">Pending</option><option value="processing">Processing</option><option value="shipped">Shipped</option><option value="delivered">Delivered</option><option value="cancelled">Cancelled</option>
          </select>
        </div>
        {loading ? <div className="pi-empty">Loading orders…</div> : filtered.length === 0 ? <div className="pi-empty">No orders found for this filter.</div> : (
          <div className="pi-table-wrap"><table className="pi-table"><thead><tr><th>Order ID</th><th>Date</th><th>Amount</th><th>Status</th><th>Customer</th></tr></thead><tbody>
            {filtered.map((order, index) => <tr key={order.id || order.order_id || index}>
              <td><strong>#{orderIdOf(order)}</strong></td><td>{dateText(order.created_at || order.createdAt || order.order_date)}</td>
              <td>{money(orderAmount(order))}</td><td><span className="pi-status">{statusOf(order)}</span></td>
              <td>{order.customer_name || order.customerName || order.buyer_name || order.user_name || "—"}</td>
            </tr>)}
          </tbody></table></div>
        )}
      </section>
    </div>
  );
}

export function SellerAnalyticsPage() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const loadAnalytics = useCallback(async () => {
    setLoading(true); setError("");
    try {
      const data = await api("/marketplace/seller-orders");
      setOrders(orderRows(data));
    } catch (err) {
      setError(err.message || "Unable to load seller analytics.");
      setOrders([]);
    } finally { setLoading(false); }
  }, []);

  useEffect(() => { loadAnalytics(); }, [loadAnalytics]);

  const revenue = orders.reduce((sum, o) => sum + Number(orderAmount(o) || 0), 0);
  const delivered = orders.filter(o => /delivered|completed/.test(statusOf(o)));
  const pending = orders.filter(o => /pending|processing|shipped|dispatched/.test(statusOf(o)));
  const average = orders.length ? revenue / orders.length : 0;

  return (
    <div className="pi-page">
      <PageStyles />
      <Heading title="Seller Analytics" subtitle="A summary of marketplace orders and sales activity." onRefresh={loadAnalytics} refreshing={loading} />
      {error && <div className="pi-error">{error}</div>}
      <div className="pi-grid">
        <Metric label="Total orders" value={orders.length} />
        <Metric label="Gross order value" value={money(revenue)} note="Sum of amounts in seller-order records" />
        <Metric label="Delivered orders" value={delivered.length} />
        <Metric label="Open orders" value={pending.length} />
        <Metric label="Average order value" value={money(average)} />
      </div>
      <section className="pi-panel">
        <h2>Order status overview</h2>
        {loading ? <div className="pi-empty">Loading seller data…</div> : orders.length === 0 ? <div className="pi-empty">No seller orders are available yet. New marketplace orders will appear here.</div> : (
          <div className="pi-list">
            {[
              ["Delivered", delivered.length],
              ["In progress", pending.length],
              ["Other / cancelled", orders.length - delivered.length - pending.length],
            ].map(([label, count]) => <div key={label}>
              <div className="pi-list-item"><strong>{label}</strong><span>{count} ({Math.round(count / orders.length * 100)}%)</span></div>
              <div className="pi-progress"><i style={{width:`${count / orders.length * 100}%`}} /></div>
            </div>)}
          </div>
        )}
      </section>
      <section className="pi-panel">
        <h2>Recent seller orders</h2>
        {orders.length === 0 ? <div className="pi-empty">No order activity to display.</div> : <div className="pi-table-wrap"><table className="pi-table"><thead><tr><th>Order ID</th><th>Date</th><th>Amount</th><th>Status</th></tr></thead><tbody>
          {orders.slice(0, 8).map((o, i) => <tr key={o.id || o.order_id || i}><td>#{orderIdOf(o)}</td><td>{dateText(o.created_at || o.createdAt || o.order_date)}</td><td>{money(orderAmount(o))}</td><td><span className="pi-status">{statusOf(o)}</span></td></tr>)}
        </tbody></table></div>}
      </section>
    </div>
  );
}

export function AdminDashboardPage() {
  const [data, setData] = useState({ members: [], pending: [], roles: [], logs: [], orders: [] });
  const [loading, setLoading] = useState(true);
  const [errors, setErrors] = useState([]);

  const loadDashboard = useCallback(async () => {
    setLoading(true); setErrors([]);
    const requests = [
      ["members", "/auth/admin/members"],
      ["pending", "/auth/admin/memberships/pending"],
      ["roles", "/admin/roles/directory"],
      ["logs", "/admin/audit-logs?limit=100"],
      ["orders", "/marketplace/seller-orders"],
    ];
    const results = await Promise.all(requests.map(async ([key, path]) => {
      try { return [key, await api(path), null]; }
      catch (err) { return [key, [], `${key}: ${err.message || "Could not load"}`]; }
    }));
    const next = { members: [], pending: [], roles: [], logs: [], orders: [] };
    const nextErrors = [];
    results.forEach(([key, value, err]) => {
      next[key] = key === "orders" ? orderRows(value) : (Array.isArray(value) ? value : (value?.items || value?.results || []));
      if (err) nextErrors.push(err);
    });
    setData(next); setErrors(nextErrors); setLoading(false);
  }, []);

  useEffect(() => { loadDashboard(); }, [loadDashboard]);

  const activeMembers = data.members.filter(m => m.is_active !== false);
  const totalRevenue = data.orders.reduce((sum, o) => sum + Number(orderAmount(o) || 0), 0);

  return (
    <div className="pi-page">
      <PageStyles />
      <Heading title="Administration Dashboard" subtitle="A consolidated overview of community operations and marketplace activity." onRefresh={loadDashboard} refreshing={loading} />
      {errors.length > 0 && <div className="pi-error"><strong>Some dashboard sections could not be loaded:</strong><ul style={{margin:"7px 0 0",paddingLeft:20}}>{errors.map(e => <li key={e}>{e}</li>)}</ul><small>Access permissions or unavailable backend routes may limit the displayed sections.</small></div>}
      <div className="pi-grid">
        <Metric label="Total members" value={data.members.length} />
        <Metric label="Active members" value={activeMembers.length} />
        <Metric label="Pending applications" value={data.pending.length} />
        <Metric label="Committee / role records" value={data.roles.length} />
        <Metric label="Marketplace orders" value={data.orders.length} />
        <Metric label="Marketplace order value" value={money(totalRevenue)} />
      </div>
      <section className="pi-panel">
        <h2>Recent community activity</h2>
        {loading ? <div className="pi-empty">Loading administration data…</div> : data.logs.length === 0 ? <div className="pi-empty">No audit-log entries are available, or your account cannot access them.</div> : (
          <div className="pi-list">{data.logs.slice(0, 8).map((log, i) => <div className="pi-list-item" key={log.id || i}>
            <div><strong>{log.action || log.event || log.description || "Community activity"}</strong><small>{log.actor_name || log.user_name || log.actor || "System"} · {dateText(log.created_at || log.timestamp)}</small></div>
            <span className="pi-status">{log.status || "Recorded"}</span>
          </div>)}</div>
        )}
      </section>
      <section className="pi-panel">
        <h2>Pending membership applications</h2>
        {data.pending.length === 0 ? <div className="pi-empty">There are no pending applications to display.</div> : <div className="pi-table-wrap"><table className="pi-table"><thead><tr><th>Applicant</th><th>Email / Phone</th><th>Submitted</th><th>Status</th></tr></thead><tbody>
          {data.pending.slice(0, 10).map((item, i) => <tr key={item.id || i}><td>{item.full_name || item.name || "Applicant"}</td><td>{item.email || item.phone_number || item.phone || "—"}</td><td>{dateText(item.created_at || item.submitted_at)}</td><td><span className="pi-status">{item.membership_status || item.status || "Pending"}</span></td></tr>)}
        </tbody></table></div>}
      </section>
    </div>
  );
}
