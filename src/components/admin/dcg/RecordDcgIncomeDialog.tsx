import React from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { 
  Dialog, 
  DialogContent, 
  DialogDescription, 
  DialogHeader, 
  DialogTitle 
} from "@/components/ui/dialog";
import { 
  Form, 
  FormControl, 
  FormField, 
  FormItem, 
  FormLabel, 
  FormMessage 
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from "@/components/ui/select";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { CalendarIcon } from "lucide-react";
import { format } from "date-fns";
import { cn } from "@/lib/utils";
import { useCreateFinancialTransaction, useFinancialCategories } from "@/hooks/useFinancials";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { useDcgs } from "@/hooks/useDCGs";
import { useRegionCurrency } from "@/hooks/useCurrencies";
import { getCurrencySymbol } from "@/utils/currencyUtils";

const incomeSchema = z.object({
  category_id: z.string().uuid("Please select a category"),
  amount: z.coerce.number().positive("Amount must be positive"),
  description: z.string().optional(),
  transaction_date: z.date(),
});

type IncomeFormData = z.infer<typeof incomeSchema>;

interface RecordDcgIncomeDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export const RecordDcgIncomeDialog: React.FC<RecordDcgIncomeDialogProps> = ({
  open,
  onOpenChange,
}) => {
  const { userDcg } = useAuth();
  const { data: dcgs } = useDcgs();
  const currentDcg = dcgs?.find(d => d.id === userDcg?.id);
  const { data: regionCurrency } = useRegionCurrency(currentDcg?.region_id);
  const currencySymbol = getCurrencySymbol(regionCurrency);
  const { toast } = useToast();
  const createTransaction = useCreateFinancialTransaction();
  const { data: categories } = useFinancialCategories();

  const form = useForm<IncomeFormData>({
    resolver: zodResolver(incomeSchema),
    defaultValues: {
      transaction_date: new Date(),
      description: "",
    },
  });

  // Filter for all income categories
  const incomeCategories = categories?.filter(cat => cat.type === "Income") || [];

  const onSubmit = async (data: IncomeFormData) => {
    if (!userDcg) {
      toast({
        title: "Error",
        description: "DCG information not found",
        variant: "destructive",
      });
      return;
    }

    try {
      await createTransaction.mutateAsync({
        ...data,
        dcg_id: userDcg.id,
        transaction_date: format(data.transaction_date, 'yyyy-MM-dd'),
      });

      toast({
        title: "Success",
        description: "Income recorded successfully",
      });

      form.reset();
      onOpenChange(false);
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to record income",
        variant: "destructive",
      });
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Record DCG Income</DialogTitle>
          <DialogDescription>
            Record income for your DCG (offerings, special giving)
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="category_id"
              render={({ field }) => (
              <FormItem>
                  <FormLabel>Income Category</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select income category" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {incomeCategories.map((category) => (
                        <SelectItem key={category.id} value={category.id}>
                          {category.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="amount"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Amount ({currencySymbol})</FormLabel>
                  <FormControl>
                    <Input
                      type="number"
                      step="0.01"
                      placeholder="0.00"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="transaction_date"
              render={({ field }) => (
                <FormItem className="flex flex-col">
                  <FormLabel>Date</FormLabel>
                  <Popover>
                    <PopoverTrigger asChild>
                      <FormControl>
                        <Button
                          variant={"outline"}
                          className={cn(
                            "w-full pl-3 text-left font-normal",
                            !field.value && "text-muted-foreground"
                          )}
                        >
                          {field.value ? (
                            format(field.value, "PPP")
                          ) : (
                            <span>Pick a date</span>
                          )}
                          <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                        </Button>
                      </FormControl>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                      <Calendar
                        mode="single"
                        selected={field.value}
                        onSelect={field.onChange}
                        disabled={(date) =>
                          date > new Date() || date < new Date("1900-01-01")
                        }
                        initialFocus
                        className="pointer-events-auto"
                      />
                    </PopoverContent>
                  </Popover>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Description (Optional)</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Additional details about this income..."
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="flex justify-end space-x-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={createTransaction.isPending}>
                {createTransaction.isPending ? "Recording..." : "Record Income"}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
};