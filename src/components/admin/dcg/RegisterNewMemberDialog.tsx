import React, { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { AlertCircle, UserPlus } from 'lucide-react';
import RegisterMemberForm from '@/components/admin/regional/RegisterMemberForm';
import { useCreateMemberForDcg } from '@/hooks/useDcgMembers';
import { cn } from '@/lib/utils';
import type { Database } from '@/integrations/supabase/types';
import type { NewMemberData } from '@/hooks/useMembers';
import { SheetHeader } from '@/components/admin/dcg/DcgUI';

type DcgMemberRole = Database['public']['Enums']['dcg_member_role'];

const DCG_ROLES: { value: DcgMemberRole; label: string }[] = [
  { value: 'Member', label: 'Member' },
  { value: 'Assistant', label: 'Assistant Leader' },
  { value: 'Leader', label: 'DCG Leader' },
];

interface RegisterNewMemberDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  dcgId: string;
}

const RegisterNewMemberDialog: React.FC<RegisterNewMemberDialogProps> = ({
  open,
  onOpenChange,
  dcgId,
}) => {
  const [dcgRole, setDcgRole] = useState<DcgMemberRole>('Member');
  const createMemberForDcg = useCreateMemberForDcg();

  const handleMemberCreate = (memberData: NewMemberData) => {
    createMemberForDcg.mutate(
      {
        memberData,
        dcgId,
        dcgRole,
      },
      {
        onSuccess: () => {
          onOpenChange(false);
          setDcgRole('Member');
        },
      },
    );
  };

  if (!dcgId) {
    return (
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-md rounded-3xl">
          <DialogHeader>
            <DialogTitle>Register New Member</DialogTitle>
          </DialogHeader>
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              DCG information not available. Please try again later.
            </AlertDescription>
          </Alert>
          <div className="flex justify-end pt-2">
            <Button variant="outline" className="rounded-full" onClick={() => onOpenChange(false)}>
              Close
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="flex max-h-[90vh] max-w-3xl flex-col overflow-hidden rounded-3xl">
        <SheetHeader
          icon={UserPlus}
          title="Register New Member"
          description="Register a new member in your region and add them directly to your DCG."
        />
        <DialogHeader className="sr-only">
          <DialogTitle>Register New Member for DCG</DialogTitle>
          <DialogDescription>
            Register a new member in the regional portal and automatically add them to this DCG.
          </DialogDescription>
        </DialogHeader>

        <div className="min-h-0 flex-1 space-y-5 overflow-y-auto pr-1">
          {/* DCG Role Selector Card */}
          <div className="rounded-2xl border border-border bg-muted/30 p-4">
            <Label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Assign Role in DCG
            </Label>
            <div className="mt-2.5 grid grid-cols-3 gap-1.5 rounded-full border border-border bg-card p-1">
              {DCG_ROLES.map((role) => (
                <button
                  key={role.value}
                  type="button"
                  onClick={() => setDcgRole(role.value)}
                  className={cn(
                    'truncate rounded-full px-3 py-1.5 text-xs font-semibold transition-all',
                    dcgRole === role.value
                      ? 'bg-primary text-primary-foreground shadow-sm'
                      : 'text-muted-foreground hover:text-foreground',
                  )}
                >
                  {role.label}
                </button>
              ))}
            </div>
          </div>

          {/* Regional Member Registration Form */}
          <RegisterMemberForm
            customSubmit={(memberData) => handleMemberCreate(memberData)}
            isLoading={createMemberForDcg.isPending}
          />
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default RegisterNewMemberDialog;
