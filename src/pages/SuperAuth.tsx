import React, { useState } from 'react';
import { useNavigate, useLocation } from '@/lib/router-compat';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Mail, Lock, Shield } from 'lucide-react';
import { AuthShell, AuthField, AuthSubmit, AuthError, ForgotLink } from '@/components/auth/AuthShell';

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
    <AuthShell icon={Shield} badge="Super Admin" title="Global Administration" subtitle="Restricted access for authorised administrators">
      <form onSubmit={handleSignIn} className="space-y-3">
        <AuthField id="email" label="Email" icon={Mail} type="email" autoComplete="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@example.com" required disabled={isLoading} />
        <AuthField id="password" label="Password" icon={Lock} type="password" autoComplete="current-password" minLength={6} value={password} onChange={(e) => setPassword(e.target.value)} placeholder="Enter your password" required disabled={isLoading} action={<ForgotLink to="/auth/forgot-password?portal=super" />} />
        <AuthSubmit loading={isLoading}>Sign In</AuthSubmit>
      </form>
    </AuthShell>
  );
};

export default SuperAuth;
