import React from "react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useAllRegions } from "@/hooks/useAllRegions";
import { Globe } from "lucide-react";

interface Props {
  value: string; // "all" | "global" | uuid
  onChange: (v: string) => void;
  includeGlobal?: boolean;
}

const RegionFilterSelect: React.FC<Props> = ({ value, onChange, includeGlobal = true }) => {
  const { data: regions = [] } = useAllRegions();
  return (
    <Select value={value} onValueChange={onChange}>
      <SelectTrigger className="w-56 h-9 bg-card/60 backdrop-blur-sm border-border/40">
        <Globe className="mr-1.5 h-3.5 w-3.5 text-muted-foreground" />
        <SelectValue placeholder="Region" />
      </SelectTrigger>
      <SelectContent>
        <SelectItem value="all">All Regions</SelectItem>
        {includeGlobal && <SelectItem value="global">Global (Super Admin)</SelectItem>}
        {regions.map((r) => (
          <SelectItem key={r.id} value={r.id}>
            {r.name}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
};

export default RegionFilterSelect;
