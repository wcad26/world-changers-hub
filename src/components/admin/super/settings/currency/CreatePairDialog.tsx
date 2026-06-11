import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { toast } from "sonner";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Plus } from "lucide-react";
import { useCurrencies } from "@/hooks/useCurrencies";
import { useCreateExchangeRate } from "@/hooks/useExchangeRates";

const schema = z
  .object({
    base_code: z.string().length(3),
    quote_code: z.string().length(3),
    bid: z.coerce.number().positive(),
    ask: z.coerce.number().positive(),
  })
  .refine((v) => v.base_code !== v.quote_code, { message: "Base and quote must differ", path: ["quote_code"] })
  .refine((v) => v.ask >= v.bid, { message: "Ask must be greater than or equal to bid", path: ["ask"] });

type FormData = z.infer<typeof schema>;

export default function CreatePairDialog() {
  const [open, setOpen] = useState(false);
  const { data: currencies = [] } = useCurrencies();
  const create = useCreateExchangeRate();
  const form = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: { base_code: "", quote_code: "", bid: 0, ask: 0 },
  });

  const onSubmit = async (v: FormData) => {
    try {
      await create.mutateAsync(v);
      toast.success("Exchange rate created");
      form.reset();
      setOpen(false);
    } catch (e: any) {
      toast.error(e.message || "Failed to create rate");
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="sm"><Plus className="h-4 w-4 mr-1" /> Add pair</Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Add exchange rate pair</DialogTitle>
          <DialogDescription>Define the bid (buy) and ask (sell) rates between two currencies.</DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <FormField control={form.control} name="base_code" render={({ field }) => (
                <FormItem>
                  <FormLabel>Base currency</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value}>
                    <FormControl><SelectTrigger><SelectValue placeholder="Select" /></SelectTrigger></FormControl>
                    <SelectContent>
                      {currencies.map((c) => <SelectItem key={c.code} value={c.code}>{c.code} — {c.name}</SelectItem>)}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )} />
              <FormField control={form.control} name="quote_code" render={({ field }) => (
                <FormItem>
                  <FormLabel>Quote currency</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value}>
                    <FormControl><SelectTrigger><SelectValue placeholder="Select" /></SelectTrigger></FormControl>
                    <SelectContent>
                      {currencies.map((c) => <SelectItem key={c.code} value={c.code}>{c.code} — {c.name}</SelectItem>)}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )} />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <FormField control={form.control} name="bid" render={({ field }) => (
                <FormItem>
                  <FormLabel>Bid (buy)</FormLabel>
                  <FormControl><Input type="number" step="0.0001" {...field} /></FormControl>
                  <FormMessage />
                </FormItem>
              )} />
              <FormField control={form.control} name="ask" render={({ field }) => (
                <FormItem>
                  <FormLabel>Ask (sell)</FormLabel>
                  <FormControl><Input type="number" step="0.0001" {...field} /></FormControl>
                  <FormMessage />
                </FormItem>
              )} />
            </div>
            <p className="text-xs text-muted-foreground">
              1 unit of base = bid/ask units of quote. Mid rate is computed automatically and used in financial reports.
            </p>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
              <Button type="submit" disabled={create.isPending}>{create.isPending ? "Saving…" : "Save"}</Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
