import { createServerFn } from '@tanstack/react-start';
import { z } from 'zod';
import { requireSupabaseAuth } from '@/integrations/supabase/auth-middleware';

const FLW = 'https://api.flutterwave.com/v3';

const CATEGORY_NAMES = { tithe: 'Tithes', offering: 'Offerings', special: 'Special Giving' } as const;

/** Normalises a Cameroon mobile money number and detects MTN or Orange. */
export function detectMomo(raw: string) {
  let d = raw.replace(/\D/g, '');
  if (d.startsWith('00237')) d = d.slice(5);
  else if (d.startsWith('237') && d.length >= 12) d = d.slice(3);
  const p2 = d.slice(0, 2), p3 = d.slice(0, 3);
  let network: 'MTN' | 'ORANGE' | undefined;
  if (p2 === '67' || p2 === '68' || ['650', '651', '652', '653', '654'].includes(p3)) network = 'MTN';
  else if (p2 === '69' || ['655', '656', '657', '658', '659'].includes(p3)) network = 'ORANGE';
  return { local: d, international: d.length === 9 ? `237${d}` : d, network };
}

/**
 * Picks the gateway that receives funds for a region: the region's own
 * Flutterwave account when configured, otherwise the head-office account.
 * Bank details always come from the region itself (head office as fallback).
 */
async function resolveGateway(regionId: string) {
  const { supabaseAdmin } = await import('@/integrations/supabase/client.server');
  const { data: rows } = await (supabaseAdmin as any).from('region_payment_settings').select('*').or(`region_id.eq.${regionId},region_id.is.null`);
  const own = (rows ?? []).find((r: any) => r.region_id === regionId);
  const global = (rows ?? []).find((r: any) => r.region_id === null);
  const ownReady = !!(own?.flutterwave_enabled && own?.flutterwave_secret_key);
  const gw = ownReady ? own : global?.flutterwave_enabled && global?.flutterwave_secret_key ? global : null;
  const bankSrc = own?.bank_transfer_enabled ? own : global?.bank_transfer_enabled ? global : null;
  return {
    supabaseAdmin,
    secret: (gw?.flutterwave_secret_key as string | undefined)?.trim() || null,
    source: gw ? (ownReady ? 'region' : 'global') : null,
    mobileMoney: !!gw?.mobile_money_enabled,
    card: !!gw?.card_enabled,
    bank: bankSrc ? { accounts: (Array.isArray(bankSrc.bank_accounts) ? bankSrc.bank_accounts : []) as any[], instructions: (bankSrc.bank_instructions as string) || '' } : null,
  };
}

async function myMemberId(supabase: any, userId: string) {
  const { data: ids } = await supabase.rpc('get_member_ids_for_user', { _user_id: userId });
  const memberId = (ids as string[] | null)?.[0];
  if (!memberId) throw new Error('We could not find your member record. Please contact your region.');
  return { memberId, ids: (ids as string[]) ?? [] };
}

/** Regions a member can give to, with the methods each one accepts. */
export const listGivingDestinations = createServerFn({ method: 'GET' })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { memberId } = await myMemberId(context.supabase, context.userId);
    const { supabaseAdmin } = await import('@/integrations/supabase/client.server');
    const [{ data: member }, { data: regions }, { data: rows }] = await Promise.all([
      supabaseAdmin.from('members').select('region_id').eq('id', memberId).single(),
      supabaseAdmin.from('regions').select('id, name, currency_code').order('name'),
      (supabaseAdmin as any).from('region_payment_settings').select('region_id, flutterwave_enabled, flutterwave_secret_key, mobile_money_enabled, card_enabled, bank_transfer_enabled, bank_accounts, bank_instructions'),
    ]);
    const by = new Map<string | null, any>((rows ?? []).map((r: any) => [r.region_id, r]));
    const g = by.get(null);
    return {
      homeRegionId: member?.region_id ?? null,
      regions: (regions ?? []).map((r: any) => {
        const own = by.get(r.id);
        const gw = own?.flutterwave_enabled && own?.flutterwave_secret_key ? own : g?.flutterwave_enabled && g?.flutterwave_secret_key ? g : null;
        const currency = r.currency_code || 'XAF';
        const bankSource = own?.bank_transfer_enabled ? own : g?.bank_transfer_enabled ? g : null;
        return {
          id: r.id as string, name: r.name as string, currency,
          mobileMoney: !!gw?.mobile_money_enabled && currency === 'XAF',
          card: !!gw?.card_enabled,
          bank: !!(own?.bank_transfer_enabled || g?.bank_transfer_enabled),
          bankInfo: bankSource ? {
            accounts: (Array.isArray(bankSource.bank_accounts) ? bankSource.bank_accounts : []).map((a: any) => ({
              bank_name: String(a.bank_name || ''), account_name: String(a.account_name || ''),
              account_number: String(a.account_number || ''), swift: String(a.swift || ''), branch: String(a.branch || ''),
            })),
            instructions: String(bankSource.bank_instructions || ''),
          } : null,
        };
      }),
    };
  });

/** Starts a gift for the signed-in member, routed to the destination region's gateway. */
export const startGiving = createServerFn({ method: 'POST' })
  .middleware([requireSupabaseAuth])
  .inputValidator((d) => z.object({
    kind: z.enum(['tithe', 'offering', 'special']),
    amount: z.number().positive().max(100_000_000),
    method: z.enum(['mobile_money', 'card', 'bank_transfer']),
    regionId: z.string().uuid().optional(),
    phone: z.string().max(20).optional(),
    note: z.string().max(200).optional(),
    origin: z.string().url(),
  }).parse(d))
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;
    const { memberId } = await myMemberId(supabase, userId);
    const { supabaseAdmin } = await import('@/integrations/supabase/client.server');

    const { data: member } = await supabaseAdmin.from('members').select('id, region_id').eq('id', memberId).single();
    const regionId = data.regionId || member?.region_id;
    if (!regionId) throw new Error('Your member record has no region.');
    const { data: region } = await supabaseAdmin.from('regions').select('name, currency_code').eq('id', regionId).single();
    if (!region) throw new Error('That region was not found.');
    const gw = await resolveGateway(regionId);
    const currency = region.currency_code || 'XAF';

    if (data.method === 'bank_transfer') {
      if (!gw.bank) throw new Error('Bank transfer is not available for this region yet.');
    } else {
      if (!gw.secret) throw new Error('Online giving is not available for this region right now.');
      if (data.method === 'mobile_money' && !gw.mobileMoney) throw new Error('Mobile money is not available for this region.');
      if (data.method === 'card' && !gw.card) throw new Error('Card payments are not available for this region.');
    }

    const { data: category } = await supabaseAdmin.from('financial_transaction_categories').select('id').eq('name', CATEGORY_NAMES[data.kind]).eq('is_active', true).maybeSingle();
    if (!category) throw new Error('Giving category is not set up.');
    const { data: profile } = await supabase.from('profiles').select('first_name, last_name, email, phone').eq('id', userId).maybeSingle();

    const amount = currency === 'XAF' || currency === 'XOF' ? Math.round(data.amount) : Math.round(data.amount * 100) / 100;
    const prefix = data.method === 'bank_transfer' ? 'WCA-BANK' : 'WCA-GIVE';
    const txRef = `${prefix}-${Date.now().toString(36).toUpperCase()}-${Math.random().toString(36).slice(2, 6).toUpperCase()}`;
    const name = [profile?.last_name, profile?.first_name].filter(Boolean).join(' ') || 'WCA member';
    const email = profile?.email || 'giving@wcaglobal.org';

    const { error: insErr } = await supabaseAdmin.from('financial_transactions').insert({
      category_id: category.id, amount, currency_code: currency, region_id: regionId,
      member_id: memberId, recorded_by: userId, scope: 'regional',
      transaction_date: new Date().toISOString().slice(0, 10),
      description: data.note?.trim() || null,
      payment_method: data.method, payment_reference: txRef, payment_status: 'pending',
    } as any);
    if (insErr) throw new Error('Could not start your gift. Please try again.');

    if (data.method === 'bank_transfer') {
      return { txRef, link: null, network: null, bank: gw.bank, regionName: region.name as string };
    }

    const secret = gw.secret;
    if (!secret) throw new Error('Online giving is not available for this region.');
    if (data.method === 'mobile_money') {
      if (currency !== 'XAF') throw new Error('Mobile money is only available for XAF regions. Please use card.');
      const phone = detectMomo(data.phone || profile?.phone || '');
      if (phone.local.length !== 9) throw new Error('Please enter a valid 9-digit mobile money number.');
      if (!phone.network) throw new Error('Please use an MTN or Orange Cameroon number.');
      const res = await fetch(`${FLW}/charges?type=mobile_money_franco`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${secret}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ tx_ref: txRef, amount, currency, phone_number: phone.international, email, fullname: name, country: 'CM', network: phone.network }),
      });
      const body = (await res.json().catch(() => ({}))) as any;
      if (!res.ok || body.status !== 'success') {
        await supabaseAdmin.from('financial_transactions').update({ payment_status: 'failed' } as any).eq('payment_reference', txRef);
        throw new Error(body.message || 'Could not send the payment request to your phone.');
      }
      const auth = body.meta?.authorization;
      return { txRef, link: auth?.mode === 'redirect' ? (auth.redirect as string) : null, network: phone.network, bank: null, regionName: region.name as string };
    }

    const res = await fetch(`${FLW}/payments`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${secret}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        tx_ref: txRef, amount, currency, payment_options: 'card',
        redirect_url: `${data.origin}/member/finances`,
        customer: { email, name, phonenumber: profile?.phone || undefined },
        customizations: { title: `World Changers Association · ${region.name}`, description: `${CATEGORY_NAMES[data.kind]} gift` },
      }),
    });
    const body = (await res.json().catch(() => ({}))) as any;
    if (!res.ok || body.status !== 'success' || !body.data?.link) {
      await supabaseAdmin.from('financial_transactions').update({ payment_status: 'failed' } as any).eq('payment_reference', txRef);
      throw new Error(body.message || 'Could not open card checkout.');
    }
    return { txRef, link: body.data.link as string, network: null, bank: null, regionName: region.name as string };
  });

/** Checks a pending online gift with the destination region's gateway and confirms it once paid. */
export const checkGiving = createServerFn({ method: 'POST' })
  .middleware([requireSupabaseAuth])
  .inputValidator((d) => z.object({ txRef: z.string().min(5).max(80) }).parse(d))
  .handler(async ({ data, context }) => {
    const { ids } = await myMemberId(context.supabase, context.userId);
    const { supabaseAdmin } = await import('@/integrations/supabase/client.server');
    const { data: row } = await supabaseAdmin.from('financial_transactions').select('id, amount, currency_code, member_id, region_id, payment_status, payment_method' as any).eq('payment_reference', data.txRef).maybeSingle() as any;
    if (!row || !ids.includes(row.member_id)) throw new Error('Gift not found.');
    if (row.payment_status === 'completed') return { status: 'successful' as const };
    if (row.payment_method === 'bank_transfer') return { status: 'pending' as const };

    const { secret } = await resolveGateway(row.region_id);
    if (!secret) throw new Error('Online giving is not available right now.');
    const res = await fetch(`${FLW}/transactions/verify_by_reference?tx_ref=${encodeURIComponent(data.txRef)}`, { headers: { Authorization: `Bearer ${secret}` } });
    const body = (await res.json().catch(() => ({}))) as any;
    const tx = body?.data;
    if (!tx) return { status: 'pending' as const };
    if (tx.status === 'successful' && Number(tx.amount) >= Number(row.amount) && tx.currency === row.currency_code) {
      await supabaseAdmin.from('financial_transactions').update({ payment_status: 'completed', payment_method: tx.payment_type === 'card' ? 'card' : 'mobile_money' } as any).eq('id', row.id);
      return { status: 'successful' as const };
    }
    if (tx.status === 'failed' || tx.status === 'cancelled') {
      await supabaseAdmin.from('financial_transactions').update({ payment_status: 'failed' } as any).eq('id', row.id);
      return { status: 'failed' as const };
    }
    return { status: 'pending' as const };
  });
