import React, { useState } from "react";

const API = (import.meta.env.VITE_API_BASE_URL || "http://localhost:8000").replace(/\/$/, "");
let loadingRazorpayScript;

function getAccessKey(order) {
  if (order?.tracking_access_key) return order.tracking_access_key;
  try {
    const stored = JSON.parse(localStorage.getItem("potterMarketplaceTrackingKeys") || "{}");
    return stored[String(order?.id)] || "";
  } catch {
    return "";
  }
}

function loadCheckout() {
  if (window.Razorpay) return Promise.resolve();
  if (!loadingRazorpayScript) {
    loadingRazorpayScript = new Promise((resolve, reject) => {
      const script = document.createElement("script");
      script.src = "https://checkout.razorpay.com/v1/checkout.js";
      script.async = true;
      script.onload = () => window.Razorpay ? resolve() : reject(new Error("Razorpay Checkout could not load."));
      script.onerror = () => reject(new Error("Could not load Razorpay Checkout. Check your connection."));
      document.body.appendChild(script);
    }).catch((error) => { loadingRazorpayScript = undefined; throw error; });
  }
  return loadingRazorpayScript;
}

async function post(path, payload) {
  const token = sessionStorage.getItem("potterCommunityAccessToken") || localStorage.getItem("token");
  const response = await fetch(`${API}${path}`, {
    method: "POST",
    headers: { "Content-Type": "application/json", ...(token ? { Authorization: `Bearer ${token}` } : {}) },
    body: JSON.stringify(payload),
  });
  const data = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(typeof data.detail === "string" ? data.detail : "Payment request failed. Please try again.");
  return data;
}

/** Optional online payment action; the original seller-arranged-payment flow stays intact. */
export default function MarketplacePayButton({ order, onPaid, className = "btn btn-primary", style = {} }) {
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState(false);
  if (!order?.id) return null;
  const state = String(order.payment_status || "UNPAID").toUpperCase();
  if (state !== "UNPAID" && state !== "PAYMENT_FAILED") {
    return <span style={{ fontSize: 12, color: "#755847" }}>Payment: <strong>{state.replaceAll("_", " ")}</strong></span>;
  }
  if (["CANCELLED", "DELIVERED"].includes(String(order.status).toUpperCase())) {
    return <span style={{ fontSize: 12, color: "#755847" }}>Online payment is unavailable for this order.</span>;
  }
  const pay = async () => {
    if (busy) return;
    setBusy(true); setError(false); setMessage("Opening secure checkout…");
    try {
      const accessKey = getAccessKey(order);
      const body = { order_id: order.id, ...(accessKey ? { access_key: accessKey } : {}) };
      await loadCheckout();
      const checkoutOrder = await post("/marketplace/payments/create-order", body);
      const checkout = new window.Razorpay({
        key: checkoutOrder.keyId,
        amount: checkoutOrder.amount,
        currency: checkoutOrder.currency,
        name: "Potter Community",
        description: `Marketplace order #${order.id}`,
        order_id: checkoutOrder.razorpayOrderId,
        prefill: { name: order.buyer_name || "", email: order.buyer_email || "", contact: order.buyer_phone || "" },
        notes: { marketplace_order_id: String(order.id) },
        theme: { color: "#a95338" },
        modal: { ondismiss: () => { setBusy(false); setMessage(""); } },
        handler: async (result) => {
          try {
            setMessage("Confirming captured payment with Razorpay…");
            const verified = await post("/marketplace/payments/verify", {
              ...body,
              razorpay_order_id: result.razorpay_order_id,
              razorpay_payment_id: result.razorpay_payment_id,
              razorpay_signature: result.razorpay_signature,
            });
            setError(false);
            setMessage(`Payment confirmed for order #${order.id}.`);
            onPaid?.(verified);
          } catch (verificationError) {
            setError(true);
            setMessage(`${verificationError.message} If money was deducted, don't pay again until the order status refreshes or support confirms it.`);
          } finally {
            setBusy(false);
          }
        },
      });
      checkout.on("payment.failed", (result) => {
        setError(true); setMessage(result?.error?.description || "Payment failed or was cancelled. You can retry safely."); setBusy(false);
      });
      checkout.open();
    } catch (failure) {
      setError(true); setMessage(failure.message || "Unable to start payment."); setBusy(false);
    }
  };
  return <div style={{ display: "grid", gap: 7, ...style }}>
    <button className={className} type="button" disabled={busy} onClick={pay}>
      {busy ? "Preparing secure payment…" : `Pay ₹${Number(order.total_amount).toLocaleString("en-IN", { minimumFractionDigits: 2 })} online`}
    </button>
    {message && <small role={error ? "alert" : "status"} style={{ color: error ? "#a13d2d" : "#346c43", fontSize: 11, lineHeight: 1.5 }}>{message}</small>}
  </div>;
}
