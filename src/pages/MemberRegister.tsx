import { useParams, useNavigate, Link } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useRegionBySlug } from '@/hooks/useRegionBySlug';
import { useMemberRegistration } from '@/hooks/useMemberRegistration';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { memberRegistrationSchema, MemberRegistrationFormData } from '@/schemas/memberRegistrationSchema';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage, FormDescription } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Loader2, CheckCircle2, ArrowLeft } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useState } from 'react';
import { useLanguage } from '@/hooks/useLanguage';
import { format } from 'date-fns';
import Navbar from '@/components/layout/Navbar';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { CalendarIcon } from 'lucide-react';
import { cn } from '@/lib/utils';

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

export default function MemberRegister() {
  const { regionCode } = useParams<{ regionCode: string }>();
  const navigate = useNavigate();
  const { data: region, isLoading: regionLoading } = useRegionBySlug(regionCode);
  
  // Fetch DCGs for the region
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
  const { t } = useLanguage();

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
      skills_talents: '',
      dcg_id: undefined
    }
  });

  const onSubmit = (data: MemberRegistrationFormData) => {
    if (!region?.id) return;
    
    registerMember(
      {
        ...data,
        region_id: region.id
      },
      {
        onSuccess: (result) => {
          setRegistrationSuccess({
            member_id: result.member_id,
            message: result.message,
            login_email: result.login_email,
            default_password: result.default_password
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

  if (regionLoading) {
    return (
      <>
        <Navbar />
        <div className="min-h-screen flex items-center justify-center bg-background">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </>
    );
  }

  if (!region) {
    return (
      <>
        <Navbar />
        <div className="min-h-screen flex items-center justify-center bg-background p-4">
          <Card className="max-w-md w-full">
            <CardHeader>
              <CardTitle>{t('regionNotFound')}</CardTitle>
              <CardDescription>
                {t('invalidRegionCode')}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button onClick={() => navigate('/')} className="w-full">
                <ArrowLeft className="mr-2 h-4 w-4" />
                {t('backToHome')}
              </Button>
            </CardContent>
          </Card>
        </div>
      </>
    );
  }

  if (registrationSuccess) {
    return (
      <>
        <Navbar />
        <div className="min-h-screen flex items-center justify-center bg-background p-4">
          <Card className="max-w-2xl w-full">
            <CardHeader>
              <div className="flex items-center gap-2 text-green-600">
                <CheckCircle2 className="h-6 w-6" />
                <CardTitle>{t('memberRegistrationSuccess')}</CardTitle>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <Alert>
                <AlertDescription className="whitespace-pre-line">
                  {registrationSuccess.message}
                </AlertDescription>
              </Alert>

              <div className="bg-muted p-4 rounded-lg space-y-2">
                <p className="font-semibold">{t('yourLoginCredentials')}:</p>
                <div className="space-y-1 text-sm">
                  <p><strong>{t('email')}:</strong> {registrationSuccess.login_email}</p>
                  <p><strong>{t('password')}:</strong> {registrationSuccess.default_password}</p>
                  <p className="text-muted-foreground italic mt-2">
                    {t('pleaseChangePassword')}
                  </p>
                </div>
              </div>

              <div className="flex gap-3">
                <Button onClick={() => navigate('/member/auth')} className="flex-1">
                  {t('loginNow')}
                </Button>
                <Button 
                  onClick={() => {
                    setRegistrationSuccess(null);
                    form.reset();
                  }} 
                  variant="outline" 
                  className="flex-1"
                >
                  {t('registerAnother')}
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </>
    );
  }

  return (
    <>
      <Navbar />
      <div className="min-h-screen bg-background py-8 px-4">
        <div className="max-w-3xl mx-auto">
          <Card>
            <CardHeader>
              <div className="flex items-center gap-2 mb-2">
                <Link to="/">
                  <Button variant="ghost" size="icon">
                    <ArrowLeft className="h-4 w-4" />
                  </Button>
                </Link>
                <div>
                  <CardTitle className="text-2xl">{t('memberRegistration')}</CardTitle>
                  <CardDescription>{region.name}</CardDescription>
                </div>
              </div>
              <p className="text-sm text-muted-foreground">
                {t('memberWelcome')}
              </p>
            </CardHeader>
            <CardContent>
              <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                  {form.formState.errors.root && (
                    <Alert variant="destructive">
                      <AlertDescription>
                        {form.formState.errors.root.message}
                      </AlertDescription>
                    </Alert>
                  )}

                  {/* Personal Information */}
                  <div className="space-y-4">
                    <h3 className="text-lg font-semibold border-b pb-2">{t('personalInformation')}</h3>
                    
                    <div className="grid md:grid-cols-2 gap-4">
                      <FormField
                        control={form.control}
                        name="first_name"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>{t('firstName')}</FormLabel>
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
                            <FormLabel>{t('lastName')}</FormLabel>
                            <FormControl>
                              <Input placeholder="Doe" {...field} />
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
                            <FormLabel>{t('email')}</FormLabel>
                            <FormControl>
                              <Input type="email" placeholder="john.doe@example.com" {...field} />
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
                            <FormLabel>{t('phone')}</FormLabel>
                            <FormControl>
                              <Input type="tel" placeholder="+1 (555) 123-4567" {...field} />
                            </FormControl>
                            <FormDescription className="text-xs">
                              {t('phoneDescription')}
                            </FormDescription>
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
                          <FormLabel>{t('address')}</FormLabel>
                          <FormControl>
                            <Textarea placeholder="123 Main St, City, State, ZIP" className="min-h-[80px]" {...field} />
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
                                      "w-full pl-3 text-left font-normal",
                                      !field.value && "text-muted-foreground"
                                    )}
                                  >
                                    {field.value ? (
                                      format(new Date(field.value), "PPP")
                                    ) : (
                                      <span>Pick a date</span>
                                    )}
                                    <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                                  </Button>
                                </FormControl>
                              </PopoverTrigger>
                              <PopoverContent className="w-auto p-0" align="start">
                                <Calendar
                                  mode="single"
                                  selected={field.value ? new Date(field.value) : undefined}
                                  onSelect={(date) => field.onChange(date?.toISOString().split('T')[0])}
                                  disabled={(date) =>
                                    date > new Date() || date < new Date("1900-01-01")
                                  }
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
                                <SelectTrigger>
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
                          <FormControl>
                            <Input placeholder="e.g., Teacher, Engineer, Student" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  {/* Emergency Contact */}
                  <div className="space-y-4">
                    <h3 className="text-lg font-semibold border-b pb-2">{t('emergencyContact')}</h3>
                    
                    <div className="grid md:grid-cols-2 gap-4">
                      <FormField
                        control={form.control}
                        name="emergency_contact_name"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>{t('emergencyContactName')}</FormLabel>
                            <FormControl>
                              <Input placeholder="Contact name" {...field} />
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
                            <FormLabel>{t('emergencyContactPhone')}</FormLabel>
                            <FormControl>
                              <Input type="tel" placeholder="+1 (555) 123-4567" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                  </div>

                  {/* Spiritual Information */}
                  <div className="space-y-4">
                    <h3 className="text-lg font-semibold border-b pb-2">{t('spiritualInformation')}</h3>
                    
                    {/* Foundation School Question */}
                    <div className="space-y-3">
                      <FormField
                        control={form.control}
                        name="has_completed_foundation_school"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>{t('foundationSchool')}</FormLabel>
                            <Select onValueChange={field.onChange} value={field.value}>
                              <FormControl>
                                <SelectTrigger>
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
                                        "w-full pl-3 text-left font-normal",
                                        !field.value && "text-muted-foreground"
                                      )}
                                    >
                                      {field.value ? (
                                        format(new Date(field.value), "PPP")
                                      ) : (
                                        <span>{t('pickDate')}</span>
                                      )}
                                      <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                                    </Button>
                                  </FormControl>
                                </PopoverTrigger>
                                <PopoverContent className="w-auto p-0" align="start">
                                  <Calendar
                                    mode="single"
                                    selected={field.value ? new Date(field.value) : undefined}
                                    onSelect={(date) => field.onChange(date?.toISOString().split('T')[0])}
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

                    {/* Baptism Question */}
                    <div className="space-y-3">
                      <FormField
                        control={form.control}
                        name="is_baptized"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>{t('haveBaptized')}</FormLabel>
                            <Select onValueChange={field.onChange} value={field.value}>
                              <FormControl>
                                <SelectTrigger>
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
                                        "w-full pl-3 text-left font-normal",
                                        !field.value && "text-muted-foreground"
                                      )}
                                    >
                                      {field.value ? (
                                        format(new Date(field.value), "PPP")
                                      ) : (
                                        <span>{t('pickDate')}</span>
                                      )}
                                      <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                                    </Button>
                                  </FormControl>
                                </PopoverTrigger>
                                <PopoverContent className="w-auto p-0" align="start">
                                  <Calendar
                                    mode="single"
                                    selected={field.value ? new Date(field.value) : undefined}
                                    onSelect={(date) => field.onChange(date?.toISOString().split('T')[0])}
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
                  </div>

                  {/* Ministry & Service */}
                  <div className="space-y-4">
                    <h3 className="text-lg font-semibold border-b pb-2">{t('ministryService')}</h3>
                    
                    <FormField
                      control={form.control}
                      name="ministry_interests"
                      render={() => (
                        <FormItem>
                          <FormLabel>{t('ministryInterests')}</FormLabel>
                          <FormDescription>{t('ministryInterestsDescription')}</FormDescription>
                          <div className="grid md:grid-cols-2 gap-3 mt-2">
                            {MINISTRY_OPTIONS.map((ministry) => (
                              <FormField
                                key={ministry}
                                control={form.control}
                                name="ministry_interests"
                                render={({ field }) => {
                                  return (
                                    <FormItem
                                      key={ministry}
                                      className="flex flex-row items-start space-x-3 space-y-0"
                                    >
                                      <FormControl>
                                        <Checkbox
                                          checked={field.value?.includes(ministry)}
                                          onCheckedChange={(checked) => {
                                            return checked
                                              ? field.onChange([...(field.value || []), ministry])
                                              : field.onChange(
                                                  field.value?.filter(
                                                    (value) => value !== ministry
                                                  )
                                                )
                                          }}
                                        />
                                      </FormControl>
                                      <FormLabel className="font-normal">
                                        {ministry}
                                      </FormLabel>
                                    </FormItem>
                                  )
                                }}
                              />
                            ))}
                          </div>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="skills_talents"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>{t('skillsTalents')}</FormLabel>
                          <FormControl>
                            <Textarea 
                              placeholder={t('skillsTalentsPlaceholder')}
                              className="min-h-[100px]" 
                              {...field} 
                            />
                          </FormControl>
                          <FormDescription>
                            {t('skillsTalentsDescription')}
                          </FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  {/* DCG Selection */}
                  {dcgs.length > 0 && (
                    <div className="space-y-4">
                      <h3 className="text-lg font-semibold border-b pb-2">{t('dcgSelection')}</h3>
                      
                      <FormField
                        control={form.control}
                        name="dcg_id"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>{t('selectDcg')}</FormLabel>
                            <Select onValueChange={field.onChange} value={field.value}>
                              <FormControl>
                                <SelectTrigger>
                                  <SelectValue placeholder={t('selectDcgPlaceholder')} />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                {dcgs.map((dcg) => (
                                  <SelectItem key={dcg.id} value={dcg.id}>
                                    {dcg.name} {dcg.location && `- ${dcg.location}`}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                            <FormDescription>
                              {t('dcgDescription')}
                            </FormDescription>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                  )}

                  <Button type="submit" className="w-full" disabled={isPending}>
                    {isPending ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        {t('completeRegistration')}...
                      </>
                    ) : (
                      t('completeRegistration')
                    )}
                  </Button>
                </form>
              </Form>
            </CardContent>
          </Card>
        </div>
      </div>
    </>
  );
}
