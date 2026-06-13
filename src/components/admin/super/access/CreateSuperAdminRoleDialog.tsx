import React, { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useCreateSuperAdminRole } from '@/hooks/useSuperAdminRoles';
import {
  SUPER_PERMISSION_CATALOG,
  SUPER_PERMISSION_GROUPS,
  getSuperPermissionsByGroup,
} from '@/config/superAdminPermissions';

interface Props {
  open: boolean;
  onOpenChange: (o: boolean) => void;
}

const ALL_KEYS = SUPER_PERMISSION_CATALOG.map((p) => p.key);

const CreateSuperAdminRoleDialog: React.FC<Props> = ({ open, onOpenChange }) => {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const create = useCreateSuperAdminRole();

  const reset = () => {
    setName('');
    setDescription('');
    setSelected(new Set());
  };

  const toggle = (key: string) =>
    setSelected((prev) => {
      const next = new Set(prev);
      next.has(key) ? next.delete(key) : next.add(key);
      return next;
    });

  const toggleGroup = (keys: string[]) => {
    const allOn = keys.every((k) => selected.has(k));
    setSelected((prev) => {
      const next = new Set(prev);
      keys.forEach((k) => (allOn ? next.delete(k) : next.add(k)));
      return next;
    });
  };

  const toggleAll = () => {
    const allOn = ALL_KEYS.every((k) => selected.has(k));
    setSelected(allOn ? new Set() : new Set(ALL_KEYS));
  };

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;
    await create.mutateAsync({
      name: name.trim(),
      description: description.trim() || undefined,
      permissions: Array.from(selected),
    });
    reset();
    onOpenChange(false);
  };

  return (
    <Dialog
      open={open}
      onOpenChange={(o) => {
        if (!o) reset();
        onOpenChange(o);
      }}
    >
      <DialogContent className="max-h-[85vh] max-w-4xl overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Create super admin role tier</DialogTitle>
          <DialogDescription>
            Group capabilities by responsibility — e.g., "Operations Lead" or "Finance Reviewer".
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={submit} className="space-y-6">
          <div className="grid gap-4">
            <div className="space-y-1.5">
              <Label htmlFor="sa-name">Role name *</Label>
              <Input
                id="sa-name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g., Operations Lead"
                required
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="sa-desc">Description</Label>
              <Textarea
                id="sa-desc"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="What this role tier does, in one sentence."
                rows={2}
              />
            </div>
          </div>

          <div>
            <div className="mb-3 flex items-center justify-between">
              <div>
                <Label className="text-base font-semibold">Permissions</Label>
                <p className="text-sm text-muted-foreground">
                  Each permission unlocks a specific super admin page or capability.
                </p>
              </div>
              <Button type="button" variant="outline" size="sm" onClick={toggleAll}>
                {ALL_KEYS.every((k) => selected.has(k)) ? 'Clear all' : 'Select all'}
              </Button>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              {SUPER_PERMISSION_GROUPS.map((group) => {
                const perms = getSuperPermissionsByGroup(group);
                const keys = perms.map((p) => p.key);
                const allOn = keys.every((k) => selected.has(k));
                const someOn = keys.some((k) => selected.has(k));
                return (
                  <Card key={group}>
                    <CardHeader className="pb-3">
                      <CardTitle className="flex items-center gap-2 text-sm">
                        <Checkbox
                          checked={allOn ? true : someOn ? 'indeterminate' : false}
                          onCheckedChange={() => toggleGroup(keys)}
                        />
                        {group}
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-2.5">
                      {perms.map((p) => (
                        <div key={p.key} className="flex items-start gap-2 pl-6">
                          <Checkbox
                            id={`sa-new-${p.key}`}
                            checked={selected.has(p.key)}
                            onCheckedChange={() => toggle(p.key)}
                            className="mt-0.5"
                          />
                          <Label
                            htmlFor={`sa-new-${p.key}`}
                            className="cursor-pointer text-sm leading-tight"
                          >
                            <span className="font-medium">{p.label}</span>
                            <span className="block text-xs text-muted-foreground">{p.hint}</span>
                          </Label>
                        </div>
                      ))}
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          </div>

          <div className="flex justify-end gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => {
                reset();
                onOpenChange(false);
              }}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={!name.trim() || create.isPending}>
              {create.isPending ? 'Creating…' : 'Create role'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default CreateSuperAdminRoleDialog;
