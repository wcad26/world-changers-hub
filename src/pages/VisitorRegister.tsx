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
import { Loader2, CheckCircle2, ArrowLeft } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useState } from 'react';
import { useLanguage } from '@/hooks/useLanguage';
import { format } from 'date-fns';
import Navbar from '@/components/layout/Navbar';
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
  const {
    mutate: registerVisitor,
    isPending
  } = useVisitorRegistration();
  const [registrationSuccess, setRegistrationSuccess] = useState<{
    visitor_id: string;
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
      rated_event_id: undefined,
      event_satisfaction_rating: undefined,
      referral_source: '',
      referral_person_name: ''
    }
  });
  const onSubmit = (data: VisitorRegistrationFormData) => {
    if (!region?.id) return;
    registerVisitor({
      ...data,
      region_id: region.id
    }, {
      onSuccess: result => {
        setRegistrationSuccess({
          visitor_id: result.visitor_id,
          message: result.message
        });
        form.reset();
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

                {/* Event Selection - Only show if events are available */}
                {events.length > 0 && (
                  <FormField
                    control={form.control}
                    name="rated_event_id"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>{t('selectEvent')} ({t('optional')})</FormLabel>
                        <Select onValueChange={field.onChange} value={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder={t('selectEventPlaceholder')} />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {events.map((event) => (
                              <SelectItem key={event.id} value={event.id}>
                                {localizedField(event.name, event.name_fr) || event.name || 'Unnamed Event'} - {format(new Date(event.start_datetime), 'PPP')}
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
                        <FormLabel>{t('eventSatisfaction')} ({t('optional')})</FormLabel>
                        <FormControl>
                          <RadioGroup
                            onValueChange={(value) => field.onChange(parseInt(value))}
                            value={field.value?.toString()}
                            className="flex flex-wrap gap-3"
                          >
                            {[0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((rating) => (
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
                      <FormLabel>{t('referralSource')} ({t('optional')})</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder={t('selectReferralSource')} />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="friend_family">{t('friendFamily')}</SelectItem>
                          <SelectItem value="social_media">{t('socialMedia')}</SelectItem>
                          <SelectItem value="website">{t('website')}</SelectItem>
                          <SelectItem value="church_member">{t('churchMember')}</SelectItem>
                          <SelectItem value="event">{t('event')}</SelectItem>
                          <SelectItem value="search_engine">{t('searchEngine')}</SelectItem>
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