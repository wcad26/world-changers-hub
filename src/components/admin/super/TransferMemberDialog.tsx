import React, { useState } from 'react';
import {
  Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { ArrowRight, AlertTriangle } from 'lucide-react';
import { useAllRegions } from '@/hooks/useAllRegions';
import { useTransferMember } from '@/hooks/useMemberTransfer';

interface TransferMemberDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  member: any;
  onSuccess: () => void;
}

const TransferMemberDialog: React.FC<TransferMemberDialogProps> = ({
  open, onOpenChange, member, onSuccess,
}) => {
  const [toRegionId, setToRegionId] = useState('');
  const [reason, setReason] = useState('');
  const [notes, setNotes] = useState('');
  const [confirmStep, setConfirmStep] = useState(false);

  const { data: regions = [] } = useAllRegions();
  const transferMutation = useTransferMember();

  const availableRegions = regions.filter(
    (r: any) => r.id !== member?.region_id && r.is_active
  );
  const selectedRegion = regions.find((r: any) => r.id === toRegionId);

  const handleTransfer = async () => {
    await transferMutation.mutateAsync({
      memberId: member.id,
      profileId: member.profile_id,
      fromRegionId: member.region_id,
      toRegionId,
      oldMemberCode: member.member_id,
      reason,
      notes,
    });
    resetAndClose();
    onSuccess();
  };

  const resetAndClose = () => {
    setToRegionId('');
    setReason('');
    setNotes('');
    setConfirmStep(false);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={(v) => { if (!v) resetAndClose(); else onOpenChange(v); }}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Transfer Member to Another Region</DialogTitle>
          <DialogDescription>
            Move {member?.profiles?.first_name} {member?.profiles?.last_name} to a different region. All historical records will be preserved.
          </DialogDescription>
        </DialogHeader>

        {!confirmStep ? (
          <div className="space-y-4">
            {/* Current region */}
            <div className="space-y-1">
              <Label className="text-muted-foreground text-xs">Current Region</Label>
              <div className="flex items-center gap-2">
                <Badge variant="outline">{member?.regions?.name || 'Unknown'}</Badge>
                <span className="text-xs text-muted-foreground">({member?.member_id})</span>
              </div>
            </div>

            {/* Destination region */}
            <div className="space-y-1">
              <Label>Destination Region *</Label>
              <Select value={toRegionId} onValueChange={setToRegionId}>
                <SelectTrigger>
                  <SelectValue placeholder="Select destination region" />
                </SelectTrigger>
                <SelectContent>
                  {availableRegions.map((r: any) => (
                    <SelectItem key={r.id} value={r.id}>{r.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Reason */}
            <div className="space-y-1">
              <Label>Reason for Transfer</Label>
              <Textarea
                placeholder="e.g. Member relocated to a new city"
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                rows={2}
              />
            </div>

            {/* Notes */}
            <div className="space-y-1">
              <Label>Additional Notes</Label>
              <Textarea
                placeholder="Any additional details..."
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                rows={2}
              />
            </div>

            <DialogFooter>
              <Button variant="outline" onClick={resetAndClose}>Cancel</Button>
              <Button disabled={!toRegionId} onClick={() => setConfirmStep(true)}>
                Review Transfer
              </Button>
            </DialogFooter>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="rounded-lg border bg-muted/30 p-4 space-y-3">
              <h4 className="font-medium text-sm">Transfer Summary</h4>

              <div className="flex items-center gap-3 text-sm">
                <Badge variant="outline">{member?.regions?.name}</Badge>
                <ArrowRight className="h-4 w-4 text-muted-foreground" />
                <Badge className="bg-primary text-primary-foreground">{selectedRegion?.name}</Badge>
              </div>

              <div className="text-xs text-muted-foreground space-y-1">
                <p><strong>Member:</strong> {member?.profiles?.first_name} {member?.profiles?.last_name}</p>
                <p><strong>Current ID:</strong> {member?.member_id} → <strong>New ID:</strong> Will be generated for {selectedRegion?.code || selectedRegion?.name}</p>
                {reason && <p><strong>Reason:</strong> {reason}</p>}
                {notes && <p><strong>Notes:</strong> {notes}</p>}
              </div>
            </div>

            <div className="flex items-start gap-2 rounded-lg border border-yellow-200 bg-yellow-50 p-3 dark:border-yellow-800 dark:bg-yellow-950">
              <AlertTriangle className="h-4 w-4 text-yellow-600 mt-0.5 shrink-0" />
              <div className="text-xs text-yellow-800 dark:text-yellow-200">
                <p className="font-medium">What will happen:</p>
                <ul className="list-disc ml-4 mt-1 space-y-0.5">
                  <li>Member's region will change to {selectedRegion?.name}</li>
                  <li>A new member ID will be generated for the new region</li>
                  <li>All attendance, certificates, and other records remain intact</li>
                  <li>Member portal access is unaffected</li>
                </ul>
              </div>
            </div>

            <DialogFooter>
              <Button variant="outline" onClick={() => setConfirmStep(false)}>Back</Button>
              <Button 
                onClick={handleTransfer} 
                disabled={transferMutation.isPending}
              >
                {transferMutation.isPending ? 'Transferring...' : 'Confirm Transfer'}
              </Button>
            </DialogFooter>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
};

export default TransferMemberDialog;
