import React, { useState } from 'react';
import { useNavigate } from '@/lib/router-compat';
import { supabase } from '@/integrations/supabase/client';
import { Mail, Lock, UsersRound } from 'lucide-react';
import { AuthShell, AuthField, AuthSubmit, AuthError, ForgotLink } from '@/components/auth/AuthShell';

import { clearCachedUser, markExplicitSignOut, writeCachedUser } from '@/lib/portalAuthCache';
import { evaluateDcgLeadership } from '@/lib/dcgLeadership';

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

  const rejectLogin = async (message: string) => {
    // Do not leave a valid Supabase session or sticky portal cache behind when
    // the account is not a DCG Leader or Assistant.
    markExplicitSignOut();
    clearCachedUser();
    try {
      await supabase.auth.signOut({ scope: 'local' });
    } catch {
      // Access is still denied even if remote sign-out fails.
    }
    setError(message);
    setLoading(false);
  };

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

      const leadershipAccess = evaluateDcgLeadership(
        await supabase.rpc('get_user_dcg', { _user_id: authData.user.id }),
      );

      if (!leadershipAccess.allowed) {
        await rejectLogin(
          leadershipAccess.reason === 'verification_failed'
            ? 'We could not verify your DCG leadership role. Please try again.'
            : 'Access is restricted to active DCG Leaders and Assistants. Please use the Member Portal.',
        );
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
    <AuthShell icon={UsersRound} badge="DCG Portal" title="Welcome back" subtitle="Sign in to manage your DCG">
      <form onSubmit={handleLogin} className="space-y-3">
        <AuthError message={error} />
        <AuthField id="email" label="Email" icon={Mail} type="email" autoComplete="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@example.com" required disabled={loading} />
        <AuthField id="password" label="Password" icon={Lock} type="password" autoComplete="current-password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="Enter your password" required disabled={loading} action={<ForgotLink to="/auth/forgot-password?portal=dcg" />} />
        <AuthSubmit loading={loading}>Sign In</AuthSubmit>
      </form>
    </AuthShell>
  );
};

export default DcgAuth;
