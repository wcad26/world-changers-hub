import React, { useState, useMemo } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from '@/components/ui/command';
import { Loader2, Globe, Crown, Check, ChevronsUpDown, Info } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useToast } from '@/hooks/use-toast';
import { useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useRegionMutations } from '@/hooks/useRegionMutations';
import { useTransferMember } from '@/hooks/useMemberTransfer';
import { useEligiblePresidentCandidates, PresidentCandidate } from '@/hooks/useEligiblePresidentCandidates';

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const initialForm = {
  name: '',
  code: '',
  description: '',
  address: '',
  contact_phone: '',
  contact_email: '',
  established_date: '',
};

const CreateRegionGlassDialog: React.FC<Props> = ({ open, onOpenChange }) => {
  const [form, setForm] = useState(initialForm);
  const [presidentMemberId, setPresidentMemberId] = useState<string>('');
  const [pickerOpen, setPickerOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const { toast } = useToast();
  const qc = useQueryClient();
  const { createRegion } = useRegionMutations();
  const transferMember = useTransferMember();
  const { data: candidates = [], isLoading: candidatesLoading } = useEligiblePresidentCandidates();

  const selected: PresidentCandidate | undefined = useMemo(
    () => candidates.find(c => c.id === presidentMemberId),
    [candidates, presidentMemberId]
  );

  const set = (k: keyof typeof initialForm, v: string) => setForm(p => ({ ...p, [k]: v }));

  const reset = () => {
    setForm(initialForm);
    setPresidentMemberId('');
    setSubmitting(false);
  };

  const handleClose = (v: boolean) => {
    if (!v) reset();
    onOpenChange(v);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selected) {
      toast({ title: 'President required', description: 'Select a member to appoint as Regional President.', variant: 'destructive' });
      return;
    }
    if (!selected.profile_id) {
      toast({ title: 'Invalid candidate', description: 'Selected member must have a login profile.', variant: 'destructive' });
      return;
    }

    setSubmitting(true);
    try {
      // 1. Create region
      const presidentName = `${selected.last_name} ${selected.first_name}`.trim();
      const region = await createRegion.mutateAsync({
        name: form.name,
        code: form.code.toUpperCase(),
        description: form.description || null,
        address: form.address || null,
        contact_phone: form.contact_phone || null,
        contact_email: form.contact_email || null,
        regional_president: presidentName,
        established_date: form.established_date || null,
        is_active: true,
      });

      // 2. Transfer member into the new region (if not already there)
      if (selected.region_id !== region.id) {
        await transferMember.mutateAsync({
          memberId: selected.id,
          profileId: selected.profile_id,
          fromRegionId: selected.region_id,
          toRegionId: region.id,
          oldMemberCode: selected.member_id,
          reason: 'Appointed Regional President',
          notes: 'Auto-transfer during region creation',
        });
      }

      // 3. Assign regional_admin role (idempotent)
      const { data: existingRole } = await supabase
        .from('user_roles')
        .select('id')
        .eq('user_id', selected.profile_id)
        .eq('role', 'regional_admin')
        .eq('region_id', region.id)
        .maybeSingle();

      if (!existingRole) {
        const { error: roleErr } = await supabase.from('user_roles').insert({
          user_id: selected.profile_id,
          role: 'regional_admin',
          region_id: region.id,
          is_active: true,
          status: 'active',
        });
        if (roleErr) throw new Error(`Role assignment failed: ${roleErr.message}`);
      }

      qc.invalidateQueries({ queryKey: ['regions'] });
      qc.invalidateQueries({ queryKey: ['all-regions'] });
      qc.invalidateQueries({ queryKey: ['members'] });
      qc.invalidateQueries({ queryKey: ['all-members'] });
      qc.invalidateQueries({ queryKey: ['user_roles'] });
      qc.invalidateQueries({ queryKey: ['locations'] });
      qc.invalidateQueries({ queryKey: ['president-candidates'] });

      toast({
        title: 'Region created',
        description: `${region.name} created. ${presidentName} appointed as Regional President.`,
      });
      handleClose(false);
    } catch (err: any) {
      toast({ title: 'Failed to create region', description: err.message || 'Unknown error', variant: 'destructive' });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto p-0 gap-0 border border-border/40 bg-gradient-to-br from-card/95 to-muted/20 backdrop-blur-xl shadow-2xl rounded-2xl">
        {/* Gradient header */}
        <div className="relative overflow-hidden rounded-t-2xl border-b border-border/30 bg-gradient-to-br from-primary/15 via-primary/5 to-purple-500/10 px-6 pt-6 pb-5">
          <div className="absolute -top-12 -right-12 h-40 w-40 rounded-full bg-primary/20 blur-3xl pointer-events-none" />
          <div className="absolute -bottom-16 -left-10 h-40 w-40 rounded-full bg-purple-500/20 blur-3xl pointer-events-none" />
          <DialogHeader className="relative">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-primary to-purple-600 text-primary-foreground shadow-lg shadow-primary/20">
                <Globe className="h-5 w-5" />
              </div>
              <div>
                <DialogTitle className="text-xl">Create New Region</DialogTitle>
                <DialogDescription className="text-xs">
                  Set up a new WCA regional branch and appoint its first Regional President.
                </DialogDescription>
              </div>
            </div>
          </DialogHeader>
        </div>

        <form onSubmit={handleSubmit} className="px-6 py-5 space-y-5">
          {/* Identity */}
          <div className="rounded-xl border border-border/40 bg-card/50 backdrop-blur-sm p-4 space-y-4">
            <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Region Identity</h3>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label className="text-xs font-medium uppercase tracking-wider text-muted-foreground">Name *</Label>
                <Input required value={form.name} onChange={e => set('name', e.target.value)} placeholder="e.g. North America" className="bg-background/60 border-border/50" />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs font-medium uppercase tracking-wider text-muted-foreground">Code *</Label>
                <Input required maxLength={10} value={form.code} onChange={e => set('code', e.target.value.toUpperCase())} placeholder="e.g. NA" className="bg-background/60 border-border/50 uppercase" />
              </div>
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs font-medium uppercase tracking-wider text-muted-foreground">Description</Label>
              <Textarea value={form.description} onChange={e => set('description', e.target.value)} rows={2} className="bg-background/60 border-border/50 resize-none" placeholder="Brief description of the region…" />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs font-medium uppercase tracking-wider text-muted-foreground">Established Date</Label>
              <Input type="date" value={form.established_date} onChange={e => set('established_date', e.target.value)} className="bg-background/60 border-border/50" />
            </div>
          </div>

          {/* Contact */}
          <div className="rounded-xl border border-border/40 bg-card/50 backdrop-blur-sm p-4 space-y-4">
            <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Contact</h3>
            <div className="space-y-1.5">
              <Label className="text-xs font-medium uppercase tracking-wider text-muted-foreground">Address</Label>
              <Textarea value={form.address} onChange={e => set('address', e.target.value)} rows={2} className="bg-background/60 border-border/50 resize-none" />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label className="text-xs font-medium uppercase tracking-wider text-muted-foreground">Email</Label>
                <Input type="email" value={form.contact_email} onChange={e => set('contact_email', e.target.value)} placeholder="region@wca.org" className="bg-background/60 border-border/50" />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs font-medium uppercase tracking-wider text-muted-foreground">Phone</Label>
                <Input value={form.contact_phone} onChange={e => set('contact_phone', e.target.value)} placeholder="+1 555 123 4567" className="bg-background/60 border-border/50" />
              </div>
            </div>
          </div>

          {/* President */}
          <div className="rounded-xl border border-border/40 bg-card/50 backdrop-blur-sm p-4 space-y-4">
            <div className="flex items-center gap-2">
              <Crown className="h-4 w-4 text-primary" />
              <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Regional President *</h3>
            </div>

            <Popover open={pickerOpen} onOpenChange={setPickerOpen}>
              <PopoverTrigger asChild>
                <Button
                  type="button"
                  variant="outline"
                  role="combobox"
                  className="w-full justify-between bg-background/60 border-border/50 h-auto py-2.5"
                >
                  {selected ? (
                    <div className="flex flex-col items-start text-left">
                      <span className="font-medium">{selected.last_name} {selected.first_name}</span>
                      <span className="text-xs text-muted-foreground">
                        {selected.region_name || '—'} · {selected.member_id}
                      </span>
                    </div>
                  ) : (
                    <span className="text-muted-foreground">
                      {candidatesLoading ? 'Loading members…' : 'Select a registered member…'}
                    </span>
                  )}
                  <ChevronsUpDown className="ml-2 h-4 w-4 opacity-50" />
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-[var(--radix-popover-trigger-width)] p-0" align="start">
                <Command>
                  <CommandInput placeholder="Search by name, email, region…" />
                  <CommandList>
                    <CommandEmpty>No members found.</CommandEmpty>
                    <CommandGroup>
                      {candidates.map(c => {
                        const label = `${c.last_name} ${c.first_name} ${c.email || ''} ${c.region_name || ''} ${c.region_code || ''} ${c.member_id}`;
                        return (
                          <CommandItem
                            key={c.id}
                            value={label}
                            onSelect={() => {
                              setPresidentMemberId(c.id);
                              setPickerOpen(false);
                            }}
                          >
                            <Check className={cn('mr-2 h-4 w-4', presidentMemberId === c.id ? 'opacity-100' : 'opacity-0')} />
                            <div className="flex flex-col">
                              <span className="font-medium">{c.last_name} {c.first_name}</span>
                              <span className="text-xs text-muted-foreground">
                                {c.region_name || '—'} · {c.member_id}
                              </span>
                            </div>
                          </CommandItem>
                        );
                      })}
                    </CommandGroup>
                  </CommandList>
                </Command>
              </PopoverContent>
            </Popover>

            <div className="flex items-start gap-2 rounded-lg border border-primary/20 bg-primary/5 p-3">
              <Info className="h-4 w-4 text-primary mt-0.5 shrink-0" />
              <p className="text-xs text-muted-foreground leading-relaxed">
                The selected member will be <strong>transferred into this new region</strong> (a new member ID is generated, full transfer history preserved) and granted the <strong>Regional Admin</strong> role. They'll be able to log into the regional portal, onboard members, appoint additional admins, and create DCGs.
              </p>
            </div>
          </div>
        </form>

        <DialogFooter className="px-6 py-4 border-t border-border/30 bg-card/40 backdrop-blur-sm rounded-b-2xl gap-2">
          <Button type="button" variant="outline" onClick={() => handleClose(false)} disabled={submitting} className="bg-background/60 border-border/50">
            Cancel
          </Button>
          <Button
            type="button"
            onClick={handleSubmit}
            disabled={submitting || !form.name || !form.code || !selected}
            className="bg-gradient-to-r from-primary to-purple-600 text-primary-foreground shadow-lg shadow-primary/20 hover:shadow-primary/30 hover:opacity-95"
          >
            {submitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Create Region
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default CreateRegionGlassDialog;
