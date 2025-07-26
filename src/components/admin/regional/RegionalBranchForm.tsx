import React, { useEffect } from "react";
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
import { MapPin, User, Phone, Mail, Calendar, FileText, Upload } from "lucide-react";
import { useRegionMutations } from "@/hooks/useRegionMutations";
import { useRegions } from "@/hooks/useRegions";
import { useAuth } from "@/hooks/useAuth";

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
});

type RegionalBranchFormData = z.infer<typeof regionalBranchSchema>;

const RegionalBranchForm = () => {
  const { user } = useAuth();
  const { data: regions, isLoading } = useRegions();
  const { updateRegion } = useRegionMutations();

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
        form.reset({
          name: userRegion.name || "",
          code: userRegion.code || "",
          description: userRegion.description || "",
          address: userRegion.address || "",
          contact_phone: userRegion.contact_phone || "",
          contact_email: userRegion.contact_email || "",
          regional_president: userRegion.regional_pastor || "",
          regional_president_photo: userRegion.regional_president_photo || "",
          established_date: userRegion.established_date || "",
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
        regional_pastor: data.regional_president || null,
        regional_president_photo: data.regional_president_photo || null,
        established_date: data.established_date || null,
      },
    });
  };

  const handleImageUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      // For now, we'll just store the file name
      // In a real implementation, you'd upload to storage and get a URL
      form.setValue("regional_president_photo", file.name);
    }
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
                          className="file:mr-4 file:py-1 file:px-2 file:rounded-md file:border-0 file:text-sm file:font-medium file:bg-primary/10 file:text-primary hover:file:bg-primary/20"
                        />
                        {field.value && (
                          <p className="text-sm text-muted-foreground">
                            Current: {field.value}
                          </p>
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
                disabled={updateRegion.isPending}
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