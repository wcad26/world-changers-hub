import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Eye, EyeOff, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useAuth } from '@/hooks/useAuth';
import wcaLogo from '@/assets/wca-logo.png';

const DcgAuth = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const navigate = useNavigate();
  const auth = useAuth();
  const userId = auth.user?.id;
  const authReady = auth.initialized && !auth.loading;

  // Single source of truth for redirect after login.
  // Wait for the AuthContext to fully hydrate roles + DCG association,
  // then route based on access. NEVER force-signOut here — that creates
  // the login/logout loop.
  useEffect(() => {
    if (!authReady || !userId) return;

    try {
      if (sessionStorage.getItem('wca:just_signed_out')) return;
    } catch { /* ignore */ }

    if (auth.canAccessPortal('dcg')) {
      navigate('/dcg/dashboard', { replace: true });
    } else if (auth.hasRole('regional_admin')) {
      navigate('/admin/regional/dashboard', { replace: true });
    } else if (auth.hasRole('super_admin')) {
      navigate('/admin/super/dashboard', { replace: true });
    } else {
      // Authenticated but no DCG/admin access — show error and let them sign out.
      setError('Access denied. This portal is for authorized DCG users only.');
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [authReady, userId, auth.userDcg?.id, auth.userRoles.length]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const { error: authError } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (authError) {
        setError(authError.message);
        return;
      }
      // Redirect handled entirely by the auth-ready effect once
      // AuthContext has hydrated roles + DCG association.
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
          <CardTitle className="text-2xl font-bold text-center">DCG Portal</CardTitle>
          <CardDescription className="text-center">
            Sign in to your DCG management portal
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
                  onClick={() => navigate('/auth/forgot-password?portal=dcg')}
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
            <Button
              type="button"
              variant="outline"
              className="w-full"
              onClick={() => navigate('/auth/regional')}
              disabled={loading}
            >
              ← Back to Regional Login
            </Button>
          </CardFooter>
        </form>
      </Card>
    </div>
  );
};

export default DcgAuth;
