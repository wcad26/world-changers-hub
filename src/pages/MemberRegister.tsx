import { useParams, useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useRegionBySlug } from '@/hooks/useRegionBySlug';
import { useMemberRegistration } from '@/hooks/useMemberRegistration';
import { useOccupations } from '@/hooks/useOccupations';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { memberRegistrationSchema, MemberRegistrationFormData } from '@/schemas/memberRegistrationSchema';
import { Button } from '@/components/ui/button';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage, FormDescription } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from 'sonner';
import type { FieldErrors } from 'react-hook-form';
import { Checkbox } from '@/components/ui/checkbox';
import { Loader2, CheckCircle2, ArrowLeft, Search, User, Heart, BookOpen, Users, Church, Briefcase } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useState } from 'react';
import { useLanguage } from '@/hooks/useLanguage';
import { format } from 'date-fns';
import Navbar from '@/components/layout/Navbar';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { CalendarIcon } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from '@/components/ui/command';
import { FamilyRelationshipType } from '@/hooks/useMemberRelationships';
import { Plus, X, Check } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

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

const MINISTRY_OPTIONS = [
  'Music & Worship',
  'Teaching & Preaching',
  'Youth Ministry',
  'Children\'s Ministry',
  'Hospitality',
  'Media & Technology',
  'Administration',
  'Counseling',
  'Prayer Ministry',
  'Outreach & Evangelism'
];

// Glassy section wrapper
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

export default function MemberRegister() {
  const { regionCode } = useParams<{ regionCode: string }>();
  const navigate = useNavigate();
  const { data: region, isLoading: regionLoading } = useRegionBySlug(regionCode);
  const { data: occupations = [] } = useOccupations();
  const { t } = useLanguage();

  const { data: dcgs = [], isLoading: dcgsLoading } = useQuery({
    queryKey: ['public-dcgs', region?.id],
    queryFn: async () => {
      if (!region?.id) return [];
      const { data, error } = await supabase
        .from('dcgs')
        .select('*')
        .eq('region_id', region.id)
        .eq('is_active', true)
        .order('name', { ascending: true });
      if (error) throw error;
      return data || [];
    },
    enabled: !!region?.id
  });

  const { mutate: registerMember, isPending } = useMemberRegistration();
  const [registrationSuccess, setRegistrationSuccess] = useState<{
    member_id: string;
    message: string;
    login_email: string;
    default_password: string;
  } | null>(null);
  const [duplicateInfo, setDuplicateInfo] = useState<{
    message: string;
    isVisitor: boolean;
  } | null>(null);

  const form = useForm<MemberRegistrationFormData>({
    resolver: zodResolver(memberRegistrationSchema),
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
      has_completed_foundation_school: '',
      foundation_school_date: '',
      is_baptized: '',
      baptism_date: '',
      ministry_interests: [],
      dcg_id: '',
      relationships: []
    }
  });

  const [relationships, setRelationships] = useState<RelationshipEntry[]>([]);
  const [currentRelType, setCurrentRelType] = useState<FamilyRelationshipType | ''>('');
  const [currentRelMemberIds, setCurrentRelMemberIds] = useState<string[]>([]);
  const [memberSearchOpen, setMemberSearchOpen] = useState(false);
  const [memberSearchText, setMemberSearchText] = useState('');
  const [isCheckingEmail, setIsCheckingEmail] = useState(false);

  const { data: allMembers = [] } = useQuery({
    queryKey: ['all-members-search', memberSearchText],
    queryFn: async () => {
      const { data, error } = await supabase.rpc('search_all_members', {
        _search: memberSearchText
      });
      if (error) throw error;
      return data || [];
    },
    enabled: true
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

  const onInvalid = (errors: FieldErrors<MemberRegistrationFormData>) => {
    const fieldLabels: Record<string, string> = {
      first_name: 'First name',
      last_name: 'Last name',
      email: 'Email',
      phone: 'Phone',
      address: 'Address',
      dcg_id: 'DCG selection',
    };
    const messages = Object.entries(errors)
      .map(([field, err]: any) => `${fieldLabels[field] || field}: ${err?.message || 'Required'}`)
      .filter(Boolean);
    form.setError('root', {
      message: messages.length
        ? `Please fix the following: ${messages.join(' • ')}`
        : 'Please complete all required fields before submitting.',
    });
    toast.error('Please fix the highlighted errors at the top of the form.');
    if (typeof window !== 'undefined') {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  const onSubmit = async (data: MemberRegistrationFormData) => {
    if (!region?.id) return;

    setIsCheckingEmail(true);
    try {
      const { data: existingProfile } = await supabase
        .from('profiles')
        .select('id, email')
        .eq('email', data.email.toLowerCase().trim())
        .maybeSingle();

      if (existingProfile) {
        const { data: existingMember } = await supabase
          .from('members')
          .select('member_type')
          .eq('profile_id', existingProfile.id)
          .eq('region_id', region.id)
          .maybeSingle();

        const isVisitor = existingMember?.member_type === 'visitor';
        setDuplicateInfo({
          message: isVisitor
            ? 'You are already registered as a visitor in this region.'
            : 'You are already registered as a member in this region.',
          isVisitor
        });
        setIsCheckingEmail(false);
        return;
      }
    } catch (error) {
      console.log('Email check failed, continuing with registration');
    }
    setIsCheckingEmail(false);

    registerMember(
      {
        ...data,
        region_id: region.id,
        relationships: relationships.length > 0 ? relationships.map(r => ({
          relationship_type: r.type,
          member_ids: r.memberIds,
        })) : undefined,
      },
      {
        onSuccess: (result) => {
          if (result.is_duplicate) {
            setDuplicateInfo({
              message: result.message,
              isVisitor: result.is_visitor || false
            });
            return;
          }
          setRegistrationSuccess({
            member_id: result.member_id!,
            message: result.message,
            login_email: result.login_email!,
            default_password: result.default_password!
          });
          form.reset();
        },
        onError: (error: any) => {
          form.setError('root', {
            message: error.message || t('registrationFailed')
          });
        }
      }
    );
  };

  // --- Loading State ---
  if (regionLoading) {
    return (
      <>
        <Navbar />
        <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary/5 via-background to-accent/5">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </>
    );
  }

  // --- Region Not Found ---
  if (!region) {
    return (
      <>
        <Navbar />
        <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary/5 via-background to-accent/5 p-4">
          <div className="glass-panel-soft max-w-md w-full p-8 text-center space-y-4">
            <h2 className="text-xl font-semibold text-foreground">{t('regionNotFound')}</h2>
            <p className="text-muted-foreground text-sm">{t('invalidRegionCode')}</p>
            <Button onClick={() => navigate('/')} className="w-full rounded-xl">
              <ArrowLeft className="mr-2 h-4 w-4" />
              {t('backToHome')}
            </Button>
          </div>
        </div>
      </>
    );
  }

  // --- Duplicate Detection ---
  if (duplicateInfo) {
    return (
      <>
        <Navbar />
        <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary/5 via-background to-accent/5 p-4">
          <div className="glass-panel-soft max-w-md w-full p-8 text-center space-y-5">
            <div className="w-14 h-14 rounded-2xl bg-accent/10 flex items-center justify-center mx-auto">
              <User className="h-7 w-7 text-accent" />
            </div>
            <h2 className="text-xl font-semibold">{t('welcomeBack')}</h2>
            <p className="text-muted-foreground text-sm">
              {duplicateInfo.isVisitor ? t('alreadyRegisteredAsVisitor') : t('alreadyRegisteredAsMember')}
            </p>
            <div className="flex flex-col gap-3 pt-2">
              <Button onClick={() => navigate(`/${regionCode}`)} className="w-full rounded-xl">
                {t('goToHomepage')}
              </Button>
              <Button variant="outline" onClick={() => setDuplicateInfo(null)} className="w-full rounded-xl">
                {t('tryDifferentEmail')}
              </Button>
            </div>
          </div>
        </div>
      </>
    );
  }

  // --- Success State ---
  if (registrationSuccess) {
    return (
      <>
        <Navbar />
        <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary/5 via-background to-accent/5 p-4">
          <div className="glass-panel-soft max-w-lg w-full p-8 text-center space-y-5">
            <div className="w-16 h-16 rounded-2xl bg-green-500/10 flex items-center justify-center mx-auto">
              <CheckCircle2 className="h-8 w-8 text-green-500" />
            </div>
            <h2 className="text-xl font-semibold text-foreground">{t('memberRegistrationSuccess')}</h2>
          </div>
        </div>
      </>
    );
  }

  // --- Main Form ---
  return (
    <>
      <Navbar />
      <div className="min-h-screen bg-gradient-to-br from-primary/5 via-background to-accent/5 py-6 px-4">
        <div className="max-w-3xl mx-auto space-y-6">
          {/* Hero Header */}
          <div className="glass-panel-hero text-primary-foreground p-6 md:p-8 text-center space-y-2 relative overflow-hidden">
            <div className="absolute inset-0 bg-[url('data:image/svg+xml,%3Csvg%20width%3D%2260%22%20height%3D%2260%22%20viewBox%3D%220%200%2060%2060%22%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%3E%3Cg%20fill%3D%22none%22%20fill-rule%3D%22evenodd%22%3E%3Cg%20fill%3D%22%23ffffff%22%20fill-opacity%3D%220.08%22%3E%3Ccircle%20cx%3D%2230%22%20cy%3D%2230%22%20r%3D%222%22%2F%3E%3C%2Fg%3E%3C%2Fg%3E%3C%2Fsvg%3E')] opacity-60" />
            <div className="relative z-10">
              <h1 className="text-2xl md:text-3xl font-bold tracking-tight">{t('memberRegistration')}</h1>
              <p className="text-sm md:text-base opacity-90 font-medium">{region.name}</p>
              <p className="text-xs md:text-sm opacity-75 mt-1">{t('memberWelcome')}</p>
            </div>
          </div>

          {/* Form */}
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-5">
              {form.formState.errors.root && (
                <Alert variant="destructive" className="rounded-xl">
                  <AlertDescription>{form.formState.errors.root.message}</AlertDescription>
                </Alert>
              )}

              {/* Personal Information */}
              <GlassSection icon={User} title={t('personalInformation')}>
                <div className="grid md:grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="first_name"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>{t('firstName')} *</FormLabel>
                        <FormControl>
                          <Input placeholder="John" className="rounded-xl bg-background/60" {...field} />
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
                        <FormLabel>{t('lastName')} *</FormLabel>
                        <FormControl>
                          <Input placeholder="Doe" className="rounded-xl bg-background/60" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <div className="grid md:grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="email"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>{t('email')} *</FormLabel>
                        <FormControl>
                          <Input type="email" placeholder="john.doe@example.com" className="rounded-xl bg-background/60" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="phone"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>{t('phone')} *</FormLabel>
                        <FormControl>
                          <Input type="tel" placeholder="+1 (555) 123-4567" className="rounded-xl bg-background/60" {...field} />
                        </FormControl>
                        <FormDescription className="text-xs">{t('phoneDescription')}</FormDescription>
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
                      <FormLabel>{t('address')} *</FormLabel>
                      <FormControl>
                        <Textarea placeholder="123 Main St, City, State, ZIP" className="min-h-[80px] rounded-xl bg-background/60" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="grid md:grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="date_of_birth"
                    render={({ field }) => (
                      <FormItem className="flex flex-col">
                        <FormLabel>{t('dateOfBirth')}</FormLabel>
                        <Popover>
                          <PopoverTrigger asChild>
                            <FormControl>
                              <Button
                                variant="outline"
                                className={cn(
                                  "w-full pl-3 text-left font-normal rounded-xl bg-background/60",
                                  !field.value && "text-muted-foreground"
                                )}
                              >
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
                            />
                          </PopoverContent>
                        </Popover>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="gender"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>{t('gender')}</FormLabel>
                        <Select onValueChange={field.onChange} value={field.value}>
                          <FormControl>
                            <SelectTrigger className="rounded-xl bg-background/60">
                              <SelectValue placeholder={t('selectGender')} />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="Male">{t('male')}</SelectItem>
                            <SelectItem value="Female">{t('female')}</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <FormField
                  control={form.control}
                  name="occupation"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{t('occupation')}</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value}>
                        <FormControl>
                          <SelectTrigger className="rounded-xl bg-background/60">
                            <SelectValue placeholder="Select your occupation" />
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
              </GlassSection>

              {/* Spiritual Information */}
              <GlassSection icon={BookOpen} title={t('spiritualInformation')}>
                <div className="space-y-3">
                  <FormField
                    control={form.control}
                    name="has_completed_foundation_school"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>{t('foundationSchool')}</FormLabel>
                        <Select onValueChange={field.onChange} value={field.value}>
                          <FormControl>
                            <SelectTrigger className="rounded-xl bg-background/60">
                              <SelectValue placeholder={t('selectAnswer')} />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="yes">{t('yes')}</SelectItem>
                            <SelectItem value="no">{t('no')}</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  {form.watch('has_completed_foundation_school') === 'yes' && (
                    <FormField
                      control={form.control}
                      name="foundation_school_date"
                      render={({ field }) => (
                        <FormItem className="flex flex-col">
                          <FormLabel>{t('foundationSchoolDate')}</FormLabel>
                          <Popover>
                            <PopoverTrigger asChild>
                              <FormControl>
                                <Button
                                  variant="outline"
                                  className={cn(
                                    "w-full pl-3 text-left font-normal rounded-xl bg-background/60",
                                    !field.value && "text-muted-foreground"
                                  )}
                                >
                                  {field.value ? format(new Date(field.value), "PPP") : <span>{t('pickDate')}</span>}
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
                      )}
                    />
                  )}
                </div>

                <div className="space-y-3">
                  <FormField
                    control={form.control}
                    name="is_baptized"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>{t('haveBaptized')}</FormLabel>
                        <Select onValueChange={field.onChange} value={field.value}>
                          <FormControl>
                            <SelectTrigger className="rounded-xl bg-background/60">
                              <SelectValue placeholder={t('selectAnswer')} />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="yes">{t('yes')}</SelectItem>
                            <SelectItem value="no">{t('no')}</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  {form.watch('is_baptized') === 'yes' && (
                    <FormField
                      control={form.control}
                      name="baptism_date"
                      render={({ field }) => (
                        <FormItem className="flex flex-col">
                          <FormLabel>{t('baptismDate')}</FormLabel>
                          <Popover>
                            <PopoverTrigger asChild>
                              <FormControl>
                                <Button
                                  variant="outline"
                                  className={cn(
                                    "w-full pl-3 text-left font-normal rounded-xl bg-background/60",
                                    !field.value && "text-muted-foreground"
                                  )}
                                >
                                  {field.value ? format(new Date(field.value), "PPP") : <span>{t('pickDate')}</span>}
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
                      )}
                    />
                  )}
                </div>
              </GlassSection>

              {/* Ministry & Service */}
              <GlassSection icon={Heart} title={t('ministryService')}>
                <FormField
                  control={form.control}
                  name="ministry_interests"
                  render={() => (
                    <FormItem>
                      <FormLabel>{t('ministryInterests')}</FormLabel>
                      <FormDescription className="text-xs">{t('ministryInterestsDescription')}</FormDescription>
                      <div className="grid md:grid-cols-2 gap-3 mt-2">
                        {MINISTRY_OPTIONS.map((ministry) => (
                          <FormField
                            key={ministry}
                            control={form.control}
                            name="ministry_interests"
                            render={({ field }) => (
                              <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                                <FormControl>
                                  <Checkbox
                                    checked={field.value?.includes(ministry)}
                                    onCheckedChange={(checked) => {
                                      return checked
                                        ? field.onChange([...(field.value || []), ministry])
                                        : field.onChange(field.value?.filter((value) => value !== ministry));
                                    }}
                                  />
                                </FormControl>
                                <FormLabel className="font-normal text-sm">{ministry}</FormLabel>
                              </FormItem>
                            )}
                          />
                        ))}
                      </div>
                      <FormMessage />
                    </FormItem>
                  )}
                />
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
                            const member = allMembers.find(m => m.id === mid);
                            return (
                              <Badge key={mid} variant="outline" className="rounded-lg">
                                {member ? `${member.last_name} ${member.first_name}` : mid}
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
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <label className="text-sm font-medium">Relationship Type</label>
                      <Select value={currentRelType} onValueChange={(v) => setCurrentRelType(v as FamilyRelationshipType)}>
                        <SelectTrigger className="rounded-xl bg-background/60">
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
                      <label className="text-sm font-medium">
                        Select Related Members
                        {currentRelMemberIds.length > 0 && (
                          <span className="ml-2 text-xs text-muted-foreground">
                            ({currentRelMemberIds.length} selected)
                          </span>
                        )}
                      </label>
                      <Popover open={memberSearchOpen} onOpenChange={setMemberSearchOpen}>
                        <PopoverTrigger asChild>
                          <Button
                            type="button"
                            variant="outline"
                            role="combobox"
                            className="w-full justify-between font-normal rounded-xl bg-background/60"
                            disabled={!currentRelType}
                          >
                            {currentRelMemberIds.length > 0
                              ? `${currentRelMemberIds.length} member(s) selected`
                              : 'Search and select members...'}
                            <Search className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                          </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-full p-0" align="start">
                          <Command>
                            <CommandInput
                              placeholder="Search members..."
                              onValueChange={setMemberSearchText}
                            />
                            <CommandList>
                              <CommandEmpty>No members found.</CommandEmpty>
                              <CommandGroup className="max-h-60 overflow-auto">
                                {allMembers.map(m => {
                                  const isSelected = currentRelMemberIds.includes(m.id);
                                  return (
                                    <CommandItem
                                      key={m.id}
                                      value={`${m.last_name} ${m.first_name}`}
                                      onSelect={() => toggleMemberSelection(m.id)}
                                    >
                                      <div className={cn(
                                        "mr-2 flex h-4 w-4 items-center justify-center rounded-sm border border-primary",
                                        isSelected ? "bg-primary text-primary-foreground" : "opacity-50"
                                      )}>
                                        {isSelected && <Check className="h-3 w-3" />}
                                      </div>
                                      <span>{m.last_name} {m.first_name}</span>
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
                        const member = allMembers.find(m => m.id === mid);
                        return (
                          <Badge key={mid} variant="outline" className="gap-1 rounded-lg">
                            {member ? `${member.last_name} ${member.first_name}` : mid}
                            <X className="h-3 w-3 cursor-pointer" onClick={() => toggleMemberSelection(mid)} />
                          </Badge>
                        );
                      })}
                    </div>
                  )}

                  <Button
                    type="button"
                    variant="secondary"
                    size="sm"
                    onClick={addRelationship}
                    disabled={!currentRelType || currentRelMemberIds.length === 0}
                    className="w-full rounded-xl"
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    Add Relationship
                  </Button>
                </div>
              </GlassSection>

              {/* DCG Selection */}
              <GlassSection icon={Church} title={t('dcgSelection')}>
                <FormField
                  control={form.control}
                  name="dcg_id"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{t('selectDcg')} *</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value}>
                        <FormControl>
                          <SelectTrigger className="rounded-xl bg-background/60">
                            <SelectValue placeholder={t('selectDcgPlaceholder')} />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent
                          className="max-h-[40vh] max-w-[var(--radix-select-trigger-width)] w-[var(--radix-select-trigger-width)]"
                          position="popper"
                          sideOffset={4}
                        >
                          {dcgsLoading ? (
                            <div className="flex items-center justify-center py-4">
                              <Loader2 className="h-4 w-4 animate-spin" />
                            </div>
                          ) : dcgs.length === 0 ? (
                            <div className="py-4 text-center text-sm text-muted-foreground">
                              No DCGs available for this region
                            </div>
                          ) : (
                            dcgs.map((dcg) => (
                              <SelectItem key={dcg.id} value={dcg.id} className="whitespace-normal break-words">
                                {dcg.name} {dcg.location && `- ${dcg.location}`}
                              </SelectItem>
                            ))
                          )}
                        </SelectContent>
                      </Select>
                      <FormDescription className="text-xs">{t('dcgDescription')}</FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </GlassSection>

              {/* Submit */}
              <Button
                type="submit"
                className="w-full h-12 rounded-xl text-base font-semibold bg-gradient-to-r from-primary to-secondary hover:from-primary/90 hover:to-secondary/90 shadow-md hover:shadow-lg transition-all duration-300 hover:-translate-y-0.5"
                disabled={isPending || isCheckingEmail}
              >
                {(isPending || isCheckingEmail) ? (
                  <>
                    <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                    {t('completeRegistration')}...
                  </>
                ) : (
                  t('completeRegistration')
                )}
              </Button>
            </form>
          </Form>
        </div>
      </div>
    </>
  );
}
