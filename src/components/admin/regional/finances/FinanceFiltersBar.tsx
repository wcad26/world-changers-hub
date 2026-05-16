import React from "react";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Search } from "lucide-react";
import { useFinancialCategories } from "@/hooks/useFinancials";

interface Props {
  search: string;
  onSearchChange: (v: string) => void;
  categoryId: string | null;
  onCategoryChange: (v: string | null) => void;
  type: "all" | "income" | "expense";
  onTypeChange: (v: "all" | "income" | "expense") => void;
  extra?: React.ReactNode;
}

const FinanceFiltersBar: React.FC<Props> = ({ search, onSearchChange, categoryId, onCategoryChange, type, onTypeChange, extra }) => {
  const { data: categories = [] } = useFinancialCategories();
  return (
    <div className="flex flex-col md:flex-row md:items-center gap-2">
      <div className="relative flex-1 max-w-sm">
        <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Search transactions..."
          value={search}
          onChange={(e) => onSearchChange(e.target.value)}
          className="pl-8"
        />
      </div>
      <Select value={type} onValueChange={(v) => onTypeChange(v as any)}>
        <SelectTrigger className="w-36"><SelectValue placeholder="Type" /></SelectTrigger>
        <SelectContent>
          <SelectItem value="all">All types</SelectItem>
          <SelectItem value="income">Income</SelectItem>
          <SelectItem value="expense">Expense</SelectItem>
        </SelectContent>
      </Select>
      <Select value={categoryId ?? "all"} onValueChange={(v) => onCategoryChange(v === "all" ? null : v)}>
        <SelectTrigger className="w-48"><SelectValue placeholder="Category" /></SelectTrigger>
        <SelectContent>
          <SelectItem value="all">All categories</SelectItem>
          {categories.map(c => (
            <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
          ))}
        </SelectContent>
      </Select>
      {extra}
    </div>
  );
};

export default FinanceFiltersBar;
