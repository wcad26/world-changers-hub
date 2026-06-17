import React, { useEffect, useRef, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { format } from "date-fns";
import { CalendarIcon, ImagePlus, Loader2, PiggyBank, Sparkles, Target, X } from "lucide-react";
import {
  Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import {
  Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  useUpdateFundraisingCampaign,
  campaignSchema,
  type CampaignData,
  type FundraisingCampaign,
} from "@/hooks/useFundraisingCampaigns";
import { toast } from "sonner";
import { useAuth } from "@/hooks/useAuth";
import { useRegionCurrency } from "@/hooks/useCurrencies";
import { supabase } from "@/integrations/supabase/client";
import { cn } from "@/lib/utils";

const MAX_IMAGE_BYTES = 5 * 1024 * 1024;

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  campaign: FundraisingCampaign | null;
}

const EditFundraisingCampaignDialog: React.FC<Props> = ({ open, onOpenChange, campaign }) => {
  const updateMutation = useUpdateFundraisingCampaign();
  const { userRegion } = useAuth();
  const { data: regionCurrency } = useRegionCurrency(userRegion?.id);
  const currencyLabel = regionCurrency?.symbol || regionCurrency?.code || "";

  const form = useForm<CampaignData & { status: string }>({
    resolver: zodResolver(campaignSchema),
    defaultValues: {
      name: "",
      description: "",
      goal: 0,
      startDate: "",
      endDate: "",
      imageUrl: "",
      isPublic: true,
    },
  });

  const [status, setStatus] = React.useState<string>("Active");

  useEffect(() => {
    if (campaign && open) {
      form.reset({
        name: campaign.name,
        description: campaign.description || "",
        goal: (campaign.goal || 0) / 100,
        startDate: campaign.start_date || "",
        endDate: campaign.end_date || "",
        imageUrl: campaign.image_url || "",
        isPublic: campaign.is_public ?? true,
      });
      setStatus(campaign.status || "Active");
    }
  }, [campaign, open]);

  async function onSubmit(values: CampaignData) {
    if (!campaign) return;
    try {
      await updateMutation.mutateAsync({
        id: campaign.id,
        name: values.name,
        description: values.description,
        goal: values.goal,
        startDate: values.startDate,
        endDate: values.endDate || null,
        isPublic: values.isPublic,
        status,
      });
      toast.success("Campaign updated");
      onOpenChange(false);
    } catch (e: any) {
      toast.error("Could not update campaign", { description: e?.message });
    }
  }

  const isSubmitting = updateMutation.isPending;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto p-0 gap-0 border border-border/40 bg-gradient-to-br from-card/95 to-muted/20 backdrop-blur-xl shadow-2xl rounded-2xl">
        <div className="sticky top-0 z-20 relative overflow-hidden rounded-t-2xl border-b border-border/30 bg-card/95 backdrop-blur-xl px-6 pt-6 pb-5">
          <div className="absolute inset-0 bg-gradient-to-br from-primary/15 via-primary/5 to-purple-500/10 pointer-events-none" />
          <div className="absolute -top-12 -right-12 h-40 w-40 rounded-full bg-primary/20 blur-3xl pointer-events-none" />
          <div className="absolute -bottom-16 -left-12 h-40 w-40 rounded-full bg-purple-500/20 blur-3xl pointer-events-none" />
          <DialogHeader className="relative space-y-3">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-primary to-purple-600 text-primary-foreground shadow-lg shadow-primary/20">
                <PiggyBank className="h-5 w-5" />
              </div>
              <div className="space-y-0.5">
                <DialogTitle className="text-xl font-semibold">Edit campaign</DialogTitle>
                <DialogDescription className="text-sm">Update campaign details, goal, and status.</DialogDescription>
              </div>
            </div>
          </DialogHeader>
        </div>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)}>
            <div className="px-6 py-5 space-y-5">
              <FormField
                control={form.control}
                name="isPublic"
                render={({ field }) => (
                  <FormItem className="flex flex-row items-center justify-between rounded-xl border border-border/40 bg-card/50 backdrop-blur-sm p-4">
                    <div className="space-y-1 pr-4">
                      <FormLabel className="text-sm font-medium">Show on public site</FormLabel>
                      <FormDescription className="text-xs">Visible on regional homepage and public fundraising page.</FormDescription>
                    </div>
                    <FormControl>
                      <Switch checked={field.value} onCheckedChange={field.onChange} />
                    </FormControl>
                  </FormItem>
                )}
              />

              <div className="rounded-xl border border-border/40 bg-card/50 backdrop-blur-sm p-4 space-y-4">
                <div className="flex items-center gap-2 text-sm font-medium text-foreground">
                  <Sparkles className="h-4 w-4 text-primary" /> Campaign details
                </div>
                <FormField control={form.control} name="name" render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-xs font-medium uppercase tracking-wider text-muted-foreground">Name</FormLabel>
                    <FormControl><Input className="bg-background/60 border-border/50" {...field} /></FormControl>
                    <FormMessage />
                  </FormItem>
                )} />
                <FormField control={form.control} name="description" render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-xs font-medium uppercase tracking-wider text-muted-foreground">Story</FormLabel>
                    <FormControl><Textarea rows={4} className="bg-background/60 border-border/50 resize-none" {...field} /></FormControl>
                    <FormMessage />
                  </FormItem>
                )} />
                <div>
                  <FormLabel className="text-xs font-medium uppercase tracking-wider text-muted-foreground">Status</FormLabel>
                  <Select value={status} onValueChange={setStatus}>
                    <SelectTrigger className="bg-background/60 border-border/50 mt-2"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Active">Active</SelectItem>
                      <SelectItem value="Completed">Completed</SelectItem>
                      <SelectItem value="Cancelled">Cancelled</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="rounded-xl border border-border/40 bg-card/50 backdrop-blur-sm p-4 space-y-4">
                <div className="flex items-center gap-2 text-sm font-medium text-foreground">
                  <Target className="h-4 w-4 text-primary" /> Goal & timeline
                </div>
                <FormField control={form.control} name="goal" render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-xs font-medium uppercase tracking-wider text-muted-foreground">Fundraising goal</FormLabel>
                    <FormControl>
                      <div className="relative">
                        {currencyLabel && (
                          <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">{currencyLabel}</span>
                        )}
                        <Input
                          type="text"
                          inputMode="numeric"
                          className={cn("bg-background/60 border-border/50", currencyLabel && "pl-10")}
                          value={field.value ? Number(field.value).toLocaleString("en-US") : ""}
                          onChange={(e) => {
                            const digits = e.target.value.replace(/[^\d]/g, "");
                            field.onChange(digits ? Number(digits) : 0);
                          }}
                        />
                      </div>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )} />
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <FormField control={form.control} name="startDate" render={({ field }) => (
                    <FormItem className="flex flex-col">
                      <FormLabel className="text-xs font-medium uppercase tracking-wider text-muted-foreground">Start date</FormLabel>
                      <Popover>
                        <PopoverTrigger asChild>
                          <FormControl>
                            <Button variant="outline" className={cn("bg-background/60 border-border/50 justify-start text-left font-normal", !field.value && "text-muted-foreground")}>
                              <CalendarIcon className="mr-2 h-4 w-4" />
                              {field.value ? format(new Date(field.value), "PPP") : "Pick a date"}
                            </Button>
                          </FormControl>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0" align="start">
                          <Calendar mode="single" selected={field.value ? new Date(field.value) : undefined}
                            onSelect={(d) => field.onChange(d ? format(d, "yyyy-MM-dd") : "")} initialFocus className="p-3 pointer-events-auto" />
                        </PopoverContent>
                      </Popover>
                      <FormMessage />
                    </FormItem>
                  )} />
                  <FormField control={form.control} name="endDate" render={({ field }) => {
                    const start = form.watch("startDate");
                    return (
                      <FormItem className="flex flex-col">
                        <div className="flex items-center justify-between">
                          <FormLabel className="text-xs font-medium uppercase tracking-wider text-muted-foreground">End date</FormLabel>
                          {field.value && (
                            <button type="button" onClick={() => field.onChange("")} className="text-[10px] uppercase tracking-wider text-muted-foreground hover:text-foreground">Clear</button>
                          )}
                        </div>
                        <Popover>
                          <PopoverTrigger asChild>
                            <FormControl>
                              <Button variant="outline" className={cn("bg-background/60 border-border/50 justify-start text-left font-normal", !field.value && "text-muted-foreground")}>
                                <CalendarIcon className="mr-2 h-4 w-4" />
                                {field.value ? format(new Date(field.value), "PPP") : "No end date"}
                              </Button>
                            </FormControl>
                          </PopoverTrigger>
                          <PopoverContent className="w-auto p-0" align="start">
                            <Calendar mode="single" selected={field.value ? new Date(field.value) : undefined}
                              onSelect={(d) => field.onChange(d ? format(d, "yyyy-MM-dd") : "")}
                              disabled={(date) => (start ? date < new Date(start) : false)} initialFocus className="p-3 pointer-events-auto" />
                          </PopoverContent>
                        </Popover>
                        <FormDescription className="text-xs">Leave empty for open-ended campaign.</FormDescription>
                        <FormMessage />
                      </FormItem>
                    );
                  }} />
                </div>
              </div>
            </div>

            <DialogFooter className="px-6 py-4 border-t border-border/30 bg-card/40 rounded-b-2xl">
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
              <Button type="submit" disabled={isSubmitting} className="bg-gradient-to-r from-primary to-purple-600 text-primary-foreground">
                {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Save changes
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
};

export default EditFundraisingCampaignDialog;
