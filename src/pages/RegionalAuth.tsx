
import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Eye, EyeOff, Users, Shield, Loader2 } from 'lucide-react';

const RegionalAuth = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [isSignUp, setIsSignUp] = useState(false);
  
  const navigate = useNavigate();
  const location = useLocation();
  const { toast } = useToast();

  const from = (location.state as any)?.from?.pathname || '/admin/regional/dashboard';

  useEffect(() => {
    console.log('RegionalAuth: Component mounted, checking existing session...');
    checkExistingSession();
  }, []);

  const checkExistingSession = async () => {
    try {
      console.log('RegionalAuth: Checking for existing session...');
      const { data: { session }, error } = await supabase.auth.getSession();
      
      if (error) {
        console.error('RegionalAuth: Session check error:', error);
        return;
      }

      if (session?.user) {
        console.log('RegionalAuth: Found existing session for user:', session.user.id);
        const hasRole = await checkRegionalAdminRole(session.user.id);
        if (hasRole) {
          console.log('RegionalAuth: Valid regional admin session found, redirecting...');
          navigate(from, { replace: true });
        } else {
          console.log('RegionalAuth: User does not have regional admin role');
        }
      } else {
        console.log('RegionalAuth: No existing session found');
      }
    } catch (error) {
      console.error('RegionalAuth: Exception during session check:', error);
    }
  };

  const checkRegionalAdminRole = async (userId: string): Promise<boolean> => {
    try {
      console.log('RegionalAuth: Checking regional admin role for user:', userId);
      
      const { data: userRoles, error } = await supabase
        .from('user_roles')
        .select('role, is_active')
        .eq('user_id', userId)
        .eq('role', 'regional_admin')
        .eq('is_active', true);

      if (error) {
        console.error('RegionalAuth: Role check error:', error);
        return false;
      }

      console.log('RegionalAuth: Role check result:', userRoles);
      return userRoles && userRoles.length > 0;
    } catch (error) {
      console.error('RegionalAuth: Role check exception:', error);
      return false;
    }
  };

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!email || !password) {
      toast({
        title: "Missing Information",
        description: "Please enter both email and password.",
        variant: "destructive"
      });
      return;
    }

    console.log('RegionalAuth: Starting sign in process for:', email);
    setIsLoading(true);

    try {
      // Step 1: Sign in with Supabase
      console.log('RegionalAuth: Attempting Supabase sign in...');
      const { data: authData, error: signInError } = await supabase.auth.signInWithPassword({
        email: email.trim(),
        password: password
      });

      if (signInError) {
        console.error('RegionalAuth: Sign in error:', signInError);
        let message = 'Sign in failed. Please try again.';
        
        if (signInError.message.includes('Invalid login credentials')) {
          message = 'Invalid email or password. Please check your credentials.';
        } else if (signInError.message.includes('Email not confirmed')) {
          message = 'Please check your email and confirm your account first.';
        } else if (signInError.message.includes('Too many requests')) {
          message = 'Too many login attempts. Please wait a moment and try again.';
        }
        
        toast({
          title: "Sign In Failed",
          description: message,
          variant: "destructive"
        });
        return;
      }

      if (!authData.user) {
        console.error('RegionalAuth: No user data received after sign in');
        toast({
          title: "Sign In Failed",
          description: "No user data received. Please try again.",
          variant: "destructive"
        });
        return;
      }

      console.log('RegionalAuth: Sign in successful for user:', authData.user.id);

      // Step 2: Check regional admin role
      console.log('RegionalAuth: Checking regional admin role...');
      const hasRole = await checkRegionalAdminRole(authData.user.id);
      
      if (!hasRole) {
        console.log('RegionalAuth: User lacks regional admin role, signing out...');
        await supabase.auth.signOut();
        toast({
          title: "Access Denied",
          description: "You don't have regional admin permissions. Contact an administrator if this is incorrect.",
          variant: "destructive"
        });
        return;
      }

      // Step 3: Success - redirect to dashboard
      console.log('RegionalAuth: Regional admin role verified, redirecting to:', from);
      
      toast({
        title: "Welcome back!",
        description: "Successfully signed in to the regional portal."
      });

      // Small delay to ensure toast is shown
      setTimeout(() => {
        navigate(from, { replace: true });
      }, 500);

    } catch (error: any) {
      console.error('RegionalAuth: Unexpected error during sign in:', error);
      toast({
        title: "Sign In Error",
        description: error.message || "An unexpected error occurred. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!email || !password || !firstName || !lastName) {
      toast({
        title: "Missing Information",
        description: "Please fill in all required fields.",
        variant: "destructive"
      });
      return;
    }

    if (password.length < 6) {
      toast({
        title: "Password Too Short",
        description: "Password must be at least 6 characters long.",
        variant: "destructive"
      });
      return;
    }

    console.log('RegionalAuth: Starting sign up process for:', email);
    setIsLoading(true);

    try {
      const { data: authData, error: signUpError } = await supabase.auth.signUp({
        email: email.trim(),
        password: password,
        options: {
          data: {
            first_name: firstName.trim(),
            last_name: lastName.trim()
          }
        }
      });

      if (signUpError) {
        console.error('RegionalAuth: Sign up error:', signUpError);
        toast({
          title: "Sign Up Failed",
          description: signUpError.message || "Failed to create account. Please try again.",
          variant: "destructive"
        });
        return;
      }

      if (authData.user) {
        console.log('RegionalAuth: Sign up successful for user:', authData.user.id);
        
        // Try to assign regional admin role
        try {
          console.log('RegionalAuth: Attempting to assign regional admin role...');
          const { error: roleError } = await supabase
            .from('user_roles')
            .insert({
              user_id: authData.user.id,
              role: 'regional_admin',
              is_active: true
            });

          if (roleError) {
            console.error('RegionalAuth: Role assignment error:', roleError);
            toast({
              title: "Account created but role assignment failed",
              description: "Please contact an administrator to assign your regional admin role.",
              variant: "destructive"
            });
          } else {
            console.log('RegionalAuth: Regional admin role assigned successfully');
          }
        } catch (roleErr) {
          console.error('RegionalAuth: Role assignment exception:', roleErr);
        }
      }

      toast({
        title: "Account created!",
        description: authData.user?.email_confirmed_at 
          ? "You can now sign in with your credentials." 
          : "Please check your email to confirm your account, then sign in."
      });

      // Switch to sign in mode
      setIsSignUp(false);
      setPassword('');
      setFirstName('');
      setLastName('');

    } catch (error: any) {
      console.error('RegionalAuth: Unexpected error during sign up:', error);
      toast({
        title: "Sign Up Error",
        description: error.message || "An unexpected error occurred. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-wca-teal/10 via-wca-teal/5 to-wca-purple/10 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-grid-pattern opacity-5"></div>
      
      <div className="w-full max-w-md relative z-10">
        <div className="text-center mb-8">
          <div className="inline-flex items-center gap-3 mb-4">
            <div className="p-3 rounded-2xl bg-gradient-to-r from-wca-teal to-wca-teal/80 text-white">
              <Users size={32} />
            </div>
            <div>
              <h1 className="text-3xl font-bold bg-gradient-to-r from-wca-teal to-wca-purple bg-clip-text text-transparent">
                WCA
              </h1>
              <p className="text-sm text-muted-foreground">
                Regional Portal
              </p>
            </div>
          </div>
        </div>

        <Card className="backdrop-blur-sm bg-white/80 border-white/20 shadow-2xl">
          <CardHeader className="text-center space-y-2">
            <CardTitle className="text-2xl font-semibold">
              {isSignUp ? 'Create Regional Account' : 'Welcome Back'}
            </CardTitle>
            <CardDescription>
              {isSignUp ? 'Create your regional account to get started' : 'Sign in to access the regional portal'}
            </CardDescription>
          </CardHeader>

          <CardContent>
            <form onSubmit={isSignUp ? handleSignUp : handleSignIn} className="space-y-4">
              {isSignUp && (
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label htmlFor="firstName" className="block text-sm font-medium text-gray-700 mb-1">
                      First Name
                    </label>
                    <Input
                      id="firstName"
                      type="text"
                      placeholder="John"
                      value={firstName}
                      onChange={(e) => setFirstName(e.target.value)}
                      className="h-11 bg-white/50 border-gray-200 focus:border-wca-teal focus:ring-wca-teal/20"
                      disabled={isLoading}
                      required
                    />
                  </div>
                  <div>
                    <label htmlFor="lastName" className="block text-sm font-medium text-gray-700 mb-1">
                      Last Name
                    </label>
                    <Input
                      id="lastName"
                      type="text"
                      placeholder="Doe"
                      value={lastName}
                      onChange={(e) => setLastName(e.target.value)}
                      className="h-11 bg-white/50 border-gray-200 focus:border-wca-teal focus:ring-wca-teal/20"
                      disabled={isLoading}
                      required
                    />
                  </div>
                </div>
              )}

              <div>
                <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
                  Email
                </label>
                <Input
                  id="email"
                  type="email"
                  placeholder="Enter your email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="h-11 bg-white/50 border-gray-200 focus:border-wca-teal focus:ring-wca-teal/20"
                  disabled={isLoading}
                  required
                />
              </div>

              <div>
                <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-1">
                  Password
                </label>
                <div className="relative">
                  <Input
                    id="password"
                    type={showPassword ? 'text' : 'password'}
                    placeholder="Enter your password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="h-11 bg-white/50 border-gray-200 focus:border-wca-teal focus:ring-wca-teal/20 pr-10"
                    disabled={isLoading}
                    required
                    minLength={6}
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
              </div>

              <Button
                type="submit"
                className="w-full h-11 bg-gradient-to-r from-wca-teal to-wca-teal/80 hover:from-wca-teal/90 hover:to-wca-teal/70 text-white font-medium transition-all duration-200 shadow-lg hover:shadow-xl"
                disabled={isLoading}
              >
                {isLoading ? (
                  <div className="flex items-center gap-2">
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>{isSignUp ? 'Creating Account...' : 'Signing In...'}</span>
                  </div>
                ) : (
                  <span>{isSignUp ? 'Create Account' : 'Sign In'}</span>
                )}
              </Button>
            </form>

            <div className="mt-6 text-center">
              <p className="text-sm text-muted-foreground">
                {isSignUp ? 'Already have an account?' : "Don't have an account?"}
              </p>
              <Button
                variant="link"
                className="text-wca-teal hover:text-wca-teal/80 font-medium p-0 h-auto"
                onClick={() => {
                  setIsSignUp(!isSignUp);
                  setEmail('');
                  setPassword('');
                  setFirstName('');
                  setLastName('');
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
                  onClick={() => navigate('/auth/super')}
                  disabled={isLoading}
                >
                  <Shield size={16} className="mr-1" />
                  Super Admin
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

export default RegionalAuth;
