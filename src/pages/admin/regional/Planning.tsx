import React, { useMemo, useState } from 'react';
import { format } from 'date-fns';
import { Target, Plus, Trash2, Pencil, Calendar as CalendarIcon, TrendingUp, AlertTriangle, CheckCircle2, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Progress } from '@/components/ui/progress';
import { Skeleton } from '@/components/ui/skeleton';
import { GlassSection, GlassSectionHeader, GlassKPICard } from '@/components/ui/GlassSection';
import { cn } from '@/lib/utils';
import { useAuth } from '@/hooks/useAuth';
import { useRegionCurrency } from '@/hooks/useCurrencies';
import { formatWithCurrency } from '@/utils/currencyUtils';
import {
  useRegionalPlans,
  useCreateRegionalPlan,
  useUpdateRegionalPlan,
  useDeleteRegionalPlan,
  usePlanTargets,
  useUpsertPlanTarget,
  usePlanInitiatives,
  useCreatePlanInitiative,
  useUpdatePlanInitiative,
  useDeletePlanInitiative,
  METRIC_CATALOG,
  CATEGORY_LABEL,
  type RegionalPlan,
  type PlanTargetCategory,
  type PlanInitiativeStatus,
  type PlanInitiativePriority,
} from '@/hooks/useRegionalPlans';
import { useRegionalPlanActuals } from '@/hooks/useRegionalPlanActuals';

const STATUS_LABEL: Record<PlanInitiativeStatus, string> = {
  not_started: 'Not Started',
  in_progress: 'In Progress',
  done: 'Done',
  blocked: 'Blocked',
};

const STATUS_TONE: Record<PlanInitiativeStatus, string> = {
  not_started: 'bg-muted text-foreground',
  in_progress: 'bg-blue-100 text-blue-800',
  done: 'bg-green-100 text-green-800',
  blocked: 'bg-red-100 text-red-800',
};

const PRIORITY_TONE: Record<PlanInitiativePriority, string> = {
  low: 'bg-muted text-muted-foreground',
  medium: 'bg-amber-100 text-amber-800',
  high: 'bg-red-100 text-red-800',
};

const CATEGORIES: PlanTargetCategory[] = ['growth', 'discipleship', 'events', 'dcg', 'finance'];

const RegionalPlanning: React.FC = () => {
  const { userRegion } = useAuth();
  const { data: currency } = useRegionCurrency(userRegion?.id);
  const fmtMoney = (n: number) => formatWithCurrency(n, currency);

  const { data: plans, isLoading: plansLoading } = useRegionalPlans();
  const [selectedPlanId, setSelectedPlanId] = useState<string | undefined>();
  const [createOpen, setCreateOpen] = useState(false);
  const [editPlanOpen, setEditPlanOpen] = useState(false);

  const activePlan = useMemo<RegionalPlan | undefined>(() => {
    if (!plans?.length) return undefined;
    return plans.find(p => p.id === selectedPlanId) ?? plans[0];
  }, [plans, selectedPlanId]);

  const { data: targets } = usePlanTargets(activePlan?.id);
  const { data: initiatives } = usePlanInitiatives(activePlan?.id);
  const { data: actuals, isLoading: actualsLoading } = useRegionalPlanActuals(
    activePlan?.start_date,
    activePlan?.end_date,
  );

  // Aggregate progress
  const targetsWithActuals = useMemo(() => {
    return (targets ?? []).map(t => {
      const actual = Number(actuals?.[t.metric_key] ?? 0);
      const target = Number(t.target_value) || 0;
      const pct = target > 0 ? Math.min(150, Math.round((actual / target) * 100)) : 0;
      let state: 'on_track' | 'at_risk' | 'achieved' | 'no_target' = 'no_target';
      if (target > 0) {
        if (pct >= 100) state = 'achieved';
        else if (pct >= 70) state = 'on_track';
        else state = 'at_risk';
      }
      return { ...t, actual, pct, state };
    });
  }, [targets, actuals]);

  const onTrackCount = targetsWithActuals.filter(t => t.state === 'on_track' || t.state === 'achieved').length;
  const atRiskCount = targetsWithActuals.filter(t => t.state === 'at_risk').length;
  const overallProgress = targetsWithActuals.length > 0
    ? Math.round(
        targetsWithActuals.reduce((s, t) => s + Math.min(100, t.pct), 0) /
        targetsWithActuals.length,
      )
    : 0;
  const openInitiatives = (initiatives ?? []).filter(i => i.status !== 'done').length;

  if (plansLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-32 w-full" />
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  if (!plans || plans.length === 0) {
    return (
      <>
        <EmptyState onCreate={() => setCreateOpen(true)} />
        <CreatePlanDialog open={createOpen} onOpenChange={setCreateOpen} />
      </>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <GlassSection className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-primary/10 pointer-events-none" />
        <div className="relative">
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 mb-4">
            <div className="flex items-center gap-3 min-w-0">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 text-primary shrink-0">
                <Target className="h-5 w-5" />
              </div>
              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  <h2 className="text-lg font-semibold text-foreground truncate">{activePlan?.title}</h2>
                  <Badge variant={activePlan?.status === 'active' ? 'default' : 'secondary'}>
                    {activePlan?.status}
                  </Badge>
                </div>
                <p className="text-sm text-muted-foreground">
                  {activePlan?.start_date} → {activePlan?.end_date} · {activePlan?.period_type}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2 flex-wrap">
              <Select value={activePlan?.id} onValueChange={setSelectedPlanId}>
                <SelectTrigger className="w-[220px] bg-background/60">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {plans.map(p => (
                    <SelectItem key={p.id} value={p.id}>{p.title}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Button variant="outline" size="sm" onClick={() => setEditPlanOpen(true)}>
                <Pencil className="h-4 w-4 mr-2" /> Edit
              </Button>
              <Button size="sm" onClick={() => setCreateOpen(true)}>
                <Plus className="h-4 w-4 mr-2" /> New plan
              </Button>
            </div>
          </div>

          {activePlan?.mission_statement && (
            <p className="text-sm text-foreground/80 italic max-w-3xl mb-4">
              "{activePlan.mission_statement}"
            </p>
          )}

          {/* KPI strip */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
            <GlassKPICard
              icon={<TrendingUp className="h-4 w-4" />}
              label="Overall Progress"
              value={`${overallProgress}%`}
              isLoading={actualsLoading}
            />
            <GlassKPICard
              icon={<CheckCircle2 className="h-4 w-4" />}
              label="Targets On Track"
              value={onTrackCount}
              isLoading={actualsLoading}
            />
            <GlassKPICard
              icon={<AlertTriangle className="h-4 w-4" />}
              label="Targets At Risk"
              value={atRiskCount}
              isLoading={actualsLoading}
            />
            <GlassKPICard
              icon={<Sparkles className="h-4 w-4" />}
              label="Open Initiatives"
              value={openInitiatives}
            />
          </div>
        </div>
      </GlassSection>

      {/* Targets per category */}
      {CATEGORIES.map(cat => (
        <CategoryTargetsSection
          key={cat}
          planId={activePlan!.id}
          category={cat}
          targets={targetsWithActuals.filter(t => t.category === cat)}
          fmtMoney={fmtMoney}
        />
      ))}

      {/* Initiatives */}
      <InitiativesSection planId={activePlan!.id} />

      {/* Review notes */}
      <ReviewNotesSection plan={activePlan!} />

      <CreatePlanDialog open={createOpen} onOpenChange={setCreateOpen} />
      <EditPlanDialog open={editPlanOpen} onOpenChange={setEditPlanOpen} plan={activePlan!} />
    </div>
  );
};

// ============== Empty state ==============
const EmptyState: React.FC<{ onCreate: () => void }> = ({ onCreate }) => (
  <GlassSection className="text-center py-16">
    <div className="mx-auto h-14 w-14 rounded-2xl bg-primary/10 text-primary flex items-center justify-center mb-4">
      <Target className="h-7 w-7" />
    </div>
    <h2 className="text-xl font-semibold text-foreground mb-2">Set your first plan</h2>
    <p className="text-sm text-muted-foreground max-w-md mx-auto mb-6">
      Define a period, the targets your region aims to hit, and the initiatives that will get you there.
      Actuals are computed automatically from your data.
    </p>
    <Button onClick={onCreate}>
      <Plus className="h-4 w-4 mr-2" /> Create plan
    </Button>
  </GlassSection>
);

// ============== Targets section ==============
type TargetRow = ReturnType<typeof Number> extends never ? never : any;

const CategoryTargetsSection: React.FC<{
  planId: string;
  category: PlanTargetCategory;
  targets: TargetRow[];
  fmtMoney: (n: number) => string;
}> = ({ planId, category, targets, fmtMoney }) => {
  const upsert = useUpsertPlanTarget();
  const metricsInCategory = METRIC_CATALOG.filter(m => m.category === category);

  const formatVal = (val: number, unit: string) => {
    if (unit === 'currency') return fmtMoney(val);
    if (unit === 'percent') return `${val}%`;
    return String(val);
  };

  return (
    <GlassSection>
      <GlassSectionHeader
        icon={<Target className="h-4 w-4" />}
        title={CATEGORY_LABEL[category]}
        description="Set a target — actual values are pulled from your data."
      />
      <div className="grid gap-3">
        {metricsInCategory.map(metric => {
          const existing = targets.find(t => t.metric_key === metric.key);
          const target = existing?.target_value ?? 0;
          const actual = existing?.actual ?? 0;
          const pct = existing?.pct ?? 0;
          const state = existing?.state ?? 'no_target';

          return (
            <div
              key={metric.key}
              className="rounded-xl border border-border/40 bg-background/40 p-4"
            >
              <div className="flex flex-wrap items-center justify-between gap-3 mb-2">
                <div className="min-w-0">
                  <p className="text-sm font-medium text-foreground">{metric.label}</p>
                  <p className="text-xs text-muted-foreground">
                    Actual: <span className="font-medium text-foreground">{formatVal(actual, metric.unit)}</span>
                    {target > 0 && (
                      <> · Target: <span className="font-medium text-foreground">{formatVal(target, metric.unit)}</span></>
                    )}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  {state === 'achieved' && <Badge className="bg-green-100 text-green-800">Achieved</Badge>}
                  {state === 'on_track' && <Badge className="bg-blue-100 text-blue-800">On track</Badge>}
                  {state === 'at_risk' && <Badge className="bg-amber-100 text-amber-800">At risk</Badge>}
                  {state === 'no_target' && <Badge variant="outline">No target</Badge>}
                  <TargetInput
                    value={target}
                    unit={metric.unit}
                    onSave={(v) => upsert.mutate({
                      plan_id: planId,
                      category,
                      metric_key: metric.key,
                      unit: metric.unit,
                      target_value: v,
                    })}
                  />
                </div>
              </div>
              {target > 0 && (
                <Progress
                  value={Math.min(100, pct)}
                  className={cn('h-2', state === 'at_risk' && '[&>div]:bg-amber-500', state === 'achieved' && '[&>div]:bg-green-500')}
                />
              )}
            </div>
          );
        })}
      </div>
    </GlassSection>
  );
};

const TargetInput: React.FC<{
  value: number;
  unit: string;
  onSave: (v: number) => void;
}> = ({ value, unit, onSave }) => {
  const [local, setLocal] = useState(String(value || ''));
  React.useEffect(() => { setLocal(String(value || '')); }, [value]);
  return (
    <div className="flex items-center gap-1">
      <Input
        type="number"
        value={local}
        onChange={(e) => setLocal(e.target.value)}
        onBlur={() => {
          const n = Number(local) || 0;
          if (n !== value) onSave(n);
        }}
        className="h-8 w-24 bg-background/60 text-sm"
        placeholder={unit === 'currency' ? 'Amount' : '0'}
      />
    </div>
  );
};

// ============== Initiatives ==============
const InitiativesSection: React.FC<{ planId: string }> = ({ planId }) => {
  const { data: initiatives, isLoading } = usePlanInitiatives(planId);
  const create = useCreatePlanInitiative();
  const update = useUpdatePlanInitiative();
  const del = useDeletePlanInitiative();
  const [addOpen, setAddOpen] = useState(false);
  const [form, setForm] = useState({
    title: '', description: '', due_date: '', priority: 'medium' as PlanInitiativePriority,
  });

  const grouped = useMemo(() => {
    const g: Record<PlanInitiativeStatus, typeof initiatives> = {
      not_started: [], in_progress: [], done: [], blocked: [],
    };
    (initiatives ?? []).forEach(i => { g[i.status]?.push(i); });
    return g;
  }, [initiatives]);

  const submit = async () => {
    if (!form.title.trim()) return;
    await create.mutateAsync({
      plan_id: planId,
      title: form.title.trim(),
      description: form.description || null,
      due_date: form.due_date || null,
      priority: form.priority,
    });
    setForm({ title: '', description: '', due_date: '', priority: 'medium' });
    setAddOpen(false);
  };

  return (
    <GlassSection>
      <GlassSectionHeader
        icon={<Sparkles className="h-4 w-4" />}
        title="Initiatives & Action Items"
        description="Concrete projects that move the targets forward."
        action={
          <Button size="sm" onClick={() => setAddOpen(true)}>
            <Plus className="h-4 w-4 mr-2" /> Add initiative
          </Button>
        }
      />
      {isLoading ? (
        <Skeleton className="h-40 w-full" />
      ) : (initiatives?.length ?? 0) === 0 ? (
        <p className="text-sm text-muted-foreground text-center py-8">No initiatives yet. Add one to get started.</p>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {(Object.keys(grouped) as PlanInitiativeStatus[]).map(status => (
            <div key={status} className="rounded-xl border border-border/40 bg-background/40 p-3">
              <div className="flex items-center justify-between mb-3">
                <span className={cn('text-xs px-2 py-0.5 rounded-full font-medium', STATUS_TONE[status])}>
                  {STATUS_LABEL[status]}
                </span>
                <span className="text-xs text-muted-foreground">{grouped[status]?.length ?? 0}</span>
              </div>
              <div className="space-y-2">
                {grouped[status]?.map(i => (
                  <div key={i.id} className="rounded-lg border border-border/40 bg-background/60 p-3 group">
                    <div className="flex items-start justify-between gap-2 mb-1">
                      <p className="text-sm font-medium text-foreground">{i.title}</p>
                      <button
                        onClick={() => del.mutate({ id: i.id, planId })}
                        className="opacity-0 group-hover:opacity-100 transition-opacity text-muted-foreground hover:text-destructive"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </div>
                    {i.description && (
                      <p className="text-xs text-muted-foreground mb-2">{i.description}</p>
                    )}
                    <div className="flex items-center justify-between gap-2 flex-wrap">
                      <Badge variant="outline" className={cn('text-[10px]', PRIORITY_TONE[i.priority])}>
                        {i.priority}
                      </Badge>
                      {i.due_date && (
                        <span className="text-[11px] text-muted-foreground flex items-center gap-1">
                          <CalendarIcon className="h-3 w-3" />
                          {format(new Date(i.due_date), 'MMM d')}
                        </span>
                      )}
                    </div>
                    <Select
                      value={i.status}
                      onValueChange={(v: PlanInitiativeStatus) => update.mutate({ id: i.id, status: v, plan_id: i.plan_id })}
                    >
                      <SelectTrigger className="h-7 mt-2 text-xs bg-background/60">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {(Object.keys(STATUS_LABEL) as PlanInitiativeStatus[]).map(s => (
                          <SelectItem key={s} value={s}>{STATUS_LABEL[s]}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}

      <Dialog open={addOpen} onOpenChange={setAddOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>New initiative</DialogTitle>
            <DialogDescription>Describe a project that helps reach this plan's targets.</DialogDescription>
          </DialogHeader>
          <div className="space-y-3">
            <div>
              <Label>Title</Label>
              <Input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} placeholder="e.g. Open new DCG in PK21" />
            </div>
            <div>
              <Label>Description</Label>
              <Textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} rows={3} />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label>Due date</Label>
                <Input type="date" value={form.due_date} onChange={(e) => setForm({ ...form, due_date: e.target.value })} />
              </div>
              <div>
                <Label>Priority</Label>
                <Select value={form.priority} onValueChange={(v: PlanInitiativePriority) => setForm({ ...form, priority: v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="low">Low</SelectItem>
                    <SelectItem value="medium">Medium</SelectItem>
                    <SelectItem value="high">High</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setAddOpen(false)}>Cancel</Button>
            <Button onClick={submit} disabled={!form.title.trim() || create.isPending}>Add</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </GlassSection>
  );
};

// ============== Review notes ==============
const ReviewNotesSection: React.FC<{ plan: RegionalPlan }> = ({ plan }) => {
  const update = useUpdateRegionalPlan();
  const [notes, setNotes] = useState(plan.review_notes ?? '');
  React.useEffect(() => { setNotes(plan.review_notes ?? ''); }, [plan.review_notes]);

  return (
    <GlassSection>
      <GlassSectionHeader
        icon={<Pencil className="h-4 w-4" />}
        title="Review Notes"
        description="Capture wins, blockers and lessons learned for this period."
      />
      <Textarea
        value={notes}
        onChange={(e) => setNotes(e.target.value)}
        onBlur={() => {
          if (notes !== (plan.review_notes ?? '')) {
            update.mutate({ id: plan.id, review_notes: notes || null });
          }
        }}
        rows={5}
        placeholder="Write your reflections..."
        className="bg-background/60"
      />
    </GlassSection>
  );
};

// ============== Create / edit plan dialogs ==============
const todayIso = () => format(new Date(), 'yyyy-MM-dd');
const plusMonthsIso = (months: number) => {
  const d = new Date();
  d.setMonth(d.getMonth() + months);
  return format(d, 'yyyy-MM-dd');
};

const CreatePlanDialog: React.FC<{ open: boolean; onOpenChange: (o: boolean) => void }> = ({ open, onOpenChange }) => {
  const create = useCreateRegionalPlan();
  const [form, setForm] = useState({
    title: '',
    period_type: 'quarter' as 'quarter' | 'year' | 'custom',
    start_date: todayIso(),
    end_date: plusMonthsIso(3),
    mission_statement: '',
    status: 'active' as 'draft' | 'active' | 'closed',
  });

  React.useEffect(() => {
    if (form.period_type === 'quarter') setForm(f => ({ ...f, end_date: plusMonthsIso(3) }));
    else if (form.period_type === 'year') setForm(f => ({ ...f, end_date: plusMonthsIso(12) }));
    // custom: leave as-is
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [form.period_type]);

  const submit = async () => {
    if (!form.title.trim()) return;
    await create.mutateAsync(form);
    onOpenChange(false);
    setForm({
      title: '', period_type: 'quarter', start_date: todayIso(),
      end_date: plusMonthsIso(3), mission_statement: '', status: 'active',
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Create plan</DialogTitle>
          <DialogDescription>Define a planning period for your region.</DialogDescription>
        </DialogHeader>
        <div className="space-y-3">
          <div>
            <Label>Title</Label>
            <Input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} placeholder="e.g. Q3 2026 — Multiply" />
          </div>
          <div className="grid grid-cols-3 gap-3">
            <div>
              <Label>Period</Label>
              <Select value={form.period_type} onValueChange={(v: any) => setForm({ ...form, period_type: v })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="quarter">Quarter</SelectItem>
                  <SelectItem value="year">Year</SelectItem>
                  <SelectItem value="custom">Custom</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Start</Label>
              <Input type="date" value={form.start_date} onChange={(e) => setForm({ ...form, start_date: e.target.value })} />
            </div>
            <div>
              <Label>End</Label>
              <Input type="date" value={form.end_date} onChange={(e) => setForm({ ...form, end_date: e.target.value })} />
            </div>
          </div>
          <div>
            <Label>Mission for this period</Label>
            <Textarea value={form.mission_statement} onChange={(e) => setForm({ ...form, mission_statement: e.target.value })} rows={3} placeholder="What do we want to accomplish?" />
          </div>
          <div>
            <Label>Status</Label>
            <Select value={form.status} onValueChange={(v: any) => setForm({ ...form, status: v })}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="draft">Draft</SelectItem>
                <SelectItem value="active">Active</SelectItem>
                <SelectItem value="closed">Closed</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button onClick={submit} disabled={!form.title.trim() || create.isPending}>Create</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

const EditPlanDialog: React.FC<{
  open: boolean;
  onOpenChange: (o: boolean) => void;
  plan: RegionalPlan;
}> = ({ open, onOpenChange, plan }) => {
  const update = useUpdateRegionalPlan();
  const del = useDeleteRegionalPlan();
  const [form, setForm] = useState({
    title: plan.title,
    start_date: plan.start_date,
    end_date: plan.end_date,
    mission_statement: plan.mission_statement ?? '',
    status: plan.status,
  });
  React.useEffect(() => {
    setForm({
      title: plan.title, start_date: plan.start_date, end_date: plan.end_date,
      mission_statement: plan.mission_statement ?? '', status: plan.status,
    });
  }, [plan]);

  const save = async () => {
    await update.mutateAsync({ id: plan.id, ...form, mission_statement: form.mission_statement || null });
    onOpenChange(false);
  };

  const remove = async () => {
    if (!window.confirm(`Delete plan "${plan.title}"? This cannot be undone.`)) return;
    await del.mutateAsync(plan.id);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Edit plan</DialogTitle>
        </DialogHeader>
        <div className="space-y-3">
          <div>
            <Label>Title</Label>
            <Input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label>Start</Label>
              <Input type="date" value={form.start_date} onChange={(e) => setForm({ ...form, start_date: e.target.value })} />
            </div>
            <div>
              <Label>End</Label>
              <Input type="date" value={form.end_date} onChange={(e) => setForm({ ...form, end_date: e.target.value })} />
            </div>
          </div>
          <div>
            <Label>Mission</Label>
            <Textarea value={form.mission_statement} onChange={(e) => setForm({ ...form, mission_statement: e.target.value })} rows={3} />
          </div>
          <div>
            <Label>Status</Label>
            <Select value={form.status} onValueChange={(v: any) => setForm({ ...form, status: v })}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="draft">Draft</SelectItem>
                <SelectItem value="active">Active</SelectItem>
                <SelectItem value="closed">Closed</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
        <DialogFooter className="justify-between">
          <Button variant="destructive" onClick={remove}>
            <Trash2 className="h-4 w-4 mr-2" /> Delete
          </Button>
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
            <Button onClick={save} disabled={update.isPending}>Save</Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default RegionalPlanning;
