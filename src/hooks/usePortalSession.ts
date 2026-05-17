import { useEffect, useRef, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import type { Session } from '@supabase/supabase-js';

/**
 * Shared portal session hook.
 *
 * Used by every portal guard (DCG, Member, Super Admin) so they all follow
 * the SAME conservative rules:
 *
 *  1. The "checking" state lasts until `supabase.auth.getSession()` has
 *     resolved at least once. We do NOT decide "anon" from a transient
 *     null INITIAL_SESSION event — that was the race that bounced freshly
 *     logged-in users back to the login page.
 *
 *  2. Once we have a session, we stay "authed" unless we receive an
 *     explicit `SIGNED_OUT` event. TOKEN_REFRESHED or USER_UPDATED events
 *     with a missing session are ignored.
 *
 *  3. If `getSession()` resolves with no session AND no later auth event
 *     restores one within a short grace window, we move to "anon".
 *     This keeps users on a loader instead of blanking + redirecting.
 */
export type PortalSessionStatus = 'checking' | 'authed' | 'anon';

export interface PortalSessionState {
  status: PortalSessionStatus;
  session: Session | null;
}

const GRACE_MS = 400;

export function usePortalSession(): PortalSessionState {
  const [state, setState] = useState<PortalSessionState>({
    status: 'checking',
    session: null,
  });
  const resolvedRef = useRef(false);
  const sessionRef = useRef<Session | null>(null);

  useEffect(() => {
    let cancelled = false;
    let graceTimer: ReturnType<typeof setTimeout> | null = null;

    const setAuthed = (session: Session) => {
      sessionRef.current = session;
      resolvedRef.current = true;
      if (graceTimer) { clearTimeout(graceTimer); graceTimer = null; }
      setState({ status: 'authed', session });
    };

    const setAnon = () => {
      sessionRef.current = null;
      resolvedRef.current = true;
      setState({ status: 'anon', session: null });
    };

    // Subscribe FIRST so we don't miss any event during getSession().
    const { data: sub } = supabase.auth.onAuthStateChange((event, session) => {
      if (cancelled) return;

      if (event === 'SIGNED_OUT') {
        setAnon();
        return;
      }

      if (session?.user) {
        setAuthed(session);
        return;
      }

      // For any other event with no session (INITIAL_SESSION null,
      // TOKEN_REFRESHED null, USER_UPDATED, etc.) — DO NOTHING. We let
      // getSession() decide, or wait for a real SIGNED_OUT.
    });

    void supabase.auth.getSession().then(({ data }) => {
      if (cancelled) return;
      const session = data.session ?? null;
      if (session?.user) {
        setAuthed(session);
      } else if (!sessionRef.current) {
        // No session restored, and no event has set one. Give the auth
        // listener a brief grace window in case INITIAL_SESSION arrives
        // late with a real user, then move to anon.
        graceTimer = setTimeout(() => {
          if (cancelled) return;
          if (!sessionRef.current) setAnon();
        }, GRACE_MS);
      }
    });

    return () => {
      cancelled = true;
      if (graceTimer) clearTimeout(graceTimer);
      sub?.subscription?.unsubscribe?.();
    };
  }, []);

  return state;
}
