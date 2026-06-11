import React, { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useFinancialCategories } from "@/hooks/useFinancials";
import { useCurrencies } from "@/hooks/useCurrencies";
import { useCreateGlobalTransaction } from "@/hooks/useGlobalFundraising";
import { useToast } from "@/hooks/use-toast";
import { format } from "date-fns";

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  defaultType?: "Income" | "Expense";
}

const RecordGlobalTransactionDialog: React.FC<Props> = ({ open, onOpenChange, defaultType = "Income" }) => {
  const { toast } = useToast();
  const { data: categories = [] } = useFinancialCategories();
  const { data: currencies = [] } = useCurrencies();
  const create = useCreateGlobalTransaction();

  const [categoryId, setCategoryId] = useState<string>("");
  const [amount, setAmount] = useState<string>("");
  const [description, setDescription] = useState<string>("");
  const [date, setDate] = useState<string>(format(new Date(), "yyyy-MM-dd"));
  const [currency, setCurrency] = useState<string>("USD");

  const filteredCategories = categories.filter((c) => c.type === defaultType);

  const reset = () => {
    setCategoryId("");
    setAmount("");
    setDescription("");
    setDate(format(new Date(), "yyyy-MM-dd"));
  };

  const handleSubmit = async () => {
    if (!categoryId || !amount || !date) {
      toast({ title: "Missing fields", description: "Category, amount and date are required.", variant: "destructive" });
      return;
    }
    try {
      await create.mutateAsync({
        category_id: categoryId,
        amount: Number(amount),
        description: description || null,
        transaction_date: date,
        currency_code: currency,
      });
      toast({ title: `Global ${defaultType.toLowerCase()} recorded` });
      reset();
      onOpenChange(false);
    } catch (e: any) {
      toast({ title: "Failed", description: e?.message || "Unknown error", variant: "destructive" });
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Record Global {defaultType}</DialogTitle>
          <DialogDescription>
            Recorded against the Super Admin's books (no region attribution).
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-3">
          <div>
            <Label>Category</Label>
            <Select value={categoryId} onValueChange={setCategoryId}>
              <SelectTrigger><SelectValue placeholder="Select category" /></SelectTrigger>
              <SelectContent>
                {filteredCategories.map((c) => (
                  <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label>Amount</Label>
              <Input type="number" min="0" step="0.01" value={amount} onChange={(e) => setAmount(e.target.value)} />
            </div>
            <div>
              <Label>Currency</Label>
              <Select value={currency} onValueChange={setCurrency}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {currencies.map((c) => (
                    <SelectItem key={c.code} value={c.code}>{c.code} — {c.symbol}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <div>
            <Label>Date</Label>
            <Input type="date" value={date} onChange={(e) => setDate(e.target.value)} />
          </div>
          <div>
            <Label>Description (optional)</Label>
            <Textarea value={description} onChange={(e) => setDescription(e.target.value)} />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button onClick={handleSubmit} disabled={create.isPending}>{create.isPending ? "Saving…" : "Save"}</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default RecordGlobalTransactionDialog;
