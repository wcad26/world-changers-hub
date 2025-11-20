import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation, useParams } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Eye, EyeOff, Users, Shield, Loader2, AlertCircle } from 'lucide-react';
import { useRegionBySlug } from '@/hooks/useRegionBySlug';
import { Alert, AlertDescription } from '@/components/ui/alert';


const RegionSpecificAuth = () => {
  const { regionSlug } = useParams<{ regionSlug: string }>();
  const { data: region, isLoading: regionLoading, error: regionError } = useRegionBySlug(regionSlug);
  
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  
  const navigate = useNavigate();
  const location = useLocation();
  const { toast } = useToast();

  const from = (location.state as any)?.from?.pathname || '/admin/regional/dashboard';

  useEffect(() => {
    if (region) {
      console.log(`RegionSpecificAuth: Component mounted for region ${region.name}, checking existing session...`);
      checkExistingSession();
    }
  }, [region]);

  const checkExistingSession = async () => {
    try {
      console.log(`RegionSpecificAuth: Checking for existing session for region ${region?.name}...`);
      const { data: { session }, error } = await supabase.auth.getSession();
      
      if (error) {
        console.error('RegionSpecificAuth: Session check error:', error);
        return;
      }

      if (session?.user && region) {
        console.log('RegionSpecificAuth: Found existing session for user:', session.user.id);
        const hasRole = await checkRegionalAdminRole(session.user.id, region.id);
        if (hasRole) {
          console.log('RegionSpecificAuth: Valid regional admin session found, redirecting...');
          navigate(from, { replace: true });
        } else {
          console.log('RegionSpecificAuth: User does not have regional admin role for this region');
        }
      } else {
        console.log('RegionSpecificAuth: No existing session found');
      }
    } catch (error) {
      console.error('RegionSpecificAuth: Exception during session check:', error);
    }
  };

  const checkRegionalAdminRole = async (userId: string, regionId: string): Promise<boolean> => {
    try {
      console.log(`RegionSpecificAuth: Checking regional admin role for user ${userId} in region ${regionId}`);
      
      // Check if user has regional_admin role and belongs to this region
      const { data: userRoles, error: roleError } = await supabase
        .from('user_roles')
        .select('role, is_active, region_id')
        .eq('user_id', userId)
        .eq('role', 'regional_admin')
        .eq('status', 'active');

      if (roleError) {
        console.error('RegionSpecificAuth: Role check error:', roleError);
        return false;
      }

      // Check if user's profile belongs to this region
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('region_id')
        .eq('id', userId)
        .single();

      if (profileError) {
        console.error('RegionSpecificAuth: Profile check error:', profileError);
        return false;
      }

      const hasRole = userRoles && userRoles.length > 0;
      const belongsToRegion = profile?.region_id === regionId;

      console.log('RegionSpecificAuth: Role check result:', { hasRole, belongsToRegion, userRegion: profile?.region_id, targetRegion: regionId });
      return hasRole && belongsToRegion;
    } catch (error) {
      console.error('RegionSpecificAuth: Role check exception:', error);
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

    if (!region) {
      toast({
        title: "Region Error",
        description: "Invalid region. Please try again.",
        variant: "destructive"
      });
      return;
    }

    console.log(`RegionSpecificAuth: Starting sign in process for ${email} in region ${region.name}`);
    setIsLoading(true);

    try {
      // Step 1: Sign in with Supabase
      const { data: authData, error: signInError } = await supabase.auth.signInWithPassword({
        email: email.trim(),
        password: password
      });

      if (signInError) {
        console.error('RegionSpecificAuth: Sign in error:', signInError);
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
        console.error('RegionSpecificAuth: No user data received after sign in');
        toast({
          title: "Sign In Failed",
          description: "No user data received. Please try again.",
          variant: "destructive"
        });
        return;
      }

      console.log(`RegionSpecificAuth: Sign in successful for user ${authData.user.id} in region ${region.name}`);

      // Step 2: Check regional admin role for this specific region
      const hasRole = await checkRegionalAdminRole(authData.user.id, region.id);
      
      if (!hasRole) {
        console.log('RegionSpecificAuth: User lacks regional admin role for this region, signing out...');
        await supabase.auth.signOut();
        toast({
          title: "Access Denied",
          description: `Your account is either not approved for regional access to ${region.name} or you don't have regional admin permissions. Contact an administrator if this is incorrect.`,
          variant: "destructive"
        });
        return;
      }

      // Step 3: Success - redirect to dashboard
      console.log(`RegionSpecificAuth: Regional admin role verified for ${region.name}, redirecting to:`, from);
      
      toast({
        title: `Welcome to ${region.name}!`,
        description: "Successfully signed in to the regional portal."
      });

      setTimeout(() => {
        navigate(from, { replace: true });
      }, 500);

    } catch (error: any) {
      console.error('RegionSpecificAuth: Unexpected error during sign in:', error);
      toast({
        title: "Sign In Error",
        description: error.message || "An unexpected error occurred. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  if (regionLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-wca-teal/10 via-wca-teal/5 to-wca-purple/10 flex items-center justify-center p-4">
        <div className="flex items-center gap-2">
          <Loader2 className="w-6 h-6 animate-spin" />
          <span>Loading region...</span>
        </div>
      </div>
    );
  }

  if (regionError || !region) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-wca-teal/10 via-wca-teal/5 to-wca-purple/10 flex items-center justify-center p-4">
        <div className="w-full max-w-md">
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              Region not found. Please check the URL and try again.
            </AlertDescription>
          </Alert>
          <div className="text-center mt-4">
            <Button
              variant="outline"
              onClick={() => navigate('/auth/regional')}
            >
              Go to General Regional Login
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-wca-teal/10 via-wca-teal/5 to-wca-purple/10 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-grid-pattern opacity-5"></div>
      
      <div className="w-full max-w-md relative z-10">
        <div className="text-center mb-8">
          <div className="inline-flex items-center gap-3 mb-4">
            <div>
              <h1 className="text-3xl font-bold bg-gradient-to-r from-wca-teal to-wca-purple bg-clip-text text-transparent">
                {region.name}
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
              Welcome Back
            </CardTitle>
            <CardDescription>
              Sign in to {region.name} portal
            </CardDescription>
          </CardHeader>

          <CardContent>
            <form onSubmit={handleSignIn} className="space-y-4">

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
                <div className="text-right mt-1">
                  <Button
                    type="button"
                    variant="link"
                    className="text-xs text-wca-teal hover:text-wca-teal/80 p-0 h-auto"
                    onClick={() => navigate(`/auth/forgot-password?portal=regional&region=${regionSlug}`)}
                    disabled={isLoading}
                  >
                    Forgot your password?
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
                    <span>Signing In...</span>
                  </div>
                ) : (
                  <span>Sign In</span>
                )}
              </Button>
            </form>

            <div className="mt-6 text-center">
              <p className="text-sm text-muted-foreground">
                Need to register for {region.name} access?
              </p>
              <Button
                variant="link"
                className="text-wca-teal hover:text-wca-teal/80 font-medium p-0 h-auto"
                onClick={() => navigate(`/register/regions/${region.code.toLowerCase()}`)}
                disabled={isLoading}
              >
                Request access to {region.name}
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
                <Button
                  variant="outline"
                  size="sm"
                  className="flex-1 h-9"
                  onClick={() => navigate('/auth/regional')}
                  disabled={isLoading}
                >
                  <Users size={16} className="mr-1" />
                  General
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

export default RegionSpecificAuth;