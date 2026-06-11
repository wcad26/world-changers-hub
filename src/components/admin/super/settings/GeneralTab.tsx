import { useEffect, useState } from "react";
import { toast } from "sonner";
import { DollarSign } from "lucide-react";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { GlassSection, GlassSectionHeader } from "@/components/ui/GlassSection";
import { useCurrencies } from "@/hooks/useCurrencies";
import { useBaseCurrencyCode, useUpsertSystemSetting } from "@/hooks/useSystemSettings";

export default function GeneralTab() {
  const { data: currencies = [], isLoading } = useCurrencies();
  const { data: baseCode } = useBaseCurrencyCode();
  const upsert = useUpsertSystemSetting();
  const [selected, setSelected] = useState<string>(baseCode);

  useEffect(() => { setSelected(baseCode); }, [baseCode]);

  const handleSave = async () => {
    if (!selected) return;
    try {
      await upsert.mutateAsync({ key: "base_currency", value: selected });
      toast.success("Base currency updated");
    } catch (e: any) {
      toast.error(e.message || "Failed");
    }
  };

  return (
    <GlassSection>
      <GlassSectionHeader
        icon={<DollarSign className="h-5 w-5" />}
        title="Reporting base currency"
        description="All super admin financial reports aggregate into this currency. Cross-region amounts are converted using the exchange-rate pairs you set on the Currency tab."
      />
      <div className="space-y-5">
        <div className="space-y-2">
          <Label>Base currency</Label>
          <Select value={selected} onValueChange={setSelected} disabled={isLoading}>
            <SelectTrigger className="w-full sm:w-72 bg-background/60 border shadow-sm">
              <SelectValue placeholder={isLoading ? "Loading..." : "Select"} />
            </SelectTrigger>
            <SelectContent className="bg-background border shadow-md z-50 max-h-[300px]">
              {currencies.map((c) => (
                <SelectItem key={c.code} value={c.code}>{c.code} — {c.name} ({c.symbol})</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div>
          <Button onClick={handleSave} disabled={upsert.isPending || selected === baseCode}>
            {upsert.isPending ? "Saving…" : "Save base currency"}
          </Button>
        </div>
      </div>
    </GlassSection>
  );
}
