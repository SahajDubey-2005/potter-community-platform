import React, { useEffect, useState } from "react";
import {
  ArrowRight, Bell, BookOpenCheck, CalendarDays, CheckCircle2, CreditCard,
  FileText, GraduationCap, Heart, HeartPulse, Landmark, MapPin, Megaphone,
  Package, RefreshCw, ShieldCheck, ShoppingBag, Sparkles, UserRound,
  Users, Briefcase, IndianRupee, Clock, Home, UserCheck,
} from "lucide-react";

// Uses only backend records belonging to the authenticated member.
// Real privileges are enforced by the existing backend routes, not by these links.
const memberServices = [
  { title: "My Profile & Member Card", detail: "Update profile, family details and membership card", icon: UserRound, page: "profile" },
  { title: "Member Directory", detail: "View verified community members", icon: Users, page: "members", approved: true },
  { title: "Announcements", detail: "Read verified community announcements", icon: Megaphone, page: "announcements" },
  { title: "Meetings & Minutes", detail: "View published community records", icon: BookOpenCheck, page: "community-records" },
  { title: "Events", detail: "Browse gatherings and register to attend", icon: CalendarDays, page: "events", approved: true },
  { title: "Professional Network", detail: "Discover professionals and opportunities", icon: Briefcase, page: "professional-network", approved: true },
  { title: "AI Community Assistant", detail: "Ask questions and explore community services", icon: Sparkles, page: "community-assistant", approved: true },
  { title: "Matrimonial", detail: "Adult-only verified matrimonial service", icon: Heart, page: "matrimonial", approved: true },
  { title: "My Documents", detail: "Upload documents and check review status", icon: FileText, page: "documents", approved: true },
  { title: "Government Schemes", detail: "Explore schemes and request application guidance", icon: Landmark, page: "schemes" },
  { title: "Scholarships", detail: "See scholarship opportunities and applications", icon: GraduationCap, page: "scholarships" },
  { title: "Widow Pension & Assistance", detail: "Submit an assistance request when eligible", icon: IndianRupee, page: "widow-assistance", approved: true },
  { title: "Marketplace", detail: "Browse pottery products and artisans", icon: ShoppingBag, page: "marketplace" },
  { title: "Track My Orders", detail: "Track purchases, payments and courier updates", icon: MapPin, page: "order-tracking" },
  { title: "Payments & Fees", detail: "Check member fees and receipts", icon: CreditCard, page: "payments", approved: true },
  { title: "Emergency Support", detail: "Request community emergency assistance", icon: HeartPulse, page: "emergency", approved: true },
  { title: "Notifications", detail: "Read personal service updates", icon: Bell, page: "notifications", approved: true },
];

const stats = [
  { key: "my_orders", title: "My Orders", icon: Package, page: "order-tracking" },
  { key: "event_registrations", title: "Event Registrations", icon: CalendarDays, page: "events" },
  { key: "scholarship_applications", title: "Scholarship Requests", icon: GraduationCap, page: "scholarships" },
  { key: "scheme_assistance_requests", title: "Scheme Help Requests", icon: Landmark, page: "schemes" },
  { key: "my_documents", title: "My Documents", icon: FileText, page: "documents" },
  { key: "unread_notifications", title: "Unread Notifications", icon: Bell, page: "notifications" },
  { key: "emergency_requests", title: "Emergency Requests", icon: HeartPulse, page: "emergency" },
  { key: "family_members", title: "Family Members", icon: Users, page: "profile" },
];

function formatStatus(value) {
  return String(value || "PENDING").replaceAll("_", " ").toLowerCase().replace(/\b\w/g, (ch) => ch.toUpperCase());
}

export default function RegularMemberDashboard({ activeUser, api, navigate }) {
  const [data, setData] = useState(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);
  const [refreshIndex, setRefreshIndex] = useState(0);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    api("/member/dashboard")
      .then((result) => { if (!cancelled) { setData(result); setError(""); } })
      .catch((err) => { if (!cancelled) { setError(err.message || "Could not load your member dashboard."); setData(null); } })
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, [api, activeUser?.id, refreshIndex]);

  const member = data?.member || activeUser || {};
  const approved = String(member.membership_status || activeUser?.membership_status || "").toUpperCase() === "APPROVED";
  const name = member.name || activeUser?.full_name || "Community member";
  const memberNumber = member.membership_number || activeUser?.membership_number || "Available after approval";
  const numbers = data?.counts || {};

  return (
    <main className="pc-member-dashboard">
      <style>{`
        .pc-member-dashboard { max-width: 1450px; margin: 0 auto; padding: 0 0 28px; color: #4e3325; }
        .pc-member-dashboard .member-hero { display: flex; justify-content: space-between; gap: 18px; align-items: center; flex-wrap: wrap; padding: 25px; border: 1px solid #ebd3c2; background: linear-gradient(112deg,#fffaf6,#f3e2d4); border-radius: 20px; margin-bottom: 19px; }
        .pc-member-dashboard h1 { font-size: clamp(23px,3vw,31px); margin: 5px 0 8px; line-height: 1.2; }
        .pc-member-dashboard h2 { font-size: 18px; margin: 0; }
        .pc-member-dashboard p { line-height: 1.6; }
        .pc-member-dashboard .eyebrow { font-size: 10px; letter-spacing: .12em; text-transform: uppercase; font-weight: 800; color: #ad5939; }
        .pc-member-dashboard .soft { color: #846c5d; font-size: 13px; margin: 0; }
        .pc-member-dashboard .member-pill { display:inline-flex;gap:7px;align-items:center;border-radius: 30px;padding:9px 13px;border:1px solid #d6e5d5;background:#f3fbf3;color:#317442;font-weight:750;font-size:12px; }
        .pc-member-dashboard .member-pill.pending { background:#fff7e9;border-color:#e9d5b5;color:#8b621f; }
        .pc-member-dashboard .member-card { padding: 19px; border:1px solid #ebdccf; border-radius: 16px; background:#fffdfb; }
        .pc-member-dashboard .count-grid { display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:12px;margin:18px 0 22px; }
        .pc-member-dashboard .count-tile { border:1px solid #ead7c8; border-radius:14px;background:white;padding:15px;text-align:left;cursor:pointer;color:inherit; }
        .pc-member-dashboard .count-tile:hover, .pc-member-dashboard .service:hover { border-color:#b66845; background:#fff8f3; }
        .pc-member-dashboard .count-tile b { display:block;font-size:23px; margin:8px 0 3px;color:#a55132; }
        .pc-member-dashboard .count-tile span { font-size:12px;color:#80695c; }
        .pc-member-dashboard .service-grid { display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:12px;margin:13px 0 23px; }
        .pc-member-dashboard .service { border:1px solid #ead9ca;background:#fff;padding:17px;border-radius:14px;text-align:left;display:flex;gap:12px;align-items:flex-start;cursor:pointer;color:#503426; }
        .pc-member-dashboard .service strong {font-size:13px;display:block;margin-bottom:5px;}
        .pc-member-dashboard .service small {font-size:11px;color:#826b5c;line-height:1.5;display:block;}
        .pc-member-dashboard .section-header { display:flex;align-items:center;justify-content:space-between;gap:10px;flex-wrap:wrap;margin:20px 0 12px; }
        .pc-member-dashboard .section-header button, .pc-member-dashboard .hero-action {border:1px solid #ac5a39;background:#a95736;color:#fff;padding:11px 15px;border-radius:11px;font-size:12px;font-weight:750;cursor:pointer;display:inline-flex;align-items:center;gap:7px;}
        .pc-member-dashboard .two-cols { display:grid; grid-template-columns:repeat(2,minmax(0,1fr)); gap:14px; }
        .pc-member-dashboard .activity-row {display:block;text-align:left;width:100%;background:#fff;border:1px solid #eee1d7;border-radius:11px;padding:12px;margin-top:9px;color:#503426;cursor:pointer;}
        .pc-member-dashboard .activity-row strong {font-size:12px;display:block;}
        .pc-member-dashboard .activity-row small {display:block;color:#80695c;font-size:11px;margin-top:5px;}
        @media(max-width:1000px){ .pc-member-dashboard .service-grid {grid-template-columns:repeat(2,minmax(0,1fr))} .pc-member-dashboard .count-grid{grid-template-columns:repeat(2,minmax(0,1fr))} }
        @media(max-width:640px){ .pc-member-dashboard .service-grid,.pc-member-dashboard .two-cols {grid-template-columns:1fr} .pc-member-dashboard .member-hero{padding:18px} }
      `}</style>

      <section className="member-hero">
        <div>
          <span className="eyebrow">POTTER COMMUNITY · MEMBER SPACE</span>
          <h1>Welcome, {name}</h1>
          <p className="soft">Your community services, applications, personal records and updates in one place.</p>
          <p className="soft" style={{ marginTop: 8 }}>Membership ID: <strong>{memberNumber}</strong></p>
        </div>
        <div style={{ display: "grid", gap: 10, justifyItems: "start" }}>
          <span className={`member-pill${approved ? "" : " pending"}`}><ShieldCheck size={15} /> {approved ? "Approved General Member" : `Membership ${formatStatus(member.membership_status)}`}</span>
          <button type="button" className="hero-action" onClick={() => navigate("profile")}>View my profile <ArrowRight size={15} /></button>
        </div>
      </section>

      {error && <div role="alert" className="member-card" style={{ borderColor: "#f0b5a7", color: "#a83422", marginBottom: 15 }}>
        Could not load your member records: {error} <button type="button" style={{ marginLeft: 10 }} onClick={() => setRefreshIndex((v) => v + 1)}>Retry</button>
      </div>}
      {!approved && <div className="member-card" style={{ marginBottom: 18, background: "#fff9ef" }}>
        <ShieldCheck size={19} color="#ad7640" /> Some member services require verified and approved membership. You can still view public announcements, events, schemes and the marketplace.
      </div>}

      <div className="section-header"><h2>My activity</h2><button type="button" onClick={() => setRefreshIndex((v) => v + 1)} disabled={loading}><RefreshCw size={14} /> {loading ? "Loading..." : "Refresh"}</button></div>
      <div className="count-grid">
        {stats.map(({ key, title, icon: Icon, page }) => <button key={key} type="button" className="count-tile" onClick={() => navigate(page)}>
          <Icon size={19} color="#a75b3b" /><b>{loading && !data ? "…" : numbers[key] ?? "—"}</b><span>{title}</span>
        </button>)}
      </div>

      <div className="section-header"><h2>All member services</h2><span className="soft">Services remain subject to their own eligibility and approval rules</span></div>
      {approved && Number(numbers.my_products || 0) > 0 && <div className="member-card" style={{ marginBottom: 14, background: "#fff9f3" }}>
        <strong>You have {numbers.my_products} marketplace product listing(s).</strong>
        <button type="button" className="hero-action" style={{ marginLeft: 12 }} onClick={() => navigate("seller-dashboard")}>Open my Seller Dashboard <ArrowRight size={14} /></button>
      </div>}
      <div className="service-grid">
        {memberServices.map(({ title, detail, icon: Icon, page, approved: requiresApproval }) => <button key={title} type="button" className="service" onClick={() => navigate(page)} title={requiresApproval && !approved ? "Approved membership may be required" : title}>
          <Icon size={21} color="#ad5c3b" style={{ flexShrink: 0 }} /><span><strong>{title}</strong><small>{detail}</small>{requiresApproval && !approved && <small style={{ color: "#ad7640" }}>Requires membership approval</small>}</span>
        </button>)}
      </div>

      <div className="two-cols">
        <section className="member-card">
          <div className="section-header" style={{ marginTop: 0 }}><h2>My upcoming events</h2><button type="button" onClick={() => navigate("events")}>All events <ArrowRight size={14}/></button></div>
          {data?.upcoming_registered_events?.length ? data.upcoming_registered_events.map((event) => <button type="button" key={event.id} className="activity-row" onClick={() => navigate("events")}>
            <strong><CalendarDays size={14} style={{ verticalAlign: "middle", marginRight: 6 }}/>{event.title}</strong><small>{event.date} · {event.time} · {event.venue}</small>
          </button>) : <p className="soft">No upcoming registered events yet.</p>}
        </section>
        <section className="member-card">
          <div className="section-header" style={{ marginTop: 0 }}><h2>My notifications</h2><button type="button" onClick={() => navigate("notifications")}>See all <ArrowRight size={14}/></button></div>
          {data?.recent_notifications?.length ? data.recent_notifications.map((item) => <button type="button" key={item.id} className="activity-row" onClick={() => navigate("notifications")}>
            <strong><Bell size={14} style={{ verticalAlign: "middle", marginRight: 6 }}/>{item.title}</strong><small>{item.message}</small>
          </button>) : <p className="soft">No notifications yet.</p>}
        </section>
      </div>
      <p className="soft" style={{ marginTop: 16 }}>Having a member account does not confer administrator permissions, automatically approve assistance or guarantee government benefits. Matrimonial services are restricted to verified adults.</p>
    </main>
  );
}
