
import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
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

const SuperAuth = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [isSignUp, setIsSignUp] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();
  const { toast } = useToast();

  const from = (location.state as any)?.from?.pathname || '/admin/super/dashboard';

  const form = useForm<AuthFormData>({
    resolver: zodResolver(authSchema),
    defaultValues: {
      email: '',
      password: '',
      firstName: '',
      lastName: ''
    }
  });

  useEffect(() => {
    checkExistingSession();
  }, []);

  const checkExistingSession = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (session?.user) {
        console.log('Existing session found, checking super admin role...');
        const hasRole = await checkSuperAdminRole(session.user.id);
        if (hasRole) {
          console.log('Valid super admin session, redirecting...');
          navigate(from, { replace: true });
        }
      }
    } catch (error) {
      console.error('Error checking session:', error);
    }
  };

  const checkSuperAdminRole = async (userId: string): Promise<boolean> => {
    try {
      const { data: userRoles, error } = await supabase
        .from('user_roles')
        .select('role, is_active')
        .eq('user_id', userId)
        .eq('role', 'super_admin')
        .eq('is_active', true);

      if (error) {
        console.error('Role check error:', error);
        return false;
      }

      return userRoles && userRoles.length > 0;
    } catch (error) {
      console.error('Role check exception:', error);
      return false;
    }
  };

  const handleSignIn = async (email: string, password: string) => {
    console.log('Starting sign in process...');
    
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password
    });

    if (error) {
      console.error('Sign in error:', error);
      let message = 'Sign in failed. Please try again.';
      
      if (error.message.includes('Invalid login credentials')) {
        message = 'Invalid email or password. Please check your credentials.';
      } else if (error.message.includes('Email not confirmed')) {
        message = 'Please check your email and confirm your account first.';
      }
      
      throw new Error(message);
    }

    if (!data.user) {
      throw new Error('Sign in failed - no user data received');
    }

    console.log('Sign in successful, checking role...');
    
    // Check super admin role
    const hasRole = await checkSuperAdminRole(data.user.id);
    if (!hasRole) {
      console.log('User lacks super admin role, signing out...');
      await supabase.auth.signOut();
      throw new Error('You don\'t have super admin permissions. Contact an administrator if this is incorrect.');
    }

    console.log('Super admin role verified, redirecting...');
    navigate(from, { replace: true });
    
    toast({
      title: "Welcome back!",
      description: "Successfully signed in to the super admin portal."
    });
  };

  const handleSignUp = async (data: AuthFormData) => {
    console.log('Starting sign up process...');
    
    const { data: authData, error } = await supabase.auth.signUp({
      email: data.email,
      password: data.password,
      options: {
        data: {
          first_name: data.firstName,
          last_name: data.lastName
        }
      }
    });

    if (error) {
      console.error('Sign up error:', error);
      throw new Error(error.message);
    }

    if (authData.user) {
      // Try to assign super admin role
      try {
        const { error: roleError } = await supabase
          .from('user_roles')
          .insert({
            user_id: authData.user.id,
            role: 'super_admin',
            is_active: true
          });

        if (roleError) {
          console.error('Role assignment error:', roleError);
        }
      } catch (roleErr) {
        console.error('Role assignment exception:', roleErr);
      }
    }

    toast({
      title: "Account created!",
      description: authData.user?.email_confirmed_at 
        ? "You can now sign in with your credentials." 
        : "Please check your email to confirm your account, then sign in."
    });

    setIsSignUp(false);
    form.reset({ email: data.email, password: '' });
  };

  const onSubmit = async (data: AuthFormData) => {
    if (isLoading) return;
    
    console.log('Form submission started:', { email: data.email, isSignUp });
    setIsLoading(true);

    try {
      if (isSignUp) {
        await handleSignUp(data);
      } else {
        await handleSignIn(data.email, data.password);
      }
    } catch (error: any) {
      console.error('Authentication error:', error);
      toast({
        title: "Authentication failed",
        description: error.message || "An unexpected error occurred.",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
      console.log('Form submission completed');
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-wca-purple/10 via-wca-violet/5 to-wca-teal/10 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-grid-pattern opacity-5"></div>
      
      <div className="w-full max-w-md relative z-10">
        <div className="text-center mb-8">
          <div className="inline-flex items-center gap-3 mb-4">
            <div className="p-3 rounded-2xl bg-gradient-to-r from-wca-purple to-wca-violet text-white">
              <Shield size={32} />
            </div>
            <div>
              <h1 className="text-3xl font-bold bg-gradient-to-r from-wca-purple to-wca-violet bg-clip-text text-transparent">
                WCA
              </h1>
              <p className="text-sm text-muted-foreground">
                Super Admin Portal
              </p>
            </div>
          </div>
        </div>

        <Card className="backdrop-blur-sm bg-white/80 border-white/20 shadow-2xl">
          <CardHeader className="text-center space-y-2">
            <CardTitle className="text-2xl font-semibold">
              {isSignUp ? 'Create Super Admin Account' : 'Welcome Back'}
            </CardTitle>
            <CardDescription>
              {isSignUp ? 'Create your super admin account to get started' : 'Sign in to access the super admin portal'}
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
                              disabled={isLoading}
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
                              disabled={isLoading}
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
                          disabled={isLoading}
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
                            disabled={isLoading}
                            {...field}
                          />
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            className="absolute right-2 top-1/2 -translate-y-1/2 h-7 w-7 text-gray-500 hover:text-gray-700"
                            onClick={() => setShowPassword(!showPassword)}
                            disabled={isLoading}
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
                  className="w-full h-11 bg-gradient-to-r from-wca-purple to-wca-violet hover:from-wca-purple/90 hover:to-wca-violet/90 text-white font-medium transition-all duration-200 shadow-lg hover:shadow-xl disabled:opacity-50"
                  disabled={isLoading}
                >
                  {isLoading ? (
                    <div className="flex items-center gap-2">
                      <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      <span>{isSignUp ? 'Creating Account...' : 'Signing In...'}</span>
                    </div>
                  ) : (
                    <span>{isSignUp ? 'Create Account' : 'Sign In'}</span>
                  )}
                </Button>
              </form>
            </Form>

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
                disabled={isLoading}
              >
                {isSignUp ? 'Sign in instead' : 'Create account'}
              </Button>
            </div>

            <div className="mt-4 pt-4 border-t border-gray-200">
              <p className="text-xs text-center text-muted-foreground mb-2">
                Need access to a different portal?
              </p>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  className="flex-1 h-9"
                  onClick={() => navigate('/auth/regional')}
                  disabled={isLoading}
                >
                  <Users size={16} className="mr-1" />
                  Regional Portal
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        <div className="text-center mt-6">
          <Button
            variant="ghost"
            className="text-muted-foreground hover:text-foreground"
            onClick={() => navigate('/')}
            disabled={isLoading}
          >
            ← Back to main site
          </Button>
        </div>
      </div>
    </div>
  );
};

export default SuperAuth;
