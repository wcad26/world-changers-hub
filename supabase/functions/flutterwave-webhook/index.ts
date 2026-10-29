import { createClient } from "npm:@supabase/supabase-js@2";
import {
  FLW_API,
  constantTimeEquals,
  lookupPendingTransaction,
  resolveTenantGateway,
  finalizeSuccessfulPayment,
  finalizeFailedPayment,
} from "../_shared/paymentEngine.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, verif-hash, flutterwave-signature",
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
  if (req.method !== "POST") return json({ error: "Method not allowed" }, 405);

  const admin = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
  );

  try {
    const rawPayload = (await req.json().catch(() => null)) as any;
    if (!rawPayload) return json({ error: "Invalid JSON payload" }, 400);

    // Flutterwave v3 supports both { event, data: { id, tx_ref, status, ... } } and legacy flat payloads
    const eventType = String(rawPayload?.event || rawPayload?.["event.type"] || "charge.completed");
    const txData = rawPayload?.data || rawPayload;
    const txRef = String(txData?.tx_ref || txData?.txRef || "").trim();
    const flwTxId = txData?.id != null ? String(txData.id) : null;

    if (!txRef) {
      return json({ ok: true, ignored: "missing_tx_ref" }, 200);
    }

    // 1. Idempotency check: skip if this exact Flutterwave transaction ID was already processed
    if (flwTxId) {
      const { data: existingEvent } = await admin
        .from("payment_webhook_events")
        .select("id, processed_at")
        .eq("provider", "flutterwave")
        .eq("flw_tx_id", flwTxId)
        .maybeSingle();
      if (existingEvent?.processed_at) {
        return json({ ok: true, duplicate: true }, 200);
      }
    }

    // 2. Lookup pending transaction by tx_ref across WCA & WCBN tables to identify the exact tenant
    const lookup = await lookupPendingTransaction(admin, txRef);
    if (!lookup) {
      await admin.from("payment_webhook_events").insert({
        provider: "flutterwave",
        flw_tx_id: flwTxId,
        tx_ref: txRef,
        event_type: eventType,
        signature_valid: false,
        verified_status: "unknown_tx_ref",
        raw_payload: rawPayload,
      });
      return json({ ok: true, ignored: "unknown_tx_ref" }, 200);
    }

    // 3. Load that specific tenant's webhook_secret_hash & flutterwave_secret_key
    const gw = await resolveTenantGateway(admin, {
      tenantType: lookup.tenantType,
      regionId: lookup.regionId,
      dcgId: lookup.dcgId,
      tenantCode: lookup.tenantCode,
    });

    const incomingHash = req.headers.get("verif-hash");
    const hashValid = constantTimeEquals(incomingHash, gw.webhookSecretHash);

    if (!hashValid) {
      await admin.from("payment_webhook_events").insert({
        provider: "flutterwave",
        flw_tx_id: flwTxId,
        tx_ref: txRef,
        tenant_setting_id: gw.settingId,
        event_type: eventType,
        signature_valid: false,
        verified_status: "invalid_verif_hash",
        raw_payload: rawPayload,
      });
      return json({ error: "Invalid webhook signature" }, 401);
    }

    if (!gw.secretKey) {
      return json({ error: "Tenant gateway inactive" }, 400);
    }

    // 4. Defense-in-Depth: Re-verify directly with Flutterwave API using THIS tenant's secret key
    const verifyUrl = flwTxId
      ? `${FLW_API}/transactions/${encodeURIComponent(flwTxId)}/verify`
      : `${FLW_API}/transactions/verify_by_reference?tx_ref=${encodeURIComponent(txRef)}`;

    const verifyRes = await fetch(verifyUrl, {
      headers: { Authorization: `Bearer ${gw.secretKey}` },
    });
    const verifyBody = (await verifyRes.json().catch(() => ({}))) as any;
    const verifiedTx = verifyBody?.data;

    if (!verifiedTx || String(verifiedTx.tx_ref || "") !== txRef) {
      return json({ error: "Could not verify transaction with gateway" }, 400);
    }

    const flwStatus = String(verifiedTx.status || "").toLowerCase();
    const verifiedAmount = Number(verifiedTx.amount || 0);
    const verifiedCurrency = String(verifiedTx.currency || "").toUpperCase();

    // 5. Execute single atomic status transition
    if (
      flwStatus === "successful" &&
      verifiedAmount >= lookup.expectedMajorAmount &&
      verifiedCurrency === lookup.expectedCurrency
    ) {
      const resolvedMethod =
        verifiedTx.payment_type === "card"
          ? "card"
          : String(verifiedTx.payment_type || "").includes("mobile")
            ? "mobile_money"
            : lookup.paymentMethod || "card";

      await finalizeSuccessfulPayment(admin, lookup, {
        gatewayTxId: verifiedTx.id ?? flwTxId,
        resolvedMethod,
      });
    } else if (flwStatus === "failed" || flwStatus === "cancelled") {
      await finalizeFailedPayment(admin, lookup);
    }

    // 6. Record idempotent audit log entry
    await admin.from("payment_webhook_events").upsert(
      {
        provider: "flutterwave",
        flw_tx_id: flwTxId ?? (verifiedTx.id != null ? String(verifiedTx.id) : null),
        tx_ref: txRef,
        tenant_setting_id: gw.settingId,
        event_type: eventType,
        signature_valid: true,
        verified_status: flwStatus,
        raw_payload: rawPayload,
        processed_at: new Date().toISOString(),
      },
      { onConflict: "provider,flw_tx_id" },
    );

    return json({ ok: true, status: flwStatus }, 200);
  } catch (e: any) {
    console.error("flutterwave-webhook error:", e);
    return json({ error: "Webhook processing error" }, 500);
  }
});
