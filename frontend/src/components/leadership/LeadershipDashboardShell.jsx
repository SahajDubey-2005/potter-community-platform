import React, { useCallback, useEffect, useMemo, useState } from "react";

const formatDate = (value) => {
  if (!value) return "Not specified";
  const parsed = new Date(`${value}T00:00:00`);
  return Number.isNaN(parsed.getTime()) ? value : parsed.toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" });
};

const formatValue = (metric) => {
  const value = Number(metric.value || 0);
  if (metric.format === "currency") {
    return new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 2 }).format(value);
  }
  return new Intl.NumberFormat("en-IN").format(value);
};

/** Shared visual structure only. Each role has its own component, metrics, priorities and text.
 * The API decides which records, counts and actions the account can access.
 */
export default function LeadershipDashboardShell({
  expectedRole, title, description, eyebrow, priorityKeys = [], focusTitle,
  focusDescription, focusItems = [], api, activeUser, navigate,
}) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [refreshKey, setRefreshKey] = useState(0);

  const refresh = useCallback(() => setRefreshKey((n) => n + 1), []);
  useEffect(() => {
    if (!activeUser?.id) { setData(null); setLoading(false); return undefined; }
    let ignore = false;
    setLoading(true);
    setError("");
    api("/leadership/dashboard")
      .then((result) => {
        if (ignore) return;
        if (result.role !== expectedRole) {
          setData(null);
          setError("Your current account is not assigned to this dashboard. Please sign out and sign in with the correct role.");
          return;
        }
        setData(result);
      })
      .catch((err) => {
        if (!ignore) { setData(null); setError(err?.message || "Unable to retrieve live dashboard data."); }
      })
      .finally(() => { if (!ignore) setLoading(false); });
    return () => { ignore = true; };
  }, [activeUser?.id, api, expectedRole, refreshKey]);

  const metrics = useMemo(() => {
    const list = data?.metrics || [];
    const position = (item) => {
      const i = priorityKeys.indexOf(item.key);
      return i >= 0 ? i : priorityKeys.length + list.indexOf(item);
    };
    return [...list].sort((a, b) => position(a) - position(b));
  }, [data?.metrics, priorityKeys]);

  return (
    <section className="pc-leadership-dashboard" aria-label={title}>
      <style>{`
        .pc-leadership-dashboard{--pc-brown:#493024;--pc-muted:#806b5e;--pc-line:#ead8ca;--pc-primary:#a65a3a;color:var(--pc-brown);max-width:1500px;margin:0 auto;padding:14px 0 36px}
        .pc-leadership-dashboard .pc-leadership-hero{padding:30px 32px;border:1px solid #ead5c4;border-radius:22px;background:radial-gradient(circle at 88% 20%,rgba(195,112,73,.18),transparent 34%),linear-gradient(115deg,#fffaf5,#f5e5d8);box-shadow:0 12px 30px rgba(77,45,27,.065);display:flex;align-items:flex-start;justify-content:space-between;gap:24px;flex-wrap:wrap}
        .pc-leadership-dashboard h1{font-family:Georgia,serif;font-size:clamp(27px,3.2vw,38px);margin:8px 0 10px;line-height:1.17;color:#38251b}
        .pc-leadership-dashboard .eyebrow{font-size:11px;font-weight:800;letter-spacing:.14em;text-transform:uppercase;color:#a65335}
        .pc-leadership-dashboard .muted{font-size:13px;color:var(--pc-muted);line-height:1.65;margin:0}
        .pc-leadership-dashboard .role-pill{font-size:12px;font-weight:800;border:1px solid #ddbaa4;background:#fffaf5;padding:10px 14px;border-radius:99px;color:#87482f}
        .pc-leadership-dashboard .refresh-btn{background:#fffaf5;color:#8e4c32;border:1px solid #d7ad95;border-radius:10px;padding:9px 15px;font-size:12px;font-weight:750;cursor:pointer}
        .pc-leadership-dashboard .refresh-btn:hover{background:#f5e6da}
        .pc-leadership-dashboard .metrics{margin:22px 0;display:grid;grid-template-columns:repeat(auto-fit,minmax(190px,1fr));gap:14px}
        .pc-leadership-dashboard .metric{min-width:0;background:linear-gradient(145deg,#fffefa,#fff8f1);padding:22px;border:1px solid var(--pc-line);border-radius:17px;box-shadow:0 8px 22px rgba(65,42,27,.045)}
        .pc-leadership-dashboard .metric-label{font-size:12px;font-weight:750;color:#705548;margin:0 0 12px}
        .pc-leadership-dashboard .metric-value{font-family:Georgia,serif;font-size:clamp(24px,2.6vw,32px);font-weight:750;color:#8b472f;overflow-wrap:anywhere}
        .pc-leadership-dashboard .metric-description{font-size:11px;color:#866f60;margin-top:9px;line-height:1.5}
        .pc-leadership-dashboard .panels{display:grid;grid-template-columns:minmax(0,1.4fr) minmax(260px,1fr);gap:18px}
        .pc-leadership-dashboard .panel{border:1px solid var(--pc-line);border-radius:19px;background:#fffdf9;padding:23px;min-width:0;box-shadow:0 8px 24px rgba(65,42,27,.045)}
        .pc-leadership-dashboard .panel h2{font-family:Georgia,serif;font-size:21px;margin:0 0 8px;color:#503326}
        .pc-leadership-dashboard .action-grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(155px,1fr));gap:10px;margin-top:16px}
        .pc-leadership-dashboard .action{min-height:60px;padding:13px;text-align:left;background:#fff8f1;border:1px solid #e8cebb;border-radius:12px;color:#73402e;font-size:12px;font-weight:750;cursor:pointer}
        .pc-leadership-dashboard .action:hover{background:#f5e4d6;border-color:#cb9270}
        .pc-leadership-dashboard .event{padding:13px 0;border-bottom:1px solid #eee0d5}
        .pc-leadership-dashboard .event:last-child{border-bottom:0}
        .pc-leadership-dashboard .event strong{font-size:13px;display:block;color:#54392d}
        .pc-leadership-dashboard .event span{color:#806b5e;font-size:11px}
        .pc-leadership-dashboard .focus-list{padding-left:18px;margin:12px 0 0;color:#70594a;line-height:1.8;font-size:12px}
        .pc-leadership-dashboard .notice{padding:15px;background:#fff8f1;border:1px solid #ead8ca;border-radius:12px;color:#806b5e;font-size:13px;line-height:1.6}
        .pc-leadership-dashboard .error{color:#a1261c;background:#fff1ee;border-color:#f1c2b7}
        @media(max-width:780px){.pc-leadership-dashboard .panels{grid-template-columns:1fr}.pc-leadership-dashboard .pc-leadership-hero{padding:22px}.pc-leadership-dashboard .panel{padding:19px}}
      `}</style>
      <header className="pc-leadership-hero">
        <div>
          <span className="eyebrow">{eyebrow}</span>
          <h1>{title}</h1>
          <p className="muted">{description}</p>
          {data?.member && <p className="muted" style={{ marginTop: 10 }}>Signed in as <strong>{data.member.name}</strong></p>}
        </div>
        <div style={{ display: "grid", justifyItems: "end", gap: 11 }}>
          <span className="role-pill">{expectedRole}</span>
          <button className="refresh-btn" type="button" onClick={refresh} disabled={loading}>{loading ? "Loading…" : "Refresh live data"}</button>
        </div>
      </header>

      {loading && <p role="status" className="notice" style={{ marginTop: 20 }}>Loading actual community records…</p>}
      {!loading && error && <div role="alert" className="notice error" style={{ marginTop: 20 }}>{error}</div>}
      {!loading && data && <>
        {metrics.length ? <div className="metrics">{metrics.map((metric) => <article className="metric" key={metric.key}>
          <p className="metric-label">{metric.label}</p>
          <div className="metric-value">{formatValue(metric)}</div>
          <p className="metric-description">{metric.description}</p>
        </article>)}</div> : <p className="notice" style={{ marginTop: 20 }}>No dashboard statistics are available to this account's currently assigned permissions. Ask an administrator to review role permissions if needed.</p>}

        <div className="panels">
          <article className="panel"><h2>Authorized tools</h2><p className="muted">These shortcuts are based on your active backend permissions.</p>
            {data.actions?.length ? <div className="action-grid">{data.actions.map((action) => <button type="button" className="action" key={`${action.page}-${action.label}`} onClick={() => navigate(action.page)}>{action.label} →</button>)}</div> : <p className="notice">No tools assigned to this account.</p>}
          </article>
          <article className="panel"><h2>{focusTitle}</h2><p className="muted">{focusDescription}</p>
            <ul className="focus-list">{focusItems.map((item, i) => <li key={i}>{item}</li>)}</ul>
            {data.my_assignment?.note && <p className="notice" style={{ marginTop: 12 }}><strong>Current assignment:</strong> {data.my_assignment.note}</p>}
            {data.my_assignment?.term_end && <p className="muted" style={{ marginTop: 8 }}>Term ends: {formatDate(data.my_assignment.term_end)}</p>}
          </article>
          <article className="panel" style={{ gridColumn: "1 / -1" }}><h2>Upcoming community events</h2>
            <p className="muted">Published events from the live community database.</p>
            {data.upcoming_events?.length ? <div>{data.upcoming_events.map((event) => <div className="event" key={event.id}>
              <strong>{event.title}</strong><span>{formatDate(event.date)} · {event.venue}</span>
            </div>)}</div> : <p className="notice" style={{ marginTop: 14 }}>No upcoming published events are currently recorded.</p>}
          </article>
        </div>
      </>}
    </section>
  );
}
