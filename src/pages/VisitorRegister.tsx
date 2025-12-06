import { useParams, useNavigate, Link } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useRegionBySlug } from '@/hooks/useRegionBySlug';
import { useVisitorRegistration } from '@/hooks/useVisitorRegistration';
import { usePublicRegionEvents } from '@/hooks/usePublicRegionEvents';
import { visitorRegistrationSchema, VisitorRegistrationFormData } from '@/schemas/visitorRegistrationSchema';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Loader2, CheckCircle2, ArrowLeft, UserCheck } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useState, useMemo } from 'react';
import { useLanguage } from '@/hooks/useLanguage';
import { format } from 'date-fns';
import Navbar from '@/components/layout/Navbar';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { CalendarIcon } from 'lucide-react';
import { cn } from '@/lib/utils';
export default function VisitorRegister() {
  const {
    regionCode
  } = useParams<{
    regionCode: string;
  }>();
  const navigate = useNavigate();
  const {
    data: region,
    isLoading: regionLoading
  } = useRegionBySlug(regionCode);
  const { data: events = [], isLoading: eventsLoading } = usePublicRegionEvents(region?.id);
  
  // Events from the hook are already filtered to past public events from the last month
  const pastEvents = events;
  
  const {
    mutate: registerVisitor,
    isPending
  } = useVisitorRegistration();
  const [registrationSuccess, setRegistrationSuccess] = useState<{
    visitor_id: string;
    message: string;
  } | null>(null);
  const [alreadyEnrolled, setAlreadyEnrolled] = useState<{
    visitor_id?: string;
    message: string;
  } | null>(null);
  const {
    t,
    localizedField
  } = useLanguage();
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
      emergency_contact_name: '',
      emergency_contact_phone: '',
      rated_event_id: undefined,
      event_satisfaction_rating: undefined,
      referral_source: '',
      referral_person_name: '',
      referral_other_details: ''
    }
  });
  const onSubmit = (data: VisitorRegistrationFormData) => {
    if (!region?.id) return;
    registerVisitor({
      ...data,
      region_id: region.id
    }, {
      onSuccess: result => {
        // Handle duplicate registration as a friendly message
        if (result.isDuplicate) {
          setAlreadyEnrolled({
            visitor_id: result.visitor_id,
            message: result.message || t('alreadyRegisteredMessage')
          });
        } else {
          setRegistrationSuccess({
            visitor_id: result.visitor_id || '',
            message: result.message || ''
          });
          form.reset();
        }
      },
      onError: (error: any) => {
        form.setError('root', {
          message: error.message || t('registrationFailed')
        });
      }
    });
  };
  if (regionLoading) {
    return <>
        <Navbar />
        <div className="min-h-screen flex items-center justify-center bg-background">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </>;
  }
  if (!region) {
    return <>
        <Navbar />
        <div className="min-h-screen flex items-center justify-center bg-background p-4">
          <Card className="w-full max-w-md">
            <CardHeader>
              <CardTitle>{t('regionNotFound')}</CardTitle>
              <CardDescription>
                {t('regionNotFoundDesc')}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button onClick={() => navigate('/')} className="w-full">
                {t('returnToHome')}
              </Button>
            </CardContent>
          </Card>
        </div>
      </>;
  }
  // Already enrolled screen
  if (alreadyEnrolled) {
    return <>
        <Navbar />
        <div className="min-h-screen flex items-center justify-center bg-background p-4">
          <Card className="w-full max-w-md border-blue-200 bg-blue-50/50 dark:border-blue-800 dark:bg-blue-950/20">
            <CardHeader className="text-center">
              <div className="flex justify-center mb-4">
                <div className="rounded-full bg-blue-100 dark:bg-blue-900/50 p-4">
                  <UserCheck className="h-12 w-12 text-blue-600 dark:text-blue-400" />
                </div>
              </div>
              <CardTitle className="text-2xl text-blue-900 dark:text-blue-100">
                {t('welcomeBack')}
              </CardTitle>
              <CardDescription className="text-blue-700 dark:text-blue-300">
                {t('alreadyRegisteredMessage')}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {alreadyEnrolled.visitor_id && (
                <div className="bg-blue-100/50 dark:bg-blue-900/30 rounded-lg p-4 text-center">
                  <p className="text-sm text-blue-600 dark:text-blue-400 mb-1">{t('yourVisitorId')}</p>
                  <p className="font-mono font-semibold text-blue-900 dark:text-blue-100">
                    {alreadyEnrolled.visitor_id}
                  </p>
                </div>
              )}
              <div className="flex flex-col gap-2">
                <Button 
                  onClick={() => navigate(`/${regionCode}`)} 
                  variant="default"
                  className="w-full"
                >
                  {t('goToHomepage')}
                </Button>
                <Button 
                  onClick={() => setAlreadyEnrolled(null)} 
                  variant="outline"
                  className="w-full"
                >
                  {t('tryDifferentEmail')}
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </>;
  }

  if (registrationSuccess) {
    return <>
        <Navbar />
        <div className="min-h-screen flex items-center justify-center bg-background p-4">
          <Card className="w-full max-w-md">
            <CardHeader className="text-center">
              <div className="flex justify-center mb-4">
                <CheckCircle2 className="h-16 w-16 text-green-600" />
              </div>
              <CardTitle className="text-2xl">{t('registrationSuccessful')}</CardTitle>
              <CardDescription>{t('vipWelcomeMessage')}</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              
              
              <div className="flex gap-2">
                <Button onClick={() => setRegistrationSuccess(null)} variant="default" className="flex-1">
                  {t('registerAnotherVisitor')}
                </Button>
                
              </div>
            </CardContent>
          </Card>
        </div>
      </>;
  }
  return <>
      <Navbar />
      <div className="min-h-screen bg-background">
        <div className="container max-w-2xl mx-auto px-4 py-8">
        <Card>
          <CardHeader>
            <CardTitle className="text-xl text-center">{t('visitorRegTitle')}</CardTitle>
            <CardDescription className="text-base text-center">
              {t('visitorRegDescription')}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                {form.formState.errors.root && <Alert variant="destructive">
                    <AlertDescription>{form.formState.errors.root.message}</AlertDescription>
                  </Alert>}

                <div className="grid md:grid-cols-2 gap-4">
                  <FormField control={form.control} name="first_name" render={({
                    field
                  }) => <FormItem>
                        <FormLabel>{t('firstName')}</FormLabel>
                        <FormControl>
                          <Input placeholder="John" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>} />

                  <FormField control={form.control} name="last_name" render={({
                    field
                  }) => <FormItem>
                        <FormLabel>{t('lastName')}</FormLabel>
                        <FormControl>
                          <Input placeholder="Doe" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>} />
                </div>

                <FormField control={form.control} name="email" render={({
                  field
                }) => <FormItem>
                      <FormLabel>{t('emailAddress')}</FormLabel>
                      <FormControl>
                        <Input type="email" placeholder="john.doe@example.com" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>} />

                <FormField control={form.control} name="phone" render={({
                  field
                }) => <FormItem>
                      <FormLabel>{t('phoneNumber')}</FormLabel>
                      <FormControl>
                        <Input type="tel" placeholder="+1 (555) 123-4567" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>} />

                <FormField control={form.control} name="address" render={({
                  field
                }) => <FormItem>
                      <FormLabel>{t('address')}</FormLabel>
                      <FormControl>
                        <Textarea placeholder="123 Main St, City, State, ZIP" className="min-h-[80px]" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>} />

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
                              onSelect={(date) => field.onChange(date ? format(date, 'yyyy-MM-dd') : '')}
                              disabled={(date) =>
                                date > new Date() || date < new Date("1900-01-01")
                              }
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

                <div className="grid md:grid-cols-2 gap-4 pt-4 border-t">
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

                {/* Event Selection - Only show if events are available */}
                {pastEvents.length > 0 && (
                  <FormField
                    control={form.control}
                    name="rated_event_id"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>{t('selectEvent')}</FormLabel>
                        <p className="text-sm text-muted-foreground mb-2">
                          Select the event you attended
                        </p>
                        <Select onValueChange={field.onChange} value={field.value}>
                          <FormControl>
                            <SelectTrigger className="h-auto min-h-[2.5rem]">
                              <SelectValue placeholder={t('selectEventPlaceholder')} className="whitespace-normal text-left" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent className="max-w-[calc(100vw-2rem)] md:max-w-md">
                            {pastEvents.map((event) => (
                              <SelectItem 
                                key={event.id} 
                                value={event.id}
                                className="whitespace-normal h-auto py-3"
                              >
                                <div className="flex flex-col gap-1">
                                  <span className="font-medium">
                                    {localizedField(event.name, event.name_fr) || event.name || 'Unnamed Event'}
                                  </span>
                                  <span className="text-xs text-muted-foreground">
                                    {format(new Date(event.start_datetime), 'PPP')}
                                  </span>
                                </div>
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                )}

                {/* Event Satisfaction Rating - Only show if an event is selected */}
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
                                <label
                                  htmlFor={`rating-${rating}`}
                                  className="text-sm font-medium cursor-pointer"
                                >
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
                      <Select onValueChange={field.onChange} value={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder={t('selectReferralSource')} />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="social_media">{t('socialMedia')}</SelectItem>
                          <SelectItem value="website">{t('website')}</SelectItem>
                          <SelectItem value="invited_by">{t('invitedBy')}</SelectItem>
                          <SelectItem value="other">{t('other')}</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* Conditional Person Name Input */}
                {form.watch('referral_source') === 'invited_by' && (
                  <FormField
                    control={form.control}
                    name="referral_person_name"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>{t('referralPersonName')}</FormLabel>
                        <FormControl>
                          <Input 
                            placeholder={t('enterPersonName')} 
                            {...field} 
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                )}

                {/* Conditional Other Details Input */}
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
                            className="min-h-[80px]"
                            {...field} 
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                )}

                <Button type="submit" className="w-full" disabled={isPending}>
                  {isPending ? <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      {t('completeRegistration')}...
                    </> : t('completeRegistration')}
                </Button>

                
              </form>
            </Form>
          </CardContent>
        </Card>
      </div>
    </div>
    </>;
}