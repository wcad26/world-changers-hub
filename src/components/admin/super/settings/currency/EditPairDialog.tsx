import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { toast } from "sonner";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { useUpdateExchangeRate, type ExchangeRate } from "@/hooks/useExchangeRates";

const schema = z
  .object({
    bid: z.coerce.number().positive(),
    ask: z.coerce.number().positive(),
    is_active: z.boolean(),
  })
  .refine((v) => v.ask >= v.bid, { message: "Ask must be greater than or equal to bid", path: ["ask"] });

type FormData = z.infer<typeof schema>;

interface Props {
  rate: ExchangeRate;
  open: boolean;
  onOpenChange: (o: boolean) => void;
}

export default function EditPairDialog({ rate, open, onOpenChange }: Props) {
  const update = useUpdateExchangeRate();
  const form = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: { bid: rate.bid, ask: rate.ask, is_active: rate.is_active },
  });

  useEffect(() => {
    if (open) form.reset({ bid: rate.bid, ask: rate.ask, is_active: rate.is_active });
  }, [open, rate, form]);

  const onSubmit = async (v: FormData) => {
    try {
      await update.mutateAsync({ id: rate.id, ...v });
      toast.success("Rate updated");
      onOpenChange(false);
    } catch (e: any) {
      toast.error(e.message || "Failed to update");
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Edit {rate.base_code} → {rate.quote_code}</DialogTitle>
          <DialogDescription>Update bid/ask spread or toggle this pair on or off.</DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <FormField control={form.control} name="bid" render={({ field }) => (
                <FormItem><FormLabel>Bid</FormLabel><FormControl><Input type="number" step="0.0001" {...field} /></FormControl><FormMessage /></FormItem>
              )} />
              <FormField control={form.control} name="ask" render={({ field }) => (
                <FormItem><FormLabel>Ask</FormLabel><FormControl><Input type="number" step="0.0001" {...field} /></FormControl><FormMessage /></FormItem>
              )} />
            </div>
            <FormField control={form.control} name="is_active" render={({ field }) => (
              <FormItem className="flex items-center justify-between rounded-lg border p-3">
                <FormLabel className="font-normal">Active</FormLabel>
                <FormControl><Switch checked={field.value} onCheckedChange={field.onChange} /></FormControl>
              </FormItem>
            )} />
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
              <Button type="submit" disabled={update.isPending}>{update.isPending ? "Saving…" : "Save"}</Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
