import { createServerFn } from '@tanstack/react-start';
import { z } from 'zod';
import { requireSupabaseAuth } from '@/integrations/supabase/auth-middleware';
import { detectMomo } from '@/lib/payment-utils';

export { detectMomo };

const CATEGORY_NAMES = {
  tithe: 'Tithes',
  offering: 'Offerings',
  special: 'Special Giving',
} as const;
const CAMPAIGN_TAG = 'campaign:';

const cardSchema = z.object({
  number: z.string().regex(/^\d{12,19}$/),
  cvv: z.string().regex(/^\d{3,4}$/),
  expiry_month: z.string().regex(/^(0[1-9]|1[0-2])$/),
  expiry_year: z.string().regex(/^\d{2}$/),
});

const cardAuthSchema = z
  .union([
    z.object({ mode: z.literal('pin'), pin: z.string().regex(/^\d{4,6}$/) }),
    z.object({
      mode: z.literal('avs_noauth'),
      city: z.string().max(80),
      address: z.string().max(200),
      state: z.string().max(80),
      country: z.string().max(2),
      zipcode: z.string().max(20),
    }),
  ])
  .optional();

async function myMemberId(supabase: any, userId: string) {
  const { data } = await supabase.rpc('get_member_ids_for_user', { _user_id: userId });
  const ids = (Array.isArray(data) ? data : []) as string[];
  if (!ids[0]) throw new Error('Your member profile is not linked yet.');
  return { memberId: ids[0], ids };
}

async function resolveIncomeCategoryId(
  admin: any,
  kind: 'tithe' | 'offering' | 'special',
): Promise<string> {
  const { data: exact } = await admin
    .from('financial_transaction_categories')
    .select('id')
    .eq('name', CATEGORY_NAMES[kind])
    .eq('is_active', true)
    .maybeSingle();
  if (exact?.id) return exact.id;

  const { data: fallback } = await admin
    .from('financial_transaction_categories')
    .select('id')
    .eq('type', 'income')
    .eq('is_active', true)
    .limit(1)
    .maybeSingle();
  if (!fallback?.id) throw new Error('Giving category is not set up.');
  return fallback.id;
}

/**
 * Lists strict multi-tenant payment capabilities for all active WCA regions + Head Office
 * for signed-in members (includes homeRegionId).
 */
export const listGivingDestinations = createServerFn({ method: 'GET' })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { supabaseAdmin } = await import('@/integrations/supabase/client.server');
    const { resolveTenantGateway } = await import('@/lib/payment-engine.server');

    const { data: memberIds } = await context.supabase.rpc('get_member_ids_for_user', {
      _user_id: context.userId,
    });
    const firstId = Array.isArray(memberIds) ? memberIds[0] : null;
    const [{ data: home }, { data: homeDcg }, { data: regions }] = await Promise.all([
      firstId
        ? supabaseAdmin.from('members').select('region_id').eq('id', firstId).maybeSingle()
        : Promise.resolve({ data: null as { region_id: string | null } | null }),
      firstId
        ? supabaseAdmin
            .from('dcg_members')
            .select('dcg_id')
            .eq('member_id', firstId)
            .eq('is_active', true)
            .limit(1)
            .maybeSingle()
        : Promise.resolve({ data: null as { dcg_id: string | null } | null }),
      supabaseAdmin
        .from('regions')
        .select('id, name, code, currency_code')
        .eq('is_active', true)
        .order('name'),
    ]);

    const [hoGw, ...regGws] = await Promise.all([
      resolveTenantGateway(supabaseAdmin, { tenantType: 'head_office' }),
      ...(regions ?? []).map((r: any) =>
        resolveTenantGateway(supabaseAdmin, { tenantType: 'wca_region', regionId: r.id }),
      ),
    ]);

    return {
      homeRegionId: (home?.region_id as string | undefined) ?? null,
      homeDcgId: (homeDcg?.dcg_id as string | undefined) ?? null,
      headOffice: {
        id: 'global',
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
        id: gw.regionId as string,
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
    };
  });

/**
 * Public capability discovery for unauthenticated visitors, public campaign donors,
 * and special event registrants (zero secret exposure).
 */
export const listPublicDestinations = createServerFn({ method: 'GET' }).handler(async () => {
  const { supabaseAdmin } = await import('@/integrations/supabase/client.server');
  const { resolveTenantGateway } = await import('@/lib/payment-engine.server');

  const { data: regions } = await supabaseAdmin
    .from('regions')
    .select('id, name, code, currency_code')
    .eq('is_active', true)
    .order('name');

  const [hoGw, ...regGws] = await Promise.all([
    resolveTenantGateway(supabaseAdmin, { tenantType: 'head_office' }),
    ...(regions ?? []).map((r: any) =>
      resolveTenantGateway(supabaseAdmin, { tenantType: 'wca_region', regionId: r.id }),
    ),
  ]);

  return {
    headOffice: {
      id: 'global',
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
      id: gw.regionId as string,
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
  };
});

/** Starts an authenticated member gift, store purchase, DCG gift, or campaign contribution. */
export const startGiving = createServerFn({ method: 'POST' })
  .middleware([requireSupabaseAuth])
  .inputValidator((d) =>
    z
      .object({
        kind: z.enum(['tithe', 'offering', 'special']),
        amount: z.number().positive().max(100_000_000),
        method: z.enum(['mobile_money', 'card', 'wallet_pay', 'bank_transfer']),
        regionId: z.string().optional(), // UUID or 'global'
        dcgId: z.string().uuid().optional(),
        campaignId: z.string().uuid().optional(),
        purpose: z.string().max(160).optional(),
        phone: z.string().max(25).optional(),
        card: cardSchema.optional(),
        cardAuth: cardAuthSchema,
        origin: z.string().url(),
      })
      .parse(d),
  )
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;
    const { memberId } = await myMemberId(supabase, userId);
    const { supabaseAdmin } = await import('@/integrations/supabase/client.server');
    const {
      resolveTenantGateway,
      generateTxRef,
      normalizeMajorAmount,
      majorToMinorUnits,
      executeFlwMomoCharge,
      executeFlwCardCharge,
      executeFlwWalletCheckout,
    } = await import('@/lib/payment-engine.server');

    const { data: member } = await supabaseAdmin
      .from('members')
      .select('id, region_id')
      .eq('id', memberId)
      .single();

    let campaign: { id: string; name: string; region_id: string | null; currency_code: string | null } | null = null;
    if (data.campaignId) {
      const { data: c } = await supabaseAdmin
        .from('fundraising_campaigns')
        .select('id, name, region_id, status, currency_code')
        .eq('id', data.campaignId)
        .maybeSingle();
      if (!c || String(c.status || '').toLowerCase() !== 'active') {
        throw new Error('This campaign is no longer accepting gifts.');
      }
      campaign = c as any;
    }

    // Strict Multi-Tenant Resolution:
    // - Campaign with region_id = NULL (Global Campaign) -> strictly Head Office (regionId = null)
    // - Campaign with region_id -> strictly Campaign's owning region
    // - Explicit 'global' -> Head Office
    // - DCG context -> inherits parent region via dcgId
    // - Member giving / Store -> chosen regionId, else member's home regionId
    let resolvedRegionId: string | null = null;
    if (campaign) {
      resolvedRegionId = campaign.region_id ?? null;
    } else if (data.regionId === 'global') {
      resolvedRegionId = null;
    } else {
      resolvedRegionId = data.regionId || member?.region_id || null;
    }

    const gw = await resolveTenantGateway(supabaseAdmin, {
      tenantType: resolvedRegionId || data.dcgId ? 'wca_region' : 'head_office',
      regionId: resolvedRegionId,
      dcgId: data.dcgId || null,
    });

    const currency = (campaign?.currency_code || gw.currency || 'XAF').toUpperCase();

    if (data.method === 'bank_transfer') {
      if (!gw.bank) {
        throw new Error(`Bank deposits are not yet configured for ${gw.tenantName}.`);
      }
    } else {
      if (!gw.onlineReady || !gw.secretKey) {
        throw new Error(
          `Online payments are not yet activated for ${gw.tenantName}. Please pay via Bank Deposit or contact the regional finance team.`,
        );
      }
      if (data.method === 'mobile_money' && !gw.mobileMoneyEnabled) {
        throw new Error(`Mobile Money is not available for ${gw.tenantName} (${currency}).`);
      }
      if (data.method === 'card' && (!gw.cardEnabled || !gw.encryptionKey)) {
        throw new Error(`Card payments are not enabled for ${gw.tenantName}.`);
      }
      if (data.method === 'wallet_pay' && !gw.walletPayEnabled) {
        throw new Error(`Apple Pay / Google Pay is not enabled for ${gw.tenantName}.`);
      }
    }

    const kind = campaign ? 'special' : data.kind;
    const categoryId = await resolveIncomeCategoryId(supabaseAdmin, kind);
    const { data: profile } = await supabase
      .from('profiles')
      .select('first_name, last_name, email, phone')
      .eq('id', userId)
      .maybeSingle();

    const amount = normalizeMajorAmount(data.amount, currency);
    const txContext = campaign ? 'CMP' : data.purpose ? 'SHP' : data.dcgId ? 'DCG' : 'GIV';
    const txRef = generateTxRef({
      app: 'WCA',
      tenantCode: gw.tenantCode,
      context: txContext,
    });

    const name = [profile?.last_name, profile?.first_name].filter(Boolean).join(' ') || 'WCA member';
    const email = profile?.email || 'giving@wcaglobal.org';

    const { error: insErr } = await supabaseAdmin.from('financial_transactions').insert({
      category_id: categoryId,
      amount,
      currency_code: currency,
      region_id: gw.regionId,
      dcg_id: data.dcgId ?? null,
      member_id: memberId,
      recorded_by: userId,
      scope: gw.regionId ? 'regional' : 'global',
      transaction_date: new Date().toISOString().slice(0, 10),
      description: campaign
        ? `${CAMPAIGN_TAG}${campaign.id}`
        : data.purpose
          ? `store:${data.purpose}`
          : null,
      payment_method: data.method,
      payment_reference: txRef,
      payment_status: 'pending',
      donor_name: name,
      donor_email: profile?.email ?? null,
      donor_phone: data.phone || profile?.phone || null,
    } as any);

    if (insErr) throw new Error('Could not start your gift. Please try again.');

    if (campaign) {
      await supabaseAdmin.from('fundraising_donations').insert({
        campaign_id: campaign.id,
        member_id: memberId,
        amount: majorToMinorUnits(amount),
        currency_code: currency,
        donor_name: name,
        donor_email: profile?.email ?? null,
        status: 'pending',
        message: txRef,
        donation_date: new Date().toISOString().slice(0, 10),
      } as any);
    }

    if (data.method === 'bank_transfer') {
      return { txRef, link: null, network: null, bank: gw.bank, regionName: gw.tenantName };
    }

    const redirectUrl = `${data.origin}${campaign ? '/member/fundraising' : data.purpose ? '/member/store' : '/member/finances'}`;

    if (data.method === 'mobile_money') {
      try {
        const momo = await executeFlwMomoCharge({
          secret: gw.secretKey!,
          txRef,
          amount,
          currency,
          phoneRaw: data.phone || profile?.phone || '',
          email,
          name,
        });
        return { txRef, link: momo.link, network: momo.network, bank: null, regionName: gw.tenantName };
      } catch (err: any) {
        await supabaseAdmin
          .from('financial_transactions')
          .update({ payment_status: 'failed' } as any)
          .eq('payment_reference', txRef);
        if (campaign) {
          await supabaseAdmin
            .from('fundraising_donations')
            .update({ status: 'failed' })
            .eq('message', txRef)
            .eq('status', 'pending');
        }
        throw err;
      }
    }

    if (data.method === 'wallet_pay') {
      const wallet = await executeFlwWalletCheckout({
        secret: gw.secretKey!,
        txRef,
        amount,
        currency,
        email,
        name,
        title: campaign ? campaign.name : `${gw.tenantName} Giving`,
        redirectUrl,
      });
      return { txRef, link: wallet.link, network: null, bank: null, regionName: gw.tenantName };
    }

    if (!data.card) throw new Error('Please enter your card details.');
    const step = await executeFlwCardCharge({
      secret: gw.secretKey!,
      encryptionKey: gw.encryptionKey!,
      card: data.card,
      txRef,
      amount,
      currency,
      email,
      name,
      redirectUrl,
      auth: data.cardAuth,
    });
    if (step.next === 'failed') {
      await supabaseAdmin
        .from('financial_transactions')
        .update({ payment_status: 'failed' } as any)
        .eq('payment_reference', txRef);
      if (campaign) {
        await supabaseAdmin
          .from('fundraising_donations')
          .update({ status: 'failed' })
          .eq('message', txRef)
          .eq('status', 'pending');
      }
    }
    return { txRef, link: step.link ?? null, network: null, bank: null, regionName: gw.tenantName, card: step };
  });

/**
 * Universal Checkout Starter for Public Visitor Giving (/donate), Public Campaign Donations,
 * and Special/DCG Event Registration Fees (works with or without an auth session).
 */
export const startUniversalCheckout = createServerFn({ method: 'POST' })
  .inputValidator((d) =>
    z
      .object({
        context: z.enum(['public_giving', 'campaign_donation', 'event_fee']),
        method: z.enum(['mobile_money', 'card', 'wallet_pay', 'bank_transfer']),
        amount: z.number().nonnegative().max(100_000_000).optional(),
        kind: z.enum(['tithe', 'offering', 'special']).optional(),
        regionId: z.string().optional(), // UUID or 'global'
        dcgId: z.string().uuid().optional(),
        campaignId: z.string().uuid().optional(),
        eventId: z.string().uuid().optional(),
        preRegistrationIds: z.array(z.string().uuid()).optional(),
        groupId: z.string().uuid().nullable().optional(),
        anonymous: z.boolean().optional(),
        name: z.string().max(160).optional(),
        familyName: z.string().max(100).optional(),
        otherNames: z.string().max(100).optional(),
        email: z.string().max(160).optional(),
        phone: z.string().max(30).optional(),
        purpose: z.string().max(160).optional(),
        card: cardSchema.optional(),
        cardAuth: cardAuthSchema,
        origin: z.string().url(),
        redirectPath: z.string().max(240).optional(),
      })
      .parse(d),
  )
  .handler(async ({ data }) => {
    const { supabaseAdmin } = await import('@/integrations/supabase/client.server');
    const {
      resolveTenantGateway,
      generateTxRef,
      normalizeMajorAmount,
      majorToMinorUnits,
      minorToMajorUnits,
      executeFlwMomoCharge,
      executeFlwCardCharge,
      executeFlwWalletCheckout,
    } = await import('@/lib/payment-engine.server');

    const redirectUrl = `${data.origin.replace(/\/$/, '')}${data.redirectPath || '/'}`;

    // ---- Scenario A: Special / DCG Event Registration Fees ----
    if (data.context === 'event_fee') {
      if (!data.eventId || (!data.preRegistrationIds?.length && !data.groupId)) {
        throw new Error('Missing event registration reference.');
      }
      const { data: ev } = await supabaseAdmin
        .from('events')
        .select('id, name, region_id, dcg_id')
        .eq('id', data.eventId)
        .maybeSingle();
      if (!ev) throw new Error('Event not found.');

      let q = supabaseAdmin
        .from('event_pre_registrations')
        .select('id, member_id, is_primary, email, phone, fee_status, fee_is_group, registration_fee_amount')
        .eq('event_id', data.eventId);
      q = data.groupId ? q.eq('group_id', data.groupId) : q.in('id', data.preRegistrationIds!);
      const { data: regRows } = await q;
      if (!regRows?.length) throw new Error('Event registration rows were not found.');

      const unpaidRows = regRows.filter((r: any) => r.fee_status !== 'paid' && r.fee_status !== 'waived');
      if (!unpaidRows.length) {
        return {
          alreadyPaid: true,
          txRef: '',
          link: null,
          network: null,
          bank: null,
          regionName: ev.name,
        };
      }

      const totalMinor = unpaidRows.reduce((sum: number, r: any) => {
        if (r.fee_is_group && !r.is_primary) return sum;
        return sum + (Number(r.registration_fee_amount) || 0);
      }, 0);

      const { data: feeCfg } = await supabaseAdmin
        .from('event_registration_fees')
        .select('currency_code')
        .eq('event_id', data.eventId)
        .limit(1)
        .maybeSingle();

      const gw = await resolveTenantGateway(supabaseAdmin, {
        tenantType: ev.region_id || ev.dcg_id ? 'wca_region' : 'head_office',
        regionId: ev.region_id,
        dcgId: ev.dcg_id,
      });

      const currency = (feeCfg?.currency_code || gw.currency || 'XAF').toUpperCase();
      const majorAmount = minorToMajorUnits(totalMinor, currency);
      if (majorAmount <= 0) {
        return { alreadyPaid: true, txRef: '', link: null, network: null, bank: null, regionName: gw.tenantName };
      }

      if (data.method === 'bank_transfer') {
        if (!gw.bank) {
          throw new Error(`Bank deposits are not yet configured for ${gw.tenantName}.`);
        }
      } else {
        if (!gw.onlineReady || !gw.secretKey) {
          throw new Error(
            `Online payments are not yet activated for ${gw.tenantName}. Please pay via Bank Deposit or contact the regional finance team.`,
          );
        }
        if (data.method === 'mobile_money' && !gw.mobileMoneyEnabled) {
          throw new Error(`Mobile Money is not available for ${gw.tenantName}.`);
        }
        if (data.method === 'card' && (!gw.cardEnabled || !gw.encryptionKey)) {
          throw new Error(`Card payments are not enabled for ${gw.tenantName}.`);
        }
        if (data.method === 'wallet_pay' && !gw.walletPayEnabled) {
          throw new Error(`Apple Pay / Google Pay is not enabled for ${gw.tenantName}.`);
        }
      }

      const primaryRow = regRows.find((r: any) => r.is_primary) || regRows[0];
      const categoryId = await resolveIncomeCategoryId(supabaseAdmin, 'special');
      const txRef = generateTxRef({
        app: 'WCA',
        tenantCode: gw.tenantCode,
        context: ev.dcg_id ? 'DCG' : 'EVT',
      });

      const payerName = (data.name || 'Event Attendee').trim();
      const payerEmail = (data.email || primaryRow?.email || 'events@wcaglobal.org').trim();
      const payerPhone = (data.phone || primaryRow?.phone || '').trim();

      const { data: finRow, error: finErr } = await supabaseAdmin
        .from('financial_transactions')
        .insert({
          category_id: categoryId,
          amount: majorAmount,
          currency_code: currency,
          region_id: gw.regionId,
          dcg_id: ev.dcg_id ?? null,
          member_id: primaryRow?.member_id ?? null,
          scope: gw.regionId ? 'regional' : 'global',
          transaction_date: new Date().toISOString().slice(0, 10),
          description: `event_fee:${ev.id}:${ev.name}`,
          payment_method: data.method,
          payment_reference: txRef,
          payment_status: 'pending',
          donor_name: payerName,
          donor_email: payerEmail,
          donor_phone: payerPhone || null,
        } as any)
        .select('id')
        .single();

      if (finErr || !finRow) throw new Error('Could not initialize event fee payment.');

      const targetIds = unpaidRows.map((r: any) => r.id);
      await supabaseAdmin
        .from('event_pre_registrations')
        .update({
          fee_payment_reference: txRef,
          fee_payment_method: data.method,
          financial_transaction_id: finRow.id,
          fee_status: 'pending',
        } as any)
        .in('id', targetIds);

      if (data.method === 'bank_transfer') {
        return { txRef, link: null, network: null, bank: gw.bank, regionName: gw.tenantName, amount: majorAmount, currency };
      }

      if (data.method === 'mobile_money') {
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
          return { txRef, link: momo.link, network: momo.network, bank: null, regionName: gw.tenantName };
        } catch (err: any) {
          await supabaseAdmin.from('financial_transactions').update({ payment_status: 'failed' } as any).eq('id', finRow.id);
          await supabaseAdmin.from('event_pre_registrations').update({ fee_status: 'unpaid' } as any).in('id', targetIds);
          throw err;
        }
      }

      if (data.method === 'wallet_pay') {
        const wallet = await executeFlwWalletCheckout({
          secret: gw.secretKey!,
          txRef,
          amount: majorAmount,
          currency,
          email: payerEmail,
          name: payerName,
          title: `${ev.name} · Registration Fee`,
          redirectUrl,
        });
        return { txRef, link: wallet.link, network: null, bank: null, regionName: gw.tenantName };
      }

      if (!data.card) throw new Error('Please enter your card details.');
      const step = await executeFlwCardCharge({
        secret: gw.secretKey!,
        encryptionKey: gw.encryptionKey!,
        card: data.card,
        txRef,
        amount: majorAmount,
        currency,
        email: payerEmail,
        name: payerName,
        redirectUrl,
        auth: data.cardAuth,
      });
      if (step.next === 'failed') {
        await supabaseAdmin.from('financial_transactions').update({ payment_status: 'failed' } as any).eq('id', finRow.id);
        await supabaseAdmin.from('event_pre_registrations').update({ fee_status: 'unpaid' } as any).in('id', targetIds);
      }
      return { txRef, link: step.link ?? null, network: null, bank: null, regionName: gw.tenantName, card: step };
    }

    // ---- Scenario B: Public Campaign Donation or Public Visitor Giving (/donate) ----
    let campaignRow: { id: string; name: string; region_id: string | null; currency_code: string | null } | null = null;
    let resolvedRegionId: string | null = data.regionId === 'global' ? null : (data.regionId || null);

    if (data.context === 'campaign_donation' || data.campaignId) {
      if (!data.campaignId) throw new Error('Missing campaign ID.');
      const { data: camp } = await supabaseAdmin
        .from('fundraising_campaigns')
        .select('id, name, region_id, status, currency_code')
        .eq('id', data.campaignId)
        .maybeSingle();
      if (!camp || String(camp.status || '').toLowerCase() !== 'active') {
        throw new Error('This campaign is not currently accepting donations.');
      }
      campaignRow = camp as any;
      resolvedRegionId = camp.region_id ?? null; // Global campaigns strictly route to Head Office
    }

    const gw = await resolveTenantGateway(supabaseAdmin, {
      tenantType: resolvedRegionId || data.dcgId ? 'wca_region' : 'head_office',
      regionId: resolvedRegionId,
      dcgId: data.dcgId || null,
    });

    const currency = (campaignRow?.currency_code || gw.currency || 'XAF').toUpperCase();
    const majorAmount = normalizeMajorAmount(Number(data.amount || 0), currency);
    if (majorAmount <= 0) throw new Error('Please enter a valid amount.');

    if (data.method === 'bank_transfer') {
      if (!gw.bank) throw new Error(`Bank deposits are not yet configured for ${gw.tenantName}.`);
    } else {
      if (!gw.onlineReady || !gw.secretKey) {
        throw new Error(
          `Online payments are not yet activated for ${gw.tenantName}. Please pay via Bank Deposit or contact the regional finance team.`,
        );
      }
      if (data.method === 'mobile_money' && !gw.mobileMoneyEnabled) {
        throw new Error(`Mobile Money is not available for ${gw.tenantName} (${currency}).`);
      }
      if (data.method === 'card' && (!gw.cardEnabled || !gw.encryptionKey)) {
        throw new Error(`Card payments are not enabled for ${gw.tenantName}.`);
      }
      if (data.method === 'wallet_pay' && !gw.walletPayEnabled) {
        throw new Error(`Apple Pay / Google Pay is not enabled for ${gw.tenantName}.`);
      }
    }

    const kind = campaignRow ? 'special' : (data.kind || 'offering');
    const categoryId = await resolveIncomeCategoryId(supabaseAdmin, kind);

    const anonymous = !!data.anonymous;
    const donorName = anonymous
      ? 'Anonymous'
      : (data.name || [data.familyName, data.otherNames].filter(Boolean).join(' ') || 'Public Donor').trim();
    const donorEmail = (data.email || 'giving@wcaglobal.org').trim();
    const donorPhone = (data.phone || '').trim();

    let matchedMemberId: string | null = null;
    let matchedDonorId: string | null = null;
    if (!anonymous && donorPhone) {
      const digits = donorPhone.replace(/\D/g, '').slice(-9);
      if (digits.length >= 8) {
        const { data: prof } = await supabaseAdmin
          .from('profiles')
          .select('id')
          .ilike('phone', `%${digits}%`)
          .limit(1)
          .maybeSingle();
        if (prof?.id) {
          const { data: mem } = await supabaseAdmin
            .from('members')
            .select('id')
            .eq('profile_id', prof.id)
            .limit(1)
            .maybeSingle();
          if (mem?.id) matchedMemberId = mem.id;
        }
        if (!matchedMemberId && campaignRow) {
          const { data: existingDonor } = await supabaseAdmin
            .from('donors')
            .select('id')
            .ilike('phone', `%${digits}%`)
            .limit(1)
            .maybeSingle();
          if (existingDonor?.id) {
            matchedDonorId = existingDonor.id;
          } else if ((data.familyName || donorName) && gw.regionId) {
            const { data: createdDonor } = await supabaseAdmin
              .from('donors')
              .insert({
                phone: donorPhone,
                first_name: data.otherNames || donorName,
                last_name: data.familyName || donorName,
                email: data.email || null,
                region_id: gw.regionId,
              })
              .select('id')
              .maybeSingle();
            matchedDonorId = createdDonor?.id ?? null;
          }
        }
      }
    }

    const txRef = generateTxRef({
      app: 'WCA',
      tenantCode: gw.tenantCode,
      context: campaignRow ? 'CMP' : data.dcgId ? 'DCG' : 'GIV',
    });

    const { data: finIns, error: finErr } = await supabaseAdmin
      .from('financial_transactions')
      .insert({
        category_id: categoryId,
        amount: majorAmount,
        currency_code: currency,
        region_id: gw.regionId,
        dcg_id: data.dcgId ?? null,
        member_id: matchedMemberId,
        scope: gw.regionId ? 'regional' : 'global',
        transaction_date: new Date().toISOString().slice(0, 10),
        description: campaignRow
          ? `${CAMPAIGN_TAG}${campaignRow.id}`
          : data.purpose
            ? `public:${data.purpose}`
            : `public_${kind}`,
        payment_method: data.method,
        payment_reference: txRef,
        payment_status: 'pending',
        donor_name: donorName,
        donor_email: anonymous ? null : (data.email || null),
        donor_phone: anonymous ? null : (donorPhone || null),
      } as any)
      .select('id')
      .single();

    if (finErr || !finIns) throw new Error('Could not initialize payment record.');

    if (campaignRow) {
      await supabaseAdmin.from('fundraising_donations').insert({
        campaign_id: campaignRow.id,
        member_id: matchedMemberId,
        donor_id: matchedDonorId,
        donor_name: donorName,
        donor_email: anonymous ? null : (data.email || null),
        is_anonymous: anonymous,
        amount: majorToMinorUnits(majorAmount),
        currency_code: currency,
        status: 'pending',
        message: txRef,
        donation_date: new Date().toISOString().slice(0, 10),
      } as any);
    }

    if (data.method === 'bank_transfer') {
      return { txRef, link: null, network: null, bank: gw.bank, regionName: gw.tenantName, amount: majorAmount, currency };
    }

    if (data.method === 'mobile_money') {
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
        return { txRef, link: momo.link, network: momo.network, bank: null, regionName: gw.tenantName };
      } catch (err: any) {
        await supabaseAdmin.from('financial_transactions').update({ payment_status: 'failed' } as any).eq('id', finIns.id);
        if (campaignRow) {
          await supabaseAdmin.from('fundraising_donations').update({ status: 'failed' }).eq('message', txRef).eq('status', 'pending');
        }
        throw err;
      }
    }

    if (data.method === 'wallet_pay') {
      const wallet = await executeFlwWalletCheckout({
        secret: gw.secretKey!,
        txRef,
        amount: majorAmount,
        currency,
        email: donorEmail,
        name: donorName,
        title: campaignRow ? campaignRow.name : `${gw.tenantName} Giving`,
        redirectUrl,
      });
      return { txRef, link: wallet.link, network: null, bank: null, regionName: gw.tenantName };
    }

    if (!data.card) throw new Error('Please enter your card details.');
    const step = await executeFlwCardCharge({
      secret: gw.secretKey!,
      encryptionKey: gw.encryptionKey!,
      card: data.card,
      txRef,
      amount: majorAmount,
      currency,
      email: donorEmail,
      name: donorName,
      redirectUrl,
      auth: data.cardAuth,
    });
    if (step.next === 'failed') {
      await supabaseAdmin.from('financial_transactions').update({ payment_status: 'failed' } as any).eq('id', finIns.id);
      if (campaignRow) {
        await supabaseAdmin.from('fundraising_donations').update({ status: 'failed' }).eq('message', txRef).eq('status', 'pending');
      }
    }
    return { txRef, link: step.link ?? null, network: null, bank: null, regionName: gw.tenantName, card: step };
  });

/** Continues a direct card charge (PIN or AVS billing address) for a signed-in member. */
export const continueCardGift = createServerFn({ method: 'POST' })
  .middleware([requireSupabaseAuth])
  .inputValidator((d) =>
    z.object({ txRef: z.string().min(5).max(80), card: cardSchema, cardAuth: cardAuthSchema, origin: z.string().url() }).parse(d),
  )
  .handler(async ({ data, context }) => {
    const { ids } = await myMemberId(context.supabase, context.userId);
    const { supabaseAdmin } = await import('@/integrations/supabase/client.server');
    const { lookupPendingTransaction, resolveTenantGateway, executeFlwCardCharge, finalizeFailedPayment } =
      await import('@/lib/payment-engine.server');

    const lookup = await lookupPendingTransaction(supabaseAdmin, data.txRef);
    if (!lookup || !lookup.memberId || !ids.includes(lookup.memberId) || lookup.currentStatus !== 'pending') {
      throw new Error('Gift not found.');
    }
    const gw = await resolveTenantGateway(supabaseAdmin, {
      tenantType: lookup.tenantType,
      regionId: lookup.regionId,
      dcgId: lookup.dcgId,
    });
    if (!gw.secretKey || !gw.encryptionKey) throw new Error('Card payments are not available right now.');

    const { data: profile } = await context.supabase
      .from('profiles')
      .select('first_name, last_name, email')
      .eq('id', context.userId)
      .maybeSingle();

    const step = await executeFlwCardCharge({
      secret: gw.secretKey,
      encryptionKey: gw.encryptionKey,
      card: data.card,
      txRef: data.txRef,
      amount: lookup.expectedMajorAmount,
      currency: lookup.expectedCurrency,
      email: profile?.email || 'giving@wcaglobal.org',
      name: [profile?.last_name, profile?.first_name].filter(Boolean).join(' ') || 'WCA member',
      redirectUrl: `${data.origin}${String(lookup.description || '').startsWith(CAMPAIGN_TAG) ? '/member/fundraising' : '/member/finances'}`,
      auth: data.cardAuth,
    });
    if (step.next === 'failed') {
      await finalizeFailedPayment(supabaseAdmin, lookup);
    }
    return step;
  });

/** Continues a direct card charge (PIN or AVS) for public/universal checkouts. */
export const continueUniversalCard = createServerFn({ method: 'POST' })
  .inputValidator((d) =>
    z
      .object({
        txRef: z.string().min(5).max(80),
        card: cardSchema,
        cardAuth: cardAuthSchema,
        email: z.string().max(160).optional(),
        name: z.string().max(160).optional(),
        origin: z.string().url(),
        redirectPath: z.string().max(240).optional(),
      })
      .parse(d),
  )
  .handler(async ({ data }) => {
    const { supabaseAdmin } = await import('@/integrations/supabase/client.server');
    const { lookupPendingTransaction, resolveTenantGateway, executeFlwCardCharge, finalizeFailedPayment } =
      await import('@/lib/payment-engine.server');

    const lookup = await lookupPendingTransaction(supabaseAdmin, data.txRef);
    if (!lookup || lookup.currentStatus !== 'pending') throw new Error('Transaction not found.');
    const gw = await resolveTenantGateway(supabaseAdmin, {
      tenantType: lookup.tenantType,
      regionId: lookup.regionId,
      dcgId: lookup.dcgId,
      tenantCode: lookup.tenantCode,
    });
    if (!gw.secretKey || !gw.encryptionKey) throw new Error('Card gateway unavailable.');

    const step = await executeFlwCardCharge({
      secret: gw.secretKey,
      encryptionKey: gw.encryptionKey,
      card: data.card,
      txRef: data.txRef,
      amount: lookup.expectedMajorAmount,
      currency: lookup.expectedCurrency,
      email: data.email || 'giving@wcaglobal.org',
      name: data.name || 'WCA Supporter',
      redirectUrl: `${data.origin.replace(/\/$/, '')}${data.redirectPath || '/'}`,
      auth: data.cardAuth,
    });
    if (step.next === 'failed') await finalizeFailedPayment(supabaseAdmin, lookup);
    return step;
  });

/** Submits card OTP for signed-in member. */
export const validateCardOtp = createServerFn({ method: 'POST' })
  .middleware([requireSupabaseAuth])
  .inputValidator((d) =>
    z.object({ txRef: z.string().min(5).max(80), flwRef: z.string().min(3).max(120), otp: z.string().regex(/^\d{4,8}$/) }).parse(d),
  )
  .handler(async ({ data, context }) => {
    const { ids } = await myMemberId(context.supabase, context.userId);
    const { supabaseAdmin } = await import('@/integrations/supabase/client.server');
    const { FLW_API, lookupPendingTransaction, resolveTenantGateway } = await import('@/lib/payment-engine.server');

    const lookup = await lookupPendingTransaction(supabaseAdmin, data.txRef);
    if (!lookup || !lookup.memberId || !ids.includes(lookup.memberId)) throw new Error('Gift not found.');
    const gw = await resolveTenantGateway(supabaseAdmin, {
      tenantType: lookup.tenantType,
      regionId: lookup.regionId,
      dcgId: lookup.dcgId,
    });
    if (!gw.secretKey) throw new Error('Card payments are not available right now.');
    const res = await fetch(`${FLW_API}/validate-charge`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${gw.secretKey}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ otp: data.otp, flw_ref: data.flwRef, type: 'card' }),
    });
    const body = (await res.json().catch(() => ({}))) as any;
    if (body.status !== 'success') throw new Error(body.message || 'That code was not accepted.');
    return { ok: true };
  });

/** Submits card OTP for public/universal checkouts. */
export const validateUniversalOtp = createServerFn({ method: 'POST' })
  .inputValidator((d) =>
    z.object({ txRef: z.string().min(5).max(80), flwRef: z.string().min(3).max(120), otp: z.string().regex(/^\d{4,8}$/) }).parse(d),
  )
  .handler(async ({ data }) => {
    const { supabaseAdmin } = await import('@/integrations/supabase/client.server');
    const { FLW_API, lookupPendingTransaction, resolveTenantGateway } = await import('@/lib/payment-engine.server');

    const lookup = await lookupPendingTransaction(supabaseAdmin, data.txRef);
    if (!lookup) throw new Error('Transaction not found.');
    const gw = await resolveTenantGateway(supabaseAdmin, {
      tenantType: lookup.tenantType,
      regionId: lookup.regionId,
      dcgId: lookup.dcgId,
      tenantCode: lookup.tenantCode,
    });
    if (!gw.secretKey) throw new Error('Card gateway unavailable.');
    const res = await fetch(`${FLW_API}/validate-charge`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${gw.secretKey}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ otp: data.otp, flw_ref: data.flwRef, type: 'card' }),
    });
    const body = (await res.json().catch(() => ({}))) as any;
    if (body.status !== 'success') throw new Error(body.message || 'That code was not accepted.');
    return { ok: true };
  });

async function pollAndVerifyTxRef(txRef: string, requiredMemberIds?: string[]) {
  const { supabaseAdmin } = await import('@/integrations/supabase/client.server');
  const {
    FLW_API,
    lookupPendingTransaction,
    resolveTenantGateway,
    finalizeSuccessfulPayment,
    finalizeFailedPayment,
  } = await import('@/lib/payment-engine.server');

  const lookup = await lookupPendingTransaction(supabaseAdmin, txRef);
  if (!lookup) throw new Error('Transaction not found.');
  if (requiredMemberIds && (!lookup.memberId || !requiredMemberIds.includes(lookup.memberId))) {
    throw new Error('Gift not found.');
  }
  if (lookup.currentStatus === 'completed' || lookup.currentStatus === 'paid') {
    return { status: 'successful' as const };
  }
  if (lookup.paymentMethod === 'bank_transfer') {
    return { status: 'pending' as const };
  }

  const gw = await resolveTenantGateway(supabaseAdmin, {
    tenantType: lookup.tenantType,
    regionId: lookup.regionId,
    dcgId: lookup.dcgId,
    tenantCode: lookup.tenantCode,
  });
  if (!gw.secretKey) return { status: 'pending' as const };

  const res = await fetch(`${FLW_API}/transactions/verify_by_reference?tx_ref=${encodeURIComponent(txRef)}`, {
    headers: { Authorization: `Bearer ${gw.secretKey}` },
  });
  const body = (await res.json().catch(() => ({}))) as any;
  const tx = body?.data;
  if (!tx) return { status: 'pending' as const };

  if (
    tx.status === 'successful' &&
    Number(tx.amount) >= lookup.expectedMajorAmount &&
    String(tx.currency || '').toUpperCase() === lookup.expectedCurrency
  ) {
    const resolvedMethod =
      tx.payment_type === 'card'
        ? 'card'
        : String(tx.payment_type || '').includes('mobile')
          ? 'mobile_money'
          : lookup.paymentMethod || 'card';
    await finalizeSuccessfulPayment(supabaseAdmin, lookup, {
      gatewayTxId: tx.id,
      resolvedMethod,
    });
    return { status: 'successful' as const };
  }

  if (tx.status === 'failed' || tx.status === 'cancelled') {
    await finalizeFailedPayment(supabaseAdmin, lookup);
    return { status: 'failed' as const };
  }
  return { status: 'pending' as const };
}

/** Checks a pending online gift for a signed-in member and confirms it once paid. */
export const checkGiving = createServerFn({ method: 'POST' })
  .middleware([requireSupabaseAuth])
  .inputValidator((d) => z.object({ txRef: z.string().min(5).max(80) }).parse(d))
  .handler(async ({ data, context }) => {
    const { ids } = await myMemberId(context.supabase, context.userId);
    return pollAndVerifyTxRef(data.txRef, ids);
  });

/** Verifies a pending public/universal online payment (public giving, campaign, or event fee). */
export const verifyUniversalPayment = createServerFn({ method: 'POST' })
  .inputValidator((d) => z.object({ txRef: z.string().min(5).max(80) }).parse(d))
  .handler(async ({ data }) => {
    return pollAndVerifyTxRef(data.txRef);
  });
