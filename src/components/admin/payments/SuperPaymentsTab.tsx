import { useState } from 'react';
import { useServerFn } from '@tanstack/react-start';
import { useQuery } from '@tanstack/react-query';
import { Globe2, MapPin } from 'lucide-react';
import { listPaymentGatewayStatus } from '@/lib/payment-settings.functions';
import PaymentSettingsPanel from './PaymentSettingsPanel';
import { cn } from '@/lib/utils';

export default function SuperPaymentsTab() {
  const list = useServerFn(listPaymentGatewayStatus);
  const { data } = useQuery({ queryKey: ['payment_gateway_status'], queryFn: () => list() });
  const [scope, setScope] = useState('global');
  const label = scope === 'global' ? 'Head office' : data?.regions.find((r) => r.id === scope)?.name ?? 'Region';

  const chip = (id: string, name: string, own: boolean, Icon: typeof Globe2) => (
    <button key={id} type="button" onClick={() => setScope(id)} className={cn('flex items-center gap-2 rounded-2xl border p-3 text-left transition-colors', scope === id ? 'border-primary bg-primary/5' : 'border-border bg-background/60')}>
      <Icon className="h-4 w-4 shrink-0 text-primary" />
      <span className="min-w-0"><span className="block truncate text-sm font-semibold">{name}</span><span className={cn('block text-[11px]', own ? 'text-success' : 'text-muted-foreground')}>{own ? 'Own account' : id === 'global' ? 'Not set' : 'Head office'}</span></span>
    </button>
  );

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-5">
        {chip('global', 'Head office', !!data?.global.ownGateway, Globe2)}
        {data?.regions.map((r) => chip(r.id, r.name, r.ownGateway, MapPin))}
      </div>
      <PaymentSettingsPanel key={scope} scope={scope} label={label} />
    </div>
  );
}
