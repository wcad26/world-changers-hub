import { useEffect, useRef, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import type { Session } from '@supabase/supabase-js';
import { consumeExplicitSignOutFlag, readCachedUser, writeCachedUser } from '@/lib/portalAuthCache';

/**
 * Shared portal session hook — STICKY.
 *
 * Mirrors the rules in mem://constraints/portal-session-guards-must-be-sticky:
 *  - Once authed, stays authed unless the user explicitly clicks Logout.
 *  - Transient null INITIAL_SESSION / TOKEN_REFRESHED / spurious SIGNED_OUT
 *    events in the Lovable preview are ignored — they never flip status
 *    back to 'anon' or 'checking'.
 *  - If a cached user exists from a prior session, we start as 'authed' so
 *    portal pages render immediately without a blank/loader state.
 */
export type PortalSessionStatus = 'checking' | 'authed' | 'anon';

export interface PortalSessionState {
  status: PortalSessionStatus;
  session: Session | null;
}

export function usePortalSession(): PortalSessionState {
  const cached = readCachedUser();
  const [state, setState] = useState<PortalSessionState>({
    status: cached ? 'authed' : 'checking',
    session: null,
  });
  const sessionRef = useRef<Session | null>(null);

  useEffect(() => {
    let cancelled = false;

    const setAuthed = (session: Session) => {
      sessionRef.current = session;
      writeCachedUser(session.user);
      setState({ status: 'authed', session });
    };

    const { data: sub } = supabase.auth.onAuthStateChange((event, session) => {
      if (cancelled) return;

      if (event === 'SIGNED_OUT') {
        // Only honor explicit logout. Spurious preview SIGNED_OUT events are
        // ignored to avoid bouncing the user back to the login page.
        if (!consumeExplicitSignOutFlag()) return;
        sessionRef.current = null;
        setState({ status: 'anon', session: null });
        return;
      }

      if (session?.user) setAuthed(session);
      // Null session on any other event → DO NOTHING. Stay sticky.
    });

    void supabase.auth.getSession().then(({ data }) => {
      if (cancelled) return;
      if (data.session?.user) setAuthed(data.session);
      // No session and no cache → leave 'checking' (caller may render a loader).
      // We never auto-flip to 'anon' here; only explicit logout does that.
    });

    return () => {
      cancelled = true;
      sub?.subscription?.unsubscribe?.();
    };
  }, []);

  return state;
}
