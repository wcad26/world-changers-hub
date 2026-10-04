import React, { useState } from 'react';
import { useNavigate } from '@/lib/router-compat';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Mail, Lock, UserRound, MapPin, ChevronRight, Loader2 } from 'lucide-react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { useRegions } from '@/hooks/useRegions';
import { generateSlug } from '@/utils/slugUtils';
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
  const [signupOpen, setSignupOpen] = useState(false);
  const { data: regions = [], isLoading: regionsLoading } = useRegions();

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
      footer={<p>Don't have an account?{' '}<button type="button" onClick={() => setSignupOpen(true)} className="font-semibold text-primary hover:underline">Sign up</button></p>}
    >
      <form onSubmit={handleSignIn} className="space-y-3">
        <AuthError message={error} />
        <AuthField id="email" label="Email" icon={Mail} type="email" autoComplete="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@example.com" required disabled={loading} />
        <AuthField id="password" label="Password" icon={Lock} type="password" autoComplete="current-password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="Enter your password" required disabled={loading} />
        <AuthSubmit loading={loading}>Sign In</AuthSubmit>
      </form>
      <Dialog open={signupOpen} onOpenChange={setSignupOpen}>
        <DialogContent className="max-h-[85vh] w-[calc(100%-2rem)] overflow-y-auto overflow-x-hidden rounded-3xl sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>Choose your region</DialogTitle>
            <DialogDescription>Select the WCA region you attend to start your registration.</DialogDescription>
          </DialogHeader>
          <div className="grid min-w-0 grid-cols-1 gap-3 sm:grid-cols-2">
            {regionsLoading && <div className="col-span-full flex justify-center py-6"><Loader2 className="h-5 w-5 animate-spin text-muted-foreground" /></div>}
            {regions.map((r) => (
              <button
                key={r.id}
                type="button"
                onClick={() => { setSignupOpen(false); navigate(`/visitor/register/${generateSlug(r.name)}`); }}
                className="group flex w-full min-w-0 items-center gap-3 rounded-2xl border border-border/60 bg-card/70 p-4 text-left transition-all hover:-translate-y-0.5 hover:border-primary/50 hover:shadow-lg hover:shadow-primary/10"
              >
                <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-primary to-secondary text-primary-foreground"><MapPin className="h-5 w-5" /></span>
                <span className="min-w-0 flex-1">
                  <span className="block truncate font-semibold">{r.name.trim()}</span>
                  {r.address && <span className="block truncate text-xs text-muted-foreground">{r.address}</span>}
                </span>
                <ChevronRight className="h-4 w-4 text-muted-foreground transition-transform group-hover:translate-x-0.5 group-hover:text-primary" />
              </button>
            ))}
          </div>
        </DialogContent>
      </Dialog>
    </AuthShell>
  );
}
