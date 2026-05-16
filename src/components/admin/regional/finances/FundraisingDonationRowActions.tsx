import React, { useState } from "react";
import { MoreHorizontal, Eye, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { useDeleteDonation } from "@/hooks/useFundraisingCampaigns";
import ViewDonationDialog from "./ViewDonationDialog";

interface Props {
  donation: any;
  onView?: () => void;
}

const FundraisingDonationRowActions: React.FC<Props> = ({ donation, onView }) => {
  const [viewOpen, setViewOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const deleteMutation = useDeleteDonation();

  const handleDelete = async () => {
    try {
      await deleteMutation.mutateAsync(donation.id);
      toast.success("Donation deleted");
      setDeleteOpen(false);
    } catch (e: any) {
      toast.error("Failed to delete donation", { description: e?.message });
    }
  };

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" size="icon" className="h-8 w-8" onClick={(e) => e.stopPropagation()}>
            <MoreHorizontal className="h-4 w-4" />
            <span className="sr-only">Open actions</span>
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-40">
          <DropdownMenuItem onClick={() => (onView ? onView() : setViewOpen(true))}>
            <Eye className="mr-2 h-4 w-4" /> View details
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => setDeleteOpen(true)} className="text-destructive focus:text-destructive">
            <Trash2 className="mr-2 h-4 w-4" /> Delete
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      {!onView && (
        <ViewDonationDialog open={viewOpen} onOpenChange={setViewOpen} donation={donation} />
      )}

      <AlertDialog open={deleteOpen} onOpenChange={setDeleteOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete donation?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently remove this donation
              {donation.campaign?.name ? <> from <span className="font-semibold">{donation.campaign.name}</span></> : null}
              {" "}and update the campaign's total raised. This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              disabled={deleteMutation.isPending}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {deleteMutation.isPending ? "Deleting..." : "Delete"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
};

export default FundraisingDonationRowActions;
