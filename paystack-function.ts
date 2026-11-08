// Supabase Edge Function: "paystack"
// Handles two calls:
//   1) Paystack webhook (has x-paystack-signature header) - the safety net
//   2) The app, right after checkout: POST { "reference": "JP..." }
// In both cases the payment is confirmed with Paystack's own API before any
// access is granted, and the amount must match what the server priced.
//
// Secrets (Supabase > Edge Functions > Secrets):  PAYSTACK_SECRET_KEY
// SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are provided automatically.
// Deploy with "Verify JWT" turned OFF (Paystack cannot send a Supabase login).

import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const SECRET = Deno.env.get("PAYSTACK_SECRET_KEY") ?? "";
const sb = createClient(
  Deno.env.get("SUPABASE_URL")!,
  Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
);
const cors = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "content-type, apikey, authorization, x-client-info",
  "Content-Type": "application/json",
};
const reply = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), { status, headers: cors });

async function sign(raw: string): Promise<string> {
  const key = await crypto.subtle.importKey(
    "raw", new TextEncoder().encode(SECRET),
    { name: "HMAC", hash: "SHA-512" }, false, ["sign"],
  );
  const mac = await crypto.subtle.sign("HMAC", key, new TextEncoder().encode(raw));
  return [...new Uint8Array(mac)].map((b) => b.toString(16).padStart(2, "0")).join("");
}

async function settle(reference: string) {
  const r = await fetch(
    `https://api.paystack.co/transaction/verify/${encodeURIComponent(reference)}`,
    { headers: { Authorization: `Bearer ${SECRET}` } },
  );
  const j = await r.json();
  if (!j?.status || j.data?.status !== "success") {
    console.log("verify failed", reference, JSON.stringify(j));
    return { ok: false, message: "Paystack says: " + (j?.data?.gateway_response || j?.data?.status || j?.message || "payment not completed") };
  }
  const { data: p } = await sb.from("payments")
    .select("amount_kobo").eq("reference", reference).maybeSingle();
  if (!p) { console.log("unknown reference", reference); return { ok: false, message: "This payment reference is not in the database." }; }
  if (Number(p.amount_kobo) !== Number(j.data.amount) || j.data.currency !== "NGN") {
    console.log("amount mismatch", reference, p.amount_kobo, j.data.amount, j.data.currency);
    return { ok: false, message: "The amount paid does not match the amount expected." };
  }
  const { error } = await sb.rpc("apply_payment", { p_reference: reference });
  if (error) { console.log("apply_payment failed", reference, error.message); return { ok: false, message: "Could not activate: " + error.message }; }
  return { ok: true };
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: cors });
  if (!SECRET) return reply({ ok: false, message: "Payments are not configured." }, 500);

  const raw = await req.text();
  const sig = req.headers.get("x-paystack-signature");

  if (sig) { // webhook
    if (sig !== await sign(raw)) return reply({ ok: false }, 401);
    const ev = JSON.parse(raw);
    if (ev.event === "charge.success") await settle(ev.data.reference);
    return reply({ ok: true });
  }

  let reference = "";
  try { reference = JSON.parse(raw || "{}").reference ?? ""; } catch (_) { /* ignore */ }
  if (!/^JP[a-f0-9]{18}$/.test(reference)) {
    return reply({ ok: false, message: "Invalid reference." }, 400);
  }
  return reply(await settle(reference));
});
