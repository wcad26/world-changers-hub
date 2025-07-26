import React, { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { 
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { MapPin, User, Phone, Mail, Calendar, FileText, Upload, Loader2, Images, X, Image } from "lucide-react";
import { useRegionMutations } from "@/hooks/useRegionMutations";
import { useRegions } from "@/hooks/useRegions";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

const regionalBranchSchema = z.object({
  name: z.string().min(2, "Region name must be at least 2 characters"),
  code: z.string().min(2, "Region code must be at least 2 characters").max(10, "Region code must be at most 10 characters"),
  description: z.string().optional(),
  address: z.string().optional(),
  contact_phone: z.string().optional(),
  contact_email: z.string().email("Invalid email address").optional().or(z.literal("")),
  regional_president: z.string().optional(),
  regional_president_photo: z.string().optional(),
  established_date: z.string().optional(),
  hero_slide_images: z.array(z.object({
    url: z.string(),
    alt: z.string(),
  })).optional(),
});

type RegionalBranchFormData = z.infer<typeof regionalBranchSchema>;

const RegionalBranchForm = () => {
  const { user } = useAuth();
  const { data: regions, isLoading } = useRegions();
  const { updateRegion } = useRegionMutations();
  const { toast } = useToast();
  const [isUploadingPhoto, setIsUploadingPhoto] = useState(false);
  const [slideImages, setSlideImages] = useState<Array<{url: string, alt: string}>>([]);
  const [isUploadingSlides, setIsUploadingSlides] = useState(false);

  // Get the user's region
  const userRegion = regions?.find(region => 
    user?.user_metadata?.region_id === region.id
  );

  const form = useForm<RegionalBranchFormData>({
    resolver: zodResolver(regionalBranchSchema),
    defaultValues: {
      name: "",
      code: "",
      description: "",
      address: "",
      contact_phone: "",
      contact_email: "",
      regional_president: "",
      regional_president_photo: "",
      established_date: "",
    },
  });

  // Populate form with current region data
  useEffect(() => {
    if (userRegion) {
        // Type-safe parsing of slide images data
        let slideImagesData: Array<{url: string, alt: string}> = [];
        if (userRegion.hero_slide_images && Array.isArray(userRegion.hero_slide_images)) {
          slideImagesData = userRegion.hero_slide_images.filter((item): item is {url: string, alt: string} => 
            typeof item === 'object' && item !== null && 
            typeof (item as any).url === 'string' && 
            typeof (item as any).alt === 'string'
          );
        }
        
        setSlideImages(slideImagesData);
        
        form.reset({
          name: userRegion.name || "",
          code: userRegion.code || "",
          description: userRegion.description || "",
          address: userRegion.address || "",
          contact_phone: userRegion.contact_phone || "",
          contact_email: userRegion.contact_email || "",
          regional_president: userRegion.regional_president || "",
          regional_president_photo: userRegion.regional_president_photo || "",
          established_date: userRegion.established_date || "",
          hero_slide_images: slideImagesData,
        });
    }
  }, [userRegion, form]);

  const onSubmit = (data: RegionalBranchFormData) => {
    if (!userRegion) return;

    updateRegion.mutate({
      id: userRegion.id,
      updates: {
        name: data.name,
        code: data.code,
        description: data.description || null,
        address: data.address || null,
        contact_phone: data.contact_phone || null,
        contact_email: data.contact_email || null,
        regional_president: data.regional_president || null,
        regional_president_photo: data.regional_president_photo || null,
        established_date: data.established_date || null,
        hero_slide_images: slideImages.length > 0 ? slideImages : null,
      },
    });
  };

  const handleImageUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file || !userRegion) return;

    // Validate file type
    if (!file.type.startsWith('image/')) {
      toast({
        title: "Invalid file type",
        description: "Please select an image file",
        variant: "destructive"
      });
      return;
    }
    
    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      toast({
        title: "File too large",
        description: "Please select an image smaller than 5MB",
        variant: "destructive"
      });
      return;
    }

    setIsUploadingPhoto(true);
    try {
      // Create unique filename
      const fileExt = file.name.split('.').pop();
      const fileName = `regional_president_${userRegion.id}_${Date.now()}.${fileExt}`;
      const filePath = `${userRegion.id}/${fileName}`;

      // Delete old photo if exists
      const currentPhotoUrl = form.getValues("regional_president_photo");
      if (currentPhotoUrl) {
        const oldPath = currentPhotoUrl.split('/').pop();
        if (oldPath) {
          await supabase.storage
            .from('member-photos')
            .remove([`${userRegion.id}/${oldPath}`]);
        }
      }

      // Upload new photo
      const { error: uploadError } = await supabase.storage
        .from('member-photos')
        .upload(filePath, file);

      if (uploadError) throw uploadError;

      // Get public URL
      const { data: { publicUrl } } = supabase.storage
        .from('member-photos')
        .getPublicUrl(filePath);

      // Update form field with the public URL
      form.setValue("regional_president_photo", publicUrl);

      toast({
        title: "Photo uploaded",
        description: "Regional president photo has been uploaded successfully"
      });

    } catch (error) {
      console.error('Error uploading photo:', error);
      toast({
        title: "Upload failed",
        description: "Failed to upload photo. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsUploadingPhoto(false);
    }
  };

  const handleSlideUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (!files || files.length === 0 || !userRegion) return;

    // Check if adding new files would exceed the 4 slide limit
    if (slideImages.length + files.length > 4) {
      toast({
        title: "Too many slides",
        description: "You can only have up to 4 hero slide images",
        variant: "destructive"
      });
      return;
    }

    setIsUploadingSlides(true);
    try {
      const uploadPromises = Array.from(files).map(async (file, index) => {
        // Validate file type
        if (!file.type.startsWith('image/')) {
          throw new Error(`File ${file.name} is not an image`);
        }
        
        // Validate file size (max 10MB for slides)
        if (file.size > 10 * 1024 * 1024) {
          throw new Error(`File ${file.name} is too large (max 10MB)`);
        }

        // Create unique filename
        const fileExt = file.name.split('.').pop();
        const fileName = `slide_${userRegion.id}_${Date.now()}_${index}.${fileExt}`;
        const filePath = `${userRegion.id}/slides/${fileName}`;

        // Upload file
        const { error: uploadError } = await supabase.storage
          .from('member-photos')
          .upload(filePath, file);

        if (uploadError) throw uploadError;

        // Get public URL
        const { data: { publicUrl } } = supabase.storage
          .from('member-photos')
          .getPublicUrl(filePath);

        return {
          url: publicUrl,
          alt: `Hero slide image ${slideImages.length + index + 1}`
        };
      });

      const newSlides = await Promise.all(uploadPromises);
      const updatedSlides = [...slideImages, ...newSlides];
      
      setSlideImages(updatedSlides);
      form.setValue("hero_slide_images", updatedSlides);

      toast({
        title: "Slides uploaded",
        description: `${files.length} slide image(s) uploaded successfully`
      });

    } catch (error) {
      console.error('Error uploading slides:', error);
      toast({
        title: "Upload failed",
        description: error instanceof Error ? error.message : "Failed to upload slides. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsUploadingSlides(false);
      // Clear the input
      event.target.value = '';
    }
  };

  const removeSlide = async (index: number) => {
    const slide = slideImages[index];
    if (!slide || !userRegion) return;

    try {
      // Extract filename from URL for deletion
      const urlParts = slide.url.split('/');
      const fileName = urlParts[urlParts.length - 1];
      const filePath = `${userRegion.id}/slides/${fileName}`;

      // Delete from storage
      await supabase.storage
        .from('member-photos')
        .remove([filePath]);

      // Update state
      const updatedSlides = slideImages.filter((_, i) => i !== index);
      setSlideImages(updatedSlides);
      form.setValue("hero_slide_images", updatedSlides);

      toast({
        title: "Slide removed",
        description: "Slide image has been removed successfully"
      });

    } catch (error) {
      console.error('Error removing slide:', error);
      toast({
        title: "Removal failed",
        description: "Failed to remove slide. Please try again.",
        variant: "destructive"
      });
    }
  };

  const updateSlideAlt = (index: number, alt: string) => {
    const updatedSlides = slideImages.map((slide, i) => 
      i === index ? { ...slide, alt } : slide
    );
    setSlideImages(updatedSlides);
    form.setValue("hero_slide_images", updatedSlides);
  };

  if (isLoading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center h-64">
          <div className="text-muted-foreground">Loading region data...</div>
        </CardContent>
      </Card>
    );
  }

  if (!userRegion) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center h-64">
          <div className="text-muted-foreground">No region found for your account.</div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <MapPin className="h-5 w-5" />
          Regional Branch Information
        </CardTitle>
        <CardDescription>
          Update the information that appears on your regional branch landing page
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="flex items-center gap-2">
                      <FileText className="h-4 w-4" />
                      Region Name
                    </FormLabel>
                    <FormControl>
                      <Input placeholder="Enter region name" {...field} />
                    </FormControl>
                    <FormDescription>
                      The official name of your regional branch
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="code"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Region Code</FormLabel>
                    <FormControl>
                      <Input placeholder="e.g., NYC" {...field} />
                    </FormControl>
                    <FormDescription>
                      Short code used in URLs (e.g., /regions/nyc)
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Description</FormLabel>
                  <FormControl>
                    <Textarea 
                      placeholder="Enter a description of your regional branch..."
                      className="h-24"
                      {...field}
                    />
                  </FormControl>
                  <FormDescription>
                    Brief description that appears in the About section
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="address"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="flex items-center gap-2">
                    <MapPin className="h-4 w-4" />
                    Address
                  </FormLabel>
                  <FormControl>
                    <Textarea 
                      placeholder="Enter the full address..."
                      className="h-20"
                      {...field}
                    />
                  </FormControl>
                  <FormDescription>
                    Physical address of your regional branch
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <FormField
                control={form.control}
                name="contact_phone"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="flex items-center gap-2">
                      <Phone className="h-4 w-4" />
                      Contact Phone
                    </FormLabel>
                    <FormControl>
                      <Input placeholder="Enter phone number" {...field} />
                    </FormControl>
                    <FormDescription>
                      Main contact number for your branch
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="contact_email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="flex items-center gap-2">
                      <Mail className="h-4 w-4" />
                      Contact Email
                    </FormLabel>
                    <FormControl>
                      <Input 
                        type="email" 
                        placeholder="Enter email address" 
                        {...field} 
                      />
                    </FormControl>
                    <FormDescription>
                      Main contact email for your branch
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <FormField
                control={form.control}
                name="regional_president"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="flex items-center gap-2">
                      <User className="h-4 w-4" />
                      Regional President
                    </FormLabel>
                    <FormControl>
                      <Input placeholder="Enter president's name" {...field} />
                    </FormControl>
                    <FormDescription>
                      Name of the regional president
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="regional_president_photo"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="flex items-center gap-2">
                      <Upload className="h-4 w-4" />
                      Regional President Photo
                    </FormLabel>
                    <FormControl>
                      <div className="space-y-2">
                        <Input
                          type="file"
                          accept="image/*"
                          onChange={handleImageUpload}
                          disabled={isUploadingPhoto}
                          className="file:mr-4 file:py-1 file:px-2 file:rounded-md file:border-0 file:text-sm file:font-medium file:bg-primary/10 file:text-primary hover:file:bg-primary/20"
                        />
                        {isUploadingPhoto && (
                          <div className="flex items-center gap-2 text-sm text-muted-foreground">
                            <Loader2 className="h-4 w-4 animate-spin" />
                            Uploading photo...
                          </div>
                        )}
                        {field.value && !isUploadingPhoto && (
                          <div className="space-y-2">
                            <p className="text-sm text-muted-foreground">
                              Photo uploaded successfully
                            </p>
                            {field.value.startsWith('http') && (
                              <div className="w-20 h-20 rounded-md overflow-hidden bg-muted">
                                <img 
                                  src={field.value} 
                                  alt="Regional president" 
                                  className="w-full h-full object-cover"
                                />
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    </FormControl>
                    <FormDescription>
                      Upload a portrait photo of the regional president
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="established_date"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="flex items-center gap-2">
                    <Calendar className="h-4 w-4" />
                    Established Date
                  </FormLabel>
                  <FormControl>
                    <Input 
                      type="date" 
                      {...field} 
                    />
                  </FormControl>
                  <FormDescription>
                    When this branch was established
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Hero Slide Images Section */}
            <div className="space-y-4">
              <div className="border-t pt-6">
                <div className="flex items-center gap-2 mb-4">
                  <Images className="h-5 w-5 text-primary" />
                  <h3 className="text-lg font-semibold">Hero Slide Images</h3>
                </div>
                <p className="text-sm text-muted-foreground mb-4">
                  Upload up to 4 images for the hero slider on your regional branch page. Images will automatically rotate to showcase your community.
                </p>
                
                {/* Upload Section */}
                <div className="space-y-4">
                  <div className="flex items-center gap-4">
                    <Input
                      type="file"
                      accept="image/*"
                      multiple
                      onChange={handleSlideUpload}
                      disabled={isUploadingSlides || slideImages.length >= 4}
                      className="file:mr-4 file:py-1 file:px-2 file:rounded-md file:border-0 file:text-sm file:font-medium file:bg-primary/10 file:text-primary hover:file:bg-primary/20"
                    />
                    {isUploadingSlides && (
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <Loader2 className="h-4 w-4 animate-spin" />
                        Uploading slides...
                      </div>
                    )}
                  </div>
                  
                  <p className="text-xs text-muted-foreground">
                    • Select up to {4 - slideImages.length} more images
                    • Recommended size: 1920x1080px or 16:9 aspect ratio
                    • Maximum file size: 10MB per image
                    • Supported formats: JPG, PNG, WebP
                  </p>
                </div>

                {/* Current Slides Display */}
                {slideImages.length > 0 && (
                  <div className="mt-6">
                    <h4 className="text-sm font-medium mb-3">Current Slide Images ({slideImages.length}/4)</h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {slideImages.map((slide, index) => (
                        <div key={index} className="relative group border rounded-lg overflow-hidden bg-muted">
                          <div className="aspect-video relative">
                            <img
                              src={slide.url}
                              alt={slide.alt}
                              className="w-full h-full object-cover"
                            />
                            {/* Delete button */}
                            <Button
                              type="button"
                              variant="destructive"
                              size="sm"
                              className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity"
                              onClick={() => removeSlide(index)}
                            >
                              <X className="h-4 w-4" />
                            </Button>
                          </div>
                          
                          {/* Alt text input */}
                          <div className="p-3">
                            <Label htmlFor={`slide-alt-${index}`} className="text-xs text-muted-foreground">
                              Image Description
                            </Label>
                            <Input
                              id={`slide-alt-${index}`}
                              value={slide.alt}
                              onChange={(e) => updateSlideAlt(index, e.target.value)}
                              placeholder="Describe this image..."
                              className="mt-1 text-sm h-8"
                            />
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>

            <div className="flex justify-end space-x-4 pt-6">
              <Button 
                type="button" 
                variant="outline"
                onClick={() => form.reset()}
              >
                Reset
              </Button>
              <Button 
                type="submit"
                disabled={updateRegion.isPending || isUploadingPhoto}
              >
                {updateRegion.isPending ? "Saving..." : "Save Changes"}
              </Button>
            </div>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
};

export default RegionalBranchForm;