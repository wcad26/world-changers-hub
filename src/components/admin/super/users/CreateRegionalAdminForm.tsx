import React, { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { useRegions } from "@/hooks/useRegions";
import { supabase } from "@/integrations/supabase/client";
import { Loader2, UserPlus } from "lucide-react";

const createAdminSchema = z.object({
  email: z.string().email("Please enter a valid email address"),
  firstName: z.string().min(2, "First name must be at least 2 characters"),
  lastName: z.string().min(2, "Last name must be at least 2 characters"),
  regionId: z.string().min(1, "Please select a region"),
  phone: z.string().optional(),
});

type CreateAdminFormData = z.infer<typeof createAdminSchema>;

const CreateRegionalAdminForm: React.FC = () => {
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();
  const { data: regions, isLoading: regionsLoading } = useRegions();

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    reset,
    formState: { errors },
  } = useForm<CreateAdminFormData>({
    resolver: zodResolver(createAdminSchema),
  });

  const selectedRegionId = watch("regionId");

  const onSubmit = async (data: CreateAdminFormData) => {
    try {
      setIsLoading(true);

      // Call the edge function to create the regional admin
      const { data: result, error } = await supabase.functions.invoke('create-regional-admin', {
        body: {
          email: data.email,
          firstName: data.firstName,
          lastName: data.lastName,
          regionId: data.regionId,
          phone: data.phone,
        },
      });

      if (error) throw error;

      if (result?.userExists) {
        toast({
          title: "User Already Exists",
          description: result.message,
          variant: "destructive",
        });
        return;
      }

      toast({
        title: "Success!",
        description: `Regional administrator account created successfully. An invitation email has been sent to ${data.email}.`,
      });

      reset();
    } catch (error: any) {
      console.error('Error creating regional admin:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to create regional administrator account. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="firstName">First Name</Label>
          <Input
            id="firstName"
            {...register("firstName")}
            placeholder="Enter first name"
            disabled={isLoading}
          />
          {errors.firstName && (
            <p className="text-sm text-destructive">{errors.firstName.message}</p>
          )}
        </div>

        <div className="space-y-2">
          <Label htmlFor="lastName">Last Name</Label>
          <Input
            id="lastName"
            {...register("lastName")}
            placeholder="Enter last name"
            disabled={isLoading}
          />
          {errors.lastName && (
            <p className="text-sm text-destructive">{errors.lastName.message}</p>
          )}
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="email">Email Address</Label>
        <Input
          id="email"
          type="email"
          {...register("email")}
          placeholder="Enter email address"
          disabled={isLoading}
        />
        {errors.email && (
          <p className="text-sm text-destructive">{errors.email.message}</p>
        )}
      </div>

      <div className="space-y-2">
        <Label htmlFor="phone">Phone Number (Optional)</Label>
        <Input
          id="phone"
          {...register("phone")}
          placeholder="Enter phone number"
          disabled={isLoading}
        />
        {errors.phone && (
          <p className="text-sm text-destructive">{errors.phone.message}</p>
        )}
      </div>

      <div className="space-y-2">
        <Label htmlFor="regionId">Region</Label>
        <Select
          disabled={isLoading || regionsLoading}
          value={selectedRegionId}
          onValueChange={(value) => setValue("regionId", value)}
        >
          <SelectTrigger>
            <SelectValue placeholder="Select a region" />
          </SelectTrigger>
          <SelectContent>
            {regions?.map((region) => (
              <SelectItem key={region.id} value={region.id}>
                {region.name} ({region.code})
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        {errors.regionId && (
          <p className="text-sm text-destructive">{errors.regionId.message}</p>
        )}
      </div>

      <Button type="submit" className="w-full" disabled={isLoading}>
        {isLoading ? (
          <>
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            Creating Account...
          </>
        ) : (
          <>
            <UserPlus className="mr-2 h-4 w-4" />
            Create Regional Administrator
          </>
        )}
      </Button>
    </form>
  );
};

export default CreateRegionalAdminForm;