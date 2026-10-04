import { useEffect, useState } from "react";
import { useNavigate } from "@/lib/router-compat";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Loader2, ScanLine, Mail, Lock } from "lucide-react";
import { AuthShell, AuthField, AuthSubmit, AuthError, ForgotLink } from '@/components/auth/AuthShell';


async function userHasAttendanceAccess(userId: string): Promise<boolean> {
  const [{ data: superRoles }, { data: regionalRoles }] = await Promise.all([
    supabase
      .from("user_roles")
      .select("id")
      .eq("user_id", userId)
      .eq("role", "super_admin")
      .eq("is_active", true)
      .limit(1),
    supabase
      .from("regional_user_roles")
      .select("id")
      .eq("user_id", userId)
      .eq("is_active", true)
      .limit(1),
  ]);
  return (superRoles?.length ?? 0) > 0 || (regionalRoles?.length ?? 0) > 0;
}

export default function AttendanceLogin() {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [checking, setChecking] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Auto-redirect if already signed in with access.
  useEffect(() => {
    let cancelled = false;
    (async () => {
      const { data } = await supabase.auth.getSession();
      const uid = data.session?.user?.id;
      if (uid && (await userHasAttendanceAccess(uid))) {
        if (!cancelled) navigate("/attendance/scan", { replace: true });
        return;
      }
      if (!cancelled) setChecking(false);
    })();
    return () => {
      cancelled = true;
    };
  }, [navigate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSubmitting(true);
    try {
      const { data, error: signInError } = await supabase.auth.signInWithPassword({
        email: email.trim(),
        password,
      });
      if (signInError || !data.user) {
        setError(signInError?.message || "Invalid email or password.");
        return;
      }
      const allowed = await userHasAttendanceAccess(data.user.id);
      if (!allowed) {
        await supabase.auth.signOut({ scope: "local" });
        setError(
          "Your account doesn't have attendance access. Ask an admin to grant you a Super Admin or Regional Admin role.",
        );
        return;
      }
      navigate("/attendance/scan", { replace: true });
    } catch (err: any) {
      setError(err?.message || "Something went wrong. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  if (checking) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <AuthShell icon={ScanLine} badge="Attendance" title="Welcome back" subtitle="Use your admin credentials to record attendance" footer={<p className="text-xs">Access requires an active Super Admin or Regional Admin role.</p>}>
      <form onSubmit={handleSubmit} className="space-y-3">
        <AuthError message={error} />
        <AuthField id="email" label="Email" icon={Mail} type="email" inputMode="email" autoComplete="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@example.com" required />
        <AuthField id="password" label="Password" icon={Lock} type="password" autoComplete="current-password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="Enter your password" required />
        <AuthSubmit loading={submitting}>Sign in to scan</AuthSubmit>
      </form>
    </AuthShell>
  );
}
