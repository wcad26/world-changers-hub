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
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-3">
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
        <TabsList className="grid grid-cols-3 w-full max-w-xl">
          <TabsTrigger value="regional">Regional</TabsTrigger>
          <TabsTrigger value="dcg">DCG</TabsTrigger>
          <TabsTrigger value="fundraising">Fundraising</TabsTrigger>
        </TabsList>

        <TabsContent value="regional"><RegionalLedgerTab range={range} /></TabsContent>
        <TabsContent value="dcg"><DcgLedgerTab range={range} /></TabsContent>
        <TabsContent value="fundraising"><FundraisingLedgerTab range={range} /></TabsContent>
      </Tabs>
    </div>
  );
};

export default RegionalFinances;
