import React, { useState } from 'react';
import { useNavigate } from '@/lib/router-compat';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Mail, Lock, UserRound } from 'lucide-react';
import { AuthShell, AuthField, AuthSubmit, AuthError, ForgotLink } from '@/components/auth/AuthShell';

import { useToast } from '@/hooks/use-toast';
import { Link } from '@/lib/router-compat';
import { writeCachedUser } from '@/lib/portalAuthCache';

/**
 * Isolated Member login page.
 *
 * Does NOT subscribe to AuthContext or run any redirect effects.
 * Submits credentials, then explicitly navigates on success.
 */
export default function MemberAuth() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const navigate = useNavigate();
  const { toast } = useToast();

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const { data, error: signInError } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (signInError) {
        setError(signInError.message);
        return;
      }

      if (data.user) {
        writeCachedUser(data.user);
        toast({
          title: 'Welcome back!',
          description: 'You have successfully signed in to your member portal.',
        });
        navigate('/member/dashboard', { replace: true });
      }
    } catch {
      setError('An unexpected error occurred. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthShell
      icon={UserRound}
      badge="Member Portal"
      title="Welcome back"
      subtitle="Sign in to your WCA member dashboard"
      footer={<><p>Don't have an account?</p><p className="mt-1">Contact your regional administrator to register as a member.</p></>}
    >
      <form onSubmit={handleSignIn} className="space-y-4">
        <AuthError message={error} />
        <AuthField id="email" label="Email" icon={Mail} type="email" autoComplete="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@example.com" required disabled={loading} />
        <AuthField id="password" label="Password" icon={Lock} type="password" autoComplete="current-password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="Enter your password" required disabled={loading} />
        <AuthSubmit loading={loading}>Sign In</AuthSubmit>
      </form>
    </AuthShell>
  );
}
