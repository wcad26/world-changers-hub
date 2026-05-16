import React, { useState } from "react";
import { UserPlus } from "lucide-react";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { useCreateDonor, type DonorRow } from "@/hooks/useDonors";

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onCreated: (donor: DonorRow) => void;
  initialName?: string;
}

const RegisterDonorDialog: React.FC<Props> = ({ open, onOpenChange, onCreated, initialName }) => {
  const { toast } = useToast();
  const createDonor = useCreateDonor();

  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [address, setAddress] = useState("");
  const [notes, setNotes] = useState("");

  React.useEffect(() => {
    if (open) {
      const parts = (initialName || "").trim().split(/\s+/);
      setFirstName(parts.slice(1).join(" ") || "");
      setLastName(parts[0] || "");
      setEmail("");
      setPhone("");
      setAddress("");
      setNotes("");
    }
  }, [open, initialName]);

  const handleSubmit = async () => {
    if (!firstName.trim() || !lastName.trim()) {
      toast({ title: "Name required", description: "Enter both first and last name.", variant: "destructive" });
      return;
    }
    if (phone.trim()) {
      const digits = (phone.match(/\d/g) || []).length;
      if (digits < 9) {
        toast({ title: "Invalid phone", description: "Phone must contain at least 9 digits.", variant: "destructive" });
        return;
      }
    }
    if (email.trim() && !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email.trim())) {
      toast({ title: "Invalid email", description: "Enter a valid email address.", variant: "destructive" });
      return;
    }
    try {
      const donor = await createDonor.mutateAsync({
        first_name: firstName,
        last_name: lastName,
        email: email || null,
        phone: phone || null,
        address: address || null,
        notes: notes || null,
      });
      toast({ title: "Donor registered", description: `${donor.last_name} ${donor.first_name} added.` });
      onCreated(donor);
      onOpenChange(false);
    } catch (e: any) {
      const msg = e?.message?.includes("duplicate") ? "A donor with this email already exists in your region." : e?.message || "Please try again.";
      toast({ title: "Failed to register donor", description: msg, variant: "destructive" });
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-y-auto p-0 gap-0 border border-border/40 bg-gradient-to-br from-card/95 to-muted/20 backdrop-blur-xl shadow-2xl rounded-2xl">
        <div className="relative overflow-hidden rounded-t-2xl border-b border-border/30 bg-gradient-to-br from-primary/15 via-primary/5 to-purple-500/10 px-6 pt-6 pb-5">
          <div className="absolute -top-12 -right-12 h-40 w-40 rounded-full bg-primary/20 blur-3xl pointer-events-none" />
          <DialogHeader className="relative space-y-1.5">
            <DialogTitle className="flex items-center gap-3 text-xl">
              <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-primary to-purple-600 text-primary-foreground shadow-lg shadow-primary/20">
                <UserPlus className="h-5 w-5" />
              </span>
              Register New Donor
            </DialogTitle>
            <DialogDescription className="text-sm text-muted-foreground">
              Add a non-member donor so their donations can be tracked over time.
            </DialogDescription>
          </DialogHeader>
        </div>

        <div className="px-6 py-5 space-y-4">
          <div className="rounded-xl border border-border/40 bg-card/50 backdrop-blur-sm p-4 space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label className="text-xs font-medium uppercase tracking-wider text-muted-foreground">Last Name *</Label>
                <Input className="bg-background/60 border-border/50" value={lastName} onChange={(e) => setLastName(e.target.value)} />
              </div>
              <div className="space-y-2">
                <Label className="text-xs font-medium uppercase tracking-wider text-muted-foreground">First Name *</Label>
                <Input className="bg-background/60 border-border/50" value={firstName} onChange={(e) => setFirstName(e.target.value)} />
              </div>
            </div>
            <div className="space-y-2">
              <Label className="text-xs font-medium uppercase tracking-wider text-muted-foreground">Email</Label>
              <Input type="email" className="bg-background/60 border-border/50" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="optional" />
            </div>
            <div className="space-y-2">
              <Label className="text-xs font-medium uppercase tracking-wider text-muted-foreground">Phone</Label>
              <Input className="bg-background/60 border-border/50" value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="optional · 9+ digits" />
            </div>
            <div className="space-y-2">
              <Label className="text-xs font-medium uppercase tracking-wider text-muted-foreground">Address</Label>
              <Input className="bg-background/60 border-border/50" value={address} onChange={(e) => setAddress(e.target.value)} placeholder="optional" />
            </div>
            <div className="space-y-2">
              <Label className="text-xs font-medium uppercase tracking-wider text-muted-foreground">Notes</Label>
              <Textarea rows={2} className="bg-background/60 border-border/50 resize-none" value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="optional" />
            </div>
          </div>
        </div>

        <DialogFooter className="px-6 py-4 border-t border-border/30 bg-card/40 backdrop-blur-sm rounded-b-2xl gap-2">
          <Button variant="outline" onClick={() => onOpenChange(false)} className="bg-background/60 border-border/50">Cancel</Button>
          <Button onClick={handleSubmit} disabled={createDonor.isPending} className="bg-gradient-to-r from-primary to-purple-600 text-primary-foreground shadow-lg shadow-primary/20 hover:shadow-primary/30 hover:opacity-95">
            {createDonor.isPending ? "Saving…" : "Register Donor"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default RegisterDonorDialog;
