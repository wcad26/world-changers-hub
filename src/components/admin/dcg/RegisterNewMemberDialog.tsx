import React, { useState } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import RegisterMemberForm from '@/components/admin/regional/RegisterMemberForm';
import { useCreateMemberForDcg } from '@/hooks/useDcgMembers';
import type { Database } from '@/integrations/supabase/types';
import type { NewMemberData } from '@/hooks/useMembers';

type DcgMemberRole = Database['public']['Enums']['dcg_member_role'];

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
          setDcgRole('Member'); // Reset role
        },
      }
    );
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle>Register New Member for DCG</DialogTitle>
          <DialogDescription>
            Register a new member in the regional portal and automatically add them to this DCG.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 flex-1 overflow-y-auto">
          {/* DCG Role Selection */}
          <div className="space-y-2">
            <Label htmlFor="dcg-role">DCG Role</Label>
            <Select value={dcgRole} onValueChange={(value) => setDcgRole(value as DcgMemberRole)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Member">Member</SelectItem>
                <SelectItem value="Assistant">Assistant</SelectItem>
                <SelectItem value="Leader">Leader</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Member Registration Form */}
          <div className="border-t pt-6">
            <RegisterMemberForm
              customSubmit={(memberData) => handleMemberCreate(memberData)}
              isLoading={createMemberForDcg.isPending}
            />
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default RegisterNewMemberDialog;