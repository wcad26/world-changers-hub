/**
 * Shared sticky portal auth cache utilities.
 *
 * The Lovable development preview emits transient null sessions and spurious
 * SIGNED_OUT events. We persist the last-known authenticated user so portals
 * can render immediately without bouncing the user back to login. Only an
 * explicit logout (via `markExplicitSignOut`) is allowed to clear this state.
 *
 * See mem://constraints/portal-session-guards-must-be-sticky.
 */

export const AUTH_USER_CACHE_KEY = 'wca-auth-last-user';
export const EXPLICIT_SIGNOUT_KEY = 'wca-explicit-signout';

export type CachedUser = { id: string; email: string | null; cachedAt: number };

export const readCachedUser = (): CachedUser | null => {
  if (typeof window === 'undefined') return null;
  try {
    const raw = window.localStorage.getItem(AUTH_USER_CACHE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    if (!parsed?.id) return null;
    return parsed;
  } catch {
    return null;
  }
};

export const writeCachedUser = (user: { id?: string | null; email?: string | null } | null) => {
  if (typeof window === 'undefined' || !user?.id) return;
  try {
    window.localStorage.setItem(
      AUTH_USER_CACHE_KEY,
      JSON.stringify({ id: user.id, email: user.email ?? null, cachedAt: Date.now() }),
    );
    // Clear any stale explicit-logout flag — we have a fresh authenticated user.
    window.localStorage.removeItem(EXPLICIT_SIGNOUT_KEY);
  } catch {
    // ignore storage failures
  }
};

export const clearCachedUser = () => {
  if (typeof window === 'undefined') return;
  try {
    window.localStorage.removeItem(AUTH_USER_CACHE_KEY);
  } catch {
    // ignore storage failures
  }
};

export const markExplicitSignOut = () => {
  if (typeof window === 'undefined') return;
  try {
    window.localStorage.setItem(EXPLICIT_SIGNOUT_KEY, String(Date.now()));
  } catch {
    // ignore storage failures
  }
};

/**
 * Consume the explicit-logout flag. Returns true if it was set within the
 * last 10s (i.e. the user really did just click Logout).
 */
export const consumeExplicitSignOutFlag = (): boolean => {
  if (typeof window === 'undefined') return false;
  try {
    const raw = window.localStorage.getItem(EXPLICIT_SIGNOUT_KEY);
    if (!raw) return false;
    window.localStorage.removeItem(EXPLICIT_SIGNOUT_KEY);
    const savedAt = Number(raw);
    return Number.isFinite(savedAt) && Date.now() - savedAt < 10000;
  } catch {
    return false;
  }
};
