import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Eye, EyeOff, Shield, Users } from 'lucide-react';

const authSchema = z.object({
  email: z.string().email('Please enter a valid email address'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
  firstName: z.string().min(1, 'First name is required').optional(),
  lastName: z.string().min(1, 'Last name is required').optional(),
});

type AuthFormData = z.infer<typeof authSchema>;

const Auth = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [isSignUp, setIsSignUp] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { toast } = useToast();

  const portalType = searchParams.get('type') || 'regional';
  const isSuper = portalType === 'super';

  const form = useForm<AuthFormData>({
    resolver: zodResolver(authSchema),
    defaultValues: {
      email: '',
      password: '',
      firstName: '',
      lastName: ''
    },
  });

  // Check if user is already logged in
  useEffect(() => {
    const checkUser = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (session) {
        const redirectPath = isSuper ? '/admin/super/dashboard' : '/admin/regional/dashboard';
        const hasValidRole = await checkUserRole(session.user.id, isSuper ? 'super_admin' : 'regional_admin');
        if (hasValidRole) {
          navigate(redirectPath);
        }
      }
    };
    checkUser();
  }, [navigate, isSuper]);

  const checkUserRole = async (userId: string, requiredRole: string): Promise<boolean> => {
    try {
      console.log(`Checking ${requiredRole} role for user:`, userId);
      
      const { data: userRoles, error: roleError } = await supabase
        .from('user_roles')
        .select('role, is_active')
        .eq('user_id', userId)
        .eq('role', requiredRole)
        .eq('is_active', true);

      console.log('Role check result:', { userRoles, roleError });

      if (roleError) {
        console.error('Error checking user roles:', roleError);
        return false;
      }

      return userRoles && userRoles.length > 0;
    } catch (error) {
      console.error('Exception checking roles:', error);
      return false;
    }
  };

  const onSubmit = async (data: AuthFormData) => {
    setIsLoading(true);
    
    try {
      if (isSignUp) {
        console.log('Starting sign up process...');
        const { data: authData, error: signUpError } = await supabase.auth.signUp({
          email: data.email,
          password: data.password,
          options: {
            data: {
              first_name: data.firstName,
              last_name: data.lastName
            },
            emailRedirectTo: `${window.location.origin}${isSuper ? '/admin/super/dashboard' : '/admin/regional/dashboard'}`
          }
        });

        if (signUpError) {
          console.error('Sign up error:', signUpError);
          throw signUpError;
        }

        console.log('Sign up successful, user:', authData.user?.id);

        // Create the appropriate role for the user
        if (authData.user) {
          try {
            const roleToAssign = isSuper ? 'super_admin' : 'regional_admin';
            console.log(`Attempting to assign role: ${roleToAssign}`);
            
            const { error: roleError } = await supabase
              .from('user_roles')
              .insert({
                user_id: authData.user.id,
                role: roleToAssign,
                is_active: true
              });

            if (roleError) {
              console.error('Role assignment error:', roleError);
              toast({
                title: "Account created but role assignment failed",
                description: "Please contact an administrator to assign your role.",
                variant: "destructive"
              });
            } else {
              console.log('Role assigned successfully');
            }
          } catch (roleErr) {
            console.error('Role assignment exception:', roleErr);
          }
        }

        toast({
          title: "Account created successfully!",
          description: authData.user?.email_confirmed_at 
            ? "You can now sign in with your credentials." 
            : "Please check your email to confirm your account, then sign in.",
        });

        // Switch to sign in mode
        setIsSignUp(false);
        form.reset({ email: data.email, password: '' });
      } else {
        console.log('Starting sign in process...');
        const { data: signInData, error: signInError } = await supabase.auth.signInWithPassword({
          email: data.email,
          password: data.password,
        });

        if (signInError) {
          console.error('Sign in error:', signInError);
          
          // Provide specific error messages
          if (signInError.message.includes('Invalid login credentials')) {
            throw new Error('Invalid email or password. Please check your credentials and try again.');
          } else if (signInError.message.includes('Email not confirmed')) {
            throw new Error('Please check your email and click the confirmation link before signing in.');
          } else {
            throw signInError;
          }
        }

        console.log('Sign in successful, user:', signInData.user?.id);

        // Check if user has the appropriate role for this portal
        if (signInData.user) {
          const requiredRole = isSuper ? 'super_admin' : 'regional_admin';
          const hasRequiredRole = await checkUserRole(signInData.user.id, requiredRole);

          if (!hasRequiredRole) {
            console.log(`User does not have ${requiredRole} role, signing out...`);
            // Sign out the user since they don't have the right permissions
            await supabase.auth.signOut();
            throw new Error(`You don't have ${isSuper ? 'super admin' : 'regional admin'} permissions for this portal. If you believe this is an error, please contact an administrator.`);
          }

          const redirectPath = isSuper ? '/admin/super/dashboard' : '/admin/regional/dashboard';
          navigate(redirectPath);
          
          toast({
            title: "Welcome back!",
            description: "You have successfully signed in.",
          });
        }
      }
    } catch (error: any) {
      console.error('Authentication error:', error);
      toast({
        title: "Authentication failed",
        description: error.message || "An unexpected error occurred. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-wca-purple/10 via-wca-violet/5 to-wca-teal/10 flex items-center justify-center p-4">
      {/* Background Pattern */}
      <div className="absolute inset-0 bg-grid-pattern opacity-5"></div>
      
      <div className="w-full max-w-md relative z-10">
        {/* Logo and Portal Type */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center gap-3 mb-4">
            {isSuper ? (
              <div className="p-3 rounded-2xl bg-gradient-to-r from-wca-purple to-wca-violet text-white">
                <Shield size={32} />
              </div>
            ) : (
              <div className="p-3 rounded-2xl bg-gradient-to-r from-wca-teal to-wca-teal/80 text-white">
                <Users size={32} />
              </div>
            )}
            <div>
              <h1 className="text-3xl font-bold bg-gradient-to-r from-wca-purple to-wca-violet bg-clip-text text-transparent">
                WCA
              </h1>
              <p className="text-sm text-muted-foreground">
                {isSuper ? 'Super Admin Portal' : 'Regional Portal'}
              </p>
            </div>
          </div>
        </div>

        {/* Auth Card */}
        <Card className="backdrop-blur-sm bg-white/80 border-white/20 shadow-2xl">
          <CardHeader className="text-center space-y-2">
            <CardTitle className="text-2xl font-semibold">
              {isSignUp ? 'Create Account' : 'Welcome Back'}
            </CardTitle>
            <CardDescription>
              {isSignUp 
                ? `Create your ${isSuper ? 'super admin' : 'regional'} account to get started`
                : `Sign in to access the ${isSuper ? 'super admin' : 'regional'} portal`
              }
            </CardDescription>
          </CardHeader>

          <CardContent>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                {isSignUp && (
                  <div className="grid grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="firstName"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>First Name</FormLabel>
                          <FormControl>
                            <Input
                              placeholder="John"
                              className="h-11 bg-white/50 border-gray-200 focus:border-wca-purple focus:ring-wca-purple/20"
                              {...field}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="lastName"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Last Name</FormLabel>
                          <FormControl>
                            <Input
                              placeholder="Doe"
                              className="h-11 bg-white/50 border-gray-200 focus:border-wca-purple focus:ring-wca-purple/20"
                              {...field}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                )}

                <FormField
                  control={form.control}
                  name="email"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Email</FormLabel>
                      <FormControl>
                        <Input
                          type="email"
                          placeholder="Enter your email"
                          className="h-11 bg-white/50 border-gray-200 focus:border-wca-purple focus:ring-wca-purple/20"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="password"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Password</FormLabel>
                      <FormControl>
                        <div className="relative">
                          <Input
                            type={showPassword ? 'text' : 'password'}
                            placeholder="Enter your password"
                            className="h-11 bg-white/50 border-gray-200 focus:border-wca-purple focus:ring-wca-purple/20 pr-10"
                            {...field}
                          />
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            className="absolute right-2 top-1/2 -translate-y-1/2 h-7 w-7 text-gray-500 hover:text-gray-700"
                            onClick={() => setShowPassword(!showPassword)}
                          >
                            {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                          </Button>
                        </div>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <Button
                  type="submit"
                  className="w-full h-11 bg-gradient-to-r from-wca-purple to-wca-violet hover:from-wca-purple/90 hover:to-wca-violet/90 text-white font-medium transition-all duration-200 shadow-lg hover:shadow-xl"
                  disabled={isLoading}
                >
                  {isLoading ? (
                    <div className="flex items-center gap-2">
                      <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      {isSignUp ? 'Creating Account...' : 'Signing In...'}
                    </div>
                  ) : (
                    isSignUp ? 'Create Account' : 'Sign In'
                  )}
                </Button>
              </form>
            </Form>

            {/* Toggle between sign in and sign up */}
            <div className="mt-6 text-center">
              <p className="text-sm text-muted-foreground">
                {isSignUp ? 'Already have an account?' : "Don't have an account?"}
              </p>
              <Button
                variant="link"
                className="text-wca-purple hover:text-wca-violet font-medium p-0 h-auto"
                onClick={() => {
                  setIsSignUp(!isSignUp);
                  form.reset();
                }}
              >
                {isSignUp ? 'Sign in instead' : 'Create account'}
              </Button>
            </div>

            {/* Portal switcher */}
            <div className="mt-4 pt-4 border-t border-gray-200">
              <p className="text-xs text-center text-muted-foreground mb-2">
                Need access to a different portal?
              </p>
              <div className="flex gap-2">
                <Button
                  variant={!isSuper ? "default" : "outline"}
                  size="sm"
                  className="flex-1 h-9"
                  onClick={() => navigate('/auth?type=regional')}
                >
                  Regional Portal
                </Button>
                <Button
                  variant={isSuper ? "default" : "outline"}
                  size="sm"
                  className="flex-1 h-9"
                  onClick={() => navigate('/auth?type=super')}
                >
                  Super Admin
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Back to main site */}
        <div className="text-center mt-6">
          <Button
            variant="ghost"
            className="text-muted-foreground hover:text-foreground"
            onClick={() => navigate('/')}
          >
            ← Back to main site
          </Button>
        </div>
      </div>
    </div>
  );
};

export default Auth;
