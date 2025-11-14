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

export default function VisitorRegister() {
  const { regionCode } = useParams<{ regionCode: string }>();
  const navigate = useNavigate();
  const { data: region, isLoading: regionLoading } = useRegionBySlug(regionCode);
  const { mutate: registerVisitor, isPending } = useVisitorRegistration();
  const [registrationSuccess, setRegistrationSuccess] = useState<{ visitor_id: string; message: string } | null>(null);

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
            message: error.message || 'Registration failed. Please try again.'
          });
        }
      }
    );
  };

  if (regionLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!region) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background p-4">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle>Region Not Found</CardTitle>
            <CardDescription>
              The region you're trying to register for could not be found.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button onClick={() => navigate('/')} className="w-full">
              Return to Home
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (registrationSuccess) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background p-4">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <div className="flex justify-center mb-4">
              <CheckCircle2 className="h-16 w-16 text-green-600" />
            </div>
            <CardTitle className="text-2xl">Registration Successful!</CardTitle>
            <CardDescription>{registrationSuccess.message}</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="bg-muted p-4 rounded-lg text-center">
              <p className="text-sm text-muted-foreground mb-1">Your Visitor ID</p>
              <p className="text-2xl font-bold text-foreground">{registrationSuccess.visitor_id}</p>
            </div>
            <p className="text-sm text-muted-foreground text-center">
              Please save this ID for your records. A regional administrator will contact you soon.
            </p>
            <div className="flex flex-col gap-2">
              <Button onClick={() => navigate(`/regional/${regionCode}`)} className="w-full">
                Go to {region.name}
              </Button>
              <Button variant="outline" onClick={() => setRegistrationSuccess(null)} className="w-full">
                Register Another Visitor
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="container max-w-2xl mx-auto px-4 py-8">
        <Button
          variant="ghost"
          onClick={() => navigate(`/regional/${regionCode}`)}
          className="mb-6"
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to {region.name}
        </Button>

        <Card>
          <CardHeader className="text-center">
            <CardTitle className="text-3xl">Visitor Registration</CardTitle>
            <CardDescription className="text-lg">
              Welcome to {region.name}
            </CardDescription>
            <p className="text-sm text-muted-foreground mt-2">
              Please fill out the form below to register as a visitor. All fields are required.
            </p>
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
                        <FormLabel>First Name</FormLabel>
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
                        <FormLabel>Last Name</FormLabel>
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
                      <FormLabel>Email Address</FormLabel>
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
                      <FormLabel>Phone Number</FormLabel>
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
                      <FormLabel>Address</FormLabel>
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
                      Registering...
                    </>
                  ) : (
                    'Complete Visitor Registration'
                  )}
                </Button>

                <p className="text-center text-sm text-muted-foreground">
                  Already a member?{' '}
                  <Link to="/auth/member" className="text-primary hover:underline font-medium">
                    Sign In
                  </Link>
                </p>
              </form>
            </Form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}