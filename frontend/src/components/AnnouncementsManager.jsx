import React, { useEffect, useState } from "react";

// Uses the platform's existing button, card and form colors; no global CSS changes.
const emptyDraft = {
  title: "",
  description: "",
  category: "General",
  audience: "ALL",
  is_public: false,
  is_pinned: false,
  status: "PUBLISHED",
  expires_at: "",
};

const categories = ["General", "Events", "Government Schemes", "Marketplace", "Important"];
const audiences = [
  ["ALL", "All registered users"],
  ["MEMBERS", "Approved members"],
  ["ARTISANS", "Approved artisans"],
  ["COMMITTEE", "Active committee members"],
];

const labelStyle = { display: "grid", gap: 6, fontSize: 12, fontWeight: 700, color: "#604334" };
const fieldStyle = { padding: "11px 12px", border: "1px solid #e5cfc0", borderRadius: 9, font: "inherit", color: "#4a3428", background: "#fffaf6", width: "100%", boxSizing: "border-box" };

export default function AnnouncementsManager({ api, onChange }) {
  const [records, setRecords] = useState([]);
  const [loading, setLoading] = useState(false);
  const [busy, setBusy] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [draft, setDraft] = useState({ ...emptyDraft });
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  const load = async () => {
    setLoading(true);
    setError("");
    try {
      const result = await api("/announcements/manage");
      setRecords(Array.isArray(result) ? result : []);
    } catch (failure) {
      setError(failure.message || "Could not load announcement management records.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const reset = () => {
    setEditingId(null);
    setDraft({ ...emptyDraft });
    setShowForm(false);
  };

  const edit = (item) => {
    setEditingId(item.id);
    setDraft({
      title: item.title || "",
      description: item.description || "",
      category: item.category || "General",
      audience: item.audience || "ALL",
      is_public: !!item.is_public,
      is_pinned: !!item.is_pinned,
      status: item.status || "DRAFT",
      expires_at: item.expires_at ? new Date(item.expires_at).toISOString().slice(0, 10) : "",
    });
    setShowForm(true);
    setError("");
    setMessage("");
  };

  const toPayload = (value) => ({
    title: value.title.trim(),
    description: value.description.trim(),
    category: value.category,
    audience: value.audience,
    is_public: value.audience === "ALL" && value.is_public,
    is_pinned: value.is_pinned,
    status: value.status,
    // Expiry is at the *end* of the selected date, not at its start.
    expires_at: value.expires_at ? `${value.expires_at}T23:59:59Z` : null,
  });

  const save = async (event) => {
    event.preventDefault();
    setBusy(true);
    setError("");
    setMessage("");
    try {
      const payload = toPayload(draft);
      if (draft.status === "PUBLISHED" && payload.expires_at && new Date(payload.expires_at).getTime() <= Date.now()) {
        throw new Error("Please select a future expiry date, or leave the field blank.");
      }
      const url = editingId ? `/announcements/${editingId}` : "/announcements";
      const result = await api(url, {
        method: editingId ? "PATCH" : "POST",
        body: JSON.stringify(payload),
      });
      setMessage(`Announcement ${editingId ? "updated" : "created"} successfully.${result.notified_members ? ` ${result.notified_members} members notified.` : ""}`);
      reset();
      await load();
      await onChange?.();
    } catch (failure) {
      setError(failure.message || "Could not save the announcement.");
    } finally {
      setBusy(false);
    }
  };

  const changeStatus = async (item) => {
    const next = item.status === "PUBLISHED" ? "DRAFT" : "PUBLISHED";
    if (next === "PUBLISHED" && item.expires_at && new Date(item.expires_at).getTime() <= Date.now()) {
      setError("This announcement is expired. Edit its expiry date before republishing.");
      return;
    }
    setBusy(true);
    setError("");
    setMessage("");
    try {
      const updated = await api(`/announcements/${item.id}`, { method: "PATCH", body: JSON.stringify({ status: next }) });
      setMessage(next === "PUBLISHED" ? `Published. ${updated.notified_members || 0} members notified.` : "Announcement moved to drafts.");
      await load();
      await onChange?.();
    } catch (failure) {
      setError(failure.message || "Could not change publishing status.");
    } finally { setBusy(false); }
  };

  const remove = async (item) => {
    if (!window.confirm(`Permanently delete the announcement "${item.title}"?`)) return;
    setBusy(true);
    setError("");
    setMessage("");
    try {
      await api(`/announcements/${item.id}`, { method: "DELETE" });
      if (editingId === item.id) reset();
      setMessage("Announcement deleted.");
      await load();
      await onChange?.();
    } catch (failure) {
      setError(failure.message || "Could not delete the announcement.");
    } finally { setBusy(false); }
  };

  return (
    <section style={{ border: "1px solid #ead8c9", background: "#fffdf9", borderRadius: 16, padding: 20, marginBottom: 22 }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 12, flexWrap: "wrap" }}>
        <div>
          <h2 style={{ fontSize: 18, margin: 0, color: "#503527" }}>Manage community announcements</h2>
          <p style={{ margin: "5px 0 0", fontSize: 12, color: "#806b5e" }}>Publish, target and expire notices. Only authorized editors can manage them.</p>
        </div>
        <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
          <button className="btn btn-outline" type="button" onClick={load} disabled={loading || busy}>{loading ? "Refreshing…" : "Refresh"}</button>
          <button className="btn btn-primary" type="button" onClick={() => { if (showForm) reset(); else { reset(); setShowForm(true); } }} disabled={busy}>{showForm ? "Close form" : "Create announcement"}</button>
        </div>
      </div>
      {message && <p role="status" style={{ fontSize: 12, color: "#2d6c3c" }}>{message}</p>}
      {error && <p role="alert" style={{ fontSize: 12, color: "#a32626" }}>{error}</p>}

      {showForm && (
        <form onSubmit={save} style={{ border: "1px solid #efdfd4", borderRadius: 12, padding: 16, marginTop: 17, display: "grid", gap: 14 }}>
          <h3 style={{ fontSize: 16, margin: 0 }}>{editingId ? "Edit announcement" : "New announcement"}</h3>
          <label style={labelStyle}>Title
            <input required minLength={3} maxLength={160} value={draft.title} onChange={(e) => setDraft({ ...draft, title: e.target.value })} style={fieldStyle} />
          </label>
          <label style={labelStyle}>Message
            <textarea required minLength={10} maxLength={5000} rows={5} value={draft.description} onChange={(e) => setDraft({ ...draft, description: e.target.value })} style={{ ...fieldStyle, resize: "vertical" }} />
          </label>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(190px,1fr))", gap: 12 }}>
            <label style={labelStyle}>Category
              <select style={fieldStyle} value={draft.category} onChange={(e) => setDraft({ ...draft, category: e.target.value })}>{categories.map((value) => <option key={value} value={value}>{value}</option>)}</select>
            </label>
            <label style={labelStyle}>Audience
              <select style={fieldStyle} value={draft.audience} onChange={(e) => setDraft({ ...draft, audience: e.target.value, is_public: e.target.value === "ALL" && draft.is_public })}>{audiences.map(([value, label]) => <option key={value} value={value}>{label}</option>)}</select>
            </label>
            <label style={labelStyle}>Expires at (optional)
              <input type="date" style={fieldStyle} value={draft.expires_at} onChange={(e) => setDraft({ ...draft, expires_at: e.target.value })} />
            </label>
            <label style={labelStyle}>Publishing status
              <select style={fieldStyle} value={draft.status} onChange={(e) => setDraft({ ...draft, status: e.target.value })}><option value="PUBLISHED">Publish now</option><option value="DRAFT">Save as draft</option></select>
            </label>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 20, flexWrap: "wrap", color: "#705546", fontSize: 12 }}>
            <label style={{ display: "flex", alignItems: "center", gap: 6 }}><input type="checkbox" checked={draft.is_pinned} onChange={(e) => setDraft({ ...draft, is_pinned: e.target.checked })} /> Pin to top</label>
            <label style={{ display: "flex", alignItems: "center", gap: 6 }}><input type="checkbox" disabled={draft.audience !== "ALL"} checked={draft.is_public} onChange={(e) => setDraft({ ...draft, is_public: e.target.checked })} /> Visible to visitors (All users only)</label>
          </div>
          <div style={{ display: "flex", gap: 9, flexWrap: "wrap" }}>
            <button type="submit" className="btn btn-primary" disabled={busy}>{busy ? "Saving…" : editingId ? "Save changes" : "Create announcement"}</button>
            <button type="button" className="btn btn-outline" onClick={reset} disabled={busy}>Cancel</button>
          </div>
        </form>
      )}

      <div style={{ marginTop: 18, display: "grid", gap: 10 }}>
        <h3 style={{ fontSize: 14, margin: 0 }}>Announcement records ({records.length})</h3>
        {loading && <p style={{ color: "#806b5e", fontSize: 12 }}>Loading announcements…</p>}
        {!loading && records.length === 0 && <p style={{ color: "#806b5e", fontSize: 12 }}>No announcements have been created yet.</p>}
        {records.map((item) => {
          const expired = !!item.expires_at && new Date(item.expires_at).getTime() <= Date.now();
          return (
            <article key={item.id} style={{ border: "1px solid #efdfd4", borderRadius: 12, padding: 13, background: "#fffaf6" }}>
              <div style={{ display: "flex", justifyContent: "space-between", gap: 12, flexWrap: "wrap" }}>
                <div>
                  <strong style={{ color: "#493124", fontSize: 13 }}>{item.title}</strong>
                  <p style={{ fontSize: 11, color: "#806b5e", margin: "5px 0" }}>{item.category} · {item.audience} · {item.status}{expired ? " · Expired" : ""}{item.expires_at ? ` · Expires ${new Date(item.expires_at).toLocaleDateString()}` : ""}</p>
                </div>
                <div style={{ display: "flex", gap: 7, flexWrap: "wrap", alignItems: "center" }}>
                  <button type="button" className="btn btn-outline" onClick={() => edit(item)} disabled={busy}>Edit</button>
                  <button type="button" className="btn btn-outline" onClick={() => changeStatus(item)} disabled={busy}>{item.status === "PUBLISHED" ? "Unpublish" : "Publish"}</button>
                  <button type="button" className="btn btn-outline" onClick={() => remove(item)} disabled={busy}>Delete</button>
                </div>
              </div>
            </article>
          );
        })}
      </div>
    </section>
  );
}
