import React from "react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Coins } from "lucide-react";
import { useCurrencies } from "@/hooks/useCurrencies";
import { useBaseCurrencyCode } from "@/hooks/useSystemSettings";

interface Props {
  value: string;
  onChange: (code: string) => void;
}

const DisplayCurrencySelect: React.FC<Props> = ({ value, onChange }) => {
  const { data: currencies = [] } = useCurrencies();
  const { data: baseCode } = useBaseCurrencyCode();

  return (
    <Select value={value} onValueChange={onChange}>
      <SelectTrigger className="w-[180px] bg-card/60 backdrop-blur-sm border-border/40">
        <Coins className="h-4 w-4 text-muted-foreground mr-1" />
        <SelectValue placeholder="Display currency" />
      </SelectTrigger>
      <SelectContent>
        {currencies.map((c) => (
          <SelectItem key={c.code} value={c.code}>
            <span className="font-medium">{c.code}</span>
            <span className="text-muted-foreground ml-2">{c.symbol}</span>
            {c.code === baseCode && <span className="ml-2 text-[10px] text-primary">(Base)</span>}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
};

export default DisplayCurrencySelect;
