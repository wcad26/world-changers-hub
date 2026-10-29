import { createClient } from "npm:@supabase/supabase-js@2";
import {
  FLW_API,
  resolveTenantGateway,
  generateTxRef,
  normalizeMajorAmount,
  majorToMinorUnits,
  minorToMajorUnits,
  executeFlwCardCharge,
  executeFlwMomoCharge,
  executeFlwWalletCheckout,
  executeStripeCheckoutSession,
  lookupPendingTransaction,
  finalizeFailedPayment,
  supportsMobileMoneyCurrency,
  type CardPayload,
  type CardAuthPayload,
  type PaymentMethod,
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

const CATEGORY_MAP: Record<string, string> = {
  tithe: "Tithes",
  offering: "Offerings",
  special: "Special Giving",
};

async function resolveIncomeCategoryId(admin: any, kind: "tithe" | "offering" | "special"): Promise<string> {
  const target = CATEGORY_MAP[kind] || "Special Giving";
  const { data: exact } = await admin
    .from("financial_transaction_categories")
    .select("id")
    .eq("name", target)
    .eq("is_active", true)
    .maybeSingle();
  if (exact?.id) return exact.id;

  const { data: fallback } = await admin
    .from("financial_transaction_categories")
    .select("id")
    .eq("type", "income")
    .eq("is_active", true)
    .limit(1)
    .maybeSingle();
  if (!fallback?.id) throw new Error("Income transaction category is not configured.");
  return fallback.id;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  try {
    const body = await req.json().catch(() => ({}));
    const action = String(body?.action || "start");

    const admin = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    );

    // -------------------------------------------------------------------------
    // ACTION 1: Safe Public Capabilities Discovery (All Regions / Single Tenant)
    // -------------------------------------------------------------------------
    if (action === "capabilities") {
      if (body?.tenant_type === "wcbn_chapter") {
        const gw = await resolveTenantGateway(admin, {
          tenantType: "wcbn_chapter",
          tenantCode: body?.tenant_code || "WCBN-GEN",
        });
        return json({
          tenant: {
            tenantType: gw.tenantType,
            regionId: null,
            tenantCode: gw.tenantCode,
            name: gw.tenantName,
            currency: gw.currency,
            environment: gw.mode,
            onlineReady: gw.onlineReady,
            mobileMoney: gw.mobileMoneyEnabled,
            card: gw.cardEnabled,
            walletPay: gw.walletPayEnabled,
            bank: gw.bank,
          },
        });
      }

      if (body?.single_scope !== undefined) {
        const gw = await resolveTenantGateway(admin, {
          tenantType: body?.region_id ? "wca_region" : "head_office",
          regionId: body?.region_id || null,
          dcgId: body?.dcg_id || null,
        });
        return json({
          tenant: {
            tenantType: gw.tenantType,
            regionId: gw.regionId,
            tenantCode: gw.tenantCode,
            name: gw.tenantName,
            currency: gw.currency,
            environment: gw.mode,
            onlineReady: gw.onlineReady,
            usingCentralFallback: gw.usingCentralFallback,
            mobileMoney: gw.mobileMoneyEnabled,
            card: gw.cardEnabled,
            walletPay: gw.walletPayEnabled,
            bank: gw.bank,
          },
        });
      }

      // Return Head Office + all active WCA regions with strict capability flags
      const { data: regions } = await admin
        .from("regions")
        .select("id, name, code, currency_code")
        .eq("is_active", true)
        .order("name");

      const [hoGw, ...regGws] = await Promise.all([
        resolveTenantGateway(admin, { tenantType: "head_office" }),
        ...(regions || []).map((r: any) =>
          resolveTenantGateway(admin, { tenantType: "wca_region", regionId: r.id })
        ),
      ]);

      return json({
        headOffice: {
          id: "global",
          regionId: null,
          code: hoGw.tenantCode,
          name: hoGw.tenantName,
          currency: hoGw.currency,
          onlineReady: hoGw.onlineReady,
          mobileMoney: hoGw.mobileMoneyEnabled,
          card: hoGw.cardEnabled,
          walletPay: hoGw.walletPayEnabled,
          bank: hoGw.bank,
        },
        regions: regGws.map((gw) => ({
          id: gw.regionId,
          regionId: gw.regionId,
          code: gw.tenantCode,
          name: gw.tenantName,
          currency: gw.currency,
          onlineReady: gw.onlineReady,
          usingCentralFallback: gw.usingCentralFallback,
          mobileMoney: gw.mobileMoneyEnabled,
          card: gw.cardEnabled,
          walletPay: gw.walletPayEnabled,
          bank: gw.bank,
        })),
      });
    }

    // -------------------------------------------------------------------------
    // ACTION 2: Continue Direct 3DES Card Charge (PIN or AVS Billing Address)
    // -------------------------------------------------------------------------
    if (action === "continue_card") {
      const txRef = String(body?.txRef || "").trim();
      const card = body?.card as CardPayload | undefined;
      const cardAuth = body?.cardAuth as CardAuthPayload | undefined;
      const origin = String(body?.origin || "https://wcaglobal.org");
      const redirectPath = String(body?.redirectPath || "/");

      if (!txRef || !card) return json({ error: "Missing card continuation parameters." }, 400);

      const lookup = await lookupPendingTransaction(admin, txRef);
      if (!lookup || lookup.currentStatus !== "pending") {
        return json({ error: "Pending transaction not found." }, 404);
      }

      const gw = await resolveTenantGateway(admin, {
        tenantType: lookup.tenantType,
        regionId: lookup.regionId,
        dcgId: lookup.dcgId,
        tenantCode: lookup.tenantCode,
      });
      if (!gw.secretKey || !gw.encryptionKey) {
        return json({ error: "Card gateway is not available for this region." }, 400);
      }

      const step = await executeFlwCardCharge({
        secret: gw.secretKey,
        encryptionKey: gw.encryptionKey,
        card,
        txRef,
        amount: lookup.expectedMajorAmount,
        currency: lookup.expectedCurrency,
        email: String(body?.email || "giving@wcaglobal.org"),
        name: String(body?.name || "WCA Supporter"),
        redirectUrl: `${origin.replace(/\/$/, "")}${redirectPath}`,
        auth: cardAuth,
      });

      if (step.next === "failed") {
        await finalizeFailedPayment(admin, lookup);
      }
      return json({ txRef, card: step });
    }

    // -------------------------------------------------------------------------
    // ACTION 3: Validate Card Issuer OTP
    // -------------------------------------------------------------------------
    if (action === "validate_otp") {
      const txRef = String(body?.txRef || "").trim();
      const flwRef = String(body?.flwRef || "").trim();
      const otp = String(body?.otp || "").trim();
      if (!txRef || !flwRef || !otp) {
        return json({ error: "Missing OTP verification details." }, 400);
      }

      const lookup = await lookupPendingTransaction(admin, txRef);
      if (!lookup) return json({ error: "Transaction not found." }, 404);

      const gw = await resolveTenantGateway(admin, {
        tenantType: lookup.tenantType,
        regionId: lookup.regionId,
        dcgId: lookup.dcgId,
        tenantCode: lookup.tenantCode,
      });
      if (!gw.secretKey) return json({ error: "Gateway unavailable." }, 400);

      const res = await fetch(`${FLW_API}/validate-charge`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${gw.secretKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ otp, flw_ref: flwRef, type: "card" }),
      });
      const flwBody = (await res.json().catch(() => ({}))) as any;
      if (flwBody.status !== "success") {
        return json({ error: flwBody.message || "The verification code was not accepted." }, 400);
      }
      return json({ ok: true });
    }

    // -------------------------------------------------------------------------
    // ACTION 4: Start Multi-Tenant Payment Across Any Scenario
    // context: 'event_fee' | 'campaign_donation' | 'public_giving' | 'wcbn_payment'
    // -------------------------------------------------------------------------
    const paymentContext = String(body?.context || "public_giving");
    const method = String(body?.method || "mobile_money") as PaymentMethod;
    const origin = String(body?.origin || "https://wcaglobal.org").replace(/\/$/, "");
    const redirectPath = String(body?.redirectPath || "/");

    if (!["mobile_money", "card", "wallet_pay", "bank_transfer"].includes(method)) {
      return json({ error: "Unsupported payment method." }, 400);
    }

    // ---- 4A. WCBN Connect Shared Tenant Execution (Zero WCA Collision) ----
    if (paymentContext === "wcbn_payment") {
      const tenantCode = String(body?.tenant_code || "WCBN-GEN").toUpperCase();
      const invoiceId = body?.invoice_id ? String(body.invoice_id) : null;
      const gw = await resolveTenantGateway(admin, {
        tenantType: "wcbn_chapter",
        tenantCode,
      });
      const currency = (body?.currency_code || gw.currency || "XAF").toUpperCase();
      const majorAmount = normalizeMajorAmount(Number(body?.amount || 0), currency);
      if (majorAmount <= 0) return json({ error: "Please enter a valid payment amount." }, 400);

      if (method === "bank_transfer") {
        if (!gw.bank) return json({ error: "Bank deposit is not configured for WCBN yet." }, 400);
      } else {
        if (!gw.onlineReady || !gw.secretKey) {
          return json({
            error: "Online payments are not yet activated for this WCBN account. Please pay via Bank Deposit.",
          }, 400);
        }
        if (method === "mobile_money" && !gw.mobileMoneyEnabled) {
          return json({ error: "Mobile Money is not enabled for this WCBN account." }, 400);
        }
        if (method === "card" && (!gw.cardEnabled || !gw.encryptionKey)) {
          return json({ error: "Card payments are not enabled for this WCBN account." }, 400);
        }
      }

      const chapterShort = tenantCode.replace(/^WCBN-?/i, "") || "GEN";
      const txRef = generateTxRef({
        app: "WCBN",
        tenantCode: chapterShort,
        context: invoiceId ? "INV" : "MEM",
      });

      if (invoiceId) {
        const { error: wErr } = await admin.from("wcbn_payments").insert({
          invoice_id: invoiceId,
          amount: majorAmount,
          currency_code: currency,
          method,
          provider: method === "bank_transfer" ? "bank_transfer" : "flutterwave",
          reference: txRef,
          status: "pending",
        });
        if (wErr) return json({ error: "Could not initialize WCBN payment record." }, 500);
      }

      if (method === "bank_transfer") {
        return json({ txRef, bank: gw.bank, tenantName: gw.tenantName, currency, amount: majorAmount });
      }

      const payerEmail = String(body?.email || "payments@wcbnconnect.org");
      const payerName = String(body?.name || "WCBN Member");

      if (method === "mobile_money") {
        try {
          const momo = await executeFlwMomoCharge({
            secret: gw.secretKey!,
            txRef,
            amount: majorAmount,
            currency,
            phoneRaw: String(body?.phone || ""),
            email: payerEmail,
            name: payerName,
          });
          return json({ txRef, link: momo.link, network: momo.network, tenantName: gw.tenantName });
        } catch (err: any) {
          await admin.from("wcbn_payments").update({ status: "failed" }).eq("reference", txRef);
          return json({ error: err.message }, 400);
        }
      }

      if (method === "wallet_pay") {
        const wallet = await executeFlwWalletCheckout({
          secret: gw.secretKey!,
          txRef,
          amount: majorAmount,
          currency,
          email: payerEmail,
          name: payerName,
          title: gw.tenantName,
          redirectUrl: `${origin}${redirectPath}`,
        });
        return json({ txRef, link: wallet.link, tenantName: gw.tenantName });
      }

      const step = await executeFlwCardCharge({
        secret: gw.secretKey!,
        encryptionKey: gw.encryptionKey!,
        card: body.card as CardPayload,
        txRef,
        amount: majorAmount,
        currency,
        email: payerEmail,
        name: payerName,
        redirectUrl: `${origin}${redirectPath}`,
        auth: body.cardAuth,
      });
      if (step.next === "failed") {
        await admin.from("wcbn_payments").update({ status: "failed" }).eq("reference", txRef);
      }
      return json({ txRef, link: step.link ?? null, card: step, tenantName: gw.tenantName });
    }

    // ---- 4B. WCA Event Registration Fees (Regional / DCG / Global Head Office) ----
    if (paymentContext === "event_fee") {
      const eventId = String(body?.event_id || "");
      const preRegIds: string[] = Array.isArray(body?.pre_registration_ids) ? body.pre_registration_ids : [];
      const groupId: string | null = body?.group_id || null;

      if (!eventId || (!preRegIds.length && !groupId)) {
        return json({ error: "Missing event registration reference." }, 400);
      }

      const { data: ev } = await admin
        .from("events")
        .select("id, name, region_id, dcg_id")
        .eq("id", eventId)
        .maybeSingle();
      if (!ev) return json({ error: "Event not found." }, 404);

      let regQuery = admin
        .from("event_pre_registrations")
        .select("id, member_id, is_primary, email, phone, fee_status, fee_is_group, registration_fee_amount")
        .eq("event_id", eventId);
      regQuery = groupId ? regQuery.eq("group_id", groupId) : regQuery.in("id", preRegIds);
      const { data: regRows } = await regQuery;

      if (!regRows?.length) return json({ error: "Registration records not found." }, 404);

      const unpaidRows = regRows.filter((r: any) => r.fee_status !== "paid" && r.fee_status !== "waived");
      if (!unpaidRows.length) {
        return json({ alreadyPaid: true, status: "paid" });
      }

      // Compute authoritative minor-unit fee total directly from DB rows
      const totalMinor = unpaidRows.reduce((sum: number, r: any) => {
        if (r.fee_is_group && !r.is_primary) return sum;
        return sum + (Number(r.registration_fee_amount) || 0);
      }, 0);

      // Load fee currency from event_registration_fees or host tenant
      const { data: feeCfg } = await admin
        .from("event_registration_fees")
        .select("currency_code")
        .eq("event_id", eventId)
        .limit(1)
        .maybeSingle();

      // Strict Tenant Resolution: Event's region_id (or DCG's parent region_id, or Head Office if NULL)
      const gw = await resolveTenantGateway(admin, {
        regionId: ev.region_id,
        dcgId: ev.dcg_id,
      });

      const currency = (feeCfg?.currency_code || gw.currency || "XAF").toUpperCase();
      const majorAmount = minorToMajorUnits(totalMinor, currency);
      if (majorAmount <= 0) return json({ alreadyPaid: true, status: "paid" });

      if (method === "bank_transfer") {
        if (!gw.bank) {
          return json({
            error: `Bank deposit details are not yet configured for ${gw.tenantName}. Please contact the event organizers.`,
          }, 400);
        }
      } else {
        if (!gw.onlineReady || (!gw.secretKey && !gw.stripeSecretKey)) {
          return json({
            error: `Online payments are not yet activated for ${gw.tenantName}. Please pay via Bank Deposit or contact the regional finance team.`,
          }, 400);
        }
        if (method === "mobile_money" && !gw.mobileMoneyEnabled) {
          return json({ error: `Mobile Money is not enabled for ${gw.tenantName}.` }, 400);
        }
        if (method === "card" && (!gw.cardEnabled || (gw.primaryProvider === "flutterwave" && !gw.encryptionKey))) {
          return json({ error: `Card payments are not enabled for ${gw.tenantName}.` }, 400);
        }
        if (method === "wallet_pay" && !gw.walletPayEnabled) {
          return json({ error: `Apple Pay / Google Pay is not enabled for ${gw.tenantName}.` }, 400);
        }
      }

      const primaryRow = regRows.find((r: any) => r.is_primary) || regRows[0];
      const categoryId = await resolveIncomeCategoryId(admin, "special");
      const txRef = generateTxRef({
        app: "WCA",
        tenantCode: gw.tenantCode,
        context: ev.dcg_id ? "DCG" : "EVT",
      });

      const payerName = String(body?.name || "Event Registrant").trim();
      const payerEmail = String(body?.email || primaryRow?.email || "events@wcaglobal.org").trim();
      const payerPhone = String(body?.phone || primaryRow?.phone || "").trim();

      const { data: finRow, error: finErr } = await admin
        .from("financial_transactions")
        .insert({
          category_id: categoryId,
          amount: majorAmount,
          currency_code: currency,
          region_id: gw.regionId,
          dcg_id: ev.dcg_id ?? null,
          member_id: primaryRow?.member_id ?? null,
          scope: gw.regionId ? "regional" : "global",
          transaction_date: new Date().toISOString().slice(0, 10),
          description: `event_fee:${ev.id}:${ev.name}`,
          payment_method: method,
          payment_reference: txRef,
          payment_status: "pending",
          donor_name: payerName,
          donor_email: payerEmail,
          donor_phone: payerPhone || null,
        })
        .select("id")
        .single();

      if (finErr || !finRow) {
        return json({ error: "Could not initialize event fee transaction." }, 500);
      }

      // Stamp fee_payment_reference on all unpaid rows in this registration
      const targetIds = unpaidRows.map((r: any) => r.id);
      await admin
        .from("event_pre_registrations")
        .update({
          fee_payment_reference: txRef,
          fee_payment_method: method,
          financial_transaction_id: finRow.id,
          fee_status: method === "bank_transfer" ? "pending" : "pending",
        })
        .in("id", targetIds);

      if (method === "bank_transfer") {
        return json({
          txRef,
          bank: gw.bank,
          regionName: gw.tenantName,
          currency,
          amount: majorAmount,
        });
      }

      if (method === "mobile_money") {
        try {
          const momo = await executeFlwMomoCharge({
            secret: gw.secretKey!,
            txRef,
            amount: majorAmount,
            currency,
            phoneRaw: payerPhone,
            email: payerEmail,
            name: payerName,
          });
          return json({ txRef, link: momo.link, network: momo.network, regionName: gw.tenantName });
        } catch (err: any) {
          await admin.from("financial_transactions").update({ payment_status: "failed" }).eq("id", finRow.id);
          await admin.from("event_pre_registrations").update({ fee_status: "unpaid" }).in("id", targetIds);
          return json({ error: err.message }, 400);
        }
      }

      if (gw.primaryProvider === "stripe" && gw.stripeSecretKey) {
        const stripeSession = await executeStripeCheckoutSession({
          stripeSecretKey: gw.stripeSecretKey,
          txRef,
          amount: majorAmount,
          currency,
          email: payerEmail,
          name: payerName,
          title: `${ev.name} · Registration Fee`,
          redirectUrl: `${origin}${redirectPath}`,
        });
        await admin.from("financial_transactions").update({ gateway_transaction_id: stripeSession.sessionId }).eq("id", finRow.id);
        return json({ txRef, link: stripeSession.link, regionName: gw.tenantName });
      }

      if (method === "wallet_pay") {
        const wallet = await executeFlwWalletCheckout({
          secret: gw.secretKey!,
          txRef,
          amount: majorAmount,
          currency,
          email: payerEmail,
          name: payerName,
          title: `${ev.name} · Registration Fee`,
          redirectUrl: `${origin}${redirectPath}`,
        });
        return json({ txRef, link: wallet.link, regionName: gw.tenantName });
      }

      if (!body?.card) return json({ error: "Please enter your card details." }, 400);
      const step = await executeFlwCardCharge({
        secret: gw.secretKey!,
        encryptionKey: gw.encryptionKey!,
        card: body.card as CardPayload,
        txRef,
        amount: majorAmount,
        currency,
        email: payerEmail,
        name: payerName,
        redirectUrl: `${origin}${redirectPath}`,
        auth: body.cardAuth,
      });
      if (step.next === "failed") {
        await admin.from("financial_transactions").update({ payment_status: "failed" }).eq("id", finRow.id);
        await admin.from("event_pre_registrations").update({ fee_status: "unpaid" }).in("id", targetIds);
      }
      return json({ txRef, link: step.link ?? null, card: step, regionName: gw.tenantName });
    }

    // ---- 4C. Public Fundraising Campaign Donations & Public Visitor Giving ----
    let targetRegionId: string | null = body?.region_id || null;
    const targetDcgId: string | null = body?.dcg_id || null;
    let campaignRow: { id: string; name: string; region_id: string | null; currency_code: string | null } | null = null;

    if (paymentContext === "campaign_donation" || body?.campaign_id) {
      const campaignId = String(body?.campaign_id || "");
      const { data: camp } = await admin
        .from("fundraising_campaigns")
        .select("id, name, region_id, status, currency_code")
        .eq("id", campaignId)
        .maybeSingle();
      if (!camp || String(camp.status || "").toLowerCase() !== "active") {
        return json({ error: "This fundraising campaign is not currently accepting donations." }, 400);
      }
      campaignRow = camp;
      // Strict Rule: Global campaigns (region_id IS NULL) route strictly to Head Office (targetRegionId = null)
      targetRegionId = camp.region_id ?? null;
    }

    const gw = await resolveTenantGateway(admin, {
      tenantType: targetRegionId || targetDcgId ? "wca_region" : "head_office",
      regionId: targetRegionId,
      dcgId: targetDcgId,
    });

    const currency = (campaignRow?.currency_code || gw.currency || "XAF").toUpperCase();
    const majorAmount = normalizeMajorAmount(Number(body?.amount || 0), currency);
    if (majorAmount <= 0) {
      return json({ error: "Please enter a valid gift amount." }, 400);
    }

    if (method === "bank_transfer") {
      if (!gw.bank) {
        return json({
          error: `Bank deposit details are not yet configured for ${gw.tenantName}.`,
        }, 400);
      }
    } else {
      if (!gw.onlineReady || !gw.secretKey) {
        return json({
          error: `Online payments are not yet activated for ${gw.tenantName}. Please pay via Bank Deposit or contact the regional finance team.`,
        }, 400);
      }
      if (method === "mobile_money" && (!gw.mobileMoneyEnabled || !supportsMobileMoneyCurrency(currency))) {
        return json({ error: `Mobile Money is not available for ${gw.tenantName} (${currency}).` }, 400);
      }
      if (method === "card" && (!gw.cardEnabled || (gw.primaryProvider === "flutterwave" && !gw.encryptionKey))) {
        return json({ error: `Card payments are not enabled for ${gw.tenantName}.` }, 400);
      }
      if (method === "wallet_pay" && !gw.walletPayEnabled) {
        return json({ error: `Apple Pay / Google Pay is not enabled for ${gw.tenantName}.` }, 400);
      }
    }

    const kindRaw = String(body?.kind || "offering");
    const kind: "tithe" | "offering" | "special" = campaignRow
      ? "special"
      : kindRaw === "tithe" || kindRaw === "special"
        ? kindRaw
        : "offering";

    const categoryId = await resolveIncomeCategoryId(admin, kind);
    const anonymous = !!body?.anonymous;
    const donorName = anonymous
      ? "Anonymous"
      : String(body?.name || [body?.family_name, body?.other_names].filter(Boolean).join(" ") || "Public Supporter").trim();
    const donorEmail = String(body?.email || "giving@wcaglobal.org").trim();
    const donorPhone = String(body?.phone || "").trim();

    // Try matching member or donor record by phone/email when not anonymous
    let matchedMemberId: string | null = body?.member_id || null;
    let matchedDonorId: string | null = null;
    if (!anonymous && !matchedMemberId && donorPhone) {
      const digits = donorPhone.replace(/\D/g, "").slice(-9);
      if (digits.length >= 8) {
        const { data: prof } = await admin
          .from("profiles")
          .select("id")
          .ilike("phone", `%${digits}%`)
          .limit(1)
          .maybeSingle();
        if (prof?.id) {
          const { data: mem } = await admin
            .from("members")
            .select("id")
            .eq("profile_id", prof.id)
            .limit(1)
            .maybeSingle();
          if (mem?.id) matchedMemberId = mem.id;
        }
        if (!matchedMemberId && campaignRow) {
          const { data: existingDonor } = await admin
            .from("donors")
            .select("id")
            .ilike("phone", `%${digits}%`)
            .limit(1)
            .maybeSingle();
          if (existingDonor?.id) {
            matchedDonorId = existingDonor.id;
          } else if ((body?.family_name || donorName) && gw.regionId) {
            const { data: createdDonor } = await admin
              .from("donors")
              .insert({
                phone: donorPhone,
                first_name: body?.other_names || donorName,
                last_name: body?.family_name || donorName,
                email: body?.email || null,
                region_id: gw.regionId,
              })
              .select("id")
              .maybeSingle();
            matchedDonorId = createdDonor?.id ?? null;
          }
        }
      }
    }

    const txRef = generateTxRef({
      app: "WCA",
      tenantCode: gw.tenantCode,
      context: campaignRow ? "CMP" : paymentContext === "store_order" ? "SHP" : targetDcgId ? "DCG" : "GIV",
    });

    const { data: finIns, error: finErr } = await admin
      .from("financial_transactions")
      .insert({
        category_id: categoryId,
        amount: majorAmount,
        currency_code: currency,
        region_id: gw.regionId,
        dcg_id: targetDcgId,
        member_id: matchedMemberId,
        scope: gw.regionId ? "regional" : "global",
        transaction_date: new Date().toISOString().slice(0, 10),
        description: campaignRow
          ? `campaign:${campaignRow.id}`
          : paymentContext === "store_order"
            ? `store:${String(body?.purpose || "Order").slice(0, 150)}`
            : body?.purpose
              ? String(body.purpose).slice(0, 160)
              : `public_${kind}`,
        payment_method: method,
        payment_reference: txRef,
        payment_status: "pending",
        donor_name: donorName,
        donor_email: anonymous ? null : (body?.email || null),
        donor_phone: anonymous ? null : (donorPhone || null),
      })
      .select("id")
      .single();

    if (finErr || !finIns) {
      return json({ error: "Could not initialize payment record." }, 500);
    }

    if (campaignRow) {
      await admin.from("fundraising_donations").insert({
        campaign_id: campaignRow.id,
        member_id: matchedMemberId,
        donor_id: matchedDonorId,
        donor_name: donorName,
        donor_email: anonymous ? null : (body?.email || null),
        is_anonymous: anonymous,
        amount: majorToMinorUnits(majorAmount),
        currency_code: currency,
        status: "pending",
        message: txRef,
        donation_date: new Date().toISOString().slice(0, 10),
      });
    }

    if (method === "bank_transfer") {
      return json({
        txRef,
        bank: gw.bank,
        regionName: gw.tenantName,
        currency,
        amount: majorAmount,
      });
    }

    if (method === "mobile_money") {
      try {
        const momo = await executeFlwMomoCharge({
          secret: gw.secretKey!,
          txRef,
          amount: majorAmount,
          currency,
          phoneRaw: donorPhone,
          email: donorEmail,
          name: donorName,
        });
        return json({ txRef, link: momo.link, network: momo.network, regionName: gw.tenantName });
      } catch (err: any) {
        await admin.from("financial_transactions").update({ payment_status: "failed" }).eq("id", finIns.id);
        if (campaignRow) {
          await admin.from("fundraising_donations").update({ status: "failed" }).eq("message", txRef);
        }
        return json({ error: err.message }, 400);
      }
    }

    if (gw.primaryProvider === "stripe" && gw.stripeSecretKey) {
      const stripeSession = await executeStripeCheckoutSession({
        stripeSecretKey: gw.stripeSecretKey,
        txRef,
        amount: majorAmount,
        currency,
        email: donorEmail,
        name: donorName,
        title: campaignRow ? campaignRow.name : `${gw.tenantName} Giving`,
        redirectUrl: `${origin}${redirectPath}`,
      });
      await admin.from("financial_transactions").update({ gateway_transaction_id: stripeSession.sessionId }).eq("id", finIns.id);
      return json({ txRef, link: stripeSession.link, regionName: gw.tenantName });
    }

    if (method === "wallet_pay") {
      const wallet = await executeFlwWalletCheckout({
        secret: gw.secretKey!,
        txRef,
        amount: majorAmount,
        currency,
        email: donorEmail,
        name: donorName,
        title: campaignRow ? campaignRow.name : `${gw.tenantName} Giving`,
        redirectUrl: `${origin}${redirectPath}`,
      });
      return json({ txRef, link: wallet.link, regionName: gw.tenantName });
    }

    if (!body?.card) return json({ error: "Please enter your card details." }, 400);
    const step = await executeFlwCardCharge({
      secret: gw.secretKey!,
      encryptionKey: gw.encryptionKey!,
      card: body.card as CardPayload,
      txRef,
      amount: majorAmount,
      currency,
      email: donorEmail,
      name: donorName,
      redirectUrl: `${origin}${redirectPath}`,
      auth: body.cardAuth,
    });
    if (step.next === "failed") {
      await admin.from("financial_transactions").update({ payment_status: "failed" }).eq("id", finIns.id);
      if (campaignRow) {
        await admin.from("fundraising_donations").update({ status: "failed" }).eq("message", txRef);
      }
    }
    return json({ txRef, link: step.link ?? null, card: step, regionName: gw.tenantName });
  } catch (e: any) {
    console.error("payment-checkout error:", e);
    return json({ error: String(e?.message || "Payment request failed.") }, 500);
  }
});
