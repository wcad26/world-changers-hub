import React, { useRef, useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { useCurrencies } from "@/hooks/useCurrencies";
import { useCreateGlobalCampaign } from "@/hooks/useGlobalFundraising";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { format } from "date-fns";
import { ImagePlus, X, Loader2 } from "lucide-react";

interface Props {
  open: boolean;
  onOpenChange: (v: boolean) => void;
}

const MAX_IMAGE_BYTES = 5 * 1024 * 1024;

const CreateGlobalCampaignDialog: React.FC<Props> = ({ open, onOpenChange }) => {
  const { toast } = useToast();
  const { data: currencies = [] } = useCurrencies();
  const create = useCreateGlobalCampaign();

  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [goal, setGoal] = useState("");
  const [startDate, setStartDate] = useState(format(new Date(), "yyyy-MM-dd"));
  const [endDate, setEndDate] = useState("");
  const [currency, setCurrency] = useState("USD");
  const [isPublic, setIsPublic] = useState(true);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFile = (file?: File | null) => {
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      toast({ title: "Invalid file", description: "Please select an image.", variant: "destructive" });
      return;
    }
    if (file.size > MAX_IMAGE_BYTES) {
      toast({ title: "Too large", description: "Image must be smaller than 5MB.", variant: "destructive" });
      return;
    }
    setImageFile(file);
    setImagePreview(URL.createObjectURL(file));
  };

  const clearImage = () => {
    setImageFile(null);
    if (imagePreview) URL.revokeObjectURL(imagePreview);
    setImagePreview(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const uploadImage = async (): Promise<string | null> => {
    if (!imageFile) return null;
    setUploading(true);
    try {
      const ext = imageFile.name.split(".").pop() || "jpg";
      const path = `global/${crypto.randomUUID()}.${ext}`;
      const { error } = await supabase.storage
        .from("campaign-images")
        .upload(path, imageFile, { cacheControl: "3600", upsert: false });
      if (error) throw error;
      const { data: { publicUrl } } = supabase.storage.from("campaign-images").getPublicUrl(path);
      return publicUrl;
    } finally {
      setUploading(false);
    }
  };

  const submit = async () => {
    if (!name || !description || !goal || !startDate) {
      toast({ title: "Missing fields", description: "All fields except end date are required.", variant: "destructive" });
      return;
    }
    try {
      const imageUrl = await uploadImage();
      await create.mutateAsync({
        name,
        description,
        goal: Number(goal),
        start_date: startDate,
        end_date: endDate || null,
        currency_code: currency,
        is_public: isPublic,
        image_url: imageUrl,
      });
      toast({ title: "Global campaign created" });
      setName(""); setDescription(""); setGoal(""); setEndDate("");
      clearImage();
      onOpenChange(false);
    } catch (e: any) {
      toast({ title: "Failed", description: e?.message || "Unknown error", variant: "destructive" });
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Create Global Campaign</DialogTitle>
          <DialogDescription>This campaign is owned by the Super Admin and is not attributed to any region.</DialogDescription>
        </DialogHeader>
        <div className="space-y-3">
          <div>
            <Label>Name</Label>
            <Input value={name} onChange={(e) => setName(e.target.value)} />
          </div>
          <div>
            <Label>Description</Label>
            <Textarea value={description} onChange={(e) => setDescription(e.target.value)} />
          </div>

          <div>
            <Label>Cover image</Label>
            <div
              onClick={() => fileInputRef.current?.click()}
              className={`mt-1 rounded-lg border-2 border-dashed border-border cursor-pointer transition hover:border-primary ${imagePreview ? "p-0 overflow-hidden" : "p-6"}`}
            >
              {imagePreview ? (
                <div className="relative">
                  <img src={imagePreview} alt="" className="w-full h-40 object-cover" />
                  <button
                    type="button"
                    onClick={(e) => { e.stopPropagation(); clearImage(); }}
                    className="absolute top-2 right-2 h-7 w-7 rounded-full bg-background/80 border flex items-center justify-center"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>
              ) : (
                <div className="flex flex-col items-center text-muted-foreground text-sm">
                  <ImagePlus className="h-6 w-6 mb-2" />
                  Drop an image or click to upload
                </div>
              )}
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={(e) => handleFile(e.target.files?.[0])}
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label>Goal</Label>
              <Input type="number" min="0" step="0.01" value={goal} onChange={(e) => setGoal(e.target.value)} />
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
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label>Start Date</Label>
              <Input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} />
            </div>
            <div>
              <Label>End Date (optional)</Label>
              <Input type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} />
            </div>
          </div>
          <div className="flex items-center justify-between rounded-lg border border-border/40 px-3 py-2">
            <div>
              <Label>Public Campaign</Label>
              <p className="text-xs text-muted-foreground">Show on the public fundraising page</p>
            </div>
            <Switch checked={isPublic} onCheckedChange={setIsPublic} />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button onClick={submit} disabled={create.isPending || uploading}>
            {(create.isPending || uploading) && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
            {uploading ? "Uploading…" : create.isPending ? "Creating…" : "Create"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default CreateGlobalCampaignDialog;
