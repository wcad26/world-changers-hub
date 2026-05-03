import { useParams, useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useRegionBySlug } from '@/hooks/useRegionBySlug';
import { useVisitorRegistration } from '@/hooks/useVisitorRegistration';
import { usePublicRegionEvents } from '@/hooks/usePublicRegionEvents';
import { useOccupations } from '@/hooks/useOccupations';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { visitorRegistrationSchema, VisitorRegistrationFormData } from '@/schemas/visitorRegistrationSchema';
import { Button } from '@/components/ui/button';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Loader2, CheckCircle2, User, UserCheck, CalendarDays, Heart, Search, X, Check, Briefcase } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { useState, useEffect } from 'react';
import { useLanguage } from '@/hooks/useLanguage';
import { format } from 'date-fns';
import Navbar from '@/components/layout/Navbar';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { CalendarIcon } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from '@/components/ui/command';

const nativeSelectClassName = "flex h-10 w-full rounded-xl border border-input bg-background/60 px-3 py-2 text-sm text-foreground ring-offset-background focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50";

// Glassy section wrapper - matching MemberRegister style
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

export default function VisitorRegister() {
  const { regionCode } = useParams<{ regionCode: string }>();
  const navigate = useNavigate();
  const { data: region, isLoading: regionLoading } = useRegionBySlug(regionCode);
  const { data: events = [] } = usePublicRegionEvents(region?.id);
  const { data: occupations = [] } = useOccupations();
  const pastEvents = events;

  const { mutate: registerVisitor, isPending } = useVisitorRegistration();
  const [registrationSuccess, setRegistrationSuccess] = useState<{
    visitor_id: string;
    message: string;
  } | null>(null);
  const [alreadyEnrolled, setAlreadyEnrolled] = useState<{
    visitor_id?: string;
    member_type?: 'visitor' | 'member';
    message: string;
  } | null>(null);
  const { t, localizedField } = useLanguage();

  // Member search for "invited by" referral
  const [referralMemberIds, setReferralMemberIds] = useState<string[]>([]);
  const [referralSearchOpen, setReferralSearchOpen] = useState(false);
  const [referralSearchText, setReferralSearchText] = useState('');

  const { data: allMembers = [] } = useQuery({
    queryKey: ['all-members-search', referralSearchText],
    queryFn: async () => {
      const { data, error } = await supabase.rpc('search_all_members', {
        _search: referralSearchText
      });
      if (error) throw error;
      return data || [];
    },
    enabled: true
  });

  const toggleReferralMember = (memberId: string) => {
    setReferralMemberIds(prev => {
      const updated = prev.includes(memberId)
        ? prev.filter(id => id !== memberId)
        : [...prev, memberId];
      form.setValue('referral_member_ids', updated, { shouldValidate: true });
      return updated;
    });
  };

  const form = useForm<VisitorRegistrationFormData>({
    resolver: zodResolver(visitorRegistrationSchema),
    defaultValues: {
      first_name: '',
      last_name: '',
      email: '',
      phone: '',
      address: '',
      date_of_birth: '',
      gender: '',
      occupation: '',
      rated_event_id: undefined,
      event_satisfaction_rating: undefined,
      referral_source: '',
      referral_social_media: '',
      referral_member_ids: [],
      referral_relationship_type: undefined,
      referral_other_details: ''
    }
  });

  const onSubmit = (data: VisitorRegistrationFormData) => {
    if (!region?.id) return;
    registerVisitor(
      {
        ...data,
        referral_member_ids: referralMemberIds.length > 0 ? referralMemberIds : undefined,
        region_id: region.id
      },
      {
        onSuccess: result => {
          if (result.isDuplicate) {
            setAlreadyEnrolled({
              visitor_id: result.visitor_id,
              member_type: result.member_type,
              message: result.message || t('alreadyRegisteredMessage')
            });
          } else {
            setRegistrationSuccess({
              visitor_id: result.visitor_id || '',
              message: result.message || ''
            });
            form.reset();
            setReferralMemberIds([]);
          }
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
            <p className="text-muted-foreground text-sm">{t('regionNotFoundDesc')}</p>
            <Button onClick={() => navigate('/')} className="w-full rounded-xl">
              {t('returnToHome')}
            </Button>
          </div>
        </div>
      </>
    );
  }

  // --- Already Enrolled ---
  if (alreadyEnrolled) {
    const isMember = alreadyEnrolled.member_type === 'member';
    return (
      <>
        <Navbar />
        <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary/5 via-background to-accent/5 p-4">
          <div className="glass-panel-soft max-w-md w-full p-8 text-center space-y-5">
            <div className="w-14 h-14 rounded-2xl bg-accent/10 flex items-center justify-center mx-auto">
              <UserCheck className="h-7 w-7 text-accent" />
            </div>
            <h2 className="text-xl font-semibold">{t('welcomeBack')}</h2>
            <p className="text-muted-foreground text-sm">
              {isMember ? t('alreadyRegisteredAsMember') : t('alreadyRegisteredAsVisitor')}
            </p>
            {alreadyEnrolled.visitor_id && (
              <div className="bg-muted/30 rounded-xl p-4 text-center">
                <p className="text-sm text-muted-foreground mb-1">{isMember ? t('yourMemberId') : t('yourVisitorId')}</p>
                <p className="font-mono font-semibold">{alreadyEnrolled.visitor_id}</p>
              </div>
            )}
            <div className="flex flex-col gap-3 pt-2">
              <Button onClick={() => navigate(`/${regionCode}`)} className="w-full rounded-xl">
                {t('goToHomepage')}
              </Button>
              <Button variant="outline" onClick={() => setAlreadyEnrolled(null)} className="w-full rounded-xl">
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
          <div className="glass-panel-soft max-w-md w-full p-8 text-center space-y-5">
            <div className="w-16 h-16 rounded-2xl bg-green-500/10 flex items-center justify-center mx-auto">
              <CheckCircle2 className="h-8 w-8 text-green-500" />
            </div>
            <h2 className="text-xl font-semibold text-foreground">{t('registrationSuccessful')}</h2>
            <p className="text-muted-foreground text-sm">{t('vipWelcomeMessage')}</p>
            <Button onClick={() => setRegistrationSuccess(null)} className="w-full rounded-xl">
              {t('registerAnotherVisitor')}
            </Button>
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
              <h1 className="text-2xl md:text-3xl font-bold tracking-tight">{t('visitorRegTitle')}</h1>
              <p className="text-sm md:text-base opacity-90 font-medium">{region.name}</p>
              <p className="text-xs md:text-sm opacity-75 mt-1">{t('visitorRegDescription')}</p>
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
                        <FormLabel>{t('emailAddress')} *</FormLabel>
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
                        <FormLabel>{t('phoneNumber')} *</FormLabel>
                        <FormControl>
                          <Input type="tel" placeholder="+1 (555) 123-4567" className="rounded-xl bg-background/60" {...field} />
                        </FormControl>
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
                                type="button"
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
                    name="gender"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>{t('gender')}</FormLabel>
                        <FormControl>
                          <select
                            className={nativeSelectClassName}
                            value={field.value || ''}
                            onChange={(e) => field.onChange(e.target.value)}
                          >
                            <option value="" disabled>{t('selectGender')}</option>
                            <option value="Male">{t('male')}</option>
                            <option value="Female">{t('female')}</option>
                          </select>
                        </FormControl>
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
                      <FormControl>
                        <select
                          className={nativeSelectClassName}
                          value={field.value || ''}
                          onChange={(e) => field.onChange(e.target.value)}
                        >
                          <option value="" disabled>Select your occupation</option>
                          {occupations.map((occ) => (
                            <option key={occ.id} value={occ.name}>
                              {occ.name}
                            </option>
                          ))}
                        </select>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </GlassSection>

              {/* Event & Referral */}
              <GlassSection icon={CalendarDays} title="Event & Referral">
                {/* Event Selection */}
                {pastEvents.length > 0 && (
                  <FormField
                    control={form.control}
                    name="rated_event_id"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>{t('selectEvent')}</FormLabel>
                        <p className="text-xs text-muted-foreground mb-2">
                          Select the event you attended
                        </p>
                        <FormControl>
                          <select
                            className={nativeSelectClassName}
                            value={field.value || ''}
                            onChange={(e) => field.onChange(e.target.value)}
                          >
                            <option value="" disabled>{t('selectEventPlaceholder')}</option>
                            {pastEvents.map((event) => (
                              <option key={event.id} value={event.id}>
                                {(localizedField(event.name, event.name_fr) || event.name || 'Unnamed Event')} — {format(new Date(event.start_datetime), 'PPP')}
                              </option>
                            ))}
                          </select>
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                )}

                {/* Event Satisfaction Rating */}
                {form.watch('rated_event_id') && (
                  <FormField
                    control={form.control}
                    name="event_satisfaction_rating"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>{t('eventSatisfaction')}</FormLabel>
                        <FormControl>
                          <RadioGroup
                            onValueChange={(value) => field.onChange(parseInt(value))}
                            value={field.value?.toString()}
                            className="flex flex-wrap gap-3"
                          >
                            {[1, 2, 3, 4, 5].map((rating) => (
                              <div key={rating} className="flex items-center space-x-2">
                                <RadioGroupItem value={rating.toString()} id={`rating-${rating}`} />
                                <label htmlFor={`rating-${rating}`} className="text-sm font-medium cursor-pointer">
                                  {rating}
                                </label>
                              </div>
                            ))}
                          </RadioGroup>
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                )}

                {/* Referral Source */}
                <FormField
                  control={form.control}
                  name="referral_source"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{t('referralSource')}</FormLabel>
                      <FormControl>
                        <select
                          className={nativeSelectClassName}
                          value={field.value || ''}
                          onChange={(e) => field.onChange(e.target.value)}
                        >
                          <option value="" disabled>{t('selectReferralSource')}</option>
                          <option value="invited_by">{t('invitedBy')}</option>
                          <option value="social_media">{t('socialMedia')}</option>
                          <option value="website">{t('website')}</option>
                          <option value="other">{t('other')}</option>
                        </select>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* Invited By — Relationship-style layout (member left, relationship right) */}
                {form.watch('referral_source') === 'invited_by' && (
                  <div className="space-y-3">
                    <label className="text-sm font-medium">
                      {t('referralPersonName') || 'Who invited you?'} *
                    </label>
                    <div className="space-y-4 p-4 rounded-xl border border-dashed border-border/40 bg-muted/20">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {/* Member Select (Left) */}
                        <div className="space-y-2">
                          <label className="text-sm font-medium">
                            Select Member(s)
                            {referralMemberIds.length > 0 && (
                              <span className="ml-2 text-xs text-muted-foreground">
                                ({referralMemberIds.length} selected)
                              </span>
                            )}
                          </label>
                          <Popover open={referralSearchOpen} onOpenChange={setReferralSearchOpen}>
                            <PopoverTrigger asChild>
                              <Button
                                type="button"
                                variant="outline"
                                role="combobox"
                                className="w-full justify-between font-normal rounded-xl bg-background/60"
                              >
                                {referralMemberIds.length > 0
                                  ? `${referralMemberIds.length} member(s) selected`
                                  : 'Search and select members...'}
                                <Search className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                              </Button>
                            </PopoverTrigger>
                            <PopoverContent className="w-full p-0" align="start">
                              <Command>
                                <CommandInput
                                  placeholder="Search members..."
                                  onValueChange={setReferralSearchText}
                                />
                                <CommandList>
                                  <CommandEmpty>No members found.</CommandEmpty>
                                  <CommandGroup className="max-h-60 overflow-auto">
                                    {allMembers.map(m => {
                                      const isSelected = referralMemberIds.includes(m.id);
                                      return (
                                        <CommandItem
                                          key={m.id}
                                          value={`${m.last_name} ${m.first_name}`}
                                          onSelect={() => toggleReferralMember(m.id)}
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

                        {/* Relationship Type (Right) */}
                        <div className="space-y-2">
                          <label className="text-sm font-medium">Relationship *</label>
                          <select
                            className={nativeSelectClassName}
                            value={form.watch('referral_relationship_type') || ''}
                            onChange={(e) => form.setValue('referral_relationship_type', e.target.value as any, { shouldValidate: true })}
                          >
                            <option value="" disabled>Select relationship</option>
                            <option value="spouse">Spouse</option>
                            <option value="parent">Parent</option>
                            <option value="child">Child</option>
                            <option value="sibling">Sibling</option>
                            <option value="guardian">Guardian</option>
                            <option value="other">Other</option>
                          </select>
                        </div>
                      </div>

                      {referralMemberIds.length > 0 && (
                        <div className="flex flex-wrap gap-1">
                          {referralMemberIds.map(mid => {
                            const member = allMembers.find(m => m.id === mid);
                            return (
                              <Badge key={mid} variant="outline" className="gap-1 rounded-lg">
                                {member ? `${member.last_name} ${member.first_name}` : mid}
                                <X className="h-3 w-3 cursor-pointer" onClick={() => toggleReferralMember(mid)} />
                              </Badge>
                            );
                          })}
                        </div>
                      )}
                    </div>

                    {form.formState.errors.referral_member_ids && (
                      <p className="text-sm font-medium text-destructive">
                        {form.formState.errors.referral_member_ids.message}
                      </p>
                    )}
                  </div>
                )}

                {/* Social Media App Selection */}
                {form.watch('referral_source') === 'social_media' && (
                  <FormField
                    control={form.control}
                    name="referral_social_media"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Which social media platform? *</FormLabel>
                        <Select onValueChange={field.onChange} value={field.value}>
                          <FormControl>
                            <SelectTrigger className="rounded-xl bg-background/60">
                              <SelectValue placeholder="Select social media platform" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="facebook">Facebook</SelectItem>
                            <SelectItem value="instagram">Instagram</SelectItem>
                            <SelectItem value="twitter">Twitter / X</SelectItem>
                            <SelectItem value="tiktok">TikTok</SelectItem>
                            <SelectItem value="youtube">YouTube</SelectItem>
                            <SelectItem value="whatsapp">WhatsApp</SelectItem>
                            <SelectItem value="telegram">Telegram</SelectItem>
                            <SelectItem value="linkedin">LinkedIn</SelectItem>
                            <SelectItem value="other_social">Other</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                )}

                {/* Other Details */}
                {form.watch('referral_source') === 'other' && (
                  <FormField
                    control={form.control}
                    name="referral_other_details"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>{t('referralOtherDetails')}</FormLabel>
                        <FormControl>
                          <Textarea
                            placeholder={t('explainReferralSource')}
                            className="min-h-[80px] rounded-xl bg-background/60"
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                )}
              </GlassSection>

              {/* Join Interest */}
              <GlassSection icon={Heart} title={t('joinInterest') || 'Interest'}>
                <FormField
                  control={form.control}
                  name="join_interest"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{t('joinInterest')}</FormLabel>
                      <FormControl>
                        <RadioGroup
                          onValueChange={field.onChange}
                          value={field.value}
                          className="flex flex-wrap gap-4"
                        >
                          <div className="flex items-center space-x-2">
                            <RadioGroupItem value="yes" id="join-yes" />
                            <label htmlFor="join-yes" className="text-sm font-medium cursor-pointer">
                              {t('joinYes')}
                            </label>
                          </div>
                          <div className="flex items-center space-x-2">
                            <RadioGroupItem value="no" id="join-no" />
                            <label htmlFor="join-no" className="text-sm font-medium cursor-pointer">
                              {t('joinNo')}
                            </label>
                          </div>
                          <div className="flex items-center space-x-2">
                            <RadioGroupItem value="undecided" id="join-undecided" />
                            <label htmlFor="join-undecided" className="text-sm font-medium cursor-pointer">
                              {t('joinUndecided')}
                            </label>
                          </div>
                        </RadioGroup>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </GlassSection>

              {/* Submit */}
              <Button
                type="submit"
                className="w-full h-12 rounded-xl text-base font-semibold bg-gradient-to-r from-primary to-secondary hover:from-primary/90 hover:to-secondary/90 shadow-md hover:shadow-lg transition-all duration-300 hover:-translate-y-0.5"
                disabled={isPending}
              >
                {isPending ? (
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
