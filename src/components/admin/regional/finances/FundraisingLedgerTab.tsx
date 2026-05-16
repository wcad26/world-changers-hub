import React, { useMemo } from "react";
import { ArrowUpRight, Target, Users, HeartHandshake } from "lucide-react";
import FinanceKpiCard from "./FinanceKpiCard";
import FundraisingTabContent from "@/components/admin/regional/FundraisingTabContent";
import FundraisingTransactionsCard from "./FundraisingTransactionsCard";
import { useFundraisingCampaigns, useRegionDonations } from "@/hooks/useFundraisingCampaigns";
import { useAuth } from "@/hooks/useAuth";
import { useRegionCurrency } from "@/hooks/useCurrencies";
import { formatCurrencyWithSymbol } from "@/utils/currencyUtils";
import type { PeriodRange } from "./PeriodSelector";

interface Props { range: PeriodRange }

const FundraisingLedgerTab: React.FC<Props> = ({ range }) => {
  const { userRegion } = useAuth();
  const { data: regionCurrency } = useRegionCurrency(userRegion?.id);
  const { data: campaigns = [] } = useFundraisingCampaigns();
  const { data: donations = [] } = useRegionDonations(range.from, range.to);

  const overlapping = useMemo(() => {
    const fromMs = range.from.getTime();
    const toMs = range.to.getTime();
    return campaigns.filter((c) => {
      const startMs = c.start_date ? new Date(c.start_date).getTime() : -Infinity;
      const endMs = c.end_date ? new Date(c.end_date).getTime() : Infinity;
      return startMs <= toMs && endMs >= fromMs;
    });
  }, [campaigns, range]);

  const totalRaised = donations.reduce((a: number, d: any) => a + Number(d.amount || 0), 0) / 100;
  const totalGoal = overlapping.reduce((a, c) => a + Number(c.goal || 0), 0) / 100;
  const activeCount = overlapping.filter((c) => c.status === "Active").length;
  const completionPct = totalGoal > 0 ? Math.min(100, Math.round((totalRaised / totalGoal) * 100)) : 0;

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
      <FundraisingTransactionsCard range={range} />
    </div>
  );
};

export default FundraisingLedgerTab;
