import React from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { DialogFooter } from '@/components/ui/dialog';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { memberSchema, type NewMemberData, type MemberWithProfile } from '@/hooks/useMembers';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '@/hooks/useAuth';

interface EditMemberFormProps {
  member: MemberWithProfile;
  onSuccess: () => void;
}

const EditMemberForm: React.FC<EditMemberFormProps> = ({ member, onSuccess }) => {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { userRegion } = useAuth();

  const { register, handleSubmit, formState: { errors }, setValue, watch } = useForm<NewMemberData>({
    resolver: zodResolver(memberSchema),
    defaultValues: {
      first_name: member.profiles?.first_name || '',
      last_name: member.profiles?.last_name || '',
      email: member.profiles?.email || '',
      phone: member.profiles?.phone || '',
      address: member.profiles?.address || '',
      date_of_birth: member.profiles?.date_of_birth || '',
      gender: member.profiles?.gender || '',
      occupation: member.profiles?.occupation || '',
      emergency_contact_name: member.profiles?.emergency_contact_name || '',
      emergency_contact_phone: member.profiles?.emergency_contact_phone || '',
      member_type: member.member_type as 'member' | 'visitor',
    },
  });

  const updateMember = useMutation({
    mutationFn: async (data: NewMemberData) => {
      // Update profile - convert empty strings to null for optional fields
      const { error: profileError } = await supabase
        .from('profiles')
        .update({
          first_name: data.first_name,
          last_name: data.last_name,
          email: data.email,
          phone: data.phone || null,
          address: data.address || null,
          date_of_birth: data.date_of_birth || null,
          gender: data.gender ? data.gender.toLowerCase() : null,
          occupation: data.occupation || null,
          emergency_contact_name: data.emergency_contact_name || null,
          emergency_contact_phone: data.emergency_contact_phone || null,
        })
        .eq('id', member.profile_id);

      if (profileError) throw profileError;

      // Update member
      const { error: memberError } = await supabase
        .from('members')
        .update({
          member_type: data.member_type,
        })
        .eq('id', member.id);

      if (memberError) throw memberError;

      return { success: true };
    },
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Member updated successfully.",
      });
      if (userRegion?.id) {
        queryClient.invalidateQueries({ queryKey: ['members', userRegion.id] });
      }
      // Delay closing to let React finish rendering before dialog unmounts
      setTimeout(() => onSuccess(), 100);
    },
    onError: (error) => {
      console.error('Update member error:', error);
      toast({
        title: "Error",
        description: "Failed to update member. Please try again.",
        variant: "destructive",
      });
    },
  });

  const onSubmit = (data: NewMemberData) => {
    updateMember.mutate(data);
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="first_name">First Name *</Label>
          <Input
            id="first_name"
            {...register('first_name')}
            placeholder="Enter first name"
          />
          {errors.first_name && (
            <p className="text-sm text-red-500">{errors.first_name.message}</p>
          )}
        </div>

        <div className="space-y-2">
          <Label htmlFor="last_name">Last Name *</Label>
          <Input
            id="last_name"
            {...register('last_name')}
            placeholder="Enter last name"
          />
          {errors.last_name && (
            <p className="text-sm text-red-500">{errors.last_name.message}</p>
          )}
        </div>

        <div className="space-y-2">
          <Label htmlFor="email">Email *</Label>
          <Input
            id="email"
            type="email"
            {...register('email')}
            placeholder="Enter email address"
          />
          {errors.email && (
            <p className="text-sm text-red-500">{errors.email.message}</p>
          )}
        </div>

        <div className="space-y-2">
          <Label htmlFor="phone">Phone</Label>
          <Input
            id="phone"
            {...register('phone')}
            placeholder="Enter phone number"
          />
          {errors.phone && (
            <p className="text-sm text-red-500">{errors.phone.message}</p>
          )}
        </div>

        <div className="space-y-2">
          <Label htmlFor="date_of_birth">Date of Birth</Label>
          <Input
            id="date_of_birth"
            type="date"
            {...register('date_of_birth')}
          />
          {errors.date_of_birth && (
            <p className="text-sm text-red-500">{errors.date_of_birth.message}</p>
          )}
        </div>

        <div className="space-y-2">
          <Label htmlFor="gender">Gender</Label>
          <Select value={watch('gender')} onValueChange={(value) => setValue('gender', value)}>
            <SelectTrigger>
              <SelectValue placeholder="Select gender" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="male">Male</SelectItem>
              <SelectItem value="female">Female</SelectItem>
              <SelectItem value="other">Other</SelectItem>
            </SelectContent>
          </Select>
          {errors.gender && (
            <p className="text-sm text-red-500">{errors.gender.message}</p>
          )}
        </div>

        <div className="space-y-2">
          <Label htmlFor="occupation">Occupation</Label>
          <Input
            id="occupation"
            {...register('occupation')}
            placeholder="Enter occupation"
          />
          {errors.occupation && (
            <p className="text-sm text-red-500">{errors.occupation.message}</p>
          )}
        </div>

        <div className="space-y-2">
          <Label htmlFor="member_type">Member Type</Label>
          <Select value={watch('member_type')} onValueChange={(value) => setValue('member_type', value as 'member' | 'visitor')}>
            <SelectTrigger>
              <SelectValue placeholder="Select member type" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="member">Member</SelectItem>
              <SelectItem value="visitor">Visitor</SelectItem>
            </SelectContent>
          </Select>
          {errors.member_type && (
            <p className="text-sm text-red-500">{errors.member_type.message}</p>
          )}
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="address">Address</Label>
        <Textarea
          id="address"
          {...register('address')}
          placeholder="Enter full address"
          rows={3}
        />
        {errors.address && (
          <p className="text-sm text-red-500">{errors.address.message}</p>
        )}
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="emergency_contact_name">Emergency Contact Name</Label>
          <Input
            id="emergency_contact_name"
            {...register('emergency_contact_name')}
            placeholder="Enter emergency contact name"
          />
          {errors.emergency_contact_name && (
            <p className="text-sm text-red-500">{errors.emergency_contact_name.message}</p>
          )}
        </div>

        <div className="space-y-2">
          <Label htmlFor="emergency_contact_phone">Emergency Contact Phone</Label>
          <Input
            id="emergency_contact_phone"
            {...register('emergency_contact_phone')}
            placeholder="Enter emergency contact phone"
          />
          {errors.emergency_contact_phone && (
            <p className="text-sm text-red-500">{errors.emergency_contact_phone.message}</p>
          )}
        </div>
      </div>

      <DialogFooter>
        <Button type="submit" disabled={updateMember.isPending}>
          {updateMember.isPending ? 'Updating...' : 'Update Member'}
        </Button>
      </DialogFooter>
    </form>
  );
};

export default EditMemberForm;