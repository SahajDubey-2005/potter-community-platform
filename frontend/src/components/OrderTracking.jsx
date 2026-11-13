import React, { useEffect, useMemo, useState } from "react";
import { Activity, ArrowDownRight, ArrowUpRight, Bell, CheckCircle2, Clock3, Package, ShoppingBag, Users, Wallet, RefreshCw, Truck, ShieldCheck, MapPin, CalendarDays, CreditCard, ChevronDown, ChevronUp, Navigation, UserRound } from "lucide-react";

const API = (import.meta.env.VITE_API_BASE_URL || "http://localhost:8000").replace(/\/$/, "");
async function request(path, options = {}) {
  const token = sessionStorage.getItem("potterCommunityAccessToken") || localStorage.getItem("token");
  const headers = { ...(options.body ? { "Content-Type": "application/json" } : {}), ...(options.headers || {}) };
  if (token) headers.Authorization = `Bearer ${token}`;
  const response = await fetch(`${API}${path}`, { ...options, headers });
  const data = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(data.detail || data.message || "Unable to load this information.");
  return data;
}
const money = n => `₹${Number(n || 0).toLocaleString("en-IN", { maximumFractionDigits: 2 })}`;
const panel = { background:"#fffdf9", border:"1px solid #ead8cc", borderRadius:16, padding:18, boxShadow:"0 8px 24px rgba(80,51,38,.045)" };
const muted = { color:"#806b5e", fontSize:12 };
const pill = status => ({ display:"inline-flex", padding:"5px 10px", borderRadius:30, background: status==="DELIVERED"?"#e8f3e8":status==="CANCELLED"?"#fbe9e5":"#f8eee5", color:status==="DELIVERED"?"#39734a":status==="CANCELLED"?"#a13d2d":"#8b5739", fontSize:11, fontWeight:800 });

// Local-only examples are shown when the account has no real orders yet.
// They are never saved to the backend or mixed into real marketplace records.
const makeDemoOrders = (view) => {
  const now = Date.now();
  const daysAgo = days => new Date(now - days * 86400000).toISOString();
  if (view === "seller") return [
    { id:"DEMO-2408", is_demo:true, created_at:daysAgo(1), status:"PROCESSING", total_amount:1250, buyer_name:"Ananya Sharma", buyer_phone:"98XXXXXX42", delivery_address:"Jayanagar, Bengaluru, Karnataka", tracking_number:"PCP-KA-2408", courier_name:"Potter Community Logistics", estimated_delivery:daysAgo(-3), current_location:"Bengaluru Sorting Centre, Karnataka", payment_method:"UPI", tracking_events:[{status:"REQUESTED",location:"Seller workshop · Bengaluru",description:"Order received by the artisan",date:daysAgo(1)},{status:"ACCEPTED",location:"Seller workshop · Bengaluru",description:"Seller confirmed your order",date:daysAgo(1)},{status:"PROCESSING",location:"Artisan workshop · Bengaluru",description:"Your pottery is being carefully packed",date:now}], items:[{product_id:"demo-s1",name:"Hand-painted Terracotta Planter",quantity:2,unit_price:450,status:"PROCESSING"},{product_id:"demo-s2",name:"Decorative Clay Diya Set",quantity:1,unit_price:350,status:"PROCESSING"}] },
    { id:"DEMO-2402", is_demo:true, created_at:daysAgo(3), status:"SHIPPED", total_amount:899, buyer_name:"Rahul Verma", buyer_phone:"97XXXXXX18", delivery_address:"Indiranagar, Bengaluru, Karnataka", tracking_number:"PCP-KA-2402", courier_name:"Potter Community Logistics", estimated_delivery:daysAgo(-2), current_location:"Bengaluru Sorting Centre, Karnataka", payment_method:"UPI", tracking_events:[{status:"REQUESTED",location:"Artisan workshop · Jaipur",description:"Order received",date:daysAgo(3)},{status:"ACCEPTED",location:"Artisan workshop · Jaipur",description:"Seller confirmed the order",date:daysAgo(3)},{status:"PROCESSING",location:"Jaipur Packing Hub, Rajasthan",description:"Item packed securely",date:daysAgo(2)},{status:"SHIPPED",location:"Bengaluru Sorting Centre, Karnataka",description:"Shipment reached the local sorting centre",date:now}], items:[{product_id:"demo-s3",name:"Traditional Blue Pottery Vase",quantity:1,unit_price:899,status:"SHIPPED"}] },
    { id:"DEMO-2396", is_demo:true, created_at:daysAgo(6), status:"DELIVERED", total_amount:600, buyer_name:"Meera Nair", buyer_phone:"99XXXXXX63", delivery_address:"Mysuru, Karnataka", tracking_number:"PCP-KA-2396", courier_name:"Potter Community Logistics", estimated_delivery:daysAgo(4), current_location:"Delivered · Mysuru, Karnataka", payment_method:"Cash on Delivery", tracking_events:[{status:"REQUESTED",location:"Artisan workshop · Mysuru",description:"Order received",date:daysAgo(6)},{status:"SHIPPED",location:"Mysuru Delivery Hub",description:"Out for delivery",date:daysAgo(5)},{status:"DELIVERED",location:"Customer address · Mysuru",description:"Package delivered successfully",date:daysAgo(4)}], items:[{product_id:"demo-s4",name:"Handmade Earthen Water Pot",quantity:2,unit_price:300,status:"DELIVERED"}] }
  ];
  return [
    { id:"DEMO-2415", is_demo:true, created_at:daysAgo(1), status:"SHIPPED", total_amount:899, tracking_number:"PCP-KA-2415", courier_name:"Potter Community Logistics", estimated_delivery:daysAgo(-2), current_location:"Bengaluru Sorting Centre, Karnataka", payment_method:"UPI", delivery_address:"Indiranagar, Bengaluru, Karnataka", tracking_events:[{status:"REQUESTED",location:"Artisan workshop · Jaipur",description:"Order received",date:daysAgo(1)},{status:"ACCEPTED",location:"Artisan workshop · Jaipur",description:"Seller confirmed the order",date:daysAgo(1)},{status:"PROCESSING",location:"Jaipur Packing Hub, Rajasthan",description:"Pottery packed with protective material",date:daysAgo(1)},{status:"SHIPPED",location:"Bengaluru Sorting Centre, Karnataka",description:"Shipment arrived at Bengaluru sorting centre",date:now}], items:[{product_id:"demo-b1",name:"Traditional Blue Pottery Vase",quantity:1,unit_price:899,status:"SHIPPED"}] },
    { id:"DEMO-2407", is_demo:true, created_at:daysAgo(4), status:"PROCESSING", total_amount:1250, tracking_number:"PCP-KA-2407", courier_name:"Potter Community Logistics", estimated_delivery:daysAgo(-4), current_location:"Artisan workshop · Bengaluru", payment_method:"UPI", delivery_address:"Jayanagar, Bengaluru, Karnataka", tracking_events:[{status:"REQUESTED",location:"Artisan workshop · Bengaluru",description:"Order received",date:daysAgo(4)},{status:"ACCEPTED",location:"Artisan workshop · Bengaluru",description:"Seller confirmed your order",date:daysAgo(3)},{status:"PROCESSING",location:"Artisan workshop · Bengaluru",description:"Your items are being prepared",date:now}], items:[{product_id:"demo-b2",name:"Hand-painted Terracotta Planter",quantity:2,unit_price:450,status:"PROCESSING"},{product_id:"demo-b3",name:"Decorative Clay Diya Set",quantity:1,unit_price:350,status:"PROCESSING"}] },
    { id:"DEMO-2391", is_demo:true, created_at:daysAgo(8), status:"DELIVERED", total_amount:600, tracking_number:"PCP-KA-2391", courier_name:"Potter Community Logistics", estimated_delivery:daysAgo(5), current_location:"Delivered · Bengaluru, Karnataka", payment_method:"Cash on Delivery", delivery_address:"Whitefield, Bengaluru, Karnataka", tracking_events:[{status:"REQUESTED",location:"Artisan workshop · Bengaluru",description:"Order received",date:daysAgo(8)},{status:"SHIPPED",location:"Bengaluru Delivery Hub",description:"Out for delivery",date:daysAgo(6)},{status:"DELIVERED",location:"Customer address · Bengaluru",description:"Package delivered successfully",date:daysAgo(5)}], items:[{product_id:"demo-b4",name:"Handmade Earthen Water Pot",quantity:2,unit_price:300,status:"DELIVERED"}] }
  ];
};


export default function OrderTrackingPage({ activeUser }) {
  const [tab,setTab]=useState("buyer"), [orders,setOrders]=useState([]), [loading,setLoading]=useState(true), [error,setError]=useState(""), [busy,setBusy]=useState(null), [showingDemo,setShowingDemo]=useState(false), [expandedOrder,setExpandedOrder]=useState(null);
  const isSeller=String(activeUser?.membership_status||"").toUpperCase()==="APPROVED";
  const load=async()=>{setLoading(true);setError("");try{const rows=await request(tab==="seller"&&isSeller?"/marketplace/seller-orders":"/marketplace/orders");if(Array.isArray(rows)&&rows.length){setOrders(rows);setShowingDemo(false);}else{setOrders(makeDemoOrders(tab==="seller"&&isSeller?"seller":"buyer"));setShowingDemo(true);}}catch(e){setOrders(makeDemoOrders(tab==="seller"&&isSeller?"seller":"buyer"));setShowingDemo(true);setError(`${e.message} Showing sample orders for preview.`);}finally{setLoading(false);}};
  useEffect(()=>{load();},[tab]);
  const update=async(id,status)=>{setBusy(id);setError("");try{if(String(id).startsWith("DEMO-")){setOrders(current=>current.map(order=>order.id===id?{...order,status,items:order.items.map(item=>({...item,status}))}:order));return;}await request(`/marketplace/orders/${id}/status`,{method:"PATCH",body:JSON.stringify({status})});await load();}catch(e){setError(e.message);}finally{setBusy(null);}};
  const statuses=["REQUESTED","ACCEPTED","PROCESSING","SHIPPED","DELIVERED","CANCELLED"];
  const steps=["REQUESTED","ACCEPTED","PROCESSING","SHIPPED","DELIVERED"];
  const total=orders.reduce((sum,o)=>sum+Number(o.total_amount||0),0);
  const count=orders.length;
  const active=orders.filter(o=>!["DELIVERED","CANCELLED"].includes(String(o.status||"").toUpperCase())).length;
  const delivered=orders.filter(o=>String(o.status||"").toUpperCase()==="DELIVERED").length;
  const statusLabel = s => ({REQUESTED:"Order placed",ACCEPTED:"Confirmed",PROCESSING:"Being prepared",SHIPPED:"On the way",DELIVERED:"Delivered",CANCELLED:"Cancelled"}[s]||s);
  return <div className="ot-page">
    <style>{`
      .ot-page{--ot-ink:#3d291f;--ot-muted:#806d62;--ot-line:#eee1d7;--ot-brand:#a95736;--ot-brand-dark:#85432b;--ot-bg:#fffdfa;max-width:1180px;margin:0 auto;padding:8px 4px 42px;color:var(--ot-ink)}
      .ot-page *{box-sizing:border-box}
      .ot-hero{position:relative;overflow:hidden;display:flex;align-items:center;justify-content:space-between;gap:22px;padding:27px 30px;margin-bottom:20px;border-radius:22px;background:linear-gradient(115deg,#fff3e9 0%,#f8e8dc 58%,#f1dfd1 100%);border:1px solid #ecd6c7}
      .ot-hero:after{content:"";position:absolute;width:220px;height:220px;border:1px solid rgba(169,87,54,.13);border-radius:50%;right:105px;top:-130px;box-shadow:0 0 0 24px rgba(169,87,54,.035),0 0 0 50px rgba(169,87,54,.025)}
      .ot-eyebrow{font-size:10px;font-weight:900;letter-spacing:.17em;color:var(--ot-brand);text-transform:uppercase}
      .ot-title{font-size:clamp(25px,3vw,34px);line-height:1.15;margin:7px 0 8px;font-weight:850;letter-spacing:-.035em;color:#482f23}
      .ot-subtitle{margin:0;color:#786256;font-size:13px;line-height:1.6}
      .ot-refresh{position:relative;z-index:1;display:inline-flex;align-items:center;gap:8px;padding:11px 16px;border:1px solid #dfc4b2;border-radius:11px;background:#fffaf6;color:#71432f;font-weight:750;font-size:12px;cursor:pointer;white-space:nowrap;box-shadow:0 3px 10px #71432f0a}
      .ot-refresh:hover{background:#fff;color:#9a4e30;border-color:#c88c6c}
      .ot-stats{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:13px;margin-bottom:20px}
      .ot-stat{display:flex;align-items:center;gap:13px;padding:16px 18px;border:1px solid var(--ot-line);border-radius:16px;background:#fff;box-shadow:0 5px 18px rgba(71,43,29,.035)}
      .ot-stat-icon{width:42px;height:42px;display:grid;place-items:center;border-radius:13px;background:#f8eee7;color:var(--ot-brand);flex:none}
      .ot-stat-label{font-size:11px;color:var(--ot-muted);font-weight:650}
      .ot-stat-value{font-size:22px;font-weight:850;letter-spacing:-.03em;margin-top:3px;color:#432d22}
      .ot-toolbar{display:flex;align-items:center;justify-content:space-between;gap:14px;flex-wrap:wrap;margin:2px 0 17px}
      .ot-tabs{display:inline-flex;gap:5px;padding:5px;background:#f3ebe5;border:1px solid #ebddd3;border-radius:13px}
      .ot-tab{border:0;border-radius:9px;padding:10px 16px;background:transparent;color:#795f51;font-size:12px;font-weight:750;cursor:pointer}
      .ot-tab.active{background:#a95736;color:white;box-shadow:0 3px 9px rgba(128,61,36,.2)}
      .ot-count{font-size:11px;color:var(--ot-muted);font-weight:650}
      .ot-demo{display:flex;gap:11px;align-items:flex-start;padding:13px 16px;margin-bottom:16px;background:#fff8ec;border:1px solid #f0d7aa;border-radius:13px;color:#79551f;font-size:12px;line-height:1.55}
      .ot-demo strong{display:block;margin-bottom:2px;color:#80531b}
      .ot-error{padding:12px 15px;margin-bottom:14px;border:1px solid #f0c6bd;background:#fff3f0;border-radius:12px;color:#a13d2d;font-size:12px}
      .ot-list{display:grid;gap:14px}
      .ot-card{padding:20px 21px;border:1px solid #ecddd3;border-radius:18px;background:#fff;box-shadow:0 7px 22px rgba(74,46,32,.045);transition:transform .18s ease,box-shadow .18s ease}
      .ot-card:hover{transform:translateY(-2px);box-shadow:0 12px 28px rgba(74,46,32,.075)}
      .ot-card-head{display:flex;justify-content:space-between;align-items:flex-start;gap:15px;padding-bottom:15px;border-bottom:1px solid #f0e6df}
      .ot-order-label{font-size:14px;font-weight:850;color:#432d22}
      .ot-date{font-size:11px;color:#917e72;margin-top:5px}
      .ot-sample{display:inline-flex;margin-top:7px;padding:4px 8px;border-radius:6px;background:#fff4df;color:#95621e;font-size:9px;font-weight:900;letter-spacing:.06em}
      .ot-status{display:inline-flex;align-items:center;gap:6px;padding:7px 10px;border-radius:30px;background:#f8eee7;color:#8b4d2f;font-size:10px;font-weight:900;letter-spacing:.035em;white-space:nowrap}
      .ot-status.delivered{background:#eaf4eb;color:#39734a}.ot-status.cancelled{background:#fbeceb;color:#a13d2d}
      .ot-items{display:grid;gap:0}
      .ot-item{display:grid;grid-template-columns:minmax(0,1fr) auto;gap:18px;align-items:center;padding:16px 0;border-bottom:1px solid #f2e9e3}
      .ot-item:last-child{border-bottom:0}
      .ot-product{font-size:13px;font-weight:800;color:#493126}
      .ot-meta{font-size:11px;color:#8a776b;margin-top:5px}
      .ot-progress{display:flex;gap:5px;margin-top:13px;max-width:590px}
      .ot-progress span{height:5px;flex:1;border-radius:8px;background:#eee4dc}
      .ot-progress span.done{background:linear-gradient(90deg,#a95736,#c77a56)}
      .ot-step-label{display:flex;justify-content:space-between;gap:8px;max-width:590px;margin-top:6px;font-size:10px;color:#8a776b}
      .ot-select{min-width:145px;padding:10px 12px;border:1px solid #e5d4c8;border-radius:10px;background:#fffaf6;color:#644332;font-size:11px;font-weight:750;outline:none}
      .ot-select:focus{border-color:#b66b4c;box-shadow:0 0 0 3px #b66b4c20}
      .ot-buyer{padding:11px 13px;margin-top:10px;border-radius:11px;background:#fbf7f3;color:#79675c;font-size:11px;line-height:1.7}
      .ot-card-foot{display:flex;align-items:center;justify-content:space-between;gap:12px;padding-top:13px;border-top:1px solid #f0e6df}
      .ot-total-label{font-size:10px;color:#8a776b}.ot-total{font-size:16px;font-weight:900;color:#432d22}
      .ot-empty{padding:48px 20px;text-align:center;border:1px dashed #ddc8ba;border-radius:18px;background:#fffdf9}
      .ot-empty-icon{width:58px;height:58px;margin:0 auto 13px;display:grid;place-items:center;border-radius:18px;background:#f8eee7;color:#a95736}
      .ot-empty h3{margin:0 0 6px;font-size:17px;color:#493126}.ot-empty p{margin:0;color:#8a776b;font-size:12px}
      .ot-skeleton{height:170px;border-radius:18px;background:linear-gradient(90deg,#f7f0eb,#fffaf6,#f7f0eb);background-size:200% 100%;animation:ot-shimmer 1.3s infinite}
      @keyframes ot-shimmer{to{background-position:-200% 0}}
      .ot-details-toggle{display:inline-flex;align-items:center;gap:7px;border:1px solid #e7d4c7;border-radius:10px;background:#fffaf6;color:#8d4d31;padding:9px 12px;font-size:11px;font-weight:800;cursor:pointer}.ot-details-toggle:hover{background:#f8eee7;border-color:#d4aa91}
      .ot-detail-panel{margin-top:15px;padding:17px;border:1px solid #ecddd3;border-radius:14px;background:linear-gradient(145deg,#fffdf9,#fbf5ef)}
      .ot-detail-grid{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:10px;margin-bottom:17px}
      .ot-detail-box{padding:12px;border:1px solid #eee2d9;border-radius:11px;background:#fff}
      .ot-detail-k{display:flex;align-items:center;gap:6px;color:#907b6e;font-size:10px;font-weight:700;margin-bottom:6px}
      .ot-detail-v{font-size:11px;font-weight:800;color:#503629;overflow-wrap:anywhere}
      .ot-location-head{display:flex;align-items:center;gap:8px;font-size:13px;font-weight:850;color:#493126;margin:2px 0 13px}
      .ot-current-location{display:flex;align-items:flex-start;gap:11px;padding:12px 13px;border:1px solid #e8d4c5;border-radius:12px;background:#fff7f0;margin-bottom:16px}
      .ot-pin{width:32px;height:32px;display:grid;place-items:center;border-radius:10px;background:#f2dfd1;color:#a95736;flex:none}
      .ot-current-location strong{display:block;font-size:11px;color:#563829;margin-bottom:4px}.ot-current-location span{font-size:11px;color:#806b5e;line-height:1.5}
      .ot-events{display:grid;gap:0}.ot-event{display:grid;grid-template-columns:22px minmax(0,1fr);gap:10px;position:relative;padding-bottom:15px}
      .ot-event:last-child{padding-bottom:0}.ot-event:not(:last-child):before{content:"";position:absolute;left:9px;top:19px;bottom:0;width:2px;background:#e7d2c4}
      .ot-event-dot{width:20px;height:20px;display:grid;place-items:center;border-radius:50%;background:#a95736;color:white;z-index:1}
      .ot-event-title{font-size:11px;font-weight:850;color:#54382a}.ot-event-desc{font-size:10px;color:#806b5e;margin-top:3px;line-height:1.45}.ot-event-meta{font-size:9px;color:#a18b7d;margin-top:4px}
      .ot-location-note{font-size:10px;color:#947f72;margin-top:12px;line-height:1.5}
      @media(max-width:700px){.ot-page{padding:4px 0 28px}.ot-hero{padding:21px 18px;border-radius:17px}.ot-refresh{padding:9px 11px}.ot-stats{grid-template-columns:1fr 1fr}.ot-stat:last-child{grid-column:1/-1}.ot-card{padding:16px}.ot-item{grid-template-columns:1fr;gap:12px}.ot-select{width:100%}.ot-card-head{align-items:flex-start}.ot-total{font-size:14px}}
      @media(max-width:700px){.ot-detail-grid{grid-template-columns:1fr 1fr}}\n      @media(max-width:420px){.ot-detail-grid{grid-template-columns:1fr}.ot-stats{grid-template-columns:1fr}.ot-stat:last-child{grid-column:auto}.ot-tabs{width:100%}.ot-tab{flex:1;padding:10px 8px}}
    `}</style>
    <section className="ot-hero">
      <div>
        <div className="ot-eyebrow">Marketplace · Order centre</div>
        <h1 className="ot-title">Track your pottery orders</h1>
        <p className="ot-subtitle">From the artisan's workshop to your doorstep — follow every step of the journey.</p>
      </div>
      <button className="ot-refresh" onClick={load} disabled={loading}><RefreshCw size={15}/> {loading?"Updating…":"Refresh orders"}</button>
    </section>

    <section className="ot-stats">
      <div className="ot-stat"><span className="ot-stat-icon"><Package size={19}/></span><div><div className="ot-stat-label">Total orders</div><div className="ot-stat-value">{count}</div></div></div>
      <div className="ot-stat"><span className="ot-stat-icon"><Truck size={19}/></span><div><div className="ot-stat-label">In progress</div><div className="ot-stat-value">{active}</div></div></div>
      <div className="ot-stat"><span className="ot-stat-icon"><CheckCircle2 size={19}/></span><div><div className="ot-stat-label">Delivered</div><div className="ot-stat-value">{delivered}</div></div></div>
    </section>

    <div className="ot-toolbar">
      {isSeller&&<div className="ot-tabs">
        <button className={`ot-tab ${tab==="buyer"?"active":""}`} onClick={()=>setTab("buyer")}>My purchases</button>
        <button className={`ot-tab ${tab==="seller"?"active":""}`} onClick={()=>setTab("seller")}>Seller orders</button>
      </div>}
      <div className="ot-count">{count} {count===1?"order":"orders"} · {tab==="seller"?"Seller view":"Customer view"}</div>
    </div>

    {error&&<div className="ot-error" role="alert">{error}</div>}
    {showingDemo&&!loading&&<div className="ot-demo"><ShieldCheck size={17} style={{flex:"none",marginTop:1}}/><div><strong>Preview mode · Sample orders</strong>These sample orders let you explore the tracking experience. They are not real purchases, and any status changes are temporary.</div></div>}
    {loading?<div className="ot-list"><div className="ot-skeleton"/><div className="ot-skeleton"/></div>:orders.length===0?
      <div className="ot-empty"><div className="ot-empty-icon"><Package size={27}/></div><h3>No orders yet</h3><p>Your marketplace purchases will appear here once you place an order.</p></div>:
      <div className="ot-list">{orders.map(o=>{
        const orderStatus=String(o.status||"REQUESTED").toUpperCase();
        const isCancelled=orderStatus==="CANCELLED";
        const isExpanded=expandedOrder===o.id;
        const events=(o.tracking_events||o.status_history||[]).slice().sort((a,b)=>new Date(a.date||a.timestamp||0)-new Date(b.date||b.timestamp||0));
        const latestEvent=events.length?events[events.length-1]:null;
        const currentLocation=o.current_location||latestEvent?.location||"Location update not available";
        const fmtDate=value=>value?new Date(value).toLocaleString("en-IN",{day:"numeric",month:"short",year:"numeric",hour:"2-digit",minute:"2-digit"}):"Not updated";
        return <section key={o.id} className="ot-card">
          <div className="ot-card-head">
            <div><div className="ot-order-label">Order #{o.id}</div><div className="ot-date">Placed on {new Date(o.created_at).toLocaleString("en-IN",{day:"numeric",month:"short",year:"numeric",hour:"2-digit",minute:"2-digit"})}</div>{o.is_demo&&<span className="ot-sample">DEMO ORDER</span>}</div>
            <span className={`ot-status ${orderStatus==="DELIVERED"?"delivered":isCancelled?"cancelled":""}`}><span>●</span>{statusLabel(orderStatus)}</span>
          </div>
          <div className="ot-items">{(o.items||[]).map((it,i)=>{
            const st=String(it.status||o.status||"REQUESTED").toUpperCase();
            const idx=steps.indexOf(st);
            return <div className="ot-item" key={`${it.product_id}-${i}`}>
              <div><div className="ot-product">{it.name}</div><div className="ot-meta">Quantity: {it.quantity} &nbsp;·&nbsp; {money(it.unit_price)} each</div>
                <div className="ot-progress">{steps.map((step,j)=><span key={step} className={!isCancelled&&idx>=j?"done":""}/>)}</div>
                <div className="ot-step-label"><span>{statusLabel(st)}</span><span>{isCancelled?"Order cancelled":st==="DELIVERED"?"Successfully delivered":`${Math.max(0,idx+1)} of 5 steps`}</span></div>
              </div>
              {tab==="seller"&&<select className="ot-select" disabled={busy===o.id||["DELIVERED","CANCELLED"].includes(st)} value={st} onChange={e=>update(o.id,e.target.value)}>{statuses.map(s=><option key={s} value={s}>{statusLabel(s)}</option>)}</select>}
            </div>;
          })}</div>
          {o.buyer_name&&tab==="seller"&&<div className="ot-buyer"><strong>Customer:</strong> {o.buyer_name} &nbsp;·&nbsp; {o.buyer_phone||"Phone not provided"}<br/><strong>Delivery address:</strong> {o.delivery_address||"Not provided"}</div>}
          <div className="ot-card-foot"><span className="ot-total-label">Order total</span><span className="ot-total">{money(o.total_amount)}</span></div>
          <div style={{display:"flex",justifyContent:"flex-end",marginTop:12}}>
            <button className="ot-details-toggle" onClick={()=>setExpandedOrder(isExpanded?null:o.id)}>{isExpanded?"Hide order details":"View more information"} {isExpanded?<ChevronUp size={14}/>:<ChevronDown size={14}/>}</button>
          </div>
          {isExpanded&&<div className="ot-detail-panel">
            <div className="ot-detail-grid">
              <div className="ot-detail-box"><div className="ot-detail-k"><Truck size={13}/> Tracking number</div><div className="ot-detail-v">{o.tracking_number||"Not assigned yet"}</div></div>
              <div className="ot-detail-box"><div className="ot-detail-k"><CalendarDays size={13}/> Expected delivery</div><div className="ot-detail-v">{o.estimated_delivery?new Date(o.estimated_delivery).toLocaleDateString("en-IN",{day:"numeric",month:"short",year:"numeric"}):"To be confirmed"}</div></div>
              <div className="ot-detail-box"><div className="ot-detail-k"><CreditCard size={13}/> Payment method</div><div className="ot-detail-v">{o.payment_method||"See payment details"}</div></div>
              <div className="ot-detail-box"><div className="ot-detail-k"><UserRound size={13}/> {tab==="seller"?"Customer":"Seller"}</div><div className="ot-detail-v">{tab==="seller"?(o.buyer_name||"Customer"):(o.seller_name||"Potter Community Seller")}</div></div>
              <div className="ot-detail-box" style={{gridColumn:"span 2"}}><div className="ot-detail-k"><MapPin size={13}/> Delivery address</div><div className="ot-detail-v">{o.delivery_address||"Address details unavailable"}</div></div>
            </div>
            <div className="ot-location-head"><Navigation size={15}/> Shipment location & journey</div>
            <div className="ot-current-location"><div className="ot-pin"><MapPin size={17}/></div><div><strong>Current / last reported location</strong><span>{currentLocation}</span></div></div>
            {events.length>0?<div className="ot-events">{events.map((ev,i)=><div className="ot-event" key={`${ev.status||"event"}-${i}`}><div className="ot-event-dot">{i===events.length-1?<MapPin size={11}/>:<CheckCircle2 size={11}/>}</div><div><div className="ot-event-title">{statusLabel(String(ev.status||"").toUpperCase())||ev.status||"Shipment update"}</div><div className="ot-event-desc">{ev.description||ev.message||"Order status updated"}{ev.location?` · ${ev.location}`:""}</div><div className="ot-event-meta">{fmtDate(ev.date||ev.timestamp||ev.created_at)}</div></div></div>)}</div>:<div className="ot-location-note">No location scans have been added for this order yet. The latest location will appear here when the seller or delivery partner provides a tracking update.</div>}
            {o.is_demo&&<div className="ot-location-note">Demo location data is illustrative only and does not represent a live courier or GPS location.</div>}
          </div>}
        </section>;
      })}</div>}
  </div>;
}
