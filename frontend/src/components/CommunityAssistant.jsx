import React, { useEffect, useRef, useState } from "react";
import { Bot, Send, Sparkles, UserRound, Trash2, LoaderCircle, Lightbulb, ShieldCheck } from "lucide-react";

const API_BASE = (import.meta.env.VITE_API_BASE_URL || "http://localhost:8000").replace(/\/$/, "");
const suggestions = [
  "How can I become a verified member?",
  "What documents are needed for membership?",
  "How can I sell my pottery on the marketplace?",
  "How do I find scholarships and government schemes?",
];

export default function CommunityAssistant() {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const bottomRef = useRef(null);
  const inputRef = useRef(null);

  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior: "smooth" }); }, [messages, loading]);

  const sendMessage = async (text = input) => {
    const message = text.trim();
    if (!message || loading) return;
    const token = sessionStorage.getItem("potterCommunityAccessToken") || localStorage.getItem("token");
    if (!token) { setError("Please sign in again to use the community assistant."); return; }
    const history = messages.filter((m) => m.role === "user" || m.role === "model").slice(-10).map(({ role, content }) => ({ role, content }));
    setMessages((old) => [...old, { role: "user", content: message }]);
    setInput(""); setError(""); setLoading(true);
    try {
      const response = await fetch(`${API_BASE}/community-assistant/chat`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ message, history }),
      });
      const data = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(data.detail || "Unable to get a response. Please try again.");
      setMessages((old) => [...old, { role: "model", content: data.reply }]);
    } catch (err) { setError(err.message || "Something went wrong. Please try again."); }
    finally { setLoading(false); inputRef.current?.focus(); }
  };

  const clearChat = () => { setMessages([]); setError(""); setInput(""); };

  return <main className="ca-page">
    <style>{`
      .ca-page{--ca-ink:#3c2a20;--ca-muted:#806e62;--ca-clay:#a95736;max-width:1120px;margin:0 auto;padding:8px 4px 30px;color:var(--ca-ink)}.ca-page *{box-sizing:border-box}
      .ca-hero{display:flex;align-items:center;gap:17px;padding:23px 26px;border:1px solid #ead8ca;border-radius:20px;background:linear-gradient(120deg,#fff5ec,#f4e4d6);margin-bottom:18px}
      .ca-logo{width:54px;height:54px;display:grid;place-items:center;flex:none;border-radius:17px;background:linear-gradient(145deg,#bd704e,#8f482f);color:white;box-shadow:0 8px 18px #8f482f30}
      .ca-kicker{font-size:10px;letter-spacing:.15em;text-transform:uppercase;font-weight:900;color:#a95736}.ca-title{font-size:25px;letter-spacing:-.03em;font-weight:850;margin:4px 0 5px}.ca-subtitle{font-size:12px;color:#806e62;margin:0;line-height:1.6}
      .ca-layout{display:grid;grid-template-columns:minmax(0,1fr) 275px;gap:17px;align-items:stretch}.ca-chat{min-height:590px;display:flex;flex-direction:column;border:1px solid #eaded5;border-radius:18px;background:#fff;overflow:hidden;box-shadow:0 8px 25px #5235220a}
      .ca-chat-head{display:flex;align-items:center;justify-content:space-between;padding:14px 18px;border-bottom:1px solid #f0e6df;background:#fffdfa}.ca-online{display:flex;align-items:center;gap:9px;font-size:12px;font-weight:800}.ca-online-dot{width:8px;height:8px;border-radius:50%;background:#4e9b65;box-shadow:0 0 0 4px #4e9b6518}.ca-clear{display:flex;align-items:center;gap:6px;border:1px solid #eaded5;border-radius:9px;padding:8px 10px;background:white;color:#785b4b;font-size:10px;font-weight:750;cursor:pointer}
      .ca-messages{flex:1;min-height:390px;max-height:550px;overflow:auto;padding:20px;display:flex;flex-direction:column;gap:16px;background:linear-gradient(#fff,#fffdfb)}.ca-welcome{text-align:center;max-width:480px;margin:auto;padding:22px 10px}.ca-welcome-icon{width:58px;height:58px;margin:0 auto 14px;display:grid;place-items:center;border-radius:19px;background:#f8eee7;color:#a95736}.ca-welcome h2{font-size:19px;margin:0 0 8px}.ca-welcome p{font-size:12px;line-height:1.7;color:#806e62;margin:0}
      .ca-msg{display:flex;align-items:flex-start;gap:9px;max-width:88%}.ca-msg.user{align-self:flex-end;flex-direction:row-reverse}.ca-avatar{width:29px;height:29px;display:grid;place-items:center;flex:none;border-radius:10px;background:#f4e8df;color:#a95736}.ca-msg.user .ca-avatar{background:#a95736;color:white}.ca-bubble{padding:11px 13px;border-radius:4px 14px 14px 14px;background:#f8f2ed;font-size:12px;line-height:1.7;color:#49352a;white-space:pre-wrap;overflow-wrap:anywhere}.ca-msg.user .ca-bubble{border-radius:14px 4px 14px 14px;background:#a95736;color:#fffaf6}.ca-typing{display:flex;align-items:center;gap:8px;color:#927e71;font-size:11px;padding:4px 0}.ca-input-area{padding:13px 15px;border-top:1px solid #f0e6df;background:#fffdfa}.ca-input-row{display:flex;gap:9px;align-items:flex-end}.ca-input{min-height:45px;max-height:120px;resize:vertical;flex:1;border:1px solid #e8d9cf;border-radius:12px;padding:12px 13px;font:inherit;font-size:12px;outline:none;background:white;color:#49352a}.ca-input:focus{border-color:#b66b4c;box-shadow:0 0 0 3px #b66b4c18}.ca-send{width:45px;height:45px;display:grid;place-items:center;border:0;border-radius:12px;background:linear-gradient(135deg,#b96848,#91452e);color:white;cursor:pointer}.ca-send:disabled{opacity:.5;cursor:not-allowed}.ca-footnote{font-size:9px;color:#9a887d;margin:8px 2px 0;line-height:1.5}
      .ca-side{display:flex;flex-direction:column;gap:13px}.ca-side-card{padding:17px;border:1px solid #eaded5;border-radius:16px;background:#fff}.ca-side-title{display:flex;align-items:center;gap:8px;font-size:12px;font-weight:850;margin:0 0 12px}.ca-suggestion{display:block;width:100%;text-align:left;padding:10px 11px;margin-top:8px;border:1px solid #eee1d7;border-radius:10px;background:#fffaf6;color:#6d4b39;font-size:10px;line-height:1.5;font-weight:700;cursor:pointer}.ca-suggestion:hover{border-color:#c99a80;background:#fff3e9}.ca-note{font-size:10px;color:#857267;line-height:1.7;margin:0}.ca-error{padding:10px 12px;margin:0 15px 10px;border-radius:10px;border:1px solid #f0c6bd;background:#fff3f0;color:#9d3e2e;font-size:11px}
      @media(max-width:820px){.ca-layout{grid-template-columns:1fr}.ca-side{display:grid;grid-template-columns:1fr 1fr}.ca-chat{min-height:560px}}@media(max-width:520px){.ca-page{padding:0}.ca-hero{padding:17px;border-radius:15px}.ca-title{font-size:21px}.ca-side{grid-template-columns:1fr}.ca-messages{padding:14px}.ca-msg{max-width:96%}.ca-chat{min-height:520px}}
    `}</style>
    <section className="ca-hero"><div className="ca-logo"><Bot size={28}/></div><div><div className="ca-kicker">Potter Community · Smart help</div><h1 className="ca-title">AI Community Assistant</h1><p className="ca-subtitle">Your digital guide for membership, pottery schemes, marketplace and community services.</p></div></section>
    <div className="ca-layout">
      <section className="ca-chat">
        <header className="ca-chat-head"><div className="ca-online"><span className="ca-online-dot"/> Community Assistant <span style={{fontSize:9,color:"#8b786c",fontWeight:600}}>· AI powered</span></div><button className="ca-clear" onClick={clearChat}><Trash2 size={13}/> Clear chat</button></header>
        <div className="ca-messages" aria-live="polite">
          {messages.length===0?<div className="ca-welcome"><div className="ca-welcome-icon"><Sparkles size={27}/></div><h2>Namaste! How can I help you?</h2><p>Ask me anything about the Potter Community Platform, membership, schemes, scholarships, marketplace or growing your pottery business.</p></div>:messages.map((m,i)=><div key={i} className={`ca-msg ${m.role}`}><div className="ca-avatar">{m.role==="user"?<UserRound size={15}/>:<Bot size={16}/>}</div><div className="ca-bubble">{m.content}</div></div>)}
          {loading&&<div className="ca-typing"><LoaderCircle size={15} className="ca-spin"/> Thinking of a helpful answer…</div>}<div ref={bottomRef}/>
        </div>
        {error&&<div className="ca-error" role="alert">{error}</div>}
        <div className="ca-input-area"><form className="ca-input-row" onSubmit={e=>{e.preventDefault();sendMessage();}}><textarea ref={inputRef} className="ca-input" rows={1} value={input} onChange={e=>setInput(e.target.value)} onKeyDown={e=>{if(e.key==="Enter"&&!e.shiftKey){e.preventDefault();sendMessage();}}} placeholder="Type your question here…" maxLength={4000}/><button className="ca-send" type="submit" disabled={!input.trim()||loading} aria-label="Send message"><Send size={17}/></button></form><p className="ca-footnote">AI responses can be inaccurate. Verify current government scheme details with official sources. Never share OTPs, passwords or banking credentials.</p></div>
      </section>
      <aside className="ca-side"><div className="ca-side-card"><h3 className="ca-side-title"><Lightbulb size={16} color="#a95736"/> Suggested questions</h3>{suggestions.map((q)=><button className="ca-suggestion" key={q} onClick={()=>sendMessage(q)} disabled={loading}>{q}</button>)}</div><div className="ca-side-card"><h3 className="ca-side-title"><ShieldCheck size={16} color="#63815d"/> Helpful & safe guidance</h3><p className="ca-note">The assistant can explain platform features and offer general guidance. It cannot view your private account records, submit applications, approve memberships or confirm live government scheme status.</p></div></aside>
    </div>
  </main>;
}
