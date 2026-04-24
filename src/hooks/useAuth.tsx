import { useContext } from 'react';
import { AuthContext, type AuthContextValue } from '@/contexts/AuthContext';

/**
 * Single source of truth for accessing auth state.
 *
 * Lives in its own file (not in AuthContext.tsx) so the context module
 * exports ONLY components — that keeps React Fast Refresh happy and
 * prevents the preview from remounting the entire AuthProvider on
 * every hot update (which was a root cause of the failed reload sessions).
 */
export const useAuth = (): AuthContextValue => {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error('useAuth must be used within an <AuthProvider>');
  }
  return ctx;
};
