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
  incomeType?: "all" | "tithes" | "offerings" | "special";
  onIncomeTypeChange?: (v: "all" | "tithes" | "offerings" | "special") => void;
  expenseCategoryId?: string | null;
  onExpenseCategoryChange?: (v: string | null) => void;
  extra?: React.ReactNode;
}

const FinanceFiltersBar: React.FC<Props> = ({
  search, onSearchChange,
  categoryId, onCategoryChange,
  type, onTypeChange,
  incomeType, onIncomeTypeChange,
  expenseCategoryId, onExpenseCategoryChange,
  extra,
}) => {
  const { data: categories = [] } = useFinancialCategories();
  const showIncomeType = !!onIncomeTypeChange && (type === "all" || type === "income");
  const showExpenseCategory = !!onExpenseCategoryChange && (type === "all" || type === "expense");
  const expenseCategories = categories.filter((c) => c.type === "Expense");
  return (
    <div className="flex flex-col md:flex-row md:items-center gap-2 rounded-xl border border-border/40 bg-card/60 backdrop-blur-sm px-2.5 py-2">
      <div className="relative flex-1 min-w-[200px] max-w-sm">
        <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Search transactions..."
          value={search}
          onChange={(e) => onSearchChange(e.target.value)}
          className="pl-8 h-9 bg-background/60 border-border/40"
        />
      </div>
      <Select value={type} onValueChange={(v) => onTypeChange(v as any)}>
        <SelectTrigger className="w-36 h-9 bg-background/60 border-border/40"><SelectValue placeholder="Type" /></SelectTrigger>
        <SelectContent>
          <SelectItem value="all">All types</SelectItem>
          <SelectItem value="income">Income</SelectItem>
          <SelectItem value="expense">Expense</SelectItem>
        </SelectContent>
      </Select>
      {showIncomeType && (
        <Select value={incomeType ?? "all"} onValueChange={(v) => onIncomeTypeChange!(v as any)}>
          <SelectTrigger className="w-44 h-9 bg-background/60 border-border/40"><SelectValue placeholder="Income type" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All income types</SelectItem>
            <SelectItem value="tithes">Tithes</SelectItem>
            <SelectItem value="offerings">Offerings</SelectItem>
            <SelectItem value="special">Special Giving</SelectItem>
          </SelectContent>
        </Select>
      )}
      {showExpenseCategory && (
        <Select
          value={expenseCategoryId ?? "all"}
          onValueChange={(v) => onExpenseCategoryChange!(v === "all" ? null : v)}
        >
          <SelectTrigger className="w-52 h-9 bg-background/60 border-border/40"><SelectValue placeholder="Expense category" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All expense categories</SelectItem>
            {expenseCategories.map((c) => (
              <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      )}
      {extra}
    </div>
  );
};

export default FinanceFiltersBar;
