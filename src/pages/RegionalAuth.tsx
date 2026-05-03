import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Eye, EyeOff, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useToast } from '@/hooks/use-toast';
import wcaLogo from '@/assets/wca-logo.png';
import { writeRegionalBootstrap } from '@/lib/regionalBootstrap';

/**
 * Single regional portal login page.
 *
 * Sign in, wait briefly for the session to be persisted, then navigate to the
 * regional dashboard. No role checks, no region checks, no signOut on failure.
 * RLS handles real access control inside the portal.
 */
const RegionalAuth = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const navigate = useNavigate();
  const { toast } = useToast();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
        email: email.trim(),
        password,
      });

      if (authError || !authData.user) {
        setError(authError?.message ?? 'Invalid credentials.');
        return;
      }

      const userId = authData.user.id;
      const emailAddress = authData.user.email ?? email.trim();

      const { data: profile } = await supabase
        .from('profiles')
        .select('id, region_id')
        .eq('id', userId)
        .maybeSingle();

      let regionId = profile?.region_id ?? null;

      if (!regionId) {
        const { data: member } = await supabase
          .from('members')
          .select('region_id')
          .eq('profile_id', userId)
          .not('region_id', 'is', null)
          .limit(1)
          .maybeSingle();
        regionId = member?.region_id ?? null;
      }

      if (!regionId) {
        setError('Your account is signed in, but it is not linked to a region yet. Please contact WCA support.');
        return;
      }

      writeRegionalBootstrap({ userId, email: emailAddress, regionId });

      navigate('/admin/regional/dashboard', { replace: true });
    } catch {
      setError('An unexpected error occurred. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-primary/20 via-background to-secondary/20 p-4">
      <img
        src={wcaLogo}
        alt="World Changers Association logo"
        className="w-full max-w-xs md:max-w-sm h-auto mb-6 object-contain"
      />
      <Card className="w-full max-w-md">
        <CardHeader className="space-y-4">
          <CardTitle className="text-2xl font-bold text-center">Regional Portal</CardTitle>
          <CardDescription className="text-center">
            Sign in to your regional admin portal
          </CardDescription>
        </CardHeader>
        <form onSubmit={handleLogin}>
          <CardContent className="space-y-4">
            {error && (
              <Alert variant="destructive">
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                disabled={loading}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <div className="relative">
                <Input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  disabled={loading}
                  className="pr-10"
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="absolute right-2 top-1/2 -translate-y-1/2 h-7 w-7 text-muted-foreground hover:text-foreground"
                  onClick={() => setShowPassword(!showPassword)}
                  disabled={loading}
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                >
                  {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </Button>
              </div>
              <div className="text-right mt-1">
                <Button
                  type="button"
                  variant="link"
                  className="text-xs text-primary hover:text-primary/80 p-0 h-auto"
                  onClick={() => navigate('/auth/forgot-password?portal=regional')}
                  disabled={loading}
                >
                  Forgot your password?
                </Button>
              </div>
            </div>
          </CardContent>
          <CardFooter className="flex-col gap-3">
            <Button type="submit" className="w-full" disabled={loading}>
              {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Sign In
            </Button>
          </CardFooter>
        </form>
      </Card>
    </div>
  );
};

export default RegionalAuth;
