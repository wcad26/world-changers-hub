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

async function getFlutterwaveSecret() {
  const { supabaseAdmin } = await import('@/integrations/supabase/client.server');
  const { data: s } = await supabaseAdmin.from('wcbn_payment_settings').select('flutterwave_enabled, flutterwave_mode, mobile_money_enabled, card_enabled').eq('id', 1).maybeSingle();
  const mode = s?.flutterwave_mode === 'live' ? 'live' : 'test';
  const { data: row } = await (supabaseAdmin as any).from('wcbn_payment_credentials').select('secret_key').eq('mode', mode).maybeSingle();
  let secret = typeof row?.secret_key === 'string' && row.secret_key.trim() ? row.secret_key.trim() : null;
  if (!secret && mode === 'live') secret = process.env['FLUTTERWAVE_SECRET_KEY']?.trim() || null;
  return { secret, settings: s, supabaseAdmin };
}

/** Starts an online gift (mobile money push or card checkout) for the signed-in member. */
export const startGiving = createServerFn({ method: 'POST' })
  .middleware([requireSupabaseAuth])
  .inputValidator((d) => z.object({
    kind: z.enum(['tithe', 'offering', 'special']),
    amount: z.number().positive().max(100_000_000),
    method: z.enum(['mobile_money', 'card']),
    phone: z.string().max(20).optional(),
    note: z.string().max(200).optional(),
    origin: z.string().url(),
  }).parse(d))
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;
    const { data: ids } = await supabase.rpc('get_member_ids_for_user', { _user_id: userId });
    const memberId = (ids as string[] | null)?.[0];
    if (!memberId) throw new Error('We could not find your member record. Please contact your region.');

    const { secret, settings, supabaseAdmin } = await getFlutterwaveSecret();
    if (!secret || !settings?.flutterwave_enabled) throw new Error('Online giving is not available right now.');
    if (data.method === 'mobile_money' && !settings.mobile_money_enabled) throw new Error('Mobile money is not available right now.');
    if (data.method === 'card' && !settings.card_enabled) throw new Error('Card payments are not available right now.');

    const { data: member } = await supabaseAdmin.from('members').select('id, region_id').eq('id', memberId).single();
    if (!member?.region_id) throw new Error('Your member record has no region.');
    const { data: region } = await supabaseAdmin.from('regions').select('currency_code').eq('id', member.region_id).single();
    const currency = region?.currency_code || 'XAF';
    const { data: category } = await supabaseAdmin.from('financial_transaction_categories').select('id').eq('name', CATEGORY_NAMES[data.kind]).eq('is_active', true).maybeSingle();
    if (!category) throw new Error('Giving category is not set up.');
    const { data: profile } = await supabase.from('profiles').select('first_name, last_name, email, phone').eq('id', userId).maybeSingle();

    const amount = currency === 'XAF' || currency === 'XOF' ? Math.round(data.amount) : Math.round(data.amount * 100) / 100;
    const txRef = `WCA-GIVE-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
    const name = [profile?.last_name, profile?.first_name].filter(Boolean).join(' ') || 'WCA member';
    const email = profile?.email || 'giving@wcaglobal.org';

    const { error: insErr } = await supabaseAdmin.from('financial_transactions').insert({
      category_id: category.id, amount, currency_code: currency, region_id: member.region_id,
      member_id: memberId, recorded_by: userId, scope: 'regional',
      transaction_date: new Date().toISOString().slice(0, 10),
      description: data.note?.trim() || null,
      payment_method: data.method, payment_reference: txRef, payment_status: 'pending',
    } as any);
    if (insErr) throw new Error('Could not start your gift. Please try again.');

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
      return { txRef, link: auth?.mode === 'redirect' ? (auth.redirect as string) : null, network: phone.network };
    }

    const res = await fetch(`${FLW}/payments`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${secret}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        tx_ref: txRef, amount, currency, payment_options: 'card',
        redirect_url: `${data.origin}/member/finances`,
        customer: { email, name, phonenumber: profile?.phone || undefined },
        customizations: { title: 'World Changers Association', description: `${CATEGORY_NAMES[data.kind]} gift` },
      }),
    });
    const body = (await res.json().catch(() => ({}))) as any;
    if (!res.ok || body.status !== 'success' || !body.data?.link) {
      await supabaseAdmin.from('financial_transactions').update({ payment_status: 'failed' } as any).eq('payment_reference', txRef);
      throw new Error(body.message || 'Could not open card checkout.');
    }
    return { txRef, link: body.data.link as string, network: null };
  });

/** Checks a pending gift with Flutterwave and confirms it once paid. */
export const checkGiving = createServerFn({ method: 'POST' })
  .middleware([requireSupabaseAuth])
  .inputValidator((d) => z.object({ txRef: z.string().min(5).max(80) }).parse(d))
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;
    const { secret, supabaseAdmin } = await getFlutterwaveSecret();
    if (!secret) throw new Error('Online giving is not available right now.');
    const { data: ids } = await supabase.rpc('get_member_ids_for_user', { _user_id: userId });
    const { data: row } = await supabaseAdmin.from('financial_transactions').select('id, amount, currency_code, member_id, payment_status' as any).eq('payment_reference', data.txRef).maybeSingle() as any;
    if (!row || !(ids as string[] | null)?.includes(row.member_id)) throw new Error('Gift not found.');
    if (row.payment_status === 'completed') return { status: 'successful' as const };

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
