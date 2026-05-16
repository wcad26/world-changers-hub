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
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <UserPlus className="h-5 w-5 text-primary" /> Register New Donor
          </DialogTitle>
          <DialogDescription>Add a non-member donor so their donations can be tracked over time.</DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label>Last Name *</Label>
              <Input value={lastName} onChange={(e) => setLastName(e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label>First Name *</Label>
              <Input value={firstName} onChange={(e) => setFirstName(e.target.value)} />
            </div>
          </div>
          <div className="space-y-2">
            <Label>Email</Label>
            <Input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="optional" />
          </div>
          <div className="space-y-2">
            <Label>Phone</Label>
            <Input value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="optional · 9+ digits" />
          </div>
          <div className="space-y-2">
            <Label>Address</Label>
            <Input value={address} onChange={(e) => setAddress(e.target.value)} placeholder="optional" />
          </div>
          <div className="space-y-2">
            <Label>Notes</Label>
            <Textarea rows={2} value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="optional" />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button onClick={handleSubmit} disabled={createDonor.isPending} className="bg-gradient-to-r from-primary to-purple-600 text-primary-foreground">
            {createDonor.isPending ? "Saving…" : "Register Donor"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default RegisterDonorDialog;
