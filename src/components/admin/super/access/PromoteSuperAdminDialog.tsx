import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Check, ChevronsUpDown } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { cn } from '@/lib/utils';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from '@/components/ui/command';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useSuperAdminRoles } from '@/hooks/useSuperAdminRoles';
import { useAssignSuperAdminRole } from '@/hooks/useSuperAdminUsers';

interface Props {
  open: boolean;
  onOpenChange: (o: boolean) => void;
}

/**
 * Promotes an existing member to Super Admin and assigns a role tier in one
 * action. Restricted to Principal Super Admins via RLS.
 */
const PromoteSuperAdminDialog: React.FC<Props> = ({ open, onOpenChange }) => {
  const [pickerOpen, setPickerOpen] = useState(false);
  const [userId, setUserId] = useState('');
  const [roleId, setRoleId] = useState('');

  const { data: roles } = useSuperAdminRoles();
  const assign = useAssignSuperAdminRole();

  // Fetch candidates: any user with a profile that isn't already a super admin
  const { data: candidates } = useQuery({
    queryKey: ['promote-super-admin-candidates'],
    queryFn: async () => {
      const { data: existing } = await supabase
        .from('user_roles')
        .select('user_id, is_active, status')
        .eq('role', 'super_admin');
      const existingActive = new Set(
        (existing ?? [])
          .filter((r: any) => (r.is_active ?? true) && (r.status ?? 'active') === 'active')
          .map((r: any) => r.user_id),
      );

      const { data, error } = await supabase
        .from('profiles')
        .select('id, first_name, last_name, email')
        .order('last_name', { ascending: true, nullsFirst: false })
        .order('first_name', { ascending: true, nullsFirst: false })
        .limit(5000);
      if (error) throw error;
      return (data ?? []).filter((p: any) => !existingActive.has(p.id));
    },
    enabled: open,
  });

  const selected = candidates?.find((c: any) => c.id === userId);

  const reset = () => {
    setUserId('');
    setRoleId('');
    setPickerOpen(false);
  };

  return (
    <Dialog
      open={open}
      onOpenChange={(o) => {
        if (!o) reset();
        onOpenChange(o);
      }}
    >
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Promote to Super Admin</DialogTitle>
          <DialogDescription>
            Grant a user super admin access and assign their role tier.
          </DialogDescription>
        </DialogHeader>

        <Alert className="border-amber-300/40 bg-amber-50/60">
          <AlertDescription className="text-sm">
            This adds the global <strong>super_admin</strong> app role and the chosen tier. The
            user can sign into the super admin portal immediately.
          </AlertDescription>
        </Alert>

        <div className="space-y-4">
          <div className="space-y-1.5">
            <Label>User</Label>
            <Popover open={pickerOpen} onOpenChange={setPickerOpen}>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  role="combobox"
                  className="w-full justify-between font-normal"
                >
                  {selected
                    ? `${selected.last_name ?? ''} ${selected.first_name ?? ''}`.trim() ||
                      selected.email
                    : 'Select a user…'}
                  <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-full p-0" align="start">
                <Command>
                  <CommandInput placeholder="Search users…" />
                  <CommandList>
                    <CommandEmpty>No users found.</CommandEmpty>
                    <CommandGroup>
                      {(candidates ?? []).map((c: any) => (
                        <CommandItem
                          key={c.id}
                          value={`${c.last_name ?? ''} ${c.first_name ?? ''} ${c.email ?? ''}`}
                          onSelect={() => {
                            setUserId(c.id);
                            setPickerOpen(false);
                          }}
                        >
                          <Check
                            className={cn(
                              'mr-2 h-4 w-4',
                              userId === c.id ? 'opacity-100' : 'opacity-0',
                            )}
                          />
                          <div className="flex flex-col">
                            <span className="font-medium">
                              {`${c.last_name ?? ''} ${c.first_name ?? ''}`.trim() || c.email}
                            </span>
                            <span className="text-xs text-muted-foreground">{c.email}</span>
                          </div>
                        </CommandItem>
                      ))}
                    </CommandGroup>
                  </CommandList>
                </Command>
              </PopoverContent>
            </Popover>
          </div>

          <div className="space-y-1.5">
            <Label>Role tier</Label>
            <Select value={roleId} onValueChange={setRoleId}>
              <SelectTrigger>
                <SelectValue placeholder="Choose a role tier" />
              </SelectTrigger>
              <SelectContent>
                {(roles ?? [])
                  .filter((r) => r.is_active)
                  .map((r) => (
                    <SelectItem key={r.id} value={r.id}>
                      {r.is_reserved ? '👑 ' : ''}
                      {r.name}
                    </SelectItem>
                  ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button
            disabled={!userId || !roleId || assign.isPending}
            onClick={async () => {
              await assign.mutateAsync({ userId, roleId });
              reset();
              onOpenChange(false);
            }}
          >
            {assign.isPending ? 'Promoting…' : 'Promote'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default PromoteSuperAdminDialog;
