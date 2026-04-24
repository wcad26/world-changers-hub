import React, { useState } from 'react';
import { useNavigate, useLocation, useParams } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Eye, EyeOff, Loader2, AlertCircle } from 'lucide-react';
import { useRegionBySlug } from '@/hooks/useRegionBySlug';
import { Alert, AlertDescription } from '@/components/ui/alert';

/**
 * Isolated Regional portal login page.
 *
 * No AuthContext subscriptions. No effect-driven auto-redirects.
 * On success: explicit one-shot role check, then navigate.
 * No cross-portal navigation buttons (each portal stands alone).
 */
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

  const checkRegionalAdminRole = async (userId: string, regionId: string): Promise<boolean> => {
    try {
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('region_id')
        .eq('id', userId)
        .single();

      if (profileError) return false;
      if (profile?.region_id !== regionId) return false;

      const { data: userRoles } = await supabase
        .from('user_roles')
        .select('role')
        .eq('user_id', userId)
        .in('role', ['super_admin', 'regional_admin'])
        .eq('is_active', true);

      if (userRoles && userRoles.length > 0) return true;

      const { data: regionalRoles } = await supabase
        .from('regional_user_roles')
        .select('id')
        .eq('user_id', userId)
        .eq('region_id', regionId)
        .eq('is_active', true)
        .limit(1);

      return !!(regionalRoles && regionalRoles.length > 0);
    } catch {
      return false;
    }
  };

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!email || !password) {
      toast({
        title: 'Missing Information',
        description: 'Please enter both email and password.',
        variant: 'destructive',
      });
      return;
    }

    if (!region) {
      toast({ title: 'Region Error', description: 'Invalid region. Please try again.', variant: 'destructive' });
      return;
    }

    setIsLoading(true);

    try {
      const { data: authData, error: signInError } = await supabase.auth.signInWithPassword({
        email: email.trim(),
        password,
      });

      if (signInError) {
        let message = 'Sign in failed. Please try again.';
        if (signInError.message.includes('Invalid login credentials')) {
          message = 'Invalid email or password. Please check your credentials.';
        } else if (signInError.message.includes('Email not confirmed')) {
          message = 'Please check your email and confirm your account first.';
        } else if (signInError.message.includes('Too many requests')) {
          message = 'Too many login attempts. Please wait a moment and try again.';
        }
        toast({ title: 'Sign In Failed', description: message, variant: 'destructive' });
        return;
      }

      if (!authData.user) {
        toast({
          title: 'Sign In Failed',
          description: 'No user data received. Please try again.',
          variant: 'destructive',
        });
        return;
      }

      const allowed = await checkRegionalAdminRole(authData.user.id, region.id);

      if (!allowed) {
        // Soft denial. No global signOut — that re-triggers competing auth events.
        toast({
          title: 'Access Denied',
          description: `Your account is not approved for regional access to ${region.name}.`,
          variant: 'destructive',
        });
        return;
      }

      toast({ title: `Welcome to ${region.name}!`, description: 'Signed in to the regional portal.' });
      navigate(from, { replace: true });
    } catch (error: any) {
      toast({
        title: 'Sign In Error',
        description: error?.message || 'An unexpected error occurred. Please try again.',
        variant: 'destructive',
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
            <AlertDescription>Region not found. Please check the URL and try again.</AlertDescription>
          </Alert>
          <div className="text-center mt-4">
            <Button variant="outline" onClick={() => navigate('/auth/regional')}>
              Go to Regional Selection
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
              <p className="text-sm text-muted-foreground">Regional Portal</p>
            </div>
          </div>
        </div>

        <Card className="backdrop-blur-sm bg-white/80 border-white/20 shadow-2xl">
          <CardHeader className="text-center space-y-2">
            <CardTitle className="text-2xl font-semibold">Welcome Back</CardTitle>
            <CardDescription>Sign in to {region.name} portal</CardDescription>
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
