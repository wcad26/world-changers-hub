import React, { useEffect, useMemo, useRef, useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import PeriodSelector, { type PeriodKey, resolvePeriod } from "@/components/admin/regional/finances/PeriodSelector";
import RegionFilterSelect from "@/components/admin/super/finances/RegionFilterSelect";
import DisplayCurrencySelect from "@/components/admin/super/finances/DisplayCurrencySelect";
import GlobalLedgerTab from "@/components/admin/super/finances/GlobalLedgerTab";
import GlobalDcgLedgerTab from "@/components/admin/super/finances/GlobalDcgLedgerTab";
import GlobalFundraisingTab from "@/components/admin/super/finances/GlobalFundraisingTab";
import GlobalBooksTab from "@/components/admin/super/finances/GlobalBooksTab";
import GlobalCampaignsTab from "@/components/admin/super/finances/GlobalCampaignsTab";
import { useSystemSetting } from "@/hooks/useSystemSettings";

const SuperFinances: React.FC = () => {
  const [period, setPeriod] = useState<PeriodKey>("3m");
  const [customRange, setCustomRange] = useState<{ from?: Date; to?: Date }>({});
  const [regionFilter, setRegionFilter] = useState<string>("all");
  // Use raw query so we can distinguish "loading" from "resolved to null".
  const baseQuery = useSystemSetting<string>("base_currency");
  const resolvedBaseCode = (baseQuery.data as string | null) || null;
  const [displayCurrency, setDisplayCurrency] = useState<string>("");
  const userOverrodeRef = useRef(false);
  const range = useMemo(() => resolvePeriod(period, customRange), [period, customRange]);

  // Mirror the resolved base currency until the user explicitly picks one.
  useEffect(() => {
    if (userOverrodeRef.current) return;
    if (baseQuery.isSuccess && resolvedBaseCode && resolvedBaseCode !== displayCurrency) {
      setDisplayCurrency(resolvedBaseCode);
    }
  }, [baseQuery.isSuccess, resolvedBaseCode, displayCurrency]);

  const handleDisplayCurrencyChange = (next: string) => {
    userOverrodeRef.current = true;
    setDisplayCurrency(next);
  };

  const effectiveCurrency = displayCurrency || resolvedBaseCode || "USD";

  return (
    <div className="space-y-6">
      <div className="rounded-2xl border border-border/40 bg-card/60 backdrop-blur-sm p-5 flex flex-col lg:flex-row lg:items-center lg:justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Global Financial Management</h1>
          <p className="text-sm text-muted-foreground">Aggregate finances across all regions, plus Super Admin books and fundraising</p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <DisplayCurrencySelect value={effectiveCurrency} onChange={setDisplayCurrency} />
          <RegionFilterSelect value={regionFilter} onChange={setRegionFilter} />
          <PeriodSelector
            period={period}
            onPeriodChange={setPeriod}
            customRange={customRange}
            onCustomRangeChange={setCustomRange}
          />
        </div>
      </div>

      <Tabs defaultValue="global-books" className="space-y-6">
        <TabsList className="grid grid-cols-2 md:grid-cols-5 w-full max-w-4xl bg-muted/40 backdrop-blur-sm rounded-xl p-1 h-auto">
          <TabsTrigger value="global-books" className="rounded-lg data-[state=active]:bg-card data-[state=active]:shadow-sm data-[state=active]:text-foreground text-muted-foreground h-9">Global Books</TabsTrigger>
          <TabsTrigger value="global-campaigns" className="rounded-lg data-[state=active]:bg-card data-[state=active]:shadow-sm data-[state=active]:text-foreground text-muted-foreground h-9">Global Campaigns</TabsTrigger>
          <TabsTrigger value="regional" className="rounded-lg data-[state=active]:bg-card data-[state=active]:shadow-sm data-[state=active]:text-foreground text-muted-foreground h-9">Regional</TabsTrigger>
          <TabsTrigger value="dcg" className="rounded-lg data-[state=active]:bg-card data-[state=active]:shadow-sm data-[state=active]:text-foreground text-muted-foreground h-9">DCG</TabsTrigger>
          <TabsTrigger value="fundraising" className="rounded-lg data-[state=active]:bg-card data-[state=active]:shadow-sm data-[state=active]:text-foreground text-muted-foreground h-9">Fundraising</TabsTrigger>
        </TabsList>

        <TabsContent value="global-books"><GlobalBooksTab range={range} displayCurrency={effectiveCurrency} /></TabsContent>
        <TabsContent value="global-campaigns"><GlobalCampaignsTab displayCurrency={effectiveCurrency} /></TabsContent>
        <TabsContent value="regional"><GlobalLedgerTab range={range} regionFilter={regionFilter} displayCurrency={effectiveCurrency} /></TabsContent>
        <TabsContent value="dcg"><GlobalDcgLedgerTab range={range} regionFilter={regionFilter} displayCurrency={effectiveCurrency} /></TabsContent>
        <TabsContent value="fundraising"><GlobalFundraisingTab range={range} regionFilter={regionFilter} displayCurrency={effectiveCurrency} /></TabsContent>
      </Tabs>
    </div>
  );
};

export default SuperFinances;
