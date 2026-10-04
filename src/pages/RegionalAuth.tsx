import React, { useState } from 'react';
import { useNavigate } from '@/lib/router-compat';
import { supabase } from '@/integrations/supabase/client';
import { Mail, Lock, Building2 } from 'lucide-react';
import { AuthShell, AuthField, AuthSubmit, AuthError, ForgotLink } from '@/components/auth/AuthShell';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useToast } from '@/hooks/use-toast';
import wcaLogo from '@/assets/wca-logo.png';
import { writeRegionalBootstrap } from '@/lib/regionalBootstrap';
import { writeCachedUser } from '@/lib/portalAuthCache';

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

      writeCachedUser(authData.user);

      // Best-effort: write a regional bootstrap so the regional shell can show
      // the region label without a round trip. Failures here are non-fatal —
      // we still navigate to the dashboard.
      try {
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
        if (regionId) {
          writeRegionalBootstrap({ userId, email: emailAddress, regionId });
        }
      } catch {
        // ignore — region context will hydrate later
      }

      navigate('/admin/regional/dashboard', { replace: true });
    } catch {
      setError('An unexpected error occurred. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthShell icon={Building2} badge="Regional Portal" title="Regional Administration" subtitle="Sign in to manage your region">
      <form onSubmit={handleLogin} className="space-y-4">
        <AuthError message={error} />
        <AuthField id="email" label="Email" icon={Mail} type="email" autoComplete="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@example.com" required disabled={loading} />
        <AuthField id="password" label="Password" icon={Lock} type="password" autoComplete="current-password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="Enter your password" required disabled={loading} action={<ForgotLink to="/auth/forgot-password?portal=regional" />} />
        <AuthSubmit loading={loading}>Sign In</AuthSubmit>
      </form>
    </AuthShell>
  );
};

export default RegionalAuth;
