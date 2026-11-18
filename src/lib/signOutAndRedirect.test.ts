// Bun provides this module at runtime; its types are not installed in this project.
// @ts-expect-error -- verified by running this file with `bun test`.
import { describe, expect, it } from 'bun:test';
import { signOutAndRedirect } from './signOutAndRedirect';

describe('signOutAndRedirect', () => {
  it('redirects immediately without waiting for sign-out to finish', async () => {
    const events: string[] = [];
    let finishSignOut!: () => void;
    const pendingSignOut = new Promise<void>((resolve) => {
      finishSignOut = resolve;
    });

    const task = signOutAndRedirect(
      () => {
        events.push('sign-out-started');
        return pendingSignOut;
      },
      () => events.push('redirected'),
    );

    expect(events).toEqual(['sign-out-started', 'redirected']);
    finishSignOut();
    await task;
  });

  it('still redirects when sign-out fails', async () => {
    let redirected = false;
    let reportedError: unknown = null;
    const failure = new Error('network unavailable');

    await signOutAndRedirect(
      () => Promise.reject(failure),
      () => {
        redirected = true;
      },
      (error) => {
        reportedError = error;
      },
    );

    expect(redirected).toBe(true);
    expect(reportedError).toBe(failure);
  });
});
