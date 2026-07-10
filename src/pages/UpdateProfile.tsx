import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useQuery, useMutation } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { memberRegistrationSchema, MemberRegistrationFormData } from '@/schemas/memberRegistrationSchema';
import { Button } from '@/components/ui/button';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage, FormDescription } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from '@/components/ui/command';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import { Loader2, CheckCircle2, ArrowLeft, Search, User, Heart, BookOpen, Users, Church, CalendarIcon, Plus, X, Check, Mail, Phone, Info } from 'lucide-react';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';
import Navbar from '@/components/layout/Navbar';
import { useOccupations } from '@/hooks/useOccupations';
import { FamilyRelationshipType } from '@/hooks/useMemberRelationships';

const SUPABASE_URL = 'https://dtqyyvjosdgoqloxybnx.supabase.co';
const SUPABASE_ANON = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImR0cXl5dmpvc2Rnb3Fsb3h5Ym54Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDk5NzY2ODEsImV4cCI6MjA2NTU1MjY4MX0.FfgcNKJ06kHeVnjVoDHulSfzrNMQl6MT9w__vr46x0I';

const RELATIONSHIP_TYPES: { value: FamilyRelationshipType; label: string }[] = [
  { value: 'spouse', label: 'Spouse' },
  { value: 'parent', label: 'Parent' },
  { value: 'child', label: 'Child' },
  { value: 'sibling', label: 'Sibling' },
  { value: 'guardian', label: 'Guardian' },
  { value: 'other', label: 'Other' },
];

const MINISTRY_OPTIONS = [
  'Music & Worship', 'Teaching & Preaching', 'Youth Ministry', "Children's Ministry",
  'Hospitality', 'Media & Technology', 'Administration', 'Counseling',
  'Prayer Ministry', 'Outreach & Evangelism',
];

const nativeSelectClassName = 'flex h-10 w-full rounded-xl border border-input bg-background/60 px-3 py-2 text-sm text-foreground ring-offset-background focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50';
const Req = () => <span className="text-destructive ml-0.5">*</span>;

function GlassSection({ icon: Icon, title, children }: { icon: React.ElementType; title: React.ReactNode; children: React.ReactNode }) {
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

interface LookupResult {
  token: string;
  profile: any;
  member: any;
  region: any;
  dcg_id: string | null;
  relationships: Array<{ relationship_type: string; member_ids: string[] }>;
}

async function callFn(path: string, body: any) {
  const res = await fetch(`${SUPABASE_URL}/functions/v1/${path}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', apikey: SUPABASE_ANON, Authorization: `Bearer ${SUPABASE_ANON}` },
    body: JSON.stringify(body),
  });
  return { ok: res.ok, status: res.status, json: await res.json().catch(() => ({})) };
}

export default function UpdateProfile() {
  const navigate = useNavigate();
  const { data: occupations = [] } = useOccupations();

  const [lookupMode, setLookupMode] = useState<'email' | 'phone'>('email');
  const [lookupValue, setLookupValue] = useState('');
  const [lookup, setLookup] = useState<LookupResult | null>(null);
  const [notFound, setNotFound] = useState(false);
  const [candidates, setCandidates] = useState<any[] | null>(null);
  const [lookupError, setLookupError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const lookupMutation = useMutation({
    mutationFn: async () => {
      setLookupError(null); setNotFound(false); setCandidates(null);
      const body: any = {};
      if (lookupMode === 'email') body.email = lookupValue;
      else body.phone = lookupValue;
      const r = await callFn('profile-update-lookup', body);
      if (r.json?.error === 'not_found') { setNotFound(true); return null; }
      if (r.json?.error === 'multiple_matches') { setCandidates(r.json.candidates || []); return null; }
      if (!r.ok || r.json?.success === false) {
        setLookupError(r.json?.error || 'Lookup failed. Please try again.');
        return null;
      }
      setLookup(r.json as LookupResult);
      return r.json;
    },
  });

  // DCGs for the region
  const { data: dcgs = [], isLoading: dcgsLoading } = useQuery({
    queryKey: ['profile-update-dcgs', lookup?.region?.id],
    queryFn: async () => {
      if (!lookup?.region?.id) return [];
      const { data } = await supabase.from('dcgs').select('*').eq('region_id', lookup.region.id).eq('is_active', true).order('name');
      return data || [];
    },
    enabled: !!lookup?.region?.id,
  });

  const form = useForm<MemberRegistrationFormData>({
    resolver: zodResolver(memberRegistrationSchema),
    defaultValues: {
      first_name: '', last_name: '', email: '', phone: '', address: '',
      date_of_birth: '', gender: '', occupation: '',
      has_completed_foundation_school: '', foundation_school_date: '',
      is_baptized: '', baptism_date: '',
      ministry_interests: [], dcg_id: '', relationships: [],
    },
  });

  const [relationships, setRelationships] = useState<Array<{ type: FamilyRelationshipType; memberIds: string[] }>>([]);
  const [currentRelType, setCurrentRelType] = useState<FamilyRelationshipType | ''>('');
  const [currentRelMemberIds, setCurrentRelMemberIds] = useState<string[]>([]);
  const [memberSearchOpen, setMemberSearchOpen] = useState(false);
  const [memberSearchText, setMemberSearchText] = useState('');

  const { data: allMembers = [] } = useQuery({
    queryKey: ['all-members-search-update', memberSearchText],
    queryFn: async () => {
      const { data, error } = await supabase.rpc('search_all_members', { _search: memberSearchText });
      if (error) throw error;
      return data || [];
    },
  });

  // Prefill form when lookup completes
  useEffect(() => {
    if (!lookup) return;
    const p = lookup.profile; const m = lookup.member;
    form.reset({
      first_name: p.first_name || '',
      last_name: p.last_name || '',
      email: p.email || '',
      phone: p.phone || '',
      address: p.address || '',
      date_of_birth: p.date_of_birth || '',
      gender: p.gender || '',
      occupation: p.occupation || '',
      has_completed_foundation_school: m?.membership_class_completed ? 'yes' : (m ? 'no' : ''),
      foundation_school_date: m?.foundation_school_date || '',
      is_baptized: m?.baptism_date ? 'yes' : (m ? 'no' : ''),
      baptism_date: m?.baptism_date || '',
      ministry_interests: m?.ministry_interests || [],
      dcg_id: lookup.dcg_id || '',
      relationships: [],
    });
    setRelationships((lookup.relationships || []).map((r) => ({ type: r.relationship_type as FamilyRelationshipType, memberIds: r.member_ids })));
  }, [lookup]); // eslint-disable-line react-hooks/exhaustive-deps

  const submitMutation = useMutation({
    mutationFn: async (data: MemberRegistrationFormData) => {
      if (!lookup) throw new Error('No profile loaded');
      const payload = {
        ...data,
        relationships: relationships.map((r) => ({ relationship_type: r.type, member_ids: r.memberIds })),
      };
      const r = await callFn('profile-update-submit', { token: lookup.token, data: payload });
      if (!r.ok) throw new Error(r.json?.error || 'Update failed');
      return r.json;
    },
    onSuccess: () => { setSuccess(true); toast.success('Profile updated successfully'); window.scrollTo({ top: 0, behavior: 'smooth' }); },
    onError: (e: any) => toast.error(e.message || 'Update failed'),
  });

  const addRelationship = () => {
    if (!currentRelType || currentRelMemberIds.length === 0) return;
    setRelationships((prev) => [...prev, { type: currentRelType, memberIds: [...currentRelMemberIds] }]);
    setCurrentRelType(''); setCurrentRelMemberIds([]);
  };
  const removeRelationship = (i: number) => setRelationships((prev) => prev.filter((_, idx) => idx !== i));
  const toggleMemberSelection = (id: string) => setCurrentRelMemberIds((prev) => prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]);

  // ---------- Success ----------
  if (success) {
    return (
      <>
        <Navbar />
        <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary/5 via-background to-accent/5 p-4">
          <div className="glass-panel-soft max-w-md w-full p-8 text-center space-y-5">
            <div className="w-16 h-16 rounded-2xl bg-green-500/10 flex items-center justify-center mx-auto">
              <CheckCircle2 className="h-8 w-8 text-green-500" />
            </div>
            <h2 className="text-xl font-semibold">Profile Updated</h2>
            <p className="text-muted-foreground text-sm">Your profile information has been saved. Thank you!</p>
            <div className="flex flex-col gap-2">
              <Button onClick={() => navigate('/')} className="w-full rounded-xl">Back to Home</Button>
              <Button variant="outline" onClick={() => { setSuccess(false); setLookup(null); setLookupValue(''); }} className="w-full rounded-xl">Update Another Profile</Button>
            </div>
          </div>
        </div>
      </>
    );
  }

  // ---------- Lookup step ----------
  if (!lookup) {
    return (
      <>
        <Navbar />
        <div className="min-h-screen bg-gradient-to-br from-primary/5 via-background to-accent/5 py-10 px-4">
          <div className="max-w-md mx-auto space-y-6">
            <div className="text-center space-y-2">
              <h1 className="text-2xl md:text-3xl font-bold tracking-tight">Update Your Profile</h1>
              <p className="text-sm text-muted-foreground">Enter your email or phone number to find your record.</p>
            </div>

            <div className="rounded-2xl border border-border/40 bg-card/60 backdrop-blur-sm p-6 space-y-4 shadow-sm">
              <Tabs value={lookupMode} onValueChange={(v) => { setLookupMode(v as any); setLookupValue(''); setNotFound(false); setCandidates(null); setLookupError(null); }}>
                <TabsList className="grid grid-cols-2 w-full">
                  <TabsTrigger value="email"><Mail className="h-4 w-4 mr-2" />Email</TabsTrigger>
                  <TabsTrigger value="phone"><Phone className="h-4 w-4 mr-2" />Phone</TabsTrigger>
                </TabsList>
                <TabsContent value="email" className="pt-4">
                  <Input type="email" placeholder="you@example.com" value={lookupValue} onChange={(e) => setLookupValue(e.target.value)} className="rounded-xl bg-background/60" />
                </TabsContent>
                <TabsContent value="phone" className="pt-4">
                  <Input type="tel" placeholder="+237 6xx xxx xxx" value={lookupValue} onChange={(e) => setLookupValue(e.target.value)} className="rounded-xl bg-background/60" />
                </TabsContent>
              </Tabs>

              {notFound && (
                <Alert className="border-primary/30 bg-primary/5">
                  <Info className="h-4 w-4 text-primary" />
                  <AlertDescription className="space-y-2 text-sm">
                    <p className="font-medium text-foreground">
                      We couldn't find a profile matching that {lookupMode === 'email' ? 'email address' : 'phone number'}.
                    </p>
                    <p className="text-muted-foreground">
                      {lookupMode === 'email'
                        ? 'Please double-check for typos, or try searching with your phone number instead. If you have never registered with us, this update page is only for existing members — please register through your regional branch first.'
                        : 'Please check the number (with or without country code), or try searching with your email instead. If you have never registered with us, this update page is only for existing members — please register through your regional branch first.'}
                    </p>
                  </AlertDescription>
                </Alert>
              )}
              {lookupError && (
                <Alert variant="destructive"><AlertDescription>{lookupError}</AlertDescription></Alert>
              )}
              {candidates && candidates.length > 0 && (
                <div className="space-y-2">
                  <p className="text-sm text-muted-foreground">Multiple matches. Please refine your search using email instead:</p>
                  {candidates.map((c) => (
                    <div key={c.id} className="text-sm p-2 rounded-lg bg-muted/40">{c.name} — {c.email_masked}</div>
                  ))}
                </div>
              )}

              <Button onClick={() => lookupMutation.mutate()} disabled={!lookupValue.trim() || lookupMutation.isPending} className="w-full rounded-xl h-11">
                {lookupMutation.isPending ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Searching...</> : <><Search className="mr-2 h-4 w-4" />Find My Profile</>}
              </Button>

              <div className="text-center pt-2">
                <Button variant="link" size="sm" onClick={() => navigate('/')}><ArrowLeft className="mr-1 h-3 w-3" />Back to Home</Button>
              </div>
            </div>
          </div>
        </div>
      </>
    );
  }

  // ---------- Edit step ----------
  const watchedDob = form.watch('date_of_birth');
  const computeAge = (dobStr?: string): number | null => {
    if (!dobStr) return null;
    const dob = new Date(dobStr);
    if (isNaN(dob.getTime())) return null;
    const now = new Date();
    let age = now.getFullYear() - dob.getFullYear();
    const m = now.getMonth() - dob.getMonth();
    if (m < 0 || (m === 0 && now.getDate() < dob.getDate())) age--;
    return age;
  };
  const registrantAge = computeAge(watchedDob);
  const isMinor = registrantAge !== null && registrantAge < 16;

  const onSubmit = (data: MemberRegistrationFormData) => submitMutation.mutate(data);
  const onInvalid = () => { toast.error('Please complete the required fields.'); window.scrollTo({ top: 0, behavior: 'smooth' }); };

  return (
    <>
      <Navbar />
      <div className="min-h-screen bg-gradient-to-br from-primary/5 via-background to-accent/5 py-6 px-4">
        <div className="max-w-3xl mx-auto space-y-6">
          <div className="glass-panel-hero text-primary-foreground p-6 md:p-8 text-center space-y-2 relative overflow-hidden">
            <div className="relative z-10">
              <h1 className="text-2xl md:text-3xl font-bold tracking-tight">Update Your Profile</h1>
              {lookup.region && <p className="text-sm md:text-base opacity-90 font-medium">{lookup.region.name}</p>}
              {lookup.member && <p className="text-xs opacity-75 mt-1">Member ID: {lookup.member.member_id}</p>}
            </div>
          </div>

          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit, onInvalid)} className="space-y-5">
              <GlassSection icon={User} title="Personal Information">
                <div className="grid md:grid-cols-2 gap-4">
                  <FormField control={form.control} name="first_name" render={({ field }) => (
                    <FormItem><FormLabel>First Name <Req /></FormLabel><FormControl><Input className="rounded-xl bg-background/60" {...field} /></FormControl><FormMessage /></FormItem>
                  )} />
                  <FormField control={form.control} name="last_name" render={({ field }) => (
                    <FormItem><FormLabel>Last Name <Req /></FormLabel><FormControl><Input className="rounded-xl bg-background/60" {...field} /></FormControl><FormMessage /></FormItem>
                  )} />
                </div>
                <div className="grid md:grid-cols-2 gap-4">
                  <FormField control={form.control} name="email" render={({ field }) => (
                    <FormItem>
                      <FormLabel>Email</FormLabel>
                      <FormControl><Input type="email" readOnly className="rounded-xl bg-muted/50" {...field} /></FormControl>
                      <FormDescription className="text-xs">Email is your identifier and cannot be changed here.</FormDescription>
                    </FormItem>
                  )} />
                  <FormField control={form.control} name="phone" render={({ field }) => (
                    <FormItem><FormLabel>Phone <Req /></FormLabel><FormControl><Input type="tel" className="rounded-xl bg-background/60" {...field} /></FormControl><FormMessage /></FormItem>
                  )} />
                </div>
                <FormField control={form.control} name="address" render={({ field }) => (
                  <FormItem><FormLabel>Address <Req /></FormLabel><FormControl><Textarea className="min-h-[80px] rounded-xl bg-background/60" {...field} /></FormControl><FormMessage /></FormItem>
                )} />
                <div className="grid md:grid-cols-2 gap-4">
                  <FormField control={form.control} name="date_of_birth" render={({ field }) => (
                    <FormItem className="flex flex-col"><FormLabel>Date of Birth <Req /></FormLabel>
                      <Popover><PopoverTrigger asChild><FormControl>
                        <Button variant="outline" className={cn('w-full pl-3 text-left font-normal rounded-xl bg-background/60', !field.value && 'text-muted-foreground')}>
                          {field.value ? format(new Date(field.value), 'PPP') : <span>Pick a date</span>}
                          <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                        </Button>
                      </FormControl></PopoverTrigger>
                      <PopoverContent className="w-auto p-0" align="start">
                        <Calendar mode="single" selected={field.value ? new Date(field.value) : undefined}
                          onSelect={(d) => field.onChange(d ? format(d, 'yyyy-MM-dd') : '')}
                          disabled={(d) => d > new Date() || d < new Date('1900-01-01')} initialFocus
                          captionLayout="dropdown-buttons" fromYear={1900} toYear={new Date().getFullYear()} />
                      </PopoverContent></Popover><FormMessage /></FormItem>
                  )} />
                  <FormField control={form.control} name="gender" render={({ field }) => (
                    <FormItem><FormLabel>Gender <Req /></FormLabel><FormControl>
                      <select className={nativeSelectClassName} value={field.value || ''} onChange={field.onChange}>
                        <option value="" disabled>Select gender</option>
                        <option value="Male">Male</option><option value="Female">Female</option>
                      </select></FormControl><FormMessage /></FormItem>
                  )} />
                </div>
                <FormField control={form.control} name="occupation" render={({ field }) => (
                  <FormItem><FormLabel>Occupation</FormLabel><FormControl>
                    <select className={nativeSelectClassName} value={field.value || ''} onChange={field.onChange}>
                      <option value="">Select occupation</option>
                      {occupations.map((o) => <option key={o.id} value={o.name}>{o.name}</option>)}
                    </select></FormControl><FormMessage /></FormItem>
                )} />
              </GlassSection>

              <GlassSection icon={BookOpen} title="Spiritual Information">
                <FormField control={form.control} name="has_completed_foundation_school" render={({ field }) => (
                  <FormItem><FormLabel>Have you completed Foundation School?</FormLabel><FormControl>
                    <select className={nativeSelectClassName} value={field.value || ''} onChange={field.onChange}>
                      <option value="">Select</option><option value="yes">Yes</option><option value="no">No</option>
                    </select></FormControl></FormItem>
                )} />
                {form.watch('has_completed_foundation_school') === 'yes' && (
                  <FormField control={form.control} name="foundation_school_date" render={({ field }) => (
                    <FormItem className="flex flex-col"><FormLabel>Foundation School Date</FormLabel>
                      <Popover><PopoverTrigger asChild><FormControl>
                        <Button variant="outline" className={cn('w-full pl-3 text-left font-normal rounded-xl bg-background/60', !field.value && 'text-muted-foreground')}>
                          {field.value ? format(new Date(field.value), 'PPP') : <span>Pick a date</span>}
                          <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                        </Button>
                      </FormControl></PopoverTrigger>
                      <PopoverContent className="w-auto p-0" align="start">
                        <Calendar mode="single" selected={field.value ? new Date(field.value) : undefined}
                          onSelect={(d) => field.onChange(d ? format(d, 'yyyy-MM-dd') : '')}
                          disabled={(d) => d > new Date() || d < new Date('1900-01-01')} initialFocus
                          captionLayout="dropdown-buttons" fromYear={1900} toYear={new Date().getFullYear()} />
                      </PopoverContent></Popover></FormItem>
                  )} />
                )}
                <FormField control={form.control} name="is_baptized" render={({ field }) => (
                  <FormItem><FormLabel>Have you been baptized?</FormLabel><FormControl>
                    <select className={nativeSelectClassName} value={field.value || ''} onChange={field.onChange}>
                      <option value="">Select</option><option value="yes">Yes</option><option value="no">No</option>
                    </select></FormControl></FormItem>
                )} />
                {form.watch('is_baptized') === 'yes' && (
                  <FormField control={form.control} name="baptism_date" render={({ field }) => (
                    <FormItem className="flex flex-col"><FormLabel>Baptism Date</FormLabel>
                      <Popover><PopoverTrigger asChild><FormControl>
                        <Button variant="outline" className={cn('w-full pl-3 text-left font-normal rounded-xl bg-background/60', !field.value && 'text-muted-foreground')}>
                          {field.value ? format(new Date(field.value), 'PPP') : <span>Pick a date</span>}
                          <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                        </Button>
                      </FormControl></PopoverTrigger>
                      <PopoverContent className="w-auto p-0" align="start">
                        <Calendar mode="single" selected={field.value ? new Date(field.value) : undefined}
                          onSelect={(d) => field.onChange(d ? format(d, 'yyyy-MM-dd') : '')}
                          disabled={(d) => d > new Date() || d < new Date('1900-01-01')} initialFocus
                          captionLayout="dropdown-buttons" fromYear={1900} toYear={new Date().getFullYear()} />
                      </PopoverContent></Popover></FormItem>
                  )} />
                )}
              </GlassSection>

              <GlassSection icon={Heart} title="Ministry & Service">
                <FormField control={form.control} name="ministry_interests" render={() => (
                  <FormItem><FormLabel>Ministry Interests</FormLabel>
                    <div className="grid md:grid-cols-2 gap-3 mt-2">
                      {MINISTRY_OPTIONS.map((ministry) => (
                        <FormField key={ministry} control={form.control} name="ministry_interests" render={({ field }) => (
                          <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                            <FormControl><Checkbox checked={field.value?.includes(ministry)}
                              onCheckedChange={(c) => c ? field.onChange([...(field.value || []), ministry]) : field.onChange(field.value?.filter((v) => v !== ministry))} /></FormControl>
                            <FormLabel className="font-normal text-sm">{ministry}</FormLabel>
                          </FormItem>
                        )} />
                      ))}
                    </div>
                  </FormItem>
                )} />
              </GlassSection>

              <GlassSection icon={Users} title={isMinor ? (<span>Family Relationships <Req /></span>) : 'Family Relationships (Optional)'}>
                {isMinor && <Alert><AlertDescription>Under 16 must link to at least one adult (parent/guardian).</AlertDescription></Alert>}
                {relationships.length > 0 && (
                  <div className="space-y-2">
                    {relationships.map((rel, i) => (
                      <div key={i} className="flex items-center gap-2 p-3 rounded-xl border border-border/30 bg-muted/30">
                        <Badge variant="secondary" className="capitalize rounded-lg">{rel.type}</Badge>
                        <div className="flex-1 flex flex-wrap gap-1">
                          {rel.memberIds.map((mid) => {
                            const m = allMembers.find((x) => x.id === mid);
                            return <Badge key={mid} variant="outline" className="rounded-lg">{m ? `${m.last_name} ${m.first_name}` : mid}</Badge>;
                          })}
                        </div>
                        <Button type="button" variant="ghost" size="sm" onClick={() => removeRelationship(i)}><X className="h-4 w-4" /></Button>
                      </div>
                    ))}
                  </div>
                )}
                <div className="space-y-4 p-4 rounded-xl border border-dashed border-border/40 bg-muted/20">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <label className="text-sm font-medium">Relationship Type</label>
                      <select className={nativeSelectClassName} value={currentRelType} onChange={(e) => setCurrentRelType(e.target.value as FamilyRelationshipType)}>
                        <option value="" disabled>Select</option>
                        {RELATIONSHIP_TYPES.map((rt) => <option key={rt.value} value={rt.value}>{rt.label}</option>)}
                      </select>
                    </div>
                    <div className="space-y-2">
                      <label className="text-sm font-medium">Members {currentRelMemberIds.length > 0 && <span className="text-xs text-muted-foreground">({currentRelMemberIds.length} selected)</span>}</label>
                      <Popover open={memberSearchOpen} onOpenChange={setMemberSearchOpen}>
                        <PopoverTrigger asChild>
                          <Button type="button" variant="outline" role="combobox" className="w-full justify-between font-normal rounded-xl bg-background/60" disabled={!currentRelType}>
                            {currentRelMemberIds.length > 0 ? `${currentRelMemberIds.length} selected` : 'Search members...'}
                            <Search className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                          </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-full p-0" align="start">
                          <Command>
                            <CommandInput placeholder="Search..." onValueChange={setMemberSearchText} />
                            <CommandList>
                              <CommandEmpty>No members found.</CommandEmpty>
                              <CommandGroup className="max-h-60 overflow-auto">
                                {allMembers.map((m) => {
                                  const sel = currentRelMemberIds.includes(m.id);
                                  return (
                                    <CommandItem key={m.id} value={`${m.last_name} ${m.first_name}`} onSelect={() => toggleMemberSelection(m.id)}>
                                      <div className={cn('mr-2 flex h-4 w-4 items-center justify-center rounded-sm border border-primary', sel ? 'bg-primary text-primary-foreground' : 'opacity-50')}>
                                        {sel && <Check className="h-3 w-3" />}
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
                  <Button type="button" variant="secondary" size="sm" onClick={addRelationship} disabled={!currentRelType || currentRelMemberIds.length === 0} className="w-full rounded-xl">
                    <Plus className="h-4 w-4 mr-2" />Add Relationship
                  </Button>
                </div>
              </GlassSection>

              <GlassSection icon={Church} title="DCG">
                <FormField control={form.control} name="dcg_id" render={({ field }) => (
                  <FormItem><FormLabel>Select your DCG <Req /></FormLabel><FormControl>
                    <select className={nativeSelectClassName} value={field.value || ''} onChange={field.onChange} disabled={dcgsLoading || dcgs.length === 0}>
                      <option value="" disabled>{dcgsLoading ? 'Loading...' : dcgs.length === 0 ? 'No DCGs' : 'Select a DCG'}</option>
                      {dcgs.map((d) => <option key={d.id} value={d.id}>{d.name}{d.location ? ` - ${d.location}` : ''}</option>)}
                    </select></FormControl><FormMessage /></FormItem>
                )} />
              </GlassSection>

              <Button type="submit" className="w-full h-12 rounded-xl text-base font-semibold bg-gradient-to-r from-primary to-secondary" disabled={submitMutation.isPending}>
                {submitMutation.isPending ? <><Loader2 className="mr-2 h-5 w-5 animate-spin" />Saving...</> : 'Save Changes'}
              </Button>
            </form>
          </Form>
        </div>
      </div>
    </>
  );
}
