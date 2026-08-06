import React from "react";
import { CheckCircle2 } from "lucide-react";
import { cn } from "@/lib/utils";

export function GlassSection({
  icon: Icon,
  title,
  description,
  children,
}: {
  icon: React.ElementType;
  title: string;
  description?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="rounded-2xl border border-border/40 bg-card/60 backdrop-blur-sm p-5 md:p-6 space-y-4 shadow-sm">
      <div className="flex items-start gap-2.5 pb-3 border-b border-border/30">
        <div className="flex items-center justify-center w-9 h-9 rounded-xl bg-primary/10 shrink-0">
          <Icon className="h-4 w-4 text-primary" />
        </div>
        <div className="min-w-0">
          <h3 className="text-base font-semibold text-foreground">{title}</h3>
          {description && <p className="text-xs text-muted-foreground mt-0.5">{description}</p>}
        </div>
      </div>
      {children}
    </div>
  );
}

export function StepIndicator<T extends string>({
  step,
  steps,
}: {
  step: T;
  steps: { key: T; label: string }[];
}) {
  const activeIdx = steps.findIndex((s) => s.key === step);
  return (
    <div className="flex items-center justify-center gap-2 md:gap-3">
      {steps.map((s, i) => {
        const done = i < activeIdx;
        const active = i === activeIdx;
        return (
          <div key={s.key} className="flex items-center gap-2 md:gap-3">
            <div className="flex items-center gap-2">
              <div
                className={cn(
                  "flex items-center justify-center h-7 w-7 rounded-full text-xs font-semibold transition-colors",
                  active && "bg-primary text-primary-foreground shadow",
                  done && "bg-primary/80 text-primary-foreground",
                  !active && !done && "bg-muted text-muted-foreground"
                )}
              >
                {done ? <CheckCircle2 className="h-4 w-4" /> : i + 1}
              </div>
              <span
                className={cn(
                  "text-xs md:text-sm font-medium hidden sm:inline",
                  active ? "text-foreground" : "text-muted-foreground"
                )}
              >
                {s.label}
              </span>
            </div>
            {i < steps.length - 1 && (
              <div className={cn("h-px w-6 md:w-10", i < activeIdx ? "bg-primary/60" : "bg-border")} />
            )}
          </div>
        );
      })}
    </div>
  );
}
