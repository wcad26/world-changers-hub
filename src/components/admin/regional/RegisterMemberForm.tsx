import React, { useState } from 'react';
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
import { useCreateMember, memberSchema, type NewMemberData } from '@/hooks/useMembers';
import { useMembers } from '@/hooks/useMembers';
import { useCreateMemberRelationship, FamilyRelationshipType } from '@/hooks/useMemberRelationships';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';
import { useOccupations } from '@/hooks/useOccupations';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
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

interface RelationshipEntry {
  type: FamilyRelationshipType;
  memberIds: string[];
}

const registerSchema = z.object({
  first_name: z.string().min(1, 'First name is required'),
  last_name: z.string().min(1, 'Last name is required'),
  email: z.string().email('Invalid email address'),
  phone: z.string().optional(),
  address: z.string().optional(),
  date_of_birth: z.string().optional(),
  gender: z.string().optional(),
  occupation: z.string().optional(),
  emergency_contact_name: z.string().optional(),
  emergency_contact_phone: z.string().optional(),
  member_type: z.enum(['member', 'visitor']).default('member'),
  has_completed_foundation_school: z.string().optional(),
  foundation_school_date: z.string().optional(),
  is_baptized: z.string().optional(),
  baptism_date: z.string().optional(),
  ministry_interests: z.array(z.string()).optional(),
});

type RegisterFormData = z.infer<typeof registerSchema>;

interface RegisterMemberFormProps {
  onSuccess?: () => void;
  customSubmit?: (data: NewMemberData) => void;
  isLoading?: boolean;
}

const RegisterMemberForm: React.FC<RegisterMemberFormProps> = ({ onSuccess, customSubmit, isLoading }) => {
  const { toast } = useToast();
  const { userRegion } = useAuth();
  const createMember = useCreateMember();
  const createRelationship = useCreateMemberRelationship();
  const { data: existingMembers } = useMembers(userRegion?.id);
  const { data: occupations = [] } = useOccupations();

  // Fetch DCGs
  const { data: dcgs = [] } = useQuery({
    queryKey: ['region-dcgs', userRegion?.id],
    queryFn: async () => {
      if (!userRegion?.id) return [];
      const { data } = await supabase.from('dcgs').select('*').eq('region_id', userRegion.id).eq('is_active', true).order('name');
      return data || [];
    },
    enabled: !!userRegion?.id,
  });

  const [selectedDcgId, setSelectedDcgId] = useState('');
  const [relationships, setRelationships] = useState<RelationshipEntry[]>([]);
  const [currentRelType, setCurrentRelType] = useState<FamilyRelationshipType | ''>('');
  const [currentRelMemberIds, setCurrentRelMemberIds] = useState<string[]>([]);
  const [memberSearchOpen, setMemberSearchOpen] = useState(false);

  const form = useForm<RegisterFormData>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      first_name: '', last_name: '', email: '', phone: '', address: '',
      date_of_birth: '', gender: '', occupation: '',
      emergency_contact_name: '', emergency_contact_phone: '',
      member_type: 'member',
      has_completed_foundation_school: '', foundation_school_date: '',
      is_baptized: '', baptism_date: '',
      ministry_interests: [],
    },
  });

  const addRelationship = () => {
    if (!currentRelType || currentRelMemberIds.length === 0) return;
    setRelationships(prev => [...prev, { type: currentRelType, memberIds: [...currentRelMemberIds] }]);
    setCurrentRelType('');
    setCurrentRelMemberIds([]);
  };

  const removeRelationship = (index: number) => {
    setRelationships(prev => prev.filter((_, i) => i !== index));
  };

  const toggleMemberSelection = (memberId: string) => {
    setCurrentRelMemberIds(prev =>
      prev.includes(memberId) ? prev.filter(id => id !== memberId) : [...prev, memberId]
    );
  };

  const onSubmit = (values: RegisterFormData) => {
    // Map to the existing NewMemberData type for the createMember hook
    const memberData: NewMemberData = {
      first_name: values.first_name,
      last_name: values.last_name,
      email: values.email,
      phone: values.phone,
      address: values.address,
      date_of_birth: values.date_of_birth,
      gender: values.gender,
      occupation: values.occupation,
      emergency_contact_name: values.emergency_contact_name,
      emergency_contact_phone: values.emergency_contact_phone,
      member_type: values.member_type,
    };

    if (customSubmit) {
      customSubmit(memberData);
      return;
    }

    createMember.mutate(memberData, {
      onSuccess: (data) => {
        // Create relationships
        if (data?.id) {
          relationships.forEach(rel => {
            rel.memberIds.forEach(relId => {
              createRelationship.mutate({
                memberId: data.id,
                relatedMemberId: relId,
                relationshipType: rel.type,
              });
            });
          });

          // Handle DCG assignment
          if (selectedDcgId && selectedDcgId !== 'none') {
            supabase.from('dcg_members').insert({ member_id: data.id, dcg_id: selectedDcgId }).then();
          }

          // Handle spiritual fields via direct member update
          const memberUpdates: Record<string, any> = {};
          if (values.has_completed_foundation_school === 'yes') {
            memberUpdates.membership_class_completed = true;
            if (values.foundation_school_date) memberUpdates.foundation_school_date = values.foundation_school_date;
          }
          if (values.is_baptized === 'yes' && values.baptism_date) {
            memberUpdates.baptism_date = values.baptism_date;
          }
          if (values.ministry_interests?.length) {
            memberUpdates.preferred_service_areas = values.ministry_interests;
          }
          if (Object.keys(memberUpdates).length > 0) {
            supabase.from('members').update(memberUpdates).eq('id', data.id).then();
          }
        }

        toast({
          title: 'Member Registered Successfully',
          description: `${values.first_name} ${values.last_name} has been registered.`,
        });
        form.reset();
        setRelationships([]);
        setSelectedDcgId('');
        onSuccess?.();
      },
      onError: (error: any) => {
        toast({
          title: 'Registration Failed',
          description: error.message || 'Failed to register member.',
          variant: 'destructive',
        });
      },
    });
  };

  const isPending = isLoading ?? createMember.isPending;

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-5">
        {/* Member Type */}
        <GlassSection icon={Shield} title="Member Type">
          <FormField control={form.control} name="member_type" render={({ field }) => (
            <FormItem>
              <FormLabel>Type *</FormLabel>
              <Select onValueChange={field.onChange} value={field.value}>
                <FormControl>
                  <SelectTrigger className="rounded-xl bg-background/60">
                    <SelectValue placeholder="Select member type" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  <SelectItem value="member">Member</SelectItem>
                  <SelectItem value="visitor">Visitor</SelectItem>
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )} />
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
                    <Calendar mode="single" selected={field.value ? new Date(field.value) : undefined} onSelect={(date) => field.onChange(date ? format(date, 'yyyy-MM-dd') : '')} disabled={(date) => date > new Date() || date < new Date("1900-01-01")} initialFocus captionLayout="dropdown-buttons" fromYear={1900} toYear={new Date().getFullYear()} />
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
                  <FormLabel>Foundation School Date</FormLabel>
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

        {/* Emergency Contact */}
        <GlassSection icon={Heart} title="Emergency Contact">
          <div className="grid md:grid-cols-2 gap-4">
            <FormField control={form.control} name="emergency_contact_name" render={({ field }) => (
              <FormItem>
                <FormLabel>Contact Name</FormLabel>
                <FormControl><Input placeholder="Jane Doe" className="rounded-xl bg-background/60" {...field} /></FormControl>
                <FormMessage />
              </FormItem>
            )} />
            <FormField control={form.control} name="emergency_contact_phone" render={({ field }) => (
              <FormItem>
                <FormLabel>Contact Phone</FormLabel>
                <FormControl><Input placeholder="+1 (555) 123-4567" className="rounded-xl bg-background/60" {...field} /></FormControl>
                <FormMessage />
              </FormItem>
            )} />
          </div>
        </GlassSection>

        {/* Ministry & Service */}
        <GlassSection icon={Heart} title="Ministry & Service Interests">
          <FormField control={form.control} name="ministry_interests" render={() => (
            <FormItem>
              <FormDescription className="text-xs">Select areas of interest</FormDescription>
              <div className="grid md:grid-cols-2 gap-3 mt-2">
                {MINISTRY_OPTIONS.map((ministry) => (
                  <FormField key={ministry} control={form.control} name="ministry_interests" render={({ field }) => (
                    <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                      <FormControl>
                        <Checkbox
                          checked={field.value?.includes(ministry)}
                          onCheckedChange={(checked) => checked
                            ? field.onChange([...(field.value || []), ministry])
                            : field.onChange(field.value?.filter((v) => v !== ministry))
                          }
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
        <GlassSection icon={Users} title="Family Relationships (Optional)">
          {relationships.length > 0 && (
            <div className="space-y-2">
              {relationships.map((rel, index) => (
                <div key={index} className="flex items-center gap-2 p-3 rounded-xl border border-border/30 bg-muted/30">
                  <Badge variant="secondary" className="capitalize rounded-lg">{rel.type}</Badge>
                  <div className="flex-1 flex flex-wrap gap-1">
                    {rel.memberIds.map(mid => {
                      const m = existingMembers?.find(x => x.id === mid);
                      return (
                        <Badge key={mid} variant="outline" className="rounded-lg">
                          {m ? `${m.profiles?.last_name} ${m.profiles?.first_name}` : mid}
                        </Badge>
                      );
                    })}
                  </div>
                  <Button type="button" variant="ghost" size="sm" onClick={() => removeRelationship(index)}>
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              ))}
            </div>
          )}

          <div className="space-y-4 p-4 rounded-xl border border-dashed border-border/40 bg-muted/20">
            <div className="grid md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">Relationship Type</label>
                <Select value={currentRelType} onValueChange={(v) => setCurrentRelType(v as FamilyRelationshipType)}>
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
                  {currentRelMemberIds.length > 0 && (
                    <span className="ml-2 text-xs text-muted-foreground">({currentRelMemberIds.length} selected)</span>
                  )}
                </label>
                <Popover open={memberSearchOpen} onOpenChange={setMemberSearchOpen}>
                  <PopoverTrigger asChild>
                    <Button type="button" variant="outline" role="combobox" className="w-full justify-between font-normal rounded-xl bg-background/60" disabled={!currentRelType}>
                      {currentRelMemberIds.length > 0 ? `${currentRelMemberIds.length} member(s) selected` : 'Search members...'}
                      <Search className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-full p-0" align="start">
                    <Command>
                      <CommandInput placeholder="Search members..." />
                      <CommandList>
                        <CommandEmpty>No members found.</CommandEmpty>
                        <CommandGroup className="max-h-60 overflow-auto">
                          {existingMembers?.map(m => {
                            const isSelected = currentRelMemberIds.includes(m.id);
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

            {currentRelMemberIds.length > 0 && (
              <div className="flex flex-wrap gap-1">
                {currentRelMemberIds.map(mid => {
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

            <Button type="button" variant="secondary" size="sm" onClick={addRelationship} disabled={!currentRelType || currentRelMemberIds.length === 0} className="w-full rounded-xl">
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

        {/* Submit */}
        <div className="flex justify-end space-x-4 pt-4 border-t border-border/30">
          <Button type="button" variant="outline" onClick={() => form.reset()} disabled={isPending} className="rounded-xl">
            Reset Form
          </Button>
          <Button type="submit" disabled={isPending} className="rounded-xl">
            {isPending ? (
              <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Registering...</>
            ) : 'Register Member'}
          </Button>
        </div>
      </form>
    </Form>
  );
};

export default RegisterMemberForm;
