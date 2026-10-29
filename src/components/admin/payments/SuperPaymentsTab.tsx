import { useState } from 'react';
import { useServerFn } from '@tanstack/react-start';
import { useQuery } from '@tanstack/react-query';
import { Briefcase, Globe2, MapPin } from 'lucide-react';
import { listPaymentGatewayStatus } from '@/lib/payment-settings.functions';
import PaymentSettingsPanel from './PaymentSettingsPanel';
import { cn } from '@/lib/utils';

export default function SuperPaymentsTab() {
  const list = useServerFn(listPaymentGatewayStatus);
  const { data } = useQuery({
    queryKey: ['payment_gateway_status'],
    queryFn: () => list(),
  });
  const [scope, setScope] = useState('global');

  const label =
    scope === 'global'
      ? 'WCA Head Office'
      : scope.startsWith('wcbn:')
        ? data?.wcbn?.name ?? 'WCBN Connect'
        : data?.regions.find((r) => r.id === scope)?.name ?? 'Region';

  const statusText = (item: {
    ownGateway?: boolean;
    mode?: string | null;
    bank?: boolean;
    allowCentralFallback?: boolean;
  }) => {
    if (item.ownGateway) {
      return {
        text: item.mode === 'test' ? 'Connected (Test)' : 'Connected (Live)',
        cls: item.mode === 'test' ? 'text-amber-600 dark:text-amber-400' : 'text-emerald-600 dark:text-emerald-400',
      };
    }
    if (item.allowCentralFallback) {
      return { text: 'Central Fallback', cls: 'text-amber-600 dark:text-amber-400' };
    }
    if (item.bank) {
      return { text: 'Bank Deposit Only', cls: 'text-blue-600 dark:text-blue-400' };
    }
    return { text: 'Online Blocked', cls: 'text-muted-foreground' };
  };

  const chip = (
    id: string,
    name: string,
    currency: string,
    st: { text: string; cls: string },
    Icon: typeof Globe2,
  ) => (
    <button
      key={id}
      type="button"
      onClick={() => setScope(id)}
      className={cn(
        'flex items-center gap-2.5 rounded-2xl border p-3 text-left transition-all',
        scope === id
          ? 'border-primary bg-primary/10 shadow-xs'
          : 'border-border bg-background/60 hover:border-primary/40',
      )}
    >
      <Icon className="h-4 w-4 shrink-0 text-primary" />
      <span className="min-w-0 flex-1">
        <span className="flex items-center justify-between gap-1">
          <span className="truncate text-sm font-semibold">{name}</span>
          <span className="shrink-0 rounded bg-muted px-1.5 py-0.5 font-mono text-[10px] text-muted-foreground">
            {currency}
          </span>
        </span>
        <span className={cn('block truncate text-[11px] font-medium', st.cls)}>{st.text}</span>
      </span>
    </button>
  );

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 gap-2 sm:grid-cols-2 lg:grid-cols-4">
        {chip(
          'global',
          'WCA Head Office',
          data?.global.currency || 'XAF',
          statusText(data?.global ?? {}),
          Globe2,
        )}
        {data?.wcbn &&
          chip(
            data.wcbn.scope,
            data.wcbn.name,
            data.wcbn.currency || 'XAF',
            statusText(data.wcbn),
            Briefcase,
          )}
        {data?.regions.map((r) =>
          chip(r.id, r.name, r.currency || 'XAF', statusText(r), MapPin),
        )}
      </div>

      <PaymentSettingsPanel key={scope} scope={scope} label={label} />
    </div>
  );
}
