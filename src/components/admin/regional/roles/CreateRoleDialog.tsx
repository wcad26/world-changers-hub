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
import { useCreateRegionalRole } from '@/hooks/useRegionalRoles';
import {
  PERMISSION_CATALOG,
  PERMISSION_GROUPS,
  getPermissionsByGroup,
} from '@/config/regionalPermissions';

interface CreateRoleDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const ALL_KEYS = PERMISSION_CATALOG.map((p) => p.key);

const CreateRoleDialog: React.FC<CreateRoleDialogProps> = ({ open, onOpenChange }) => {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const createRole = useCreateRegionalRole();

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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;
    try {
      await createRole.mutateAsync({
        name: name.trim(),
        description: description.trim() || undefined,
        permissions: Array.from(selected),
      });
      reset();
      onOpenChange(false);
    } catch (err) {
      console.error('Error creating role:', err);
    }
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
          <DialogTitle>Create new role</DialogTitle>
          <DialogDescription>
            Group permissions by responsibility — for example "Finance Coordinator" or
            "Discipleship Lead".
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid gap-4">
            <div className="space-y-1.5">
              <Label htmlFor="name">Role name *</Label>
              <Input
                id="name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g., Finance Manager"
                required
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="What this role does, in one sentence."
                rows={2}
              />
            </div>
          </div>

          <div>
            <div className="mb-3 flex items-center justify-between">
              <div>
                <Label className="text-base font-semibold">Permissions</Label>
                <p className="text-sm text-muted-foreground">
                  Each permission unlocks a specific page or action.
                </p>
              </div>
              <Button type="button" variant="outline" size="sm" onClick={toggleAll}>
                {ALL_KEYS.every((k) => selected.has(k)) ? 'Clear all' : 'Select all'}
              </Button>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              {PERMISSION_GROUPS.map((group) => {
                const perms = getPermissionsByGroup(group);
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
                            id={`new-${p.key}`}
                            checked={selected.has(p.key)}
                            onCheckedChange={() => toggle(p.key)}
                            className="mt-0.5"
                          />
                          <Label
                            htmlFor={`new-${p.key}`}
                            className="cursor-pointer text-sm leading-tight"
                          >
                            <span className="font-medium">{p.label}</span>
                            <span className="block text-xs text-muted-foreground">
                              {p.hint}
                            </span>
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
            <Button type="submit" disabled={!name.trim() || createRole.isPending}>
              {createRole.isPending ? 'Creating…' : 'Create role'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default CreateRoleDialog;
