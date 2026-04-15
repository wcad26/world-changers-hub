
import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useCreateMember, memberSchema, type NewMemberData } from '@/hooks/useMembers';
import { useMembers } from '@/hooks/useMembers';
import { useCreateMemberRelationship, FamilyRelationshipType } from '@/hooks/useMemberRelationships';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';
import { Loader2, ChevronDown, ChevronUp, Search } from 'lucide-react';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { useOccupations } from '@/hooks/useOccupations';
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from '@/components/ui/command';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';

interface RegisterMemberFormProps {
  onSuccess?: () => void;
  customSubmit?: (data: NewMemberData) => void;
  isLoading?: boolean;
}

const RELATIONSHIP_TYPES: { value: FamilyRelationshipType; label: string }[] = [
  { value: 'spouse', label: 'Spouse' },
  { value: 'parent', label: 'Parent' },
  { value: 'child', label: 'Child' },
  { value: 'sibling', label: 'Sibling' },
  { value: 'guardian', label: 'Guardian' },
  { value: 'other', label: 'Other' },
];

const RegisterMemberForm: React.FC<RegisterMemberFormProps> = ({ onSuccess, customSubmit, isLoading }) => {
  const { toast } = useToast();
  const { userRegion } = useAuth();
  const createMember = useCreateMember();
  const createRelationship = useCreateMemberRelationship();
  const { data: existingMembers } = useMembers(userRegion?.id);
  const { data: occupations = [] } = useOccupations();

  const [isRelationshipOpen, setIsRelationshipOpen] = useState(false);
  const [relationshipType, setRelationshipType] = useState<FamilyRelationshipType | ''>('');
  const [relatedMemberId, setRelatedMemberId] = useState('');
  const [memberSearchOpen, setMemberSearchOpen] = useState(false);

  const form = useForm<NewMemberData>({
    resolver: zodResolver(memberSchema),
    defaultValues: {
      first_name: '',
      last_name: '',
      email: '',
      phone: '',
      address: '',
      date_of_birth: '',
      gender: '',
      occupation: '',
      emergency_contact_name: '',
      emergency_contact_phone: '',
      member_type: 'member',
    },
  });

  const selectedRelatedMember = existingMembers?.find(m => m.id === relatedMemberId);

  const onSubmit = (values: NewMemberData) => {
    console.log('RegisterMemberForm: Submitting form with values:', values);
    
    if (customSubmit) {
      customSubmit(values);
      return;
    }
    
    createMember.mutate(values, {
      onSuccess: (data) => {
        console.log('RegisterMemberForm: Member creation successful:', data);
        
        // If relationship fields are filled, create the relationship
        if (relationshipType && relatedMemberId && data?.id) {
          createRelationship.mutate({
            memberId: data.id,
            relatedMemberId,
            relationshipType: relationshipType as FamilyRelationshipType,
          });
        }
        
        toast({
          title: 'Member Registered Successfully',
          description: `${values.first_name} ${values.last_name} has been registered. An invitation email has been sent to ${values.email}.`,
        });
        form.reset();
        setRelationshipType('');
        setRelatedMemberId('');
        if (onSuccess) {
          onSuccess();
        }
      },
      onError: (error: any) => {
        console.error('RegisterMemberForm: Member creation failed:', error);
        toast({
          title: 'Registration Failed',
          description: error.message || 'Failed to register member. Please try again.',
          variant: 'destructive',
        });
      },
    });
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        {/* Personal Information Section */}
        <div className="space-y-4">
          <h3 className="text-lg font-medium text-gray-900">Personal Information</h3>
          
          <FormField
            control={form.control}
            name="member_type"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Member Type *</FormLabel>
                <Select onValueChange={field.onChange} defaultValue={field.value}>
                  <FormControl>
                    <SelectTrigger>
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
            )}
          />
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <FormField
              control={form.control}
              name="first_name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>First Name *</FormLabel>
                  <FormControl>
                    <Input placeholder="John" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="last_name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Last Name *</FormLabel>
                  <FormControl>
                    <Input placeholder="Doe" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>

          <FormField
            control={form.control}
            name="email"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Email Address *</FormLabel>
                <FormControl>
                  <Input type="email" placeholder="john.doe@example.com" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <FormField
              control={form.control}
              name="phone"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Phone Number</FormLabel>
                  <FormControl>
                    <Input placeholder="(123) 456-7890" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="gender"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Gender</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger>
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
              )}
            />
          </div>

          <FormField
            control={form.control}
            name="address"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Address</FormLabel>
                <FormControl>
                  <Input placeholder="123 Main St, City, State" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <FormField
              control={form.control}
              name="date_of_birth"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Date of Birth</FormLabel>
                  <FormControl>
                    <Input type="date" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="occupation"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Occupation</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select occupation" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent className="max-h-[40vh]" position="popper">
                      {occupations.map((occ) => (
                        <SelectItem key={occ.id} value={occ.name}>
                          {occ.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>
        </div>

        {/* Emergency Contact Section */}
        <div className="space-y-4">
          <h3 className="text-lg font-medium text-gray-900">Emergency Contact</h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <FormField
              control={form.control}
              name="emergency_contact_name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Emergency Contact Name</FormLabel>
                  <FormControl>
                    <Input placeholder="Jane Doe" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="emergency_contact_phone"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Emergency Contact Phone</FormLabel>
                  <FormControl>
                    <Input placeholder="(123) 456-7890" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>
        </div>

        {/* Family Relationship Section */}
        <Collapsible open={isRelationshipOpen} onOpenChange={setIsRelationshipOpen}>
          <CollapsibleTrigger asChild>
            <Button type="button" variant="outline" className="w-full justify-between">
              <span className="text-lg font-medium">Family Relationship (Optional)</span>
              {isRelationshipOpen ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
            </Button>
          </CollapsibleTrigger>
          <CollapsibleContent className="space-y-4 pt-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">Relationship Type</label>
                <Select value={relationshipType} onValueChange={(v) => setRelationshipType(v as FamilyRelationshipType)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select relationship type" />
                  </SelectTrigger>
                  <SelectContent>
                    {RELATIONSHIP_TYPES.map(rt => (
                      <SelectItem key={rt.value} value={rt.value}>{rt.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">Related Member</label>
                <Popover open={memberSearchOpen} onOpenChange={setMemberSearchOpen}>
                  <PopoverTrigger asChild>
                    <Button
                      type="button"
                      variant="outline"
                      role="combobox"
                      className="w-full justify-between font-normal"
                    >
                      {selectedRelatedMember
                        ? `${selectedRelatedMember.profiles?.last_name} ${selectedRelatedMember.profiles?.first_name}`
                        : 'Search for a member...'}
                      <Search className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-full p-0" align="start">
                    <Command>
                      <CommandInput placeholder="Search members..." />
                      <CommandList>
                        <CommandEmpty>No members found.</CommandEmpty>
                        <CommandGroup className="max-h-60 overflow-auto">
                          {existingMembers?.map(m => (
                            <CommandItem
                              key={m.id}
                              value={`${m.profiles?.last_name} ${m.profiles?.first_name} ${m.profiles?.email}`}
                              onSelect={() => {
                                setRelatedMemberId(m.id);
                                setMemberSearchOpen(false);
                              }}
                            >
                              <span>{m.profiles?.last_name} {m.profiles?.first_name}</span>
                              <span className="ml-2 text-xs text-muted-foreground">{m.member_id}</span>
                            </CommandItem>
                          ))}
                        </CommandGroup>
                      </CommandList>
                    </Command>
                  </PopoverContent>
                </Popover>
              </div>
            </div>
          </CollapsibleContent>
        </Collapsible>

        <div className="flex justify-end space-x-4 pt-4 border-t">
          <Button
            type="button"
            variant="outline"
            onClick={() => form.reset()}
            disabled={isLoading ?? createMember.isPending}
          >
            Reset Form
          </Button>
          <Button type="submit" disabled={isLoading ?? createMember.isPending}>
            {(isLoading ?? createMember.isPending) ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Registering Member...
              </>
            ) : (
              'Register Member'
            )}
          </Button>
        </div>
      </form>
    </Form>
  );
};

export default RegisterMemberForm;
