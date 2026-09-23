export const CHART_COLORS = {
  members: "var(--chart-1)",
  visitors: "var(--chart-2)",
  children: "var(--chart-3)",
  expense: "var(--chart-4)",
  income: "var(--chart-5)",
  total: "var(--chart-6)",
  violet: "var(--chart-7)",
  cyan: "var(--chart-8)",
  neutral: "var(--chart-neutral)",
  target: "var(--chart-4)",
  goal: "var(--chart-3)",
  pledge: "var(--chart-7)",
} as const;

export const CHART_PALETTE = [
  CHART_COLORS.members,
  CHART_COLORS.visitors,
  CHART_COLORS.children,
  CHART_COLORS.total,
  CHART_COLORS.income,
  CHART_COLORS.violet,
  CHART_COLORS.cyan,
  CHART_COLORS.expense,
] as const;

export const chartTooltipStyle = {
  backgroundColor: "var(--card)",
  border: "1px solid var(--border)",
  borderRadius: "8px",
  color: "var(--foreground)",
  fontSize: "12px",
  boxShadow: "var(--shadow-card)",
};

export const chartAxisTick = {
  fill: "var(--muted-foreground)",
  fontSize: 11,
};