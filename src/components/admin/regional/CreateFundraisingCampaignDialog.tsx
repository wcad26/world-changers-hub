import React, { useRef, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { format } from "date-fns";
import {
  CalendarIcon,
  ImagePlus,
  Loader2,
  PiggyBank,
  Sparkles,
  Target,
  Trash2,
  X,
} from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  useCreateFundraisingCampaign,
  campaignSchema,
  type CampaignData,
} from "@/hooks/useFundraisingCampaigns";
import { toast } from "sonner";
import { useAuth } from "@/hooks/useAuth";
import { useRegionCurrency } from "@/hooks/useCurrencies";
import { supabase } from "@/integrations/supabase/client";
import { cn } from "@/lib/utils";

interface CreateFundraisingCampaignDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const MAX_IMAGE_BYTES = 5 * 1024 * 1024;

const CreateFundraisingCampaignDialog: React.FC<
  CreateFundraisingCampaignDialogProps
> = ({ open, onOpenChange }) => {
  const createCampaignMutation = useCreateFundraisingCampaign();
  const { userRegion } = useAuth();
  const { data: regionCurrency } = useRegionCurrency(userRegion?.id);
  const currencyLabel = regionCurrency?.symbol || regionCurrency?.code || "";

  const fileInputRef = useRef<HTMLInputElement>(null);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [isDragging, setIsDragging] = useState(false);

  const form = useForm<CampaignData>({
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

  const resetAll = () => {
    form.reset();
    setImageFile(null);
    setImagePreview(null);
  };

  const handleFile = (file: File | null | undefined) => {
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      toast.error("Please select an image file");
      return;
    }
    if (file.size > MAX_IMAGE_BYTES) {
      toast.error("Image must be smaller than 5MB");
      return;
    }
    setImageFile(file);
    const url = URL.createObjectURL(file);
    setImagePreview(url);
  };

  const clearImage = () => {
    setImageFile(null);
    if (imagePreview) URL.revokeObjectURL(imagePreview);
    setImagePreview(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  async function uploadImage(): Promise<string | null> {
    if (!imageFile || !userRegion?.id) return null;
    setIsUploading(true);
    try {
      const ext = imageFile.name.split(".").pop() || "jpg";
      const path = `${userRegion.id}/${crypto.randomUUID()}.${ext}`;
      const { error } = await supabase.storage
        .from("campaign-images")
        .upload(path, imageFile, { cacheControl: "3600", upsert: false });
      if (error) throw error;
      const {
        data: { publicUrl },
      } = supabase.storage.from("campaign-images").getPublicUrl(path);
      return publicUrl;
    } finally {
      setIsUploading(false);
    }
  }

  async function onSubmit(values: CampaignData) {
    try {
      let imageUrl: string | null = null;
      if (imageFile) {
        imageUrl = await uploadImage();
      }
      createCampaignMutation.mutate(
        { ...values, imageUrl: imageUrl ?? undefined },
        {
          onSuccess: () => {
            toast.success("Campaign created", {
              description: "Your fundraising campaign is now live.",
            });
            resetAll();
            onOpenChange(false);
          },
          onError: (error) => {
            console.error("Error creating campaign:", error);
            toast.error("Could not create campaign", {
              description: "Please try again.",
            });
          },
        }
      );
    } catch (err) {
      console.error(err);
      toast.error("Image upload failed", {
        description: "Please try a different image.",
      });
    }
  }

  const isSubmitting = createCampaignMutation.isPending || isUploading;

  return (
    <Dialog
      open={open}
      onOpenChange={(o) => {
        if (!o) resetAll();
        onOpenChange(o);
      }}
    >
      <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto p-0 gap-0 border border-border/40 bg-gradient-to-br from-card/95 to-muted/20 backdrop-blur-xl shadow-2xl rounded-2xl">
        {/* Gradient header */}
        <div className="relative overflow-hidden rounded-t-2xl border-b border-border/30 bg-gradient-to-br from-primary/15 via-primary/5 to-purple-500/10 px-6 pt-6 pb-5">
          <div className="absolute -top-12 -right-12 h-40 w-40 rounded-full bg-primary/20 blur-3xl pointer-events-none" />
          <div className="absolute -bottom-16 -left-12 h-40 w-40 rounded-full bg-purple-500/20 blur-3xl pointer-events-none" />
          <DialogHeader className="relative space-y-3">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-primary to-purple-600 text-primary-foreground shadow-lg shadow-primary/20">
                <PiggyBank className="h-5 w-5" />
              </div>
              <div className="space-y-0.5">
                <DialogTitle className="text-xl font-semibold">
                  Launch a fundraising campaign
                </DialogTitle>
                <DialogDescription className="text-sm">
                  Inspire your community with a goal worth giving to.
                </DialogDescription>
              </div>
            </div>
          </DialogHeader>
        </div>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)}>
            <div className="px-6 py-5 space-y-5">
              {/* Visibility */}
              <FormField
                control={form.control}
                name="isPublic"
                render={({ field }) => (
                  <FormItem className="flex flex-row items-center justify-between rounded-xl border border-border/40 bg-card/50 backdrop-blur-sm p-4">
                    <div className="space-y-1 pr-4">
                      <FormLabel className="text-sm font-medium">
                        Show on public site
                      </FormLabel>
                      <FormDescription className="text-xs">
                        Featured on your regional homepage and the public
                        fundraising page.
                      </FormDescription>
                    </div>
                    <FormControl>
                      <Switch
                        checked={field.value}
                        onCheckedChange={field.onChange}
                      />
                    </FormControl>
                  </FormItem>
                )}
              />

              {/* Image upload panel */}
              <FormField
                control={form.control}
                name="imageUrl"
                render={() => (
                  <FormItem>
                    <FormLabel className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
                      Cover image
                    </FormLabel>
                    <FormControl>
                      <div
                        onDragOver={(e) => {
                          e.preventDefault();
                          setIsDragging(true);
                        }}
                        onDragLeave={() => setIsDragging(false)}
                        onDrop={(e) => {
                          e.preventDefault();
                          setIsDragging(false);
                          handleFile(e.dataTransfer.files?.[0]);
                        }}
                        className={cn(
                          "relative rounded-xl border border-dashed border-border/60 bg-card/50 backdrop-blur-sm transition-colors",
                          isDragging && "border-primary/70 bg-primary/5",
                          imagePreview ? "p-0 overflow-hidden" : "p-6"
                        )}
                      >
                        {imagePreview ? (
                          <div className="relative">
                            <img
                              src={imagePreview}
                              alt="Campaign preview"
                              className="h-48 w-full object-cover"
                            />
                            <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent" />
                            <div className="absolute bottom-3 left-3 right-3 flex items-center justify-between gap-2">
                              <p className="text-xs text-white/90 truncate max-w-[60%]">
                                {imageFile?.name}
                              </p>
                              <div className="flex gap-2">
                                <Button
                                  type="button"
                                  size="sm"
                                  variant="secondary"
                                  className="h-8 bg-background/80 backdrop-blur-md"
                                  onClick={() => fileInputRef.current?.click()}
                                >
                                  Replace
                                </Button>
                                <Button
                                  type="button"
                                  size="icon"
                                  variant="destructive"
                                  className="h-8 w-8"
                                  onClick={clearImage}
                                >
                                  <Trash2 className="h-4 w-4" />
                                </Button>
                              </div>
                            </div>
                          </div>
                        ) : (
                          <button
                            type="button"
                            onClick={() => fileInputRef.current?.click()}
                            className="flex w-full flex-col items-center justify-center gap-2 text-center"
                          >
                            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary/10 text-primary">
                              <ImagePlus className="h-6 w-6" />
                            </div>
                            <div className="space-y-0.5">
                              <p className="text-sm font-medium">
                                Drop an image or click to upload
                              </p>
                              <p className="text-xs text-muted-foreground">
                                PNG, JPG, or WEBP up to 5MB
                              </p>
                            </div>
                          </button>
                        )}
                        <input
                          ref={fileInputRef}
                          type="file"
                          accept="image/*"
                          className="hidden"
                          onChange={(e) => handleFile(e.target.files?.[0])}
                        />
                      </div>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Details panel */}
              <div className="rounded-xl border border-border/40 bg-card/50 backdrop-blur-sm p-4 space-y-4">
                <div className="flex items-center gap-2 text-sm font-medium text-foreground">
                  <Sparkles className="h-4 w-4 text-primary" />
                  Campaign details
                </div>
                <FormField
                  control={form.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
                        Name
                      </FormLabel>
                      <FormControl>
                        <Input
                          placeholder="Building Fund"
                          className="bg-background/60 border-border/50"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="description"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
                        Story
                      </FormLabel>
                      <FormControl>
                        <Textarea
                          rows={4}
                          placeholder="Tell donors why this campaign matters and how their gift will be used..."
                          className="bg-background/60 border-border/50 resize-none"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              {/* Goal & timeline panel */}
              <div className="rounded-xl border border-border/40 bg-card/50 backdrop-blur-sm p-4 space-y-4">
                <div className="flex items-center gap-2 text-sm font-medium text-foreground">
                  <Target className="h-4 w-4 text-primary" />
                  Goal & timeline
                </div>

                <FormField
                  control={form.control}
                  name="goal"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
                        Fundraising goal
                      </FormLabel>
                      <FormControl>
                        <div className="relative">
                          {currencyLabel && (
                            <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">
                              {currencyLabel}
                            </span>
                          )}
                          <Input
                            type="text"
                            inputMode="numeric"
                            placeholder="50,000"
                            className={cn(
                              "bg-background/60 border-border/50",
                              currencyLabel && "pl-10"
                            )}
                            value={
                              field.value
                                ? Number(field.value).toLocaleString("en-US")
                                : ""
                            }
                            onChange={(e) => {
                              const digits = e.target.value.replace(
                                /[^\d]/g,
                                ""
                              );
                              field.onChange(digits ? Number(digits) : 0);
                            }}
                          />
                        </div>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="startDate"
                    render={({ field }) => (
                      <FormItem className="flex flex-col">
                        <FormLabel className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
                          Start date
                        </FormLabel>
                        <Popover>
                          <PopoverTrigger asChild>
                            <FormControl>
                              <Button
                                variant="outline"
                                className={cn(
                                  "bg-background/60 border-border/50 justify-start text-left font-normal",
                                  !field.value && "text-muted-foreground"
                                )}
                              >
                                <CalendarIcon className="mr-2 h-4 w-4" />
                                {field.value
                                  ? format(new Date(field.value), "PPP")
                                  : "Pick a date"}
                              </Button>
                            </FormControl>
                          </PopoverTrigger>
                          <PopoverContent
                            className="w-auto p-0"
                            align="start"
                          >
                            <Calendar
                              mode="single"
                              selected={
                                field.value ? new Date(field.value) : undefined
                              }
                              onSelect={(d) =>
                                field.onChange(
                                  d ? format(d, "yyyy-MM-dd") : ""
                                )
                              }
                              initialFocus
                              className={cn("p-3 pointer-events-auto")}
                            />
                          </PopoverContent>
                        </Popover>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="endDate"
                    render={({ field }) => {
                      const start = form.watch("startDate");
                      return (
                        <FormItem className="flex flex-col">
                          <FormLabel className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
                            End date
                          </FormLabel>
                          <Popover>
                            <PopoverTrigger asChild>
                              <FormControl>
                                <Button
                                  variant="outline"
                                  className={cn(
                                    "bg-background/60 border-border/50 justify-start text-left font-normal",
                                    !field.value && "text-muted-foreground"
                                  )}
                                >
                                  <CalendarIcon className="mr-2 h-4 w-4" />
                                  {field.value
                                    ? format(new Date(field.value), "PPP")
                                    : "Pick a date"}
                                </Button>
                              </FormControl>
                            </PopoverTrigger>
                            <PopoverContent
                              className="w-auto p-0"
                              align="start"
                            >
                              <Calendar
                                mode="single"
                                selected={
                                  field.value
                                    ? new Date(field.value)
                                    : undefined
                                }
                                onSelect={(d) =>
                                  field.onChange(
                                    d ? format(d, "yyyy-MM-dd") : ""
                                  )
                                }
                                disabled={(date) =>
                                  start ? date < new Date(start) : false
                                }
                                initialFocus
                                className={cn("p-3 pointer-events-auto")}
                              />
                            </PopoverContent>
                          </Popover>
                          <FormMessage />
                        </FormItem>
                      );
                    }}
                  />
                </div>
              </div>
            </div>

            <DialogFooter className="px-6 py-4 border-t border-border/30 bg-card/40 backdrop-blur-sm rounded-b-2xl gap-2 sm:gap-2">
              <Button
                type="button"
                variant="outline"
                className="bg-background/60 border-border/50"
                onClick={() => onOpenChange(false)}
              >
                <X className="mr-1 h-4 w-4" />
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={isSubmitting}
                className="bg-gradient-to-r from-primary to-purple-600 text-primary-foreground shadow-lg shadow-primary/20 hover:shadow-primary/30 hover:opacity-95"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    {isUploading ? "Uploading image..." : "Creating..."}
                  </>
                ) : (
                  <>
                    <PiggyBank className="mr-2 h-4 w-4" />
                    Create campaign
                  </>
                )}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
};

export default CreateFundraisingCampaignDialog;
