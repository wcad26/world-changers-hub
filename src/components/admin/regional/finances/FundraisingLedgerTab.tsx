import React, { useMemo } from "react";
import { ArrowUpRight, Target, Users, HeartHandshake } from "lucide-react";
import FinanceKpiCard from "./FinanceKpiCard";
import FundraisingTabContent from "@/components/admin/regional/FundraisingTabContent";
import FundraisingTransactionsCard from "./FundraisingTransactionsCard";
import { useFundraisingCampaigns } from "@/hooks/useFundraisingCampaigns";
import { useAuth } from "@/hooks/useAuth";
import { useRegionCurrency } from "@/hooks/useCurrencies";
import { formatCurrencyWithSymbol } from "@/utils/currencyUtils";
import type { PeriodRange } from "./PeriodSelector";

interface Props { range: PeriodRange }

const FundraisingLedgerTab: React.FC<Props> = ({ range }) => {
  const { userRegion } = useAuth();
  const { data: regionCurrency } = useRegionCurrency(userRegion?.id);
  const { data: campaigns = [] } = useFundraisingCampaigns();

  const inRange = useMemo(() => campaigns.filter(c => {
    const start = new Date(c.start_date).getTime();
    const end = new Date(c.end_date).getTime();
    return end >= range.from.getTime() && start <= range.to.getTime();
  }), [campaigns, range]);

  const totalRaised = inRange.reduce((a, c) => a + (c.raised || 0), 0) / 100;
  const totalGoal = inRange.reduce((a, c) => a + (c.goal || 0), 0) / 100;
  const activeCount = inRange.filter(c => c.status === "Active").length;
  const completionPct = totalGoal > 0 ? Math.round((totalRaised / totalGoal) * 100) : 0;

  const fc = (n: number) => formatCurrencyWithSymbol(n, regionCurrency);

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <FinanceKpiCard label="Total Raised" value={fc(totalRaised)} icon={ArrowUpRight} tone="income" hint="In selected period" />
        <FinanceKpiCard label="Combined Goal" value={fc(totalGoal)} icon={Target} tone="neutral" />
        <FinanceKpiCard label="Goal Progress" value={`${completionPct}%`} icon={HeartHandshake} tone="warning" />
        <FinanceKpiCard label="Active Campaigns" value={activeCount} icon={Users} tone="info" />
      </div>
      <FundraisingTabContent />
    </div>
  );
};

export default FundraisingLedgerTab;
