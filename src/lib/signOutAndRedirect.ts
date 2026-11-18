type SignOut = () => Promise<void> | void;
type Redirect = () => void;
type ErrorHandler = (error: unknown) => void;

/**
 * Start local sign-out first, then redirect immediately. A slow or failed
 * network sign-out must never leave the user on the protected portal page.
 */
export const signOutAndRedirect = async (
  signOut: SignOut,
  redirect: Redirect,
  onError: ErrorHandler = (error) => console.error('[SignOut] error', error),
): Promise<void> => {
  let pendingSignOut: Promise<void>;

  try {
    // AuthProvider clears its user state and cached session before its first await.
    pendingSignOut = Promise.resolve(signOut());
  } catch (error) {
    onError(error);
    redirect();
    return;
  }

  redirect();

  try {
    await pendingSignOut;
  } catch (error) {
    onError(error);
  }
};
