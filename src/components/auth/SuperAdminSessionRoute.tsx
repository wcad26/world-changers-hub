import React, { useEffect, useState } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { Loader2 } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';

/**
 * Simple guard for the super admin portal.
 *
 * One rule only:
 *   - Is there an active session whose user holds the `super_admin` role?
 *
 * No AuthContext subscriptions, no cross-portal logic, no redirects to
 * other portals. If the check passes the portal renders; otherwise the
 * visitor is sent to /auth/super to sign in.
 */
const SuperAdminSessionRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [status, setStatus] = useState<'checking' | 'allowed' | 'denied'>('checking');
  const location = useLocation();

  useEffect(() => {
    let cancelled = false;

    const waitForSession = async () => {
      for (let i = 0; i < 8; i++) {
        const { data } = await supabase.auth.getSession();
        if (data.session?.user) return data.session;
        await new Promise((r) => setTimeout(r, 150));
      }
      const { data } = await supabase.auth.getSession();
      return data.session ?? null;
    };

    const check = async () => {
      const session = await waitForSession();
      const userId = session?.user?.id;

      if (!userId) {
        if (!cancelled) setStatus('denied');
        return;
      }

      const { data: roles } = await supabase
        .from('user_roles')
        .select('role')
        .eq('user_id', userId)
        .eq('role', 'super_admin')
        .eq('is_active', true)
        .limit(1);

      if (cancelled) return;
      setStatus(roles && roles.length > 0 ? 'allowed' : 'denied');
    };

    check();
    return () => {
      cancelled = true;
    };
  }, []);

  if (status === 'checking') {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (status === 'denied') {
    return <Navigate to="/auth/super" state={{ from: location }} replace />;
  }

  return <>{children}</>;
};

export default SuperAdminSessionRoute;
