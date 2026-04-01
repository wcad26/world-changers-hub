import React from 'react';
import { Users, DollarSign, Home, MapPin, TrendingUp, TrendingDown, Banknote } from 'lucide-react';
import { formatCurrencyWithSymbol } from '@/utils/currencyUtils';
import type { Currency } from '@/hooks/useCurrencies';

interface KPIData {
  members: { total: number; new: number; active: number; growth: number };
  finance: { income: number; expenses: number; balance: number; growth: number };
  dcg: { total: number; active: number; members: number; attendance: number };
  locations: { total: number; active: number; capacity: number; utilization: number };
}

interface KPICardsProps {
  data: KPIData;
  activeTab: string;
  bankBalance: number;
  selectedPeriod: string;
  regionCurrency?: Currency | null;
}

const GlassKPICard: React.FC<{
  title: string;
  value: string;
  description: string;
  icon: React.ElementType;
  iconColor: string;
  trend?: number | null;
}> = ({ title, value, description, icon: Icon, iconColor, trend }) => (
  <div className="bg-gradient-to-br from-card/95 to-muted/20 backdrop-blur-sm border border-border/30 rounded-2xl shadow-sm p-5 hover:shadow-md transition-all duration-300">
    <div className="flex items-center justify-between mb-3">
      <span className="text-sm font-medium text-muted-foreground">{title}</span>
      <div className={`h-8 w-8 rounded-xl ${iconColor} flex items-center justify-center`}>
        <Icon className="h-4 w-4" />
      </div>
    </div>
    <div className="text-2xl font-bold">{value}</div>
    <div className="flex items-center justify-between mt-1">
      <p className="text-xs text-muted-foreground">{description}</p>
      {trend !== null && trend !== undefined && (
        <div className={`flex items-center gap-1 text-xs font-medium ${trend >= 0 ? 'text-green-600' : 'text-red-600'}`}>
          {trend >= 0 ? <TrendingUp className="h-3 w-3" /> : <TrendingDown className="h-3 w-3" />}
          {Math.abs(trend).toFixed(1)}%
        </div>
      )}
    </div>
  </div>
);

const KPICards: React.FC<KPICardsProps> = ({ data, activeTab, bankBalance, selectedPeriod, regionCurrency }) => {
  const fmt = (amount: number) => formatCurrencyWithSymbol(amount, regionCurrency);

  // Only render for finance, dcg, locations tabs
  if (!['finance', 'dcg', 'locations'].includes(activeTab)) return null;

  const cards = (() => {
    switch (activeTab) {
      case 'finance':
        return [
          { title: 'Bank Balance', value: fmt(bankBalance), description: 'Current available balance', icon: Banknote, iconColor: 'bg-emerald-500/10 text-emerald-600', trend: null },
          { title: 'Total Income', value: fmt(data.finance.income), description: 'This period', icon: DollarSign, iconColor: 'bg-green-500/10 text-green-600', trend: data.finance.growth },
          { title: 'Total Expenses', value: fmt(data.finance.expenses), description: 'This period', icon: DollarSign, iconColor: 'bg-red-500/10 text-red-600', trend: null },
          { title: 'Net Balance', value: fmt(data.finance.balance), description: `${data.finance.growth >= 0 ? '+' : ''}${data.finance.growth.toFixed(1)}% from last period`, icon: data.finance.balance >= 0 ? TrendingUp : TrendingDown, iconColor: data.finance.balance >= 0 ? 'bg-green-500/10 text-green-600' : 'bg-red-500/10 text-red-600', trend: data.finance.growth },
        ];
      case 'dcg':
        return [
          { title: 'Total DCGs', value: data.dcg.total.toLocaleString(), description: `${data.dcg.active} active`, icon: Home, iconColor: 'bg-orange-500/10 text-orange-600', trend: null },
          { title: 'DCG Members', value: data.dcg.members.toLocaleString(), description: data.dcg.total > 0 ? `Avg ${Math.round(data.dcg.members / data.dcg.total)} per DCG` : '0 per DCG', icon: Users, iconColor: 'bg-blue-500/10 text-blue-600', trend: null },
        ];
      case 'locations':
        return [
          { title: 'Total Locations', value: data.locations.total.toLocaleString(), description: `${data.locations.active} active`, icon: MapPin, iconColor: 'bg-indigo-500/10 text-indigo-600', trend: null },
          { title: 'Total Capacity', value: data.locations.capacity.toLocaleString(), description: 'Combined capacity', icon: Users, iconColor: 'bg-blue-500/10 text-blue-600', trend: null },
        ];
      default:
        return [];
    }
  })();

  return (
    <div className={`grid grid-cols-1 md:grid-cols-${Math.min(cards.length, 4)} gap-4`}>
      {cards.map((card, i) => (
        <GlassKPICard key={i} {...card} />
      ))}
    </div>
  );
};

export default KPICards;
