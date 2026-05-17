import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Eye, EyeOff, Loader2, Shield } from 'lucide-react';
import { writeCachedUser } from '@/lib/portalAuthCache';

/**
 * Super Admin login.
 *
 * Self-contained: signs the user in, runs ONE check (does this user hold
 * the super_admin role?), and on success navigates to the dashboard.
 * No AuthContext subscriptions, no cross-portal links, no auto-redirects.
 */
const SuperAuth = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const navigate = useNavigate();
  const location = useLocation();
  const { toast } = useToast();

  const from = (location.state as any)?.from?.pathname || '/admin/super/dashboard';

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

      writeCachedUser(authData.user);
      toast({ title: 'Welcome back' });
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

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/10 via-background to-secondary/10 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center p-3 rounded-2xl bg-gradient-to-r from-primary to-primary/80 text-primary-foreground mb-4">
            <Shield size={28} />
          </div>
          <h1 className="text-3xl font-bold tracking-tight">Super Admin</h1>
          <p className="text-sm text-muted-foreground mt-1">Global administration portal</p>
        </div>

        <Card className="shadow-lg">
          <CardHeader>
            <CardTitle className="text-xl">Welcome back</CardTitle>
            <CardDescription>Sign in to access the super admin portal.</CardDescription>
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
                    onClick={() => navigate('/auth/forgot-password?portal=super')}
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
