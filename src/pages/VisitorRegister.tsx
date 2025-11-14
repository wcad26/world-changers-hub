import { useParams, useNavigate, Link } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useRegionBySlug } from '@/hooks/useRegionBySlug';
import { useVisitorRegistration } from '@/hooks/useVisitorRegistration';
import { visitorRegistrationSchema, VisitorRegistrationFormData } from '@/schemas/visitorRegistrationSchema';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Loader2, CheckCircle2, ArrowLeft } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useState } from 'react';
import { useLanguage } from '@/hooks/useLanguage';
import Navbar from '@/components/layout/Navbar';

export default function VisitorRegister() {
  const { regionCode } = useParams<{ regionCode: string }>();
  const navigate = useNavigate();
  const { data: region, isLoading: regionLoading } = useRegionBySlug(regionCode);
  const { mutate: registerVisitor, isPending } = useVisitorRegistration();
  const [registrationSuccess, setRegistrationSuccess] = useState<{ visitor_id: string; message: string } | null>(null);
  const { t, localizedField } = useLanguage();

  const form = useForm<VisitorRegistrationFormData>({
    resolver: zodResolver(visitorRegistrationSchema),
    defaultValues: {
      first_name: '',
      last_name: '',
      email: '',
      phone: '',
      address: ''
    }
  });

  const onSubmit = (data: VisitorRegistrationFormData) => {
    if (!region?.id) return;

    registerVisitor(
      { ...data, region_id: region.id },
      {
        onSuccess: (result) => {
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
      </>
    );
  }

  if (registrationSuccess) {
    return (
      <>
        <Navbar />
        <div className="min-h-screen flex items-center justify-center bg-background p-4">
          <Card className="w-full max-w-md">
            <CardHeader className="text-center">
              <div className="flex justify-center mb-4">
                <CheckCircle2 className="h-16 w-16 text-green-600" />
              </div>
              <CardTitle className="text-2xl">{t('registrationSuccessful')}</CardTitle>
              <CardDescription>{registrationSuccess.message}</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="bg-muted p-4 rounded-lg text-center">
                <p className="text-sm text-muted-foreground mb-1">{t('yourVisitorId')}</p>
                <p className="text-2xl font-bold text-foreground">{registrationSuccess.visitor_id}</p>
              </div>
              <p className="text-sm text-muted-foreground text-center">
                {t('saveIdMessage')}
              </p>
              <div className="flex gap-2">
                <Button onClick={() => setRegistrationSuccess(null)} variant="outline" className="flex-1">
                  Register Another Visitor
                </Button>
                <Button onClick={() => navigate(`/regional/${regionCode}`)} className="flex-1">
                  {t('backToRegionalPage')}
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
      <div className="min-h-screen bg-background">
        <div className="container max-w-2xl mx-auto px-4 py-8">
        <Card>
          <CardHeader>
            <CardTitle className="text-2xl">{t('visitorRegTitle')}</CardTitle>
            <CardDescription className="text-base">
              {t('welcomeTo')} {region.name}. {t('visitorRegDescription')}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                {form.formState.errors.root && (
                  <Alert variant="destructive">
                    <AlertDescription>{form.formState.errors.root.message}</AlertDescription>
                  </Alert>
                )}

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

                <FormField
                  control={form.control}
                  name="email"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{t('emailAddress')}</FormLabel>
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
                      <FormLabel>{t('phoneNumber')}</FormLabel>
                      <FormControl>
                        <Input type="tel" placeholder="+1 (555) 123-4567" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="address"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{t('address')}</FormLabel>
                      <FormControl>
                        <Textarea 
                          placeholder="123 Main St, City, State, ZIP" 
                          className="min-h-[80px]"
                          {...field} 
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

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

                <p className="text-center text-sm text-muted-foreground">
                  {t('alreadyMember')}{' '}
                  <Link to="/auth/member" className="text-primary hover:underline font-medium">
                    {t('signIn')}
                  </Link>
                </p>
              </form>
            </Form>
          </CardContent>
        </Card>
      </div>
    </div>
    </>
  );
}