import React, { useEffect, useState } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { Loader2 } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';

/**
 * Simple guard for the DCG portal.
 *
 * One rule only:
 *   - Is there an active session whose user is associated with a DCG?
 *
 * Association can come from either:
 *   - an active row in `dcg_user_sessions` (the dcg_admin login link), or
 *   - a `dcg_members` row linked to a `members` profile owned by this user.
 *
 * No AuthContext subscriptions, no cross-portal logic, no role checks for
 * other portals. If the check passes the portal renders; otherwise the
 * visitor is sent to /dcg-auth to sign in.
 */
const DcgSessionRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
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

      // 1. Direct dcg_admin session row
      const { data: dcgSession } = await supabase
        .from('dcg_user_sessions')
        .select('id')
        .eq('user_id', userId)
        .eq('is_active', true)
        .limit(1)
        .maybeSingle();

      if (dcgSession) {
        if (!cancelled) setStatus('allowed');
        return;
      }

      // 2. Membership-based association (member belongs to a DCG)
      const { data: memberRows } = await supabase
        .from('members')
        .select('id')
        .eq('profile_id', userId);

      const memberIds = (memberRows ?? []).map((m) => m.id);
      if (memberIds.length > 0) {
        const { data: dcgMember } = await supabase
          .from('dcg_members')
          .select('id')
          .in('member_id', memberIds)
          .eq('is_active', true)
          .limit(1)
          .maybeSingle();

        if (dcgMember) {
          if (!cancelled) setStatus('allowed');
          return;
        }
      }

      if (!cancelled) setStatus('denied');
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
    return <Navigate to="/dcg-auth" state={{ from: location }} replace />;
  }

  return <>{children}</>;
};

export default DcgSessionRoute;
