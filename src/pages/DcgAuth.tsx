import React, { useState } from 'react';
import { useNavigate } from '@/lib/router-compat';
import { supabase } from '@/integrations/supabase/client';
import { Mail, Lock, UsersRound } from 'lucide-react';
import { AuthShell, AuthField, AuthSubmit, AuthError, ForgotLink } from '@/components/auth/AuthShell';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import wcaLogo from '@/assets/wca-logo.png';
import { writeCachedUser } from '@/lib/portalAuthCache';

/**
 * Isolated DCG portal login page.
 *
 * On successful sign-in, navigates inside the SPA so Lovable preview does not
 * perform a full reload while Supabase is still restoring the session.
 */
const DcgAuth = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (authError || !authData.user) {
        setError(authError?.message ?? 'Invalid credentials.');
        setLoading(false);
        return;
      }

      writeCachedUser(authData.user);
      navigate('/dcg/dashboard', { replace: true });
    } catch {
      setError('An unexpected error occurred. Please try again.');
      setLoading(false);
    }
  };

  return (
    <AuthShell icon={UsersRound} badge="DCG Portal" title="DCG Leadership" subtitle="Sign in to manage your Deeper Christian Group">
      <form onSubmit={handleLogin} className="space-y-4">
        <AuthError message={error} />
        <AuthField id="email" label="Email" icon={Mail} type="email" autoComplete="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@example.com" required disabled={loading} />
        <AuthField id="password" label="Password" icon={Lock} type="password" autoComplete="current-password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="Enter your password" required disabled={loading} action={<ForgotLink to="/auth/forgot-password?portal=dcg" />} />
        <AuthSubmit loading={loading}>Sign In</AuthSubmit>
      </form>
    </AuthShell>
  );
};

export default DcgAuth;
