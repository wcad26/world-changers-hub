import { createServerFn } from '@tanstack/react-start';
import { z } from 'zod';
import { requireSupabaseAuth } from '@/integrations/supabase/auth-middleware';

const GLOBAL = 'global';
const bankSchema = z.object({
  bank_name: z.string().max(120),
  account_name: z.string().max(160),
  account_number: z.string().max(80),
  swift: z.string().max(40).optional().default(''),
  branch: z.string().max(120).optional().default(''),
});

/** Super Admins manage every scope; regional admins only their own region. */
async function assertCanManage(supabase: any, userId: string, scope: string) {
  const { data: isSuper } = await supabase.rpc('is_super_admin_user', { _user_id: userId });
  if (isSuper) return;
  if (scope === GLOBAL) throw new Error('Only Super Admins can manage the head-office gateway.');
  const { data: ok } = await supabase.rpc('has_regional_permission', { _user_id: userId, _region_id: scope, _permission: 'settings_edit' });
  if (!ok) throw new Error('You do not have permission to manage payments for this region.');
}

const mask = (v?: string | null) => (v ? `••••${v.slice(-4)}` : '');

/** Lists which regions run their own gateway (Super Admin overview). */
export const listPaymentGatewayStatus = createServerFn({ method: 'GET' })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    await assertCanManage(context.supabase, context.userId, GLOBAL);
    const { supabaseAdmin } = await import('@/integrations/supabase/client.server');
    const [{ data: regions }, { data: rows }] = await Promise.all([
      supabaseAdmin.from('regions').select('id, name, currency_code').order('name'),
      (supabaseAdmin as any).from('region_payment_settings').select('region_id, flutterwave_enabled, flutterwave_secret_key, flutterwave_mode, bank_transfer_enabled'),
    ]);
    const byRegion = new Map<string | null, any>((rows ?? []).map((r: any) => [r.region_id, r]));
    const status = (r: any) => ({ ownGateway: !!(r?.flutterwave_enabled && r?.flutterwave_secret_key), mode: r?.flutterwave_mode ?? null, bank: !!r?.bank_transfer_enabled });
    return {
      global: status(byRegion.get(null)),
      regions: (regions ?? []).map((g: any) => ({ id: g.id, name: g.name, currency: g.currency_code, ...status(byRegion.get(g.id)) })),
    };
  });

export const getPaymentSettings = createServerFn({ method: 'POST' })
  .middleware([requireSupabaseAuth])
  .inputValidator((d) => z.object({ scope: z.string().min(1) }).parse(d))
  .handler(async ({ data, context }) => {
    await assertCanManage(context.supabase, context.userId, data.scope);
    const { supabaseAdmin } = await import('@/integrations/supabase/client.server');
    let q = (supabaseAdmin as any).from('region_payment_settings').select('*');
    q = data.scope === GLOBAL ? q.is('region_id', null) : q.eq('region_id', data.scope);
    const { data: row } = await q.maybeSingle();
    return {
      flutterwave_enabled: !!row?.flutterwave_enabled,
      flutterwave_mode: (row?.flutterwave_mode === 'test' ? 'test' : 'live') as 'test' | 'live',
      flutterwave_public_key: row?.flutterwave_public_key ?? '',
      secret_key_hint: mask(row?.flutterwave_secret_key),
      encryption_key_hint: mask(row?.flutterwave_encryption_key),
      mobile_money_enabled: row ? !!row.mobile_money_enabled : true,
      card_enabled: row ? !!row.card_enabled : true,
      bank_transfer_enabled: !!row?.bank_transfer_enabled,
      bank_accounts: (Array.isArray(row?.bank_accounts) ? row.bank_accounts : []) as z.infer<typeof bankSchema>[],
      bank_instructions: row?.bank_instructions ?? '',
      updated_at: row?.updated_at ?? null,
    };
  });

export const savePaymentSettings = createServerFn({ method: 'POST' })
  .middleware([requireSupabaseAuth])
  .inputValidator((d) => z.object({
    scope: z.string().min(1),
    flutterwave_enabled: z.boolean(),
    flutterwave_mode: z.enum(['test', 'live']),
    flutterwave_public_key: z.string().max(200),
    secret_key: z.string().max(200).optional(), // blank = keep existing
    encryption_key: z.string().max(200).optional(),
    mobile_money_enabled: z.boolean(),
    card_enabled: z.boolean(),
    bank_transfer_enabled: z.boolean(),
    bank_accounts: z.array(bankSchema).max(5),
    bank_instructions: z.string().max(1000),
  }).parse(d))
  .handler(async ({ data, context }) => {
    await assertCanManage(context.supabase, context.userId, data.scope);
    const { supabaseAdmin } = await import('@/integrations/supabase/client.server');
    const regionId = data.scope === GLOBAL ? null : data.scope;
    let q = (supabaseAdmin as any).from('region_payment_settings').select('id, flutterwave_secret_key');
    q = regionId ? q.eq('region_id', regionId) : q.is('region_id', null);
    const { data: existing } = await q.maybeSingle();

    const patch: Record<string, unknown> = {
      flutterwave_enabled: data.flutterwave_enabled,
      flutterwave_mode: data.flutterwave_mode,
      flutterwave_public_key: data.flutterwave_public_key.trim() || null,
      mobile_money_enabled: data.mobile_money_enabled,
      card_enabled: data.card_enabled,
      bank_transfer_enabled: data.bank_transfer_enabled,
      bank_accounts: data.bank_accounts.filter((b) => b.bank_name.trim() || b.account_number.trim()),
      bank_instructions: data.bank_instructions.trim() || null,
      updated_by: context.userId,
    };
    if (data.secret_key?.trim()) patch.flutterwave_secret_key = data.secret_key.trim();
    if (data.encryption_key?.trim()) patch.flutterwave_encryption_key = data.encryption_key.trim();
    if (data.flutterwave_enabled && !patch.flutterwave_secret_key && !existing?.flutterwave_secret_key) {
      throw new Error('Add the Flutterwave secret key before turning the gateway on.');
    }

    const res = existing
      ? await (supabaseAdmin as any).from('region_payment_settings').update(patch).eq('id', existing.id)
      : await (supabaseAdmin as any).from('region_payment_settings').insert({ ...patch, region_id: regionId });
    if (res.error) throw new Error('Could not save payment settings.');
    return { ok: true };
  });
