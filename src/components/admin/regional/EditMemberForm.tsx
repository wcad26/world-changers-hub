import React, { useState, useMemo } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage, FormDescription } from '@/components/ui/form';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from '@/components/ui/command';
import { Badge } from '@/components/ui/badge';
import { DialogFooter } from '@/components/ui/dialog';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import type { MemberWithProfile } from '@/hooks/useMembers';
import { useMembers } from '@/hooks/useMembers';
import { useMutation, useQueryClient, useQuery } from '@tanstack/react-query';
import { useAuth } from '@/hooks/useAuth';
import { useOccupations } from '@/hooks/useOccupations';
import { useMemberRelationships, useCreateMemberRelationship, useDeleteMemberRelationship, FamilyRelationshipType, invalidateRelationshipDependentQueries } from '@/hooks/useMemberRelationships';
import { Loader2, CalendarIcon, Search, User, BookOpen, Heart, Users, Church, Plus, X, Check, Shield } from 'lucide-react';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';

// Glassy section wrapper matching the public form
function GlassSection({ icon: Icon, title, children }: { icon: React.ElementType; title: string; children: React.ReactNode }) {
  return (
    <div className="rounded-2xl border border-border/40 bg-card/60 backdrop-blur-sm p-5 md:p-6 space-y-4 shadow-sm">
      <div className="flex items-center gap-2.5 pb-3 border-b border-border/30">
        <div className="flex items-center justify-center w-8 h-8 rounded-xl bg-primary/10">
          <Icon className="h-4 w-4 text-primary" />
        </div>
        <h3 className="text-base font-semibold text-foreground">{title}</h3>
      </div>
      {children}
    </div>
  );
}

const MINISTRY_OPTIONS = [
  'Music & Worship', 'Teaching & Preaching', 'Youth Ministry', "Children's Ministry",
  'Hospitality', 'Media & Technology', 'Administration', 'Counseling',
  'Prayer Ministry', 'Outreach & Evangelism'
];

const RELATIONSHIP_TYPES: { value: FamilyRelationshipType; label: string }[] = [
  { value: 'spouse', label: 'Spouse' },
  { value: 'parent', label: 'Parent' },
  { value: 'child', label: 'Child' },
  { value: 'sibling', label: 'Sibling' },
  { value: 'guardian', label: 'Guardian' },
  { value: 'other', label: 'Other' },
];

const editMemberSchema = z.object({
  first_name: z.string().min(1, 'First name is required'),
  last_name: z.string().min(1, 'Last name is required'),
  email: z.string().email('Invalid email address'),
  phone: z.string().optional(),
  address: z.string().optional(),
  date_of_birth: z.string().optional(),
  gender: z.string().optional(),
  occupation: z.string().optional(),
  member_type: z.enum(['member', 'visitor']).default('member'),
  has_completed_foundation_school: z.string().optional(),
  foundation_school_date: z.string().optional(),
  is_baptized: z.string().optional(),
  baptism_date: z.string().optional(),
  ministry_interests: z.array(z.string()).optional(),
  status: z.string().optional(),
});

type EditMemberFormData = z.infer<typeof editMemberSchema>;

interface EditMemberFormProps {
  member: MemberWithProfile;
  onSuccess: () => void;
}

const EditMemberForm: React.FC<EditMemberFormProps> = ({ member, onSuccess }) => {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { userRegion } = useAuth();
  const { data: occupations = [] } = useOccupations();
  const { data: existingMembers } = useMembers(userRegion?.id);
  const { data: existingRelationships } = useMemberRelationships(member.id);
  const createRelationship = useCreateMemberRelationship();
  const deleteRelationship = useDeleteMemberRelationship();

  // Fetch DCGs for the region
  const { data: dcgs = [] } = useQuery({
    queryKey: ['region-dcgs', userRegion?.id],
    queryFn: async () => {
      if (!userRegion?.id) return [];
      const { data } = await supabase
        .from('dcgs')
        .select('*')
        .eq('region_id', userRegion.id)
        .eq('is_active', true)
        .order('name');
      return data || [];
    },
    enabled: !!userRegion?.id,
  });

  // Fetch member's current DCG membership
  const { data: memberDcg } = useQuery({
    queryKey: ['member-dcg', member.id],
    queryFn: async () => {
      const { data } = await supabase
        .from('dcg_members')
        .select('dcg_id')
        .eq('member_id', member.id)
        .eq('is_active', true)
        .maybeSingle();
      return data?.dcg_id || '';
    },
    enabled: !!member.id,
  });

  const [selectedDcgId, setSelectedDcgId] = useState<string>('');
  React.useEffect(() => {
    if (memberDcg) setSelectedDcgId(memberDcg);
  }, [memberDcg]);

  // Family relationships state
  const [newRelType, setNewRelType] = useState<FamilyRelationshipType | ''>('');
  const [newRelMemberIds, setNewRelMemberIds] = useState<string[]>([]);
  const [memberSearchOpen, setMemberSearchOpen] = useState(false);

  // Derive initial form values from member data
  const form = useForm<EditMemberFormData>({
    resolver: zodResolver(editMemberSchema),
    defaultValues: {
      first_name: member.profiles?.first_name || '',
      last_name: member.profiles?.last_name || '',
      email: member.profiles?.email || '',
      phone: member.profiles?.phone || '',
      address: member.profiles?.address || '',
      date_of_birth: member.profiles?.date_of_birth || '',
      gender: member.profiles?.gender || '',
      occupation: member.profiles?.occupation || '',
      member_type: (member.member_type as 'member' | 'visitor') || 'member',
      has_completed_foundation_school: member.foundation_school_date ? 'yes' : member.membership_class_completed ? 'yes' : '',
      foundation_school_date: member.foundation_school_date || '',
      is_baptized: member.baptism_date ? 'yes' : '',
      baptism_date: member.baptism_date || '',
      ministry_interests: member.preferred_service_areas || [],
      status: member.status || 'active',
    },
  });

  const updateMember = useMutation({
    mutationFn: async (data: EditMemberFormData) => {
      // Update profile
      if (!member.profile_id) {
        throw new Error('This member has no linked profile record, so personal details cannot be updated.');
      }
      const { data: updatedProfiles, error: profileError } = await supabase
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
        })
        .eq('id', member.profile_id)
        .select('id');
      if (profileError) throw profileError;
      // A blocked update returns no error but changes nothing — treat that as a failure
      // instead of showing a false success message.
      if (!updatedProfiles || updatedProfiles.length === 0) {
        throw new Error("Personal details could not be saved — you may not have permission to edit this person's record.");
      }

      // Update member record
      const memberUpdate: Database['public']['Tables']['members']['Update'] = {
        member_type: data.member_type,
        status: data.status || 'active',
        preferred_service_areas: data.ministry_interests || [],
        foundation_school_date: data.has_completed_foundation_school === 'yes' ? (data.foundation_school_date || null) : null,
        membership_class_completed: data.has_completed_foundation_school === 'yes',
        baptism_date: data.is_baptized === 'yes' ? (data.baptism_date || null) : null,
      };
      const { data: updatedMembers, error: memberError } = await supabase
        .from('members')
        .update(memberUpdate)
        .eq('id', member.id)
        .select('id');
      if (memberError) throw memberError;
      if (!updatedMembers || updatedMembers.length === 0) {
        throw new Error('Membership details could not be saved — you may not have permission to edit this record.');
      }

      // Handle DCG change
      if (selectedDcgId !== (memberDcg || '')) {
        // Remove old DCG membership
        if (memberDcg) {
          await supabase
            .from('dcg_members')
            .delete()
            .eq('member_id', member.id)
            .eq('dcg_id', memberDcg);
        }
        // Add new DCG membership
        if (selectedDcgId) {
          await supabase
            .from('dcg_members')
            .insert({ member_id: member.id, dcg_id: selectedDcgId });
        }
      }

      return { success: true };
    },
    onSuccess: () => {
      toast({ title: "Success", description: "Member updated successfully." });
      // DOB changes can flip a record into/out of the strict child rule, so we
      // refresh every dependent dashboard / report cache, not just the members list.
      invalidateRelationshipDependentQueries(queryClient, [member.id]);
      if (userRegion?.id) {
        queryClient.invalidateQueries({ queryKey: ['member-dcg', member.id] });
      }
      setTimeout(() => onSuccess(), 100);
    },
    onError: (error: any) => {
      console.error('Update member error:', error);
      toast({
        title: "Error",
        description: error?.message || "Failed to update member.",
        variant: "destructive",
      });
    },
  });

  const handleAddRelationship = () => {
    if (!newRelType || newRelMemberIds.length === 0) return;
    newRelMemberIds.forEach(relId => {
      createRelationship.mutate({
        memberId: member.id,
        relatedMemberId: relId,
        relationshipType: newRelType as FamilyRelationshipType,
      });
    });
    setNewRelType('');
    setNewRelMemberIds([]);
  };

  const toggleMemberSelection = (memberId: string) => {
    setNewRelMemberIds(prev =>
      prev.includes(memberId) ? prev.filter(id => id !== memberId) : [...prev, memberId]
    );
  };

  const onSubmit = (data: EditMemberFormData) => {
    updateMember.mutate(data);
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-5">
        {/* Member Type & Status */}
        <GlassSection icon={Shield} title="Member Status">
          <div className="grid md:grid-cols-2 gap-4">
            <FormField
              control={form.control}
              name="member_type"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Member Type *</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value}>
                    <FormControl>
                      <SelectTrigger className="rounded-xl bg-background/60">
                        <SelectValue placeholder="Select type" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="member">Member</SelectItem>
                      <SelectItem value="visitor">Visitor</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="status"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Status</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value}>
                    <FormControl>
                      <SelectTrigger className="rounded-xl bg-background/60">
                        <SelectValue placeholder="Select status" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="active">Active</SelectItem>
                      <SelectItem value="inactive">Inactive</SelectItem>
                      <SelectItem value="new">New</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>
        </GlassSection>

        {/* Personal Information */}
        <GlassSection icon={User} title="Personal Information">
          <div className="grid md:grid-cols-2 gap-4">
            <FormField control={form.control} name="first_name" render={({ field }) => (
              <FormItem>
                <FormLabel>First Name *</FormLabel>
                <FormControl><Input placeholder="John" className="rounded-xl bg-background/60" {...field} /></FormControl>
                <FormMessage />
              </FormItem>
            )} />
            <FormField control={form.control} name="last_name" render={({ field }) => (
              <FormItem>
                <FormLabel>Last Name *</FormLabel>
                <FormControl><Input placeholder="Doe" className="rounded-xl bg-background/60" {...field} /></FormControl>
                <FormMessage />
              </FormItem>
            )} />
          </div>

          <div className="grid md:grid-cols-2 gap-4">
            <FormField control={form.control} name="email" render={({ field }) => (
              <FormItem>
                <FormLabel>Email *</FormLabel>
                <FormControl><Input type="email" placeholder="john@example.com" className="rounded-xl bg-background/60" {...field} /></FormControl>
                <FormMessage />
              </FormItem>
            )} />
            <FormField control={form.control} name="phone" render={({ field }) => (
              <FormItem>
                <FormLabel>Phone</FormLabel>
                <FormControl><Input type="tel" placeholder="+1 (555) 123-4567" className="rounded-xl bg-background/60" {...field} /></FormControl>
                <FormMessage />
              </FormItem>
            )} />
          </div>

          <FormField control={form.control} name="address" render={({ field }) => (
            <FormItem>
              <FormLabel>Address</FormLabel>
              <FormControl><Textarea placeholder="123 Main St, City, State" className="min-h-[80px] rounded-xl bg-background/60" {...field} /></FormControl>
              <FormMessage />
            </FormItem>
          )} />

          <div className="grid md:grid-cols-2 gap-4">
            <FormField control={form.control} name="date_of_birth" render={({ field }) => (
              <FormItem className="flex flex-col">
                <FormLabel>Date of Birth</FormLabel>
                <Popover>
                  <PopoverTrigger asChild>
                    <FormControl>
                      <Button variant="outline" className={cn("w-full pl-3 text-left font-normal rounded-xl bg-background/60", !field.value && "text-muted-foreground")}>
                        {field.value ? format(new Date(field.value), "PPP") : <span>Pick a date</span>}
                        <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                      </Button>
                    </FormControl>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar
                      mode="single"
                      selected={field.value ? new Date(field.value) : undefined}
                      onSelect={(date) => field.onChange(date ? format(date, 'yyyy-MM-dd') : '')}
                      disabled={(date) => date > new Date() || date < new Date("1900-01-01")}
                      initialFocus
                      captionLayout="dropdown-buttons"
                      fromYear={1900}
                      toYear={new Date().getFullYear()}
                    />
                  </PopoverContent>
                </Popover>
                <FormMessage />
              </FormItem>
            )} />
            <FormField control={form.control} name="gender" render={({ field }) => (
              <FormItem>
                <FormLabel>Gender</FormLabel>
                <Select onValueChange={field.onChange} value={field.value}>
                  <FormControl>
                    <SelectTrigger className="rounded-xl bg-background/60">
                      <SelectValue placeholder="Select gender" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <SelectItem value="male">Male</SelectItem>
                    <SelectItem value="female">Female</SelectItem>
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )} />
          </div>

          <FormField control={form.control} name="occupation" render={({ field }) => (
            <FormItem>
              <FormLabel>Occupation</FormLabel>
              <Select onValueChange={field.onChange} value={field.value}>
                <FormControl>
                  <SelectTrigger className="rounded-xl bg-background/60">
                    <SelectValue placeholder="Select occupation" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent className="max-h-[40vh]" position="popper">
                  {occupations.map((occ) => (
                    <SelectItem key={occ.id} value={occ.name}>{occ.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )} />
        </GlassSection>

        {/* Spiritual Information */}
        <GlassSection icon={BookOpen} title="Spiritual Information">
          <div className="space-y-3">
            <FormField control={form.control} name="has_completed_foundation_school" render={({ field }) => (
              <FormItem>
                <FormLabel>Has Completed Foundation School?</FormLabel>
                <Select onValueChange={field.onChange} value={field.value}>
                  <FormControl>
                    <SelectTrigger className="rounded-xl bg-background/60">
                      <SelectValue placeholder="Select answer" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <SelectItem value="yes">Yes</SelectItem>
                    <SelectItem value="no">No</SelectItem>
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )} />

            {form.watch('has_completed_foundation_school') === 'yes' && (
              <FormField control={form.control} name="foundation_school_date" render={({ field }) => (
                <FormItem className="flex flex-col">
                  <FormLabel>Foundation School Completion Date</FormLabel>
                  <Popover>
                    <PopoverTrigger asChild>
                      <FormControl>
                        <Button variant="outline" className={cn("w-full pl-3 text-left font-normal rounded-xl bg-background/60", !field.value && "text-muted-foreground")}>
                          {field.value ? format(new Date(field.value), "PPP") : <span>Pick a date</span>}
                          <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                        </Button>
                      </FormControl>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                      <Calendar mode="single" selected={field.value ? new Date(field.value) : undefined} onSelect={(date) => field.onChange(date ? format(date, 'yyyy-MM-dd') : '')} disabled={(date) => date > new Date()} initialFocus captionLayout="dropdown-buttons" fromYear={1900} toYear={new Date().getFullYear()} />
                    </PopoverContent>
                  </Popover>
                  <FormMessage />
                </FormItem>
              )} />
            )}
          </div>

          <div className="space-y-3">
            <FormField control={form.control} name="is_baptized" render={({ field }) => (
              <FormItem>
                <FormLabel>Has Been Baptized?</FormLabel>
                <Select onValueChange={field.onChange} value={field.value}>
                  <FormControl>
                    <SelectTrigger className="rounded-xl bg-background/60">
                      <SelectValue placeholder="Select answer" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <SelectItem value="yes">Yes</SelectItem>
                    <SelectItem value="no">No</SelectItem>
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )} />

            {form.watch('is_baptized') === 'yes' && (
              <FormField control={form.control} name="baptism_date" render={({ field }) => (
                <FormItem className="flex flex-col">
                  <FormLabel>Baptism Date</FormLabel>
                  <Popover>
                    <PopoverTrigger asChild>
                      <FormControl>
                        <Button variant="outline" className={cn("w-full pl-3 text-left font-normal rounded-xl bg-background/60", !field.value && "text-muted-foreground")}>
                          {field.value ? format(new Date(field.value), "PPP") : <span>Pick a date</span>}
                          <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                        </Button>
                      </FormControl>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                      <Calendar mode="single" selected={field.value ? new Date(field.value) : undefined} onSelect={(date) => field.onChange(date ? format(date, 'yyyy-MM-dd') : '')} disabled={(date) => date > new Date()} initialFocus captionLayout="dropdown-buttons" fromYear={1900} toYear={new Date().getFullYear()} />
                    </PopoverContent>
                  </Popover>
                  <FormMessage />
                </FormItem>
              )} />
            )}
          </div>
        </GlassSection>


        {/* Ministry & Service */}
        <GlassSection icon={Heart} title="Ministry & Service Interests">
          <FormField control={form.control} name="ministry_interests" render={() => (
            <FormItem>
              <FormDescription className="text-xs">Select areas of interest for ministry involvement</FormDescription>
              <div className="grid md:grid-cols-2 gap-3 mt-2">
                {MINISTRY_OPTIONS.map((ministry) => (
                  <FormField key={ministry} control={form.control} name="ministry_interests" render={({ field }) => (
                    <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                      <FormControl>
                        <Checkbox
                          checked={field.value?.includes(ministry)}
                          onCheckedChange={(checked) => {
                            return checked
                              ? field.onChange([...(field.value || []), ministry])
                              : field.onChange(field.value?.filter((v) => v !== ministry));
                          }}
                        />
                      </FormControl>
                      <FormLabel className="font-normal text-sm">{ministry}</FormLabel>
                    </FormItem>
                  )} />
                ))}
              </div>
              <FormMessage />
            </FormItem>
          )} />
        </GlassSection>

        {/* Family Relationships */}
        <GlassSection icon={Users} title="Family Relationships">
          {/* Existing relationships */}
          {existingRelationships && existingRelationships.length > 0 && (
            <div className="space-y-2">
              <p className="text-xs text-muted-foreground font-medium">Current Relationships</p>
              {existingRelationships.map((rel: any) => (
                <div key={rel.id} className="flex items-center gap-2 p-3 rounded-xl border border-border/30 bg-muted/30">
                  <Badge variant="secondary" className="capitalize rounded-lg">{rel.relationship_type}</Badge>
                  <span className="flex-1 text-sm">
                    {rel.related_member?.profiles?.last_name} {rel.related_member?.profiles?.first_name}
                  </span>
                  <Button type="button" variant="ghost" size="sm" onClick={() => deleteRelationship.mutate({ id: rel.id, memberId: member.id })}>
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              ))}
            </div>
          )}

          {/* Add new relationship */}
          <div className="space-y-4 p-4 rounded-xl border border-dashed border-border/40 bg-muted/20">
            <div className="grid md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">Relationship Type</label>
                <Select value={newRelType} onValueChange={(v) => setNewRelType(v as FamilyRelationshipType)}>
                  <SelectTrigger className="rounded-xl bg-background/60">
                    <SelectValue placeholder="Select type" />
                  </SelectTrigger>
                  <SelectContent>
                    {RELATIONSHIP_TYPES.map(rt => (
                      <SelectItem key={rt.value} value={rt.value}>{rt.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">
                  Select Related Members
                  {newRelMemberIds.length > 0 && (
                    <span className="ml-2 text-xs text-muted-foreground">({newRelMemberIds.length} selected)</span>
                  )}
                </label>
                <Popover open={memberSearchOpen} onOpenChange={setMemberSearchOpen}>
                  <PopoverTrigger asChild>
                    <Button type="button" variant="outline" role="combobox" className="w-full justify-between font-normal rounded-xl bg-background/60" disabled={!newRelType}>
                      {newRelMemberIds.length > 0 ? `${newRelMemberIds.length} member(s) selected` : 'Search members...'}
                      <Search className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-full p-0" align="start">
                    <Command>
                      <CommandInput placeholder="Search members..." />
                      <CommandList>
                        <CommandEmpty>No members found.</CommandEmpty>
                        <CommandGroup className="max-h-60 overflow-auto">
                          {existingMembers?.filter(m => m.id !== member.id).map(m => {
                            const isSelected = newRelMemberIds.includes(m.id);
                            return (
                              <CommandItem key={m.id} value={`${m.profiles?.last_name} ${m.profiles?.first_name}`} onSelect={() => toggleMemberSelection(m.id)}>
                                <div className={cn("mr-2 flex h-4 w-4 items-center justify-center rounded-sm border border-primary", isSelected ? "bg-primary text-primary-foreground" : "opacity-50")}>
                                  {isSelected && <Check className="h-3 w-3" />}
                                </div>
                                <span>{m.profiles?.last_name} {m.profiles?.first_name}</span>
                                <span className="ml-2 text-xs text-muted-foreground">{m.member_id}</span>
                              </CommandItem>
                            );
                          })}
                        </CommandGroup>
                      </CommandList>
                    </Command>
                  </PopoverContent>
                </Popover>
              </div>
            </div>

            {newRelMemberIds.length > 0 && (
              <div className="flex flex-wrap gap-1">
                {newRelMemberIds.map(mid => {
                  const m = existingMembers?.find(x => x.id === mid);
                  return (
                    <Badge key={mid} variant="outline" className="gap-1 rounded-lg">
                      {m ? `${m.profiles?.last_name} ${m.profiles?.first_name}` : mid}
                      <X className="h-3 w-3 cursor-pointer" onClick={() => toggleMemberSelection(mid)} />
                    </Badge>
                  );
                })}
              </div>
            )}

            <Button type="button" variant="secondary" size="sm" onClick={handleAddRelationship} disabled={!newRelType || newRelMemberIds.length === 0} className="w-full rounded-xl">
              <Plus className="h-4 w-4 mr-2" /> Add Relationship
            </Button>
          </div>
        </GlassSection>

        {/* DCG Selection */}
        <GlassSection icon={Church} title="DCG Assignment">
          <div className="space-y-2">
            <label className="text-sm font-medium">Select DCG</label>
            <Select value={selectedDcgId} onValueChange={setSelectedDcgId}>
              <SelectTrigger className="rounded-xl bg-background/60">
                <SelectValue placeholder="Select a DCG (optional)" />
              </SelectTrigger>
              <SelectContent className="max-h-[40vh]" position="popper">
                <SelectItem value="none">No DCG</SelectItem>
                {dcgs.map((dcg) => (
                  <SelectItem key={dcg.id} value={dcg.id}>
                    {dcg.name} {dcg.location && `- ${dcg.location}`}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </GlassSection>

        <DialogFooter className="pt-4 border-t border-border/30">
          <Button type="submit" disabled={updateMember.isPending} className="w-full sm:w-auto rounded-xl">
            {updateMember.isPending ? (
              <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Updating...</>
            ) : 'Update Member'}
          </Button>
        </DialogFooter>
      </form>
    </Form>
  );
};

export default EditMemberForm;
