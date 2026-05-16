import React, { useMemo, useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import PeriodSelector, { type PeriodKey, resolvePeriod } from "@/components/admin/regional/finances/PeriodSelector";
import RegionalLedgerTab from "@/components/admin/regional/finances/RegionalLedgerTab";
import DcgLedgerTab from "@/components/admin/regional/finances/DcgLedgerTab";
import FundraisingLedgerTab from "@/components/admin/regional/finances/FundraisingLedgerTab";

const RegionalFinances: React.FC = () => {
  const [period, setPeriod] = useState<PeriodKey>("3m");
  const [customRange, setCustomRange] = useState<{ from?: Date; to?: Date }>({});
  const range = useMemo(() => resolvePeriod(period, customRange), [period, customRange]);

  return (
    <div className="space-y-6">
      {/* Glass header */}
      <div className="rounded-2xl border border-border/40 bg-card/60 backdrop-blur-sm p-5 flex flex-col lg:flex-row lg:items-center lg:justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Financial Management</h1>
          <p className="text-sm text-muted-foreground">Segregated accounting across Regional, DCG and Fundraising ledgers</p>
        </div>
        <PeriodSelector
          period={period}
          onPeriodChange={setPeriod}
          customRange={customRange}
          onCustomRangeChange={setCustomRange}
        />
      </div>

      <Tabs defaultValue="regional" className="space-y-6">
        <TabsList className="grid grid-cols-3 w-full max-w-xl bg-muted/40 backdrop-blur-sm rounded-xl p-1 h-auto">
          <TabsTrigger
            value="regional"
            className="rounded-lg data-[state=active]:bg-card data-[state=active]:shadow-sm data-[state=active]:text-foreground text-muted-foreground h-9"
          >Regional</TabsTrigger>
          <TabsTrigger
            value="dcg"
            className="rounded-lg data-[state=active]:bg-card data-[state=active]:shadow-sm data-[state=active]:text-foreground text-muted-foreground h-9"
          >DCG</TabsTrigger>
          <TabsTrigger
            value="fundraising"
            className="rounded-lg data-[state=active]:bg-card data-[state=active]:shadow-sm data-[state=active]:text-foreground text-muted-foreground h-9"
          >Fundraising</TabsTrigger>
        </TabsList>

        <TabsContent value="regional"><RegionalLedgerTab range={range} /></TabsContent>
        <TabsContent value="dcg"><DcgLedgerTab range={range} /></TabsContent>
        <TabsContent value="fundraising"><FundraisingLedgerTab range={range} /></TabsContent>
      </Tabs>
    </div>
  );
};

export default RegionalFinances;
