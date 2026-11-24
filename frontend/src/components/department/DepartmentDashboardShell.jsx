import React, { useEffect, useMemo, useState } from "react";

const formatNumber = (metric) => {
  const value = Number(metric.value ?? 0);
  if (metric.format === "currency") return new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 2 }).format(value);
  return new Intl.NumberFormat("en-IN").format(value);
};

const formatDate = (value) => {
  if (!value) return "Date not provided";
  const parsed = new Date(`${value}T00:00:00`);
  return Number.isNaN(parsed.valueOf()) ? value : parsed.toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" });
};

/** Each separate officer/seller page supplies its own content. The server enforces
 * the actual account role and returns only authorized statistics and actions. */
export default function DepartmentDashboardShell({
  api, activeUser, navigate, expectedRole, endpoint = "/role-dashboards/officer",
  title, eyebrow, description, priorityKeys = [], focusTitle, focusItems = [],
  showRecentOrders = false,
}) {
  const [payload, setPayload] = useState(null);
  const [busy, setBusy] = useState(true);
  const [error, setError] = useState("");
  const [refresh, setRefresh] = useState(0);

  useEffect(() => {
    if (!activeUser?.id) {
      setPayload(null);
      setBusy(false);
      setError("Please sign in to view your dashboard.");
      return undefined;
    }
    let cancelled = false;
    setBusy(true);
    setError("");
    api(endpoint).then((value) => {
      if (cancelled) return;
      if (value?.role !== expectedRole) {
        setPayload(null);
        setError("Your current account does not have this dashboard role. Contact an administrator if your assignment has changed.");
        return;
      }
      setPayload(value);
    }).catch((failure) => {
      if (!cancelled) {
        setPayload(null);
        setError(failure?.message || "Unable to load live dashboard records.");
      }
    }).finally(() => { if (!cancelled) setBusy(false); });
    return () => { cancelled = true; };
  }, [api, activeUser?.id, endpoint, expectedRole, refresh]);

  const metrics = useMemo(() => {
    const available = payload?.metrics || [];
    const priority = (item) => {
      const index = priorityKeys.indexOf(item.key);
      return index === -1 ? priorityKeys.length + available.indexOf(item) : index;
    };
    return [...available].sort((a, b) => priority(a) - priority(b));
  }, [payload, priorityKeys]);

  const activity = showRecentOrders ? (payload?.recent_activity || []) : (payload?.upcoming_events || []);

  return <main className="pc-department-dashboard" aria-label={title}>
    <style>{`
      .pc-department-dashboard{color:#4d3328;max-width:1500px;margin:0 auto;padding:14px 0 38px}
      .pc-department-dashboard .dept-hero{padding:29px 32px;border-radius:22px;border:1px solid #ead5c4;background:radial-gradient(circle at 87% 19%,rgba(195,112,73,.18),transparent 32%),linear-gradient(115deg,#fffaf5,#f5e5d8);display:flex;align-items:start;justify-content:space-between;gap:22px;flex-wrap:wrap}
      .pc-department-dashboard .dept-hero h1{font-family:Georgia,serif;font-size:clamp(26px,3vw,38px);line-height:1.17;margin:8px 0 10px;color:#38251b}
      .pc-department-dashboard .dept-eyebrow{font-size:11px;letter-spacing:.14em;text-transform:uppercase;font-weight:800;color:#a65335}
      .pc-department-dashboard .dept-muted{color:#806b5e;font-size:13px;line-height:1.7;margin:0}
      .pc-department-dashboard .dept-role{font-size:12px;font-weight:800;border:1px solid #ddbaa4;background:#fffaf5;padding:10px 14px;border-radius:99px;color:#87482f}
      .pc-department-dashboard .dept-refresh{background:#fffaf5;color:#8e4c32;border:1px solid #d7ad95;border-radius:10px;padding:10px 15px;font-size:12px;font-weight:750;cursor:pointer}
      .pc-department-dashboard .dept-refresh:disabled{cursor:wait;opacity:.7}
      .pc-department-dashboard .dept-stats{display:grid;grid-template-columns:repeat(auto-fit,minmax(185px,1fr));gap:14px;margin:21px 0}
      .pc-department-dashboard .dept-stat{background:linear-gradient(145deg,#fffefa,#fff8f1);border:1px solid #ead8ca;border-radius:17px;padding:22px;min-width:0}
      .pc-department-dashboard .dept-stat b{font-family:Georgia,serif;font-size:clamp(24px,2.6vw,31px);color:#8b472f;display:block;margin:9px 0}
      .pc-department-dashboard .dept-stat strong{font-size:12px;color:#705548}
      .pc-department-dashboard .dept-stat p{font-size:11px;color:#866f60;line-height:1.6;margin:0}
      .pc-department-dashboard .dept-grid{display:grid;grid-template-columns:minmax(0,1.3fr) minmax(265px,1fr);gap:17px}
      .pc-department-dashboard .dept-panel{border:1px solid #ead8ca;background:#fffdf9;border-radius:19px;padding:23px;min-width:0}
      .pc-department-dashboard .dept-panel h2{font-family:Georgia,serif;font-size:21px;color:#503326;margin:0 0 10px}
      .pc-department-dashboard .dept-actions{display:grid;grid-template-columns:repeat(auto-fit,minmax(145px,1fr));gap:10px;margin-top:16px}
      .pc-department-dashboard .dept-action{border:1px solid #e8cebb;border-radius:12px;background:#fff8f1;color:#73402e;cursor:pointer;text-align:left;font-size:12px;font-weight:750;padding:13px;min-height:58px}
      .pc-department-dashboard .dept-action:hover{background:#f5e4d6}
      .pc-department-dashboard .dept-notice{background:#fff8f1;border:1px solid #ead8ca;border-radius:12px;padding:15px;color:#806b5e;font-size:13px;line-height:1.6;margin-top:17px}
      .pc-department-dashboard .dept-error{background:#fff1ee;border-color:#f1c2b7;color:#a1261c}
      .pc-department-dashboard .dept-activity{padding:13px 0;border-bottom:1px solid #eee0d5}
      .pc-department-dashboard .dept-activity:last-child{border-bottom:0}
      .pc-department-dashboard .dept-activity strong{display:block;font-size:13px;color:#54392d}
      .pc-department-dashboard .dept-activity span{font-size:11px;color:#806b5e}
      .pc-department-dashboard .dept-focus{padding-left:18px;margin:12px 0 0;color:#70594a;line-height:1.8;font-size:12px}
      @media(max-width:780px){.pc-department-dashboard .dept-grid{grid-template-columns:1fr}.pc-department-dashboard .dept-hero{padding:22px}.pc-department-dashboard .dept-panel{padding:19px}}
    `}</style>
    <header className="dept-hero">
      <div><span className="dept-eyebrow">{eyebrow}</span><h1>{title}</h1>
        <p className="dept-muted">{description}</p>
        {payload?.member && <p className="dept-muted" style={{ marginTop: 10 }}>Signed in as <strong>{payload.member.name}</strong></p>}
      </div>
      <div style={{ display: "grid", justifyItems: "end", gap: 11 }}><span className="dept-role">{expectedRole}</span>
        <button className="dept-refresh" type="button" disabled={busy} onClick={() => setRefresh((i) => i + 1)}>{busy ? "Loading…" : "Refresh live data"}</button>
      </div>
    </header>
    {busy && <p role="status" className="dept-notice">Loading real community data…</p>}
    {!busy && error && <p role="alert" className="dept-notice dept-error">{error}</p>}
    {!busy && payload && <>
      <div className="dept-stats">
        {metrics.map((item) => <article className="dept-stat" key={item.key}>
          <strong>{item.label}</strong><b>{formatNumber(item)}</b><p>{item.description}</p>
        </article>)}
      </div>
      <div className="dept-grid">
        <section className="dept-panel"><h2>My authorized tools</h2><p className="dept-muted">Shortcuts are returned by the backend based on your actual permissions.</p>
          {payload.actions?.length ? <div className="dept-actions">{payload.actions.map((item) => <button type="button" key={`${item.page}:${item.label}`} className="dept-action" onClick={() => navigate(item.page)}>{item.label} →</button>)}</div> : <p className="dept-notice">No tools are currently assigned.</p>}
        </section>
        <section className="dept-panel"><h2>{focusTitle}</h2>
          <ul className="dept-focus">{focusItems.map((item, index) => <li key={index}>{item}</li>)}</ul>
          {payload.highlights?.map((line, index) => <p key={index} className="dept-notice">{line}</p>)}
          {payload.my_assignment?.note && <p className="dept-notice"><strong>Current appointment:</strong> {payload.my_assignment.note}</p>}
          {payload.my_assignment?.term_end && <p className="dept-muted">Term ends: {formatDate(payload.my_assignment.term_end)}</p>}
        </section>
        <section className="dept-panel" style={{ gridColumn: "1 / -1" }}>
          <h2>{showRecentOrders ? "Recent orders containing my products" : "Upcoming published community events"}</h2>
          {activity.length ? activity.map((item) => <div className="dept-activity" key={item.id}>
            <strong>{item.title}</strong><span>{formatDate(item.date)} · {showRecentOrders ? `${item.status || ""} · ${item.detail || ""}` : item.venue}</span>
          </div>) : <p className="dept-notice">{showRecentOrders ? "No orders for your products have been recorded yet." : "No upcoming published community events."}</p>}
        </section>
      </div>
    </>}
  </main>;
}
