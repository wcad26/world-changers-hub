import React, { useState } from 'react';
import { useNavigate, useLocation, useParams } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useRegionBySlug } from '@/hooks/useRegionBySlug';
import { Eye, EyeOff, Loader2, AlertCircle, Users } from 'lucide-react';

/**
 * Regional portal login page.
 *
 * Self-contained: no AuthContext subscriptions, no auto-redirect effects,
 * no cross-portal links. Signs the user in, performs a one-shot role check
 * scoped to this region, then navigates to the regional dashboard.
 */
const RegionSpecificAuth = () => {
  const { regionSlug } = useParams<{ regionSlug: string }>();
  const { data: region, isLoading: regionLoading, error: regionError } = useRegionBySlug(regionSlug);

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const navigate = useNavigate();
  const location = useLocation();
  const { toast } = useToast();

  const from = (location.state as any)?.from?.pathname || '/admin/regional/dashboard';

  const checkRegionalAccess = async (userId: string, regionId: string): Promise<boolean> => {
    try {
      const { data: profile } = await supabase
        .from('profiles')
        .select('region_id')
        .eq('id', userId)
        .single();

      if (profile?.region_id !== regionId) return false;

      const { data: roles } = await supabase
        .from('user_roles')
        .select('role')
        .eq('user_id', userId)
        .in('role', ['super_admin', 'regional_admin'])
        .eq('is_active', true);

      if (roles && roles.length > 0) return true;

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
        title: 'Missing information',
        description: 'Please enter both email and password.',
        variant: 'destructive',
      });
      return;
    }

    if (!region) {
      toast({ title: 'Region error', description: 'Invalid region. Please try again.', variant: 'destructive' });
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
          message = 'Invalid email or password.';
        } else if (signInError.message.includes('Email not confirmed')) {
          message = 'Please confirm your email before signing in.';
        } else if (signInError.message.includes('Too many requests')) {
          message = 'Too many attempts. Please wait a moment and try again.';
        }
        toast({ title: 'Sign in failed', description: message, variant: 'destructive' });
        return;
      }

      if (!authData.user) {
        toast({ title: 'Sign in failed', description: 'No user data received.', variant: 'destructive' });
        return;
      }

      const allowed = await checkRegionalAccess(authData.user.id, region.id);

      if (!allowed) {
        toast({
          title: 'Access denied',
          description: `Your account is not approved for ${region.name}.`,
          variant: 'destructive',
        });
        return;
      }

      toast({ title: `Welcome to ${region.name}` });
      navigate(from, { replace: true });
    } catch (error: any) {
      toast({
        title: 'Sign in error',
        description: error?.message || 'An unexpected error occurred.',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  if (regionLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-primary/10 via-background to-secondary/10 flex items-center justify-center p-4">
        <div className="flex items-center gap-2 text-muted-foreground">
          <Loader2 className="w-5 h-5 animate-spin" />
          <span>Loading region…</span>
        </div>
      </div>
    );
  }

  if (regionError || !region) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-primary/10 via-background to-secondary/10 flex items-center justify-center p-4">
        <div className="w-full max-w-md space-y-4">
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>Region not found. Please check the URL and try again.</AlertDescription>
          </Alert>
          <div className="text-center">
            <Button variant="outline" onClick={() => navigate('/auth/regional')}>
              Choose a region
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/10 via-background to-secondary/10 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center p-3 rounded-2xl bg-gradient-to-r from-primary to-primary/80 text-primary-foreground mb-4">
            <Users size={28} />
          </div>
          <h1 className="text-3xl font-bold tracking-tight">{region.name}</h1>
          <p className="text-sm text-muted-foreground mt-1">Regional portal login</p>
        </div>

        <Card className="shadow-lg">
          <CardHeader>
            <CardTitle className="text-xl">Welcome back</CardTitle>
            <CardDescription>Sign in to access the {region.name} portal.</CardDescription>
          </CardHeader>

          <CardContent>
            <form onSubmit={handleSignIn} className="space-y-4">
              <div className="space-y-1">
                <label htmlFor="email" className="text-sm font-medium">Email</label>
                <Input
                  id="email"
                  type="email"
                  placeholder="you@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  disabled={isLoading}
                  required
                />
              </div>

              <div className="space-y-1">
                <label htmlFor="password" className="text-sm font-medium">Password</label>
                <div className="relative">
                  <Input
                    id="password"
                    type={showPassword ? 'text' : 'password'}
                    placeholder="Enter your password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    disabled={isLoading}
                    required
                    minLength={6}
                    className="pr-10"
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="absolute right-1 top-1/2 -translate-y-1/2 h-7 w-7 text-muted-foreground"
                    onClick={() => setShowPassword((s) => !s)}
                    disabled={isLoading}
                  >
                    {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                  </Button>
                </div>
                <div className="text-right">
                  <Button
                    type="button"
                    variant="link"
                    className="text-xs p-0 h-auto"
                    onClick={() => navigate(`/auth/forgot-password?portal=regional&region=${regionSlug}`)}
                    disabled={isLoading}
                  >
                    Forgot your password?
                  </Button>
                </div>
              </div>

              <Button type="submit" className="w-full h-11" disabled={isLoading}>
                {isLoading ? (
                  <span className="flex items-center gap-2">
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Signing in…
                  </span>
                ) : (
                  'Sign in'
                )}
              </Button>
            </form>
          </CardContent>
        </Card>

        <div className="text-center mt-6 space-x-2">
          <Button
            variant="ghost"
            className="text-muted-foreground hover:text-foreground"
            onClick={() => navigate('/auth/regional')}
            disabled={isLoading}
          >
            ← Choose another region
          </Button>
        </div>
      </div>
    </div>
  );
};

export default RegionSpecificAuth;
