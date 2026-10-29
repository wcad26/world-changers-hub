import { createClient } from "npm:@supabase/supabase-js@2";
import {
  FLW_API,
  lookupPendingTransaction,
  resolveTenantGateway,
  finalizeSuccessfulPayment,
  finalizeFailedPayment,
} from "../_shared/paymentEngine.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

function json(payload: unknown, status = 200) {
  return new Response(JSON.stringify(payload), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  try {
    const body = await req.json().catch(() => ({}));
    const txRef = String(body?.txRef || "").trim();
    if (!txRef) return json({ error: "Missing txRef" }, 400);

    const admin = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    );

    const lookup = await lookupPendingTransaction(admin, txRef);
    if (!lookup) return json({ error: "Transaction not found." }, 404);

    if (lookup.currentStatus === "completed" || lookup.currentStatus === "paid") {
      return json({ status: "successful" });
    }
    if (lookup.paymentMethod === "bank_transfer") {
      return json({ status: "pending" });
    }

    const gw = await resolveTenantGateway(admin, {
      tenantType: lookup.tenantType,
      regionId: lookup.regionId,
      dcgId: lookup.dcgId,
      tenantCode: lookup.tenantCode,
    });
    if (!gw.secretKey) {
      return json({ status: "pending" });
    }

    const res = await fetch(
      `${FLW_API}/transactions/verify_by_reference?tx_ref=${encodeURIComponent(txRef)}`,
      { headers: { Authorization: `Bearer ${gw.secretKey}` } },
    );
    const flwBody = (await res.json().catch(() => ({}))) as any;
    const tx = flwBody?.data;
    if (!tx) return json({ status: "pending" });

    if (
      tx.status === "successful" &&
      Number(tx.amount) >= lookup.expectedMajorAmount &&
      String(tx.currency || "").toUpperCase() === lookup.expectedCurrency
    ) {
      const resolvedMethod =
        tx.payment_type === "card"
          ? "card"
          : String(tx.payment_type || "").includes("mobile")
            ? "mobile_money"
            : lookup.paymentMethod || "card";
      await finalizeSuccessfulPayment(admin, lookup, {
        gatewayTxId: tx.id,
        resolvedMethod,
      });
      return json({ status: "successful" });
    }

    if (tx.status === "failed" || tx.status === "cancelled") {
      await finalizeFailedPayment(admin, lookup);
      return json({ status: "failed" });
    }

    return json({ status: "pending" });
  } catch (e: any) {
    console.error("payment-verify error:", e);
    return json({ error: String(e?.message || "Verification failed") }, 500);
  }
});
